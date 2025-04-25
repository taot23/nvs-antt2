import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Search, FileText, Download, SortAsc, SortDesc, Eye, CornerDownRight, CheckCircle2, XCircle, AlertTriangle, SendHorizontal, CornerUpLeft, DollarSign, RefreshCw, ClipboardList, ArrowLeft, DatabaseBackup, Database, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, ChevronDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import { useDeviceDetection } from "@/hooks/use-device-detection";
// Removido o hook useDebounce
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { debounce } from "lodash-es";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { DateRange } from "react-day-picker";
import SaleDialog from "@/components/sales/sale-dialog";
import SaleDetailsDialog from "@/components/sales/sale-details-dialog";
import SaleReturnDialog from "@/components/sales/sale-return-dialog";
import SaleOperationDialog from "@/components/sales/sale-operation-dialog";
import SaleHistoryDialog from "@/components/sales/sale-history-dialog";
import ReenviaButton from "@/components/sales/reenvia-button";
import DevolveButton from "@/components/sales/devolve-button";
import { PopulateSalesButton } from "@/components/admin/populate-sales-button";
import PaginatedSalesTable from "@/components/paginated-sales-table";
import { DateRangePicker } from "@/components/date-range-picker";

// Tipos
type Sale = {
  id: number;
  orderNumber: string;
  date: string;
  customerId: number;
  customerName?: string; // Preenchido pelo frontend
  paymentMethodId: number;
  paymentMethodName?: string; // Preenchido pelo frontend
  sellerId: number;
  sellerName?: string; // Preenchido pelo frontend
  serviceTypeId?: number | null; // Tipo de execução do serviço
  serviceTypeName?: string | null; // Nome do tipo de execução (preenchido pelo frontend)
  serviceProviderId?: number | null; // Prestador parceiro (para SINDICATO)
  serviceProviderName?: string | null; // Nome do prestador (preenchido pelo frontend)
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

type SortField = 'orderNumber' | 'date' | 'customerName' | 'sellerName' | 'totalAmount' | 'status';
type SortDirection = 'asc' | 'desc';

// Funções de utilidade para status importadas do arquivo separado
import { getStatusLabel, getStatusVariant, getStatusRowClass, getStatusCardClass, getStatusStyle } from "@/lib/status-utils";

// Componente principal
export default function SalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const deviceInfo = useDeviceDetection();
  const isMobile = deviceInfo.isMobile || deviceInfo.type === 'mobile' || deviceInfo.type === 'tablet';
  const { lastEvent, isConnected, reconnect } = useWebSocket();
  // Monitoramento de performance
  const performanceMonitor = usePerformanceMonitor();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados
  const [internalSearchTerm, setInternalSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showCreateVendaDialog, setShowCreateVendaDialog] = useState(false); // Estado específico para criar venda
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearSalesDialogOpen, setClearSalesDialogOpen] = useState(false); // Estado para diálogo de limpar vendas
  const [operationDialogOpen, setOperationDialogOpen] = useState(false); // Estado para diálogo de operação de vendas
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false); // Estado para diálogo de histórico de vendas
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined); // Estado para filtro de intervalo de datas
  
  // Configuração para staleTime e gcTime globais para reduzir chamadas de API
  const staleTime = 5 * 60 * 1000; // 5 minutos 
  const gcTime = 30 * 60 * 1000; // 30 minutos (gcTime substitui cacheTime na v5 do TanStack Query)
  const localStorageCacheTime = 60 * 60 * 1000; // 1 hora para cache do localStorage

  // Precisamos também remover as referências ao hook useDebounce que foi removido
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      setPage(1); // Resetar para a primeira página ao pesquisar
    }, 500),
    []
  );
  
  // Função para obter dados do cache local
  const getFromLocalCache = (key: string) => {
    try {
      const cachedData = localStorage.getItem(`cache_${key}`);
      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > localStorageCacheTime;
        
        if (!isExpired) {
          console.log(`Usando dados em cache para ${key}`);
          return data;
        } else {
          console.log(`Cache expirado para ${key}`);
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (error) {
      console.error('Erro ao ler cache:', error);
    }
    return null;
  };
  
  // Função para salvar dados no cache local
  const saveToLocalCache = (key: string, data: any) => {
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  };
  
  // Estados para paginação
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15); // Número de registros por página
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Para o perfil vendedor, carregamos apenas suas próprias vendas, agora com paginação
  const { data: salesData = { data: [], total: 0, page: 1, totalPages: 1 }, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/sales", user?.role === "vendedor" ? user?.id : "all", page, limit, statusFilter, searchTerm, sortField, sortDirection, dateRange?.from?.toISOString(), dateRange?.to?.toISOString()],
    queryFn: async ({ queryKey }) => {
      // Preparar a URL com os parâmetros de paginação e filtros
      const baseUrl = "/api/sales";
      const queryParams = new URLSearchParams();
      
      // Adicionar parâmetros de paginação
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      // Adicionar parâmetros de ordenação
      if (sortField) queryParams.append("sortField", sortField);
      if (sortDirection) queryParams.append("sortDirection", sortDirection);
      
      // Adicionar filtros
      if (statusFilter) queryParams.append("status", statusFilter);
      if (searchTerm) queryParams.append("searchTerm", searchTerm);
      
      // Adicionar filtros de intervalo de datas
      if (dateRange?.from) {
        queryParams.append("startDate", dateRange.from.toISOString().split('T')[0]);
      }
      if (dateRange?.to) {
        queryParams.append("endDate", dateRange.to.toISOString().split('T')[0]);
      }
      
      // Vendedor só pode ver suas próprias vendas
      if (user?.role === "vendedor") {
        console.log("Carregando vendas específicas para o vendedor:", user.id);
        queryParams.append("sellerId", user.id.toString());
      }
      
      // Construir a URL final
      const url = `${baseUrl}?${queryParams.toString()}`;
      console.log("URL de consulta paginada:", url);
      
      // Dados críticos, não usamos cache local para vendas
      const response = await fetch(url, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        }
      });
      
      if (!response.ok) {
        throw new Error("Erro ao carregar vendas");
      }
      
      const data = await response.json();
      
      // Atualizar estados da paginação
      setTotalPages(data.totalPages);
      setTotalRecords(data.total);
      
      // Retornar o objeto completo com dados e metadados
      return data;
    },
    staleTime: 30000, // 30 segundos, dados de vendas são mais críticos
    refetchOnWindowFocus: true, // Atualize quando o usuário volta para a janela
  });
  
  // Extrair sales do salesData para manter compatibilidade com o restante do código
  const sales = salesData.data || [];

  // Os demais recursos podem usar uma abordagem otimizada com cache
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      // Verificar se temos dados em cache
      const cachedData = getFromLocalCache('customers');
      if (cachedData) return cachedData;
      
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error("Erro ao carregar clientes");
      }
      const data = await response.json();
      
      // Salvar no cache
      saveToLocalCache('customers', data);
      return data;
    },
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      // Verificar se temos dados em cache
      const cachedData = getFromLocalCache('users');
      if (cachedData) return cachedData;
      
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }
      const data = await response.json();
      
      // Salvar no cache
      saveToLocalCache('users', data);
      return data;
    },
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["/api/payment-methods"],
    queryFn: async () => {
      // Verificar se temos dados em cache
      const cachedData = getFromLocalCache('payment-methods');
      if (cachedData) return cachedData;
      
      const response = await fetch("/api/payment-methods");
      if (!response.ok) {
        throw new Error("Erro ao carregar formas de pagamento");
      }
      const data = await response.json();
      
      // Salvar no cache
      saveToLocalCache('payment-methods', data);
      return data;
    },
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
  });
  
  // Carregar tipos de serviço e prestadores de serviço com cache
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["/api/service-types"],
    queryFn: async () => {
      // Verificar se temos dados em cache
      const cachedData = getFromLocalCache('service-types');
      if (cachedData) return cachedData;
      
      const response = await fetch("/api/service-types");
      if (!response.ok) {
        throw new Error("Erro ao carregar tipos de serviço");
      }
      const data = await response.json();
      
      // Salvar no cache
      saveToLocalCache('service-types', data);
      return data;
    },
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
  });
  
  const { data: serviceProviders = [] } = useQuery({
    queryKey: ["/api/service-providers"],
    queryFn: async () => {
      // Verificar se temos dados em cache
      const cachedData = getFromLocalCache('service-providers');
      if (cachedData) return cachedData;
      
      const response = await fetch("/api/service-providers");
      if (!response.ok) {
        throw new Error("Erro ao carregar prestadores de serviço");
      }
      const data = await response.json();
      
      // Salvar no cache
      saveToLocalCache('service-providers', data);
      return data;
    },
    staleTime,
    gcTime,
    refetchOnWindowFocus: false,
  });

  // Preparar dados enriquecidos
  const enrichedSales = sales.map((sale: Sale) => {
    const customer = customers.find((c: any) => c.id === sale.customerId);
    const seller = users.find((u: any) => u.id === sale.sellerId);
    const paymentMethod = paymentMethods.find((p: any) => p.id === sale.paymentMethodId);
    const serviceType = serviceTypes.find((t: any) => t.id === sale.serviceTypeId);
    const serviceProvider = serviceProviders.find((p: any) => p.id === sale.serviceProviderId);
    
    return {
      ...sale,
      customerName: customer?.name || `Cliente #${sale.customerId}`,
      sellerName: seller?.username || `Vendedor #${sale.sellerId}`,
      paymentMethodName: paymentMethod?.name || `Forma de Pagamento #${sale.paymentMethodId}`,
      serviceTypeName: serviceType?.name || null,
      serviceProviderName: serviceProvider?.name || null
    };
  });

  // Filtrar vendas com base no termo de busca e filtro de status
  const filteredSales = useMemo(() => {
    let filtered = [...enrichedSales];
    
    return filtered;
  }, [enrichedSales]);

  // Usar o evento WebSocket para atualizar dados de vendas
  useEffect(() => {
    if (lastEvent?.type === 'sales_update') {
      console.log("Recebendo atualização de vendas via WebSocket");
      
      // Verificar se está na página de vendas antes de atualizar
      if (window.location.pathname.includes('/sales')) {
        refetch();
      }
    }
  }, [lastEvent, refetch]);

  // Removemos este useEffect que foi substituído pela função debounce acima

  // Manipulador de mudança de filtro de status
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1); // Resetar para a primeira página ao filtrar
  };

  // Manipulador de mudança de intervalo de datas
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1); // Resetar para a primeira página ao alterar datas
  };

  // Mutation para excluir uma venda
  const deleteSaleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/sales/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao excluir venda");
      }
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Venda excluída",
        description: `A venda foi excluída com sucesso.`,
      });
      setDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para devolver uma venda
  const returnSaleMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const response = await apiRequest("POST", `/api/sales/${id}/return`, { reason });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao devolver venda");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Venda devolvida",
        description: `A venda foi devolvida com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao devolver venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para iniciar a execução
  const startExecutionMutation = useMutation({
    mutationFn: async ({ id, serviceTypeId, serviceProviderId }: { id: number; serviceTypeId?: number; serviceProviderId?: number }) => {
      const response = await apiRequest("POST", `/api/sales/${id}/start-execution`, { 
        serviceTypeId, 
        serviceProviderId 
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao iniciar execução");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Execução iniciada",
        description: `A execução da venda foi iniciada com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao iniciar execução",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para concluir a execução
  const completeExecutionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/sales/${id}/complete-execution`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao concluir execução");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Execução concluída",
        description: `A execução da venda foi concluída com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao concluir execução",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para marcar como pago
  const markAsPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/sales/${id}/mark-as-paid`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao marcar como pago");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Pagamento registrado",
        description: `O pagamento da venda foi registrado com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para reenviar venda ao vendedor
  const resendSaleMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/sales/${id}/resend`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao reenviar venda");
      }
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Venda reenviada",
        description: `A venda foi reenviada ao vendedor com sucesso.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reenviar venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation para limpar todas as vendas (administrativo)
  const clearAllSalesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/sales/clear-all`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao limpar todas as vendas");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Vendas limpas",
        description: "Todas as vendas foram removidas com sucesso.",
      });
      setClearSalesDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao limpar vendas",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handler para atualização de vendas via WebSocket
  useEffect(() => {
    const handleSalesUpdateEvent = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail === 'sales_update') {
        console.log("Evento de atualização de vendas recebido");
        queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      }
    };

    // Adicionar ouvinte ao documento para eventos personalizados
    document.addEventListener('sales_update', handleSalesUpdateEvent);

    // Limpeza ao desmontar
    return () => {
      document.removeEventListener('sales_update', handleSalesUpdateEvent);
    };
  }, [queryClient]);

  // Handlers de ações para vendas
  const handleEdit = (sale: Sale) => {
    setSelectedSale(sale);
    setDialogOpen(true);
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailsDialogOpen(true);
  };

  const handleDeleteClick = (sale: Sale) => {
    setSelectedSale(sale);
    setDeleteDialogOpen(true);
  };

  const handleReturnClick = (sale: Sale) => {
    setSelectedSale(sale);
    setReturnDialogOpen(true);
  };

  const handleStartExecution = (sale: Sale) => {
    setSelectedSale(sale);
    setOperationDialogOpen(true);
  };

  const handleCompleteExecution = (sale: Sale) => {
    completeExecutionMutation.mutate(sale.id);
  };

  const handleMarkAsPaid = (sale: Sale) => {
    markAsPaidMutation.mutate(sale.id);
  };

  const handleViewHistory = (sale: Sale) => {
    setSelectedSale(sale);
    setHistoryDialogOpen(true);
  };

  // Confirmar exclusão
  const handleConfirmDelete = () => {
    if (selectedSale) {
      deleteSaleMutation.mutate(selectedSale.id);
    }
  };

  // Confirmar limpeza de todas as vendas
  const handleConfirmClearAllSales = () => {
    clearAllSalesMutation.mutate();
  };

  // Função para alternar ordenação
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      // Se já estamos ordenando por este campo, alternamos a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Caso contrário, mudamos o campo e definimos a direção para ascendente
      setSortField(field);
      setSortDirection('asc');
    }
    setPage(1); // Resetar para a primeira página ao alterar ordenação
  };

  // Função para exportar dados em Excel
  const exportToExcel = () => {
    const exportData = filteredSales.map((sale: Sale) => ({
      'Número OS': sale.orderNumber,
      'Data': sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : '',
      'Cliente': sale.customerName || '',
      'Vendedor': sale.sellerName || '',
      'Forma de Pagamento': sale.paymentMethodName || '',
      'Valor Total': parseFloat(sale.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      'Status': getStatusLabel(sale.status),
      'Observações': sale.notes || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendas");
    
    // Ajustar largura das colunas
    const colWidths = [
      { wch: 12 }, // Número OS
      { wch: 12 }, // Data
      { wch: 25 }, // Cliente
      { wch: 15 }, // Vendedor
      { wch: 20 }, // Forma de Pagamento
      { wch: 15 }, // Valor Total
      { wch: 15 }, // Status
      { wch: 30 }, // Observações
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, "vendas.xlsx");
  };

  // Função para exportar dados em PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Adicionar cabeçalho
    doc.setFontSize(18);
    doc.text("Relatório de Vendas", 105, 15, { align: "center" });
    doc.setFontSize(12);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 22, { align: "center" });
    
    // Preparar dados para a tabela
    const tableData = filteredSales.map((sale: Sale) => [
      sale.orderNumber,
      sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : '',
      sale.customerName || '',
      sale.sellerName || '',
      parseFloat(sale.totalAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      getStatusLabel(sale.status)
    ]);
    
    // Adicionar tabela
    autoTable(doc, {
      head: [['Número OS', 'Data', 'Cliente', 'Vendedor', 'Valor Total', 'Status']],
      body: tableData,
      startY: 30,
      headStyles: { fillColor: [41, 128, 185] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { top: 30 },
    });
    
    doc.save("vendas.pdf");
  };

  // Se estiver carregando, mostre um indicador de carregamento
  if (isLoading && !isRefreshing && !sales.length) {
    return (
      <div className="container py-8 space-y-6">
        <div className="flex justify-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="text-center text-muted-foreground">
          Carregando vendas...
        </div>
      </div>
    );
  }

  // Renderização para desktop
  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">
            Gerencie as vendas da sua empresa
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="gap-1 items-center" 
            onClick={exportToExcel}
          >
            <FileText className="h-4 w-4" /> 
            <span className="hidden sm:inline">Excel</span>
          </Button>
          <Button 
            variant="outline" 
            className="gap-1 items-center" 
            onClick={exportToPDF}
          >
            <FileText className="h-4 w-4" /> 
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button 
            onClick={() => setShowCreateVendaDialog(true)} 
            className="gap-1 items-center"
          >
            <Plus className="h-4 w-4" /> 
            <span className="hidden sm:inline">Nova Venda</span>
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            value={internalSearchTerm}
            onChange={(e) => debouncedSearch(e.target.value)}
            placeholder="Pesquisar por número OS, cliente ou vendedor..." 
            className="pl-10"
            ref={searchInputRef}
          />
        </div>
        
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="completed">Concluída</SelectItem>
            <SelectItem value="returned">Devolvida</SelectItem>
            <SelectItem value="corrected">Corrigida</SelectItem>
          </SelectContent>
        </Select>
        
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          placeholder="Filtrar por período"
          locale={ptBR}
          className="w-[250px]"
        />
        
        <div className="md:col-span-3 flex justify-end">
          {user?.role === 'admin' && (
            <Button 
              onClick={() => setClearSalesDialogOpen(true)} 
              variant="destructive" 
              size="sm"
              className="gap-1 items-center"
            >
              <Trash2 className="h-4 w-4" /> 
              Limpar Vendas
            </Button>
          )}
        </div>
      </div>
      
      {/* Interface única para dispositivos móveis e desktop */}
      <div className="w-full overflow-hidden">
        <PaginatedSalesTable
          data={filteredSales}
          isLoading={isLoading}
          error={error as Error}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={toggleSort}
          currentPage={page}
          totalPages={totalPages}
          pageSize={limit}
          totalItems={salesData?.total || 0}
          onPageChange={(newPage) => setPage(newPage)}
          onPageSizeChange={(newSize) => {
            setLimit(newSize);
            setPage(1); // Voltar para a primeira página ao alterar o tamanho
          }}
          onViewDetails={handleViewDetails}
          onViewHistory={handleViewHistory}
          onEdit={handleEdit}
          onStartExecution={handleStartExecution}
          onCompleteExecution={handleCompleteExecution}
          onReturnClick={handleReturnClick}
          onMarkAsPaid={handleMarkAsPaid}
          onDeleteClick={handleDeleteClick}
          user={user}
          ReenviaButton={ReenviaButton}
          DevolveButton={DevolveButton}
        />
      </div>
      
      {/* Diálogo apenas para edição de vendas existentes */}
      {dialogOpen && (
        <SaleDialog
          open={dialogOpen}
          onClose={() => {
            console.log("Fechando diálogo de edição de venda");
            setDialogOpen(false);
          }}
          sale={selectedSale}
          onSaveSuccess={() => {
            console.log("Venda atualizada com sucesso");
            toast({
              title: "Venda atualizada",
              description: "A venda foi atualizada com sucesso",
            });
            queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
            setDialogOpen(false);
          }}
        />
      )}
      
      {/* Diálogo de detalhes */}
      <SaleDetailsDialog
        open={detailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        saleId={selectedSale?.id}
      />
      
      {/* Diálogo de devolução */}
      <SaleReturnDialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        saleId={selectedSale?.id}
        onReturnSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
          setReturnDialogOpen(false);
        }}
      />
      
      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a venda com número de OS{" "}
              <span className="font-semibold">{selectedSale?.orderNumber}</span>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Diálogo de confirmação para limpar todas as vendas */}
      <AlertDialog open={clearSalesDialogOpen} onOpenChange={setClearSalesDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ ATENÇÃO: Ação Irreversível!</AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                Esta ação <strong>não pode ser desfeita</strong>. Todas as vendas, itens e históricos serão 
                <strong className="text-destructive"> permanentemente excluídos</strong> do sistema.
              </p>
              <p className="mb-2">
                Use esta opção apenas em ambiente de testes ou quando precisar limpar completamente os dados.
              </p>
              <p className="font-semibold">
                Tem certeza que deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmClearAllSales}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sim, Limpar Todas as Vendas
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Novo diálogo dedicado para criação de vendas */}
      {showCreateVendaDialog && (
        <SaleDialog 
          open={showCreateVendaDialog} 
          onClose={() => {
            console.log("Fechando diálogo de criação de venda");
            setShowCreateVendaDialog(false);
          }}
          sale={null}
          onSaveSuccess={() => {
            setShowCreateVendaDialog(false);
            toast({
              title: "Venda criada",
              description: "A venda foi criada com sucesso",
            });
            refetch();
          }}
        />
      )}
      
      {/* Diálogo de operação da venda para operacionais */}
      <SaleOperationDialog
        open={operationDialogOpen}
        onClose={() => setOperationDialogOpen(false)}
        saleId={selectedSale?.id}
      />
      
      {/* Diálogo de histórico de vendas */}
      <SaleHistoryDialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        saleId={selectedSale?.id}
      />
      
      {/* O diálogo de reenvio está agora encapsulado no componente ReenviaButton */}
    </div>
  );
}