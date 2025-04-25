import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, parseInputToNumber } from "@/lib/formatters";
import { Trash2, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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

interface OperationalCost {
  id: number;
  saleId: number;
  description: string;
  amount: string;
  date: string;
  responsibleId: number;
  notes: string | null;
  paymentReceiptUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

interface OperationalCostsProps {
  saleId: number;
  canManage: boolean;
}

export function OperationalCosts({ saleId, canManage }: OperationalCostsProps) {
  const { toast } = useToast();
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCostId, setSelectedCostId] = useState<number | null>(null);

  // Buscar custos operacionais da venda
  const { data: costs, isLoading } = useQuery<OperationalCost[]>({
    queryKey: [`/api/sales/${saleId}/operational-costs`],
    enabled: !!saleId,
  });

  // Adicionar custo operacional
  const addCostMutation = useMutation({
    mutationFn: async (costData: {
      description: string;
      amount: string;
      date: string;
      notes?: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/sales/${saleId}/operational-costs`,
        costData
      );
      return await res.json();
    },
    onSuccess: () => {
      // Limpar o formulário
      setDescription("");
      setAmount("");
      setDate(format(new Date(), "yyyy-MM-dd"));
      setNotes("");
      setIsAddingCost(false);

      // Invalidar consulta para atualizar a lista
      queryClient.invalidateQueries({ queryKey: [`/api/sales/${saleId}/operational-costs`] });

      toast({
        title: "Custo operacional adicionado",
        description: "O custo operacional foi adicionado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao adicionar custo operacional",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Excluir custo operacional
  const deleteCostMutation = useMutation({
    mutationFn: async (costId: number) => {
      const res = await apiRequest("DELETE", `/api/operational-costs/${costId}`);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidar consulta para atualizar a lista
      queryClient.invalidateQueries({ queryKey: [`/api/sales/${saleId}/operational-costs`] });

      toast({
        title: "Custo operacional excluído",
        description: "O custo operacional foi excluído com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir custo operacional",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Calcular o total de custos
  const totalCosts = costs?.reduce((total, cost) => {
    const costAmount = parseFloat(cost.amount);
    return total + (isNaN(costAmount) ? 0 : costAmount);
  }, 0);

  const handleAddCost = () => {
    if (!description) {
      toast({
        title: "Erro ao adicionar custo",
        description: "A descrição é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Erro ao adicionar custo",
        description: "Informe um valor válido",
        variant: "destructive",
      });
      return;
    }

    const parsedAmount = parseInputToNumber(amount);
    
    addCostMutation.mutate({
      description,
      amount: parsedAmount.toString(),
      date,
      notes: notes || undefined,
    });
  };

  const confirmDelete = (costId: number) => {
    setSelectedCostId(costId);
    setDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedCostId) {
      deleteCostMutation.mutate(selectedCostId);
      setDeleteDialogOpen(false);
      setSelectedCostId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Custos Operacionais</span>
            {canManage && !isAddingCost && (
              <Button
                size="sm"
                onClick={() => setIsAddingCost(true)}
                className="flex gap-1 items-center"
              >
                <Plus size={16} />
                <span>Adicionar</span>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isAddingCost && (
            <div className="space-y-4 mb-6 p-4 border rounded-md">
              <h3 className="font-medium text-lg">Novo Custo Operacional</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Descrição do custo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor</Label>
                  <Input
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Observações (opcional)"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsAddingCost(false)}
                  disabled={addCostMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddCost} 
                  disabled={addCostMutation.isPending}
                >
                  {addCostMutation.isPending ? "Adicionando..." : "Adicionar Custo"}
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="py-8 text-center">Carregando custos operacionais...</div>
          ) : costs && costs.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary/20">
                      <th className="px-4 py-2 text-left">Descrição</th>
                      <th className="px-4 py-2 text-right">Valor</th>
                      <th className="px-4 py-2 text-center">Data</th>
                      <th className="px-4 py-2 text-left">Observações</th>
                      {canManage && <th className="px-4 py-2 text-center">Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {costs.map((cost) => (
                      <tr key={cost.id} className="border-b">
                        <td className="px-4 py-2">{cost.description}</td>
                        <td className="px-4 py-2 text-right font-mono">
                          {formatCurrency(parseFloat(cost.amount))}
                        </td>
                        <td className="px-4 py-2 text-center whitespace-nowrap">
                          {format(new Date(cost.date), "dd/MM/yyyy", { locale: ptBR })}
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">
                          {cost.notes || "-"}
                        </td>
                        {canManage && (
                          <td className="px-4 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(cost.id)}
                              className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Nenhum custo operacional registrado para esta venda.
            </div>
          )}
        </CardContent>
        {costs && costs.length > 0 && (
          <CardFooter className="flex justify-end">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total de custos:</div>
              <div className="text-xl font-bold">
                {formatCurrency(totalCosts || 0)}
              </div>
            </div>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir custo operacional</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este custo operacional? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}