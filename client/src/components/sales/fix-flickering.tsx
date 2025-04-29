import React, { useState, useEffect, useRef } from 'react';
import { Package, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

// Componente EXTRA RADICAL para renderizar itens SEM flickering
// Este componente é completamente independente com sua própria cópia imutável dos dados
const StaticItemsRenderer = React.memo(({ 
  items, 
  onRemove, 
  isReadOnly = false
}: { 
  items: any[],
  onRemove: (index: number) => void,
  isReadOnly?: boolean
}) => {
  // Ref para rastrear se é a primeira renderização
  const isFirstRender = useRef(true);
  
  // Estado INTERNO que uma vez definido, NÃO MUDA MAIS!
  const [internalItems, setInternalItems] = useState<any[]>([]);
  
  // Efeito para inicializar os itens quando eles chegarem
  // Estamos permitindo que este efeito execute uma vez por componente E uma vez quando items mudar
  useEffect(() => {
    // Se não temos itens internos ou se os itens originais mudaram e não temos nada ainda
    if (internalItems.length === 0 && items.length > 0) {
      console.log("🛑 SOLUÇÃO ULTRA-RADICAL v2: Salvando cópia imutável de", items.length, "itens");
      
      // Cria uma deep copy dos itens para evitar qualquer referência ao original
      const itemsCopy = items.map(item => ({...item}));
      setInternalItems(itemsCopy);
      
      // Marca que não é mais a primeira renderização
      isFirstRender.current = false;
      
      // Adiciona uma marcação para debug
      setTimeout(() => {
        document.querySelectorAll('.static-item').forEach(item => {
          item.setAttribute('data-static-preserved', 'true');
        });
      }, 100);
    }
  }, [items, internalItems.length]);
  
  // Se não temos itens ainda, mostra indicador de carregamento mais "estável"
  if (internalItems.length === 0) {
    // Usa os items originais para mostrar vazio na primeira renderização
    if (items.length === 0) {
      return (
        <div className="text-center py-6 text-muted-foreground static-empty">
          <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>Nenhum item adicionado</p>
          <p className="text-xs">Utilize o formulário acima para adicionar itens</p>
        </div>
      );
    }
    
    // Enquanto os itens estão sendo copiados para o estado interno, mostra loading discreto
    return (
      <div className="space-y-2 static-loading">
        {items.map((item, index) => (
          <div key={`loading-item-${index}`} className="rounded-md border p-3 relative">
            <div className="flex justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{item.serviceName}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Quantidade: {item.quantity}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  // Renderiza a partir do estado interno que nunca muda após inicialização
  return (
    <div className="space-y-2 static-rendered">
      {internalItems.map((item, index) => (
        <div 
          key={`static-item-${item.serviceId}-${index}`} 
          className="rounded-md border p-3 relative static-item"
          data-item-id={item.serviceId}
          data-item-index={index}
        >
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
                onClick={() => onRemove(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}, () => {
  // SOLUÇÃO ULTRA-RADICAL: Sempre retorna true = NUNCA re-renderiza após a primeira vez
  return true;
});

export default StaticItemsRenderer;