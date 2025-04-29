import React, { useState, useEffect, useRef } from 'react';
import { Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Package } from 'lucide-react';

type Item = {
  id: string;
  serviceId: number;
  serviceName: string;
  quantity: number;
  notes?: string | null;
};

type StaticItemsRendererProps = {
  items: Item[];
  onRemove?: (index: number) => void;
  isReadOnly?: boolean;
};

/**
 * Componente 100% estático para renderizar itens sem nenhum flickering
 * Não depende do lifecycle do React nem do estado do formulário principal
 */
const StaticItemsRenderer: React.FC<StaticItemsRendererProps> = ({ 
  items, 
  onRemove,
  isReadOnly = false
}) => {
  // Estado interno COMPLETAMENTE isolado do formulário principal
  const [localItems, setLocalItems] = useState<Item[]>([]);
  const isInitialized = useRef(false);
  
  // Inicialização única para evitar loops e flickering
  useEffect(() => {
    if (isInitialized.current) return;
    
    if (items && items.length > 0) {
      console.log("🧊 StaticItemsRenderer: Inicializando com", items.length, "itens");
      setLocalItems(items);
      isInitialized.current = true;
    }
  }, [items]);
  
  // Atualização manual apenas quando o número de itens muda (adição/remoção)
  useEffect(() => {
    if (!isInitialized.current) return;
    
    // Verificar se houve mudança real no número de itens
    if (items.length !== localItems.length) {
      console.log("🧊 StaticItemsRenderer: Atualizando itens por mudança de quantidade", {
        anterior: localItems.length,
        novo: items.length
      });
      setLocalItems(items);
    }
  }, [items.length]);
  
  // Handler para remover item com validação extra
  const handleRemove = (index: number) => {
    console.log("🧊 StaticItemsRenderer: Solicitando remoção do item", index);
    
    // Verificar se temos a função de callback
    if (onRemove) {
      // Chamar o callback para remover no formulário original
      onRemove(index);
      
      // Atualizar nossa cópia local
      setLocalItems(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  // Se não temos itens, mostrar mensagem vazia
  if (!localItems.length) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>Nenhum item adicionado</p>
        <p className="text-xs">Utilize o formulário acima para adicionar itens</p>
      </div>
    );
  }
  
  // Renderizar os itens da nossa cópia local e isolada
  return (
    <div className="space-y-2">
      {localItems.map((item, index) => (
        <div key={item.id || index} className="rounded-md border p-3 relative">
          <div className="flex justify-between">
            <div className="flex-1">
              <h4 className="font-medium">{item.serviceName}</h4>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Quantidade: {item.quantity}</span>
              </div>
              {item.notes && (
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-medium">Observações:</span> {item.notes}
                </p>
              )}
            </div>
            {!isReadOnly && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900"
                onClick={() => handleRemove(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StaticItemsRenderer;