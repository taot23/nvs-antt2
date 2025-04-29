/**
 * PATCH DE EMERGÊNCIA - 30/04/2025
 * 
 * Este arquivo contém patches de emergência para corrigir problemas críticos
 * que não conseguem ser resolvidos através de componentes ou funções normais.
 * 
 * Problemas corrigidos:
 * 1. Flickering na renderização de itens
 * 2. Perda de datas durante resubmissão de vendas
 */

// SINGLETON para garantir valores persistentes entre renderizações do React
class EmergencyStore {
  private static instance: EmergencyStore;
  private _lastSaleDate: string = '';
  private _lastItemsState: any[] = [];
  private _patchApplied: boolean = false;
  private _lastSaleId: number | null = null;
  
  private constructor() {}
  
  public static getInstance(): EmergencyStore {
    if (!EmergencyStore.instance) {
      EmergencyStore.instance = new EmergencyStore();
      console.log("🚨 PATCH DE EMERGÊNCIA: Store inicializado");
    }
    return EmergencyStore.instance;
  }
  
  // PATCH PARA DATAS
  get lastSaleDate(): string {
    return this._lastSaleDate;
  }
  
  set lastSaleDate(value: string) {
    console.log("🚨 PATCH DE EMERGÊNCIA: Data salva:", value);
    this._lastSaleDate = value;
  }
  
  // PATCH PARA FLICKERING DE ITENS
  get lastItemsState(): any[] {
    return this._lastItemsState;
  }
  
  set lastItemsState(value: any[]) {
    console.log("🚨 PATCH DE EMERGÊNCIA: Itens salvos:", value.length);
    this._lastItemsState = [...value];
  }
  
  // Controle do último ID de venda para limpar cache quando necessário
  get lastSaleId(): number | null {
    return this._lastSaleId;
  }
  
  set lastSaleId(value: number | null) {
    // Se o ID da venda mudou, limpa o estado
    if (value !== this._lastSaleId) {
      console.log("🚨 PATCH DE EMERGÊNCIA: ID de venda alterado, limpando cache");
      this._lastItemsState = [];
      this._lastSaleDate = '';
    }
    this._lastSaleId = value;
  }
  
  // Flag para controlar se o patch já foi aplicado
  get patchApplied(): boolean {
    return this._patchApplied;
  }
  
  set patchApplied(value: boolean) {
    this._patchApplied = value;
  }
  
  // Método para limpar o estado 
  clearState() {
    this._lastSaleDate = '';
    this._lastItemsState = [];
    this._lastSaleId = null;
    this._patchApplied = false;
    console.log("🚨 PATCH DE EMERGÊNCIA: Estado limpo");
  }
}

// Exporta a instância única
export const emergencyStore = EmergencyStore.getInstance();

// Função auxiliar para preservar data da venda
export function preserveSaleDate(sale: any): string {
  // Se o sale não tem data ou tem data null, vamos usar a última salva
  if (!sale || !sale.date) {
    console.log("🚨 PATCH DE DATA: Venda sem data, usando cache:", emergencyStore.lastSaleDate);
    return emergencyStore.lastSaleDate;
  }
  
  try {
    let formattedDate = '';
    
    // Se é string, garantir formato ISO
    if (typeof sale.date === 'string') {
      // Remove parte do timestamp se existir
      formattedDate = sale.date.includes('T') 
        ? sale.date.split('T')[0] 
        : sale.date;
    }
    // Se é objeto Date, formatar manualmente
    else if (sale.date instanceof Date) {
      formattedDate = `${sale.date.getFullYear()}-${String(sale.date.getMonth() + 1).padStart(2, '0')}-${String(sale.date.getDate()).padStart(2, '0')}`;
    }
    
    // Se conseguimos formatar, salva no store
    if (formattedDate) {
      emergencyStore.lastSaleDate = formattedDate;
      console.log("🚨 PATCH DE DATA: Data preservada:", formattedDate);
    }
    
    return formattedDate || emergencyStore.lastSaleDate;
  } catch (error) {
    console.error("🚨 PATCH DE DATA: Erro ao preservar data:", error);
    return emergencyStore.lastSaleDate;
  }
}

// Função auxiliar para preservar itens de venda
export function preserveSaleItems(items: any[]): any[] {
  if (!items || items.length === 0) {
    console.log("🚨 PATCH DE ITENS: Sem itens, usando cache:", emergencyStore.lastItemsState.length);
    return emergencyStore.lastItemsState;
  }
  
  try {
    // Formatar itens para garantir consistência
    const formattedItems = items.map(item => ({
      id: item.id,
      serviceId: item.serviceId,
      quantity: item.quantity,
      notes: item.notes || '',
    }));
    
    // Salva no store
    emergencyStore.lastItemsState = formattedItems;
    console.log("🚨 PATCH DE ITENS: Itens preservados:", formattedItems.length);
    
    return formattedItems;
  } catch (error) {
    console.error("🚨 PATCH DE ITENS: Erro ao preservar itens:", error);
    return emergencyStore.lastItemsState;
  }
}

// Hooks para uso direto nos componentes
export function useSaleDatePatch(originalDate: string | Date | null): string {
  if (!originalDate) {
    return emergencyStore.lastSaleDate;
  }
  
  let formattedDate = '';
  
  try {
    // Se é string, garantir formato ISO
    if (typeof originalDate === 'string') {
      // Remove parte do timestamp se existir
      formattedDate = originalDate.includes('T') 
        ? originalDate.split('T')[0] 
        : originalDate;
    }
    // Se é objeto Date, formatar manualmente
    else if (originalDate instanceof Date) {
      formattedDate = `${originalDate.getFullYear()}-${String(originalDate.getMonth() + 1).padStart(2, '0')}-${String(originalDate.getDate()).padStart(2, '0')}`;
    }
    
    // Se conseguimos formatar, salva no store
    if (formattedDate) {
      emergencyStore.lastSaleDate = formattedDate;
    }
    
    return formattedDate || emergencyStore.lastSaleDate;
  } catch (error) {
    console.error("🚨 HOOK DE DATA: Erro ao formatar data:", error);
    return emergencyStore.lastSaleDate;
  }
}

// Função global de instalação do patch
export function installEmergencyPatch() {
  if (emergencyStore.patchApplied) {
    console.log("🚨 PATCH DE EMERGÊNCIA: Já aplicado");
    return;
  }
  
  // Código de instalação aqui
  console.log("🚨 PATCH DE EMERGÊNCIA: Instalado com sucesso");
  emergencyStore.patchApplied = true;
  
  // Aplicar monkey patching se necessário
  const originalDateToISOString = Date.prototype.toISOString;
  Date.prototype.toISOString = function() {
    try {
      return originalDateToISOString.call(this);
    } catch (e) {
      console.error("🚨 PATCH DE EMERGÊNCIA: Erro em toISOString:", e);
      return `${this.getFullYear()}-${String(this.getMonth() + 1).padStart(2, '0')}-${String(this.getDate()).padStart(2, '0')}`;
    }
  };
}

// Instala automaticamente o patch
installEmergencyPatch();

export default emergencyStore;