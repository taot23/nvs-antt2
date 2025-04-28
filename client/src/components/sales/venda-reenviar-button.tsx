import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SendHorizontal, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type Sale = any;

interface VendaReenviarButtonProps {
  sale: Sale;
  iconOnly?: boolean;
}

export default function VendaReenviarButton({ sale, iconOnly = false }: VendaReenviarButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const reenviarMutation = useMutation({
    mutationFn: async () => {
      console.log('Enviando requisição de reenvio para venda', sale.id, 'com observações:', observacoes);
      
      // Obtém os itens mais atualizados
      const itemsResponse = await fetch(`/api/sales/${sale.id}/items`);
      const items = await itemsResponse.json();
      
      // Obtém as parcelas atualizadas para extrair as datas de vencimento
      const installmentsResponse = await fetch(`/api/sales/${sale.id}/installments`);
      const installments = await installmentsResponse.json();
      
      // Extrair as datas de vencimento das parcelas
      const installmentDates = installments.map(inst => {
        // Garantir que a data está no formato correto YYYY-MM-DD
        const dueDate = inst.dueDate.split('T')[0];
        return dueDate;
      });
      
      console.log("Itens atualizados para reenvio:", items);
      console.log("Datas de parcelas para reenvio:", installmentDates);
      
      // Envia a requisição com todos os dados necessários
      const response = await apiRequest('PUT', `/api/sales/${sale.id}/resend`, {
        correctionNotes: observacoes,
        items: items,
        serviceTypeId: sale.serviceTypeId,
        serviceProviderId: sale.serviceProviderId,
        paymentMethodId: sale.paymentMethodId,
        installments: sale.installments,
        totalAmount: sale.totalAmount,
        installmentDates: installmentDates
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Venda reenviada com sucesso',
        description: 'As correções foram registradas e a venda foi reenviada ao operacional.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      setDialogOpen(false);
      setObservacoes('');
    },
    onError: (error: Error) => {
      toast({
        title: 'Erro ao reenviar venda',
        description: error.message || 'Ocorreu um erro ao reenviar a venda.',
        variant: 'destructive',
      });
    },
  });

  const handleReenviar = () => {
    if (!observacoes.trim()) {
      toast({
        title: 'Observação obrigatória',
        description: 'Por favor, informe as correções realizadas antes de reenviar.',
        variant: 'destructive',
      });
      return;
    }
    reenviarMutation.mutate();
  };

  function getStatusLabel(status: string) {
    switch (status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'returned': return 'Devolvida';
      case 'completed': return 'Concluída';
      default: return status;
    }
  }

  function getStatusVariant(status: string) {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'secondary';
      case 'returned': return 'destructive';
      case 'completed': return 'success';
      default: return 'default';
    }
  }

  // Essa venda pode ser reenviada?
  const podeReenviar = sale.status === 'returned';

  // Se não puder reenviar, não renderiza o botão
  if (!podeReenviar) return null;

  return (
    <>
      {iconOnly ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDialogOpen(true)}
          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          title="Reenviar venda corrigida"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="default"
          className="h-8 px-3"
          onClick={() => setDialogOpen(true)}
        >
          <SendHorizontal className="h-4 w-4 mr-1" />
          Reenviar
        </Button>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reenviar Venda Corrigida</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Número OS</Label>
                <div className="font-medium">{sale.orderNumber}</div>
              </div>
              <div>
                <Label>Data</Label>
                <div className="font-medium">
                  {sale.date ? format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
                </div>
              </div>
              <div>
                <Label>Cliente</Label>
                <div className="font-medium">{sale.customerName}</div>
              </div>
              <div>
                <Label>Vendedor</Label>
                <div className="font-medium">{sale.sellerName}</div>
              </div>
              <div>
                <Label>Valor Total</Label>
                <div className="font-medium">
                  R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div>
                  <Badge variant={getStatusVariant(sale.status) as any}>
                    {getStatusLabel(sale.status)}
                  </Badge>
                </div>
              </div>
            </div>

            {sale.returnReason && (
              <div className="space-y-1 border-l-4 border-destructive pl-4 py-2 bg-destructive/10 rounded-sm">
                <Label className="text-destructive">Motivo da Devolução:</Label>
                <div className="text-sm text-destructive/90">{sale.returnReason}</div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base">
                Observação das Correções Realizadas *
              </Label>
              <Textarea
                id="notes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Descreva as correções realizadas nesta venda..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Informe quais correções foram realizadas nesta venda antes de reenviá-la ao operacional.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={reenviarMutation.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={handleReenviar} disabled={reenviarMutation.isPending}>
              {reenviarMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                'Reenviar Venda'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}