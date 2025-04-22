import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

// Tipos
type Sale = {
  id: number;
  orderNumber: string;
  date: string;
  customerId: number;
  paymentMethodId: number;
  sellerId: number;
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
};

type SaleItem = {
  id?: number;
  serviceId: number;
  serviceTypeId: number;
  quantity: number;
  price: string;
  notes?: string | null;
};

// Schema de validação
const saleFormSchema = z.object({
  orderNumber: z.string().min(1, { message: "O número da ordem de serviço é obrigatório" }),
  date: z.date({ required_error: "A data é obrigatória" }),
  customerId: z.string().min(1, { message: "O cliente é obrigatório" }),
  paymentMethodId: z.string().min(1, { message: "A forma de pagamento é obrigatória" }),
  sellerId: z.string().min(1, { message: "O vendedor é obrigatório" }),
  notes: z.string().nullable().optional(),
});

// Componente para o formulário de venda
interface SaleDialogProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSaveSuccess: () => void;
}

export default function SaleDialog({ open, onClose, sale, onSaveSuccess }: SaleDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<SaleItem[]>([]);
  const [newItem, setNewItem] = useState<Partial<SaleItem>>({
    serviceId: 0,
    serviceTypeId: 0,
    quantity: 1,
    price: "",
    notes: ""
  });
  
  // Form
  const form = useForm<z.infer<typeof saleFormSchema>>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      orderNumber: "",
      date: new Date(),
      customerId: "",
      paymentMethodId: "",
      sellerId: user ? user.id.toString() : "",
      notes: "",
    },
  });
  
  // Carregamento de dados
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
  
  // Carregar itens da venda ao editar
  const { data: saleItems = [], isLoading: isLoadingItems } = useQuery({
    queryKey: ["/api/sales", sale?.id, "items"],
    queryFn: async () => {
      if (!sale?.id) return [];
      const response = await fetch(`/api/sales/${sale.id}/items`);
      if (!response.ok) {
        throw new Error("Erro ao carregar itens da venda");
      }
      return response.json();
    },
    enabled: !!sale?.id
  });
  
  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/sales", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Venda criada",
        description: "Venda criada com sucesso",
      });
      onSaveSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; sale: any }) => {
      const response = await apiRequest("PUT", `/api/sales/${data.id}`, data.sale);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Venda atualizada",
        description: "Venda atualizada com sucesso",
      });
      onSaveSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar venda",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Efeito para carregar dados na edição
  useEffect(() => {
    if (sale) {
      form.reset({
        orderNumber: sale.orderNumber,
        date: new Date(sale.date),
        customerId: sale.customerId.toString(),
        paymentMethodId: sale.paymentMethodId.toString(),
        sellerId: sale.sellerId.toString(),
        notes: sale.notes || "",
      });
    } else {
      form.reset({
        orderNumber: "",
        date: new Date(),
        customerId: "",
        paymentMethodId: "",
        sellerId: user ? user.id.toString() : "",
        notes: "",
      });
      setItems([]);
    }
  }, [sale, form, user]);
  
  // Efeito para carregar itens na edição
  useEffect(() => {
    if (saleItems && saleItems.length > 0) {
      setItems(saleItems);
    }
  }, [saleItems]);
  
  // Handlers para itens
  const handleAddItem = () => {
    if (!newItem.serviceId || !newItem.serviceTypeId || !newItem.price) {
      toast({
        title: "Dados incompletos",
        description: "Preencha todos os campos obrigatórios do item",
        variant: "destructive",
      });
      return;
    }
    
    // Encontrar o serviço para obter o preço se não foi informado
    if (!newItem.price) {
      const service = services.find((s: any) => s.id === newItem.serviceId);
      if (service) {
        newItem.price = service.price.toString();
      }
    }
    
    // Calcular o preço total
    const totalPrice = (parseFloat(newItem.price || "0") * (newItem.quantity || 1)).toFixed(2);
    
    // Adicionar o item à lista
    setItems([...items, {
      serviceId: newItem.serviceId!,
      serviceTypeId: newItem.serviceTypeId!,
      quantity: newItem.quantity || 1,
      price: newItem.price || "0",
      notes: newItem.notes || null
    }]);
    
    // Limpar o formulário de novo item
    setNewItem({
      serviceId: 0,
      serviceTypeId: 0,
      quantity: 1,
      price: "",
      notes: ""
    });
  };
  
  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  
  const handleServiceChange = (value: string) => {
    const serviceId = parseInt(value);
    const service = services.find((s: any) => s.id === serviceId);
    
    setNewItem({
      ...newItem,
      serviceId,
      price: service ? service.price.toString() : ""
    });
  };
  
  // Submit do formulário
  const onSubmit = (values: z.infer<typeof saleFormSchema>) => {
    if (items.length === 0) {
      toast({
        title: "Nenhum item adicionado",
        description: "Adicione pelo menos um item à venda",
        variant: "destructive",
      });
      return;
    }
    
    const saleData = {
      orderNumber: values.orderNumber,
      date: values.date.toISOString(),
      customerId: parseInt(values.customerId),
      paymentMethodId: parseInt(values.paymentMethodId),
      sellerId: parseInt(values.sellerId),
      status: "pending",
      notes: values.notes,
      items: items.map(item => ({
        serviceId: item.serviceId,
        serviceTypeId: item.serviceTypeId,
        quantity: item.quantity,
        price: item.price,
        notes: item.notes
      }))
    };
    
    if (sale) {
      updateMutation.mutate({ id: sale.id, sale: saleData });
    } else {
      createMutation.mutate(saleData);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {sale ? "Editar Venda" : "Nova Venda"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número da OS</FormLabel>
                      <FormControl>
                        <Input placeholder="Número da ordem de serviço" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd/MM/yyyy")
                              ) : (
                                <span>Selecione uma data</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date > new Date() || date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cliente</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer: any) => (
                            <SelectItem key={customer.id} value={customer.id.toString()}>
                              {customer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentMethodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Forma de Pagamento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma forma de pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods.map((method: any) => (
                            <SelectItem key={method.id} value={method.id.toString()}>
                              {method.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                        disabled={user?.role !== "admin" && user?.role !== "supervisor" && user?.role !== "operacional" && user?.role !== "financeiro"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um vendedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users
                            .filter((u: any) => u.role === "vendedor" || u.role === "admin")
                            .map((user: any) => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.username}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel>Observações</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Observações sobre a venda"
                          className="resize-none min-h-[80px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Itens da Venda</h3>
                
                {/* Lista de itens adicionados */}
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      Nenhum item adicionado
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {items.map((item, index) => {
                        const service = services.find((s: any) => s.id === item.serviceId);
                        const serviceType = serviceTypes.find((st: any) => st.id === item.serviceTypeId);
                        const totalPrice = parseFloat(item.price) * item.quantity;
                        
                        return (
                          <Card key={index} className="overflow-hidden">
                            <CardContent className="p-4 flex items-center justify-between">
                              <div className="space-y-1">
                                <div className="font-medium">
                                  {service ? service.name : `Serviço #${item.serviceId}`}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Tipo: {serviceType ? serviceType.name : `Tipo #${item.serviceTypeId}`} |
                                  Qtd: {item.quantity} x R$ {parseFloat(item.price).toFixed(2).replace('.', ',')} = 
                                  R$ {totalPrice.toFixed(2).replace('.', ',')}
                                </div>
                                {item.notes && (
                                  <div className="text-xs text-muted-foreground">
                                    Obs: {item.notes}
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(index)}
                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Formulário para adicionar novo item */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <h4 className="text-sm font-medium">Adicionar Item</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <FormLabel>Serviço</FormLabel>
                        <Select
                          onValueChange={handleServiceChange}
                          value={newItem.serviceId ? newItem.serviceId.toString() : ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um serviço" />
                          </SelectTrigger>
                          <SelectContent>
                            {services.map((service: any) => (
                              <SelectItem key={service.id} value={service.id.toString()}>
                                {service.name} - R$ {parseFloat(service.price).toFixed(2).replace('.', ',')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Tipo de Serviço</FormLabel>
                        <Select
                          onValueChange={(value) => setNewItem({...newItem, serviceTypeId: parseInt(value)})}
                          value={newItem.serviceTypeId ? newItem.serviceTypeId.toString() : ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypes.map((type: any) => (
                              <SelectItem key={type.id} value={type.id.toString()}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Quantidade</FormLabel>
                        <Input
                          type="number"
                          min="1"
                          value={newItem.quantity || ""}
                          onChange={(e) => setNewItem({...newItem, quantity: parseInt(e.target.value) || 1})}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Preço Unitário</FormLabel>
                        <Input
                          type="text"
                          value={newItem.price}
                          onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                          placeholder="0,00"
                        />
                      </div>
                      
                      <div className="col-span-2 space-y-2">
                        <FormLabel>Observações do Item</FormLabel>
                        <Textarea
                          placeholder="Observações específicas para este item"
                          value={newItem.notes || ""}
                          onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                          className="resize-none"
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Item
                    </Button>
                  </CardContent>
                </Card>
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {sale ? "Atualizar" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}