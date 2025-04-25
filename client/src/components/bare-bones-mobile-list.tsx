import React, { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getStatusLabel, getStatusVariant, getStatusStyle } from "@/lib/status-utils";
import { Eye, History, Edit, CornerDownRight, CheckCircle2, Banknote, Trash2, AlertTriangle, ArrowLeft } from "lucide-react";

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
interface BareBonesMobileListProps {
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

const BareBonesMobileList: React.FC<BareBonesMobileListProps> = ({
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
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Adicionar classes especiais ao body para melhorar rolagem em dispositivos móveis
    document.body.classList.add('mobile-view-active');

    // Limpar ao desmontar
    return () => {
      document.body.classList.remove('mobile-view-active');
    };
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 text-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Erro ao carregar dados: {error.message}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="p-4 text-center">
        <p>Nenhuma venda encontrada.</p>
      </div>
    );
  }

  return (
    <div 
      ref={listRef} 
      className="bare-bones-container" 
      style={{
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
        height: 'calc(100vh - 230px)',
        maxHeight: 'calc(100vh - 230px)',
        paddingBottom: '20px',
        touchAction: 'pan-y',
        position: 'relative',
        zIndex: 1,
        transform: 'translateZ(0)',
        willChange: 'transform',
        backfaceVisibility: 'hidden',
      }}
    >
      {data.map((sale) => (
        <div 
          key={sale.id} 
          className="bare-bones-card mb-4 overflow-hidden rounded-lg"
          style={{
            ...getStatusStyle(sale.status),
            marginBottom: '16px'
          }}
        >
          <div className="p-3 pb-2">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-base font-medium">
                  OS: {sale.orderNumber}
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              </div>
              <Badge variant={getStatusVariant(sale.status) as any}>
                {getStatusLabel(sale.status)}
              </Badge>
            </div>
          </div>
          
          <div className="px-3 pb-2">
            <div className="text-sm">
              <span className="text-gray-500 text-xs">Cliente:</span>{" "}
              {sale.customerName}
            </div>
            
            <div className="text-sm">
              <span className="text-gray-500 text-xs">Vendedor:</span>{" "}
              {sale.sellerName}
            </div>
            
            <div className="text-sm">
              <span className="text-gray-500 text-xs">Valor:</span>{" "}
              <span className="font-semibold">
                R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
              </span>
            </div>
            
            {sale.returnReason && (
              <div className="text-sm mt-1 text-red-500">
                <span className="text-xs font-semibold">Motivo da devolução:</span>{" "}
                {sale.returnReason}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 flex flex-wrap gap-1">
            {/* Botão Detalhes */}
            <Button
              size="sm"
              variant="default"
              className="h-8 px-2 flex-grow"
              onClick={() => onViewDetails(sale)}
            >
              <Eye className="h-3.5 w-3.5 mr-1" />
              Detalhes
            </Button>
            
            {/* Botão Histórico */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2 flex-grow"
              onClick={() => onViewHistory(sale)}
            >
              <History className="h-3.5 w-3.5 mr-1" />
              Histórico
            </Button>
            
            {/* Botão Editar (Apenas para vendedores e adm) */}
            {(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 flex-grow"
                onClick={() => onEdit(sale)}
              >
                <Edit className="h-3.5 w-3.5 mr-1" />
                Editar
              </Button>
            )}
            
            {/* Botão para operacionais iniciarem execução */}
            {(user?.role === "admin" || user?.role === "operacional") && 
              (sale.status === "pending" || sale.status === "corrected") && (
              <Button
                size="sm"
                variant={sale.status === "corrected" ? "default" : "outline"}
                className={`h-8 px-2 flex-grow ${sale.status === "corrected" ? "bg-primary hover:bg-primary/90" : ""}`}
                onClick={() => onStartExecution(sale)}
              >
                <CornerDownRight className="h-3.5 w-3.5 mr-1" />
                Iniciar
              </Button>
            )}
            
            {/* Botão para operacionais concluírem execução */}
            {(user?.role === "admin" || user?.role === "operacional") && 
              sale.status === "in_progress" && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 flex-grow"
                onClick={() => onCompleteExecution(sale)}
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                Concluir
              </Button>
            )}
            
            {/* Botão para operacionais devolverem a venda */}
            {(user?.role === "admin" || user?.role === "operacional") && 
              (sale.status === "pending" || sale.status === "in_progress") && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 flex-grow text-destructive border-destructive hover:bg-destructive/10"
                onClick={() => onReturnClick(sale)}
              >
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                Devolver
              </Button>
            )}
            
            {/* Botão para vendedor/supervisor reenviar venda corrigida */}
            {sale.status === 'returned' && (
              <ReenviaButton sale={sale} />
            )}
            
            {/* Botão para operacional/admin devolver venda corrigida */}
            {sale.status === "corrected" && (
              <DevolveButton sale={sale} />
            )}
            
            {/* Botão para financeiro marcar como paga */}
            {(user?.role === "admin" || user?.role === "financeiro") && 
              sale.status === "completed" && 
              sale.financialStatus !== "paid" && (
              <Button
                size="sm"
                variant="secondary"
                className="h-8 px-2 flex-grow"
                onClick={() => onMarkAsPaid(sale)}
              >
                <Banknote className="h-3.5 w-3.5 mr-1" />
                Pago
              </Button>
            )}
            
            {/* Botão para excluir vendas (apenas admin ou supervisor) */}
            {(user?.role === "admin" || user?.role === "supervisor") && (
              <Button
                size="sm"
                variant="destructive"
                className="h-8 px-2 flex-grow"
                onClick={() => onDeleteClick(sale)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Excluir
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default BareBonesMobileList;