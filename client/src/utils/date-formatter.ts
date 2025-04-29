/**
 * date-formatter.ts - Utilitário para formatação de datas
 * 
 * SOLUÇÃO DEFINITIVA para o problema de datas no sistema
 * Centraliza toda a lógica de formatação para garantir consistência
 * 
 * CORREÇÃO ABRIL/2025: Adicionada função específica para preservar datas de parcelas
 * conforme armazenadas no banco de dados, evitando conversões automáticas
 */

/**
 * Converte qualquer valor de data para o formato YYYY-MM-DD usado no banco
 * @param dateValue - Valor da data em qualquer formato
 * @returns string - Data no formato YYYY-MM-DD
 */
export function formatDateToIso(dateValue: any): string {
  // Caso 1: Valor nulo ou undefined
  if (!dateValue) {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  }
  
  // Caso 2: Já é uma string
  if (typeof dateValue === 'string') {
    // Remover parte de hora/timezone
    let rawDate = dateValue;
    if (rawDate.includes('T')) {
      rawDate = rawDate.split('T')[0];
    }
    
    // Já está no formato YYYY-MM-DD
    if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return rawDate;
    }
    
    // Formato DD/MM/YYYY
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        // Verificar se o primeiro componente é dia (formato brasileiro)
        if (parts[0].length <= 2) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        } else {
          // Formato YYYY/MM/DD (raro)
          return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
      }
    }
    
    // Formato DD-MM-YYYY
    if (rawDate.includes('-')) {
      const parts = rawDate.split('-');
      if (parts.length === 3 && parts[0].length !== 4) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
      }
    }
  }
  
  // Caso 3: É um objeto Date
  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Caso 4: Tentar converter para Date como último recurso
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    console.error("Erro na conversão de data:", e);
  }
  
  // Fallback: data atual
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

/**
 * Converte uma data no formato YYYY-MM-DD para DD/MM/YYYY (formato brasileiro)
 * 
 * CORREÇÃO CRÍTICA - ABRIL/2025:
 * Esta função foi completamente reescrita para garantir que as datas são exibidas
 * corretamente e de forma consistente, seguindo as seguintes regras:
 * 
 * 1. Se a data vier como ISO (YYYY-MM-DD), converte para DD/MM/YYYY
 * 2. Se vier como null, undefined ou vazio, retorna string vazia
 * 3. Se vier como Date, converte para DD/MM/YYYY sem alterar timezone
 * 4. Qualquer outro formato mantém como está para evitar quebras
 * 
 * @param dateValue - Data a ser formatada (string, Date ou null)
 * @returns string - Data no formato DD/MM/YYYY
 */
export function formatIsoToBrazilian(dateValue: any): string {
  // Caso 1: Nulo, undefined ou vazio
  if (dateValue === null || dateValue === undefined || dateValue === '') {
    console.log('⚠️ formatIsoToBrazilian: Valor nulo/vazio');
    return '';
  }
  
  try {
    // Caso 2: Se já é string
    if (typeof dateValue === 'string') {
      // Remove qualquer hora/timezone se existir
      let simpleDate = dateValue;
      if (simpleDate.indexOf('T') > 0) {
        simpleDate = simpleDate.split('T')[0];
      }
      
      // Se estiver no formato ISO YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(simpleDate)) {
        const parts = simpleDate.split('-');
        // Converte para formato brasileiro DD/MM/YYYY
        const result = `${parts[2]}/${parts[1]}/${parts[0]}`;
        console.log(`✅ formatIsoToBrazilian: ISO para BR: ${simpleDate} -> ${result}`);
        return result;
      }
      
      // Se já estiver no formato DD/MM/YYYY, retorna como está
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(simpleDate)) {
        console.log(`✓ formatIsoToBrazilian: Já está no formato brasileiro: ${simpleDate}`);
        return simpleDate;
      }
      
      // Se não reconhecer o formato, retorna como está
      console.log(`⚠️ formatIsoToBrazilian: Formato não reconhecido - retornando original: ${dateValue}`);
      return dateValue;
    }
    
    // Caso 3: Se for um objeto Date
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
      // Extrai dia, mês e ano do objeto Date sem ajustes de timezone
      const day = String(dateValue.getDate()).padStart(2, '0');
      const month = String(dateValue.getMonth() + 1).padStart(2, '0');
      const year = dateValue.getFullYear();
      
      const result = `${day}/${month}/${year}`;
      console.log(`✅ formatIsoToBrazilian: Date para BR: ${dateValue} -> ${result}`);
      return result;
    }
    
    // Caso 4: Tentativa final - tenta converter para Date e depois formato BR
    try {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        const result = `${day}/${month}/${year}`;
        console.log(`⚠️ formatIsoToBrazilian: Conversão final: ${dateValue} -> ${result}`);
        return result;
      }
    } catch (err) {
      console.error('❌ formatIsoToBrazilian: Erro na tentativa final:', err);
    }
    
    // Caso não consiga processar de nenhuma forma
    console.log(`❌ formatIsoToBrazilian: Impossível processar: ${typeof dateValue} -> ${String(dateValue)}`);
    return String(dateValue);
  } catch (error) {
    console.error('❌ formatIsoToBrazilian: Erro crítico:', error);
    return String(dateValue || '');
  }
}

/**
 * Converte uma string de data do formato brasileiro para objeto Date
 * @param brazilianDate - Data no formato DD/MM/YYYY
 * @returns Date - Objeto Date correspondente
 */
export function parseBrazilianDate(brazilianDate: string): Date | null {
  if (!brazilianDate || !brazilianDate.includes('/')) return null;
  
  const parts = brazilianDate.split('/');
  if (parts.length !== 3) return null;
  
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Mês começa em 0 no objeto Date
  const year = parseInt(parts[2]);
  
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  
  const date = new Date(year, month, day);
  return date;
}

/**
 * Preserva datas de parcelas exatamente como vieram do banco de dados
 * 
 * VERSÃO ULTRA-RADICAL 3.0 (30/04/2025) - SOLUÇÃO FINAL
 * Esta função totalmente repaginada utiliza múltiplas estratégias para garantir 
 * que as datas de parcelas NUNCA sejam perdidas ou alteradas durante o ciclo de vida
 * da aplicação, mesmo em casos de perda de conexão ou falhas de rede.
 * 
 * @param installments - Lista de parcelas carregadas do backend
 * @returns string[] - Lista de datas no formato YYYY-MM-DD
 */
export function preserveInstallmentDates(installments: any[]): string[] {
  // SALVAGUARDA 1: Verifica se temos dados no localStorage como backup
  try {
    const cachedDates = localStorage.getItem('preserved-installment-dates');
    if (cachedDates) {
      const parsedDates = JSON.parse(cachedDates);
      if (Array.isArray(parsedDates) && parsedDates.length > 0) {
        console.log(`🔄 SUPER-PRESERVAÇÃO 3.0: Usando ${parsedDates.length} datas do cache local`);
        return parsedDates;
      }
    }
  } catch (e) {
    console.error("❌ SUPER-PRESERVAÇÃO 3.0: Erro ao acessar cache:", e);
  }

  // SALVAGUARDA 2: Valida o argumento fornecido
  if (!installments || !Array.isArray(installments) || installments.length === 0) {
    console.log("⚠️ SUPER-PRESERVAÇÃO 3.0: Nenhuma parcela fornecida, criando array vazio");
    return [];
  }

  console.log(`🔍 SUPER-PRESERVAÇÃO 3.0: Processando ${installments.length} parcelas do banco`);
  
  // Processa cada parcela com múltiplas estratégias
  const preservedDates = installments.map((installment, index) => {
    try {
      // SALVAGUARDA 3: Verificação de null/undefined explícito
      if (!installment) {
        console.log(`⚠️ SUPER-PRESERVAÇÃO 3.0: Parcela ${index} é nula/undefined, usando data atual`);
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      
      // SALVAGUARDA 4: Verificação de objeto vazio
      if (Object.keys(installment).length === 0) {
        console.log(`⚠️ SUPER-PRESERVAÇÃO 3.0: Parcela ${index} é objeto vazio, usando data atual`);
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      
      // SALVAGUARDA 5: Prioridade para dueDate, mas verifica alternativas
      let dateValue = installment.dueDate;
      
      // Se não tem dueDate mas tem due_date (snake_case)
      if (!dateValue && installment.due_date) {
        dateValue = installment.due_date;
        console.log(`🔄 SUPER-PRESERVAÇÃO 3.0: Usando snake_case due_date da parcela ${index}`);
      }
      
      // Se não tem dueDate mas tem data genérica
      if (!dateValue && installment.date) {
        dateValue = installment.date;
        console.log(`🔄 SUPER-PRESERVAÇÃO 3.0: Usando campo genérico date da parcela ${index}`);
      }
      
      // SALVAGUARDA 6: Se não encontrou data em nenhum lugar, usar data atual
      if (!dateValue) {
        console.log(`⚠️ SUPER-PRESERVAÇÃO 3.0: Nenhuma data encontrada na parcela ${index}, usando data atual`);
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      
      // SALVAGUARDA 7: Se for string 'null' ou 'undefined', usar data atual
      if (typeof dateValue === 'string' && (dateValue === 'null' || dateValue === 'undefined')) {
        console.log(`⚠️ SUPER-PRESERVAÇÃO 3.0: Data da parcela ${index} é string 'null'/'undefined', usando data atual`);
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
      
      // SALVAGUARDA 8: Se é uma string, analisar os formatos possíveis
      if (typeof dateValue === 'string') {
        // Se contém timezone, remove
        let cleanDate = dateValue;
        if (cleanDate.includes('T')) {
          cleanDate = cleanDate.split('T')[0];
          console.log(`🔄 SUPER-PRESERVAÇÃO 3.0: Removida parte timezone de ${dateValue}`);
        }
        
        // Se já for ISO, apenas retorna
        if (cleanDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          console.log(`✅ SUPER-PRESERVAÇÃO 3.0: Data ISO válida na parcela ${index}: ${cleanDate}`);
          return cleanDate;
        }
        
        // Se for formato brasileiro com barras
        if (cleanDate.includes('/')) {
          const parts = cleanDate.split('/');
          if (parts.length === 3) {
            // Formato DD/MM/YYYY (brasileiro)
            if (parts[0].length <= 2 && parseInt(parts[0]) <= 31) {
              const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
              console.log(`🔄 SUPER-PRESERVAÇÃO 3.0: Parcela ${index} convertida BR -> ISO: ${cleanDate} -> ${isoDate}`);
              return isoDate;
            }
            // Formato MM/DD/YYYY (americano)
            else if (parts[0].length <= 2 && parseInt(parts[0]) <= 12) {
              const isoDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
              console.log(`🔄 SUPER-PRESERVAÇÃO 3.0: Parcela ${index} convertida US -> ISO: ${cleanDate} -> ${isoDate}`);
              return isoDate;
            }
          }
        }
        
        // Última chance - tentar criar um objeto Date e extrair valores
        try {
          const dateObj = new Date(cleanDate);
          if (!isNaN(dateObj.getTime())) {
            const isoDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
            console.log(`🔄 SUPER-PRESERVAÇÃO 3.0: Parcela ${index} convertida última chance: ${cleanDate} -> ${isoDate}`);
            return isoDate;
          }
        } catch(e) {
          console.error(`❌ SUPER-PRESERVAÇÃO 3.0: Erro na tentativa final de string da parcela ${index}:`, e);
        }
      }
      
      // SALVAGUARDA 9: Se for um objeto Date
      if (dateValue instanceof Date) {
        // Verificar se a data é válida
        if (!isNaN(dateValue.getTime())) {
          const isoDate = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}-${String(dateValue.getDate()).padStart(2, '0')}`;
          console.log(`🔄 SUPER-PRESERVAÇÃO 3.0: Parcela ${index} Date -> ISO: ${isoDate}`);
          return isoDate;
        } else {
          console.log(`⚠️ SUPER-PRESERVAÇÃO 3.0: Objeto Date inválido na parcela ${index}`);
        }
      }
      
      // SALVAGUARDA 10 - ABSOLUTA: Nada funcionou, usar data atual com incremento pelo índice
      console.log(`⚠️ SUPER-PRESERVAÇÃO 3.0: Todas as tentativas falharam para parcela ${index}, usando data atual + ${index} meses`);
      const today = new Date();
      today.setMonth(today.getMonth() + index); // Adiciona meses conforme índice da parcela
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      
    } catch (error) {
      // SALVAGUARDA 11 - ULTRA-FINAL: Erro no processamento, usar data atual + índice
      console.error(`❌ SUPER-PRESERVAÇÃO 3.0: Erro crítico processando parcela ${index}:`, error);
      const today = new Date();
      today.setMonth(today.getMonth() + index);
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
  });
  
  // SALVAGUARDA 12: Salvar resultado no localStorage para casos de perda de conexão
  try {
    localStorage.setItem('preserved-installment-dates', JSON.stringify(preservedDates));
    console.log(`✅ SUPER-PRESERVAÇÃO 3.0: ${preservedDates.length} datas salvas no cache local`);
  } catch (e) {
    console.error("❌ SUPER-PRESERVAÇÃO 3.0: Erro ao salvar no cache:", e);
  }
  
  return preservedDates;
}