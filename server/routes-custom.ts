// Implementação das novas rotas para lidar com datas exatas nas parcelas
import { Express, Request, Response } from "express";
import { db } from "./db";
import { pool } from "./db";

export function registerCustomRoutes(app: Express) {
  // Rota de diagnóstico para verificar como as datas estão sendo armazenadas no banco
  app.get("/api/debug/installments-dates", async (req, res) => {
    try {
      // Verificar a estrutura da tabela
      const tableSchema = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'sale_installments'
        ORDER BY ordinal_position
      `);
      
      // Buscar alguns exemplos de parcelas para verificar o formato das datas
      const installmentsResult = await pool.query(`
        SELECT id, saleId, installmentNumber, 
               dueDate, 
               TO_CHAR(dueDate::date, 'YYYY-MM-DD') as dueDate_formatted,
               amount, status, notes, createdAt
        FROM sale_installments
        LIMIT 10
      `);
      
      res.json({ 
        tableSchema: tableSchema.rows,
        installments: installmentsResult.rows
      });
    } catch (error) {
      console.error("Erro ao buscar informações de debug:", error);
      res.status(500).json({ error: "Erro ao buscar informações de debug" });
    }
  });
  
  // Rota para definir datas exatas nas parcelas
  app.post("/api/sales/:id/set-installments-exact", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      const { dates, values } = req.body;
      
      if (!Array.isArray(dates) || !Array.isArray(values)) {
        return res.status(400).json({ error: "As datas e valores devem ser arrays" });
      }
      
      if (dates.length !== values.length) {
        return res.status(400).json({ error: "Os arrays de datas e valores devem ter o mesmo tamanho" });
      }
      
      // Primeiro, excluir parcelas existentes
      await pool.query(`
        DELETE FROM sale_installments 
        WHERE saleId = $1
      `, [saleId]);
      
      console.log(`[DEBUG] Excluídas parcelas existentes da venda ${saleId}`);
      
      // Inserir novas parcelas com as datas exatas
      const installments = [];
      
      for (let i = 0; i < dates.length; i++) {
        const installmentNumber = i + 1;
        const dueDate = dates[i]; // Usar a data exatamente como recebida
        const amount = values[i];
        
        console.log(`[DEBUG] Inserindo parcela ${installmentNumber}: Data=${dueDate}, Valor=${amount}`);
        
        // Inserir usando SQL nativo para evitar qualquer conversão automática de data
        const result = await pool.query(`
          INSERT INTO sale_installments (
            saleId, installmentNumber, dueDate, amount, status, createdAt, updatedAt
          ) VALUES (
            $1, $2, $3::date, $4, 'pendente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          ) RETURNING id, saleId, installmentNumber, 
            TO_CHAR(dueDate::date, 'YYYY-MM-DD') as dueDate,
            amount, status
        `, [saleId, installmentNumber, dueDate, amount]);
        
        const installment = result.rows[0];
        console.log(`[DEBUG] Parcela inserida: ${JSON.stringify(installment)}`);
        
        installments.push(installment);
      }
      
      res.status(200).json({ 
        success: true, 
        message: `${installments.length} parcelas definidas com sucesso`, 
        installments 
      });
    } catch (error) {
      console.error("Erro ao definir parcelas com datas exatas:", error);
      res.status(500).json({ error: "Erro ao definir parcelas com datas exatas" });
    }
  });

  // Substituir a rota existente de GET /api/sales/:id/installments
  app.get("/api/sales/:id/installments", async (req, res) => {
    try {
      const saleId = parseInt(req.params.id);
      
      if (isNaN(saleId)) {
        return res.status(400).json({ error: "ID de venda inválido" });
      }
      
      // Usar SQL nativo para buscar as parcelas com controle preciso do formato da data
      const result = await pool.query(`
        SELECT 
          id, 
          saleId, 
          installmentNumber, 
          dueDate, 
          paymentDate,
          amount, 
          status, 
          notes
        FROM sale_installments
        WHERE saleId = $1
        ORDER BY installmentNumber
      `, [saleId]);
      
      const installments = result.rows;
      
      // Log para diagnóstico
      console.log(`[DEBUG] Buscando parcelas da venda ${saleId}:`);
      installments.forEach(p => {
        console.log(`[DEBUG] Parcela ${p.installmentNumber}: dueDate=${p.dueDate}, paymentDate=${p.paymentDate || 'null'}`);
      });
      
      res.json(installments);
    } catch (error) {
      console.error("Erro ao buscar parcelas da venda:", error);
      res.status(500).json({ error: "Erro ao buscar parcelas da venda" });
    }
  });
}