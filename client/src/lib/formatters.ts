/**
 * Formata um valor numérico para exibição como moeda BRL (Real)
 * @param value Valor numérico a ser formatado
 * @returns String formatada em BRL
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Converte um valor de string com formato de moeda para número
 * @param value String com formato de moeda (ex: "1.000,50" ou "R$ 1.000,50")
 * @returns Valor numérico para armazenamento
 */
export function parseInputToNumber(value: string): string {
  // Remove qualquer caractere não numérico, exceto vírgula e ponto
  const numericValue = value.replace(/[^\d,\.]/g, '');
  
  // Converte formato brasileiro (1.000,00) para formato numérico (1000.00)
  const normalized = numericValue
    .replace(/\./g, '') // Remove pontos de milhar 
    .replace(',', '.'); // Substitui vírgula por ponto
  
  // Verifica se é um número válido
  const parsed = parseFloat(normalized);
  
  // Retorna o número formatado com 2 casas decimais ou 0 se for inválido
  return isNaN(parsed) ? '0.00' : parsed.toFixed(2);
}

/**
 * Formata uma data no padrão brasileiro (dd/mm/yyyy)
 * @param date Data a ser formatada
 * @returns String formatada como dd/mm/yyyy
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formata um número decimal com precisão específica
 * @param value Valor numérico
 * @param precision Número de casas decimais
 * @returns String formatada com a precisão especificada
 */
export function formatDecimal(value: number, precision: number = 2): string {
  return value.toFixed(precision);
}

/**
 * Formata um número como percentual
 * @param value Valor numérico (ex: 0.25 para 25%)
 * @returns String formatada como percentual
 */
export function formatPercent(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Formata um documento (CPF/CNPJ)
 * @param doc Documento a ser formatado
 * @returns String formatada de acordo com CPF ou CNPJ
 */
export function formatDocument(doc: string | null): string {
  if (!doc) return '';
  
  // Remove caracteres não numéricos
  const numbers = doc.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    // CPF: 000.000.000-00
    return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  } else {
    // CNPJ: 00.000.000/0000-00
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
}