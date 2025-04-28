import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

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
  // Estado para forçar renderização
  const [forceUpdateCounter, setForceUpdateCounter] = useState(0);
  
  // Efeito para verificar se precisamos atualizar os campos quando itens estiverem disponíveis
  useEffect(() => {
    if (fields.length === 0 && saleItems && saleItems.length > 0) {
      console.log("🔄 Detectada inconsistência na inicialização - Atualizando itens");
      updateFormItems(saleItems);
      
      // Força atualização do componente após 200ms
      setTimeout(() => {
        setForceUpdateCounter(prev => prev + 1);
      }, 200);
    }
  }, [fields.length, saleItems, updateFormItems, setForceUpdateCounter]);
  
  return (
    <div className="border rounded-md p-4 mt-4">
      <h3 className="font-medium mb-2">Itens da Venda</h3>
      
      <div className="flex items-center justify-between mb-2">
        <div>
          {!readOnly && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                // Função de diagnóstico que mostra o estado atual do formulário
                console.log("🔎 DIAGNÓSTICO: Estado atual do formulário:", form.getValues());
                console.log("🔎 DIAGNÓSTICO: Itens no formulário:", form.getValues().items);
                console.log("🔎 DIAGNÓSTICO: Campos controlados:", fields);
                
                toast({
                  title: "Estado do formulário",
                  description: `Há ${fields.length} item(s) no formulário`,
                  className: "top-toast",
                });
                
                // Se não há campos, mas há itens nos dados carregados, vamos forçar a atualização
                if (fields.length === 0 && saleItems && saleItems.length > 0) {
                  console.log("⚠️ Detectada inconsistência: Itens existem mas não estão no formulário");
                  updateFormItems(saleItems);
                  setForceUpdateCounter(prev => prev + 1);
                  
                  toast({
                    title: "Correção automática",
                    description: `Recuperados ${saleItems.length} item(s) da venda`,
                    className: "top-toast",
                  });
                }
              }}
            >
              Verificar Itens ({fields.length})
            </Button>
          )}
        </div>
        
        <div className="text-xs text-muted-foreground">
          {isLoadingItems ? "Carregando itens..." : `${saleItems?.length || 0} itens carregados`}
        </div>
      </div>
      
      {/* Número de renderizações (para debug) */}
      <div className="text-xs text-muted-foreground mb-2 hidden">
        Renderização #{forceUpdateCounter}
      </div>
      
      {fields.length === 0 ? (
        <div className="flex justify-center items-center p-4 text-muted-foreground">
          Nenhum item adicionado. {saleItems && saleItems.length > 0 ? 
            "Há itens disponíveis, mas não foram carregados corretamente." : 
            "Adicione um serviço abaixo."
          }
          
          {saleItems && saleItems.length > 0 && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="ml-2"
              onClick={() => {
                updateFormItems(saleItems);
                setForceUpdateCounter(prev => prev + 1);
              }}
            >
              Recuperar Itens
            </Button>
          )}
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