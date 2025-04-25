import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency, formatDate } from "@/lib/formatters";
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
  Check, 
  CheckCircle, 
  CreditCard, 
  Loader2, 
  Upload 
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
  const [paymentNotes, setPaymentNotes] = useState("");
  
  // Buscar parcelas
  const { data: installments = [], isLoading } = useQuery({
    queryKey: ['/api/sales', saleId, 'installments'],
    queryFn: async () => {
      if (!saleId) return [];
      const res = await apiRequest("GET", `/api/sales/${saleId}/installments`);
      return res.json();
    },
    enabled: !!saleId,
  });
  
  // Mutation para confirmar pagamento
  const confirmPaymentMutation = useMutation({
    mutationFn: async ({ installmentId, paymentDate, notes }: { installmentId: number, paymentDate: Date, notes: string }) => {
      const res = await apiRequest("POST", `/api/sale-installments/${installmentId}/confirm-payment`, {
        paymentDate: paymentDate.toISOString(),
        receiptData: {
          type: "manual",
          notes
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
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message || "Não foi possível confirmar o pagamento.",
        variant: "destructive",
      });
    }
  });
  
  // Função para abrir o diálogo de confirmação
  const openConfirmDialog = (installment: any) => {
    setSelectedInstallment(installment);
    setPaymentDate(new Date());
    setPaymentNotes("");
    setConfirmDialogOpen(true);
  };
  
  // Fechar diálogo
  const closeConfirmDialog = () => {
    setConfirmDialogOpen(false);
    setSelectedInstallment(null);
  };
  
  // Confirmar pagamento
  const handleConfirmPayment = () => {
    if (!selectedInstallment || !paymentDate) return;
    
    confirmPaymentMutation.mutate({
      installmentId: selectedInstallment.id,
      paymentDate,
      notes: paymentNotes
    });
  };
  
  // Verificar se todas as parcelas estão pagas
  const allPaid = installments.length > 0 && installments.every((item: any) => item.status === 'paid');
  
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
                  <TableCell>{formatDate(installment.dueDate)}</TableCell>
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
              <Label htmlFor="payment-date">Data do Pagamento</Label>
              <DatePicker
                selected={paymentDate}
                onSelect={setPaymentDate}
                placeholder="Selecione a data do pagamento"
              />
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
              disabled={!paymentDate || confirmPaymentMutation.isPending}
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