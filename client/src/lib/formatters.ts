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