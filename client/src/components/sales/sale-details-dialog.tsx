import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { File, User, CreditCard, Clock, Calendar, Package, Tag } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";

// Função para obter a descrição do status
function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'in_progress': return 'Em Andamento';
    case 'returned': return 'Devolvida';
    case 'completed': return 'Concluída';
    case 'canceled': return 'Cancelada';
    default: return status;
  }
}

// Função para obter a cor do status
function getStatusVariant(status: string) {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'secondary';
    case 'returned': return 'destructive';
    case 'completed': return 'success';
    case 'canceled': return 'outline';
    default: return 'default';
  }
}

interface SaleDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  saleId?: number | null;
}

export default function SaleDetailsDialog({ open, onClose, saleId }: SaleDetailsDialogProps) {
  const [activeTab, setActiveTab] = useState("details");
  
  // Consulta da venda
  const { data: sale, isLoading: isLoadingSale } = useQuery({
    queryKey: ["/api/sales", saleId],
    queryFn: async () => {
      if (!saleId) return null;
      const response = await fetch(`/api/sales/${saleId}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar detalhes da venda");
      }
      return response.json();
    },
    enabled: !!saleId
  });
  
  // Consulta dos itens da venda
  const { data: items = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ["/api/sales", saleId, "items"],
    queryFn: async () => {
      if (!saleId) return [];
      const response = await fetch(`/api/sales/${saleId}/items`);
      if (!response.ok) {
        throw new Error("Erro ao carregar itens da venda");
      }
      return response.json();
    },
    enabled: !!saleId
  });
  
  // Consulta do histórico de status
  const { data: history = [], isLoading: isLoadingHistory } = useQuery({
    queryKey: ["/api/sales", saleId, "history"],
    queryFn: async () => {
      if (!saleId) return [];
      const response = await fetch(`/api/sales/${saleId}/history`);
      if (!response.ok) {
        throw new Error("Erro ao carregar histórico da venda");
      }
      return response.json();
    },
    enabled: !!saleId
  });
  
  // Consultas auxiliares para dados relacionados
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) {
        throw new Error("Erro ao carregar clientes");
      }
      return response.json();
    }
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) {
        throw new Error("Erro ao carregar usuários");
      }
      return response.json();
    }
  });

  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const response = await fetch("/api/services");
      if (!response.ok) {
        throw new Error("Erro ao carregar serviços");
      }
      return response.json();
    }
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["/api/service-types"],
    queryFn: async () => {
      const response = await fetch("/api/service-types");
      if (!response.ok) {
        throw new Error("Erro ao carregar tipos de serviço");
      }
      return response.json();
    }
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["/api/payment-methods"],
    queryFn: async () => {
      const response = await fetch("/api/payment-methods");
      if (!response.ok) {
        throw new Error("Erro ao carregar formas de pagamento");
      }
      return response.json();
    }
  });
  
  // Dados enriquecidos
  const customer = sale ? customers.find((c: any) => c.id === sale.customerId) : null;
  const seller = sale ? users.find((u: any) => u.id === sale.sellerId) : null;
  const paymentMethod = sale ? paymentMethods.find((p: any) => p.id === sale.paymentMethodId) : null;
  const operationalUser = sale?.responsibleOperationalId 
    ? users.find((u: any) => u.id === sale.responsibleOperationalId) 
    : null;
  const financialUser = sale?.responsibleFinancialId 
    ? users.find((u: any) => u.id === sale.responsibleFinancialId) 
    : null;
  
  // Resetar a aba ativa ao abrir o diálogo
  useEffect(() => {
    if (open) {
      setActiveTab("details");
    }
  }, [open]);
  
  if (isLoadingSale) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center">Carregando detalhes da venda...</div>
        </DialogContent>
      </Dialog>
    );
  }
  
  if (!sale) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle>Detalhes da Venda</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-destructive">Venda não encontrada</div>
        </DialogContent>
      </Dialog>
    );
  }
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            <span>OS: {sale.orderNumber}</span>
            <Badge variant={getStatusVariant(sale.status) as any} className="ml-2">
              {getStatusLabel(sale.status)}
            </Badge>
            {sale.financialStatus === 'paid' && (
              <Badge variant="outline" className="text-green-600 border-green-600">
                Pago
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="details">Detalhes</TabsTrigger>
            <TabsTrigger value="items">Itens</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>
          
          <ScrollArea className="flex-1 h-[calc(85vh-180px)] mt-4">
            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Informações do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <div>
                      <div className="text-sm font-medium">Nome</div>
                      <div>{customer?.name || `Cliente #${sale.customerId}`}</div>
                    </div>
                    
                    {customer && (
                      <>
                        <div>
                          <div className="text-sm font-medium">Documento</div>
                          <div>{customer.document} ({customer.documentType === 'cpf' ? 'CPF' : 'CNPJ'})</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">Contato</div>
                          <div>{customer.email}</div>
                          <div>{customer.phone}{customer.phone2 ? `, ${customer.phone2}` : ''}</div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Informações de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <div>
                      <div className="text-sm font-medium">Forma de Pagamento</div>
                      <div>{paymentMethod?.name || `Forma #${sale.paymentMethodId}`}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Valor Total</div>
                      <div className="text-lg font-bold">
                        R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Status Financeiro</div>
                      <div>
                        {sale.financialStatus === 'paid' 
                          ? 'Pago' 
                          : sale.financialStatus === 'partial' 
                            ? 'Parcialmente Pago' 
                            : 'Pendente'
                        }
                      </div>
                    </div>
                    
                    {financialUser && (
                      <div>
                        <div className="text-sm font-medium">Confirmado por</div>
                        <div>{financialUser.username}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Datas e Responsáveis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <div>
                      <div className="text-sm font-medium">Data da Venda</div>
                      <div>{format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Vendedor</div>
                      <div>{seller?.username || `Vendedor #${sale.sellerId}`}</div>
                    </div>
                    
                    {operationalUser && (
                      <div>
                        <div className="text-sm font-medium">Responsável Operacional</div>
                        <div>{operationalUser.username}</div>
                      </div>
                    )}
                    
                    <div>
                      <div className="text-sm font-medium">Criado em</div>
                      <div>{format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Última atualização</div>
                      <div>{format(new Date(sale.updatedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Status e Detalhes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-2">
                    <div>
                      <div className="text-sm font-medium">Status da Venda</div>
                      <div>
                        <Badge variant={getStatusVariant(sale.status) as any}>
                          {getStatusLabel(sale.status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Status de Execução</div>
                      <div>
                        {sale.executionStatus === 'waiting' 
                          ? 'Aguardando' 
                          : sale.executionStatus === 'in_progress' 
                            ? 'Em Andamento' 
                            : 'Concluído'
                        }
                      </div>
                    </div>
                    
                    {sale.returnReason && (
                      <div>
                        <div className="text-sm font-medium text-destructive">Motivo da Devolução</div>
                        <div className="text-destructive">{sale.returnReason}</div>
                      </div>
                    )}
                    
                    {sale.notes && (
                      <div>
                        <div className="text-sm font-medium">Observações</div>
                        <div>{sale.notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="items" className="space-y-4">
              {isLoadingItems ? (
                <div className="py-4 text-center">Carregando itens...</div>
              ) : items.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">Nenhum item encontrado</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Qtd</TableHead>
                      <TableHead>Preço Unit.</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any) => {
                      const service = services.find((s: any) => s.id === item.serviceId);
                      const serviceType = serviceTypes.find((st: any) => st.id === item.serviceTypeId);
                      const totalPrice = parseFloat(item.totalPrice);
                      
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="font-medium">
                              {service ? service.name : `Serviço #${item.serviceId}`}
                            </div>
                            {item.notes && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.notes}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {serviceType ? serviceType.name : `Tipo #${item.serviceTypeId}`}
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            R$ {parseFloat(item.price).toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="font-medium">
                            R$ {totalPrice.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(item.status) as any}>
                              {getStatusLabel(item.status)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow>
                      <TableCell colSpan={4} className="text-right font-bold">
                        Total da Venda:
                      </TableCell>
                      <TableCell colSpan={2} className="font-bold text-lg">
                        R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </TabsContent>
            
            <TabsContent value="history" className="space-y-4">
              {isLoadingHistory ? (
                <div className="py-4 text-center">Carregando histórico...</div>
              ) : history.length === 0 ? (
                <div className="py-4 text-center text-muted-foreground">Nenhum registro de histórico encontrado</div>
              ) : (
                <div className="space-y-4">
                  {history.map((record: any, index: number) => {
                    const user = users.find((u: any) => u.id === record.userId);
                    return (
                      <Card key={record.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="font-medium flex items-center">
                                <div className="flex items-center gap-2">
                                  <Badge variant={getStatusVariant(record.toStatus) as any}>
                                    {getStatusLabel(record.toStatus)}
                                  </Badge>
                                  {record.fromStatus && (
                                    <div className="text-sm flex items-center gap-1">
                                      <span>de</span>
                                      <Badge variant={getStatusVariant(record.fromStatus) as any}>
                                        {getStatusLabel(record.fromStatus)}
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                {format(new Date(record.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                              </div>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">por </span>
                              <span className="font-medium">
                                {user ? user.username : `Usuário #${record.userId}`}
                              </span>
                            </div>
                          </div>
                          {record.notes && (
                            <div className="mt-2 pt-2 border-t text-sm">
                              {record.notes}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}