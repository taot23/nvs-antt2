/**
 * sale-items-utils.ts - Utilitário para manipulação de itens de venda
 * 
 * SOLUÇÃO ANTI-FLICKERING para itens de venda
 * Controla a inicialização, atualização e exibição dos itens
 */

/**
 * Sanitiza os itens de venda para garantir consistência e evitar referências circulares
 * @param items - Lista de itens de venda
 * @returns - Lista de itens sanitizados
 */
export function sanitizeSaleItems(items: any[] = []): any[] {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }
  
  // Criar novas referências para cada item, mantendo apenas os campos essenciais
  return items.map(item => ({
    serviceId: item.serviceId || 0,
    quantity: item.quantity || 1,
    notes: item.notes || "",
    serviceTypeId: item.serviceTypeId || 0
  }));
}

/**
 * Verifica se duas listas de itens são iguais em termos de conteúdo
 * @param items1 - Primeira lista de itens
 * @param items2 - Segunda lista de itens
 * @returns boolean - true se os itens são iguais, false caso contrário
 */
export function itemListsAreEqual(items1: any[] = [], items2: any[] = []): boolean {
  if (!items1 || !items2) return false;
  if (items1.length !== items2.length) return false;
  
  // Compara cada item usando os campos relevantes
  for (let i = 0; i < items1.length; i++) {
    const item1 = items1[i];
    const item2 = items2[i];
    
    // Verificar os campos relevantes para comparação
    if (
      item1.serviceId !== item2.serviceId ||
      item1.quantity !== item2.quantity ||
      item1.notes !== item2.notes ||
      (item1.serviceTypeId && item2.serviceTypeId && item1.serviceTypeId !== item2.serviceTypeId)
    ) {
      return false;
    }
  }
  
  return true;
}

/**
 * Atraso seguro para operações assíncronas para evitar flickering
 * @param ms - Tempo de atraso em milissegundos
 * @returns Promise - Promise que resolve após o tempo especificado
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}