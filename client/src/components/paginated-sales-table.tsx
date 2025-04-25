import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sale } from "@shared/schema";
import SimpleSalesTable from "./simple-sales-table";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ListFilter
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface PaginatedSalesTableProps {
  data: Sale[];
  isLoading: boolean;
  error: Error | null;
  sortField: string;
  sortDirection: string;
  onSort: (field: string) => void;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
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
  totalItems: number;
}

const PaginatedSalesTable: React.FC<PaginatedSalesTableProps> = ({
  data,
  isLoading,
  error,
  sortField,
  sortDirection,
  onSort,
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
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
  totalItems,
}) => {
  const isMobile = useIsMobile();
  const [showPaginationControls, setShowPaginationControls] = useState(false);
  
  // Gera uma matriz de números de página para mostrar sempre 5 páginas (quando possível)
  // Em dispositivos móveis, mostra menos botões para economizar espaço
  const getPageNumbers = () => {
    const totalVisible = isMobile ? 3 : 5;
    let startPage = Math.max(1, currentPage - Math.floor(totalVisible / 2));
    let endPage = Math.min(totalPages, startPage + totalVisible - 1);
    
    // Ajusta o startPage se estiver próximo do final
    if (endPage - startPage + 1 < totalVisible && startPage > 1) {
      startPage = Math.max(1, endPage - totalVisible + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const togglePaginationControls = () => {
    setShowPaginationControls(!showPaginationControls);
  };

  return (
    <Card className="shadow-sm flex flex-col h-full">
      <CardContent className={`p-responsive flex-grow ${isMobile ? 'flex flex-col max-h-[calc(100vh-170px)]' : ''}`}>
        <div className={isMobile ? 'flex-grow overflow-auto pb-4' : ''}>
          <SimpleSalesTable
            data={data}
            isLoading={isLoading}
            error={error}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
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
        </div>
        
        {/* Controles de paginação - redesenhados para melhor responsividade */}
        {!isLoading && !error && data.length > 0 && (
          <div className="mt-4">
            {/* Versão móvel - botão para mostrar/esconder controles */}
            {isMobile && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={togglePaginationControls}
                className="w-full mb-2 touch-target flex items-center justify-center"
              >
                <ListFilter className="mr-2 h-4 w-4" />
                <span>
                  {showPaginationControls ? "Ocultar controles" : "Mostrar controles de paginação"}
                </span>
              </Button>
            )}
            
            {/* Painel de controles (sempre visível em desktop, condicional em mobile) */}
            {(!isMobile || showPaginationControls) && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {/* Informações sobre itens e seletor de itens por página */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <span className="text-sm text-muted-foreground text-center sm:text-left">
                    <span className="hidden xs:inline">Exibindo {data.length} de {totalItems} itens</span>
                    <span className="mx-1 hidden xs:inline">|</span>
                    <span>Página {currentPage} de {totalPages}</span>
                  </span>
                  
                  <div className="w-full sm:w-auto">
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(value) => onPageSizeChange(Number(value))}
                    >
                      <SelectTrigger className="w-full sm:w-[120px] touch-target">
                        <SelectValue placeholder="Itens por página" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 itens</SelectItem>
                        <SelectItem value="15">15 itens</SelectItem>
                        <SelectItem value="25">25 itens</SelectItem>
                        <SelectItem value="50">50 itens</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Controles de navegação */}
                <div className="flex items-center justify-center sm:justify-end space-x-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    title="Primeira página"
                    className="touch-target"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    title="Página anterior"
                    className="touch-target"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {/* Exibe botões de paginação numérica somente em telas não-móveis ou dependendo da configuração */}
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(page)}
                      className={`touch-target ${isMobile && totalPages > 5 ? "hidden sm:inline-flex" : ""}`}
                    >
                      {page}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    title="Próxima página"
                    className="touch-target"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    title="Última página"
                    className="touch-target"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Mensagem para resultados vazios */}
        {!isLoading && !error && data.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Nenhum resultado encontrado</p>
          </div>
        )}
        
        {/* Mensagem de erro */}
        {!isLoading && error && (
          <div className="text-center py-8">
            <p className="text-destructive">Erro ao carregar dados: {error.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PaginatedSalesTable;