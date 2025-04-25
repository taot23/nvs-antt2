import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Sale {
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
}

interface BasicMobileViewProps {
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
  onRefresh?: () => void;
}

const BasicMobileView: React.FC<BasicMobileViewProps> = ({
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
  onRefresh
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const itemsPerPage = 5;
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  
  // Get current page items
  const currentItems = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle refresh
  const handleRefresh = () => {
    if (onRefresh) {
      setRefreshing(true);
      onRefresh();
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  // Handle page change
  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prevPage => prevPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  // Format status for display
  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluída';
      case 'returned': return 'Devolvida';
      case 'corrected': return 'Corrigida';
      default: return status;
    }
  };

  // Get status color class
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-gray-100 text-gray-600';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'returned': return 'bg-red-100 text-red-700';
      case 'corrected': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Get border color class
  const getBorderClass = (status: string) => {
    switch(status) {
      case 'pending': return 'border-l-gray-400';
      case 'in_progress': return 'border-l-amber-500';
      case 'completed': return 'border-l-green-500';
      case 'returned': return 'border-l-red-500';
      case 'corrected': return 'border-l-yellow-500';
      default: return 'border-l-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 w-full h-60">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 m-2 bg-red-50 text-red-800 rounded-md border border-red-200">
        <h3 className="font-medium mb-1">Erro ao carregar vendas</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-4 m-2 bg-gray-50 text-gray-500 rounded-md border border-gray-200 text-center">
        Nenhuma venda encontrada
      </div>
    );
  }

  return (
    <div className="pb-16 max-w-md mx-auto">
      {/* Sales cards list */}
      {currentItems.map(sale => {
        const date = new Date(sale.date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        
        return (
          <div 
            key={sale.id}
            className={`bg-white rounded-lg shadow-sm m-2 p-3 border-l-4 ${getBorderClass(sale.status)}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-semibold text-sm">OS: {sale.orderNumber}</div>
                <div className="text-xs text-gray-500">{formattedDate}</div>
                <div className={`inline-block px-2 py-0.5 text-xs font-medium rounded mt-1 ${getStatusClass(sale.status)}`}>
                  {getStatusLabel(sale.status)}
                </div>
              </div>
              <div className="font-semibold text-sm">
                {parseFloat(sale.totalAmount).toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                })}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div>
                <div className="text-gray-500 text-[10px] mb-0.5">Cliente</div>
                <div className="truncate">{sale.customerName || `Cliente #${sale.customerId}`}</div>
              </div>
              <div>
                <div className="text-gray-500 text-[10px] mb-0.5">Vendedor</div>
                <div className="truncate">{sale.sellerName || `Vendedor #${sale.sellerId}`}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-1.5 mb-2">
              <button 
                onClick={() => onViewDetails(sale)} 
                className="text-xs px-2 py-1.5 bg-blue-600 text-white rounded border border-blue-700 font-medium"
              >
                Detalhes
              </button>
              <button 
                onClick={() => onViewHistory(sale)} 
                className="text-xs px-2 py-1.5 bg-gray-600 text-white rounded border border-gray-700 font-medium"
              >
                Histórico
              </button>
              {(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") ? (
                <button 
                  onClick={() => onEdit(sale)} 
                  className="text-xs px-2 py-1.5 bg-gray-100 text-gray-700 rounded border border-gray-300 font-medium"
                >
                  Editar
                </button>
              ) : <div></div>}
            </div>
            
            <div className="grid grid-cols-2 gap-1.5">
              {(user?.role === "admin" || user?.role === "operacional") && 
               (sale.status === "pending" || sale.status === "corrected") && (
                <button 
                  onClick={() => onStartExecution(sale)} 
                  className="text-xs px-2 py-1.5 bg-green-600 text-white rounded border border-green-700 font-medium"
                >
                  Iniciar
                </button>
              )}
              
              {(user?.role === "admin" || user?.role === "operacional") && 
               sale.status === "in_progress" && (
                <button 
                  onClick={() => onCompleteExecution(sale)} 
                  className="text-xs px-2 py-1.5 bg-green-600 text-white rounded border border-green-700 font-medium"
                >
                  Concluir
                </button>
              )}
              
              {(user?.role === "admin" || user?.role === "operacional") && 
               (sale.status === "pending" || sale.status === "in_progress") && (
                <button 
                  onClick={() => onReturnClick(sale)} 
                  className="text-xs px-2 py-1.5 bg-red-600 text-white rounded border border-red-700 font-medium"
                >
                  Devolver
                </button>
              )}
              
              {(user?.role === "admin" || user?.role === "financeiro") && 
               sale.status === "completed" && sale.financialStatus !== "paid" && (
                <button 
                  onClick={() => onMarkAsPaid(sale)} 
                  className="text-xs px-2 py-1.5 bg-green-600 text-white rounded border border-green-700 font-medium"
                >
                  Pago
                </button>
              )}
              
              {(user?.role === "admin" || user?.role === "supervisor") && (
                <button 
                  onClick={() => onDeleteClick(sale)} 
                  className="text-xs px-2 py-1.5 bg-red-600 text-white rounded border border-red-700 font-medium"
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-between items-center p-2 z-10">
        <button 
          onClick={goToPrevPage}
          disabled={currentPage <= 1}
          className={`px-3 py-1.5 text-sm font-medium rounded border ${currentPage <= 1 ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
        >
          Anterior
        </button>
        <div className="text-sm font-medium">
          {currentPage} / {totalPages}
        </div>
        <button 
          onClick={goToNextPage}
          disabled={currentPage >= totalPages}
          className={`px-3 py-1.5 text-sm font-medium rounded border ${currentPage >= totalPages ? 'bg-gray-100 text-gray-400 border-gray-200' : 'bg-gray-100 text-gray-700 border-gray-300'}`}
        >
          Próxima
        </button>
      </div>
    </div>
  );
};

export default BasicMobileView;