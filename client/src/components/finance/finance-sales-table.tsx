import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
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
} from "@/components/ui/pagination";
import { getStatusLabel } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, DollarSign } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { Sale } from "@shared/schema";

// Removida função getStatusVariant em favor de uma abordagem inline

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
  
  // Busca os dados de vendas com paginação
  const { data: salesData, isLoading, error } = useQuery<SalesResponse>({
    queryKey: ['/api/sales', page, limit, status, searchTerm, usesFinancialStatus, dateRange],
    queryFn: async () => {
      const url = new URL('/api/sales', window.location.origin);
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());
      
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

  // Gera números de página para a paginação 
  const getPageNumbers = () => {
    const visiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(visiblePages / 2));
    let endPage = Math.min(totalPages, startPage + visiblePages - 1);
    
    if (endPage - startPage + 1 < visiblePages) {
      startPage = Math.max(1, endPage - visiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  return (
    <Card>
      <CardContent className="p-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando vendas...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-destructive">
            Erro ao carregar vendas. Por favor, tente novamente.
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma venda encontrada com os filtros atuais.
          </div>
        ) : (
          <>
            <Table>
              <TableCaption>
                {status === 'all' 
                  ? 'Lista completa de vendas'
                  : `Lista de vendas com ${usesFinancialStatus ? 'status financeiro' : 'status operacional'}: ${getStatusLabel(status)}`
                }
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{sale.orderNumber}</TableCell>
                    <TableCell>{sale.customerName || `Cliente #${sale.customerId}`}</TableCell>
                    <TableCell>
                      {formatDate(sale.date)}
                    </TableCell>
                    <TableCell>{formatCurrency(sale.totalAmount)}</TableCell>
                    <TableCell>
                      {usesFinancialStatus && sale.financialStatus === "pending" && (
                        <Badge variant="secondary" className="uppercase text-xs font-semibold">
                          Aguardando Pagamento
                        </Badge>
                      )}
                      {usesFinancialStatus && sale.financialStatus === "in_progress" && (
                        <Badge variant="secondary" className="uppercase text-xs font-semibold">
                          Em Execução
                        </Badge>
                      )}
                      {usesFinancialStatus && sale.financialStatus === "completed" && (
                        <Badge variant="default" className="uppercase text-xs font-semibold">
                          Executado
                        </Badge>
                      )}
                      {usesFinancialStatus && sale.financialStatus === "paid" && (
                        <Badge variant="default" className="uppercase text-xs font-semibold">
                          Pago
                        </Badge>
                      )}
                      {!usesFinancialStatus && (
                        <Badge 
                          variant={sale.status === "pending" ? "secondary" : 
                                  sale.status === "in_progress" ? "secondary" : 
                                  sale.status === "returned" ? "destructive" : "default"}
                          className="uppercase text-xs font-semibold"
                        >
                          {getStatusLabel(sale.status)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      {/* Botão para iniciar tratativa */}
                      {usesFinancialStatus && sale.financialStatus === "pending" && (
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={() => onViewFinancials(sale.id)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <DollarSign className="h-4 w-4 mr-1" />
                          Iniciar Tratativa
                        </Button>
                      )}
                      
                      {/* Botão padrão para visualizar detalhes */}
                      {(!usesFinancialStatus || sale.financialStatus !== "pending") && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onViewFinancials(sale.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Financeiro
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {/* Controles de paginação simplificados */}
            {totalPages > 1 && (
              <Pagination className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(prev => Math.max(1, prev - 1));
                      }}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map(pageNum => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={pageNum === page}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(prev => Math.min(totalPages, prev + 1));
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}