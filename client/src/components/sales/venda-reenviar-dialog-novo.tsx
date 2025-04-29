import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { SendHorizontal, Loader2, Calendar, AlertTriangle, Lock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type Sale = any;
type Installment = {
  id: number;
  saleId: number;
  installmentNumber: number;
  amount: string;
  dueDate: string;
  status: string;
  paymentDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type SaleItem = {
  id: number;
  saleId: number;
  serviceId: number;
  serviceTypeId: number | null;
  quantity: number;
  price: string;
  totalPrice: string;
  notes: string | null;
  status: string;
  serviceName: string;
  serviceTypeName: string | null;
};

interface VendaReenviarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale;
}

export default function VendaReenviarDialog({ isOpen, onClose, sale }: VendaReenviarDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [dadosFinanceirosLocked, setDadosFinanceirosLocked] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Carregar parcelas e itens quando o diálogo for aberto
  useEffect(() => {
    if (isOpen && sale?.id) {
      setIsLoading(true);
      setObservacoes('');
      
      // Verificar se o financeiro já começou a análise
      const statusFinanceiro = sale.financialStatus;
      const financeiroJaIniciouAnalise = 
        statusFinanceiro === 'in_progress' || 
        statusFinanceiro === 'approved' || 
        statusFinanceiro === 'partial_payment' || 
        statusFinanceiro === 'completed' || 
        statusFinanceiro === 'in_analysis' || 
        statusFinanceiro === 'paid';
      
      setDadosFinanceirosLocked(financeiroJaIniciouAnalise);
      
      // Carregar parcelas com rejeição adequada de erros
      fetch(`/api/sales/${sale.id}/installments`)
        .then(response => {
          if (!response.ok) throw new Error(`Erro ao carregar parcelas: ${response.status}`);
          return response.json();
        })
        .then(data => {
          console.log('📊 Parcelas carregadas com sucesso:', data);
          setInstallments(data);
        })
        .catch(error => {
          console.error('❌ Erro ao carregar parcelas:', error);
          toast({
            title: 'Erro ao carregar parcelas',
            description: 'Falha ao obter parcelas da venda. Tente novamente.',
            variant: 'destructive',
          });
        });
      
      // Carregar itens da venda com rejeição adequada de erros
      fetch(`/api/sales/${sale.id}/items`)
        .then(response => {
          if (!response.ok) throw new Error(`Erro ao carregar itens: ${response.status}`);
          return response.json();
        })
        .then(data => {
          console.log('🛒 Itens carregados com sucesso:', data);
          setItems(data);
        })
        .catch(error => {
          console.error('❌ Erro ao carregar itens:', error);
          toast({
            title: 'Erro ao carregar itens',
            description: 'Falha ao obter itens da venda. Tente novamente.',
            variant: 'destructive',
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, sale?.id, toast]);

  // Mutation para reenviar a venda corrigida
  const reenviarMutation = useMutation({
    mutationFn: async () => {
      console.log('📝 Preparando reenvio da venda', sale.id);
      
      // Preparar dados para o reenvio
      const requestData: any = {
        correctionNotes: observacoes,
        serviceTypeId: sale.serviceTypeId,
        serviceProviderId: sale.serviceProviderId,
        paymentMethodId: sale.paymentMethodId,
        totalAmount: sale.totalAmount,
        installments: sale.installments,
        preserveFinancialData: dadosFinanceirosLocked
      };
      
      // Se financeiro já iniciou análise, forçar proteção dos dados
      if (dadosFinanceirosLocked) {
        console.log('🔒 Bloqueando modificações financeiras - Dados protegidos');
        
        // Usar as datas de vencimento originais das parcelas
        if (installments && installments.length > 0) {
          requestData.installmentDates = installments.map(p => {
            // Garantir formato YYYY-MM-DD sem timezone
            let dueDate = p.dueDate;
            if (typeof dueDate === 'string' && dueDate.includes('T')) {
              dueDate = dueDate.split('T')[0];
            }
            return dueDate;
          });
        }
        
        toast({
          title: "Proteção Financeira Ativada",
          description: "Dados financeiros protegidos contra modificações pois a venda já está em análise.",
          variant: "default",
          className: "bg-amber-100 border-amber-500 text-amber-800",
          duration: 4000,
        });
      }
      
      // Enviar itens atualizados para garantir consistência
      const itemsResponse = await fetch(`/api/sales/${sale.id}/items`);
      if (!itemsResponse.ok) throw new Error('Falha ao obter itens atualizados');
      requestData.items = await itemsResponse.json();
      
      console.log('📤 Enviando dados para reenvio:', requestData);
      
      // Enviar requisição para reenviar a venda
      const response = await apiRequest('PUT', `/api/sales/${sale.id}/resend`, requestData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Venda reenviada com sucesso',
        description: 'As correções foram registradas e a venda foi reenviada ao operacional.',
        duration: 3000,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      onClose();
    },
    onError: (error: Error) => {
      console.error('❌ Erro ao reenviar venda:', error);
      toast({
        title: 'Erro ao reenviar venda',
        description: error.message || 'Ocorreu um erro ao reenviar a venda.',
        variant: 'destructive',
      });
    },
  });

  function handleReenviar() {
    if (!observacoes.trim()) {
      toast({
        title: 'Observação obrigatória',
        description: 'Por favor, informe as correções realizadas antes de reenviar.',
        variant: 'destructive',
      });
      return;
    }
    reenviarMutation.mutate();
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Reenviar Venda Corrigida</DialogTitle>
          <DialogDescription>
            Faça as correções necessárias e reenvie esta venda ao operacional.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando dados da venda...</span>
          </div>
        ) : (
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
                <div className="font-medium flex items-center gap-1">
                  R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
                  {dadosFinanceirosLocked && <Lock className="h-3 w-3 text-amber-600" />}
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <div>
                  <Badge variant="destructive">
                    Devolvida
                  </Badge>
                </div>
              </div>
            </div>

            {/* Exibir itens da venda */}
            {items.length > 0 && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                <div className="flex justify-between border-b pb-2">
                  <Label className="text-base font-medium">Itens da Venda</Label>
                  <span className="text-sm text-muted-foreground">{items.length} item(s)</span>
                </div>
                
                <div className="space-y-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-sm p-1 border-b border-border/30">
                      <span className="font-medium">{item.serviceName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Qtd: {item.quantity}</span>
                        <span>R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exibir parcelas */}
            {installments.length > 0 && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <Label className="text-base font-medium">Parcelas e Datas de Vencimento</Label>
                </div>
                
                {dadosFinanceirosLocked && (
                  <Alert variant="default" className="mb-2 bg-amber-50 border-amber-500 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-xs font-semibold">Atenção - Dados Financeiros Bloqueados</AlertTitle>
                    <AlertDescription className="text-xs">
                      Esta venda já está em análise pelo financeiro. 
                      O valor, número de parcelas e datas de vencimento não podem ser modificados.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-1">
                  {installments.map((inst) => (
                    <div key={inst.id} className="flex justify-between items-center text-sm p-1 border-b border-border/30">
                      <span className="font-medium">Parcela {inst.installmentNumber}</span>
                      <span>R$ {parseFloat(inst.amount).toFixed(2).replace('.', ',')}</span>
                      <Badge variant="outline" className={dadosFinanceirosLocked ? "border-amber-500 text-amber-800" : ""}>
                        {format(new Date(inst.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                        {dadosFinanceirosLocked && <Lock className="h-3 w-3 ml-1" />}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || reenviarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleReenviar}
            disabled={isLoading || reenviarMutation.isPending}
          >
            {reenviarMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              <>
                <SendHorizontal className="mr-2 h-4 w-4" />
                Reenviar Venda
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}