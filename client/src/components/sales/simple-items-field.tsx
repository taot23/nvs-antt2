import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

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
  return (
    <div className="border rounded-md p-3 bg-white">
      <h3 className="font-medium text-sm mb-2">Itens da Venda</h3>
      
      {items && items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div 
              key={item.id || index} 
              className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-100"
            >
              <div className="flex-1">
                <div className="flex justify-between">
                  <span className="font-medium text-sm">{item.serviceName}</span>
                  <span className="text-sm text-gray-600">
                    {item.quantity} {item.quantity > 1 ? 'unidades' : 'unidade'}
                  </span>
                </div>
                {item.notes && (
                  <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                )}
              </div>
              
              {!isReadOnly && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-3 text-sm text-gray-500">
          Nenhum item adicionado
        </div>
      )}
    </div>
  );
}