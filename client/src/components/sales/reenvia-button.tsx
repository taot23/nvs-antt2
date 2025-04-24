import React, { useState } from 'react';
import { SendHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

// Definindo a tipagem para a venda
interface Sale {
  id: number;
  orderNumber: string;
  date: string;
  customerId: number;
  customerName?: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  sellerId: number;
  sellerName?: string;
  totalAmount: string;
  status: string;
  executionStatus: string;
  financialStatus: string;
  notes: string | null;
  returnReason: string | null;
  responsibleOperationalId: number | null;
  responsibleFinancialId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ReenviaButtonProps {
  sale: Sale;
}

export default function ReenviaButton({ sale }: ReenviaButtonProps) {
  const [open, setOpen] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const { toast } = useToast();
  const { user } = useAuth();

  console.log('ReenviaButton - sale:', sale?.id, 'status:', sale?.status, 'open:', open, 'userRole:', user?.role);
  
  // Log detalhado para depuração
  console.log('DEPURAÇÃO ReenviaButton:', {
    isReturned: sale?.status === 'returned',
    isAdmin: user?.role === 'admin',
    isSupervisor: user?.role === 'supervisor',
    isOwner: user?.role === 'vendedor' && sale?.sellerId === user?.id,
    shouldShow: sale?.status === 'returned' && (
      user?.role === 'admin' || 
      user?.role === 'supervisor' || 
      (user?.role === 'vendedor' && sale?.sellerId === user?.id)
    )
  });

  const reenviarMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/sales/${sale.id}/resend`, {
        notes: observacoes,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Venda reenviada com sucesso',
        description: 'A venda foi reenviada para o operacional com suas observações.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      setOpen(false);
      setObservacoes('');
    },
    onError: (error) => {
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

  // Não mostrar o botão se a venda não estiver em status "returned"
  // Verificar permissões: administrador, supervisor ou vendedor responsável
  console.log("VERIFICANDO RENDERIZAÇÃO, venda:", sale.id, "status:", sale.status, "role:", user?.role);
  
  // Verificação simplificada para depuração
  if (sale.status !== 'returned') {
    console.log("Botão não mostrado: venda não está com status 'returned'");
    return null;
  }
  
  // Verificação de permissão
  if (user?.role !== 'admin' && user?.role !== 'supervisor' && !(user?.role === 'vendedor' && sale.sellerId === user?.id)) {
    console.log("Botão não mostrado: sem permissão. Role:", user?.role, "Vendedor id:", sale.sellerId);
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(true)}
        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
        title="Reenviar venda corrigida"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Reenviar Venda Corrigida</DialogTitle>
            <DialogDescription>
              Esta venda foi devolvida. Informe as correções realizadas antes de reenviá-la.
            </DialogDescription>
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
                <Label>Valor Total</Label>
                <div className="font-medium">
                  R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
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
              <Label htmlFor="observacoes" className="text-base">
                Observação das Correções Realizadas *
              </Label>
              <Textarea
                id="observacoes"
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
    </>
  );
}