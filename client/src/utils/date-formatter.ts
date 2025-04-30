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
    
    // Caso 3: Se for um objeto que parece uma Date
    if (dateValue && typeof dateValue === 'object' && 'getFullYear' in dateValue) {
      try {
        // Extrai dia, mês e ano do objeto Date sem ajustes de timezone
        const dateObj = dateValue as Date;
        
        // Verificar se é uma data válida
        if (isNaN(dateObj.getTime())) {
          throw new Error("Data inválida");
        }
        
        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();
        
        const result = `${day}/${month}/${year}`;
        console.log(`✅ formatIsoToBrazilian: Date para BR: ${dateValue} -> ${result}`);
        return result;
      } catch (err) {
        console.error("❌ formatIsoToBrazilian: Erro ao processar objeto Date:", err);
      }
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
 * Esta função é crítica para garantir que datas existentes não sejam alteradas
 * durante o processamento na interface. Ela evita conversões automáticas
 * que possam alterar o valor original.
 * 
 * @param installments - Lista de parcelas carregadas do backend
 * @returns string[] - Lista de datas no formato YYYY-MM-DD
 */
export function preserveInstallmentDates(installments: any[]): string[] {
  if (!installments || !Array.isArray(installments) || installments.length === 0) {
    console.log("⚠️ Nenhuma parcela fornecida para preservação de datas");
    return [];
  }

  console.log(`🔍 Preservando ${installments.length} datas de parcelas do banco de dados`);
  
  return installments.map(installment => {
    // Se não tiver data, retorna data atual
    if (!installment || !installment.dueDate) {
      console.log("⚠️ Parcela sem data de vencimento, usando data atual");
      const today = new Date();
      return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }
    
    // Se a data já estiver no formato ISO (YYYY-MM-DD), mantém como está
    if (typeof installment.dueDate === 'string' && installment.dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log(`✅ Data de parcela preservada exatamente como no banco: ${installment.dueDate}`);
      return installment.dueDate;
    }
    
    // Se for uma string em outro formato, tenta converter para ISO
    if (typeof installment.dueDate === 'string') {
      // Remover parte de timestamp se existir
      let rawDate = installment.dueDate;
      if (rawDate.includes('T')) {
        rawDate = rawDate.split('T')[0];
      }
      
      // Se já for ISO, apenas retorna
      if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        console.log(`✅ Data de parcela (com hora removida) preservada: ${rawDate}`);
        return rawDate;
      }
      
      // Tenta converter formatos brasileiros
      if (rawDate.includes('/')) {
        const parts = rawDate.split('/');
        if (parts.length === 3) {
          // Formato brasileiro DD/MM/YYYY
          if (parts[0].length <= 2) {
            const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            console.log(`🔄 Data de parcela convertida de DD/MM/YYYY para ISO: ${rawDate} -> ${isoDate}`);
            return isoDate;
          }
        }
      }
      
      console.log(`⚠️ Formato de data não reconhecido: ${rawDate}, utilizando como está`);
      return rawDate;
    }
    
    // Se for um objeto que parece uma Date, converte para string ISO
    if (installment.dueDate && typeof installment.dueDate === 'object' && 'getFullYear' in installment.dueDate) {
      try {
        const dateObj = installment.dueDate as Date;
        const isoDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
        console.log(`🔄 Data de parcela convertida de objeto Date para ISO: ${isoDate}`);
        return isoDate;
      } catch (err) {
        console.error("❌ Erro ao processar objeto Date:", err);
        // Em caso de erro, usar data atual
        const today = new Date();
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      }
    }
    
    // Caso não consiga processar, log detalhado e retorna a data atual
    console.log(`⚠️ Tipo de data não tratado:`, typeof installment.dueDate, installment.dueDate);
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
}