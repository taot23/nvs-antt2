import React from "react";

/**
 * Componente totalmente estático para exibir itens de venda
 * Esta solução elimina completamente o flickering por não usar hooks ou estados
 */
export function StaticSaleItems({
  items = [],
  services = [],
  serviceTypes = [],
  readOnly = false,
}: {
  items: any[];
  services: any[];
  serviceTypes: any[];
  readOnly?: boolean;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="border rounded-md p-4 mt-4">
        <h3 className="font-medium mb-2">Itens da Venda</h3>
        <div className="flex justify-center items-center p-4 text-muted-foreground">
          Nenhum item adicionado.
        </div>
      </div>
    );
  }

  // Renderização totalmente estática, sem estado e sem efeitos
  return (
    <div className="border rounded-md p-4 mt-4">
      <h3 className="font-medium mb-2">Itens da Venda ({items.length})</h3>
      <div className="space-y-2">
        {items.map((item, index) => {
          const service = services.find((s) => s.id === item.serviceId);
          const serviceType = serviceTypes.find((t) => t.id === item.serviceTypeId);
          
          return (
            <div 
              key={`item-${index}-${item.serviceId}`} 
              className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded"
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="font-medium">
                    {service?.name || "Serviço não encontrado"}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Qtd: {item.quantity} | Tipo: {serviceType?.name || "Tipo não encontrado"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}