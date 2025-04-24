import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { cn } from '@/lib/utils';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  ClipboardList, 
  Edit, 
  CornerDownRight, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2,
  SortAsc,
  SortDesc
} from "lucide-react";
import type { Sale } from '@shared/schema';

// Funções auxiliares
const getStatusVariant = (status: string) => {
  switch (status) {
    case 'completed': return 'success';
    case 'in_progress': return 'warning';
    case 'returned': return 'destructive';
    case 'corrected': return 'outline';
    case 'pending': return 'secondary';
    default: return 'outline';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'completed': return 'Concluído';
    case 'in_progress': return 'Em Andamento';
    case 'returned': return 'Devolvido';
    case 'corrected': return 'Corrigido';
    case 'pending': return 'Pendente';
    default: return status;
  }
};

// Props para o componente de tabela virtualizada
interface VirtualizedTableProps {
  data: Sale[];
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  statusFilter: string;
  sortField: string;
  sortDirection: string;
  onSort: (field: string) => void;
  onViewDetails: (sale: Sale) => void;
  onViewHistory: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  onStartExecution: (sale: Sale) => void;
  onCompleteExecution: (sale: Sale) => void;
  onReturnClick: (sale: Sale) => void;
  onMarkAsPaid: (sale: Sale) => void;
  onDeleteClick: (sale: Sale) => void;
  user: { id: number; username: string; role: string } | null;
  children?: React.ReactNode;
  rowHeight?: number;
  headerHeight?: number;
  ReenviaButton: React.ComponentType<{ sale: Sale }>;
  DevolveButton: React.ComponentType<{ sale: Sale }>;
}

// Componente de tabela virtualizada
export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  data,
  isLoading,
  error,
  searchTerm,
  statusFilter,
  sortField,
  sortDirection,
  onSort,
  onViewDetails,
  onViewHistory,
  onEdit,
  onStartExecution,
  onCompleteExecution,
  onReturnClick,
  onMarkAsPaid,
  onDeleteClick,
  user,
  children,
  rowHeight = 60,
  headerHeight = 50,
  ReenviaButton,
  DevolveButton,
}) => {
  // Monitor de performance
  usePerformanceMonitor('VirtualizedTable');

  // Estado para acompanhar o progresso de renderização
  const [renderProgress, setRenderProgress] = useState(0);
  
  // Referências para medição de performance
  const lastRenderTime = useRef(0);
  const renderCount = useRef(0);

  // Alternar a ordem de classificação
  const toggleSort = useCallback((field: string) => {
    onSort(field);
  }, [onSort]);

  // Item de linha da tabela memoizado
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    // Medição de performance para renderização de linhas
    const startTime = performance.now();
    if (lastRenderTime.current === 0) {
      lastRenderTime.current = startTime;
    }
    
    renderCount.current++;
    
    // Taxa de renderização (linhas por segundo)
    if (renderCount.current % 10 === 0) {
      const elapsed = startTime - lastRenderTime.current;
      const rate = (renderCount.current / elapsed) * 1000;
      console.log(`[Performance] Taxa de renderização: ${rate.toFixed(2)} linhas/s`);
      lastRenderTime.current = startTime;
    }

    const sale = data[index];
    if (!sale) return null;

    // Atualiza o progresso da renderização
    const progress = Math.round((index / data.length) * 100);
    if (progress > renderProgress && progress % 10 === 0) {
      setRenderProgress(progress);
    }

    return (
      <TableRow 
        key={sale.id}
        data-status={sale.status}
        style={style}
        className={cn(
          "virtual-row",
          sale.status === "completed" && "bg-green-100 border-green-300 border",
          sale.status === "in_progress" && "bg-orange-100 border-orange-300 border",
          sale.status === "returned" && "bg-red-100 border-red-300 border",
          sale.status === "corrected" && "bg-yellow-100 border-yellow-300 border",
        )}
      >
        <TableCell 
          className={cn(
            "font-medium",
            sale.status === "completed" && "bg-green-100 border-l-4 border-l-green-500",
            sale.status === "in_progress" && "bg-orange-100 border-l-4 border-l-orange-500",
            sale.status === "returned" && "bg-red-100 border-l-4 border-l-red-500",
            sale.status === "corrected" && "bg-yellow-100 border-l-4 border-l-yellow-500",
          )}
        >
          {sale.orderNumber}
        </TableCell>
        <TableCell className={cn(
            sale.status === "completed" && "bg-green-100",
            sale.status === "in_progress" && "bg-orange-100",
            sale.status === "returned" && "bg-red-100",
            sale.status === "corrected" && "bg-yellow-100",
          )}>
          {format(sale.date ? new Date(sale.date) : new Date(sale.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
        </TableCell>
        <TableCell className={cn(
            sale.status === "completed" && "bg-green-100",
            sale.status === "in_progress" && "bg-orange-100",
            sale.status === "returned" && "bg-red-100",
            sale.status === "corrected" && "bg-yellow-100",
          )}>
          {sale.customerName}
        </TableCell>
        <TableCell className={cn(
            sale.status === "completed" && "bg-green-100",
            sale.status === "in_progress" && "bg-orange-100",
            sale.status === "returned" && "bg-red-100",
            sale.status === "corrected" && "bg-yellow-100",
          )}>
          {sale.sellerName}
        </TableCell>
        <TableCell className={cn(
            sale.status === "completed" && "bg-green-100",
            sale.status === "in_progress" && "bg-orange-100",
            sale.status === "returned" && "bg-red-100",
            sale.status === "corrected" && "bg-yellow-100",
          )}>
          R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
        </TableCell>
        <TableCell className={cn(
            sale.status === "completed" && "bg-green-100",
            sale.status === "in_progress" && "bg-orange-100",
            sale.status === "returned" && "bg-red-100",
            sale.status === "corrected" && "bg-yellow-100",
          )}>
          <div className="flex flex-col gap-1">
            <Badge variant={getStatusVariant(sale.status) as any}>
              {getStatusLabel(sale.status)}
            </Badge>
            {sale.financialStatus === 'paid' && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Pago
              </Badge>
            )}
          </div>
        </TableCell>
        {/* Célula para tipo de execução - mostrar apenas para operacional, financeiro e admin */}
        {(user?.role === "operacional" || user?.role === "financeiro" || user?.role === "admin") && (
          <TableCell className={cn(
              sale.status === "completed" && "bg-green-100",
              sale.status === "in_progress" && "bg-orange-100",
              sale.status === "returned" && "bg-red-100",
              sale.status === "corrected" && "bg-yellow-100",
            )}>
            <div className="flex items-center gap-1">
              {sale.serviceTypeId ? (
                <span className="text-xs font-medium inline-flex items-center">
                  <CornerDownRight className="h-3.5 w-3.5 mr-1 text-primary" />
                  {sale.serviceTypeName || "Tipo não identificado"}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Não definido</span>
              )}
            </div>
          </TableCell>
        )}
        <TableCell className={cn(
            "text-right",
            sale.status === "completed" && "bg-green-100",
            sale.status === "in_progress" && "bg-orange-100",
            sale.status === "returned" && "bg-red-100",
            sale.status === "corrected" && "bg-yellow-100",
          )}>
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewDetails(sale)}
              className="h-8 w-8"
              title="Ver detalhes"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewHistory(sale)}
              className="h-8 w-8"
              title="Ver histórico de status"
            >
              <ClipboardList className="h-4 w-4" />
            </Button>
            
            {/* Permissão para editar (admin) */}
            {user?.role === "admin" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(sale)}
                className="h-8 w-8"
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            
            {/* Permissão para iniciar execução (operacional/admin) */}
            {(user?.role === "admin" || user?.role === "operacional") && 
              (sale.status === "pending" || sale.status === "corrected") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onStartExecution(sale)}
                className="h-8 w-8"
                title="Iniciar execução"
              >
                <CornerDownRight className="h-4 w-4" />
              </Button>
            )}
            
            {/* Permissão para concluir execução (operacional/admin) */}
            {(user?.role === "admin" || user?.role === "operacional") && 
              sale.status === "in_progress" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onCompleteExecution(sale)}
                className="h-8 w-8"
                title="Concluir execução"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            
            {/* Permissão para devolver a venda (operacional/admin) */}
            {(user?.role === "admin" || user?.role === "operacional") && 
              (sale.status === "pending" || sale.status === "in_progress") && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onReturnClick(sale)}
                className="h-8 w-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                title="Devolver para correção"
              >
                <AlertTriangle className="h-4 w-4" />
              </Button>
            )}
            
            {/* Botão de reenvio para vendedor, supervisor ou admin */}
            {(user?.role === "admin" || 
              user?.role === "supervisor" || 
              (user?.role === "vendedor" && sale.sellerId === user?.id)) && (
              <ReenviaButton sale={sale} />
            )}
            
            {/* Botão de devolução para vendas com status "corrected" (apenas admin e operacional) */}
            {(user?.role === "admin" || user?.role === "operacional") && 
              sale.status === "corrected" && (
              <DevolveButton sale={sale} />
            )}
            
            {/* Permissão para marcar como paga (financeiro/admin) */}
            {(user?.role === "admin" || user?.role === "financeiro") && 
              sale.status === "completed" && 
              sale.financialStatus !== "paid" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onMarkAsPaid(sale)}
                className="h-8 w-8 text-green-500 hover:text-green-700 hover:bg-green-50"
                title="Confirmar pagamento"
              >
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            )}
            
            {/* Permissão para excluir (apenas admin) */}
            {user?.role === "admin" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteClick(sale)}
                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                title="Excluir"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }, [data, renderProgress, user, onViewDetails, onViewHistory, onEdit, onStartExecution, 
      onCompleteExecution, onReturnClick, onMarkAsPaid, onDeleteClick, ReenviaButton, DevolveButton]);

  // Item de linha memoizado para evitar re-renderizações desnecessárias
  const MemoizedRow = useMemo(() => React.memo(Row), [Row]);
  
  // Renderização do componente de tabela
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableCaption>
            {isLoading ? (
              "Carregando dados..."
            ) : data.length === 0 ? (
              "Nenhuma venda encontrada"
            ) : (
              `Total de ${data.length} vendas${searchTerm || statusFilter ? " encontradas" : ""}`
            )}
            {renderProgress > 0 && renderProgress < 100 && !isLoading && (
              <span className="block text-xs text-muted-foreground">
                Renderizando: {renderProgress}% concluído
              </span>
            )}
          </TableCaption>
          
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] cursor-pointer" onClick={() => toggleSort('orderNumber')}>
                <div className="flex items-center">
                  Nº OS
                  {sortField === 'orderNumber' && (
                    sortDirection === 'asc' 
                      ? <SortAsc className="ml-1 h-4 w-4" /> 
                      : <SortDesc className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('date')}>
                <div className="flex items-center">
                  Data
                  {sortField === 'date' && (
                    sortDirection === 'asc' 
                      ? <SortAsc className="ml-1 h-4 w-4" /> 
                      : <SortDesc className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('customerName')}>
                <div className="flex items-center">
                  Cliente
                  {sortField === 'customerName' && (
                    sortDirection === 'asc' 
                      ? <SortAsc className="ml-1 h-4 w-4" /> 
                      : <SortDesc className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('sellerName')}>
                <div className="flex items-center">
                  Vendedor
                  {sortField === 'sellerName' && (
                    sortDirection === 'asc' 
                      ? <SortAsc className="ml-1 h-4 w-4" /> 
                      : <SortDesc className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('totalAmount')}>
                <div className="flex items-center">
                  Valor Total
                  {sortField === 'totalAmount' && (
                    sortDirection === 'asc' 
                      ? <SortAsc className="ml-1 h-4 w-4" /> 
                      : <SortDesc className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => toggleSort('status')}>
                <div className="flex items-center">
                  Status
                  {sortField === 'status' && (
                    sortDirection === 'asc' 
                      ? <SortAsc className="ml-1 h-4 w-4" /> 
                      : <SortDesc className="ml-1 h-4 w-4" />
                  )}
                </div>
              </TableHead>
              {/* Coluna para tipo de execução - mostrar apenas para operacional, financeiro e admin */}
              {(user?.role === "operacional" || user?.role === "financeiro" || user?.role === "admin") && (
                <TableHead>Tipo de Execução</TableHead>
              )}
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          
          <tbody className="relative">
            {isLoading ? (
              <tr>
                <td 
                  colSpan={(user?.role === "operacional" || user?.role === "financeiro" || user?.role === "admin") ? 8 : 7} 
                  className="text-center py-8"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-pulse flex space-x-4">
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded"></div>
                          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td 
                  colSpan={(user?.role === "operacional" || user?.role === "financeiro" || user?.role === "admin") ? 8 : 7} 
                  className="text-center py-8 text-red-500"
                >
                  Erro ao carregar vendas: {error.message}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td 
                  colSpan={(user?.role === "operacional" || user?.role === "financeiro" || user?.role === "admin") ? 8 : 7} 
                  className="text-center py-8"
                >
                  {searchTerm || statusFilter
                    ? "Nenhuma venda encontrada para sua busca" 
                    : "Nenhuma venda cadastrada ainda"}
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={(user?.role === "operacional" || user?.role === "financeiro" || user?.role === "admin") ? 8 : 7} 
                    className="p-0" 
                    style={{ height: `${data.length * rowHeight}px` }}>
                  <div style={{ height: '70vh', width: '100%' }} className="border-0">
                    <AutoSizer>
                      {({ height, width }) => (
                        <List
                          height={height}
                          itemCount={data.length}
                          itemSize={rowHeight}
                          width={width}
                          overscanCount={5}
                          className="will-change-transform"
                          style={{ overflowX: 'hidden' }}
                        >
                          {MemoizedRow}
                        </List>
                      )}
                    </AutoSizer>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Estilos CSS para melhorar a aparência e performance
const styles = `
  .virtual-row {
    will-change: transform;
    contain: content;
  }
  
  @media (max-width: 768px) {
    .virtual-row {
      flex-direction: column;
      padding: 1rem;
    }
    
    thead {
      display: none;
    }
    
    td::before {
      content: attr(data-label);
      font-weight: bold;
      margin-right: 0.5rem;
    }
  }
`;

export default VirtualizedTable;