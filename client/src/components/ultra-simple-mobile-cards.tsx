import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  ClipboardList,
  Edit,
  Trash2,
  CornerDownRight,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { getStatusLabel, getStatusVariant } from "@/lib/status-utils";
import { Sale } from "@shared/schema";

// Interface para props do componente principal
interface UltraSimpleMobileCardsProps {
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

// Componente para mostrar o status
const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant={getStatusVariant(status) as any}>
    {getStatusLabel(status)}
  </Badge>
);

// Cartão de venda extremamente simplificado para dispositivos móveis
const MobileCard: React.FC<{
  sale: Sale;
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
}> = ({
  sale,
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
  // Cores de status
  const statusColor = 
    sale.status === "completed" ? "border-green-300 bg-green-50" : 
    sale.status === "in_progress" ? "border-orange-300 bg-orange-50" :
    sale.status === "returned" ? "border-red-300 bg-red-50" :
    sale.status === "corrected" ? "border-yellow-300 bg-yellow-50" : 
    "border-gray-300 bg-gray-50";

  return (
    <div 
      className={`mobile-card mb-4 rounded-md border-l-4 shadow-sm ${statusColor}`}
      style={{ touchAction: 'manipulation' }}
    >
      <div className="p-3">
        {/* Cabeçalho simplificado */}
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-bold">{sale.orderNumber}</div>
            <div className="text-xs text-gray-500">
              {format(new Date(sale.date || sale.createdAt), 'dd/MM/yyyy')}
            </div>
          </div>
          <StatusBadge status={sale.status} />
        </div>
        
        {/* Detalhes mínimos */}
        <div className="text-sm mb-2">
          <div className="flex justify-between mb-1">
            <span className="text-gray-500">Valor:</span>
            <span className="font-medium">
              {`R$ ${parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}`}
            </span>
          </div>
        </div>
        
        {/* Ações principais - versão ultra simplificada */}
        <div className="flex flex-wrap gap-2 mt-2 border-t border-gray-200 pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onViewDetails(sale)}
            className="h-8 px-2 text-xs"
          >
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
          
          {user?.role === "admin" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onEdit(sale)}
              className="h-8 px-2 text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              Editar
            </Button>
          )}
          
          {/* Botões específicos por status e papel */}
          {(user?.role === "admin" || user?.role === "operacional") && 
           sale.status === "pending" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onStartExecution(sale)}
              className="h-8 px-2 text-xs text-orange-600"
            >
              <CornerDownRight className="h-3 w-3 mr-1" />
              Iniciar
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
           sale.status === "in_progress" && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onCompleteExecution(sale)}
              className="h-8 px-2 text-xs text-green-600"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Concluir
            </Button>
          )}
          
          {/* Componentes especiais */}
          <ReenviaButton sale={sale} />
          <DevolveButton sale={sale} />
        </div>
      </div>
    </div>
  );
};

// Loading skeleton simplificado
const MobileCardSkeleton = () => (
  <div className="border rounded-md p-3 mb-4 shadow-sm">
    <div className="flex justify-between items-start mb-2">
      <div>
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-20 mt-1" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
    <div className="my-2">
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="flex gap-2 mt-3">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
);

// Componente principal - ultra simplificado para mobile
const UltraSimpleMobileCards: React.FC<UltraSimpleMobileCardsProps> = ({
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
  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="mt-2 px-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <MobileCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="mt-2 px-2 py-3 text-center bg-red-50 rounded-md text-red-500 border border-red-200">
        <p>Erro ao carregar vendas</p>
        <p className="text-xs">{error.message}</p>
      </div>
    );
  }

  // Estado vazio
  if (data.length === 0) {
    return (
      <div className="mt-2 px-2 py-4 text-center bg-gray-50 rounded-md">
        <p className="text-gray-500">Nenhuma venda encontrada</p>
      </div>
    );
  }

  // Renderização normal
  return (
    <div 
      className="ultra-simple-mobile-container px-2 pb-20 pt-2"
      style={{
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        height: 'calc(100vh - 250px)',
        maxHeight: 'calc(100vh - 250px)',
      }}
    >
      {data.map((sale) => (
        <MobileCard
          key={sale.id}
          sale={sale}
          onViewDetails={onViewDetails}
          onViewHistory={onViewHistory}
          onEdit={onEdit}
          onStartExecution={onStartExecution}
          onCompleteExecution={onCompleteExecution}
          onReturnClick={onReturnClick}
          onMarkAsPaid={onMarkAsPaid}
          onDeleteClick={onDeleteClick}
          user={user}
          ReenviaButton={ReenviaButton}
          DevolveButton={DevolveButton}
        />
      ))}
    </div>
  );
};

export default UltraSimpleMobileCards;