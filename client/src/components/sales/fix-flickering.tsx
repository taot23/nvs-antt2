import React, { useState, useEffect, useRef } from 'react';
import { Package, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";

// Versão simplificada para resolver erros
const StaticItemsRenderer = React.memo(({ 
  items, 
  onRemove, 
  isReadOnly = false
}: { 
  items: any[],
  onRemove: (index: number) => void,
  isReadOnly?: boolean
}) => {
  // Versão simplificada que renderiza diretamente os itens sem processamento adicional
  
  // Se não temos itens, mostra indicador vazio
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground static-empty">
        <Package className="h-12 w-12 mx-auto mb-2 opacity-20" />
        <p>Nenhum item adicionado</p>
        <p className="text-xs">Utilize o formulário acima para adicionar itens</p>
      </div>
    );
  }
  
  // Renderiza os itens diretamente
  return (
    <div className="space-y-2 static-rendered">
      {items.map((item, index) => {
        if (!item) return null;
        
        return (
          <div 
            key={`static-item-${index}`} 
            className="rounded-md border p-3 relative static-item"
          >
            <div className="flex justify-between">
              <div className="flex-1">
                <h4 className="font-medium">{item.serviceName || 'Serviço'}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Quantidade: {item.quantity || 1}</span>
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
        );
      })}
    </div>
  );
});

export default StaticItemsRenderer;