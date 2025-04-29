import React from 'react';
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

/**
 * Componente ultra simples para exibir e gerenciar itens de venda
 * Sem lógica complexa ou estados internos
 */
interface SimpleItemsFieldProps {
  items: Array<{
    id: string | number;
    serviceId: number;
    serviceName: string;
    quantity: number;
    notes?: string;
  }>;
  onRemove: (index: number) => void;
  isReadOnly?: boolean;
}

export function SimpleItemsField({ 
  items, 
  onRemove, 
  isReadOnly = false 
}: SimpleItemsFieldProps) {
  if (!items || items.length === 0) {
    return (
      <div className="bg-gray-50 p-3 rounded-md text-center text-gray-500">
        Nenhum item adicionado
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div 
          key={item.id || index} 
          className="flex items-center justify-between bg-white p-2 rounded-md border"
        >
          <div className="flex-1">
            <div className="font-medium">{item.serviceName}</div>
            <div className="text-sm text-gray-500">
              Quantidade: {item.quantity}
              {item.notes && <span> - {item.notes}</span>}
            </div>
          </div>

          {!isReadOnly && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}