import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStatusLabel } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";
import { 
  Eye, 
  Loader2, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  InfoIcon,
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDown01,
  ArrowUp01,
  Calendar,
  Hash,
  User,
  MoreHorizontal
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Sale } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

// Versão adaptada da tabela para uso no módulo financeiro
interface FinanceSalesTableProps {
  status: string;
  searchTerm: string;
  onViewFinancials: (saleId: number) => void;
  usesFinancialStatus?: boolean; // Indica se deve usar financialStatus ao invés de status
  dateRange?: { from?: Date, to?: Date }; // Intervalo de datas para filtrar
}

// Tipo para definir a estrutura do retorno da API
interface SalesResponse {
  data: (Sale & { customerName?: string, sellerName?: string, paymentMethodName?: string })[];
  total: number;
  page: number;
  totalPages: number;
}

export default function FinanceSalesTable({ 
  status, 
  searchTerm, 
  onViewFinancials,
  usesFinancialStatus = false, // Por padrão, continuamos usando o status operacional
  dateRange
}: FinanceSalesTableProps) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Função para alternar ordenação
  const toggleSort = (field: string) => {
    if (sortField === field) {
      // Se já estiver ordenando por este campo, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Se for um novo campo, ordena ascendente por padrão
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Busca os dados de vendas com paginação
  const { data: salesData, isLoading, error } = useQuery<SalesResponse>({
    queryKey: ['/api/sales', page, limit, status, searchTerm, usesFinancialStatus, dateRange, sortField, sortDirection],
    queryFn: async () => {
      const url = new URL('/api/sales', window.location.origin);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());
      
      // Adicionar parâmetros de ordenação
      url.searchParams.append('sortField', sortField);
      url.searchParams.append('sortDirection', sortDirection);
      
      // Dependendo do flag, usa status ou financialStatus (exceto quando for "all")
      if (usesFinancialStatus) {
        if (status !== 'all') {
          url.searchParams.append('financialStatus', status);
        }
      } else {
        if (status !== 'all') {
          url.searchParams.append('status', status);
        }
      }
      
      if (searchTerm) url.searchParams.append('searchTerm', searchTerm);
      
      // Adicionar filtros de data se disponíveis
      if (dateRange?.from) {
        url.searchParams.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        url.searchParams.append('endDate', dateRange.to.toISOString());
      }
      
      console.log(`Buscando vendas com ${usesFinancialStatus ? 'financialStatus' : 'status'}: ${status}, termo: ${searchTerm || 'nenhum'}, url: ${url.toString()}`);
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Erro ao carregar vendas');
      }
      return response.json();
    },
    retry: 1,
  });

  const sales = salesData?.data || [];
  const totalPages = salesData?.totalPages || 1;
  const totalItems = salesData?.total || 0;

  // Reset para a página 1 quando alteramos os filtros
  useEffect(() => {
    setPage(1);
  }, [status, searchTerm, dateRange]);

  // Gera números de página para a paginação avançada
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    const pages = [];

    // Início sempre visível
    pages.push(1);
    
    // Se tivermos mais do que 7 páginas, mostrar ellipsis
    if (totalPages > 7) {
      // Início da faixa central
      const startRange = Math.max(2, page - 1);
      const endRange = Math.min(totalPages - 1, page + 1);
      
      // Adicionar ellipsis antes se necessário
      if (startRange > 2) {
        pages.push('ellipsis1');
      }
      
      // Adicionar páginas centrais
      for (let i = startRange; i <= endRange; i++) {
        pages.push(i);
      }
      
      // Adicionar ellipsis depois se necessário
      if (endRange < totalPages - 1) {
        pages.push('ellipsis2');
      }
    } else {
      // Com menos de 8 páginas, mostrar todas
      for (let i = 2; i < totalPages; i++) {
        pages.push(i);
      }
    }
    
    // Adicionar a última página se tivermos mais que uma página
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Função para ir para a primeira página
  const goToFirstPage = (e: React.MouseEvent) => {
    e.preventDefault();
    setPage(1);
  };

  // Função para ir para a última página
  const goToLastPage = (e: React.MouseEvent) => {
    e.preventDefault();
    setPage(totalPages);
  };

  // Função para retornar o estilo do badge com base no status
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'returned':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Renderizar skeletons durante o carregamento
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-24" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between space-x-2">
                  <Skeleton className="h-10 w-[10%]" />
                  <Skeleton className="h-10 w-[25%]" />
                  <Skeleton className="h-10 w-[15%]" />
                  <Skeleton className="h-10 w-[15%]" />
                  <Skeleton className="h-10 w-[20%]" />
                  <Skeleton className="h-10 w-[15%]" />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4 py-8">
          <div className="text-center text-destructive flex flex-col items-center justify-center">
            <InfoIcon className="h-12 w-12 text-destructive mb-2" />
            <p className="font-semibold text-lg">Erro ao carregar vendas</p>
            <p className="text-muted-foreground">Por favor, tente novamente mais tarde.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (sales.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 py-10">
          <div className="text-center flex flex-col items-center justify-center">
            <InfoIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-semibold text-lg">Nenhuma venda encontrada</p>
            <p className="text-muted-foreground mt-1">Não foram encontradas vendas com os filtros atuais.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 overflow-auto">
        {/* Filtros de ordenação móveis */}
        <div className="mb-4 md:hidden">
          <Select
            value={sortField}
            onValueChange={(value) => {
              setSortField(value);
              // Resetar direção para padrão conforme o campo
              if (['orderNumber', 'customerName'].includes(value)) {
                setSortDirection('asc');
              } else {
                setSortDirection('desc');
              }
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ordenar por..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="orderNumber">Número de Ordem</SelectItem>
              <SelectItem value="customerName">Cliente</SelectItem>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="totalAmount">Valor</SelectItem>
              <SelectItem value="createdAt">Data de Criação</SelectItem>
              {usesFinancialStatus && <SelectItem value="financialStatus">Status Financeiro</SelectItem>}
              {!usesFinancialStatus && <SelectItem value="status">Status</SelectItem>}
            </SelectContent>
          </Select>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-muted-foreground">
              Ordenação: {sortDirection === 'asc' ? 'Crescente' : 'Decrescente'}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
            >
              {sortDirection === 'asc' ? (
                <ArrowUpAZ className="h-4 w-4" />
              ) : (
                <ArrowDownAZ className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="rounded-md border overflow-x-auto max-w-full">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead 
                  className="w-[80px] cursor-pointer whitespace-nowrap" 
                  onClick={() => toggleSort('orderNumber')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Número</span>
                    {sortField === 'orderNumber' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUpAZ className="h-4 w-4" />
                      ) : (
                        <ArrowDownAZ className="h-4 w-4" />
                      )
                    ) : (
                      <div className="w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => toggleSort('customerName')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Cliente</span>
                    {sortField === 'customerName' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUpAZ className="h-4 w-4" />
                      ) : (
                        <ArrowDownAZ className="h-4 w-4" />
                      )
                    ) : (
                      <div className="w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => toggleSort('date')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Data</span>
                    {sortField === 'date' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUpAZ className="h-4 w-4" />
                      ) : (
                        <ArrowDownAZ className="h-4 w-4" />
                      )
                    ) : (
                      <div className="w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => toggleSort('totalAmount')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Valor Total</span>
                    {sortField === 'totalAmount' ? (
                      sortDirection === 'asc' ? (
                        <ArrowUp01 className="h-4 w-4" />
                      ) : (
                        <ArrowDown01 className="h-4 w-4" />
                      )
                    ) : (
                      <div className="w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => toggleSort(usesFinancialStatus ? 'financialStatus' : 'status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {sortField === (usesFinancialStatus ? 'financialStatus' : 'status') ? (
                      sortDirection === 'asc' ? (
                        <ArrowUpAZ className="h-4 w-4" />
                      ) : (
                        <ArrowDownAZ className="h-4 w-4" />
                      )
                    ) : (
                      <div className="w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} data-status={usesFinancialStatus ? sale.financialStatus : sale.status}>
                  <TableCell className="font-medium whitespace-nowrap">{sale.orderNumber}</TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    <span title={sale.customerName || `Cliente #${sale.customerId}`}>
                      {sale.customerName || `Cliente #${sale.customerId}`}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(sale.date)}
                  </TableCell>
                  <TableCell className="font-medium whitespace-nowrap">{formatCurrency(sale.totalAmount)}</TableCell>
                  <TableCell className="whitespace-nowrap">
                    {usesFinancialStatus && (
                      <Badge 
                        variant="outline" 
                        className={`uppercase text-xs font-semibold ${getStatusBadgeStyle(sale.financialStatus || 'pending')}`}
                      >
                        {getStatusLabel(sale.financialStatus || 'pending')}
                      </Badge>
                    )}
                    {!usesFinancialStatus && (
                      <Badge 
                        variant="outline"
                        className={`uppercase text-xs font-semibold ${getStatusBadgeStyle(sale.status)}`}
                      >
                        {getStatusLabel(sale.status)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {/* Botão para iniciar tratativa */}
                      {usesFinancialStatus && sale.financialStatus === "pending" && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => onViewFinancials(sale.id)}
                          className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Iniciar Tratativa</span>
                          <span className="sm:hidden">Iniciar</span>
                        </Button>
                      )}
                      
                      {/* Botão padrão para visualizar detalhes */}
                      {(!usesFinancialStatus || sale.financialStatus !== "pending") && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onViewFinancials(sale.id)}
                          className="whitespace-nowrap"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden sm:inline">Financeiro</span>
                          <span className="sm:hidden">Ver</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Rodapé com controles de paginação */}
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 border-t p-4">
        {/* Informações de paginação */}
        <div className="text-sm text-muted-foreground flex items-center">
          <div className="flex items-center">
            Exibindo
            <Select 
              value={String(limit)} 
              onValueChange={(value) => setLimit(parseInt(value))}
            >
              <SelectTrigger className="h-8 w-16 mx-2 px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            de {totalItems} registros
          </div>
        </div>

        {/* Controles de paginação avançados */}
        {totalPages > 1 && (
          <Pagination className="mt-0">
            <PaginationContent>
              {/* Botão para ir para primeira página */}
              <PaginationItem className="hidden sm:inline-block">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={goToFirstPage} 
                  disabled={page === 1}
                  className="h-8 w-8"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              
              {/* Botão anterior */}
              <PaginationItem>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(prev => Math.max(1, prev - 1));
                  }}
                  disabled={page === 1}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </PaginationItem>
              
              {/* Números de página dinâmicos */}
              {getPageNumbers().map((pageNum, index) => (
                pageNum === 'ellipsis1' || pageNum === 'ellipsis2' ? (
                  <PaginationItem key={`ellipsis-${index}`} className="hidden sm:inline-block">
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={`page-${pageNum}`} className="hidden sm:inline-block">
                    <PaginationLink
                      href="#"
                      isActive={pageNum === page}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(pageNum as number);
                      }}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              ))}
              
              {/* Exibir página atual para telas pequenas */}
              <PaginationItem className="sm:hidden">
                <span className="px-2 text-sm">
                  Página {page} de {totalPages}
                </span>
              </PaginationItem>
              
              {/* Botão próximo */}
              <PaginationItem>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(prev => Math.min(totalPages, prev + 1));
                  }}
                  disabled={page === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
              
              {/* Botão para ir para última página */}
              <PaginationItem className="hidden sm:inline-block">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={goToLastPage} 
                  disabled={page === totalPages}
                  className="h-8 w-8"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardFooter>
    </Card>
  );
}