import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { useToast } from "@/hooks/use-toast";
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
  FileText 
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
}

export function PaymentConfirmation({ saleId, canManage }: PaymentConfirmationProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentDate, setPaymentDate] = useState<Date | null>(new Date());
  const [paymentDateStr, setPaymentDateStr] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  
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
        data.forEach((installment, index) => {
          console.log(`Parcela #${index+1} (${installment.installmentNumber}): dueDate=${installment.dueDate}, tipo=${typeof installment.dueDate}`);
        });
      }
      
      return data;
    },
    enabled: !!saleId,
  });
  
  // Mutation para confirmar pagamento
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ installmentId, paymentDate, notes, paymentMethodId }: { installmentId: number, paymentDate: Date, notes: string, paymentMethodId: string }) => {
      // Buscar o método de pagamento selecionado para usar seu nome
      const selectedMethod = paymentMethods.find(m => String(m.id) === paymentMethodId);
      
      // Formatar a data no formato YYYY-MM-DD para garantir consistência
      const formattedDate = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}-${String(paymentDate.getDate()).padStart(2, '0')}`;
      
      console.log(`🔍 Confirmação de pagamento: Data a ser enviada: ${formattedDate}`);
      
      const res = await apiRequest("POST", `/api/installments/${installmentId}/confirm-payment`, {
        paymentDate: formattedDate, // Enviar apenas a data formatada sem o componente de tempo
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
      queryClient.invalidateQueries({ queryKey: ['/api/sales', saleId, 'installments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales', saleId] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      
      toast({
        title: "Pagamento confirmado",
        description: "O pagamento foi confirmado com sucesso.",
      });
      
      closeConfirmDialog();
    },
    onError: (error: any) => {
      console.error("Erro completo:", error);
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message || "Não foi possível confirmar o pagamento.",
        variant: "destructive",
      });
    }
  });
  
  // Função para formatar data no padrão brasileiro
  const formatDateToBR = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Função para abrir o diálogo de confirmação
  const openConfirmDialog = (installment: any) => {
    setSelectedInstallment(installment);
    
    // Atualizar a data atual
    const today = new Date();
    setPaymentDate(today);
    // Formatar a data no padrão brasileiro dd/mm/aaaa
    setPaymentDateStr(formatDateToBR(today));
    setPaymentNotes("");
    
    // Definir primeiro método de pagamento como padrão, se disponível
    if (paymentMethods.length > 0) {
      setPaymentMethodId(String(paymentMethods[0].id));
    }
    
    setConfirmDialogOpen(true);
  };
  
  // Fechar diálogo
  const closeConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedInstallment(null);
  };
  
  // Confirmar pagamento
  const handleConfirmPayment = () => {
    if (!selectedInstallment || !paymentDate || !paymentMethodId) return;
    
    confirmPaymentMutation.mutate({
      installmentId: selectedInstallment.id,
      paymentDate,
      notes: paymentNotes,
      paymentMethodId
    });
  };
  
  // Observação: Estamos focando em corrigir a exibição das parcelas existentes
  // em vez de criar funcionalidades para recriar as parcelas
  
  // Verificar se todas as parcelas estão pagas
  // Não verificamos mais se TODAS as parcelas estão pagas, apenas se existem parcelas
  const allPaid = installments.length > 0 && installments.every((item: any) => item.status === 'paid');
  // Flag para controlar se há pelo menos uma parcela pendente
  const hasPendingInstallments = installments.some((item: any) => item.status === 'pending');
  
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parcela</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {installments.map((installment: any) => (
                <TableRow key={installment.id}>
                  <TableCell>{installment.installmentNumber}</TableCell>
                  <TableCell>
                    {console.log(`🔍 DEPURAÇÃO: Parcela #${installment.installmentNumber}, data: ${installment.dueDate}, tipo: ${typeof installment.dueDate}`)}
                    {formatDate(installment.dueDate)}
                  </TableCell>
                  <TableCell>{formatCurrency(installment.amount)}</TableCell>
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
                    {installment.status === 'paid' && (
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
                  </TableCell>
                </TableRow>
              ))}
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
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Confirme o recebimento do pagamento da parcela {selectedInstallment?.installmentNumber}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
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
                  setPaymentDateStr(e.target.value);
                  
                  // Tentamos converter a data para um objeto Date apenas se tiver formato válido
                  try {
                    // Logging para depuração
                    console.log(`🔍 Entrada de data do usuário: "${e.target.value}"`);
                    
                    // Se o formato for dd/mm/aaaa
                    if (/^\d{2}\/\d{2}\/\d{4}$/.test(e.target.value)) {
                      const [day, month, year] = e.target.value.split('/');
                      
                      // Criando data no formato YYYY-MM-DD para evitar problemas de fuso horário
                      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                      console.log(`🔍 Data formatada: ${formattedDate}`);
                      
                      // Criar a data
                      const newDate = new Date(formattedDate + 'T00:00:00.000Z');
                      
                      if (!isNaN(newDate.getTime())) {
                        console.log(`🔍 Data convertida: ${newDate.toISOString()}`);
                        setPaymentDate(newDate);
                      }
                    } 
                    // Se o formato for aaaa-mm-dd
                    else if (/^\d{4}-\d{2}-\d{2}$/.test(e.target.value)) {
                      // Usar diretamente o formato YYYY-MM-DD pois já está correto
                      const formattedDate = e.target.value;
                      console.log(`🔍 Data formatada (ISO): ${formattedDate}`);
                      
                      // Criar a data
                      const newDate = new Date(formattedDate + 'T00:00:00.000Z');
                      
                      if (!isNaN(newDate.getTime())) {
                        console.log(`🔍 Data convertida (ISO): ${newDate.toISOString()}`);
                        setPaymentDate(newDate);
                      }
                    }
                    // Se for uma data em formato livre com traços (dd-mm-aaaa)
                    else if (/^\d{2}-\d{2}-\d{4}$/.test(e.target.value)) {
                      const [day, month, year] = e.target.value.split('-');
                      
                      // Criando data no formato YYYY-MM-DD para evitar problemas de fuso horário
                      const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                      console.log(`🔍 Data formatada (traços): ${formattedDate}`);
                      
                      // Criar a data
                      const newDate = new Date(formattedDate + 'T00:00:00.000Z');
                      
                      if (!isNaN(newDate.getTime())) {
                        console.log(`🔍 Data convertida (traços): ${newDate.toISOString()}`);
                        setPaymentDate(newDate);
                      }
                    }
                  } catch (error) {
                    // Se falhar, apenas mantém a string mas não atualiza o objeto Date
                    console.log('Formato de data inválido', error);
                  }
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
              disabled={!paymentDate || !paymentMethodId || confirmPaymentMutation.isPending}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              {confirmPaymentMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}