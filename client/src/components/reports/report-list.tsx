import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Edit, Eye, Play, Plus, Trash } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ReportListProps {
  onExecuteReport: (reportId: number) => void;
  onViewExecution: (executionId: number) => void;
}

export function ReportList({ onExecuteReport, onViewExecution }: ReportListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [viewExecutions, setViewExecutions] = useState<boolean>(false);
  const [selectedReportExecutions, setSelectedReportExecutions] = useState<any>(null);

  // Buscar relatórios
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["/api/reports"],
    select: (data) => data || [],
  });

  // Buscar execuções de um relatório específico
  const { data: reportExecutions = [], isLoading: isLoadingExecutions } = useQuery({
    queryKey: ["/api/reports", selectedReportExecutions, "executions"],
    enabled: !!selectedReportExecutions,
    select: (data) => data || [],
  });

  // Schema de validação para criação/edição de relatório
  const reportSchema = z.object({
    name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
    description: z.string().min(5, "Descrição deve ter no mínimo 5 caracteres"),
    type: z.string().min(1, "Tipo é obrigatório"),
    query: z.string().min(10, "Query SQL deve ter no mínimo 10 caracteres"),
    parameters: z.any().optional(),
    permissions: z.string().min(1, "Permissões são obrigatórias"),
  });

  // Form para criação de relatório
  const createForm = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "sql",
      query: "",
      parameters: {},
      permissions: user?.role || "",
    },
  });

  // Form para edição de relatório
  const editForm = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "sql",
      query: "",
      parameters: {},
      permissions: "",
    },
  });

  // Função para criar relatório
  const handleCreateReport = async (values: z.infer<typeof reportSchema>) => {
    try {
      await apiRequest("POST", "/api/reports", {
        ...values,
        created_by: user?.id,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setIsCreateDialogOpen(false);
      createForm.reset();
      toast({
        title: "Relatório criado com sucesso",
        description: "O relatório foi adicionado à sua lista de relatórios.",
      });
    } catch (error) {
      console.error("Erro ao criar relatório:", error);
      toast({
        title: "Erro ao criar relatório",
        description: "Ocorreu um erro ao criar o relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para editar relatório
  const handleEditReport = async (values: z.infer<typeof reportSchema>) => {
    if (!selectedReport) return;

    try {
      await apiRequest("PUT", `/api/reports/${selectedReport.id}`, values);
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      setSelectedReport(null);
      toast({
        title: "Relatório atualizado com sucesso",
        description: "As alterações foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao atualizar relatório:", error);
      toast({
        title: "Erro ao atualizar relatório",
        description: "Ocorreu um erro ao atualizar o relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Função para excluir relatório
  const handleDeleteReport = async () => {
    if (!selectedReport) return;

    try {
      await apiRequest("DELETE", `/api/reports/${selectedReport.id}`);
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
      setIsDeleteDialogOpen(false);
      setSelectedReport(null);
      toast({
        title: "Relatório excluído com sucesso",
        description: "O relatório foi removido permanentemente.",
      });
    } catch (error) {
      console.error("Erro ao excluir relatório:", error);
      toast({
        title: "Erro ao excluir relatório",
        description: "Ocorreu um erro ao excluir o relatório. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Abrir modal de edição e preencher o formulário
  const openEditDialog = (report: any) => {
    setSelectedReport(report);
    editForm.reset({
      name: report.name,
      description: report.description,
      type: report.type,
      query: report.query,
      parameters: report.parameters,
      permissions: report.permissions,
    });
    setIsEditDialogOpen(true);
  };

  // Abrir modal de exclusão
  const openDeleteDialog = (report: any) => {
    setSelectedReport(report);
    setIsDeleteDialogOpen(true);
  };

  // Função para abrir a lista de execuções de um relatório
  const openExecutionsList = (reportId: number) => {
    setSelectedReportExecutions(reportId);
    setViewExecutions(true);
  };

  // Verificar se o usuário tem permissão para administrar relatórios
  const canManageReports = user?.role === "admin";

  if (isLoading) {
    return <div className="p-4 text-center">Carregando relatórios...</div>;
  }

  return (
    <div className="space-y-4">
      {!viewExecutions ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Relatórios Disponíveis</h2>
            {canManageReports && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Novo Relatório
              </Button>
            )}
          </div>

          {reports.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">
                Nenhum relatório disponível para o seu perfil.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report: any) => (
                <Card key={report.id} className="flex flex-col">
                  <CardHeader>
                    <CardTitle>{report.name}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{report.type.toUpperCase()}</Badge>
                        {report.permissions.split(",").map((perm: string) => (
                          <Badge key={perm} variant="secondary">
                            {perm.trim()}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        <CalendarIcon className="inline-block mr-1 h-4 w-4" />
                        Criado em:{" "}
                        {format(new Date(report.created_at), "PPp", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="default" 
                      onClick={() => onExecuteReport(report.id)}
                    >
                      <Play className="mr-2 h-4 w-4" /> Executar
                    </Button>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => openExecutionsList(report.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canManageReports && (
                        <>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(report)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openDeleteDialog(report)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      ) : (
        // Lista de execuções do relatório selecionado
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              Execuções do Relatório
            </h2>
            <Button variant="outline" onClick={() => {
              setViewExecutions(false);
              setSelectedReportExecutions(null);
            }}>
              Voltar para Relatórios
            </Button>
          </div>

          {isLoadingExecutions ? (
            <div className="text-center p-8">Carregando execuções...</div>
          ) : reportExecutions.length === 0 ? (
            <div className="text-center p-8 border rounded-lg">
              <p className="text-muted-foreground">
                Este relatório ainda não foi executado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Mostrando as últimas {reportExecutions.length} execuções
              </p>
              <div className="grid gap-4">
                {reportExecutions.map((execution: any) => (
                  <Card key={execution.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            Execução #{execution.id}
                          </CardTitle>
                          <CardDescription>
                            Executado por: {execution.username}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={
                            execution.status === "completed"
                              ? "success"
                              : "destructive"
                          }
                        >
                          {execution.status === "completed"
                            ? "Concluído"
                            : "Erro"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2">
                        <div className="flex items-center text-sm">
                          <CalendarIcon className="mr-1 h-4 w-4" />
                          <span>
                            {format(
                              new Date(execution.created_at),
                              "PPp",
                              { locale: ptBR }
                            )}
                          </span>
                        </div>
                        {execution.execution_time && (
                          <div className="text-sm">
                            Tempo de execução: {execution.execution_time.toFixed(2)} segundos
                          </div>
                        )}
                        {execution.parameters && Object.keys(execution.parameters).length > 0 && (
                          <div>
                            <Label className="text-xs text-muted-foreground">Parâmetros:</Label>
                            <div className="grid grid-cols-2 gap-2 mt-1">
                              {Object.entries(execution.parameters).map(([key, value]: [string, any]) => (
                                <div key={key} className="flex">
                                  <span className="text-xs font-medium mr-1">{key}:</span>
                                  <span className="text-xs">{String(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {execution.error_message && (
                          <div className="mt-2">
                            <Label className="text-xs text-destructive">Erro:</Label>
                            <div className="text-xs text-destructive mt-1 p-2 bg-destructive/10 rounded">
                              {execution.error_message}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      {execution.status === "completed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => onViewExecution(execution.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" /> Ver Resultados
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal de criação de relatório */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Criar novo relatório</DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo para criar um novo relatório.
            </DialogDescription>
          </DialogHeader>
          <Form {...createForm}>
            <form
              onSubmit={createForm.handleSubmit(handleCreateReport)}
              className="space-y-4"
            >
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Relatório</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Visão Geral de Vendas" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva o que este relatório faz e quais informações ele fornece"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="sql"
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormDescription>
                      Atualmente apenas relatórios SQL são suportados.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Query SQL</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="SELECT * FROM sales WHERE status = :status AND date BETWEEN :start_date AND :end_date"
                        className="h-32 font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use parâmetros nomeados com prefixo : (Ex: :status, :start_date)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="parameters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parâmetros (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='{"status": {"type": "string", "label": "Status"}, "start_date": {"type": "date", "label": "Data Inicial"}}'
                        className="h-24 font-mono"
                        value={typeof field.value === "object" ? JSON.stringify(field.value, null, 2) : field.value}
                        onChange={(e) => {
                          try {
                            field.onChange(JSON.parse(e.target.value));
                          } catch {
                            field.onChange(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Defina os parâmetros em formato JSON. Tipos suportados:
                      string, number, date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissões (separadas por vírgula)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="admin, supervisor, vendedor"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Lista de perfis que podem acessar este relatório.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Criar Relatório</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de edição de relatório */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar relatório</DialogTitle>
            <DialogDescription>
              Altere as informações do relatório conforme necessário.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(handleEditReport)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Relatório</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <FormControl>
                      <Input {...field} disabled />
                    </FormControl>
                    <FormDescription>
                      Atualmente apenas relatórios SQL são suportados.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Query SQL</FormLabel>
                    <FormControl>
                      <Textarea
                        className="h-32 font-mono"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Use parâmetros nomeados com prefixo : (Ex: :status, :start_date)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="parameters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parâmetros (JSON)</FormLabel>
                    <FormControl>
                      <Textarea
                        className="h-24 font-mono"
                        value={typeof field.value === "object" ? JSON.stringify(field.value, null, 2) : field.value}
                        onChange={(e) => {
                          try {
                            field.onChange(JSON.parse(e.target.value));
                          } catch {
                            field.onChange(e.target.value);
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      Defina os parâmetros em formato JSON. Tipos suportados:
                      string, number, date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="permissions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Permissões (separadas por vírgula)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Lista de perfis que podem acessar este relatório.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">Salvar Alterações</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmação de exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o relatório{" "}
              <strong>{selectedReport?.name}</strong>? Esta ação não pode ser
              desfeita e também removerá todo o histórico de execuções.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteReport}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}