// Melhoria no endpoint de reenvio de vendas
// Esse arquivo contém melhorias para a rota PUT /api/sales/:id/resend
// que são necessárias para bloquear alterações financeiras quando o departamento financeiro já começou a análise

/**
 * Código melhorado para a rota PUT /api/sales/:id/resend
 */
export const improvedResubmitRoute = `
  // Rota para reenviar vendas que foram devolvidas (corrigidas)
  app.put("/api/sales/:id/resend", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      
      console.log(\`🔍 Processando reenvio da venda #\${id}\`);
      
      // Verificar se a venda existe e está com status "returned"
      const { pool } = await import('./db');
      const saleResult = await pool.query(
        "SELECT * FROM sales WHERE id = $1",
        [id]
      );
      
      if (saleResult.rows.length === 0) {
        return res.status(404).json({ error: "Venda não encontrada" });
      }
      
      const sale = saleResult.rows[0];
      
      // Verificar se o usuário tem permissão para reenviar esta venda
      // Administradores, supervisores ou o vendedor original podem reenviar
      if (req.user?.role !== 'admin' && req.user?.role !== 'supervisor' && 
          !(req.user?.role === 'vendedor' && sale.seller_id === req.user?.id)) {
        return res.status(403).json({ error: "Sem permissão para reenviar esta venda" });
      }
      
      // Verificar se a venda realmente está com status "returned"
      if (sale.status !== 'returned') {
        return res.status(400).json({ error: "Apenas vendas devolvidas podem ser reenviadas" });
      }
      
      // Obter dados do corpo da requisição
      const { 
        correctionNotes,
        items = [],
        serviceTypeId,
        serviceProviderId,
        paymentMethodId,
        installments,
        totalAmount,
        preserveFinancialData,
        installmentDates = []
      } = req.body;
      
      // Verificar se foram informadas as observações de correção
      if (!correctionNotes || correctionNotes.trim() === '') {
        return res.status(400).json({ error: "Observações de correção são obrigatórias" });
      }
      
      // MELHORIA CRÍTICA: Verificar se o financeiro já iniciou análise desta venda
      // e garantir que dados financeiros não sejam alterados
      const financialStatus = sale.financial_status;
      const blockFinancialChanges = financialStatus && 
                                   financialStatus !== 'pending' && 
                                   financialStatus !== '';
      
      // Log detalhado para diagnóstico
      console.log(\`🔍 Verificação financeira para venda #\${id}:\`);
      console.log(\`🔍 Status financeiro atual: \${financialStatus || 'não definido'}\`);
      console.log(\`🔍 Bloqueio de alterações financeiras: \${blockFinancialChanges ? 'SIM' : 'NÃO'}\`);
      console.log(\`🔍 Flag preserveFinancialData recebida: \${preserveFinancialData ? 'SIM' : 'NÃO'}\`);
      
      // CONTROLE DUPLO: Se o financeiro já iniciou análise, verificamos se o cliente está tentando
      // modificar dados financeiros e geramos erro se necessário
      if (blockFinancialChanges) {
        // Se o cliente NÃO enviou a flag preserveFinancialData=true, retornamos erro
        if (!preserveFinancialData) {
          console.error(\`❌ TENTATIVA DE MODIFICAR DADOS FINANCEIROS EM VENDA #\${id} QUE JÁ ESTÁ EM ANÁLISE FINANCEIRA!\`);
          return res.status(403).json({ 
            error: "Bloqueio de segurança financeira", 
            message: "Esta venda já está em análise pelo departamento financeiro. Dados financeiros não podem ser modificados."
          });
        }
        
        // Logs para diagnóstico
        console.log(\`✅ Cliente enviou flag preserveFinancialData=true, verificando consistência...\`);
        
        // Verificar se o valor total está sendo preservado
        if (totalAmount && parseFloat(totalAmount.toString()) !== parseFloat(sale.total_amount)) {
          console.error(\`❌ BLOQUEIO: Cliente tentou alterar valor total de \${sale.total_amount} para \${totalAmount}\`);
          return res.status(403).json({
            error: "Modificação financeira bloqueada",
            message: "Não é possível alterar o valor total desta venda pois ela já está em análise financeira."
          });
        }
        
        // Verificar se o número de parcelas está sendo preservado
        if (installments && parseInt(installments.toString()) !== sale.installments) {
          console.error(\`❌ BLOQUEIO: Cliente tentou alterar número de parcelas de \${sale.installments} para \${installments}\`);
          return res.status(403).json({
            error: "Modificação financeira bloqueada",
            message: "Não é possível alterar o número de parcelas desta venda pois ela já está em análise financeira."
          });
        }
        
        console.log(\`✅ Verificação financeira concluída: dados financeiros preservados\`);
      }
      
      // Atualizar os campos da venda que podem ser alterados
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;
      
      // Status sempre é atualizado para 'corrected'
      updateFields.push(\`status = 'corrected'\`);
      
      // Remover o motivo da devolução
      updateFields.push(\`return_reason = NULL\`);
      
      // Atualizar as observações com as correções
      updateFields.push(\`notes = CASE 
        WHEN notes IS NULL OR notes = '' THEN $\${paramCounter}
        ELSE notes || ' | CORREÇÃO: ' || $\${paramCounter}
      END\`);
      updateValues.push(correctionNotes);
      paramCounter++;
      
      // Atualizar tipo de serviço se fornecido
      if (serviceTypeId !== undefined) {
        updateFields.push(\`service_type_id = $\${paramCounter}\`);
        updateValues.push(serviceTypeId);
        paramCounter++;
      }
      
      // Atualizar prestador de serviço se fornecido
      if (serviceProviderId !== undefined) {
        updateFields.push(\`service_provider_id = $\${paramCounter}\`);
        updateValues.push(serviceProviderId);
        paramCounter++;
      }
      
      // Atualizar método de pagamento se fornecido
      if (paymentMethodId !== undefined) {
        updateFields.push(\`payment_method_id = $\${paramCounter}\`);
        updateValues.push(paymentMethodId);
        paramCounter++;
      }
      
      // Atualizar valor total se fornecido - APENAS se não houver bloqueio financeiro
      if (totalAmount !== undefined && !blockFinancialChanges) {
        // Formatar o valor
        const formattedTotal = typeof totalAmount === 'string' 
          ? totalAmount.replace(',', '.') 
          : String(totalAmount);
        
        updateFields.push(\`total_amount = $\${paramCounter}\`);
        updateValues.push(formattedTotal);
        paramCounter++;
        
        console.log(\`📊 Atualizando valor total para \${formattedTotal}\`);
      }
      
      // Atualizar número de parcelas se fornecido - APENAS se não houver bloqueio financeiro
      if (installments !== undefined && !blockFinancialChanges) {
        updateFields.push(\`installments = $\${paramCounter}\`);
        updateValues.push(installments);
        paramCounter++;
        
        console.log(\`📊 Atualizando número de parcelas para \${installments}\`);
      }
      
      // Sempre atualizar o timestamp
      updateFields.push(\`updated_at = NOW()\`);
      
      // Construir a query SQL
      const updateQuery = \`
        UPDATE sales 
        SET \${updateFields.join(', ')}
        WHERE id = $\${paramCounter}
        RETURNING *
      \`;
      
      // Adicionar o ID da venda como último parâmetro
      updateValues.push(id);
      
      console.log(\`🔄 Executando atualização da venda #\${id}\`);
      const updateResult = await pool.query(updateQuery, updateValues);
      
      if (updateResult.rows.length === 0) {
        return res.status(500).json({ error: "Falha ao atualizar a venda" });
      }
      
      console.log(\`✅ Venda #\${id} atualizada com sucesso\`);
      
      // Atualizar os itens da venda
      if (items && items.length > 0) {
        console.log(\`🔄 Processando \${items.length} itens para venda #\${id}\`);
        
        try {
          // Excluir os itens existentes
          await pool.query("DELETE FROM sale_items WHERE sale_id = $1", [id]);
          console.log(\`🗑️ Itens anteriores da venda #\${id} excluídos\`);
          
          // Inserir os novos itens
          for (const item of items) {
            const { serviceId, quantity, notes, price } = item;
            
            await pool.query(
              \`INSERT INTO sale_items (sale_id, service_id, quantity, notes, price, created_at, updated_at)
               VALUES ($1, $2, $3, $4, $5, NOW(), NOW())\`,
              [id, serviceId, quantity, notes, price]
            );
          }
          
          console.log(\`✅ \${items.length} novos itens inseridos para venda #\${id}\`);
        } catch (itemError) {
          console.error(\`❌ Erro ao atualizar itens da venda #\${id}:\`, itemError);
          // Não interrompemos o fluxo aqui, apenas logamos o erro
        }
      }
      
      // Atualizar as parcelas da venda
      try {
        let installmentsToCreate = 1;
        let saleAmount = sale.total_amount;
        
        // Se temos novos dados financeiros, usamos eles
        if (!blockFinancialChanges) {
          installmentsToCreate = installments || sale.installments || 1;
          saleAmount = totalAmount || sale.total_amount;
        } else {
          installmentsToCreate = sale.installments || 1;
          saleAmount = sale.total_amount;
        }
        
        console.log(\`🔄 Processando parcelas para venda #\${id}: \${installmentsToCreate} parcelas, valor \${saleAmount}\`);
        
        // Verificar se temos datas de vencimento específicas
        let dueDates: string[] | undefined = undefined;
        
        // CONTROLE CRÍTICO: Se financeiro já está analisando, devemos usar as datas existentes das parcelas
        if (blockFinancialChanges) {
          console.log(\`🔒 Financeiro já em análise: buscando datas originais das parcelas\`);
          
          const installmentsResult = await pool.query(
            \`SELECT due_date FROM sale_installments WHERE sale_id = $1 ORDER BY installment_number\`,
            [id]
          );
          
          if (installmentsResult.rows.length > 0) {
            dueDates = installmentsResult.rows.map(row => {
              let dueDate = row.due_date;
              if (typeof dueDate === 'string' && dueDate.includes('T')) {
                dueDate = dueDate.split('T')[0];
              }
              return dueDate;
            });
            
            console.log(\`📅 Preservando datas existentes para parcelas de venda #\${id}:\`, dueDates);
          }
        } 
        // Se não há bloqueio financeiro e foram fornecidas datas específicas, usamos elas
        else if (installmentDates && installmentDates.length > 0) {
          dueDates = installmentDates;
          console.log(\`📅 Usando datas específicas fornecidas pelo cliente para venda #\${id}:\`, dueDates);
        }
        
        // Usar nossa função auxiliar para garantir que as parcelas sejam criadas consistentemente
        await ensureSaleInstallments(id, installmentsToCreate, saleAmount, dueDates);
      } catch (error) {
        console.error(\`❌ Erro ao atualizar parcelas da venda #\${id}:\`, error);
        // Não interrompemos o fluxo aqui, apenas logamos o erro
      }
      
      // Registrar a ação no log
      console.log(\`🔄 Venda #\${id} reenviada após correção por \${req.user?.username}\`);
      
      // Notificar todos os clientes sobre a atualização da venda
      notifySalesUpdate();
      
      return res.json({
        ...updateResult.rows[0],
        message: "Venda corrigida e reenviada com sucesso"
      });
    } catch (error) {
      console.error("Erro ao reenviar venda:", error);
      return res.status(500).json({ error: "Erro interno do servidor" });
    }
  });
`;