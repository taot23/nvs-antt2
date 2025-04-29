/**
 * date-formatter.ts - Utilitário para formatação de datas
 * 
 * SOLUÇÃO DEFINITIVA para o problema de datas no sistema
 * Centraliza toda a lógica de formatação para garantir consistência
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
 * @param isoDate - Data no formato YYYY-MM-DD
 * @returns string - Data no formato DD/MM/YYYY
 */
export function formatIsoToBrazilian(isoDate: string): string {
  if (!isoDate || !isoDate.includes('-')) return '';
  
  const parts = isoDate.split('-');
  if (parts.length !== 3) return '';
  
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
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