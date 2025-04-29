// Utilitário para gerenciar carregamento consistente de itens de venda
// Este arquivo centraliza a lógica de tratamento de itens para evitar duplicações e problemas de referência

/**
 * Limpa e formata itens de venda para uso no formulário, garantindo valores consistentes
 * Evita problemas de referência entre objetos
 */
export function sanitizeSaleItems(items: any[] = []) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }
  
  // Cria cópias independentes dos itens, garantindo valores padrão para campos obrigatórios
  return items.map(item => ({
    // Garantir que temos um ID se disponível
    ...(item.id ? { id: item.id } : {}),
    // Campos obrigatórios com valores padrão seguros
    serviceId: Number(item.serviceId) || 0,
    quantity: Number(item.quantity) || 1,
    // Campos opcionais com valores padrão
    notes: item.notes || "",
    serviceTypeId: Number(item.serviceTypeId) || null,
    price: item.price || "0",
    totalPrice: item.totalPrice || "0"
  }));
}

/**
 * Verifica se dois conjuntos de itens são equivalentes em termos de dados essenciais
 * Usado para evitar atualizações desnecessárias do formulário
 */
export function areItemsEquivalent(items1: any[] = [], items2: any[] = []) {
  if (!Array.isArray(items1) || !Array.isArray(items2)) {
    return false;
  }
  
  if (items1.length !== items2.length) {
    return false;
  }
  
  // Ordenar os arrays por ID de serviço para garantir comparação consistente
  const sorted1 = [...items1].sort((a, b) => (a.serviceId || 0) - (b.serviceId || 0));
  const sorted2 = [...items2].sort((a, b) => (a.serviceId || 0) - (b.serviceId || 0));
  
  // Comparar elementos essenciais
  for (let i = 0; i < sorted1.length; i++) {
    if (Number(sorted1[i].serviceId) !== Number(sorted2[i].serviceId) ||
        Number(sorted1[i].quantity) !== Number(sorted2[i].quantity)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Utilitário para formatar datas ISO para o formato brasileiro
 * Garante consistência na exibição de datas ao usuário
 */
export function formatDateToBrazilian(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  
  try {
    // Se a data já estiver no formato DD/MM/YYYY, retorna como está
    if (isoDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      return isoDate;
    }
    
    // Se a data for no formato ISO YYYY-MM-DD
    if (isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = isoDate.split('-');
      return `${day}/${month}/${year}`;
    }
    
    // Tenta converter de Date
    const date = new Date(isoDate);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    
    // Se falhou em converter, retorna a string original
    return isoDate;
  } catch (error) {
    console.error("Erro ao formatar data:", error);
    return isoDate || '';
  }
}

/**
 * Converte datas brasileiras (DD/MM/YYYY) para o formato ISO (YYYY-MM-DD)
 * Usado para enviar datas para o backend no formato correto
 */
export function formatDateToISO(brDate: string | null | undefined): string {
  if (!brDate) return '';
  
  try {
    // Se já estiver no formato ISO, retornar como está
    if (brDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return brDate;
    }
    
    // Se for uma data no formato brasileiro DD/MM/YYYY
    if (brDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
      const [day, month, year] = brDate.split('/');
      return `${year}-${month}-${day}`;
    }
    
    // Se for um objeto Date
    if (typeof brDate === 'object' && brDate !== null && 'getTime' in brDate && typeof brDate.getTime === 'function' && !isNaN(brDate.getTime())) {
      return brDate.toISOString().split('T')[0];
    }
    
    // Tentar converter de qualquer outro formato
    const date = new Date(brDate);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    return '';
  } catch (error) {
    console.error("Erro ao converter data para ISO:", error);
    return '';
  }
}

/**
 * Verifica se campos financeiros devem ser bloqueados em uma venda
 * Implementa a lógica de bloqueio quando financeiro já iniciou a tratativa
 */
export function shouldLockFinancialFields(sale: any): boolean {
  // Se não tiver uma venda, não bloqueamos
  if (!sale) return false;
  
  // Bloqueamos edição financeira se:
  // 1. O status financeiro não for 'pending' (já iniciou tratativa)
  // 2. Se o responsável financeiro estiver definido (alguém já pegou a venda)
  const isFinancialStarted = 
    (sale.financialStatus && sale.financialStatus !== 'pending') || 
    sale.responsibleFinancialId !== null;
  
  return isFinancialStarted;
}

/**
 * Avalia se uma venda pode ter seus itens editados ou se está bloqueada
 */
export function canEditSaleItems(sale: any): boolean {
  // Se não tiver uma venda, permitimos edição (nova venda)
  if (!sale) return true;
  
  // Vendas devolvidas (returned) sempre podem ser editadas
  if (sale.status === 'returned') return true;
  
  // Bloqueamos edição de itens se:
  // 1. A venda estiver concluída (completed)
  // 2. A venda estiver corrigida (corrected - aguardando nova avaliação)
  // 3. O financeiro já tenha iniciado o tratamento
  const isLockedStatus = 
    sale.status === 'completed' || 
    sale.status === 'corrected';
  
  return !isLockedStatus && !shouldLockFinancialFields(sale);
}