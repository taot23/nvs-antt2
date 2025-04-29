import React from 'react';
import { Package, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

// Componente específico para renderizar itens SEM flickering
// Este componente é completamente independente para evitar re-renderizações
const StaticItemsRenderer = React.memo(({ 
  items, 
  onRemove, 
  isReadOnly = false
}: { 
  items: any[],
  onRemove: (index: number) => void,
  isReadOnly?: boolean
}) => {
  console.log("🛑 SOLUÇÃO RADICAL: Renderizando StaticItemsRenderer com", items.length, "itens");
  
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>Nenhum item adicionado</p>
        <p className="text-xs">Utilize o formulário acima para adicionar itens</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={`static-item-${item.serviceId}-${index}`} className="rounded-md border p-3 relative">
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
}, (prevProps, nextProps) => {
  // Implementação customizada de comparação para memoização
  // Se o número de itens e os IDs são os mesmos, não renderiza novamente
  if (prevProps.items?.length !== nextProps.items?.length) {
    return false; // Renderizar se o número de itens mudou
  }
  
  // Verificação simples de IDs para evitar checks profundos
  const prevIds = prevProps.items?.map(i => i.serviceId)?.join('-') || '';
  const nextIds = nextProps.items?.map(i => i.serviceId)?.join('-') || '';
  
  return prevIds === nextIds; // Só re-renderiza se os IDs mudaram
});

export default StaticItemsRenderer;