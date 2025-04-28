import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

interface ReenviarDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  sale: any;
}

export default function ReenviarDialog({ open, setOpen, sale }: ReenviarDialogProps) {
  const { toast } = useToast();
  const [observacoes, setObservacoes] = useState('');

  console.log('⭐ ReenviarDialog renderizado:', { open, sale: sale?.id });

  // Resetar as observações quando o diálogo é aberto
  useEffect(() => {
    if (open) {
      setObservacoes('');
      console.log('⭐ Observações resetadas');
    }
  }, [open]);

  // Mutation para reenviar a venda
  const reenviarMutation = useMutation({
    mutationFn: async () => {
      console.log('⭐ Enviando requisição de reenvio:', sale?.id, observacoes);
      const response = await apiRequest('PUT', `/api/sales/${sale.id}/resend`, {
        correctionNotes: observacoes,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Venda reenviada com sucesso',
        description: 'A venda foi reenviada para o operacional.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      if (window.currentUser?.role === 'vendedor') {
        queryClient.invalidateQueries({ queryKey: ['/api/sales', window.currentUser.id] });
      }
      setOpen(false);
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
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em Andamento';
      case 'completed':
        return 'Concluída';
      case 'returned':
        return 'Devolvida';
      default:
        return status;
    }
  }

  function getStatusVariant(status: string) {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'success';
      case 'returned':
        return 'destructive';
      default:
        return 'secondary';
    }
  }

  if (!sale) {
    console.log('⭐ Sale não definida, não renderizando diálogo');
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            onClick={() => setOpen(false)}
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
  );
}