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
 * 
 * VERSÃO ULTRA ROBUSTA - MAIO 2025
 * Esta versão resolve problemas críticos de conversão e preservação de datas
 * - Detecta e preserva valores ISO existentes
 * - Converte datas brasileiras (DD/MM/YYYY) para ISO
 * - Trata objetos Date sem problemas de timezone
 * - Log extensivo para rastreamento de comportamento
 * 
 * @param dateValue - Valor da data em qualquer formato
 * @returns string - Data no formato YYYY-MM-DD
 */
export function formatDateToIso(dateValue: any): string {
  // Log de entrada para depuração
  console.log(`🔄 formatDateToIso - Entrada:`, {
    valor: dateValue,
    tipo: typeof dateValue,
    isNull: dateValue === null,
    isUndefined: dateValue === undefined
  });
  
  // Caso 1: Valor nulo ou undefined - usar data atual
  if (!dateValue) {
    const today = new Date();
    const result = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    console.log(`⚠️ formatDateToIso - Valor vazio, usando data atual: ${result}`);
    return result;
  }
  
  // Caso 2: Já é uma string
  if (typeof dateValue === 'string') {
    // Registrar detalhe para depuração
    console.log(`🔍 formatDateToIso - Processando string: "${dateValue}"`);
    
    // Remover parte de hora/timezone se existir
    let rawDate = dateValue;
    if (rawDate.includes('T')) {
      rawDate = rawDate.split('T')[0];
      console.log(`✂️ formatDateToIso - Removida parte de hora: "${rawDate}"`);
    }
    
    // Já está no formato YYYY-MM-DD - PRESERVAR EXATAMENTE COMO ESTÁ
    if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      console.log(`✅ formatDateToIso - Já no formato ISO, preservando: "${rawDate}"`);
      return rawDate;
    }
    
    // Formato DD/MM/YYYY (formato brasileiro)
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        // Verificar se o primeiro componente é dia (formato brasileiro)
        if (parts[0].length <= 2) {
          const result = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          console.log(`✅ formatDateToIso - Convertido de DD/MM/YYYY para ISO: ${rawDate} -> ${result}`);
          return result;
        } else {
          // Formato YYYY/MM/DD (raro)
          const result = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
          console.log(`✅ formatDateToIso - Convertido de YYYY/MM/DD para ISO: ${rawDate} -> ${result}`);
          return result;
        }
      }
    }
    
    // Formato DD-MM-YYYY
    if (rawDate.includes('-')) {
      const parts = rawDate.split('-');
      if (parts.length === 3 && parts[0].length !== 4) {
        const result = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        console.log(`✅ formatDateToIso - Convertido de DD-MM-YYYY para ISO: ${rawDate} -> ${result}`);
        return result;
      }
    }
    
    // Se chegou aqui, é uma string em formato não reconhecido
    console.log(`⚠️ formatDateToIso - Formato de string não reconhecido: "${rawDate}"`);
    
    // Tentativa final: ver se pode ser interpretado como data
    try {
      // Cuidado com interpretação automática de datas
      const testDate = new Date(rawDate);
      if (!isNaN(testDate.getTime())) {
        const year = testDate.getFullYear();
        const month = String(testDate.getMonth() + 1).padStart(2, '0');
        const day = String(testDate.getDate()).padStart(2, '0');
        const result = `${year}-${month}-${day}`;
        console.log(`⚠️ formatDateToIso - String interpretada como data: ${rawDate} -> ${result}`);
        return result;
      } else {
        console.log(`❌ formatDateToIso - String não pode ser interpretada como data: "${rawDate}"`);
      }
    } catch (error) {
      console.error(`❌ formatDateToIso - Erro ao tentar interpretar string como data:`, error);
    }
  }
  
  // Caso 3: É um objeto que parece uma Date
  if (dateValue && typeof dateValue === 'object' && 'getFullYear' in dateValue) {
    try {
      const dateObj = dateValue as Date;
      
      // Verificar se é uma data válida
      if (isNaN(dateObj.getTime())) {
        throw new Error("Data inválida");
      }
      
      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const day = String(dateObj.getDate()).padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      console.log(`✅ formatDateToIso - Objeto Date convertido para ISO: ${result}`);
      return result;
    } catch (error) {
      console.error(`❌ formatDateToIso - Erro ao processar objeto Date:`, error);
    }
  }
  
  // Caso 4: Tentar converter para Date como último recurso
  try {
    console.log(`⚠️ formatDateToIso - Tentativa final de conversão para Date: ${String(dateValue)}`);
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const result = `${year}-${month}-${day}`;
      console.log(`✅ formatDateToIso - Conversão final bem-sucedida: ${result}`);
      return result;
    } else {
      console.log(`❌ formatDateToIso - Conversão final falhou, data inválida`);
    }
  } catch (error) {
    console.error(`❌ formatDateToIso - Erro na conversão final:`, error);
  }
  
  // Fallback: data atual
  const today = new Date();
  const result = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  console.log(`⚠️ formatDateToIso - Tudo falhou, usando data atual: ${result}`);
  return result;
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