import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Search, DollarSign, BarChart4, Download, FileText, RefreshCw, ChevronDown, Loader2 } from "lucide-react";
import { DateRange } from "react-day-picker";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import PaginatedFinanceTable from "@/components/finance/paginated-finance-table";
import FinanceTransactionDialog from "@/components/finance/finance-transaction-dialog";
import { DateRangePicker } from "@/components/date-range-picker";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useWebSocket } from "@/hooks/use-websocket";
import { useIsMobile } from "@/hooks/use-mobile";
import { convertToSafeUser } from "@/components/finance/finance-types";

export default function FinancePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isMobile = useIsMobile();
  const { lastEvent, isConnected } = useWebSocket();
  
  // Estados para paginação
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10); // Número de registros por página
  const [sortField, setSortField] = useState('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Verificar as permissões do usuário
  const canPerformFinancialOperations = user?.role === "admin" || user?.role === "financeiro";
  
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

  // Buscar dados da venda selecionada para exibir informações
  const { data: selectedSale } = useQuery({
    queryKey: ['/api/sales', selectedSaleId],
    queryFn: async () => {
      if (!selectedSaleId) return null;
      
      const response = await fetch(`/api/sales/${selectedSaleId}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar dados da venda');
      }
      return response.json();
    },
    enabled: !!selectedSaleId,
  });

  // Removemos a consulta separada para exportação, agora buscamos os dados diretamente nas funções de exportação

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchTerm(internalSearchTerm);
    setPage(1); // Voltar para a primeira página ao pesquisar
    // Atualiza as queries para refletir os novos termos de busca
    queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
  };

  const handleViewFinancials = (saleId: number) => {
    setSelectedSaleId(saleId);
  };

  const handleCloseDialog = () => {
    setSelectedSaleId(null);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    // Atualiza as queries para refletir o novo intervalo de datas
    queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
  };

  // Exportar para Excel - Implementação direta integrada
  const exportToExcel = async () => {
    try {
      // Importando o XLSX diretamente aqui
      const XLSX = await import('xlsx');
      
      // Verificar se há dados disponíveis
      if (!salesData || !salesData.data || salesData.data.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há dados disponíveis para exportação no momento.",
          variant: "destructive",
        });
        return;
      }

      console.log("Início da exportação Excel com dados:", salesData.data);
      
      // Preparar dados em formato simples para Excel
      const excelData = salesData.data.map((sale: any) => {
        console.log("Processando item para Excel:", sale);
        return {
          'Número': sale.orderNumber || '',
          'Vendedor': sale.sellerName || `Vendedor #${sale.sellerId}`,
          'Cliente': sale.customerName || `Cliente #${sale.customerId}`,
          'Data': sale.date ? format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
          'Valor Total': sale.totalAmount ? parseFloat(sale.totalAmount).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'R$ 0,00',
          'Status': getFinancialStatusLabel(sale.financialStatus)
        };
      });
      
      // Criar planilha
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Financeiro');
      
      // Ajustar largura das colunas
      const wscols = [
        {wch: 10}, // Número
        {wch: 20}, // Vendedor
        {wch: 20}, // Cliente
        {wch: 12}, // Data
        {wch: 15}, // Valor Total
        {wch: 15}, // Status
      ];
      worksheet['!cols'] = wscols;
      
      // Definir nome do arquivo e exportar
      const fileName = `financeiro_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Exportação concluída",
        description: `Os dados foram exportados para Excel com sucesso: ${fileName}`,
      });
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para Excel: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Exportar para PDF - Implementação direta integrada
  const exportToPDF = async () => {
    try {
      // Importar jsPDF diretamente aqui
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;
      const autoTable = (await import('jspdf-autotable')).default;
      
      // Verificar se há dados disponíveis
      if (!salesData || !salesData.data || salesData.data.length === 0) {
        toast({
          title: "Nenhum dado para exportar",
          description: "Não há dados disponíveis para exportação no momento.",
          variant: "destructive",
        });
        return;
      }

      console.log("Início da exportação PDF com dados:", salesData.data);
      
      // Criar novo documento PDF em modo paisagem (landscape)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Adicionar título
      doc.setFontSize(16);
      doc.text('Relatório Financeiro', 14, 15);
      doc.setFontSize(12);
      doc.text(`Status: ${getFinancialStatusLabel(getFinancialStatusForActiveTab())}`, 14, 23);
      doc.text(`Data de Geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 30);
      
      // Preparar dados para a tabela
      const tableData = salesData.data.map((sale: any) => [
        sale.orderNumber || '',
        sale.sellerName || `Vendedor #${sale.sellerId}`,
        sale.customerName || `Cliente #${sale.customerId}`,
        sale.date ? format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A',
        sale.totalAmount ? parseFloat(sale.totalAmount).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}) : 'R$ 0,00',
        getFinancialStatusLabel(sale.financialStatus)
      ]);
      
      // Criar tabela
      autoTable(doc, {
        startY: 40,
        head: [['Nº OS', 'Vendedor', 'Cliente', 'Data', 'Valor Total', 'Status']],
        body: tableData,
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 40 },
        styles: { fontSize: 10, cellPadding: 5 }
      });
      
      // Definir nome do arquivo e salvar
      const fileName = `relatorio_financeiro_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Exportação concluída",
        description: `Os dados foram exportados para PDF com sucesso: ${fileName}`,
      });
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para PDF: " + (error as Error).message,
        variant: "destructive",
      });
    }
  };

  // Obter o status financeiro correspondente à aba ativa
  // Estamos usando o financialStatus ao invés do status operacional da venda
  function getFinancialStatusForActiveTab(): string {
    switch (activeTab) {
      case "all":
        return "all"; // Todas as vendas, sem filtro de status
      case "pending":
        return "pending"; // Vendas aguardando pagamento têm financialStatus "pending"
      case "inProgress":
        return "in_progress"; // Vendas em processo financeiro
      case "completed":
        return "completed"; // Vendas com processo financeiro concluído
      case "paid":
        return "paid"; // Vendas com pagamento completado
      default:
        return "pending";
    }
  }

  // Obter a descrição do status financeiro
  function getFinancialStatusLabel(status: string): string {
    switch (status) {
      case 'all': return 'Todos';
      case 'pending': return 'Aguardando Pagamento';
      case 'in_progress': return 'Em Execução';
      case 'completed': return 'Executado';
      case 'paid': return 'Pago';
      default: return status;
    }
  }

  // Consulta para obter os dados das vendas com paginação
  const {
    data: salesData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['/api/sales', page, limit, sortField, sortDirection, activeTab, searchTerm, dateRange],
    queryFn: async () => {
      const url = new URL('/api/sales', window.location.origin);
      
      // Adicionar parâmetros de paginação e ordenação
      url.searchParams.append('page', page.toString());
      url.searchParams.append('limit', limit.toString());
      url.searchParams.append('sortField', sortField);
      url.searchParams.append('sortDirection', sortDirection);
      
      // Adicionar status financeiro baseado na aba ativa
      url.searchParams.append('financialStatus', getFinancialStatusForActiveTab());
      
      // Adicionar termo de busca se houver
      if (searchTerm) {
        url.searchParams.append('searchTerm', searchTerm);
      }
      
      // Adicionar intervalo de datas se houver
      if (dateRange?.from) {
        url.searchParams.append('startDate', dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        url.searchParams.append('endDate', dateRange.to.toISOString());
      }
      
      console.log(`Buscando vendas com financialStatus: ${getFinancialStatusForActiveTab()}, termo: ${searchTerm || "nenhum"}, url: ${url.toString()}`);
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Erro ao buscar as vendas');
      }
      
      return response.json();
    },
  });
  
  // Usado para atualizar dados via botão "Atualizar"
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Invalidar todas as consultas de vendas para forçar a recuperação de dados
      await queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Módulo Financeiro</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os pagamentos e custos operacionais das vendas
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Filtro de datas */}
            <DateRangePicker
              value={dateRange}
              onValueChange={handleDateRangeChange}
              className="w-full sm:w-auto"
              align="end"
              placeholder="Selecione um período"
            />
            
            {/* Botão de atualização */}
            <Button 
              variant="outline" 
              className="w-full sm:w-auto"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar
            </Button>
            
            {/* Exportação */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Escolha o formato</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={exportToExcel}>
                  <FileText className="h-4 w-4 mr-2" />
                  Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1"></div>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Buscar vendas por número, cliente..."
              value={internalSearchTerm}
              onChange={(e) => setInternalSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setSearchTerm(internalSearchTerm);
                  setPage(1); // Volta para a primeira página ao pesquisar
                }
              }}
              className="max-w-xs"
            />
            <Button 
              type="submit" 
              className="shrink-0"
              onClick={() => {
                setSearchTerm(internalSearchTerm);
                setPage(1); // Volta para a primeira página ao pesquisar
              }}
            >
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </form>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between pb-3">
            <TabsList>
              <TabsTrigger value="all" className="flex items-center gap-1">
                <BarChart4 className="h-4 w-4" />
                <span>Todos</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-1">
                <Pencil className="h-4 w-4" />
                <span>Aguardando Pagamento</span>
              </TabsTrigger>
              <TabsTrigger value="inProgress" className="flex items-center gap-1">
                <BarChart4 className="h-4 w-4" />
                <span>Em Execução</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1">
                <Pencil className="h-4 w-4" />
                <span>Executado</span>
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>Pagos</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4">
            <PaginatedFinanceTable
              data={salesData?.data || []}
              isLoading={isLoading}
              error={error as Error}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
              currentPage={page}
              totalPages={Math.ceil((salesData?.total || 0) / limit)}
              pageSize={limit}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setLimit(newSize);
                setPage(1); // Voltar para a primeira página ao alterar o tamanho
              }}
              onViewFinancials={handleViewFinancials}
              user={user}
              totalItems={salesData?.total || 0}
              usesFinancialStatus={true}
            />
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            <PaginatedFinanceTable
              data={salesData?.data || []}
              isLoading={isLoading}
              error={error as Error}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
              currentPage={page}
              totalPages={Math.ceil((salesData?.total || 0) / limit)}
              pageSize={limit}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setLimit(newSize);
                setPage(1); // Voltar para a primeira página ao alterar o tamanho
              }}
              onViewFinancials={handleViewFinancials}
              user={user}
              totalItems={salesData?.total || 0}
              usesFinancialStatus={true}
            />
          </TabsContent>

          <TabsContent value="inProgress" className="space-y-4">
            <PaginatedFinanceTable
              data={salesData?.data || []}
              isLoading={isLoading}
              error={error as Error}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
              currentPage={page}
              totalPages={Math.ceil((salesData?.total || 0) / limit)}
              pageSize={limit}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setLimit(newSize);
                setPage(1); // Voltar para a primeira página ao alterar o tamanho
              }}
              onViewFinancials={handleViewFinancials}
              user={user}
              totalItems={salesData?.total || 0}
              usesFinancialStatus={true}
            />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <PaginatedFinanceTable
              data={salesData?.data || []}
              isLoading={isLoading}
              error={error as Error}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
              currentPage={page}
              totalPages={Math.ceil((salesData?.total || 0) / limit)}
              pageSize={limit}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setLimit(newSize);
                setPage(1); // Voltar para a primeira página ao alterar o tamanho
              }}
              onViewFinancials={handleViewFinancials}
              user={user}
              totalItems={salesData?.total || 0}
              usesFinancialStatus={true}
            />
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            <PaginatedFinanceTable
              data={salesData?.data || []}
              isLoading={isLoading}
              error={error as Error}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={toggleSort}
              currentPage={page}
              totalPages={Math.ceil((salesData?.total || 0) / limit)}
              pageSize={limit}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setLimit(newSize);
                setPage(1); // Voltar para a primeira página ao alterar o tamanho
              }}
              onViewFinancials={handleViewFinancials}
              user={user}
              totalItems={salesData?.total || 0}
              usesFinancialStatus={true}
            />
          </TabsContent>
        </Tabs>

        {/* Diálogo de gestão financeira */}
        {selectedSaleId && (
          <FinanceTransactionDialog
            open={!!selectedSaleId}
            onClose={handleCloseDialog}
            saleId={selectedSaleId}
          />
        )}
      </div>
    </div>
  );
}