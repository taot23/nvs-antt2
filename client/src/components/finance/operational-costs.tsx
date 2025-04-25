import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate, parseInputToNumber } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertCircle, 
  DollarSign, 
  Loader2, 
  PlusCircle, 
  Receipt, 
  Trash2, 
  X 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";

interface OperationalCostsProps {
  saleId: number | null;
  canManage: boolean;
}

export function OperationalCosts({ saleId, canManage }: OperationalCostsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [selectedCostId, setSelectedCostId] = useState<number | null>(null);
  
  // Form for adding new cost
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0], // Today as default
      notes: ""
    }
  });
  
  // Buscar custos operacionais
  const { data: costs = [], isLoading } = useQuery({
    queryKey: ['/api/sales', saleId, 'operational-costs'],
    queryFn: async () => {
      if (!saleId) return [];
      const res = await apiRequest("GET", `/api/sales/${saleId}/operational-costs`);
      return res.json();
    },
    enabled: !!saleId,
  });
  
  // Mutation para adicionar custo
  const addCostMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", `/api/sales/${saleId}/operational-costs`, {
        ...data,
        amount: parseInputToNumber(data.amount)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales', saleId, 'operational-costs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales', saleId] });
      
      toast({
        title: "Custo adicionado",
        description: "O custo operacional foi registrado com sucesso.",
      });
      
      reset();
      setCostDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar custo",
        description: error.message || "Não foi possível adicionar o custo operacional.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para excluir custo
  const deleteCostMutation = useMutation({
    mutationFn: async (costId: number) => {
      await apiRequest("DELETE", `/api/sales/operational-costs/${costId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sales', saleId, 'operational-costs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales', saleId] });
      
      toast({
        title: "Custo excluído",
        description: "O custo operacional foi excluído com sucesso.",
      });
      
      setConfirmDeleteDialogOpen(false);
      setSelectedCostId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir custo",
        description: error.message || "Não foi possível excluir o custo operacional.",
        variant: "destructive",
      });
    }
  });
  
  // Função para abrir o diálogo de confirmação de exclusão
  const openDeleteDialog = (costId: number) => {
    setSelectedCostId(costId);
    setConfirmDeleteDialogOpen(true);
  };
  
  // Calcular total dos custos
  const totalCosts = costs.reduce((sum: number, cost: any) => sum + Number(cost.amount), 0);
  
  const onSubmit = (data: any) => {
    addCostMutation.mutate(data);
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Receipt className="mr-2 h-5 w-5" />
            Custos Operacionais
          </CardTitle>
          <CardDescription>
            Gerencie os custos operacionais relacionados a esta venda
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando custos...</span>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="flex items-center">
                <Receipt className="mr-2 h-5 w-5" />
                Custos Operacionais
              </CardTitle>
              <CardDescription>
                Custos relacionados à execução operacional desta venda
              </CardDescription>
            </div>
            
            {canManage && (
              <Button 
                onClick={() => setCostDialogOpen(true)}
                variant="default"
                className="bg-primary hover:bg-primary/90"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Custo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {costs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Não há custos operacionais registrados para esta venda.
              </p>
              {canManage && (
                <Button 
                  onClick={() => setCostDialogOpen(true)}
                  variant="outline"
                  className="mt-4"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Adicionar Custo
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Observações</TableHead>
                  {canManage && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs.map((cost: any) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">{cost.description}</TableCell>
                    <TableCell>{formatDate(cost.date)}</TableCell>
                    <TableCell>{formatCurrency(cost.amount)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{cost.notes || "-"}</TableCell>
                    {canManage && (
                      <TableCell className="text-right">
                        <Button 
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(cost.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {costs.length > 0 && (
          <CardFooter className="border-t px-6 py-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-muted-foreground">Total de custos operacionais:</span>
              <span className="font-semibold text-lg">
                {formatCurrency(totalCosts)}
              </span>
            </div>
          </CardFooter>
        )}
      </Card>
      
      {/* Diálogo para adicionar custo */}
      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Custo Operacional</DialogTitle>
            <DialogDescription>
              Registre um novo custo relacionado à execução desta venda.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Descrição <span className="text-destructive">*</span></Label>
                <Input
                  id="description"
                  placeholder="Ex: Transporte, Material, etc."
                  {...register("description", { required: "Descrição é obrigatória" })}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">{errors.description.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="amount">Valor <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="amount"
                    className="pl-9"
                    placeholder="0,00"
                    {...register("amount", { 
                      required: "Valor é obrigatório",
                      pattern: {
                        value: /^[0-9]+(?:[.,][0-9]+)?$/,
                        message: "Informe um valor válido"
                      }
                    })}
                  />
                </div>
                {errors.amount && (
                  <p className="text-sm text-destructive">{errors.amount.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="date">Data <span className="text-destructive">*</span></Label>
                <Input
                  id="date"
                  type="date"
                  {...register("date", { required: "Data é obrigatória" })}
                />
                {errors.date && (
                  <p className="text-sm text-destructive">{errors.date.message}</p>
                )}
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  placeholder="Informações adicionais sobre o custo..."
                  {...register("notes")}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCostDialogOpen(false)}>
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={addCostMutation.isPending}
                variant="default"
              >
                {addCostMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <PlusCircle className="h-4 w-4 mr-2" />
                )}
                Adicionar Custo
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={confirmDeleteDialogOpen} onOpenChange={setConfirmDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este custo operacional? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive"
              onClick={() => selectedCostId && deleteCostMutation.mutate(selectedCostId)}
              disabled={deleteCostMutation.isPending}
            >
              {deleteCostMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}