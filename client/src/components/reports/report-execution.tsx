import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Book,
  Calendar,
  Download,
  File,
  Filter,
  Play,
  X,
} from "lucide-react";
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  const [activeTab, setActiveTab] = useState("parameters");
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"excel" | "pdf">("excel");
  
  // Estado para armazenar os parâmetros do relatório
  const [parameters, setParameters] = useState<any>({});
  
  // Buscar informações do relatório
  const { data: report, isLoading: isLoadingReport } = useQuery({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });
  
  // Buscar execução específica do relatório
  const { data: execution, isLoading: isLoadingExecution } = useQuery({
    queryKey: ["/api/reports/executions", executionId],
    enabled: !!executionId,
  });

  // Mutation para executar relatório
  const executeReportMutation = useMutation({
    mutationFn: async () => {
      if (!reportId) throw new Error("ID do relatório não informado");
      const res = await apiRequest(
        "POST",
        `/api/reports/${reportId}/execute`,
        { parameters }
      );
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Relatório executado com sucesso",
        description: `O relatório foi executado em ${data.execution.execution_time.toFixed(2)} segundos.`,
      });
      
      // Invalidar cache e mudar para tab de resultados
      queryClient.invalidateQueries({ queryKey: ["/api/reports", reportId, "executions"] });
      setActiveTab("results");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao executar relatório",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Definir resultados da execução ou do relatório
  const results = execution ? 
    (typeof execution.results === "string" ? JSON.parse(execution.results) : execution.results) 
    : 
    (executeReportMutation.data?.data || []);

  // Verificar se há resultados
  const hasResults = results && results.length > 0;

  // Preparar colunas para a tabela de resultados
  const columns = hasResults
    ? Object.keys(results[0]).map((key) => ({
        accessorKey: key,
        header: key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" "),
        cell: ({ getValue }: any) => {
          const value = getValue();
          // Verificar se é uma data e formatá-la
          if (value && typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
            return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
          }
          return String(value ?? "");
        },
      }))
    : [];

  // Função para exportar resultados
  const exportData = () => {
    if (!hasResults) return;

    try {
      if (exportFormat === "excel") {
        // Exportar para Excel
        const worksheet = XLSX.utils.json_to_sheet(results);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados");
        
        // Definir nome do arquivo
        const reportName = report?.name || execution?.report_name || "relatorio";
        const fileName = `${reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.xlsx`;
        
        // Baixar arquivo
        XLSX.writeFile(workbook, fileName);
      } else if (exportFormat === "pdf") {
        // Exportar para PDF
        const doc = new jsPDF();
        
        // Adicionar título
        const reportName = report?.name || execution?.report_name || "Relatório";
        doc.setFontSize(16);
        doc.text(reportName, 14, 22);
        
        // Adicionar data de execução
        doc.setFontSize(10);
        const executionDate = execution?.created_at ? 
          format(new Date(execution.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 
          format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR });
        doc.text(`Executado em: ${executionDate}`, 14, 30);
        
        // Adicionar informações do usuário
        const username = execution?.username || user?.username || "usuário";
        doc.text(`Executado por: ${username}`, 14, 36);
        
        // Adicionar tabela com resultados
        const tableColumn = columns.map((col) => col.header);
        const tableRows = results.map((row: any) =>
          columns.map((col: any) => {
            const value = row[col.accessorKey];
            if (value && typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}T/)) {
              return format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
            }
            return String(value ?? "");
          })
        );
        
        autoTable(doc, { 
          head: [tableColumn], 
          body: tableRows,
          startY: 45,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [60, 60, 60] },
        });
        
        // Definir nome do arquivo
        const fileName = `${reportName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
        
        // Baixar arquivo
        doc.save(fileName);
      }
      
      toast({
        title: "Exportação concluída",
        description: `Os resultados foram exportados com sucesso para ${exportFormat === "excel" ? "Excel" : "PDF"}.`,
      });
    } catch (error) {
      console.error("Erro ao exportar dados:", error);
      toast({
        title: "Erro ao exportar dados",
        description: "Não foi possível exportar os resultados. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Renderizar formulário de parâmetros baseado no schema do relatório
  const renderParameterForm = () => {
    if (!report || !report.parameters) return null;

    return (
      <div className="grid gap-4">
        {Object.entries(report.parameters).map(([key, param]: [string, any]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{param.label || key}</Label>
            {param.type === "date" ? (
              <DatePicker
                date={parameters[key] ? new Date(parameters[key]) : undefined}
                setDate={(date) => setParameters({ ...parameters, [key]: date })}
                placeholder={`Selecione a ${param.label || key}`}
              />
            ) : param.type === "select" && param.options ? (
              <Select
                value={parameters[key] || ""}
                onValueChange={(value) => setParameters({ ...parameters, [key]: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Selecione ${param.label || key}`} />
                </SelectTrigger>
                <SelectContent>
                  {param.options.map((option: any) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id={key}
                value={parameters[key] || ""}
                onChange={(e) => setParameters({ ...parameters, [key]: e.target.value })}
                placeholder={param.placeholder || `Digite ${param.label || key}`}
                type={param.type === "number" ? "number" : "text"}
              />
            )}
            {param.description && (
              <p className="text-xs text-muted-foreground">{param.description}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Renderizar seção de filtros ativos (parâmetros usados na execução)
  const renderActiveFilters = () => {
    if (!execution || !execution.parameters) return null;
    
    const execParams = execution.parameters;
    if (Object.keys(execParams).length === 0) return null;

    return (
      <div className="mb-4">
        <h3 className="text-sm font-medium mb-2 flex items-center">
          <Filter className="inline-block mr-1 h-4 w-4" /> Filtros aplicados:
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(execParams).map(([key, value]: [string, any]) => {
            let displayValue = value;
            
            // Formatação especial para datas
            if (value && typeof value === "string" && value.match(/^\d{4}-\d{2}-\d{2}/)) {
              displayValue = format(new Date(value), "dd/MM/yyyy", { locale: ptBR });
            }
            
            // Obter o label do parâmetro se disponível
            const paramLabel = execution.report_parameters && execution.report_parameters[key]?.label || key;
            
            return (
              <Badge key={key} variant="outline" className="flex items-center gap-1">
                <span className="font-medium">{paramLabel}:</span> {displayValue}
              </Badge>
            );
          })}
        </div>
      </div>
    );
  };

  // Mostrar informações da execução
  const renderExecutionInfo = () => {
    if (!execution) return null;

    return (
      <div className="flex flex-col gap-1 text-sm mb-4">
        <p className="flex items-center">
          <Calendar className="inline-block mr-1 h-4 w-4" />
          <span className="font-medium mr-1">Data:</span>
          {format(new Date(execution.created_at), "PPp", { locale: ptBR })}
        </p>
        <p>
          <span className="font-medium mr-1">Executado por:</span>
          {execution.username}
        </p>
        {execution.execution_time && (
          <p>
            <span className="font-medium mr-1">Tempo:</span>
            {execution.execution_time.toFixed(2)} segundos
          </p>
        )}
        <p>
          <span className="font-medium mr-1">Status:</span>
          <Badge
            variant={execution.status === "completed" ? "default" : "destructive"}
          >
            {execution.status === "completed" ? "Concluído" : "Erro"}
          </Badge>
        </p>
        {execution.error_message && (
          <p className="mt-2 text-destructive">
            <span className="font-medium">Erro:</span> {execution.error_message}
          </p>
        )}
      </div>
    );
  };

  // Loading state
  if (isLoadingReport || isLoadingExecution) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4"></div>
        <p className="text-muted-foreground">Carregando relatório...</p>
      </div>
    );
  }

  // Relatório ou execução não encontrada
  if (!report && !execution) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Relatório não encontrado</CardTitle>
          <CardDescription>
            Não foi possível encontrar o relatório ou execução solicitada.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={onBack}>Voltar</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold">
            {report?.name || execution?.report_name}
          </h2>
          <p className="text-muted-foreground">
            {report?.description || "Visualização de resultados"}
          </p>
        </div>
      </div>

      {execution && renderExecutionInfo()}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="parameters" disabled={!!executionId}>
            <Book className="h-4 w-4 mr-2" /> Parâmetros
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!hasResults && !execution}>
            <File className="h-4 w-4 mr-2" /> Resultados {hasResults && `(${results.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="parameters" className="py-4">
          {renderParameterForm()}
          <div className="mt-4 flex justify-end">
            <Button
              onClick={() => executeReportMutation.mutate()}
              disabled={executeReportMutation.isPending}
            >
              {executeReportMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full"></div>
                  Executando...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" /> Executar Relatório
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="results" className="py-4">
          {execution && renderActiveFilters()}
          
          {!hasResults ? (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">
                Nenhum resultado encontrado para os parâmetros informados.
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-muted-foreground">
                  {results.length} resultados encontrados
                </p>
                <Button
                  variant="outline"
                  onClick={() => setExportConfirmOpen(true)}
                >
                  <Download className="h-4 w-4 mr-2" /> Exportar
                </Button>
              </div>
              
              <div className="border rounded-md">
                <DataTable
                  data={results}
                  columns={columns}
                  searchable={results.length > 10}
                />
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Diálogo de confirmação de exportação */}
      <AlertDialog open={exportConfirmOpen} onOpenChange={setExportConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exportar resultados</AlertDialogTitle>
            <AlertDialogDescription>
              Escolha o formato para exportar os resultados do relatório:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-4 py-4">
            <div 
              className={`border rounded-lg p-4 flex-1 flex flex-col items-center gap-2 cursor-pointer ${exportFormat === 'excel' ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => setExportFormat("excel")}
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <File className="h-6 w-6 text-green-600" />
              </div>
              <span className="font-medium">Excel</span>
              <span className="text-xs text-center text-muted-foreground">
                Exportar para planilha Excel (.xlsx)
              </span>
            </div>
            <div 
              className={`border rounded-lg p-4 flex-1 flex flex-col items-center gap-2 cursor-pointer ${exportFormat === 'pdf' ? 'border-primary bg-primary/5' : ''}`}
              onClick={() => setExportFormat("pdf")}
            >
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <File className="h-6 w-6 text-red-600" />
              </div>
              <span className="font-medium">PDF</span>
              <span className="text-xs text-center text-muted-foreground">
                Exportar para documento PDF
              </span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={exportData}>
              Exportar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}