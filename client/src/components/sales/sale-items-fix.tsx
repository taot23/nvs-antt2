import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { sanitizeSaleItems, itemListsAreEqual, delay } from "@/utils/sale-items-utils";

interface SaleItemsFixProps {
  fields: any[];
  form: any;
  remove: (index: number) => void;
  services: any[];
  serviceTypes: any[];
  saleItems: any[];
  isLoadingItems: boolean;
  readOnly?: boolean;
  updateFormItems: (items: any[]) => void;
}

export function SaleItemsFix({
  fields, 
  form, 
  remove, 
  services, 
  serviceTypes, 
  saleItems,
  isLoadingItems,
  readOnly = false,
  updateFormItems
}: SaleItemsFixProps) {
  // Referência para controlar inicialização única e evitar flickering
  const itemsInitialized = useRef(false);
  
  // Referência para último estado conhecido de itens
  const lastItemsRef = useRef<any[]>([]);
  
  // Efeito anti-flickering com proteção contra atualizações desnecessárias
  useEffect(() => {
    const processItems = async () => {
      // Se não temos itens ou o componente está sendo desmontado, não fazer nada
      if (!saleItems || !Array.isArray(saleItems)) return;
      
      // Sanitizar itens para ter uma representação limpa
      const cleanItems = sanitizeSaleItems(saleItems);
      
      // Condições para pular a atualização:
      // 1. Se os itens já foram inicializados
      // 2. E o número de itens é o mesmo da última renderização
      // 3. E os itens são iguais em conteúdo aos itens já processados
      if (
        itemsInitialized.current && 
        fields.length === cleanItems.length &&
        itemListsAreEqual(lastItemsRef.current, cleanItems)
      ) {
        console.log("✅ SUPER ANTI-FLICKERING - Itens idênticos, pulando atualização");
        return;
      }
      
      // Se chegamos aqui, precisamos atualizar os itens
      console.log("🔄 SUPER ANTI-FLICKERING - Atualizando itens controladamente");
      
      // Aguardar para garantir estabilidade do DOM e evitar flickering
      await delay(50);
      
      // Remover todos os itens existentes primeiro (em um bloco try/catch para segurança)
      try {
        // Limpar o formulário completamente antes de adicionar novos itens
        if (fields.length > 0) {
          // Remover todos os itens existentes (do último para o primeiro para não afetar índices)
          for (let i = fields.length - 1; i >= 0; i--) {
            remove(i);
          }
          
          // Aguardar para garantir que os campos foram removidos
          await delay(10);
        }
        
        // Adicionar os novos itens sanitizados
        updateFormItems(cleanItems);
        
        // Guardar referência dos itens processados
        lastItemsRef.current = cleanItems;
        itemsInitialized.current = true;
        
        console.log("✅ SUPER ANTI-FLICKERING - Itens atualizados com sucesso");
      } catch (error) {
        console.error("❌ ERRO AO ATUALIZAR ITENS:", error);
      }
    };
    
    // Executar o processamento de forma segura
    processItems();
  }, [saleItems, fields.length, updateFormItems, remove]);
  
  return (
    <div className="border rounded-md p-4 mt-4">
      <h3 className="font-medium mb-2">Itens da Venda</h3>
      
      {/* Cabeçalho de Itens da Venda - simplificado */}
      <div className="text-xs text-muted-foreground text-right mb-2">
        {isLoadingItems ? "Carregando itens..." : `${fields.length} ${fields.length === 1 ? 'item' : 'itens'}`}
      </div>
      
      {fields.length === 0 ? (
        <div className="flex justify-center items-center p-4 text-muted-foreground">
          Nenhum item adicionado. Adicione um serviço abaixo.
        </div>
      ) : (
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
              <div className="flex-1">
                <div className="flex items-center">
                  <div className="font-medium">
                    {services.find((s: any) => s.id === field.serviceId)?.name || "Serviço não encontrado"}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Qtd: {field.quantity} | Tipo: {serviceTypes.find((t: any) => t.id === (field.serviceTypeId || form.getValues().serviceTypeId))?.name || "Tipo não encontrado"}
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {!readOnly && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => remove(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}