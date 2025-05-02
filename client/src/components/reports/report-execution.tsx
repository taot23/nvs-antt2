import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, FileDown, Printer, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/ui/data-table";
import { DatePicker } from "@/components/ui/date-picker";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

interface ReportExecutionProps {
  reportId: number;
  onBack: () => void;
}

export function ReportExecution({ reportId, onBack }: ReportExecutionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  
  // Buscar detalhes do relatório selecionado
  const { data: report, isLoading, error } = useQuery({
    queryKey: ["/api/reports", reportId],
    enabled: !!reportId,
  });
  
  // Estado inicial do formulário com os parâmetros do relatório
  const getDefaultFormValues = () => {
    const defaultValues: Record<string, any> = {};
    
    if (report?.parameters) {
      for (const [key, param] of Object.entries<any>(report.parameters)) {
        if (param.type === "date") {
          defaultValues[key] = new Date();
        } else if (param.type === "number") {
          defaultValues[key] = 0;
        } else if (key === "sellerId" && user?.role === "vendedor") {
          defaultValues[key] = user.id; // Preenche automaticamente para vendedores
        }
      }
    }
    
    return defaultValues;
  };
  
  // Cria o esquema de validação a partir dos parâmetros do relatório
  const generateValidationSchema = () => {
    const schema: Record<string, any> = {};
    
    if (report?.parameters) {
      for (const [key, param] of Object.entries<any>(report.parameters)) {
        if (param.type === "date") {
          schema[key] = param.required ? z.date({required_error: "Data obrigatória"}) : z.date().optional();
        } else if (param.type === "number") {
          schema[key] = param.required ? z.number({required_error: "Valor obrigatório"}) : z.number().optional();
        } else {
          schema[key] = param.required ? z.string().min(1, "Campo obrigatório") : z.string().optional();
        }
      }
    }
    
    return z.object(schema);
  };
  
  const formSchema = generateValidationSchema();
  
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultFormValues(),
    mode: "onChange",
  });
  
  // Mutation para executar o relatório
  const executeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/reports/${reportId}/execute`, {
        parameters: data
      });
      return res.json();
    },
    onSuccess: (data) => {
      setReportData(data);
      setIsReportGenerated(true);
      queryClient.invalidateQueries({queryKey: ["/api/reports", reportId, "executions"]});
      
      toast({
        title: "Relatório gerado com sucesso",
        description: "Os resultados estão disponíveis para visualização",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao gerar relatório",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar o relatório",
        variant: "destructive",
      });
    },
  });
  
  // Manipulador de submissão do formulário
  const onSubmit = (data: any) => {
    executeMutation.mutate(data);
  };
  
  // Função para formatar os resultados em CSV e fazer download
  const exportToCSV = () => {
    if (!reportData || !reportData.results) return;
    
    // Obter colunas
    const columns = Object.keys(reportData.results[0]);
    
    // Criar linhas de dados
    const csvContent = [
      // Cabeçalho
      columns.join(','),
      // Dados
      ...reportData.results.map((row: any) => 
        columns.map(col => {
          const value = row[col];
          // Escapar strings com vírgulas
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');
    
    // Criar e fazer download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${report?.name}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Preparar para impressão
  const printReport = () => {
    if (!reportData || !reportData.results) return;
    
    // Abrir janela para impressão
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    // Colunas da tabela
    const columns = Object.keys(reportData.results[0]);
    
    // Criar HTML para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report?.name || 'Relatório'}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #333; }
          table { border-collapse: collapse; width: 100%; margin-top: 20px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .footer { margin-top: 30px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <h1>${report?.name || 'Relatório'}</h1>
        <p>${report?.description || ''}</p>
        <p>Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        
        <table>
          <thead>
            <tr>
              ${columns.map(col => `<th>${col}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${reportData.results.map((row: any) => `
              <tr>
                ${columns.map(col => `<td>${row[col]}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="footer">
          <p>Relatório gerado por: ${user?.username}</p>
          <p>Tempo de execução: ${reportData.executionTime ? reportData.executionTime.toFixed(2) + 's' : 'N/A'}</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Imprimir depois que a página carregar
    printWindow.onload = () => {
      printWindow.print();
    };
  };
  
  // Exibir indicador de carregamento durante a busca dos detalhes do relatório
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Exibir mensagem de erro se houver falha na busca
  if (error || !report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erro</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar o relatório</AlertTitle>
            <AlertDescription>
              {error instanceof Error ? error.message : "Ocorreu um erro ao buscar os detalhes do relatório."}
            </AlertDescription>
          </Alert>
          <Button onClick={onBack} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Renderizar formulário de execução de relatório
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{report.name}</CardTitle>
            <CardDescription>{report.description}</CardDescription>
          </div>
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
        </div>
        <div className="flex gap-1 mt-2">
          <Badge variant="outline">Tipo: {report.type}</Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {!isReportGenerated ? (
          <>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Campos de parâmetros do relatório */}
                {report.parameters && Object.keys(report.parameters).length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Parâmetros do Relatório</h3>
                    
                    {Object.entries<any>(report.parameters).map(([key, param]) => {
                      // Pular o campo sellerId para vendedores
                      if (key === "sellerId" && user?.role === "vendedor") {
                        return null;
                      }
                      
                      return (
                        <FormField
                          key={key}
                          control={form.control}
                          name={key}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{param.label || key}</FormLabel>
                              <FormControl>
                                {param.type === "date" ? (
                                  <DatePicker
                                    date={field.value}
                                    setDate={field.onChange}
                                  />
                                ) : param.type === "number" ? (
                                  <Input
                                    type="number"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                ) : (
                                  <Input {...field} />
                                )}
                              </FormControl>
                              {param.description && (
                                <FormDescription>{param.description}</FormDescription>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-4">
                    <p className="text-center text-muted-foreground">
                      Este relatório não requer parâmetros adicionais.
                    </p>
                  </div>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={executeMutation.isPending}
                >
                  {executeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Gerando relatório...
                    </>
                  ) : (
                    <>Executar Relatório</>
                  )}
                </Button>
              </form>
            </Form>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Resultados</h3>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsReportGenerated(false)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Alterar Parâmetros
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToCSV}
                >
                  <FileDown className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={printReport}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Imprimir
                </Button>
              </div>
            </div>
            
            <Separator className="my-4" />
            
            {reportData?.executionTime && (
              <p className="text-sm text-muted-foreground mb-4">
                Tempo de execução: {reportData.executionTime.toFixed(2)}s
              </p>
            )}
            
            {reportData?.results?.length > 0 ? (
              <div className="border rounded-md">
                <DataTable 
                  data={reportData.results} 
                  columns={Object.keys(reportData.results[0]).map(key => ({
                    accessorKey: key,
                    header: key
                  }))}
                />
              </div>
            ) : (
              <Alert className="mt-4">
                <AlertTitle>Sem resultados</AlertTitle>
                <AlertDescription>
                  O relatório foi executado com sucesso, mas não retornou nenhum resultado.
                </AlertDescription>
              </Alert>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}