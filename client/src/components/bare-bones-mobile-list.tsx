import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  Edit,
  CornerDownRight,
  CheckCircle2,
} from "lucide-react";
import { getStatusLabel, getStatusVariant } from "@/lib/status-utils";
import { Sale } from "@shared/schema";

// Interface para props do componente principal
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

// Loading skeleton básico
const ListItemSkeleton = () => (
  <div className="py-4 px-3 border-b">
    <Skeleton className="h-4 w-32 mb-2" />
    <Skeleton className="h-3 w-20" />
  </div>
);

// Lista absolutamente básica para mobile
const BareBonesMobileList: React.FC<BareBonesMobileListProps> = ({
  data,
  isLoading,
  error,
  onViewDetails,
  onEdit,
  onStartExecution,
  onCompleteExecution,
  user,
  ReenviaButton,
  DevolveButton,
}) => {
  // Estado de carregamento
  if (isLoading) {
    return (
      <div className="mobile-basic-list">
        {Array.from({ length: 8 }).map((_, index) => (
          <ListItemSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Estado de erro
  if (error) {
    return (
      <div className="p-3 text-center text-red-500 bg-red-50 border border-red-200 rounded-md">
        <p>Erro ao carregar vendas</p>
        <p className="text-xs">{error.message}</p>
      </div>
    );
  }

  // Lista vazia
  if (data.length === 0) {
    return (
      <div className="p-4 text-center bg-gray-50">
        <p className="text-gray-500">Nenhuma venda encontrada</p>
      </div>
    );
  }

  // Calculamos a altura da lista com base no número de itens para evitar bugs de rolagem
  const dynamicHeight = Math.min(data.length * 72, window.innerHeight - 250);

  return (
    <div className="barebone-wrapper">
      <ul 
        className="list-none p-0 m-0 overflow-auto barebone-list"
        style={{
          height: `${dynamicHeight}px`,
          maxHeight: 'calc(100vh - 250px)',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y'
        }}
      >
        {data.map((sale) => {
          const statusColor = 
            sale.status === "completed" ? "bg-green-100 border-green-400" : 
            sale.status === "in_progress" ? "bg-orange-100 border-orange-400" :
            sale.status === "returned" ? "bg-red-100 border-red-400" :
            sale.status === "corrected" ? "bg-yellow-100 border-yellow-400" : 
            "bg-gray-100 border-gray-400";

          return (
            <li 
              key={sale.id} 
              className={`border-b py-3 px-3 ${statusColor}`}
              data-sale-id={sale.id}
            >
              <div className="flex justify-between items-center mb-2">
                <div>
                  <span className="font-bold">{sale.orderNumber}</span> {" "}
                  <span className="text-xs text-gray-500">
                    {format(new Date(sale.date || sale.createdAt), 'dd/MM/yyyy')}
                  </span>
                </div>
                <Badge variant={getStatusVariant(sale.status) as any}>
                  {getStatusLabel(sale.status)}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
                </span>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(sale)}
                    className="h-7 w-7 p-0 rounded-full"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                  
                  {user?.role === "admin" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(sale)}
                      className="h-7 w-7 p-0 rounded-full"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {(user?.role === "admin" || user?.role === "operacional") && 
                   sale.status === "pending" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onStartExecution(sale)}
                      className="h-7 w-7 p-0 rounded-full text-orange-500"
                    >
                      <CornerDownRight className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {(user?.role === "admin" || user?.role === "operacional") && 
                   sale.status === "in_progress" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onCompleteExecution(sale)}
                      className="h-7 w-7 p-0 rounded-full text-green-500"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default BareBonesMobileList;