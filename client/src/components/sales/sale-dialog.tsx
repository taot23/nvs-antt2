import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  const formInitialized = useRef(false);
  
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
  
  // Valores padrão iniciais do formulário
  const defaultFormValues = {
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
  };
  
  // Formulário
  const form = useForm<z.infer<typeof saleSchema>>({
    resolver: zodResolver(saleSchema),
    defaultValues: defaultFormValues
  });
  
  // Field array para os itens da venda
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
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
  
  // Efeito para atualizar o formulário quando os itens são carregados
  useEffect(() => {
    if (sale && saleItems.length > 0 && !formInitialized.current) {
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
      formInitialized.current = true;
    }
  }, [sale, saleItems, form]);
  
  // Atualizamos o formulário quando o modal é aberto/fechado
  useEffect(() => {
    if (open) {
      if (sale) {
        // Aguarda os itens serem carregados via query
        formInitialized.current = false;
      } else {
        // Nova venda
        form.reset(defaultFormValues);
        formInitialized.current = true;
      }
    } else {
      // Quando o modal é fechado
      formInitialized.current = false;
    }
  }, [open, sale?.id, form]);
  
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
  
  // Função para buscar nome do serviço
  const getServiceName = (serviceId: number) => {
    const service = services.find((s: any) => s.id === serviceId);
    return service ? service.name : "";
  };
  
  // Função para buscar nome do tipo de serviço
  const getServiceTypeName = (typeId: number) => {
    const type = serviceTypes.find((t: any) => t.id === typeId);
    return type ? type.name : "";
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold">
            {sale ? "Editar Venda" : "Nova Venda"}
          </DialogTitle>
          <DialogDescription>
            {sale 
              ? "Atualize os dados da venda conforme necessário" 
              : "Preencha os dados para criar uma nova venda"}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Seção de cabeçalho da venda */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Informações Gerais</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Número de OS */}
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Número da OS</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} className="bg-background" />
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
                      <FormLabel className="font-medium">Data</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-background",
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
                      <FormLabel className="font-medium">Cliente</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : "0"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {/* Vendedor */}
                <FormField
                  control={form.control}
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Vendedor</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : "0"}
                        disabled={user?.role !== 'admin' && user?.role !== 'supervisor' && user?.role !== 'financeiro' && user?.role !== 'operacional'}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
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
                      <FormLabel className="font-medium">Forma de Pagamento</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value ? field.value.toString() : "0"}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-background">
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
              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="font-medium">Observações</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Observações gerais sobre a venda" 
                          className="resize-none bg-background min-h-[80px]" 
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Seção de itens da venda */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Itens da Venda</h3>
                <Button 
                  type="button" 
                  variant="default" 
                  size="sm" 
                  onClick={addItem}
                  className="transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Item
                </Button>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Item</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead className="w-[100px]">Qtd</TableHead>
                      <TableHead className="w-[120px]">Preço</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.serviceId`}
                            render={({ field }) => (
                              <FormItem>
                                <Select 
                                  onValueChange={(value) => {
                                    const serviceId = parseInt(value);
                                    field.onChange(serviceId);
                                    handleServiceChange(index, serviceId);
                                  }}
                                  value={field.value ? field.value.toString() : "0"}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione" />
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
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.serviceTypeId`}
                            render={({ field }) => (
                              <FormItem>
                                <Select 
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  value={field.value ? field.value.toString() : "0"}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione" />
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
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
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
                        </TableCell>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`items.${index}.price`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="0,00" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fields.length > 1 && remove(index)}
                            disabled={fields.length <= 1}
                            className="h-8 w-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Observações de itens - colapsado em um accordeon */}
              <div className="mt-4">
                <div className="text-sm font-medium mb-2">Observações de Itens</div>
                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div key={`${field.id}-notes`} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </div>
                      <FormField
                        control={form.control}
                        name={`items.${index}.notes`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input 
                                placeholder={`Observações para ${getServiceName(form.getValues(`items.${index}.serviceId`))}${getServiceTypeName(form.getValues(`items.${index}.serviceTypeId`)) ? ' - ' + getServiceTypeName(form.getValues(`items.${index}.serviceTypeId`)) : ''}`}
                                {...field} 
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <DialogFooter className="gap-2">
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