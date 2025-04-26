import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, Trash2, Search, Check, User, UserPlus, CreditCard, AlignLeft, FileText, Calendar, DollarSign, Cog, Save } from "lucide-react";
import { format, addMonths, isValid } from "date-fns";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Schemas de validação
const saleItemSchema = z.object({
  serviceId: z.coerce.number().min(1, "Serviço é obrigatório"),
  quantity: z.coerce.number().min(1, "Quantidade mínima é 1"),
  notes: z.string().optional().nullable(),
});

const saleFormSchema = z.object({
  orderNumber: z.string().min(1, "Número de ordem é obrigatório"),
  date: z.date({
    required_error: "Data da venda é obrigatória",
  }),
  customerId: z.coerce.number().min(1, "Cliente é obrigatório"),
  paymentMethodId: z.coerce.number().min(1, "Forma de pagamento é obrigatória"),
  serviceTypeId: z.coerce.number().min(1, "Tipo de serviço é obrigatório"),
  sellerId: z.coerce.number().min(1, "Vendedor é obrigatório"),
  totalAmount: z.string().optional(),
  installments: z.coerce.number().min(1, "Número de parcelas deve ser pelo menos 1").default(1),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Adicione pelo menos um item à venda"),
});

// Interface das props do componente
interface SimpleSaleDialogProps {
  open: boolean;
  onClose: () => void;
  onSaveSuccess?: () => void;
}

export default function SimpleSaleDialog({ 
  open, 
  onClose, 
  onSaveSuccess 
}: SimpleSaleDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados para pesquisa
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");
  const [sellerSearchTerm, setSellerSearchTerm] = useState("");
  const [serviceSearchTerm, setServiceSearchTerm] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState<number>(0);
  const [selectedServiceQuantity, setSelectedServiceQuantity] = useState<number>(1);
  const [showCustomerPopover, setShowCustomerPopover] = useState(false);
  const [showSellerPopover, setShowSellerPopover] = useState(false);
  const [showServicePopover, setShowServicePopover] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerDocument, setNewCustomerDocument] = useState("");
  
  // Estado para datas de parcelas
  const [installmentDates, setInstallmentDates] = useState<string[]>([]);
  const [firstDueDate, setFirstDueDate] = useState<Date>(addMonths(new Date(), 1));

  // Consultas para buscar dados
  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers");
      if (!response.ok) throw new Error("Erro ao carregar clientes");
      return response.json();
    }
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Erro ao carregar usuários");
      return response.json();
    }
  });
  
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["/api/payment-methods"],
    queryFn: async () => {
      const response = await fetch("/api/payment-methods");
      if (!response.ok) throw new Error("Erro ao carregar formas de pagamento");
      return response.json();
    }
  });
  
  const { data: services = [] } = useQuery({
    queryKey: ["/api/services"],
    queryFn: async () => {
      const response = await fetch("/api/services");
      if (!response.ok) throw new Error("Erro ao carregar serviços");
      return response.json();
    }
  });
  
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ["/api/service-types"],
    queryFn: async () => {
      const response = await fetch("/api/service-types");
      if (!response.ok) throw new Error("Erro ao carregar tipos de serviço");
      return response.json();
    }
  });

  // Valores padrão do formulário
  const defaultValues = {
    orderNumber: "",
    date: new Date(),
    customerId: 0,
    paymentMethodId: 0,
    serviceTypeId: 0,
    sellerId: user?.id || 0,
    totalAmount: "",
    installments: 1,
    notes: "",
    items: []
  };

  // Configuração do formulário com React Hook Form
  const form = useForm({
    resolver: zodResolver(saleFormSchema),
    defaultValues
  });

  // Field array para itens da venda
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items"
  });

  // Mutation para criar cliente
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: { name: string; document: string }) => {
      const response = await apiRequest("POST", "/api/customers", customerData);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar cliente");
      }
      return await response.json();
    },
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Cliente criado",
        description: "Cliente criado com sucesso",
      });
      form.setValue("customerId", customer.id);
      setCustomerSearchTerm(customer.name);
      setShowNewCustomerForm(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtrar clientes
  const filteredCustomers = customers.filter((customer: any) => {
    const nameMatch = customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase());
    const documentMatch = customer.document.toLowerCase().includes(customerSearchTerm.toLowerCase());
    return nameMatch || documentMatch;
  });

  // Filtrar vendedores
  const sellers = user?.role === 'vendedor'
    ? users.filter((u: any) => u.id === user.id)
    : users;
  
  const filteredSellers = sellers.filter((seller: any) => 
    seller.username.toLowerCase().includes(sellerSearchTerm.toLowerCase())
  );
  
  // Filtrar serviços
  const filteredServices = services.filter((service: any) =>
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  );

  // Gerar datas de parcelas
  const generateInstallmentDates = (firstDate: Date, numberOfInstallments: number) => {
    const dates: string[] = [];
    
    const firstDateFormatted = format(firstDate, "yyyy-MM-dd");
    dates.push(firstDateFormatted);
    
    for (let i = 1; i < numberOfInstallments; i++) {
      const nextDate = addMonths(firstDate, i);
      const formattedDate = format(nextDate, "yyyy-MM-dd");
      dates.push(formattedDate);
    }
    
    return dates;
  };

  // Atualizar datas de parcelas quando o número de parcelas mudar
  useEffect(() => {
    const installmentsValue = form.getValues("installments");
    if (installmentsValue > 1) {
      const dates = generateInstallmentDates(firstDueDate, installmentsValue);
      setInstallmentDates(dates);
    } else {
      setInstallmentDates([]);
    }
  }, [form.watch("installments"), firstDueDate]);

  // Função para adicionar serviço
  const addServiceToItems = () => {
    if (selectedServiceId > 0) {
      const service = services.find((s: any) => s.id === selectedServiceId);
      if (service) {
        append({
          serviceId: selectedServiceId,
          quantity: selectedServiceQuantity || 1,
          notes: "",
        });
        
        setSelectedServiceId(0);
        setSelectedServiceQuantity(1);
        setServiceSearchTerm("");
        setShowServicePopover(false);
      }
    } else {
      toast({
        title: "Serviço não selecionado",
        description: "Selecione um serviço para adicionar",
        variant: "destructive",
      });
    }
  };

  // Função para obter nome do cliente por ID
  const getCustomerName = (id: number) => {
    const customer = customers.find((c: any) => c.id === id);
    return customer ? customer.name : `Cliente #${id}`;
  };

  // Função para obter nome do vendedor por ID
  const getSellerName = (id: number) => {
    const seller = users.find((u: any) => u.id === id);
    return seller ? seller.username : `Vendedor #${id}`;
  };

  // Função para criar novo cliente
  const handleCreateCustomer = () => {
    if (!newCustomerName.trim()) {
      toast({
        title: "Nome obrigatório",
        description: "Digite o nome do cliente",
        variant: "destructive",
      });
      return;
    }

    createCustomerMutation.mutate({
      name: newCustomerName,
      document: newCustomerDocument || "000.000.000-00",
    });
  };

  // Função para enviar o formulário
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    form.trigger().then(isValid => {
      if (!isValid) {
        console.log("Formulário inválido:", form.formState.errors);
        toast({
          title: "Formulário inválido",
          description: "Verifique os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }
      
      setIsSubmitting(true);
      
      try {
        const values = form.getValues();
        
        // Preparar payload para API
        const payload = {
          orderNumber: values.orderNumber || `OS-${Date.now()}`,
          date: values.date.toISOString(),
          customerId: Number(values.customerId),
          paymentMethodId: Number(values.paymentMethodId),
          serviceTypeId: Number(values.serviceTypeId),
          sellerId: Number(values.sellerId || user?.id || 1),
          totalAmount: values.totalAmount ? values.totalAmount.replace(',', '.') : "0",
          installments: Number(values.installments || 1),
          notes: values.notes || "",
          installmentDates,
          items: values.items.map(item => ({
            serviceId: Number(item.serviceId),
            serviceTypeId: Number(values.serviceTypeId),
            quantity: Number(item.quantity || 1),
            notes: item.notes || null,
            status: "pending"
          }))
        };
        
        console.log("Enviando dados:", payload);
        
        // Enviar dados para API
        apiRequest("POST", "/api/sales", payload)
          .then(response => {
            if (!response.ok) {
              throw new Error("Erro ao salvar venda");
            }
            return response.json();
          })
          .then(data => {
            console.log("Venda salva com sucesso:", data);
            
            // Atualizar valor total se necessário
            if (data && data.id && 
                (data.totalAmount === "0" || data.totalAmount === "0.00" || !data.totalAmount) && 
                payload.totalAmount && payload.totalAmount !== "0" && payload.totalAmount !== "0.00") {
              
              apiRequest("POST", `/api/sales/${data.id}/update-total`, { 
                totalAmount: payload.totalAmount 
              })
                .then(response => response.json())
                .then(updatedSale => {
                  console.log("Valor total atualizado com sucesso:", updatedSale);
                  queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
                })
                .catch(error => {
                  console.error("Erro ao atualizar valor total:", error);
                });
            }
            
            toast({
              title: "Venda criada",
              description: "Venda criada com sucesso",
            });
            
            queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
            
            if (onSaveSuccess) onSaveSuccess();
            onClose();
          })
          .catch(error => {
            console.error("Erro ao salvar venda:", error);
            toast({
              title: "Erro ao salvar venda",
              description: error.message,
              variant: "destructive",
            });
          })
          .finally(() => {
            setIsSubmitting(false);
          });
          
      } catch (error: any) {
        console.error("Erro ao processar dados:", error);
        toast({
          title: "Erro ao processar dados",
          description: error.message || "Erro desconhecido",
          variant: "destructive",
        });
        setIsSubmitting(false);
      }
    });
  };

  // Não renderizar nada se o diálogo não estiver aberto
  if (!open) return null;

  return (
    <Dialog open={true} onOpenChange={(isOpen) => {
      if (!isOpen) onClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold">
            Nova Venda
          </DialogTitle>
          <DialogDescription>
            Preencha os dados para criar uma nova venda
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Número de OS */}
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Número da OS
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="123456" {...field} />
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
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data
                    </FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full flex justify-between items-center",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <Calendar className="h-4 w-4 ml-auto opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                          disabled={(date) => date > new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 gap-6">
              {/* Cliente */}
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Cliente
                    </FormLabel>
                    <div className="relative">
                      <Popover
                        open={showCustomerPopover}
                        onOpenChange={(open) => {
                          setShowCustomerPopover(open);
                          if (!open && !field.value) {
                            setCustomerSearchTerm("");
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <PopoverTrigger asChild className="flex-1">
                            <div className="relative w-full">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Digite o nome ou CPF/CNPJ do cliente"
                                value={customerSearchTerm}
                                onChange={(e) => {
                                  setCustomerSearchTerm(e.target.value);
                                  setShowCustomerPopover(true);
                                }}
                                className="pl-9 pr-10"
                                onClick={() => setShowCustomerPopover(true)}
                              />
                              {field.value > 0 && (
                                <Badge variant="outline" className="absolute right-3 top-2 bg-primary/10 text-xs">
                                  {getCustomerName(field.value)}
                                </Badge>
                              )}
                            </div>
                          </PopoverTrigger>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                            className="h-10 w-10 shrink-0"
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-[300px] overflow-y-auto">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar cliente por nome ou CPF/CNPJ"
                              value={customerSearchTerm}
                              onValueChange={(value) => {
                                setCustomerSearchTerm(value);
                              }}
                              className="border-none focus:ring-0"
                            />
                            <CommandList>
                              <CommandEmpty className="py-6 text-center">
                                <div className="space-y-2">
                                  <p className="text-sm">Nenhum cliente encontrado</p>
                                  <Button 
                                    type="button" 
                                    variant="secondary" 
                                    size="sm"
                                    onClick={() => {
                                      setShowNewCustomerForm(true);
                                      setShowCustomerPopover(false);
                                    }}
                                  >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    Cadastrar novo cliente
                                  </Button>
                                </div>
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredCustomers.map((customer: any) => (
                                  <CommandItem
                                    key={customer.id}
                                    value={`${customer.name} ${customer.document}`}
                                    onSelect={() => {
                                      field.onChange(customer.id);
                                      setCustomerSearchTerm(customer.name);
                                      setShowCustomerPopover(false);
                                    }}
                                    className="py-2"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{customer.name}</span>
                                      <span className="text-xs text-muted-foreground">{customer.document}</span>
                                    </div>
                                    {field.value === customer.id && (
                                      <Check className="ml-auto h-4 w-4 text-primary" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Formulário para novo cliente */}
              {showNewCustomerForm && (
                <div className="bg-muted/30 p-4 rounded border border-primary/20 animate-in fade-in-50 slide-in-from-top-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base font-medium">Cadastrar Novo Cliente</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <FormLabel>Nome/Razão Social</FormLabel>
                      <Input 
                        value={newCustomerName} 
                        onChange={(e) => setNewCustomerName(e.target.value)} 
                        placeholder="Digite o nome do cliente"
                      />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>CPF/CNPJ</FormLabel>
                      <Input 
                        value={newCustomerDocument} 
                        onChange={(e) => setNewCustomerDocument(e.target.value)} 
                        placeholder="Digite o CPF/CNPJ do cliente"
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowNewCustomerForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="button" 
                      size="sm"
                      onClick={handleCreateCustomer}
                    >
                      Salvar Cliente
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Vendedor */}
              <FormField
                control={form.control}
                name="sellerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Vendedor
                    </FormLabel>
                    <div className="relative">
                      <Popover
                        open={showSellerPopover}
                        onOpenChange={setShowSellerPopover}
                      >
                        <PopoverTrigger asChild>
                          <div className="relative w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Digite o nome do vendedor"
                              value={sellerSearchTerm}
                              onChange={(e) => {
                                setSellerSearchTerm(e.target.value);
                                setShowSellerPopover(true);
                              }}
                              className="pl-9 pr-10"
                              onClick={() => setShowSellerPopover(true)}
                            />
                            {field.value > 0 && (
                              <Badge variant="outline" className="absolute right-3 top-2 bg-primary/10 text-xs">
                                {getSellerName(field.value)}
                              </Badge>
                            )}
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-[300px] overflow-y-auto">
                          <Command>
                            <CommandInput 
                              placeholder="Buscar vendedor por nome"
                              value={sellerSearchTerm}
                              onValueChange={(value) => setSellerSearchTerm(value)}
                              className="border-none focus:ring-0"
                            />
                            <CommandList>
                              <CommandEmpty className="py-6 text-center">
                                <p className="text-sm">Nenhum vendedor encontrado</p>
                              </CommandEmpty>
                              <CommandGroup>
                                {filteredSellers.map((seller: any) => (
                                  <CommandItem
                                    key={seller.id}
                                    value={seller.username}
                                    onSelect={() => {
                                      field.onChange(seller.id);
                                      setSellerSearchTerm(seller.username);
                                      setShowSellerPopover(false);
                                    }}
                                    className="py-2"
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium">{seller.username}</span>
                                      <span className="text-xs text-muted-foreground">{seller.role}</span>
                                    </div>
                                    {field.value === seller.id && (
                                      <Check className="ml-auto h-4 w-4 text-primary" />
                                    )}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Tipo de Serviço */}
              <FormField
                control={form.control}
                name="serviceTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Cog className="h-4 w-4" />
                      Tipo de Execução
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de execução" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {serviceTypes.map((type: any) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {type.name}
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
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Forma de Pagamento
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      value={field.value ? String(field.value) : undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a forma de pagamento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method: any) => (
                          <SelectItem key={method.id} value={String(method.id)}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valor Total */}
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Valor Total (R$)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="0,00"
                          {...field}
                          onChange={(e) => {
                            // Remove caracteres não numéricos, exceto vírgula
                            const value = e.target.value.replace(/[^\d,]/g, '');
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Número de Parcelas */}
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 1;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Data do 1º Vencimento (se parcelas > 1) */}
              {form.watch("installments") > 1 && (
                <div className="space-y-2">
                  <FormLabel>Data do 1º Vencimento</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left",
                          !firstDueDate && "text-muted-foreground"
                        )}
                      >
                        {firstDueDate ? (
                          format(firstDueDate, "dd/MM/yyyy")
                        ) : (
                          <span>Selecione uma data</span>
                        )}
                        <Calendar className="ml-auto h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={firstDueDate}
                        onSelect={(date) => date && setFirstDueDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
              
              {/* Datas das Parcelas (preview) */}
              {form.watch("installments") > 1 && installmentDates.length > 0 && (
                <div className="space-y-2">
                  <FormLabel>Datas de Vencimento das Parcelas</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {installmentDates.map((date, index) => (
                      <div key={index} className="border rounded p-2 text-sm">
                        <span className="font-medium">Parcela {index + 1}:</span>
                        <span className="ml-1">
                          {format(new Date(date), "dd/MM/yyyy")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Observações */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4" />
                      Observações
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre a venda"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Adicionar Item */}
              <div className="bg-muted/20 p-4 rounded-lg">
                <h3 className="text-base font-medium mb-4">Adicionar Serviço</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="relative md:col-span-2">
                    <Popover
                      open={showServicePopover}
                      onOpenChange={setShowServicePopover}
                    >
                      <PopoverTrigger asChild>
                        <div className="relative w-full">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Buscar serviço"
                            value={serviceSearchTerm}
                            onChange={(e) => {
                              setServiceSearchTerm(e.target.value);
                              setShowServicePopover(true);
                            }}
                            className="pl-9"
                            onClick={() => setShowServicePopover(true)}
                          />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-[300px] overflow-y-auto">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar serviço"
                            value={serviceSearchTerm}
                            onValueChange={setServiceSearchTerm}
                            className="border-none focus:ring-0"
                          />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center">
                              <p className="text-sm">Nenhum serviço encontrado</p>
                            </CommandEmpty>
                            <CommandGroup>
                              {filteredServices.map((service: any) => (
                                <CommandItem
                                  key={service.id}
                                  value={service.name}
                                  onSelect={() => {
                                    setSelectedServiceId(service.id);
                                    setServiceSearchTerm(service.name);
                                    setShowServicePopover(false);
                                  }}
                                  className="py-2"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{service.name}</span>
                                    {service.description && (
                                      <span className="text-xs text-muted-foreground">{service.description}</span>
                                    )}
                                  </div>
                                  {selectedServiceId === service.id && (
                                    <Check className="ml-auto h-4 w-4 text-primary" />
                                  )}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex items-center gap-2 md:col-span-1">
                    <Input
                      type="number"
                      min={1}
                      value={selectedServiceQuantity}
                      onChange={(e) => setSelectedServiceQuantity(parseInt(e.target.value) || 1)}
                      placeholder="Qtd"
                      className="w-20"
                    />
                    <Button type="button" onClick={addServiceToItems} className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Lista de Itens */}
              {fields.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-base font-medium">Itens da Venda</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Serviço</TableHead>
                        <TableHead className="w-20 text-center">Quantidade</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                        const serviceId = form.getValues(`items.${index}.serviceId`);
                        const service = services.find((s: any) => s.id === serviceId);
                        return (
                          <TableRow key={field.id}>
                            <TableCell>{service?.name || 'Serviço não encontrado'}</TableCell>
                            <TableCell className="text-center">
                              {form.getValues(`items.${index}.quantity`) || 1}
                            </TableCell>
                            <TableCell>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                onClick={() => onClose()}
                type="button"
                variant="outline"
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
              >
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}