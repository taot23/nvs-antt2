import React, { useMemo, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

/**
 * VERSÃO ULTRA-ESTÁVEL - MAIO 2025
 * Componente para exibir e gerenciar itens com prevenção total de piscagem
 * - Usa chaves completamente estáveis
 * - Implementa stabilidade de referência para evitar re-renderizações
 * - Evita mutação de estados durante ciclos de renderização
 * - Usa lista de refs para garantir continuidade visual
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

// Componente memorizado para o item individual com verificação de props
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
  // Criar uma referência para o item para identificar mudanças
  const itemRef = useRef(item);
  
  // Logar apenas quando realmente há diferenças (para depuração)
  useEffect(() => {
    if (JSON.stringify(itemRef.current) !== JSON.stringify(item)) {
      console.log(`🔄 ItemRow [${index}] atualizado:`, { 
        anterior: itemRef.current,
        novo: item
      });
      itemRef.current = item;
    }
  }, [item, index]);
  
  // SOLUÇÃO CRÍTICA: Gerar uma chave ultra-estável que nunca muda
  // Usar todos os dados disponíveis para criar uma chave que identifica exclusivamente este item
  const getStableKey = () => {
    if (item.id) return `item-${item.id}`;
    if (item.serviceId) return `service-${item.serviceId}-${index}`;
    return `idx-${index}-${item.serviceName.replace(/\s+/g, '')}`;
  };
  
  // SOLUÇÃO RADICAL: Memorizar a chave para nunca mudar
  const stableKey = useMemo(() => getStableKey(), [item.id, item.serviceId, index, item.serviceName]);
  
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
}, (prevProps, nextProps) => {
  // Função personalizada de comparação para evitar re-renderizações desnecessárias
  // Retornar true significa que o componente NÃO deve ser re-renderizado
  
  // Se o item tem ID, comparamos somente o ID e o index
  if (prevProps.item.id && nextProps.item.id) {
    const sameId = prevProps.item.id === nextProps.item.id;
    const sameIndex = prevProps.index === nextProps.index;
    const sameReadOnly = prevProps.isReadOnly === nextProps.isReadOnly;
    
    // Se tem o mesmo ID e está na mesma posição, não precisa re-renderizar
    if (sameId && sameIndex && sameReadOnly) {
      return true;
    }
  }
  
  // Compara todos os valores para decidir se precisa re-renderizar
  const sameService = prevProps.item.serviceId === nextProps.item.serviceId;
  const sameName = prevProps.item.serviceName === nextProps.item.serviceName;
  const sameQuantity = prevProps.item.quantity === nextProps.item.quantity;
  const sameNotes = prevProps.item.notes === nextProps.item.notes;
  const sameIndex = prevProps.index === nextProps.index;
  const sameReadOnly = prevProps.isReadOnly === nextProps.isReadOnly;
  
  // Se tudo é igual, não precisa re-renderizar
  return sameService && sameName && sameQuantity && sameNotes && sameIndex && sameReadOnly;
});

ItemRow.displayName = 'ItemRow';

export function SimpleItemsField({ 
  items = [], // Valor padrão para evitar erros quando items é undefined
  onRemove,
  isReadOnly = false
}: SimpleItemsFieldProps) {
  // Referência para os itens anteriores
  const previousItemsRef = useRef<any[]>([]);
  
  // SOLUÇÃO CRÍTICA: Referência para contagem de renderizações para debug
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  
  // Armazenar os itens em uma versão memoizada para evitar re-renderizações
  const memoizedItems = useMemo(() => {
    // Verificação adicional para garantir que items é array
    const safeItems = Array.isArray(items) ? items : [];
    
    // SOLUÇÃO CRÍTICA: Verificar se os itens mudaram para debug
    const prevItemsJson = JSON.stringify(previousItemsRef.current);
    const newItemsJson = JSON.stringify(safeItems);
    
    if (prevItemsJson !== newItemsJson) {
      console.log(`📋 SimpleItemsField - Itens alterados: de ${previousItemsRef.current.length} para ${safeItems.length} itens`);
      previousItemsRef.current = safeItems;
    }
    
    return safeItems;
  }, [items]);
  
  // Contador de itens para fins de depuração
  const itemCount = memoizedItems.length;
  
  // SOLUÇÃO RADICAL: Criar uma lista de render keys que nunca muda
  // Isso evita problemas de piscagem durante reordenação
  const renderKeys = useMemo(() => {
    return memoizedItems.map((item, index) => {
      if (item.id) return `stable-item-${item.id}`;
      if (item.serviceId) return `stable-service-${item.serviceId}-${index}`;
      return `stable-idx-${index}-${Date.now()}`;
    });
  }, [memoizedItems]);
  
  console.log(`🔢 SimpleItemsField - Renderização #${renderCountRef.current} com ${itemCount} itens`);
  
  return (
    <div className="border rounded-md p-3 bg-white">
      <h3 className="font-medium text-sm mb-2">
        Itens da Venda {itemCount > 0 && `(${itemCount})`}
      </h3>
      
      {memoizedItems.length > 0 ? (
        <div className="space-y-2">
          {memoizedItems.map((item, index) => (
            <ItemRow 
              key={renderKeys[index] || `backup-key-${index}`}
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