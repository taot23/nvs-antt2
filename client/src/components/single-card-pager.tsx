import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getStatusLabel, getStatusVariant, getStatusStyle } from "@/lib/status-utils";

// Tipo para venda
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

// Interface para as props do componente
interface SingleCardPagerProps {
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

const SingleCardPager: React.FC<SingleCardPagerProps> = ({
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
  DevolveButton,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 mt-4 text-center text-red-500">
        <p>Erro ao carregar vendas: {error.message}</p>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="p-4 mt-4 text-center">
        <p className="text-muted-foreground">Nenhuma venda encontrada.</p>
      </div>
    );
  }
  
  const currentSale = data[currentIndex];
  const totalItems = data.length;
  
  // Função para ir para o próximo item
  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalItems);
  };
  
  // Função para ir para o item anterior
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalItems) % totalItems);
  };
  
  // Obter estilo de cor baseado no status
  const bgColor = 
    currentSale.status === 'pending' ? 'bg-slate-50' :
    currentSale.status === 'in_progress' ? 'bg-orange-50' :
    currentSale.status === 'completed' ? 'bg-green-50' :
    currentSale.status === 'returned' ? 'bg-red-50' :
    currentSale.status === 'corrected' ? 'bg-yellow-50' : 'bg-white';
  
  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      {/* Indicador de paginação */}
      <div className="flex justify-between items-center mb-2 px-2">
        <p className="text-xs text-muted-foreground">
          Venda {currentIndex + 1} de {totalItems}
        </p>
        <div className="flex items-center space-x-1">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={goToPrevious}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8"
            onClick={goToNext}
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Card da venda atual */}
      <div className={`border rounded-lg overflow-hidden flex-1 flex flex-col ${bgColor}`}>
        {/* Cabeçalho */}
        <div className="flex justify-between items-start p-4 border-b">
          <div>
            <h3 className="font-semibold">OS: {currentSale.orderNumber}</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(currentSale.date), 'dd/MM/yyyy', { locale: ptBR })}
            </p>
          </div>
          <div className={`${getStatusVariant(currentSale.status)} text-xs px-2 py-1 rounded-full`}>
            {getStatusLabel(currentSale.status)}
          </div>
        </div>
        
        {/* Conteúdo */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-3">
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
              <div>
                <p className="text-xs text-destructive font-medium mb-1">Motivo da Devolução</p>
                <p className="text-sm text-destructive">{currentSale.returnReason}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Rodapé com ações */}
        <div className="border-t p-3 gap-2 grid grid-cols-2">
          <Button 
            variant="default" 
            size="sm" 
            className="w-full"
            onClick={() => onViewDetails(currentSale)}
          >
            Detalhes
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => onViewHistory(currentSale)}
          >
            Histórico
          </Button>
          
          {/* Botões condicionais com base no papel do usuário e estado da venda */}
          {(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onEdit(currentSale)}
            >
              Editar
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
           (currentSale.status === "pending" || currentSale.status === "corrected") && (
            <Button 
              variant={currentSale.status === "corrected" ? "secondary" : "outline"}
              size="sm" 
              className="w-full"
              onClick={() => onStartExecution(currentSale)}
            >
              Iniciar
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
           currentSale.status === "in_progress" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onCompleteExecution(currentSale)}
            >
              Concluir
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
           (currentSale.status === "pending" || currentSale.status === "in_progress") && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-destructive border-destructive hover:bg-destructive/10"
              onClick={() => onReturnClick(currentSale)}
            >
              Devolver
            </Button>
          )}
          
          {currentSale.status === "returned" && (
            <div className="w-full">
              <ReenviaButton sale={currentSale} />
            </div>
          )}
          
          {currentSale.status === "corrected" && (
            <div className="w-full">
              <DevolveButton sale={currentSale} />
            </div>
          )}
          
          {(user?.role === "admin" || user?.role === "financeiro") && 
           currentSale.status === "completed" && 
           currentSale.financialStatus !== "paid" && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => onMarkAsPaid(currentSale)}
            >
              Pago
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "supervisor") && (
            <Button 
              variant="destructive" 
              size="sm" 
              className="w-full"
              onClick={() => onDeleteClick(currentSale)}
            >
              Excluir
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SingleCardPager;