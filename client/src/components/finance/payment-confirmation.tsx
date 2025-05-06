import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
  Check, 
  CheckCircle, 
  CreditCard, 
  Loader2, 
  Upload,
  RefreshCw, 
  FileText,
  Edit,
  AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface PaymentConfirmationProps {
  saleId: number | null;
  canManage: boolean;
  isAdmin?: boolean;
}

// Função para formatar data no padrão brasileiro
const formatDateToBR = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export function PaymentConfirmation({ saleId, canManage, isAdmin }: PaymentConfirmationProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  // Inicializar com string vazia para forçar o usuário a digitar a data
  const [paymentDate, setPaymentDate] = useState<string>("");
  const [paymentDateStr, setPaymentDateStr] = useState<string>("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  
  // Verificar se o usuário é administrador (só administradores podem editar pagamentos já confirmados)
  const isUserAdmin = isAdmin ?? (user?.role === "admin");
  
  // Buscar métodos de pagamento do sistema
  const { data: paymentMethods = [], isLoading: isLoadingPaymentMethods } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/payment-methods");
      return res.json();
    },
  });
  
  // Buscar parcelas
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['/api/sales', saleId, 'installments'],
    queryFn: async () => {
      if (!saleId) return [];
      const res = await apiRequest("GET", `/api/sales/${saleId}/installments`);
      const data = await res.json();
      
      // Debug: Verificar o formato das datas das parcelas
      if (data && data.length > 0) {
        console.log("Parcelas recebidas do servidor:", data);
        data.forEach((installment: any, index: number) => {
          console.log(`Parcela #${index+1} (${installment.installmentNumber}): dueDate=${installment.dueDate}, tipo=${typeof installment.dueDate}`);
        });
      }
      
      return data;
    },
    enabled: !!saleId,
  });
  
  // Mutation para editar um pagamento confirmado (apenas admin pode fazer isso)
  const editPaymentMutation = useMutation({
    mutationFn: async ({ installmentId, paymentDate, notes, paymentMethodId }: { installmentId: number, paymentDate: string, notes: string, paymentMethodId: string }) => {
      // Buscar o método de pagamento selecionado para usar seu nome
      const selectedMethod = paymentMethods.find((m: any) => String(m.id) === paymentMethodId);
      
      // Criar rota para editar pagamento
      const res = await apiRequest("POST", `/api/installments/${installmentId}/edit-payment`, {
        paymentDate, // Enviar a data exatamente como está
        paymentMethodId: Number(paymentMethodId),
        notes: notes,
        receiptData: { 
          detail: "Edição de pagamento",
          paymentMethod: selectedMethod?.name || "Método não especificado"
        }
      });
      return res.json();
    },
    onSuccess: () => {
      // Atualizar os dados após a edição
      queryClient.invalidateQueries({ queryKey: ['/api/sales', saleId, 'installments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales', saleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      
      toast({
        title: "Pagamento atualizado",
        description: "As informações de pagamento foram atualizadas com sucesso.",
      });
      
      // Fechar o diálogo de edição
      closeEditDialog();
    },
    onError: (error: any) => {
      console.error("Erro ao editar pagamento:", error);
      toast({
        title: "Erro ao editar pagamento",
        description: error.message || "Não foi possível atualizar as informações de pagamento.",
        variant: "destructive",
      });
    }
  });
  
  // Mutation para confirmar pagamento
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ installmentId, paymentDate, notes, paymentMethodId }: { installmentId: number, paymentDate: string, notes: string, paymentMethodId: string }) => {
      // Buscar o método de pagamento selecionado para usar seu nome
      const selectedMethod = paymentMethods.find(m => String(m.id) === paymentMethodId);
      
      // Usar a data exatamente como foi fornecida pelo usuário
      console.log(`🔍 Confirmação de pagamento: Data a ser enviada: ${paymentDate}`);
      
      const res = await apiRequest("POST", `/api/installments/${installmentId}/confirm-payment`, {
        paymentDate, // Enviar a data exatamente como está para preservar o formato
        paymentMethodId: Number(paymentMethodId), // ID do método de pagamento
        receiptType: "manual", // "manual" é o tipo de comprovante
        notes: notes,
        receiptData: { 
          detail: "Confirmação manual",
          paymentMethod: selectedMethod?.name || "Método não especificado"
        }
      });
      return res.json();
    },
    onSuccess: () => {
      // Atualizar os dados após a confirmação
      queryClient.invalidateQueries({ queryKey: ['/api/sales', saleId, 'installments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales', saleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      
      // Verificar se estamos no modo de confirmação múltipla
      if (showMultiConfirm && selectedInstallments.length > 0) {
        // Remover a parcela atual da lista de parcelas selecionadas
        const updatedInstallments = [...selectedInstallments];
        updatedInstallments.shift(); // Remove o primeiro item (que acabamos de confirmar)
        setSelectedInstallments(updatedInstallments);
        
        // Verificar se ainda há mais parcelas para confirmar
        if (updatedInstallments.length > 0) {
          toast({
            title: "Parcela confirmada",
            description: `Confirmada com sucesso. Processando próxima parcela (${updatedInstallments.length} restantes)...`,
          });
          
          // Processar a próxima parcela automaticamente
          const nextInstallment = pendingInstallments.find(inst => inst.id === updatedInstallments[0]);
          if (nextInstallment) {
            // Usar setTimeout para dar um pequeno atraso antes de confirmar a próxima,
            // permitindo que a interface se atualize primeiro
            setTimeout(() => {
              confirmPaymentMutation.mutate({
                installmentId: nextInstallment.id,
                paymentDate: paymentDateStr,
                notes: paymentNotes,
                paymentMethodId
              });
            }, 500);
          }
          return;
        } else {
          // Todas as parcelas foram confirmadas
          toast({
            title: "Todas as parcelas confirmadas",
            description: "Todas as parcelas pendentes foram confirmadas com sucesso.",
          });
        }
      } else {
        // Confirmação única
        toast({
          title: "Pagamento confirmado",
          description: "O pagamento foi confirmado com sucesso.",
        });
      }
      
      // Fechar o diálogo
      closeConfirmDialog();
    },
    onError: (error: any) => {
      console.error("Erro completo:", error);
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message || "Não foi possível confirmar o pagamento.",
        variant: "destructive",
      });
      
      // Se estamos no modo de confirmação múltipla, cancelar todo o processo
      if (showMultiConfirm) {
        closeConfirmDialog();
        toast({
          title: "Processo interrompido",
          description: "O processo de confirmação em lote foi interrompido devido a um erro.",
          variant: "destructive",
        });
      }
    }
  });
  
  // Função formatDateToBR já declarada no início do arquivo

  // Função para abrir o diálogo de confirmação para uma única parcela
  const openConfirmDialog = (installment: any) => {
    setSelectedInstallment(installment);
    setShowMultiConfirm(false);
    
    // Inicializar com string vazia para forçar a digitação manual
    setPaymentDate("");
    setPaymentDateStr("");
    setPaymentNotes("");
    
    // Definir primeiro método de pagamento como padrão, se disponível
    if (paymentMethods.length > 0) {
      setPaymentMethodId(String(paymentMethods[0].id));
    }
    
    setConfirmDialogOpen(true);
  };
  
  // Função para abrir o diálogo de edição de pagamento (apenas admin)
  const openEditDialog = (installment: any) => {
    setSelectedInstallment(installment);
    
    // Preencher com os valores atuais da parcela
    // Se a parcela já tem uma data de pagamento, usá-la como valor inicial
    if (installment.paymentDate) {
      // Converter a data para o formato brasileiro
      const date = new Date(installment.paymentDate);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;
      
      setPaymentDateStr(formattedDate);
    } else {
      setPaymentDateStr("");
    }
    
    // Definir as notas do pagamento, se existirem
    setPaymentNotes(installment.paymentNotes || "");
    
    // Definir o método de pagamento, se existir
    if (installment.paymentMethodId) {
      setPaymentMethodId(String(installment.paymentMethodId));
    } else if (paymentMethods.length > 0) {
      setPaymentMethodId(String(paymentMethods[0].id));
    }
    
    setEditDialogOpen(true);
  };
  
  // Função para abrir o diálogo de confirmação para múltiplas parcelas
  const openMultiConfirmDialog = () => {
    setSelectedInstallment(null);
    setShowMultiConfirm(true);
    
    // Inicializar com string vazia para forçar a digitação manual
    setPaymentDate("");
    setPaymentDateStr("");
    setPaymentNotes("");
    
    // Definir primeiro método de pagamento como padrão, se disponível
    if (paymentMethods.length > 0) {
      setPaymentMethodId(String(paymentMethods[0].id));
    }
    
    // Selecionar todas as parcelas pendentes
    setSelectedInstallments(pendingInstallments.map((inst: any) => inst.id));
    
    setConfirmDialogOpen(true);
  };
  
  // Fechar diálogo de confirmação
  const closeConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedInstallment(null);
    setShowMultiConfirm(false);
    setSelectedInstallments([]);
  };
  
  // Fechar diálogo de edição
  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setSelectedInstallment(null);
  };
  
  // Função para salvar a edição de um pagamento (apenas admin)
  const handleEditPayment = () => {
    if (!selectedInstallment) return;
    if (!paymentDateStr || !paymentMethodId) return;
    
    // Chamar a mutation para editar o pagamento
    editPaymentMutation.mutate({
      installmentId: selectedInstallment.id,
      paymentDate: paymentDateStr,
      notes: paymentNotes,
      paymentMethodId
    });
  };
  
  // Confirmar pagamento de uma única parcela
  const handleConfirmPayment = () => {
    if (!selectedInstallment && !showMultiConfirm) return;
    if (!paymentDateStr || !paymentMethodId) return;
    
    // Usar exatamente o que o usuário digitou sem conversões automáticas
    console.log(`📅 Enviando data exatamente como digitada: "${paymentDateStr}"`);
    
    if (showMultiConfirm && selectedInstallments.length > 0) {
      // Confirmar múltiplas parcelas sequencialmente
      const currentInstallment = pendingInstallments.find(inst => inst.id === selectedInstallments[0]);
      
      if (currentInstallment) {
        confirmPaymentMutation.mutate({
          installmentId: currentInstallment.id,
          paymentDate: paymentDateStr,
          notes: paymentNotes,
          paymentMethodId
        });
      }
    } else if (selectedInstallment) {
      // Confirmar uma parcela única
      confirmPaymentMutation.mutate({
        installmentId: selectedInstallment.id,
        paymentDate: paymentDateStr,
        notes: paymentNotes,
        paymentMethodId
      });
    }
  };
  
  // Observação: Estamos focando em corrigir a exibição das parcelas existentes
  // em vez de criar funcionalidades para recriar as parcelas
  
  // Estado para seleção múltipla de parcelas
  const [selectedInstallments, setSelectedInstallments] = useState<number[]>([]);
  const [showMultiConfirm, setShowMultiConfirm] = useState(false);
  
  // Verificar se todas as parcelas estão pagas
  // Não verificamos mais se TODAS as parcelas estão pagas, apenas se existem parcelas
  const allPaid = installments.length > 0 && installments.every((item: any) => item.status === 'paid');
  // Flag para controlar se há pelo menos uma parcela pendente
  const hasPendingInstallments = installments.some((item: any) => item.status === 'pending');
  // Obter a lista de parcelas pendentes
  const pendingInstallments = installments.filter((item: any) => item.status === 'pending');
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Confirmação de Pagamentos
          </CardTitle>
          <CardDescription>
            Confirme os pagamentos das parcelas da venda
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Carregando parcelas...</span>
        </CardContent>
      </Card>
    );
  }
  
  if (installments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Confirmação de Pagamentos
          </CardTitle>
          <CardDescription>
            Confirme os pagamentos das parcelas da venda
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Não há parcelas registradas para esta venda.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Confirmação de Pagamentos
          </CardTitle>
          <CardDescription>
            {allPaid 
              ? "Todos os pagamentos foram confirmados." 
              : "Confirme os pagamentos das parcelas pendentes."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasPendingInstallments && canManage && (
            <div className="mb-4 flex justify-end">
              <Button 
                onClick={openMultiConfirmDialog}
                variant="outline"
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Todas Pendentes
              </Button>
            </div>
          )}
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcela</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((installment: any) => {
                // Encontrar o método de pagamento, se existir
                const paymentMethod = paymentMethods.find((m: any) => 
                  m.id === installment.paymentMethodId
                );
                
                return (
                  <TableRow key={installment.id}>
                    <TableCell>{installment.installmentNumber}</TableCell>
                    <TableCell>
                      {formatDate(installment.dueDate)}
                    </TableCell>
                    <TableCell>
                      {installment.paymentDate ? (
                        <span className="text-green-700">{formatDate(installment.paymentDate)}</span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Não pago</span>
                      )}
                    </TableCell>
                    <TableCell>{formatCurrency(installment.amount)}</TableCell>
                    <TableCell>
                      {installment.status === 'paid' && paymentMethod ? (
                        <span className="flex items-center text-sm">
                          <CreditCard className="h-3 w-3 mr-1 text-blue-600" />
                          {paymentMethod.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        installment.status === 'paid' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {installment.status === 'paid' ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Pago
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 mr-1" />
                          Pendente
                        </>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {installment.status === 'pending' && canManage && (
                      <Button 
                        onClick={() => openConfirmDialog(installment)}
                        size="sm"
                        variant="default"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirmar
                      </Button>
                    )}
                    {installment.status === 'paid' && !isUserAdmin && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="text-green-600"
                        disabled
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Confirmado
                      </Button>
                    )}
                    {/* Botão de edição apenas para administradores em parcelas já pagas */}
                    {installment.status === 'paid' && isUserAdmin && (
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="text-green-600"
                          disabled
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Confirmado
                        </Button>
                        <Button
                          onClick={() => openEditDialog(installment)}
                          size="sm"
                          variant="outline"
                          className="border-amber-500 text-amber-600 hover:bg-amber-50"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            {allPaid ? (
              <span className="flex items-center text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Todos os pagamentos confirmados
              </span>
            ) : (
              <span className="flex items-center text-amber-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                Há parcelas pendentes de confirmação
              </span>
            )}
          </div>
          {/* Aviso explicativo sobre parcelas pendentes */}
          {hasPendingInstallments && (
            <div className="text-amber-600 text-sm flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              Clique em "Confirmar" para cada parcela pendente
            </div>
          )}
        </CardFooter>
      </Card>
      
      {/* Diálogo de confirmação de pagamento */}
      {/* Diálogo de confirmação de pagamento */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              {showMultiConfirm 
                ? `Confirme os pagamentos de ${pendingInstallments.length} parcelas pendentes.`
                : `Confirme o recebimento do pagamento da parcela ${selectedInstallment?.installmentNumber}.`
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {showMultiConfirm && selectedInstallments.length > 0 && (
              <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
                <p className="text-sm text-amber-800 flex items-center mb-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Confirmação em lote
                </p>
                <p className="text-sm text-amber-700">
                  Você está prestes a confirmar o pagamento de todas as {pendingInstallments.length} parcelas pendentes 
                  com a mesma data de pagamento e método de pagamento.
                </p>
                
                <div className="mt-3 p-2 bg-white rounded border border-amber-100">
                  <p className="text-xs font-medium mb-1">Parcelas a serem confirmadas:</p>
                  <div className="flex flex-wrap gap-1">
                    {pendingInstallments.map((inst: any) => (
                      <span key={inst.id} className="inline-flex items-center px-2 py-1 rounded text-xs bg-amber-100 text-amber-800">
                        Parcela {inst.installmentNumber}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="payment-method">Método de Pagamento</Label>
              <Select 
                value={paymentMethodId} 
                onValueChange={setPaymentMethodId}
                disabled={isLoadingPaymentMethods || paymentMethods.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingPaymentMethods ? "Carregando..." : "Selecione o método de pagamento"} />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method: any) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment-date">Data do Pagamento</Label>
              <Input
                id="payment-date"
                type="text"
                placeholder="dd/mm/aaaa"
                value={paymentDateStr}
                onChange={(e) => {
                  // Usar exatamente o que o usuário digitou, sem conversões
                  setPaymentDateStr(e.target.value);
                  setPaymentDate(e.target.value);
                  console.log(`🔍 Usuário digitou a data: "${e.target.value}" - Usando exatamente este valor`);
                  
                  // Não vamos mais converter para formato ISO ou Date
                  // Isso garante que a data digitada pelo usuário seja preservada exatamente como está
                }}
              />
              <p className="text-xs text-muted-foreground">
                Digite a data no formato dd/mm/aaaa, dd-mm-aaaa ou aaaa-mm-dd
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="payment-notes">Observações</Label>
              <Textarea
                id="payment-notes"
                placeholder="Informações adicionais sobre o pagamento..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeConfirmDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmPayment}
              disabled={!paymentDateStr || !paymentMethodId || confirmPaymentMutation.isPending}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              {confirmPaymentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {showMultiConfirm ? "Confirmar Parcelas" : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo de edição de pagamento (apenas para administradores) */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Edit className="h-5 w-5 mr-2 text-amber-600" />
              Editar Pagamento Confirmado
            </DialogTitle>
            <DialogDescription>
              <div className="mt-2 flex items-center">
                <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
                <span>Esta operação é exclusiva para administradores.</span>
              </div>
              <p className="mt-2">
                Edite as informações de pagamento da parcela {selectedInstallment?.installmentNumber}.
              </p>
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <p className="text-sm text-amber-800 flex items-center mb-2">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Atenção: Modo de edição ativado
              </p>
              <p className="text-sm text-amber-700">
                Você está modificando um pagamento já confirmado. Esta operação afetará relatórios financeiros.
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-payment-method">Método de Pagamento</Label>
              <Select 
                value={paymentMethodId} 
                onValueChange={setPaymentMethodId}
                disabled={isLoadingPaymentMethods || paymentMethods.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingPaymentMethods ? "Carregando..." : "Selecione o método de pagamento"} />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method: any) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-payment-date">Data do Pagamento</Label>
              <Input
                id="edit-payment-date"
                type="text"
                placeholder="dd/mm/aaaa"
                value={paymentDateStr}
                onChange={(e) => {
                  setPaymentDateStr(e.target.value);
                  setPaymentDate(e.target.value);
                }}
              />
              <p className="text-xs text-muted-foreground">
                Digite a data no formato dd/mm/aaaa, dd-mm-aaaa ou aaaa-mm-dd
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="edit-payment-notes">Observações</Label>
              <Textarea
                id="edit-payment-notes"
                placeholder="Informações adicionais sobre o pagamento..."
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeEditDialog}>
              Cancelar
            </Button>
            <Button 
              onClick={handleEditPayment}
              disabled={!paymentDateStr || !paymentMethodId || editPaymentMutation.isPending}
              variant="default"
              className="bg-amber-600 hover:bg-amber-700"
            >
              {editPaymentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Edit className="h-4 w-4 mr-2" />
              )}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}