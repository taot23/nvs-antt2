import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { 
  ArrowLeft, 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  User, 
  Calendar, 
  Timer, 
  AlertCircle,
  Check,
  FilePdf
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ReportExecutionProps {
  reportId?: number;
  executionId?: number;
  onBack: () => void;
}

export function ReportExecution({
  reportId,
  executionId,
  onBack,
}: ReportExecutionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"data" | "params" | "info">("data");
  const [columns, setColumns] = useState<any[]>([]);
  const exportDataRef = useRef<any[]>([]);
  
  // Estado para armazenar o cabeçalho do relatório para exportação
  const [reportHeader, setReportHeader] = useState({
    title: "",
    date: new Date(),
    parameters: {} as Record<string, string>,
  });

  // Buscar relatório por ID (para executar um novo relatório)
  const { 
    data: report, 
    isLoading: isLoadingReport,
    error: reportError,
  } = useQuery({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId && !executionId,
  });

  // Buscar execução específica (para visualizar resultados existentes)
  const { 
    data: execution, 
    isLoading: isLoadingExecution,
    error: executionError
  } = useQuery({
    queryKey: ["/api/report-executions", executionId],
    enabled: !!executionId,
  });

  // Preparar os dados para exibição quando a execução for carregada
  useEffect(() => {
    if (execution && execution.results && execution.results.length > 0) {
      // Construir as colunas dinamicamente com base nos resultados
      const sampleRow = execution.results[0];
      const newColumns = Object.keys(sampleRow).map(key => ({
        accessorKey: key,
        header: key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        cell: ({ row }: any) => {
          const value = row.getValue(key);
          
          // Formatar valores de data
          if (value && typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}(T.*)?$/)) {
            try {
              const date = new Date(value);
              return format(date, "dd/MM/yyyy", { locale: ptBR });
            } catch (e) {
              return value;
            }
          }
          
          // Formatar valores numéricos
          if (typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) {
            // Se parecer um valor monetário
            if (key.includes('valor') || key.includes('price') || key.includes('amount') || key.includes('total')) {
              try {
                return `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              } catch (e) {
                return value;
              }
            }
          }
          
          return value;
        }
      }));
      
      setColumns(newColumns);
      
      // Armazenar dados para exportação
      exportDataRef.current = execution.results;
      
      // Configurar o cabeçalho do relatório para exportação
      setReportHeader({
        title: execution.name || execution.report_name || "Relatório",
        date: new Date(execution.created_at),
        parameters: execution.parameters || {},
      });
    }
  }, [execution]);

  // Exportar para Excel
  const exportToExcel = () => {
    try {
      if (!exportDataRef.current.length) {
        toast({
          title: "Erro ao exportar",
          description: "Não há dados para exportar.",
          variant: "destructive",
        });
        return;
      }
      
      const reportTitle = reportHeader.title;
      const dateStr = format(reportHeader.date, "dd/MM/yyyy HH:mm", { locale: ptBR });
      
      // Criar nova planilha
      const ws = XLSX.utils.json_to_sheet(exportDataRef.current);
      const wb = XLSX.utils.book_new();
      
      // Adicionar metadados
      wb.Props = {
        Title: reportTitle,
        Author: user?.username || "Sistema",
        CreatedDate: new Date()
      };
      
      // Adicionar planilha ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Relatório");
      
      // Salvar arquivo
      const fileName = `${reportTitle.replace(/\s+/g, '_')}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        description: "Relatório exportado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar para Excel.",
        variant: "destructive",
      });
    }
  };

  // Exportar para PDF
  const exportToPdf = () => {
    try {
      if (!exportDataRef.current.length) {
        toast({
          title: "Erro ao exportar",
          description: "Não há dados para exportar.",
          variant: "destructive",
        });
        return;
      }
      
      const reportTitle = reportHeader.title;
      const dateStr = format(reportHeader.date, "dd/MM/yyyy HH:mm", { locale: ptBR });
      
      // Criar documento PDF
      const doc = new jsPDF();
      
      // Adicionar título e data
      doc.setFontSize(16);
      doc.text(reportTitle, 14, 20);
      doc.setFontSize(10);
      doc.text(`Gerado em: ${dateStr}`, 14, 28);
      doc.text(`Usuário: ${user?.username || "Sistema"}`, 14, 34);
      
      // Adicionar parâmetros se existirem
      let paramY = 40;
      if (Object.keys(reportHeader.parameters).length > 0) {
        doc.text("Parâmetros:", 14, paramY);
        paramY += 6;
        
        Object.entries(reportHeader.parameters).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`, 14, paramY);
          paramY += 6;
        });
      }
      
      // Organizar dados para a tabela
      const tableData = exportDataRef.current.map(row => {
        return Object.values(row);
      });
      
      // Cabeçalhos da tabela
      const headers = columns.map(col => col.header);
      
      // Adicionar a tabela
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: paramY + 4,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [60, 60, 60] },
        margin: { top: 10 },
      });
      
      // Salvar arquivo
      const fileName = `${reportTitle.replace(/\s+/g, '_')}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`;
      doc.save(fileName);
      
      toast({
        description: "Relatório exportado com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar para PDF.",
        variant: "destructive",
      });
    }
  };

  // Verificar se está carregando
  const isLoading = isLoadingReport || isLoadingExecution;
  
  // Verificar se houve erro
  const hasError = reportError || executionError;
  
  // Informações do relatório
  const reportName = execution?.name || execution?.report_name || report?.name || "Relatório";
  const reportDescription = execution?.description || report?.description || "";

  // Renderizar conteúdo da aba de dados
  const renderDataTab = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }
    
    if (hasError) {
      return (
        <div className="bg-red-50 p-4 rounded-md text-red-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Erro ao carregar relatório</h3>
          </div>
          <p className="mt-2 text-sm">
            Ocorreu um erro ao carregar os dados do relatório. Tente novamente mais tarde.
          </p>
        </div>
      );
    }
    
    // Verificar se há resultados
    if (!execution?.results || execution.results.length === 0) {
      return (
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
          <p>Nenhum resultado encontrado para os critérios selecionados.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={execution.results}
          showPagination={true}
          searchable={true}
          searchPlaceholder="Buscar nos resultados..."
        />
      </div>
    );
  };

  // Renderizar conteúdo da aba de parâmetros
  const renderParamsTab = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      );
    }
    
    const parameters = execution?.parameters || {};
    const hasParameters = Object.keys(parameters).length > 0;
    
    if (!hasParameters) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhum parâmetro foi utilizado nesta execução.</p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(parameters).map(([key, value]) => (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{key}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base">{value as string}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Renderizar conteúdo da aba de informações
  const renderInfoTab = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      );
    }
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Data de Execução
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base">
                {execution?.created_at 
                  ? format(new Date(execution.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }) 
                  : "Não disponível"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <User className="h-4 w-4 mr-2" />
                Executado por
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base">{execution?.username || "Não disponível"}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <Timer className="h-4 w-4 mr-2" />
                Tempo de Execução
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base">
                {execution?.execution_time 
                  ? `${execution.execution_time.toFixed(2)} segundos` 
                  : "Não disponível"}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {execution?.status === "success" ? (
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                  <Check className="h-3 w-3 mr-1" />
                  Concluído com sucesso
                </Badge>
              ) : execution?.status === "error" ? (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Erro
                </Badge>
              ) : (
                <Badge variant="outline">Processando</Badge>
              )}
              
              {execution?.error_message && (
                <div className="mt-2 p-2 bg-red-50 text-red-800 text-sm rounded">
                  {execution.error_message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportToExcel} 
            disabled={isLoading || !execution?.results || execution.results.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={exportToPdf} 
            disabled={isLoading || !execution?.results || execution.results.length === 0}
          >
            <FilePdf className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>
      
      <div>
        <h1 className="text-2xl font-bold">{reportName}</h1>
        {reportDescription && (
          <p className="text-muted-foreground mt-1">{reportDescription}</p>
        )}
      </div>
      
      <Tabs defaultValue="data" value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="data">Dados</TabsTrigger>
          <TabsTrigger value="params">Parâmetros</TabsTrigger>
          <TabsTrigger value="info">Informações</TabsTrigger>
        </TabsList>
        <TabsContent value="data" className="mt-4">
          {renderDataTab()}
        </TabsContent>
        <TabsContent value="params" className="mt-4">
          {renderParamsTab()}
        </TabsContent>
        <TabsContent value="info" className="mt-4">
          {renderInfoTab()}
        </TabsContent>
      </Tabs>
    </div>
  );
}