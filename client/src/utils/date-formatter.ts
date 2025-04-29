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
 * Essa função foi modificada para garantir que o valor original é mantido
 * quando usado para exibir datas de parcelas. Isso resolve o problema de 
 * inconsistência entre o que é exibido e o que está no banco.
 * 
 * @param isoDate - Data no formato YYYY-MM-DD
 * @returns string - Data no formato DD/MM/YYYY
 */
export function formatIsoToBrazilian(isoDate: string): string {
  // Log detalhado para debug
  console.log(`🔄 FORMATANDO DATA: Valor original = "${isoDate}"`);
  
  // Se é vazio ou inválido, retorna vazio
  if (!isoDate) return '';
  
  // Garantir que estamos trabalhando com string
  const dateStr = String(isoDate);
  
  // Caso especial: Se for uma data no formato ISO (2030-01-01)
  if (dateStr.includes('-')) {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      // Log para depuração
      console.log(`✓ Convertendo data ISO para brasileiro: ${dateStr} -> ${parts[2]}/${parts[1]}/${parts[0]}`);
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  
  // Se for uma string sem traços, mas com barras (já no formato brasileiro)
  if (dateStr.includes('/')) {
    // É possível que já esteja no formato correto, retornar como está
    console.log(`✓ Data já está no formato brasileiro: ${dateStr}`);
    return dateStr;
  }
  
  // Se chegou até aqui e não conseguimos processar, log para depuração
  console.log(`⚠️ Formato de data não reconhecido: ${dateStr}, retornando valor original`);
  return dateStr;
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
    
    // Se for um objeto Date, converte para string ISO
    if (installment.dueDate instanceof Date) {
      const isoDate = `${installment.dueDate.getFullYear()}-${String(installment.dueDate.getMonth() + 1).padStart(2, '0')}-${String(installment.dueDate.getDate()).padStart(2, '0')}`;
      console.log(`🔄 Data de parcela convertida de objeto Date para ISO: ${isoDate}`);
      return isoDate;
    }
    
    // Caso não consiga processar, log detalhado e retorna a data atual
    console.log(`⚠️ Tipo de data não tratado:`, typeof installment.dueDate, installment.dueDate);
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
}