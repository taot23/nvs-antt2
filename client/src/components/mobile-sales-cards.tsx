import React from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";

interface MobileSalesCardsProps {
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

// Badge para status
const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant={getStatusVariant(status) as any}>
    {getStatusLabel(status)}
  </Badge>
);

const MobileSalesCards: React.FC<MobileSalesCardsProps> = ({
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
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-28" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t flex">
              <Skeleton className="h-8 w-8 rounded-md mr-2" />
              <Skeleton className="h-8 w-8 rounded-md mr-2" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 px-2 bg-red-50 rounded-md text-red-500 border border-red-200">
        <p>Erro ao carregar vendas:</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-4 bg-muted/20 rounded-md">
        <p className="text-muted-foreground">Nenhuma venda encontrada</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-2" style={{ touchAction: 'pan-y' }}>
      {data.map(sale => (
        <Card 
          key={sale.id}
          className="relative overflow-hidden border"
          data-status={sale.status}
        >
          {/* Indicador de status na lateral */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ 
              backgroundColor: 
                sale.status === "completed" ? "#86efac" : 
                sale.status === "in_progress" ? "#fdba74" :
                sale.status === "returned" ? "#fca5a5" :
                sale.status === "corrected" ? "#fef08a" : "#e5e7eb"
            }}
          />
          
          <CardContent className="p-3 pl-4">
            {/* Cabeçalho do Card */}
            <div className="flex justify-between items-start mb-2">
              <div>
                <div className="font-medium">{sale.orderNumber}</div>
                <div className="text-xs text-muted-foreground">
                  {format(new Date(sale.date || sale.createdAt), 'dd/MM/yyyy')}
                </div>
              </div>
              <div>
                <StatusBadge status={sale.status} />
                {sale.financialStatus === 'paid' && (
                  <div className="text-xs text-green-600 text-right mt-1">Pago</div>
                )}
              </div>
            </div>
            
            {/* Informações reduzidas */}
            <div className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="text-muted-foreground">Cliente:</span>
                <span className="font-medium truncate ml-2 text-right" style={{ maxWidth: '60%' }}>
                  {(sale as any).customerName || `ID: ${sale.customerId}`}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">
                  {`R$ ${parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}`}
                </span>
              </div>
            </div>
            
            {/* Ações com ícones apenas para economizar espaço */}
            <div className="flex justify-start gap-1 mt-2 pt-2 border-t border-border overflow-x-auto pb-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewDetails(sale)}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewHistory(sale)}
                className="h-8 w-8 p-0"
              >
                <ClipboardList className="h-4 w-4" />
              </Button>
              
              {user?.role === "admin" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(sale)}
                  className="h-8 w-8 p-0"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              
              {/* Ações específicas com base no status */}
              {(user?.role === "admin" || user?.role === "operacional") && 
               sale.status === "pending" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onStartExecution(sale)}
                  className="h-8 w-8 p-0 text-orange-500"
                >
                  <CornerDownRight className="h-4 w-4" />
                </Button>
              )}
              
              {(user?.role === "admin" || user?.role === "operacional") && 
               sale.status === "in_progress" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onCompleteExecution(sale)}
                  className="h-8 w-8 p-0 text-green-500"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              )}
              
              {(user?.role === "admin" || user?.role === "supervisor") && 
               (sale.status === "pending" || sale.status === "in_progress") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReturnClick(sale)}
                  className="h-8 w-8 p-0 text-red-500"
                >
                  <AlertTriangle className="h-4 w-4" />
                </Button>
              )}
              
              {/* Componentes especiais */}
              <ReenviaButton sale={sale} />
              <DevolveButton sale={sale} />
              
              {(user?.role === "admin" || user?.role === "financeiro") && 
               sale.status === "completed" && 
               sale.financialStatus !== "paid" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onMarkAsPaid(sale)}
                  className="h-8 w-8 p-0 text-green-500"
                >
                  <DollarSign className="h-4 w-4" />
                </Button>
              )}
              
              {user?.role === "admin" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDeleteClick(sale)}
                  className="h-8 w-8 p-0 text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MobileSalesCards;