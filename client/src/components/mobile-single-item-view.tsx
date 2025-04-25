import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getStatusLabel, getStatusVariant } from "@/lib/status-utils";

type Sale = {
  id: number;
  orderNumber: string;
  date: string;
  customerId: number;
  customerName?: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  sellerId: number;
  sellerName?: string;
  serviceTypeId?: number | null;
  serviceTypeName?: string | null;
  serviceProviderId?: number | null;
  serviceProviderName?: string | null;
  totalAmount: string;
  status: string;
  executionStatus: string;
  financialStatus: string;
  notes: string | null;
  returnReason: string | null;
  responsibleOperationalId: number | null;
  responsibleFinancialId: number | null;
  createdAt: string;
  updatedAt: string;
};

interface MobileSingleItemViewProps {
  data: Sale[];
  isLoading: boolean;
  error: Error | null;
  onViewDetails: (sale: Sale) => void;
  onViewHistory: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  onStartExecution: (sale: Sale) => void;
  onCompleteExecution: (sale: Sale) => void;
  onReturnClick: (sale: Sale) => void;
  onMarkAsPaid: (sale: Sale) => void;
  onDeleteClick: (sale: Sale) => void;
  user: { id: number; username: string; role: string } | null;
  ReenviaButton: React.ComponentType<{ sale: Sale }>;
  DevolveButton: React.ComponentType<{ sale: Sale }>;
}

const MobileSingleItemView: React.FC<MobileSingleItemViewProps> = ({
  data,
  isLoading,
  error,
  onViewDetails,
  onViewHistory,
  onEdit,
  onStartExecution,
  onCompleteExecution,
  onReturnClick,
  onMarkAsPaid,
  onDeleteClick,
  user,
  ReenviaButton,
  DevolveButton
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Renderização para estados de carregamento e erro
  if (isLoading) {
    return (
      <div className="space-y-4 p-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <div className="flex justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Erro ao carregar vendas: {error.message}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Nenhuma venda encontrada.</p>
      </div>
    );
  }

  const currentSale = data[currentIndex];
  const statusVariant = getStatusVariant(currentSale.status);

  return (
    <div className="p-2">
      {/* Navegação superior */}
      <div className="flex justify-between items-center mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} de {data.length}
        </span>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goToNext}
          disabled={currentIndex === data.length - 1}
        >
          Próximo
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Card da venda atual */}
      <Card className={`mb-4 ${
        currentSale.status === 'pending' ? 'bg-slate-50' :
        currentSale.status === 'in_progress' ? 'bg-orange-50' :
        currentSale.status === 'completed' ? 'bg-green-50' :
        currentSale.status === 'returned' ? 'bg-red-50' :
        currentSale.status === 'corrected' ? 'bg-yellow-50' : ''
      }`}>
        <CardHeader className="flex flex-row justify-between items-start p-4 pb-2">
          <div>
            <h3 className="font-semibold text-base">OS: {currentSale.orderNumber}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(currentSale.date), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className={`${statusVariant} text-xs px-2 py-1 rounded-full`}>
            {getStatusLabel(currentSale.status)}
          </div>
        </CardHeader>
        
        <CardContent className="p-4 pt-2 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Cliente</p>
            <p className="text-sm">{currentSale.customerName}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Vendedor</p>
            <p className="text-sm">{currentSale.sellerName}</p>
          </div>
          
          <div>
            <p className="text-xs text-muted-foreground mb-1">Valor</p>
            <p className="text-sm font-medium">
              R$ {parseFloat(currentSale.totalAmount).toFixed(2).replace('.', ',')}
            </p>
          </div>
          
          {currentSale.serviceTypeName && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Tipo de Serviço</p>
              <p className="text-sm">{currentSale.serviceTypeName}</p>
            </div>
          )}
          
          {currentSale.serviceProviderName && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Prestador</p>
              <p className="text-sm">{currentSale.serviceProviderName}</p>
            </div>
          )}
          
          {currentSale.returnReason && (
            <div className="pt-2">
              <p className="text-xs text-destructive font-medium mb-1">Motivo da Devolução</p>
              <p className="text-sm text-destructive p-2 bg-red-50 rounded-md">{currentSale.returnReason}</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="p-4 pt-2 grid grid-cols-2 gap-2">
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onViewDetails(currentSale)}
            className="w-full"
          >
            Detalhes
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onViewHistory(currentSale)}
            className="w-full"
          >
            Histórico
          </Button>
          
          {/* Botões condicionais para cada tipo de usuário e estado da venda */}
          {(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onEdit(currentSale)}
              className="w-full"
            >
              Editar
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
            (currentSale.status === "pending" || currentSale.status === "corrected") && (
            <Button 
              variant={currentSale.status === "corrected" ? "secondary" : "outline"}
              size="sm" 
              onClick={() => onStartExecution(currentSale)}
              className="w-full"
            >
              Iniciar
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
            currentSale.status === "in_progress" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onCompleteExecution(currentSale)}
              className="w-full"
            >
              Concluir
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
            (currentSale.status === "pending" || currentSale.status === "in_progress") && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onReturnClick(currentSale)}
              className="w-full text-destructive border-destructive"
            >
              Devolver
            </Button>
          )}
          
          {currentSale.status === "returned" && (
            <div className="col-span-2">
              <ReenviaButton sale={currentSale} />
            </div>
          )}
          
          {currentSale.status === "corrected" && (
            <div className="col-span-2">
              <DevolveButton sale={currentSale} />
            </div>
          )}
          
          {(user?.role === "admin" || user?.role === "financeiro") && 
            currentSale.status === "completed" && 
            currentSale.financialStatus !== "paid" && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onMarkAsPaid(currentSale)}
              className="w-full"
            >
              Pago
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "supervisor") && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => onDeleteClick(currentSale)}
              className="w-full"
            >
              Excluir
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default MobileSingleItemView;