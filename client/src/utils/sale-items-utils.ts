/**
 * sale-items-utils.ts - Utilitário para manipulação de itens de venda
 * 
 * SOLUÇÃO ANTI-FLICKERING para itens de venda
 * Controla a inicialização, atualização e exibição dos itens
 * 
 * Esta implementação resolve problemas de:
 * - Flickering (piscadas) durante a atualização dos itens
 * - Referências circulares que causam problemas de renderização
 * - Dados inconsistentes entre o estado local e o backend
 * - Campos nulos ou indefinidos que quebram o layout
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

/**
 * Calcula preços totais para cada item baseado em preço unitário e quantidade
 * @param items - Lista de itens de venda
 * @param services - Lista de serviços disponíveis
 * @returns Lista de itens com preços calculados
 */
export function calculateItemPrices(items: any[] = [], services: any[] = []): any[] {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return [];
  }
  
  return items.map(item => {
    // Buscar o serviço correspondente
    const service = services.find(s => s.id === item.serviceId);
    
    if (!service) {
      return {
        ...item,
        price: "0.00",
        totalPrice: "0.00"
      };
    }
    
    // Calcular o preço total
    const quantity = item.quantity || 1;
    const price = parseFloat(service.price || "0");
    const totalPrice = (price * quantity).toFixed(2);
    
    return {
      ...item,
      price: price.toFixed(2),
      totalPrice
    };
  });
}

/**
 * Calcula o valor total de uma venda somando todos os itens
 * @param items - Lista de itens calculados (com totalPrice)
 * @returns string - Valor total formatado com 2 casas decimais
 */
export function calculateSaleTotal(items: any[] = []): string {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return "0.00";
  }
  
  const total = items.reduce((sum, item) => {
    const price = parseFloat(item.totalPrice || "0");
    return sum + price;
  }, 0);
  
  return total.toFixed(2);
}