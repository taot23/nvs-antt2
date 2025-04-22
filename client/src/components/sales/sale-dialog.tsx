import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

// Esquema de validação para itens da venda
const saleItemSchema = z.object({
  serviceId: z.coerce.number().min(1, "Serviço é obrigatório"),
  serviceTypeId: z.coerce.number().min(1, "Tipo de serviço é obrigatório"),
  quantity: z.coerce.number().min(1, "Quantidade mínima é 1"),
  price: z.string().min(1, "Preço é obrigatório"),
  notes: z.string().optional().nullable(),
});

// Esquema de validação para a venda
const saleSchema = z.object({
  orderNumber: z.string().min(1, "Número de ordem é obrigatório"),
  date: z.date({
    required_error: "Data da venda é obrigatória",
  }),
  customerId: z.coerce.number().min(1, "Cliente é obrigatório"),
  paymentMethodId: z.coerce.number().min(1, "Forma de pagamento é obrigatória"),
  sellerId: z.coerce.number().min(1, "Vendedor é obrigatório"),
  notes: z.string().optional().nullable(),
  items: z.array(saleItemSchema).min(1, "Pelo menos um item é obrigatório"),
});

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

interface SaleDialogProps {
  open: boolean;
  onClose: () => void;
  sale: Sale | null;
  onSaveSuccess: () => void;
}

export default function SaleDialog({ open, onClose, sale, onSaveSuccess }: SaleDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Consultas para obter dados relacionados
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
  
  // Consulta para obter os itens da venda ao editar
  const { data: saleItems = [] } = useQuery({
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
  
  // Formulário
  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: {
      orderNumber: "",
      date: new Date(),
      customerId: 0,
      paymentMethodId: 0,
      sellerId: user?.id || 0,
      notes: "",
      items: [
        {
          serviceId: 0,
          serviceTypeId: 0,
          quantity: 1,
          price: "",
          notes: ""
        }
      ]
    }
  });
  
  // Field array para os itens da venda
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });
  
  // Atualiza o formulário quando carrega os dados do sale ou quando novos dados são carregados
  useEffect(() => {
    if (sale) {
      form.reset({
        orderNumber: sale.orderNumber,
        date: new Date(sale.date),
        customerId: sale.customerId,
        paymentMethodId: sale.paymentMethodId,
        sellerId: sale.sellerId,
        notes: sale.notes,
        items: saleItems.map((item: SaleItem) => ({
          serviceId: item.serviceId,
          serviceTypeId: item.serviceTypeId,
          quantity: item.quantity,
          price: item.price,
          notes: item.notes
        }))
      });
    } else {
      // Para novas vendas, gera um número de OS
      const today = new Date();
      const yearMonth = format(today, 'yyyyMM');
      const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const orderNumber = `OS${yearMonth}${randomPart}`;
      
      form.reset({
        orderNumber,
        date: today,
        customerId: 0,
        paymentMethodId: 0,
        sellerId: user?.id || 0,
        notes: "",
        items: [
          {
            serviceId: 0,
            serviceTypeId: 0,
            quantity: 1,
            price: "",
            notes: ""
          }
        ]
      });
    }
  }, [sale, saleItems, form, user?.id]);
  
  // Atualiza o preço do item quando seleciona um serviço
  const handleServiceChange = (index: number, serviceId: number) => {
    const service = services.find((s: any) => s.id === serviceId);
    if (service) {
      form.setValue(`items.${index}.price`, service.price);
    }
  };
  
  // Adiciona um novo item
  const addItem = () => {
    append({
      serviceId: 0,
      serviceTypeId: 0,
      quantity: 1,
      price: "",
      notes: ""
    });
  };
  
  // Mutation para salvar a venda
  const saveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof saleSchema>) => {
      setIsSubmitting(true);
      
      const formattedData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
      };
      
      const url = sale ? `/api/sales/${sale.id}` : "/api/sales";
      const method = sale ? "PATCH" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formattedData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao salvar venda");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      toast({
        title: sale ? "Venda atualizada" : "Venda criada",
        description: sale ? "Venda atualizada com sucesso" : "Venda criada com sucesso",
      });
      setIsSubmitting(false);
      onSaveSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao salvar venda",
        description: error.message,
        variant: "destructive",
      });
      setIsSubmitting(false);
    },
  });
  
  // Submit do formulário
  const onSubmit = (values: z.infer<typeof saleSchema>) => {
    saveMutation.mutate(values);
  };
  
  // Filtra vendedores para mostrar apenas usuários com papel de vendedor
  const sellers = users.filter((user: any) => 
    ['admin', 'seller', 'supervisor'].includes(user.role)
  );
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sale ? "Editar Venda" : "Nova Venda"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Número de OS */}
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da OS</FormLabel>
                    <FormControl>
                      <Input placeholder="OS202400001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Data */}
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
                            variant="outline"
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
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Cliente */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Vendedor */}
              <FormField
                control={form.control}
                name="sellerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendedor</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                      disabled={user?.role !== 'admin' && user?.role !== 'supervisor' && user?.role !== 'financeiro' && user?.role !== 'operacional'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um vendedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sellers.map((seller: any) => (
                          <SelectItem key={seller.id} value={seller.id.toString()}>
                            {seller.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Forma de Pagamento */}
              <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((paymentMethod: any) => (
                          <SelectItem key={paymentMethod.id} value={paymentMethod.id.toString()}>
                            {paymentMethod.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Observações */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Observações gerais sobre a venda" 
                      className="resize-none min-h-[60px]" 
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Itens da venda */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Itens da Venda</Label>
                <Button type="button" variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Item
                </Button>
              </div>
              
              {fields.map((field, index) => (
                <div key={field.id} className="space-y-4 p-4 border rounded-md relative">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => fields.length > 1 && remove(index)}
                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground"
                    disabled={fields.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Serviço */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.serviceId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serviço</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              const serviceId = parseInt(value);
                              field.onChange(serviceId);
                              handleServiceChange(index, serviceId);
                            }}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um serviço" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {services.map((service: any) => (
                                <SelectItem key={service.id} value={service.id.toString()}>
                                  {service.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Tipo de Serviço */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.serviceTypeId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Serviço</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            value={field.value.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {serviceTypes.map((type: any) => (
                                <SelectItem key={type.id} value={type.id.toString()}>
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Quantidade */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantidade</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="1" 
                              step="1" 
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Preço */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.price`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preço (R$)</FormLabel>
                          <FormControl>
                            <Input placeholder="0,00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Observações do Item */}
                    <FormField
                      control={form.control}
                      name={`items.${index}.notes`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações do Item</FormLabel>
                          <FormControl>
                            <Input placeholder="Detalhes específicos deste item" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {sale ? "Atualizar" : "Criar"} Venda
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}