import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface SuperBasicMobileViewProps {
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

const SuperBasicMobileView: React.FC<SuperBasicMobileViewProps> = ({
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

  if (isLoading) {
    return <div className="p-4">Carregando...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Erro: {error.message}</div>;
  }

  if (!data || data.length === 0) {
    return <div className="p-4">Nenhuma venda encontrada.</div>;
  }

  const currentSale = data[currentIndex];

  // Funções de navegação
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

  // Funções para determinar classes de status
  const getStatusBg = (status: string) => {
    if (status === 'pending') return 'bg-slate-100';
    if (status === 'in_progress') return 'bg-orange-100';
    if (status === 'completed') return 'bg-green-100';
    if (status === 'returned') return 'bg-red-100';
    if (status === 'corrected') return 'bg-yellow-100';
    return 'bg-white';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'pending') return 'bg-slate-200 text-slate-800';
    if (status === 'in_progress') return 'bg-orange-200 text-orange-800';
    if (status === 'completed') return 'bg-green-200 text-green-800';
    if (status === 'returned') return 'bg-red-200 text-red-800';
    if (status === 'corrected') return 'bg-yellow-200 text-yellow-800';
    return 'bg-slate-200 text-slate-800';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Navegação */}
      <div className="flex justify-between items-center mb-2 px-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="h-8"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        
        <span className="text-sm px-2">
          {currentIndex + 1} de {data.length}
        </span>
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={goToNext}
          disabled={currentIndex === data.length - 1}
          className="h-8"
        >
          Próximo <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Card da venda atual - design super simples */}
      <div className={`${getStatusBg(currentSale.status)} border rounded-lg p-4 mb-4`}>
        {/* Cabeçalho */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold">OS: {currentSale.orderNumber}</h3>
            <p className="text-sm text-gray-600">
              {format(new Date(currentSale.date), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          <Badge className={getStatusBadge(currentSale.status)}>
            {getStatusLabel(currentSale.status)}
          </Badge>
        </div>

        {/* Informações */}
        <div className="space-y-2 mb-4">
          <div>
            <p className="text-xs text-gray-500">Cliente</p>
            <p>{currentSale.customerName}</p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500">Vendedor</p>
            <p>{currentSale.sellerName}</p>
          </div>
          
          <div>
            <p className="text-xs text-gray-500">Valor</p>
            <p className="font-medium">R$ {parseFloat(currentSale.totalAmount).toFixed(2).replace('.', ',')}</p>
          </div>
          
          {currentSale.serviceTypeName && (
            <div>
              <p className="text-xs text-gray-500">Tipo de Serviço</p>
              <p>{currentSale.serviceTypeName}</p>
            </div>
          )}
          
          {currentSale.returnReason && (
            <div className="bg-red-50 p-2 rounded border border-red-200 mt-2">
              <p className="text-xs text-red-500 font-medium">Motivo da Devolução</p>
              <p className="text-sm text-red-600">{currentSale.returnReason}</p>
            </div>
          )}
        </div>

        {/* Ações principais sempre visíveis */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Button 
            variant="default" 
            onClick={() => onViewDetails(currentSale)}
            className="h-9 px-2 text-sm"
          >
            Detalhes
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => onViewHistory(currentSale)}
            className="h-9 px-2 text-sm"
          >
            Histórico
          </Button>
        </div>

        {/* Ações condicionais */}
        <div className="grid grid-cols-2 gap-2">
          {(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") && (
            <Button 
              variant="outline" 
              onClick={() => onEdit(currentSale)}
              className="h-9 px-2 text-sm"
            >
              Editar
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
            (currentSale.status === "pending" || currentSale.status === "corrected") && (
            <Button 
              variant={currentSale.status === "corrected" ? "secondary" : "outline"}
              onClick={() => onStartExecution(currentSale)}
              className="h-9 px-2 text-sm"
            >
              Iniciar
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
            currentSale.status === "in_progress" && (
            <Button 
              variant="outline" 
              onClick={() => onCompleteExecution(currentSale)}
              className="h-9 px-2 text-sm"
            >
              Concluir
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
            (currentSale.status === "pending" || currentSale.status === "in_progress") && (
            <Button 
              variant="outline" 
              onClick={() => onReturnClick(currentSale)}
              className="h-9 px-2 text-sm border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              Devolver
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "financeiro") && 
            currentSale.status === "completed" && 
            currentSale.financialStatus !== "paid" && (
            <Button 
              variant="outline" 
              onClick={() => onMarkAsPaid(currentSale)}
              className="h-9 px-2 text-sm"
            >
              Pago
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "supervisor") && (
            <Button 
              variant="destructive" 
              onClick={() => onDeleteClick(currentSale)}
              className="h-9 px-2 text-sm"
            >
              Excluir
            </Button>
          )}
        </div>
        
        {/* Botões de workflow dinâmicos */}
        {currentSale.status === "returned" && (
          <div className="mt-2">
            <ReenviaButton sale={currentSale} />
          </div>
        )}
        
        {currentSale.status === "corrected" && (
          <div className="mt-2">
            <DevolveButton sale={currentSale} />
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperBasicMobileView;