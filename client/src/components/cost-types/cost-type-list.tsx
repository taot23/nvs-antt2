import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  Edit,
  Trash2,
  Plus,
  Loader2,
  InfoIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { CostType } from "@shared/schema";
import CostTypeDialog from "./cost-type-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function CostTypeList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  const [selectedCostTypeId, setSelectedCostTypeId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCostType, setEditingCostType] = useState<CostType | undefined>(undefined);

  // Buscar todos os tipos de custo
  const {
    data: costTypes,
    isLoading,
    error,
    refetch,
  } = useQuery<CostType[]>({
    queryKey: ["/api/cost-types"],
    queryFn: async () => {
      const response = await fetch("/api/cost-types");
      if (!response.ok) {
        throw new Error("Erro ao carregar tipos de custo");
      }
      return response.json();
    },
  });

  // Mutation para excluir tipo de custo
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/cost-types/${id}`);
      if (!response.ok) {
        throw new Error("Erro ao excluir tipo de custo");
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Tipo de custo excluído",
        description: "O tipo de custo foi excluído com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-types"] });
      setSelectedCostTypeId(null);
      setConfirmDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
      setConfirmDeleteDialogOpen(false);
    },
  });

  // Manipular abertura do diálogo de criação
  const handleAddNew = () => {
    setEditingCostType(undefined);
    setDialogOpen(true);
  };

  // Manipular edição de tipo de custo
  const handleEdit = (costType: CostType) => {
    setEditingCostType(costType);
    setDialogOpen(true);
  };

  // Manipular exclusão de tipo de custo
  const handleDelete = (id: number) => {
    setSelectedCostTypeId(id);
    setConfirmDeleteDialogOpen(true);
  };

  // Confirmar exclusão
  const confirmDelete = () => {
    if (selectedCostTypeId) {
      deleteMutation.mutate(selectedCostTypeId);
    }
  };

  // Renderizar estado de carregamento
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Custo Operacional</CardTitle>
          <CardDescription>Gerencie os tipos padronizados de custo operacional.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-end">
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="rounded-md border">
              <div className="p-4">
                <Skeleton className="h-6 w-full mb-4" />
                <Skeleton className="h-6 w-full mb-4" />
                <Skeleton className="h-6 w-full mb-4" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Renderizar estado de erro
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tipos de Custo Operacional</CardTitle>
          <CardDescription>Gerencie os tipos padronizados de custo operacional.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <InfoIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-semibold text-destructive">Erro ao carregar dados</p>
            <p className="text-muted-foreground mb-4">
              Não foi possível carregar a lista de tipos de custo.
            </p>
            <Button onClick={() => refetch()}>Tentar novamente</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Tipos de Custo Operacional</CardTitle>
        <CardDescription>
          Cadastre tipos padronizados de custo para facilitar o preenchimento e consistência nos registros.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-end mb-4">
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Tipo de Custo
          </Button>
        </div>

        {costTypes && costTypes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-lg text-muted-foreground">
              Não há tipos de custo cadastrados.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Clique no botão acima para adicionar um novo tipo de custo.
            </p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[100px]">Status</TableHead>
                  <TableHead className="w-[120px] text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costTypes?.map((costType) => (
                  <TableRow key={costType.id}>
                    <TableCell className="font-medium">{costType.name}</TableCell>
                    <TableCell>
                      {costType.description || 
                        <span className="text-muted-foreground italic">Sem descrição</span>
                      }
                    </TableCell>
                    <TableCell>
                      {costType.active ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center w-fit">
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 flex items-center w-fit">
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(costType)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(costType.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Diálogo de confirmação de exclusão */}
        <AlertDialog 
          open={confirmDeleteDialogOpen} 
          onOpenChange={setConfirmDeleteDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir este tipo de custo? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  <>Excluir</>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Diálogo de criação/edição de tipo de custo */}
        <CostTypeDialog
          open={dialogOpen}
          setOpen={setDialogOpen}
          costType={editingCostType}
        />
      </CardContent>
    </Card>
  );
}