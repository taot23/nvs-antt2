import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  ChevronRight,
  Eye, 
  History, 
  Edit, 
  Play,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Trash,
  RefreshCw
} from "lucide-react";
import { getStatusLabel } from "@/lib/status-utils";
import { Sale } from "@shared/schema";

// Interface para venda com campos adicionais
interface EnrichedSale extends Sale {
  customerName?: string;
  paymentMethodName?: string;
  sellerName?: string;
  serviceTypeName?: string | null;
  serviceProviderName?: string | null;
}

interface UltraMinimalMobileViewProps {
  data: EnrichedSale[];
  isLoading: boolean;
  error: Error | null;
  onViewDetails: (sale: EnrichedSale) => void;
  onViewHistory: (sale: EnrichedSale) => void;
  onEdit: (sale: EnrichedSale) => void;
  onStartExecution: (sale: EnrichedSale) => void;
  onCompleteExecution: (sale: EnrichedSale) => void;
  onReturnClick: (sale: EnrichedSale) => void;
  onMarkAsPaid: (sale: EnrichedSale) => void;
  onDeleteClick: (sale: EnrichedSale) => void;
  user: { id: number; username: string; role: string } | null;
  ReenviaButton: React.ComponentType<{ sale: EnrichedSale | Sale }>;
  DevolveButton: React.ComponentType<{ sale: EnrichedSale | Sale }>;
  onRefresh?: () => void;
}

// Componente extremamente minimalista para dispositivos móveis
export const UltraMinimalMobileView: React.FC<UltraMinimalMobileViewProps> = ({
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
  onRefresh
}) => {
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 3; // Extremamente reduzido para garantir performance
  
  // Calcular o total de páginas
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  
  // Obter os itens da página atual
  const currentItems = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  // Função para mudar de página
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      // Scroll suave para o topo
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Função para atualizar os dados
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };
  
  // Cores para status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 border-gray-300';
      case 'in_progress': return 'bg-orange-50 border-orange-200';
      case 'completed': return 'bg-green-50 border-green-200';
      case 'returned': return 'bg-red-50 border-red-200';
      case 'corrected': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };
  
  // Badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-200 text-slate-700';
      case 'in_progress': return 'bg-orange-200 text-orange-700';
      case 'completed': return 'bg-green-200 text-green-700';
      case 'returned': return 'bg-red-200 text-red-700';
      case 'corrected': return 'bg-yellow-200 text-yellow-700';
      default: return 'bg-gray-200 text-gray-700';
    }
  };
  
  // Estados de loading e erro
  if (isLoading) {
    return (
      <div className="p-2 space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-3 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-2">
        <Card className="p-3 bg-red-50 border-red-200 text-red-700">
          <p className="font-semibold">Erro ao carregar vendas</p>
          <p className="text-sm">{error.message}</p>
        </Card>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="p-2">
        <Card className="p-3 text-center">
          <p className="text-gray-500">Nenhuma venda encontrada</p>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-[calc(100vh-220px)]">
      {/* Cabeçalho com navegação */}
      <div className="sticky top-0 z-10 bg-white border-b p-2 flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => goToPage(page - 1)} 
          disabled={page === 1}
          className="px-1"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-xs text-center">
          <span className="font-medium">Página {page} de {totalPages}</span>
          <div className="text-muted-foreground text-[10px]">
            {(page - 1) * itemsPerPage + 1}-{Math.min(page * itemsPerPage, data.length)} de {data.length}
          </div>
        </div>
        
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-1"
          >
            <RefreshCw className={`h-3 w-3 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => goToPage(page + 1)} 
            disabled={page === totalPages}
            className="px-1"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Lista de cartões */}
      <div className="flex-grow pb-16 pt-1">
        {currentItems.map((sale) => (
          <div 
            key={sale.id} 
            className={`m-2 border rounded-md overflow-hidden ${getStatusColor(sale.status)}`}
          >
            <div className="p-3">
              {/* Header */}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-medium text-sm">OS: {sale.orderNumber}</span>
                    <Badge className={getStatusBadge(sale.status)}>
                      {getStatusLabel(sale.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <span className="text-sm font-medium">
                  R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              {/* Cliente e Vendedor */}
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-3 text-xs">
                <div>
                  <p className="text-[10px] text-gray-500">Cliente</p>
                  <p className="truncate">{sale.customerName || `Cliente #${sale.customerId}`}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500">Vendedor</p>
                  <p className="truncate">{sale.sellerName || `Vendedor #${sale.sellerId}`}</p>
                </div>
              </div>
              
              {/* Ações */}
              <div className="grid grid-cols-3 gap-1 mb-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => onViewDetails(sale)}
                  className="flex items-center justify-center h-7"
                >
                  <Eye className="h-3 w-3 mr-1" /> Detalhes
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onViewHistory(sale)}
                  className="flex items-center justify-center h-7"
                >
                  <History className="h-3 w-3 mr-1" /> Histórico
                </Button>
                
                {(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(sale)}
                    className="flex items-center justify-center h-7"
                  >
                    <Edit className="h-3 w-3 mr-1" /> Editar
                  </Button>
                )}
              </div>
              
              {/* Segunda linha de ações */}
              <div className="grid grid-cols-2 gap-1">
                {/* Operacional ou Admin */}
                {(user?.role === "admin" || user?.role === "operacional") && (
                  <>
                    {/* Iniciar */}
                    {(sale.status === "pending" || sale.status === "corrected") && (
                      <Button
                        variant={sale.status === "corrected" ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => onStartExecution(sale)}
                        className="flex items-center justify-center h-7"
                      >
                        <Play className="h-3 w-3 mr-1" /> Iniciar
                      </Button>
                    )}
                    
                    {/* Concluir */}
                    {sale.status === "in_progress" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCompleteExecution(sale)}
                        className="flex items-center justify-center h-7"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Concluir
                      </Button>
                    )}
                    
                    {/* Devolver */}
                    {(sale.status === "pending" || sale.status === "in_progress") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReturnClick(sale)}
                        className="flex items-center justify-center h-7 text-red-500 border-red-200"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" /> Devolver
                      </Button>
                    )}
                  </>
                )}
                
                {/* Financeiro ou Admin */}
                {(user?.role === "admin" || user?.role === "financeiro") && 
                  sale.status === "completed" && 
                  sale.financialStatus !== "paid" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMarkAsPaid(sale)}
                    className="flex items-center justify-center h-7"
                  >
                    <DollarSign className="h-3 w-3 mr-1" /> Pago
                  </Button>
                )}
                
                {/* Admin ou Supervisor */}
                {(user?.role === "admin" || user?.role === "supervisor") && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDeleteClick(sale)}
                    className="flex items-center justify-center h-7"
                  >
                    <Trash className="h-3 w-3 mr-1" /> Excluir
                  </Button>
                )}
              </div>
              
              {/* Botões condicionais (Reenvia/Devolve) */}
              {sale.status === "returned" && (
                <div className="mt-2">
                  <ReenviaButton sale={sale} />
                </div>
              )}
              
              {sale.status === "corrected" && (
                <div className="mt-2">
                  <DevolveButton sale={sale} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Barra de paginação fixada na parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t flex justify-between items-center p-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page - 1)}
          disabled={page === 1}
          className="h-9 px-3"
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        
        <span className="text-sm">
          {page} / {totalPages}
        </span>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(page + 1)}
          disabled={page === totalPages}
          className="h-9 px-3"
        >
          Próxima <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

export default UltraMinimalMobileView;