import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CalendarIcon, Edit, FileText, User, Users } from "lucide-react";
import { format } from "date-fns";
import { BasicSaleForm } from "./basic-sale-form";

interface ReturnedSaleHandlerProps {
  sale: any;
  onSuccess?: () => void;
}

/**
 * Componente especializado para lidar com vendas devolvidas
 * Usa nosso novo formulário básico para garantir a edição sem problemas
 */
export function ReturnedSaleHandler({ sale, onSuccess }: ReturnedSaleHandlerProps) {
  const [isBasicFormOpen, setIsBasicFormOpen] = useState(false);

  // Função para formatar data sem problemas de timezone
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "";
      
      // Para datas no formato ISO (YYYY-MM-DD)
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      }
      
      // Se a data incluir hora (formato ISO completo)
      if (dateString.includes('T')) {
        const parts = dateString.split('T')[0].split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts.map(Number);
          return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
      }
      
      // Fallback para o formato do date-fns
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  return (
    <>
      <Card className="border-orange-300 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <CardTitle className="text-lg">
                Venda #{sale.orderNumber} - {sale.customerName}
              </CardTitle>
              <CardDescription>
                Data: {formatDate(sale.date)} | Valor: R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
              </CardDescription>
            </div>
            <Badge variant="destructive" className="px-3 py-1 h-auto">
              Devolvida
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="pt-2 pb-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-1">Informações da Venda</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <User className="h-3.5 w-3.5 mr-1" /> 
                  <span>Vendedor: {sale.sellerName}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-3.5 w-3.5 mr-1" /> 
                  <span>Cliente: {sale.customerName}</span>
                </div>
                <div className="flex items-center">
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" /> 
                  <span>Criada em: {formatDate(sale.createdAt)}</span>
                </div>
                <div className="flex items-center">
                  <FileText className="h-3.5 w-3.5 mr-1" /> 
                  <span>Métod. Pagto: {sale.paymentMethodName}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-1 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1 text-red-500" /> 
                Motivo da Devolução
              </h4>
              <div className="bg-red-50 p-2 rounded border border-red-100 text-sm">
                {sale.returnReason || "Nenhum motivo especificado"}
              </div>
            </div>
          </div>
        </CardContent>
        
        <Separator className="my-2" />
        
        <CardFooter className="pt-1 pb-3 flex justify-between">
          <div className="text-xs text-muted-foreground">
            Atualizado em: {formatDate(sale.updatedAt)}
          </div>
          <Button 
            onClick={() => setIsBasicFormOpen(true)}
            size="sm"
            className="gap-1"
          >
            <Edit className="h-4 w-4" /> 
            Corrigir e Reenviar Venda
          </Button>
        </CardFooter>
      </Card>
      
      {/* Formulário simplificado para correção da venda */}
      <BasicSaleForm 
        open={isBasicFormOpen}
        onClose={() => setIsBasicFormOpen(false)}
        saleId={sale.id}
        onSaveSuccess={onSuccess}
      />
    </>
  );
}