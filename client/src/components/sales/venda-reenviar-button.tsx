import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { SendHorizontal, Loader2, Calendar, AlertTriangle } from 'lucide-react';
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
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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

interface VendaReenviarButtonProps {
  sale: Sale;
  iconOnly?: boolean;
}

export default function VendaReenviarButton({ sale, iconOnly = false }: VendaReenviarButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [items, setItems] = useState<SaleItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Referencias para rastrear os valores originais
  const originalItemsRef = useRef<SaleItem[]>([]);
  const originalInstallmentsRef = useRef<Installment[]>([]);
  
  // Verifica se o financeiro já começou a tratar a venda - VERIFICAÇÃO CORRIGIDA
  const financeiroJaIniciouAnalise = 
    sale.financialStatus === 'in_progress' || 
    sale.financialStatus === 'approved' || 
    sale.financialStatus === 'partial_payment' || 
    sale.financialStatus === 'completed' || 
    sale.financialStatus === 'in_analysis' || 
    sale.financialStatus === 'paid';

  // Carregar as parcelas ao abrir o diálogo
  useEffect(() => {
    if (dialogOpen && sale?.id) {
      console.log('🔍 Carregando parcelas da venda', sale.id);
      fetch(`/api/sales/${sale.id}/installments`)
        .then(response => {
          if (!response.ok) throw new Error('Falha ao carregar parcelas');
          return response.json();
        })
        .then(data => {
          console.log('📅 Parcelas carregadas:', data);
          setInstallments(data);
        })
        .catch(error => {
          console.error('❌ Erro ao carregar parcelas:', error);
        });
    }
  }, [dialogOpen, sale?.id]);

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
      const installmentDates = installments.map((inst: Installment) => {
        // Detectar e processar o formato da data corretamente
        console.log(`📅 Parcela ${inst.installmentNumber}, data original do banco:`, inst.dueDate, typeof inst.dueDate);
        
        // Se for string, garantir o formato YYYY-MM-DD
        if (typeof inst.dueDate === 'string') {
          // Se tiver T00:00:00, remover
          let dueDate = inst.dueDate;
          if (dueDate.includes('T')) {
            dueDate = dueDate.split('T')[0];
          }
          
          // Verificar formato
          if (dueDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Já está no formato ISO (YYYY-MM-DD)
            console.log(`✅ Mantendo data ISO formato correto: ${dueDate}`);
            return dueDate;
          } else {
            // Tentar converter outros formatos para YYYY-MM-DD
            const parts = dueDate.split(/[-/]/);
            if (parts.length === 3) {
              // Se o primeiro componente tem 2 ou 4 dígitos, é provavelmente DD/MM/YYYY ou YYYY-MM-DD
              if (parts[0].length === 4) {
                // YYYY-MM-DD
                const formattedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
                console.log(`✅ Convertido formato YYYY-MM-DD: ${formattedDate}`);
                return formattedDate;
              } else {
                // DD/MM/YYYY
                const formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                console.log(`✅ Convertido formato DD/MM/YYYY: ${formattedDate}`);
                return formattedDate;
              }
            }
            console.log(`⚠️ Usando data original sem conversão: ${dueDate}`);
            return dueDate;
          }
        }
        
        // Se for objeto Date (raramente acontece aqui), converter para ISO
        if (inst.dueDate instanceof Date) {
          const year = inst.dueDate.getFullYear();
          const month = String(inst.dueDate.getMonth() + 1).padStart(2, '0');
          const day = String(inst.dueDate.getDate()).padStart(2, '0');
          const formattedDate = `${year}-${month}-${day}`;
          console.log(`✅ Convertido objeto Date para string ISO: ${formattedDate}`);
          return formattedDate;
        }
        
        // Fallback - retornar a data atual em ISO
        console.log(`⚠️ Usando data FALLBACK para parcela ${inst.installmentNumber}`);
        return new Date().toISOString().split('T')[0];
      });
      
      console.log("Itens atualizados para reenvio:", items);
      console.log("Datas de parcelas para reenvio:", installmentDates);
      
      // Para todos os casos, o cliente deve FORÇAR a preservação dos dados financeiros 
    // quando o financeiro já iniciou análise - isso é uma medida de segurança adicional
    const statusFinanceiro = sale.financialStatus;
    // Aqui estava o erro! A lista de status deve ser explícita, não uma verificação negativa
    const financeiroComecouAnalise = statusFinanceiro === 'in_progress' || 
                                   statusFinanceiro === 'approved' || 
                                   statusFinanceiro === 'partial_payment' || 
                                   statusFinanceiro === 'completed';
    
    // Obtém as datas de vencimento originais em caso de análise financeira
    let duesDatesFinais = installmentDates;
    
    // Se financeiro estiver analisando, forçar os valores originais da venda
    if (financeiroComecouAnalise) {
      console.log('🚨 IMPORTANTE: Financeiro já iniciou análise - BLOQUEANDO modificações de dados financeiros');
      
      // Buscar valores originais da venda do banco
      try {
        // Vamos fazer uma chamada extra para garantir os dados financeiros originais
        const response = await fetch(`/api/sales/${sale.id}`);
        if (response.ok) {
          const vendaOriginal = await response.json();
          
          // Buscar as parcelas originais para ter as datas de vencimento originais
          const respParcelas = await fetch(`/api/sales/${sale.id}/installments`);
          if (respParcelas.ok) {
            const parcelasOriginais = await respParcelas.json();
            
            // Usar as datas das parcelas originais
            if (parcelasOriginais && parcelasOriginais.length > 0) {
              duesDatesFinais = parcelasOriginais.map((p: any) => {
                let dueDate = p.dueDate;
                if (typeof dueDate === 'string' && dueDate.includes('T')) {
                  dueDate = dueDate.split('T')[0];
                }
                return dueDate;
              });
              console.log('📆 Usando datas de vencimento ORIGINAIS das parcelas:', duesDatesFinais);
            }
          }
        }
      } catch (err) {
        console.error('❌ Erro ao obter dados originais da venda:', err);
      }
    }
    
    // Prepara os dados para o reenvio
    const requestData: any = {
      correctionNotes: observacoes,
      items: items,
      serviceTypeId: sale.serviceTypeId,
      serviceProviderId: sale.serviceProviderId,
      paymentMethodId: sale.paymentMethodId
    };
    
    // Se financeiro estiver analisando, forçar preservação de dados
    if (financeiroComecouAnalise) {
      // Forçar a preservação dos dados financeiros
      requestData.totalAmount = sale.totalAmount;
      requestData.installments = sale.installments;
      requestData.preserveFinancialData = true; // Flag para o backend
      
      // Enviar datas de vencimento originais se disponíveis
      if (duesDatesFinais && duesDatesFinais.length > 0) {
        requestData.installmentDates = duesDatesFinais;
      }
      
      console.log('🔒 Preservando dados financeiros pois a venda já está em análise financeira');
      
      // Adicionar alerta visual para o usuário
      toast({
        title: "Alerta de Proteção Financeira",
        description: "Esta venda já está em análise pelo departamento financeiro. Os dados financeiros estão protegidos contra modificações.",
        variant: "warning",
        duration: 6000,
      });
    } else {
      // Se não estiver em análise, podemos permitir edição
      requestData.totalAmount = sale.totalAmount;
      requestData.installments = sale.installments;
      requestData.installmentDates = installmentDates;
    }
      
      // Envia a requisição com todos os dados necessários
      const response = await apiRequest('PUT', `/api/sales/${sale.id}/resend`, requestData);
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

  // Verificar status do financeiro
  const statusFinanceiro = sale.financialStatus;
  // Esta lógica está duplicada acima, então vamos reutilizar apenas a segunda parte
  const emAnaliseFinanceira = statusFinanceiro === 'in_analysis' || statusFinanceiro === 'approved' || statusFinanceiro === 'partial_payment' || statusFinanceiro === 'paid';
  
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

            {/* Exibir datas das parcelas */}
            {installments.length > 0 && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-md">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <Label className="text-base font-medium">Parcelas e Datas de Vencimento</Label>
                </div>
                
                {emAnaliseFinanceira && (
                  <Alert variant="warning" className="mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-xs font-semibold">Atenção - Venda em Análise Financeira</AlertTitle>
                    <AlertDescription className="text-xs">
                      Esta venda já está sendo analisada pelo financeiro. 
                      O valor, número de parcelas e datas de vencimento não poderão ser modificados.
                    </AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-1">
                  {installments.map((inst) => (
                    <div key={inst.id} className="flex justify-between items-center text-sm p-1 border-b border-border/30">
                      <span className="font-medium">Parcela {inst.installmentNumber}</span>
                      <span>R$ {parseFloat(inst.amount).toFixed(2).replace('.', ',')}</span>
                      <Badge variant="outline" className="ml-auto">
                        {format(new Date(inst.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                      </Badge>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  As datas das parcelas serão mantidas ao reenviar a venda.
                </p>
              </div>
            )}

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