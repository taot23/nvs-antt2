import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp, 
  MoreVertical,
  Eye, 
  History, 
  Edit, 
  Play,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Trash
} from "lucide-react";
import { getStatusLabel } from "@/lib/status-utils";
import { Sale } from "@shared/schema";

// Interface para venda com campos adicionais preenchidos pelo frontend
interface EnrichedSale extends Sale {
  customerName?: string;
  paymentMethodName?: string;
  sellerName?: string;
  serviceTypeName?: string | null;
  serviceProviderName?: string | null;
}

interface MobileSalesViewProps {
  data: EnrichedSale[];
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
  ReenviaButton: React.ComponentType<{ sale: EnrichedSale | Sale }>;
  DevolveButton: React.ComponentType<{ sale: EnrichedSale | Sale }>;
}

const MobileSalesView: React.FC<MobileSalesViewProps> = ({
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
  const [expandedSaleId, setExpandedSaleId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;
  const containerRef = useRef<HTMLDivElement>(null);

  // Calcular o total de páginas
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  // Obter os itens da página atual
  const currentItems = data.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Função para mudar de página
  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setExpandedSaleId(null); // Colapsar todos os itens ao mudar de página
      
      // Rolar para o topo do container
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    }
  };

  // Função para alternar a expansão de um item
  const toggleExpand = (id: number) => {
    setExpandedSaleId(expandedSaleId === id ? null : id);
  };

  // Função para obter classe de status
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-50 border-slate-200';
      case 'in_progress': return 'bg-orange-50 border-orange-200';
      case 'completed': return 'bg-green-50 border-green-200';
      case 'returned': return 'bg-red-50 border-red-200';
      case 'corrected': return 'bg-yellow-50 border-yellow-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Função para obter classe de badge de status
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-slate-200 hover:bg-slate-300 text-slate-700';
      case 'in_progress': return 'bg-orange-200 hover:bg-orange-300 text-orange-700';
      case 'completed': return 'bg-green-200 hover:bg-green-300 text-green-700';
      case 'returned': return 'bg-red-200 hover:bg-red-300 text-red-700';
      case 'corrected': return 'bg-yellow-200 hover:bg-yellow-300 text-yellow-700';
      default: return 'bg-gray-200 hover:bg-gray-300 text-gray-700';
    }
  };

  // Estados de loading e erro
  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-500 text-center border rounded-lg bg-red-50 m-2">
        <p className="font-medium">Erro ao carregar vendas</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-4 text-center border rounded-lg bg-slate-50 m-2">
        <p className="text-gray-500">Nenhuma venda encontrada</p>
      </div>
    );
  }

  return (
    <div className="pb-16" ref={containerRef}>
      {/* Lista de vendas */}
      <div className="space-y-3 px-2 pt-1 pb-3">
        {currentItems.map((sale: EnrichedSale) => (
          <div
            key={sale.id}
            className={`border rounded-lg overflow-hidden shadow-sm ${getStatusColorClass(sale.status)}`}
          >
            {/* Cabeçalho do card - sempre visível */}
            <div 
              className="p-3 flex justify-between items-center cursor-pointer" 
              onClick={() => toggleExpand(sale.id)}
            >
              <div>
                <div className="flex gap-2 items-center">
                  <span className="font-medium">OS: {sale.orderNumber}</span>
                  <Badge className={getStatusBadgeClass(sale.status)}>
                    {getStatusLabel(sale.status)}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500">
                  {format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR })}
                </p>
              </div>
              <div className="flex items-center">
                <span className="text-sm font-medium mr-2">
                  R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
                </span>
                {expandedSaleId === sale.id ? (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                )}
              </div>
            </div>
            
            {/* Conteúdo expandido */}
            {expandedSaleId === sale.id && (
              <div className="px-3 pb-3 pt-0 border-t border-gray-100">
                {/* Informações detalhadas */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Cliente</p>
                    <p>{sale.customerName || `Cliente #${sale.customerId}`}</p>
                  </div>
                  
                  <div>
                    <p className="text-xs text-gray-500">Vendedor</p>
                    <p>{sale.sellerName || `Vendedor #${sale.sellerId}`}</p>
                  </div>
                  
                  {sale.serviceTypeId && (
                    <div>
                      <p className="text-xs text-gray-500">Tipo de Serviço</p>
                      <p>{sale.serviceTypeName || `Tipo #${sale.serviceTypeId}`}</p>
                    </div>
                  )}
                  
                  {sale.serviceProviderId && (
                    <div>
                      <p className="text-xs text-gray-500">Prestador</p>
                      <p>{sale.serviceProviderName || `Prestador #${sale.serviceProviderId}`}</p>
                    </div>
                  )}
                </div>
                
                {/* Motivo da devolução (se existir) */}
                {sale.returnReason && (
                  <div className="mb-3 p-2 bg-red-50 border border-red-100 rounded text-sm">
                    <p className="text-xs font-medium text-red-600 mb-1">Motivo da Devolução</p>
                    <p className="text-red-600">{sale.returnReason}</p>
                  </div>
                )}
                
                {/* Ações principais */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewDetails(sale);
                    }}
                    className="flex items-center justify-center"
                  >
                    <Eye className="h-4 w-4 mr-1" /> Detalhes
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewHistory(sale);
                    }}
                    className="flex items-center justify-center"
                  >
                    <History className="h-4 w-4 mr-1" /> Histórico
                  </Button>
                </div>
                
                {/* Ações de acordo com o perfil/status */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Editar para admin, supervisor ou vendedor */}
                  {(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(sale);
                      }}
                      className="flex items-center justify-center"
                    >
                      <Edit className="h-4 w-4 mr-1" /> Editar
                    </Button>
                  )}
                  
                  {/* Iniciar para admin ou operacional */}
                  {(user?.role === "admin" || user?.role === "operacional") && 
                    (sale.status === "pending" || sale.status === "corrected") && (
                    <Button
                      variant={sale.status === "corrected" ? "secondary" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartExecution(sale);
                      }}
                      className="flex items-center justify-center"
                    >
                      <Play className="h-4 w-4 mr-1" /> Iniciar
                    </Button>
                  )}
                  
                  {/* Concluir para admin ou operacional */}
                  {(user?.role === "admin" || user?.role === "operacional") && 
                    sale.status === "in_progress" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCompleteExecution(sale);
                      }}
                      className="flex items-center justify-center"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" /> Concluir
                    </Button>
                  )}
                  
                  {/* Devolver para admin ou operacional */}
                  {(user?.role === "admin" || user?.role === "operacional") && 
                    (sale.status === "pending" || sale.status === "in_progress") && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onReturnClick(sale);
                      }}
                      className="flex items-center justify-center text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                    >
                      <AlertTriangle className="h-4 w-4 mr-1" /> Devolver
                    </Button>
                  )}
                  
                  {/* Marcar como pago para admin ou financeiro */}
                  {(user?.role === "admin" || user?.role === "financeiro") && 
                    sale.status === "completed" && 
                    sale.financialStatus !== "paid" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkAsPaid(sale);
                      }}
                      className="flex items-center justify-center"
                    >
                      <DollarSign className="h-4 w-4 mr-1" /> Pago
                    </Button>
                  )}
                  
                  {/* Excluir para admin ou supervisor */}
                  {(user?.role === "admin" || user?.role === "supervisor") && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(sale);
                      }}
                      className="flex items-center justify-center"
                    >
                      <Trash className="h-4 w-4 mr-1" /> Excluir
                    </Button>
                  )}
                </div>
                
                {/* Botões dinâmicos (Reenvia/Devolve) */}
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
            )}
          </div>
        ))}
      </div>
      
      {/* Paginação fixa na parte inferior da tela */}
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
          Página {page} de {totalPages}
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

export default MobileSalesView;