/**
 * Formatadores para valores monetários, datas e percentuais
 */

/**
 * Formata um valor monetário para o padrão brasileiro (R$)
 * @param value Valor a ser formatado (string ou número)
 * @returns String formatada em R$
 */
export function formatCurrency(value: string | number): string {
  // Converte para número se for string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Evita NaN
  if (isNaN(numValue)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
}

/**
 * Converte uma string de moeda (ex: "R$ 1.000,00") para número
 * @param value String com valor monetário
 * @returns Número equivalente
 */
export function currencyToNumber(value: string): number {
  if (!value) return 0;
  
  // Remove símbolos e espaços
  const numStr = value.replace(/[^\d,-]/g, '')
    .replace('.', '')  // Remove ponto de milhar
    .replace(',', '.'); // Troca vírgula decimal por ponto
    
  return parseFloat(numStr);
}

/**
 * Formata uma data para o padrão brasileiro (dd/mm/yyyy)
 * @param date Data a ser formatada
 * @returns String formatada
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  
  console.log(`📅 formatDate recebeu: "${date}", tipo: ${typeof date}`);
  
  // Se for string no formato 'YYYY-MM-DD' (ISO sem tempo)
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.log(`📅 Detectado formato ISO YYYY-MM-DD: ${date}`);
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Para strings que possam conter o formato ISO com timezone (T00:00:00.000Z)
  if (typeof date === 'string' && date.includes('T')) {
    console.log(`📅 Detectado formato ISO com timezone: ${date}`);
    // Extrair apenas a parte da data (YYYY-MM-DD)
    const datePart = date.split('T')[0];
    const [year, month, day] = datePart.split('-');
    return `${day}/${month}/${year}`;
  }
  
  // Para outros formatos, tenta converter para Date
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Verifica se é uma data válida
  if (isNaN(dateObj.getTime())) {
    console.log(`⚠️ Data inválida recebida: ${date}, tipo: ${typeof date}`);
    return '';
  }
  
  // Formata como dd/mm/yyyy
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * SUPER CORREÇÃO FINAL (26/04/2025): Formata uma data para o formato ISO YYYY-MM-DD
 * Esta função serve para garantir que qualquer data seja convertida para o formato
 * que o banco de dados espera, sem componentes de timezone.
 * 
 * @param date Data a ser formatada (pode ser string, Date ou null)
 * @returns String no formato YYYY-MM-DD, ou string vazia se a data for nula/inválida
 */
export function formatDateForDatabase(date: Date | string | null): string {
  if (!date) return '';
  
  console.log(`🚨 SUPER CORREÇÃO: formatDateForDatabase recebeu: "${date}", tipo: ${typeof date}`);
  
  // Se já for string no formato YYYY-MM-DD, retornar diretamente
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.log(`🚨 SUPER CORREÇÃO: Já está no formato correto: ${date}`);
    return date;
  }
  
  // Para strings que possam conter o formato ISO com timezone (T00:00:00.000Z)
  if (typeof date === 'string' && date.includes('T')) {
    console.log(`🚨 SUPER CORREÇÃO: Removendo informação timezone: ${date}`);
    // Extrair apenas a parte da data (YYYY-MM-DD)
    return date.split('T')[0];
  }
  
  // Para strings no formato brasileiro (DD/MM/YYYY)
  if (typeof date === 'string' && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
    console.log(`🚨 SUPER CORREÇÃO: Convertendo de DD/MM/YYYY para YYYY-MM-DD: ${date}`);
    const [day, month, year] = date.split('/');
    return `${year}-${month}-${day}`;
  }
  
  // Para objetos Date, converter manualmente para YYYY-MM-DD
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;
    console.log(`🚨 SUPER CORREÇÃO: Convertido Date para YYYY-MM-DD: ${result}`);
    return result;
  }
  
  // Para outros casos, tentar converter para Date e depois para YYYY-MM-DD
  try {
    const dateObj = new Date(date as any);
    
    // Verifica se é uma data válida
    if (isNaN(dateObj.getTime())) {
      console.log(`⚠️ SUPER CORREÇÃO: Data inválida recebida: ${date}`);
      return '';
    }
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const result = `${year}-${month}-${day}`;
    console.log(`🚨 SUPER CORREÇÃO: Convertido para YYYY-MM-DD via objeto Date: ${result}`);
    return result;
    
  } catch (error) {
    console.error(`⚠️ SUPER CORREÇÃO: Erro ao converter data: ${error}`);
    return '';
  }
}

/**
 * Formata um percentual para o padrão brasileiro
 * @param value Valor percentual (ex: 0.25 para 25%)
 * @returns String formatada com símbolo de percentual
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Formata número como string para exibição com separador de milhares
 * @param value Número a ser formatado
 * @returns String formatada
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

/**
 * Converte um valor de entrada (geralmente um input de texto) para número
 * Muito utilizado em inputs de formulário
 * @param input Valor a ser convertido
 * @returns Número equivalente
 */
export function parseInputToNumber(input: string): number {
  if (!input || input === '') return 0;
  
  // Remove caracteres não numéricos, exceto pontos e vírgulas
  const cleanedInput = input.replace(/[^\d.,]/g, '')
    .replace(/\./g, '') // Remove pontos de milhar
    .replace(',', '.'); // Substitui vírgula decimal por ponto
  
  const parsedNumber = parseFloat(cleanedInput);
  return isNaN(parsedNumber) ? 0 : parsedNumber;
}