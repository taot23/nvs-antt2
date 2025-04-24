import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Trash2, Plus, Search, FileText, Download, SortAsc, SortDesc, Eye, CornerDownRight, CheckCircle2, XCircle, AlertTriangle, SendHorizontal, CornerUpLeft, DollarSign, RefreshCw, ClipboardList } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableCaption } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useWebSocket } from "@/hooks/use-websocket";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import SaleDialog from "@/components/sales/sale-dialog";
import SaleDetailsDialog from "@/components/sales/sale-details-dialog";
import SaleReturnDialog from "@/components/sales/sale-return-dialog";
import SaleOperationDialog from "@/components/sales/sale-operation-dialog";
import SaleHistoryDialog from "@/components/sales/sale-history-dialog";
import ReenviaButton from "@/components/sales/reenvia-button";

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

// Função para obter a descrição do status
function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'in_progress': return 'Em Andamento';
    case 'returned': return 'Devolvida';
    case 'completed': return 'Concluída';
    case 'canceled': return 'Cancelada';
    case 'corrected': return 'Corrigida Aguardando Operacional';
    default: return status;
  }
}

// Função para obter a cor do status
function getStatusVariant(status: string) {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'secondary';
    case 'returned': return 'destructive';
    case 'completed': return 'success';
    case 'canceled': return 'outline';
    case 'corrected': return 'primary';
    default: return 'default';
  }
}

// Componente principal
export default function SalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isMobile = useIsMobile();
  const { lastEvent, isConnected, reconnect } = useWebSocket();
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Estados
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
  
  // Queries e Mutations
  // Para o perfil vendedor, carregamos apenas suas próprias vendas
  const { data: sales = [], isLoading, error, refetch } = useQuery({
    queryKey: ["/api/sales", user?.role === "vendedor" ? user?.id : "all"],
    queryFn: async () => {
      // Vendedor só pode ver suas próprias vendas
      let url = "/api/sales";
      if (user?.role === "vendedor") {
        console.log("Carregando vendas específicas para o vendedor:", user.id);
        url = `/api/sales?sellerId=${user.id}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Erro ao carregar vendas");
      }
      return response.json();
    }
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error("Erro ao carregar clientes");
      }
      return response.json();
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }
      return response.json();
    }
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["/api/payment-methods"],
    queryFn: async () => {
      const response = await fetch("/api/payment-methods");
      if (!response.ok) {
        throw new Error("Erro ao carregar formas de pagamento");
      }
      return response.json();
    }
  });
  
  // Preparar dados enriquecidos
  const enrichedSales = sales.map((sale: Sale) => {
    const customer = customers.find((c: any) => c.id === sale.customerId);
    const seller = users.find((u: any) => u.id === sale.sellerId);
    const paymentMethod = paymentMethods.find((p: any) => p.id === sale.paymentMethodId);
    
    return {
      ...sale,
      customerName: customer?.name || `Cliente #${sale.customerId}`,
      sellerName: seller?.username || `Vendedor #${sale.sellerId}`,
      paymentMethodName: paymentMethod?.name || `Forma de Pagamento #${sale.paymentMethodId}`
    };
  });
  
  // Mutation para excluir uma venda
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sales/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao excluir venda");
      }
      
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Venda excluída",
        description: "A venda foi excluída com sucesso",
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
  
  // Mutation para iniciar execução
  const startExecutionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sales/${id}/start-execution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao iniciar execução da venda");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Execução iniciada",
        description: "A execução da venda foi iniciada com sucesso",
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
  
  // Mutation para completar execução
  const completeExecutionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sales/${id}/complete-execution`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao concluir execução da venda");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Execução concluída",
        description: "A execução da venda foi concluída com sucesso",
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
  
  // Mutation para limpar todas as vendas
  const clearAllSalesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/admin/clear-sales`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao limpar vendas");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Vendas removidas",
        description: `Foram removidas ${data.count} vendas do sistema`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao limpar vendas",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Mutation para reenviar venda corrigida
  const resendSaleMutation = useMutation({
    mutationFn: async (id: number) => {
      console.log("Iniciando mutation para reenviar diretamente venda:", id);
      // Usar apiRequest ao invés de fetch diretamente
      const response = await apiRequest("POST", `/api/sales/${id}/resend`, {
        notes: "Venda corrigida e reenviada via botão rápido"
      });
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Venda reenviada",
        description: "A venda corrigida foi reenviada com sucesso para o setor operacional",
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

  // Mutation para marcar como paga
  const markAsPaidMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/sales/${id}/mark-paid`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao marcar venda como paga");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: "Pagamento confirmado",
        description: "A venda foi marcada como paga com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Efeito para escutar atualizações via WebSocket
  useEffect(() => {
    if (lastEvent?.type === 'sales_update') {
      console.log('Recebida atualização de vendas via WebSocket');
      
      // Atualizar automaticamente os dados
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      
      // Mostrar notificação
      toast({
        title: "Atualização de vendas",
        description: "As vendas foram atualizadas",
      });
    }
  }, [lastEvent, queryClient, toast]);
  
  // Função para forçar a atualização dos dados
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Primeiro tentar reconectar o WebSocket se não estiver conectado
      if (!isConnected) {
        console.log('WebSocket não conectado. Tentando reconectar...');
        reconnect();
      }
      
      // Então atualizar os dados
      await refetch();
      toast({
        title: "Dados atualizados",
        description: "Os dados de vendas foram atualizados",
      });
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar os dados",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Handlers
  const handleOpenCreateDialog = () => {
    console.log("Botão Nova Venda clicado");
    // Limpar a venda selecionada e abrir o diálogo de criação
    setSelectedSale(null);
    // Usar o novo estado específico
    setShowCreateVendaDialog(true);
    
    // Logs para diagnóstico
    console.log("Abrindo diálogo de nova venda usando showCreateVendaDialog");
  };
  
  const handleEdit = (sale: Sale) => {
    console.log("Botão Editar Venda clicado para venda:", sale.id);
    // Primeiro selecionamos a venda
    setSelectedSale(sale);
    // Usar um setTimeout para garantir que o estado seja atualizado
    setTimeout(() => {
      // Então abrir o diálogo
      setDialogOpen(true);
      console.log("Estado do diálogo após editar:", true);
    }, 0);
  };
  
  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    setDetailsDialogOpen(true);
  };
  
  const handleDeleteClick = (sale: Sale) => {
    setSelectedSale(sale);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (selectedSale) {
      deleteMutation.mutate(selectedSale.id);
    }
  };
  
  const handleReturnClick = (sale: Sale) => {
    setSelectedSale(sale);
    setReturnDialogOpen(true);
  };
  
  const handleStartExecution = (sale: Sale) => {
    // Novo fluxo: abrir tela de tratativa ao invés de executar diretamente
    if (user?.role === "operacional" || user?.role === "admin") {
      setSelectedSale(sale);
      setOperationDialogOpen(true);
    } else {
      // Manter o comportamento anterior para outros casos
      startExecutionMutation.mutate(sale.id);
    }
  };
  
  const handleCompleteExecution = (sale: Sale) => {
    // Novo fluxo: abrir tela de tratativa para vendas em andamento também
    if (user?.role === "operacional" || user?.role === "admin") {
      setSelectedSale(sale);
      setOperationDialogOpen(true);
    } else {
      // Manter o comportamento anterior para outros casos
      completeExecutionMutation.mutate(sale.id);
    }
  };
  
  const handleMarkAsPaid = (sale: Sale) => {
    markAsPaidMutation.mutate(sale.id);
  };
  
  // Handler para visualizar histórico de status da venda
  const handleViewHistory = (sale: Sale) => {
    setSelectedSale(sale);
    setHistoryDialogOpen(true);
  };
  
  // Mutation para reenvio direto (usado por usuários não vendedores)
  const handleDirectResend = (saleId: number) => {
    console.log("Chamando mutation direta para reenvio (perfil não vendedor)");
    resendSaleMutation.mutate(saleId);
  };
  
  // Handler para limpar todas as vendas
  const handleClearAllSales = () => {
    setClearSalesDialogOpen(true);
  };
  
  const handleConfirmClearAllSales = () => {
    clearAllSalesMutation.mutate();
    setClearSalesDialogOpen(false);
  };
  
  const clearSearch = () => {
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // Exportação para Excel
  const exportToExcel = () => {
    const exportData = filteredSales.map((sale: Sale) => ({
      'Nº OS': sale.orderNumber,
      'Data': format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR }),
      'Cliente': sale.customerName,
      'Vendedor': sale.sellerName,
      'Valor Total': `R$ ${parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}`,
      'Status': getStatusLabel(sale.status),
      'Pago': sale.financialStatus === 'paid' ? 'Sim' : 'Não',
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vendas");
    XLSX.writeFile(workbook, "vendas.xlsx");
  };
  
  // Exportação para PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Título
    doc.setFontSize(18);
    doc.text("Relatório de Vendas", 14, 22);
    
    // Data do relatório
    doc.setFontSize(11);
    doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 30);
    
    // Filtro aplicado
    if (statusFilter) {
      doc.text(`Filtro: ${getStatusLabel(statusFilter)}`, 14, 38);
    }
    
    // Dados para a tabela
    const tableData = filteredSales.map((sale: Sale) => [
      sale.orderNumber,
      format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR }),
      sale.customerName,
      sale.sellerName,
      `R$ ${parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}`,
      getStatusLabel(sale.status),
    ]);
    
    // Criar tabela
    autoTable(doc, {
      startY: statusFilter ? 45 : 38,
      head: [['Nº OS', 'Data', 'Cliente', 'Vendedor', 'Valor Total', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [75, 75, 75] },
    });
    
    doc.save("vendas.pdf");
  };
  
  // Filtrar e ordenar vendas
  const filteredSales = enrichedSales
    .filter((sale: Sale) => {
      // Filtro por status
      if (statusFilter && sale.status !== statusFilter) {
        return false;
      }
      
      // Filtro por termo de busca
      const searchLower = searchTerm.toLowerCase();
      return (
        !searchTerm ||
        sale.orderNumber.toLowerCase().includes(searchLower) ||
        sale.customerName?.toLowerCase().includes(searchLower) ||
        sale.sellerName?.toLowerCase().includes(searchLower) ||
        getStatusLabel(sale.status).toLowerCase().includes(searchLower)
      );
    })
    .sort((a: Sale, b: Sale) => {
      // Ordenação
      const factor = sortDirection === 'asc' ? 1 : -1;
      
      switch (sortField) {
        case 'orderNumber':
          return a.orderNumber.localeCompare(b.orderNumber) * factor;
        case 'date':
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * factor;
        case 'customerName':
          return (a.customerName?.localeCompare(b.customerName || '') || 0) * factor;
        case 'sellerName':
          return (a.sellerName?.localeCompare(b.sellerName || '') || 0) * factor;
        case 'totalAmount':
          return (parseFloat(a.totalAmount) - parseFloat(b.totalAmount)) * factor;
        case 'status':
          return a.status.localeCompare(b.status) * factor;
        default:
          return 0;
      }
    });
  
  // Renderização para dispositivos móveis
  if (isMobile) {
    return (
      <div className="container py-4 space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Vendas</h1>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Atualizar dados"
              className={`h-8 w-8 ${isConnected ? "border-green-500" : ""}`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            </Button>
            
            <Button size="sm" onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              type="search"
              placeholder="Buscar venda..."
              className="pl-8 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-9 px-2.5"
                onClick={clearSearch}
              >
                <span className="sr-only">Limpar</span>
                &times;
              </Button>
            )}
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button 
              variant={!statusFilter ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("")}
            >
              Todas
            </Button>
            <Button 
              variant={statusFilter === "pending" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("pending")}
            >
              Pendentes
            </Button>
            <Button 
              variant={statusFilter === "in_progress" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("in_progress")}
            >
              Em Andamento
            </Button>
            <Button 
              variant={statusFilter === "completed" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("completed")}
            >
              Concluídas
            </Button>
            <Button 
              variant={statusFilter === "returned" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("returned")}
            >
              Devolvidas
            </Button>
          </div>
        </div>
        
        <div className="grid gap-4">
          {isLoading ? (
            <div className="text-center py-10">Carregando vendas...</div>
          ) : error ? (
            <div className="text-center py-10 text-destructive">Erro ao carregar vendas</div>
          ) : filteredSales.length === 0 ? (
            <div className="text-center py-10">
              {searchTerm || statusFilter
                ? "Nenhuma venda encontrada para sua busca"
                : "Nenhuma venda cadastrada ainda"}
            </div>
          ) : (
            filteredSales.map((sale: Sale) => (
              <Card key={sale.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base flex items-center">
                        OS: {sale.orderNumber}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR })}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(sale.status) as any}>
                      {getStatusLabel(sale.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="p-4 pt-0 pb-2 grid gap-1">
                  <div className="text-sm">
                    <span className="text-muted-foreground text-xs">Cliente:</span>{" "}
                    {sale.customerName}
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-muted-foreground text-xs">Vendedor:</span>{" "}
                    {sale.sellerName}
                  </div>
                  
                  <div className="text-sm">
                    <span className="text-muted-foreground text-xs">Valor:</span>{" "}
                    <span className="font-semibold">
                      R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  
                  {sale.returnReason && (
                    <div className="text-sm mt-1 text-destructive">
                      <span className="text-xs font-semibold">Motivo da devolução:</span>{" "}
                      {sale.returnReason}
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="p-2 pt-0 flex flex-wrap gap-1">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 px-2 flex-grow"
                    onClick={() => handleViewDetails(sale)}
                  >
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    Detalhes
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-2 flex-grow"
                    onClick={() => handleViewHistory(sale)}
                  >
                    <ClipboardList className="h-3.5 w-3.5 mr-1" />
                    Histórico
                  </Button>
                  
                  {/* Botões de ação com base no status e permissões */}
                  {user?.role === "admin" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 flex-grow"
                      onClick={() => handleEdit(sale)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Editar
                    </Button>
                  )}
                  
                  {/* Botão para operacionais iniciarem execução */}
                  {(user?.role === "admin" || user?.role === "operacional") && 
                    (sale.status === "pending" || sale.status === "corrected") && (
                    <Button
                      size="sm"
                      variant={sale.status === "corrected" ? "default" : "outline"}
                      className={`h-8 px-2 flex-grow ${sale.status === "corrected" ? "bg-primary hover:bg-primary/90" : ""}`}
                      onClick={() => handleStartExecution(sale)}
                    >
                      <CornerDownRight className="h-3.5 w-3.5 mr-1" />
                      Iniciar
                    </Button>
                  )}
                  
                  {/* Botão para operacionais concluírem execução */}
                  {(user?.role === "admin" || user?.role === "operacional") && 
                    sale.status === "in_progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 flex-grow"
                      onClick={() => handleCompleteExecution(sale)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Concluir
                    </Button>
                  )}
                  
                  {/* Botão para operacionais devolverem a venda */}
                  {(user?.role === "admin" || user?.role === "operacional") && 
                    (sale.status === "pending" || sale.status === "in_progress") && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 px-2 flex-grow text-destructive border-destructive hover:bg-destructive/10"
                      onClick={() => handleReturnClick(sale)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                      Devolver
                    </Button>
                  )}
                  
                  {/* Botão para vendedor reenviar venda corrigida */}
                  {(user?.role === "admin" || (user?.role === "vendedor" && sale.sellerId === user?.id)) && (
                    <ReenviaButton sale={sale} />
                  )}
                  
                  {/* Botão para financeiro marcar como paga */}
                  {(user?.role === "admin" || user?.role === "financeiro") && 
                    sale.status === "completed" && 
                    sale.financialStatus !== "paid" && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 px-2 flex-grow"
                      onClick={() => handleMarkAsPaid(sale)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                      Confirmar Pagamento
                    </Button>
                  )}
                  
                  {/* Botão de exclusão (apenas admin) */}
                  {user?.role === "admin" && (
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-8 px-2 flex-grow"
                      onClick={() => handleDeleteClick(sale)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Excluir
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))
          )}
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
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Atualizar dados"
            className={isConnected ? "border-green-500" : ""}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </Button>
          
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Venda
          </Button>
        </div>
      </div>
      
      {/* Barra de ferramentas */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchInputRef}
            type="search"
            placeholder="Buscar venda..."
            className="pl-8 pr-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-9 px-2.5"
              onClick={clearSearch}
            >
              <span className="sr-only">Limpar</span>
              &times;
            </Button>
          )}
        </div>
        
        <div className="flex gap-3">
          <div className="flex gap-1">
            <Button 
              variant={!statusFilter ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("")}
            >
              Todas
            </Button>
            <Button 
              variant={statusFilter === "pending" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("pending")}
            >
              Pendentes
            </Button>
            <Button 
              variant={statusFilter === "in_progress" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("in_progress")}
            >
              Em Andamento
            </Button>
            <Button 
              variant={statusFilter === "completed" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("completed")}
            >
              Concluídas
            </Button>
            <Button 
              variant={statusFilter === "returned" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("returned")}
            >
              Devolvidas
            </Button>
            <Button 
              variant={statusFilter === "corrected" ? "default" : "outline"} 
              size="sm" 
              onClick={() => setStatusFilter("corrected")}
              className={statusFilter === "corrected" ? "" : "border-primary text-primary hover:bg-primary/10"}
            >
              Corrigidas
            </Button>
          </div>
          
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={exportToPDF}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar PDF
            </Button>
            <Button variant="outline" onClick={exportToExcel}>
              <Download className="mr-2 h-4 w-4" />
              Exportar Excel
            </Button>
            
            {/* Botão de administração para limpar todas as vendas */}
            {(user?.role === "admin" || user?.role === "operacional") && (
              <Button 
                variant="destructive" 
                onClick={handleClearAllSales}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Vendas
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableCaption>
              {filteredSales.length === 0
                ? "Nenhuma venda encontrada"
                : `Total de ${filteredSales.length} vendas${searchTerm || statusFilter ? " encontradas" : ""}`}
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
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    Carregando vendas...
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24 text-destructive">
                    Erro ao carregar vendas
                  </TableCell>
                </TableRow>
              ) : filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    {searchTerm || statusFilter
                      ? "Nenhuma venda encontrada para sua busca" 
                      : "Nenhuma venda cadastrada ainda"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale: Sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {sale.orderNumber}
                    </TableCell>
                    <TableCell>
                      {sale.date ? 
                        format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR }) : 
                        format(new Date(), 'dd/MM/yyyy', { locale: ptBR })}
                    </TableCell>
                    <TableCell>{sale.customerName}</TableCell>
                    <TableCell>{sale.sellerName}</TableCell>
                    <TableCell>
                      R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
                    </TableCell>
                    <TableCell>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetails(sale)}
                          className="h-8 w-8"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewHistory(sale)}
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
                            onClick={() => handleEdit(sale)}
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
                            onClick={() => handleStartExecution(sale)}
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
                            onClick={() => handleCompleteExecution(sale)}
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
                            onClick={() => handleReturnClick(sale)}
                            className="h-8 w-8 text-amber-500 hover:text-amber-700 hover:bg-amber-50"
                            title="Devolver para correção"
                          >
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {/* Novo botão de reenvio para vendedor */}
                        {(user?.role === "admin" || (user?.role === "vendedor" && sale.sellerId === user?.id)) && (
                          <ReenviaButton sale={sale} />
                        )}
                        
                        {/* Permissão para marcar como paga (financeiro/admin) */}
                        {(user?.role === "admin" || user?.role === "financeiro") && 
                          sale.status === "completed" && 
                          sale.financialStatus !== "paid" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleMarkAsPaid(sale)}
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
                            onClick={() => handleDeleteClick(sale)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
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