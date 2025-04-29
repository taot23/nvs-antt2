import React, { useState } from 'react';
import { BasicSaleForm } from './basic-sale-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface ReturnedSaleHandlerProps {
  sale: any;
  onSuccess?: () => void;
}

/**
 * Componente especializado para lidar com vendas devolvidas
 * Usa nosso novo formulário básico para garantir a edição sem problemas
 */
export function ReturnedSaleHandler({ sale, onSuccess }: ReturnedSaleHandlerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  if (!sale || sale.status !== 'returned') {
    return null;
  }
  
  return (
    <>
      <div className="bg-amber-50 border border-amber-200 rounded-md p-4 my-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-medium text-amber-800">
              Venda Devolvida
              <Badge variant="outline" className="ml-2 text-amber-600 border-amber-300">
                Número: {sale.orderNumber}
              </Badge>
            </h3>
            <p className="text-amber-700 mt-1 text-sm">
              Esta venda foi devolvida e precisa ser corrigida antes de ser reenviada.
            </p>
            {sale.returnReason && (
              <div className="mt-2">
                <p className="text-xs text-amber-600 font-medium">Motivo da devolução:</p>
                <p className="text-sm bg-amber-100 p-2 rounded mt-1">
                  {sale.returnReason}
                </p>
              </div>
            )}
            <div className="mt-3">
              <Button 
                size="sm" 
                onClick={() => setIsFormOpen(true)}
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-100 hover:text-amber-900"
              >
                Corrigir e Reenviar Venda
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Nosso formulário simplificado */}
      <BasicSaleForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        saleId={sale.id}
        onSaveSuccess={onSuccess}
      />
    </>
  );
}