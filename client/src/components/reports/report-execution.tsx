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
  File
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

// Interfaces para tipagem
interface ReportData {
  id: number;
  name: string;
  description?: string;
  query: string;
  parameters?: string;
  permissions: string;
  createdBy: number;
  createdAt: string;
}

interface ReportExecutionData {
  id: number;
  report_id?: number;
  reportId?: number;
  user_id?: number;
  userId?: number;
  parameters: Record<string, string>;
  results: any[];
  execution_time?: number;
  status: string;
  error_message?: string;
  created_at: string;
  report_name?: string;
  name?: string;
  description?: string;
  username?: string;
}

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
  } = useQuery<ReportData>({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId && !executionId,
  });

  // Buscar execução específica (para visualizar resultados existentes)
  const { 
    data: execution, 
    isLoading: isLoadingExecution,
    error: executionError
  } = useQuery<ReportExecutionData>({
    queryKey: ["/api/report-executions", executionId],
    enabled: !!executionId && !!user, // Executar somente se usuário estiver autenticado
    retry: 3,
    retryDelay: 1000,
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

  // Preparar dados para exportação (formatar valores)
  const prepareDataForExport = () => {
    if (!exportDataRef.current || exportDataRef.current.length === 0) return [];
    
    // Criar cópia profunda dos dados para não modificar os originais
    const preparedData = JSON.parse(JSON.stringify(exportDataRef.current));
    
    // Formatar os dados para melhor visualização na exportação
    return preparedData.map((row: Record<string, any>) => {
      const formattedRow: Record<string, any> = {};
      
      // Percorrer cada coluna
      Object.entries(row).forEach(([key, value]) => {
        // Tratar valores nulos ou undefined
        if (value === null || value === undefined) {
          formattedRow[key] = '';
          return;
        }
        
        // Verificar se é uma data ISO
        if (typeof value === 'string' && 
            /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?Z?)?$/.test(value)) {
          try {
            formattedRow[key] = format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: ptBR });
          } catch (e) {
            formattedRow[key] = value;
          }
          return;
        }
        
        // Verificar se é um número que pode ser um valor monetário
        if ((typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))) && 
            (key.toLowerCase().includes('valor') || 
            key.toLowerCase().includes('preco') || 
            key.toLowerCase().includes('total') || 
            key.toLowerCase().includes('amount'))) {
          try {
            const numValue = typeof value === 'string' ? Number(value) : value;
            formattedRow[key] = numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          } catch (e) {
            formattedRow[key] = value;
          }
          return;
        }
        
        // Passar valor normal
        formattedRow[key] = value;
      });
      
      return formattedRow;
    });
  };

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
      
      // Formatar dados
      const formattedData = prepareDataForExport();
      
      // Criar nova planilha
      const ws = XLSX.utils.json_to_sheet(formattedData);
      const wb = XLSX.utils.book_new();
      
      // Ajustar largura das colunas
      const columnWidths = Object.keys(formattedData[0]).reduce((acc, key) => {
        const maxLength = Math.max(
          key.length,
          ...formattedData.map((row: Record<string, any>) => String(row[key]).length)
        );
        acc[key] = Math.min(maxLength + 2, 50); // Limitar a 50 caracteres
        return acc;
      }, {} as Record<string, number>);
      
      ws['!cols'] = Object.values(columnWidths).map(width => ({ width }));
      
      // Adicionar metadados
      wb.Props = {
        Title: reportTitle,
        Author: user?.username || "Sistema",
        CreatedDate: new Date()
      };
      
      // Adicionar planilha ao workbook
      XLSX.utils.book_append_sheet(wb, ws, "Dados");
      
      // Adicionar informações do relatório em uma nova aba
      const infoWorksheet = XLSX.utils.json_to_sheet([{
        "Nome do Relatório": reportTitle,
        "Descrição": reportDescription || "Sem descrição",
        "Data de Geração": dateStr,
        "Gerado por": user?.username || "Sistema",
        "Total de Registros": exportDataRef.current.length
      }]);
      
      // Adicionar parâmetros em uma nova aba, se houver
      if (Object.keys(reportHeader.parameters).length > 0) {
        const paramData = Object.entries(reportHeader.parameters).map(([key, value]) => ({
          "Parâmetro": key,
          "Valor": value
        }));
        const paramWorksheet = XLSX.utils.json_to_sheet(paramData);
        XLSX.utils.book_append_sheet(wb, paramWorksheet, "Parâmetros");
      }
      
      XLSX.utils.book_append_sheet(wb, infoWorksheet, "Informações");
      
      // Salvar arquivo
      const fileName = `${reportTitle.replace(/\s+/g, '_')}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Excel exportado com sucesso",
        description: `O arquivo ${fileName} foi baixado.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar para Excel. Tente novamente.",
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
      
      // Obter dados formatados para exibição no PDF
      const formattedData = prepareDataForExport();
      
      // Criar documento PDF com orientação paisagem para mais dados
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      // Adicionar cabeçalho com título
      doc.setFontSize(18);
      doc.setTextColor(50, 50, 100);
      doc.text(reportTitle, 14, 15);
      
      // Adicionar descrição se existir
      if (reportDescription) {
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        // Limitar descrição para evitar que saia da página
        const maxDescLength = 150;
        const desc = reportDescription.length > maxDescLength 
          ? reportDescription.substring(0, maxDescLength) + '...' 
          : reportDescription;
        doc.text(desc, 14, 22);
      }
      
      // Adicionar linha horizontal
      doc.setDrawColor(220, 220, 220);
      doc.line(14, 25, doc.internal.pageSize.width - 14, 25);
      
      // Adicionar metadados
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text(`Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 30);
      doc.text(`Usuário: ${user?.username || "Sistema"}`, 14, 35);
      doc.text(`Total de Registros: ${exportDataRef.current.length}`, 14, 40);
      
      // Adicionar parâmetros se existirem
      let paramY = 40;
      if (Object.keys(reportHeader.parameters).length > 0) {
        paramY += 5;
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 100);
        doc.text("Parâmetros Utilizados:", 14, paramY);
        paramY += 5;
        
        doc.setFontSize(9);
        doc.setTextColor(80, 80, 80);
        
        const paramList = Object.entries(reportHeader.parameters)
          .map(([key, value]) => `${key}: ${value}`)
          .join(' | ');
        
        doc.text(paramList, 14, paramY);
        paramY += 5;
      }
      
      // Extrair as colunas para exibição
      const pdfColumns = columns.map(col => ({
        header: col.header,
        dataKey: col.accessorKey as string
      }));
      
      // Preparar dados para exibição
      // Garantir que todas as propriedades dos dados formatados sejam strings
      const pdfData = formattedData.map((row: Record<string, any>) => {
        const newRow: Record<string, string> = {};
        Object.entries(row).forEach(([key, value]) => {
          // Converter todos os valores para string
          newRow[key] = value === null || value === undefined 
            ? '' 
            : typeof value === 'object' 
              ? JSON.stringify(value) 
              : String(value);
        });
        return newRow;
      });
      
      // Adicionar tabela com dados formatados
      autoTable(doc, {
        startY: paramY + 5,
        columns: pdfColumns,
        body: pdfData,
        headStyles: {
          fillColor: [60, 90, 150],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 250]
        },
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        margin: { top: paramY + 5, right: 14, bottom: 20, left: 14 },
        didDrawPage: (data) => {
          // Adicionar rodapé com numeração de página em cada página
          const pageNumber = doc.internal.getNumberOfPages();
          const totalPages = `Página ${pageNumber}`;
          
          // Adicionar rodapé com data e número da página
          doc.setFontSize(8);
          doc.setTextColor(80, 80, 80);
          
          // Adicionar empresa e data à esquerda
          doc.text(
            `Sistema Gerenciamento - ${format(new Date(), 'dd/MM/yyyy')}`,
            14,
            doc.internal.pageSize.height - 10
          );
          
          // Adicionar numeração de página centralizada
          doc.text(
            totalPages,
            doc.internal.pageSize.width / 2,
            doc.internal.pageSize.height - 10,
            { align: 'center' }
          );
          
          // Adicionar username à direita
          doc.text(
            `Gerado por: ${user?.username || "Sistema"}`,
            doc.internal.pageSize.width - 14,
            doc.internal.pageSize.height - 10,
            { align: 'right' }
          );
        }
      });
      
      // Salvar arquivo
      const fileName = `${reportTitle.replace(/\s+/g, '_')}_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "PDF exportado com sucesso",
        description: `O arquivo ${fileName} foi baixado.`,
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error);
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível exportar para PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Verificar se está carregando
  const isLoading = isLoadingReport || isLoadingExecution;
  
  // Verificar se houve erro
  const hasError = reportError || executionError;

  useEffect(() => {
    if (executionError) {
      console.error("Erro ao carregar execução:", executionError);
      toast({
        title: "Erro ao carregar relatório",
        description: "Ocorreu um erro ao carregar os dados do relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [executionError, toast]);
  
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
            Ocorreu um erro ao carregar os dados do relatório.
          </p>
          <div className="mt-4 bg-red-100 p-3 rounded-md text-sm">
            <p className="font-medium">Detalhes do erro:</p>
            <p className="mt-1">
              {executionError ? 
                `Erro na execução: ${executionError instanceof Error ? executionError.message : 'Erro desconhecido'}` : 
                reportError ? 
                `Erro no relatório: ${reportError instanceof Error ? reportError.message : 'Erro desconhecido'}` : 
                'Ocorreu um erro inesperado. Tente novamente mais tarde.'}
            </p>
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista de relatórios
            </Button>
          </div>
        </div>
      );
    }
    
    // Verificar se há resultados
    if (!execution?.results || execution.results.length === 0) {
      return (
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5" />
            <h3 className="font-medium">Nenhum resultado encontrado</h3>
          </div>
          <p className="mt-2 text-sm">
            Não foram encontrados registros para os critérios selecionados.
          </p>
          <div className="mt-4 bg-yellow-100 p-3 rounded-md text-sm">
            <p className="font-medium">Sugestões:</p>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Verifique se os parâmetros de filtro estão corretos</li>
              <li>Tente ampliar o período de datas, se aplicável</li>
              <li>Verifique se existem dados correspondentes no sistema</li>
            </ul>
          </div>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista de relatórios
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="bg-slate-50 p-3 rounded-md mb-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-medium">Resultados da consulta</h3>
              <p className="text-xs text-muted-foreground">
                {execution.results.length} registros encontrados
              </p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToExcel} 
                className="h-8"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={exportToPdf}
                className="h-8"
              >
                <File className="h-3.5 w-3.5 mr-1" />
                PDF
              </Button>
            </div>
          </div>
        </div>
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
        <div className="bg-blue-50 p-4 rounded-md text-blue-800">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <h3 className="font-medium">Relatório sem parâmetros</h3>
          </div>
          <p className="mt-2 text-sm">
            Este relatório foi executado sem nenhum parâmetro de filtro.
          </p>
          <p className="mt-2 text-sm">
            Isso significa que os resultados representam todos os dados disponíveis 
            no período padrão (geralmente últimos 30 dias ou conforme definido no relatório).
          </p>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-md mb-4">
          <div className="flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-600" />
            <h3 className="text-sm font-medium text-blue-800">Parâmetros utilizados na consulta</h3>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(parameters).map(([key, value]) => (
            <Card key={key} className="border-blue-100">
              <CardHeader className="pb-2 bg-blue-50/50">
                <CardTitle className="text-sm text-blue-700">{key}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base font-medium">{value as string}</p>
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
              <div className="flex flex-col space-y-2">
                {execution?.status === "success" ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-700">Concluído com sucesso</p>
                      <p className="text-xs text-green-600">
                        Relatório gerado e pronto para visualização
                      </p>
                    </div>
                  </div>
                ) : execution?.status === "error" ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-red-700">Erro na execução</p>
                      <p className="text-xs text-red-600">
                        Ocorreu um problema ao gerar o relatório
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Timer className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-blue-700">Processando</p>
                      <p className="text-xs text-blue-600">
                        Relatório em geração
                      </p>
                    </div>
                  </div>
                )}
                
                {execution?.error_message && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-md">
                    <p className="font-medium mb-1">Mensagem de erro:</p>
                    <p className="text-sm">{execution.error_message}</p>
                  </div>
                )}
              </div>
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
          Voltar para Lista
        </Button>
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