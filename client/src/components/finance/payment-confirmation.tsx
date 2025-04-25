import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Clock, FileText, Link, Upload } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/formatters";

interface SaleInstallment {
  id: number;
  saleId: number;
  installmentNumber: number;
  amount: string;
  dueDate: string;
  status: string;
  paymentDate: string | null;
  confirmedBy: number | null;
  createdAt: string;
  updatedAt: string;
}

interface PaymentReceipt {
  id: number;
  installmentId: number;
  type: string;
  url: string | null;
  data: any;
  notes: string | null;
  createdAt: string;
}

interface PaymentConfirmationProps {
  saleId: number;
  canManage: boolean;
}

export function PaymentConfirmation({ saleId, canManage }: PaymentConfirmationProps) {
  const { toast } = useToast();
  const [isConfirmingPayment, setIsConfirmingPayment] = useState(false);
  const [selectedInstallmentId, setSelectedInstallmentId] = useState<number | null>(null);
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [receiptType, setReceiptType] = useState("manual");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [viewingReceipts, setViewingReceipts] = useState(false);
  const [selectedInstallmentForReceipts, setSelectedInstallmentForReceipts] = useState<number | null>(null);

  // Buscar parcelas da venda
  const { data: installments, isLoading } = useQuery<SaleInstallment[]>({
    queryKey: [`/api/sales/${saleId}/installments`],
    enabled: !!saleId,
  });

  // Buscar comprovantes de pagamento de uma parcela
  const { data: receipts, isLoading: isLoadingReceipts } = useQuery<PaymentReceipt[]>({
    queryKey: [`/api/installments/${selectedInstallmentForReceipts}/payment-receipts`],
    enabled: !!selectedInstallmentForReceipts,
  });

  // Confirmar pagamento de parcela
  const confirmPaymentMutation = useMutation({
    mutationFn: async (data: {
      installmentId: number;
      paymentDate: string;
      receiptType: string;
      receiptUrl?: string;
      notes?: string;
    }) => {
      const res = await apiRequest(
        "POST",
        `/api/installments/${data.installmentId}/confirm-payment`,
        data
      );
      return await res.json();
    },
    onSuccess: () => {
      // Limpar o formulário
      setPaymentDate(format(new Date(), "yyyy-MM-dd"));
      setReceiptType("manual");
      setReceiptUrl("");
      setNotes("");
      setIsConfirmingPayment(false);
      setSelectedInstallmentId(null);

      // Invalidar consultas para atualizar os dados
      queryClient.invalidateQueries({ queryKey: [`/api/sales/${saleId}/installments`] });
      
      toast({
        title: "Pagamento confirmado",
        description: "O pagamento foi confirmado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao confirmar pagamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfirmPayment = () => {
    if (!selectedInstallmentId) {
      toast({
        title: "Erro ao confirmar pagamento",
        description: "Selecione uma parcela para confirmar o pagamento",
        variant: "destructive",
      });
      return;
    }

    if (!paymentDate) {
      toast({
        title: "Erro ao confirmar pagamento",
        description: "A data de pagamento é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!receiptType) {
      toast({
        title: "Erro ao confirmar pagamento",
        description: "O tipo de comprovante é obrigatório",
        variant: "destructive",
      });
      return;
    }

    confirmPaymentMutation.mutate({
      installmentId: selectedInstallmentId,
      paymentDate,
      receiptType,
      receiptUrl: receiptUrl || undefined,
      notes: notes || undefined,
    });
  };

  const openConfirmDialog = (installmentId: number) => {
    setSelectedInstallmentId(installmentId);
    setIsConfirmingPayment(true);
  };

  const openReceiptsDialog = (installmentId: number) => {
    setSelectedInstallmentForReceipts(installmentId);
    setViewingReceipts(true);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-1 text-yellow-600">
            <Clock size={16} />
            <span>Pendente</span>
          </span>
        );
      case "paid":
        return (
          <span className="flex items-center gap-1 text-green-600">
            <CheckCircle size={16} />
            <span>Pago</span>
          </span>
        );
      case "overdue":
        return (
          <span className="flex items-center gap-1 text-red-600">
            <Clock size={16} />
            <span>Atrasado</span>
          </span>
        );
      default:
        return status;
    }
  };

  const getInstallmentLabel = (installment: SaleInstallment) => {
    return `Parcela ${installment.installmentNumber} - ${formatCurrency(parseFloat(installment.amount))}`;
  };

  const renderReceiptContent = (receipt: PaymentReceipt) => {
    switch (receipt.type) {
      case "manual":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <FileText size={16} />
              <span>Confirmação manual</span>
            </div>
            {receipt.notes && (
              <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                {receipt.notes}
              </div>
            )}
          </div>
        );
      case "link":
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Link size={16} />
              <span>Link de comprovante</span>
            </div>
            {receipt.url && (
              <a
                href={receipt.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary underline flex items-center gap-1"
              >
                <span>Visualizar comprovante</span>
                <Link size={14} />
              </a>
            )}
            {receipt.notes && (
              <div className="text-sm text-muted-foreground p-2 bg-muted/50 rounded">
                {receipt.notes}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="text-sm text-muted-foreground">
            Comprovante sem detalhes disponíveis
          </div>
        );
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Parcelas e Pagamentos</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Carregando parcelas...</div>
          ) : installments && installments.length > 0 ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary/20">
                      <th className="px-4 py-2 text-left">Parcela</th>
                      <th className="px-4 py-2 text-right">Valor</th>
                      <th className="px-4 py-2 text-center">Vencimento</th>
                      <th className="px-4 py-2 text-center">Status</th>
                      <th className="px-4 py-2 text-center">Data de Pagamento</th>
                      <th className="px-4 py-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {installments.map((installment) => (
                      <tr key={installment.id} className="border-b">
                        <td className="px-4 py-2">
                          Parcela {installment.installmentNumber}
                        </td>
                        <td className="px-4 py-2 text-right font-mono">
                          {formatCurrency(parseFloat(installment.amount))}
                        </td>
                        <td className="px-4 py-2 text-center whitespace-nowrap">
                          {format(new Date(installment.dueDate), "dd/MM/yyyy", {
                            locale: ptBR,
                          })}
                        </td>
                        <td className="px-4 py-2 text-center">
                          {getStatusLabel(installment.status)}
                        </td>
                        <td className="px-4 py-2 text-center whitespace-nowrap">
                          {installment.paymentDate
                            ? format(new Date(installment.paymentDate), "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <div className="flex justify-center gap-2">
                            {installment.status === "paid" ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openReceiptsDialog(installment.id)}
                                className="flex items-center gap-1"
                              >
                                <FileText size={14} />
                                <span>Comprovantes</span>
                              </Button>
                            ) : canManage ? (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => openConfirmDialog(installment.id)}
                                className="flex items-center gap-1"
                              >
                                <CheckCircle size={14} />
                                <span>Confirmar</span>
                              </Button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Nenhuma parcela registrada para esta venda.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmação de pagamento */}
      <Dialog open={isConfirmingPayment} onOpenChange={setIsConfirmingPayment}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para confirmar o pagamento da parcela.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Data de Pagamento</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="receiptType">Tipo de Comprovante</Label>
              <Select
                value={receiptType}
                onValueChange={(value) => setReceiptType(value)}
              >
                <SelectTrigger id="receiptType">
                  <SelectValue placeholder="Selecione o tipo de comprovante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Confirmação Manual</SelectItem>
                  <SelectItem value="link">Link de Comprovante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {receiptType === "link" && (
              <div className="space-y-2">
                <Label htmlFor="receiptUrl">URL do Comprovante</Label>
                <Input
                  id="receiptUrl"
                  value={receiptUrl}
                  onChange={(e) => setReceiptUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre o pagamento (opcional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmingPayment(false)}
              disabled={confirmPaymentMutation.isPending}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmPayment} 
              disabled={confirmPaymentMutation.isPending}
            >
              {confirmPaymentMutation.isPending
                ? "Confirmando..."
                : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de visualização de comprovantes */}
      <Dialog open={viewingReceipts} onOpenChange={setViewingReceipts}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Comprovantes de Pagamento</DialogTitle>
            <DialogDescription>
              Visualize os comprovantes de pagamento registrados para esta parcela.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoadingReceipts ? (
              <div className="py-8 text-center">
                Carregando comprovantes...
              </div>
            ) : receipts && receipts.length > 0 ? (
              <div className="space-y-4">
                {receipts.map((receipt) => (
                  <Card key={receipt.id}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="font-medium">
                          Comprovante de Pagamento
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(receipt.createdAt), "dd/MM/yyyy HH:mm", {
                            locale: ptBR,
                          })}
                        </div>
                      </div>
                      {renderReceiptContent(receipt)}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                Nenhum comprovante registrado para esta parcela.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setViewingReceipts(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}