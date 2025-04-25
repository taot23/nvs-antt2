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
import { getStatusLabel, getStatusVariant } from "@/lib/status-utils";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2 } from "lucide-react";
import { format } from "date-fns";

// Versão simplificada da tabela para uso no módulo financeiro
interface FinanceSalesTableProps {
  status: string;
  searchTerm: string;
  onViewFinancials: (saleId: number) => void;
}

export default function FinanceSalesTable({ status, searchTerm, onViewFinancials }: FinanceSalesTableProps) {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Busca os dados de vendas com paginação
  const { data: salesData, isLoading, error } = useQuery({
    queryKey: ['/api/sales', { page, limit, status, searchTerm }],
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

  // Formata valor monetário
  const formatCurrency = (amount: string) => {
    const value = parseFloat(amount);
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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
              <TableCaption>Lista de vendas com status: {getStatusLabel(status)}</TableCaption>
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
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>
                      {sale.date ? format(new Date(sale.date), 'dd/MM/yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>{formatCurrency(sale.totalAmount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(sale.status)}>
                        {getStatusLabel(sale.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onViewFinancials(sale.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Financeiro
                      </Button>
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
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page <= 1} 
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map(pageNum => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        isActive={pageNum === page}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={page >= totalPages}
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