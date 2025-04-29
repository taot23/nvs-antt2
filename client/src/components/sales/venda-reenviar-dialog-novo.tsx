import React, { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2, AlertTriangle, CheckCircle, SendHorizontal } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Usar um tipo mais flexível para evitar problemas de compatibilidade
type Sale = {
  id: number;
  status: string;
  returnReason?: string | null;
  [key: string]: any;
};
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
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  // Buscar detalhes específicos da venda (itens e parcelas)
  const { data: vendaDetalhes, isLoading: vendaLoading } = useQuery({
    queryKey: [`/api/sales/${sale?.id}`, isOpen],
    queryFn: async () => {
      if (!sale || !isOpen) return null;
      const response = await fetch(`/api/sales/${sale.id}`);
      return await response.json();
    },
    enabled: !!sale && isOpen,
  });

  // Buscar itens da venda
  const { data: itens = [], isLoading: itensLoading, isError: itensError } = useQuery({
    queryKey: [`/api/sales/${sale?.id}/items`, isOpen],
    queryFn: async () => {
      if (!sale || !isOpen) return [];
      setIsLoading(true);
      console.log(`🔍 Buscando itens para venda #${sale.id}`);
      const response = await fetch(`/api/sales/${sale.id}/items`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar itens: ${response.status}`);
      }
      
      const items = await response.json();
      console.log(`✅ Encontrados ${items.length} itens para venda #${sale.id}`, items);
      return items;
    },
    enabled: !!sale && isOpen,
  });

  // Buscar parcelas da venda
  const { data: parcelas = [], isLoading: parcelasLoading, isError: parcelasError } = useQuery({
    queryKey: [`/api/sales/${sale?.id}/installments`, isOpen],
    queryFn: async () => {
      if (!sale || !isOpen) return [];
      console.log(`🔍 Buscando parcelas para venda #${sale.id}`);
      const response = await fetch(`/api/sales/${sale.id}/installments`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar parcelas: ${response.status}`);
      }
      
      const installments = await response.json();
      console.log(`✅ Encontradas ${installments.length} parcelas para venda #${sale.id}`, installments);
      return installments;
    },
    enabled: !!sale && isOpen,
  });

  // Controlar estado de carregamento
  useEffect(() => {
    setIsLoading(itensLoading || parcelasLoading || vendaLoading);
  }, [itensLoading, parcelasLoading, vendaLoading]);

  // Limpar observações quando o diálogo é aberto com uma nova venda
  useEffect(() => {
    if (isOpen && sale) {
      setNotes("");
    }
  }, [isOpen, sale?.id]);

  // Formatação de data que evita problemas de fuso horário
  const formatLocalDate = (dateString: string) => {
    if (!dateString) return "N/A";
    // Garante que a data seja tratada como UTC para evitar mudanças de fuso
    const [year, month, day] = dateString.split("-");
    return format(new Date(Number(year), Number(month)-1, Number(day)), 'dd/MM/yyyy', { locale: ptBR });
  };

  // Mutation para reenviar venda
  const resendMutation = useMutation({
    mutationFn: async () => {
      console.log("Reenviando venda com observações:", notes);
      const response = await apiRequest("POST", `/api/sales/${sale.id}/resend`, {
        notes: notes
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao reenviar venda");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Venda reenviada com sucesso",
        description: "A venda foi reenviada para o operacional.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      // Também invalidar consulta específica para vendedores
      const user = window.currentUser;
      if (user && user.role === 'vendedor') {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/sales', user.id]
        });
      }
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reenviar venda",
        description: error.message || "Ocorreu um erro ao reenviar a venda.",
        variant: "destructive",
      });
    },
  });
  
  function handleReenviar() {
    if (!notes.trim()) {
      toast({
        title: "Observação obrigatória",
        description: "Por favor, informe as correções realizadas antes de reenviar.",
        variant: "destructive",
      });
      return;
    }
    
    // Verificação adicional de dados
    if (itens.length === 0) {
      toast({
        title: "Erro nos dados da venda",
        description: "Esta venda não possui itens. Não é possível reenviá-la.",
        variant: "destructive",
      });
      return;
    }
    
    resendMutation.mutate();
  };

  function getStatusLabel(status: string) {
    switch (status) {
      case "pending":
        return "Pendente";
      case "in_progress":
        return "Em Andamento";
      case "completed":
        return "Concluída";
      case "returned":
        return "Devolvida";
      case "corrected":
        return "Corrigida";
      default:
        return status;
    }
  }

  function getStatusVariant(status: string) {
    switch (status) {
      case "pending":
        return "outline";
      case "in_progress":
        return "default";
      case "completed":
        return "success";
      case "returned":
        return "destructive";
      case "corrected":
        return "warning";
      default:
        return "secondary";
    }
  }

  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Reenviar Venda</DialogTitle>
          <DialogDescription>
            Esta venda foi devolvida pelo operacional. Faça as correções necessárias antes de reenviar.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando dados da venda...</span>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número OS</Label>
                  <div className="font-medium">{sale.orderNumber}</div>
                </div>
                <div>
                  <Label>Data</Label>
                  <div className="font-medium">
                    {sale.date ? formatLocalDate(sale.date) : 'N/A'}
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
                <Alert variant="destructive" className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Motivo da Devolução</AlertTitle>
                  <AlertDescription>
                    {sale.returnReason}
                  </AlertDescription>
                </Alert>
              )}

              <Separator className="my-4" />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Itens da Venda</h3>
                {itensError ? (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar itens</AlertTitle>
                    <AlertDescription>
                      Não foi possível carregar os itens desta venda. Tente novamente mais tarde.
                    </AlertDescription>
                  </Alert>
                ) : itens.length === 0 ? (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Nenhum item encontrado</AlertTitle>
                    <AlertDescription>
                      Esta venda não possui itens registrados. Edite a venda para adicionar itens.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">Qtd</TableHead>
                        <TableHead className="text-right">Preço</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {itens.map((item: SaleItem) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.serviceName}</TableCell>
                          <TableCell>{item.serviceTypeName || 'N/A'}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">
                            R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {parseFloat(item.totalPrice).toFixed(2).replace('.', ',')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <Separator className="my-4" />
              
              <div>
                <h3 className="text-lg font-medium mb-2">Parcelas</h3>
                {parcelasError ? (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Erro ao carregar parcelas</AlertTitle>
                    <AlertDescription>
                      Não foi possível carregar as parcelas desta venda. Tente novamente mais tarde.
                    </AlertDescription>
                  </Alert>
                ) : parcelas.length === 0 ? (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Nenhuma parcela encontrada</AlertTitle>
                    <AlertDescription>
                      Esta venda não possui parcelas registradas. Edite a venda para configurar as parcelas.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parcelas.map((parcela: Installment) => (
                        <TableRow key={parcela.id}>
                          <TableCell>{parcela.installmentNumber}</TableCell>
                          <TableCell>{formatLocalDate(parcela.dueDate)}</TableCell>
                          <TableCell className="text-right">
                            R$ {parseFloat(parcela.amount).toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={parcela.status === 'paid' ? 'default' : 'outline'} className={parcela.status === 'paid' ? 'bg-green-500' : ''}>
                              {parcela.status === 'paid' ? 'Paga' : 'Pendente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="notes" className="text-base">Observação das Correções Realizadas *</Label>
                <Textarea 
                  id="notes" 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)}
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
                onClick={onClose}
                disabled={resendMutation.isPending}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleReenviar}
                disabled={resendMutation.isPending || isLoading}
                className="gap-2"
              >
                {resendMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Reenviando...
                  </>
                ) : (
                  <>
                    <SendHorizontal className="h-4 w-4" />
                    Reenviar Venda
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}