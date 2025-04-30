import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

/**
 * Componente ultra simples para exibir e gerenciar itens de venda
 * Com memoização para evitar re-renderizações desnecessárias
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

// Componente memorizado para o item individual
const ItemRow = React.memo(({ 
  item, 
  index, 
  onRemove, 
  isReadOnly 
}: { 
  item: SimpleItemsFieldProps['items'][0], 
  index: number, 
  onRemove: (index: number) => void,
  isReadOnly: boolean
}) => {
  // Usar serviceId+index como chave estável quando o ID não estiver disponível
  const stableKey = item.id ? `item-${item.id}` : `service-${item.serviceId}-${index}`;
  
  return (
    <div 
      key={stableKey}
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
  );
});

ItemRow.displayName = 'ItemRow';

export function SimpleItemsField({ 
  items = [], // Valor padrão para evitar erros quando items é undefined
  onRemove,
  isReadOnly = false
}: SimpleItemsFieldProps) {
  // Armazenar os itens em uma versão memoizada para evitar re-renderizações
  const memoizedItems = useMemo(() => {
    // Verificação adicional para garantir que items é array
    return Array.isArray(items) ? items : [];
  }, [items]);
  
  // Contador de itens para fins de depuração
  const itemCount = memoizedItems.length;
  
  return (
    <div className="border rounded-md p-3 bg-white">
      <h3 className="font-medium text-sm mb-2">
        Itens da Venda {itemCount > 0 && `(${itemCount})`}
      </h3>
      
      {memoizedItems.length > 0 ? (
        <div className="space-y-2">
          {memoizedItems.map((item, index) => (
            <ItemRow 
              key={item.id ? `item-${item.id}` : `service-${item.serviceId}-${index}`}
              item={item}
              index={index}
              onRemove={onRemove}
              isReadOnly={isReadOnly}
            />
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