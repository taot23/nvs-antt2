import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Plus, Trash2, Search, Check, User, UserPlus, CreditCard, AlignLeft, FileText, Calendar, DollarSign, Cog } from "lucide-react";
import { format } from "date-fns";

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

// Esquema de validação para itens da venda
const saleItemSchema = z.object({
  serviceId: z.coerce.number().min(1, "Serviço é obrigatório"),
  quantity: z.coerce.number().min(1, "Quantidade mínima é 1"),
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
  serviceTypeId: z.coerce.number().min(1, "Tipo de execução é obrigatório"),
  sellerId: z.coerce.number().min(1, "Vendedor é obrigatório"),
  totalAmount: z.string().min(1, "Valor total é obrigatório"),
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
  
  // Estados para controle de busca
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
    serviceTypeId: 0,
    sellerId: user?.id || 0,
    totalAmount: "",
    notes: "",
    items: [
      {
        serviceId: 0,
        quantity: 1,
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
  
  // Mutation para criar novo cliente
  const createCustomerMutation = useMutation({
    mutationFn: async (customerData: { name: string; document: string }) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(customerData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar cliente");
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      form.setValue("customerId", data.id);
      setShowNewCustomerForm(false);
      setNewCustomerName("");
      setNewCustomerDocument("");
      toast({
        title: "Cliente criado",
        description: "Cliente criado com sucesso",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Filtra clientes com base no termo de busca
  const filteredCustomers = customers.filter((customer: any) => {
    const nameMatch = customer.name.toLowerCase().includes(customerSearchTerm.toLowerCase());
    const documentMatch = customer.document.toLowerCase().includes(customerSearchTerm.toLowerCase());
    return nameMatch || documentMatch;
  });

  // Filtra vendedores com base no papel - apenas administrador, supervisor e vendedor
  const sellers = users.filter((user: any) => 
    ['admin', 'vendedor', 'supervisor'].includes(user.role)
  );
  
  const filteredSellers = sellers.filter((seller: any) => 
    seller.username.toLowerCase().includes(sellerSearchTerm.toLowerCase())
  );
  
  // Filtra serviços com base no termo de busca
  const filteredServices = services.filter((service: any) =>
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  );

  // Efeito para atualizar o formulário quando os itens são carregados
  useEffect(() => {
    if (sale && saleItems.length > 0 && !formInitialized.current) {
      form.reset({
        orderNumber: sale.orderNumber,
        date: new Date(sale.date),
        customerId: sale.customerId,
        paymentMethodId: sale.paymentMethodId,
        serviceTypeId: saleItems[0]?.serviceTypeId || 0, // Pega o tipo de serviço do primeiro item
        sellerId: sale.sellerId,
        totalAmount: sale.totalAmount,
        notes: sale.notes,
        items: saleItems.map((item: SaleItem) => ({
          serviceId: item.serviceId,
          quantity: item.quantity,
          notes: item.notes
        }))
      });

      // Encontra e define os nomes de cliente e vendedor para os campos de busca
      const selectedCustomer = customers.find((c: any) => c.id === sale.customerId);
      if (selectedCustomer) {
        setCustomerSearchTerm(selectedCustomer.name);
      }

      const selectedSeller = users.find((u: any) => u.id === sale.sellerId);
      if (selectedSeller) {
        setSellerSearchTerm(selectedSeller.username);
      }
      
      formInitialized.current = true;
    }
  }, [sale, saleItems, form, customers, users]);
  
  // Atualizamos o formulário quando o modal é aberto/fechado
  useEffect(() => {
    if (open) {
      if (sale) {
        // Aguarda os itens serem carregados via query
        formInitialized.current = false;
      } else {
        // Nova venda
        form.reset(defaultFormValues);
        
        // Define o vendedor atual como padrão para novas vendas
        if (user) {
          form.setValue("sellerId", user.id);
          const currentUser = users.find((u: any) => u.id === user.id);
          if (currentUser) {
            setSellerSearchTerm(currentUser.username);
          }
        }
        
        formInitialized.current = true;
      }
    } else {
      // Quando o modal é fechado, reiniciamos os estados
      setCustomerSearchTerm("");
      setSellerSearchTerm("");
      setShowNewCustomerForm(false);
      setNewCustomerName("");
      setNewCustomerDocument("");
      formInitialized.current = false;
    }
  }, [open, sale?.id, form, user, users]);
  
  // Adiciona um item em branco ao formulário
  const addEmptyItem = () => {
    append({
      serviceId: 0,
      quantity: 1,
      notes: ""
    });
  };
  
  // Adiciona um item com o serviço selecionado
  const addServiceItem = () => {
    if (selectedServiceId <= 0) {
      toast({
        title: "Serviço não selecionado",
        description: "Selecione um serviço para adicionar",
        variant: "destructive",
      });
      return;
    }
    
    append({
      serviceId: selectedServiceId,
      quantity: selectedServiceQuantity,
      notes: ""
    });
    
    // Reseta os valores para o próximo item
    setSelectedServiceId(0);
    setSelectedServiceQuantity(1);
    setServiceSearchTerm("");
    setShowServicePopover(false);
  };

  // Função para criar novo cliente
  const handleCreateCustomer = () => {
    if (!newCustomerName || !newCustomerDocument) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e documento são obrigatórios",
        variant: "destructive",
      });
      return;
    }

    createCustomerMutation.mutate({
      name: newCustomerName,
      document: newCustomerDocument,
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

  // Função para obter o nome do cliente pelo ID
  const getCustomerName = (id: number) => {
    const customer = customers.find((c: any) => c.id === id);
    return customer ? customer.name : `Cliente #${id}`;
  };

  // Função para obter o nome do vendedor pelo ID
  const getSellerName = (id: number) => {
    const seller = users.find((u: any) => u.id === id);
    return seller ? seller.username : `Vendedor #${id}`;
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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
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
                          if (!open) {
                            // Se não houver cliente selecionado, limpa o termo de busca
                            if (!field.value) {
                              setCustomerSearchTerm("");
                            }
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
                        placeholder="Nome completo ou razão social"
                      />
                    </div>
                    <div className="space-y-2">
                      <FormLabel>CPF/CNPJ</FormLabel>
                      <Input 
                        value={newCustomerDocument} 
                        onChange={(e) => setNewCustomerDocument(e.target.value)} 
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCustomerForm(false)}>
                      Cancelar
                    </Button>
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleCreateCustomer} 
                      disabled={!newCustomerName || !newCustomerDocument}
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
                        onOpenChange={(open) => {
                          if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'financeiro' || user?.role === 'operacional') {
                            setShowSellerPopover(open);
                            if (!open && !field.value) {
                              setSellerSearchTerm("");
                            }
                          }
                        }}
                      >
                        <PopoverTrigger asChild>
                          <div className="relative w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Digite o nome do vendedor"
                              value={sellerSearchTerm}
                              onChange={(e) => {
                                setSellerSearchTerm(e.target.value);
                                if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'financeiro' || user?.role === 'operacional') {
                                  setShowSellerPopover(true);
                                }
                              }}
                              className="pl-9 pr-10"
                              disabled={user?.role !== 'admin' && user?.role !== 'supervisor' && user?.role !== 'financeiro' && user?.role !== 'operacional'}
                              onClick={() => {
                                if (user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'financeiro' || user?.role === 'operacional') {
                                  setShowSellerPopover(true);
                                }
                              }}
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
                              onValueChange={(value) => {
                                setSellerSearchTerm(value);
                              }}
                              className="border-none focus:ring-0"
                            />
                            <CommandList>
                              <CommandEmpty className="py-6 text-center">
                                <div className="space-y-2">
                                  <p className="text-sm">Nenhum vendedor encontrado</p>
                                </div>
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
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{seller.username}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {seller.role}
                                      </Badge>
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

              {/* Serviços */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Serviços
                  </FormLabel>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={addEmptyItem}
                    className="h-8"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar Serviço
                  </Button>
                </div>

                <div className="space-y-4 py-2">
                  {fields.map((field, index) => (
                    <div 
                      key={field.id} 
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 p-3 border rounded-md relative bg-background"
                    >
                      <div className="absolute -top-3 left-3 px-2 bg-background text-xs font-medium">
                        Item {index + 1}
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => fields.length > 1 && remove(index)}
                        className="absolute top-2 right-2 h-6 w-6 text-destructive hover:text-destructive-foreground hover:bg-destructive/10"
                        disabled={fields.length <= 1}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    
                      {/* Serviço */}
                      <div className="md:col-span-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.serviceId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Serviço</FormLabel>
                              <Select 
                                onValueChange={(value) => {
                                  const serviceId = parseInt(value);
                                  field.onChange(serviceId);
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
                      </div>
                      

                      
                      {/* Quantidade */}
                      <div className="md:col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Quantidade</FormLabel>
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
                      

                      
                      {/* Observações do Item - linha inteira abaixo */}
                      <div className="md:col-span-12">
                        <FormField
                          control={form.control}
                          name={`items.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Observações do Item</FormLabel>
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
              </div>

              {/* Forma de Pagamento e Tipo de Execução */}
              <div className="flex flex-col md:flex-row gap-6">
                {/* Forma de Pagamento */}
                <FormField
                  control={form.control}
                  name="paymentMethodId"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Forma de Pagamento
                      </FormLabel>
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
                
                {/* Tipo de Execução */}
                <FormField
                  control={form.control}
                  name="serviceTypeId"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-2">
                        <Cog className="h-4 w-4" />
                        Tipo de Execução
                      </FormLabel>
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

                {/* Valor Total (digitado pelo vendedor) */}
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Valor Total
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="0,00" {...field} />
                      </FormControl>
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
                    <FormLabel className="flex items-center gap-2">
                      <AlignLeft className="h-4 w-4" />
                      Observações
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Observações gerais sobre a venda" 
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
            
            <DialogFooter className="mt-6 flex gap-2">
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