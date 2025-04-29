import React, { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Componente ultra-simplificado para edição de vendas
 * Sem complexidades, apenas o essencial para resolver problemas de edição
 */

// Esquema de validação para o formulário simplificado
const formSchema = z.object({
  orderNumber: z.string().min(1, "Número do pedido é obrigatório"),
  date: z.date({
    required_error: "Data da venda é obrigatória",
  }),
  customerId: z.string().min(1, "Cliente é obrigatório"),
  sellerId: z.string().min(1, "Vendedor é obrigatório"),
  paymentMethodId: z.string().min(1, "Método de pagamento é obrigatório"),
  serviceTypeId: z.string().optional(),
  serviceProviderId: z.string().optional(),
  items: z.array(
    z.object({
      serviceId: z.string().min(1, "Serviço é obrigatório"),
      quantity: z.string().min(1, "Quantidade é obrigatória"),
      notes: z.string().optional(),
    })
  ).min(1, "Pelo menos um item é obrigatório"),
  totalAmount: z.string().min(1, "Valor total é obrigatório"),
  notes: z.string().optional(),
  installments: z.string().min(1, "Número de parcelas é obrigatório"),
  correctionNotes: z.string().optional(), // Para uso em reenvio de vendas devolvidas
});

// Tipo derivado do esquema
type FormValues = z.infer<typeof formSchema>;

// Props do componente
interface BasicSaleFormProps {
  open: boolean;
  onClose: () => void;
  saleId?: number;
  onSaveSuccess?: () => void;
}

// Função principal do componente
export function BasicSaleForm({ 
  open, 
  onClose, 
  saleId,
  onSaveSuccess
}: BasicSaleFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Consultas para buscar dados relacionados
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
    enabled: open,
  });

  const { data: sellers = [] } = useQuery({
    queryKey: ['/api/users'],
    enabled: open,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['/api/payment-methods'],
    enabled: open,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['/api/services'],
    enabled: open,
  });

  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['/api/service-types'],
    enabled: open,
  });

  const { data: serviceProviders = [] } = useQuery({
    queryKey: ['/api/service-providers'],
    enabled: open,
  });

  // Consulta condicional para buscar os detalhes da venda se um saleId for fornecido
  const { data: saleData, isLoading: isSaleLoading, error: saleError } = useQuery({
    queryKey: ['/api/sales', saleId],
    queryFn: async () => {
      if (!saleId) return null;
      const response = await fetch(`/api/sales/${saleId}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar dados da venda");
      }
      return response.json();
    },
    enabled: !!saleId && open,
  });

  // Formulário com validação
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: "",
      date: new Date(),
      customerId: "",
      sellerId: user ? user.id.toString() : "",
      paymentMethodId: "",
      serviceTypeId: "",
      serviceProviderId: "",
      items: [{ serviceId: "", quantity: "1", notes: "" }],
      totalAmount: "",
      notes: "",
      installments: "1",
      correctionNotes: "",
    },
  });

  // Mutação para salvar a venda
  const saveOrUpdateSale = useMutation({
    mutationFn: async (data: any) => {
      // Se é uma atualização
      if (saleId) {
        const response = await fetch(`/api/sales/${saleId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao atualizar venda");
        }

        return response.json();
      } 
      // Se é uma nova venda
      else {
        const response = await fetch("/api/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Erro ao criar venda");
        }

        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: saleId ? "Venda atualizada" : "Venda criada",
        description: saleId ? "A venda foi atualizada com sucesso" : "A venda foi criada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para reenviar uma venda devolvida
  const resubmitReturnedSale = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/sales/${saleId}/resubmit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erro ao reenviar venda");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Venda reenviada",
        description: "A venda foi corrigida e reenviada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      if (onSaveSuccess) {
        onSaveSuccess();
      }
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Atualizar o formulário quando os dados da venda são carregados
  useEffect(() => {
    if (saleData) {
      // Formatar os dados para o formulário
      const formattedItems = saleData.items.map((item: any) => ({
        serviceId: item.serviceId.toString(),
        quantity: item.quantity.toString(),
        notes: item.notes || "",
      }));

      // Definir valores do formulário
      form.reset({
        orderNumber: saleData.orderNumber,
        date: new Date(saleData.date),
        customerId: saleData.customerId.toString(),
        sellerId: saleData.sellerId.toString(),
        paymentMethodId: saleData.paymentMethodId.toString(),
        serviceTypeId: saleData.serviceTypeId ? saleData.serviceTypeId.toString() : "",
        serviceProviderId: saleData.serviceProviderId ? saleData.serviceProviderId.toString() : "",
        items: formattedItems,
        totalAmount: saleData.totalAmount,
        notes: saleData.notes || "",
        installments: saleData.installments ? saleData.installments.toString() : "1",
        correctionNotes: "",
      });
    }
  }, [saleData, form]);

  // Função para enviar o formulário
  const onSubmit = (values: FormValues) => {
    setIsLoading(true);
    
    // Convertendo os dados para o formato esperado pela API
    const formattedData = {
      orderNumber: values.orderNumber,
      date: values.date.toISOString().split('T')[0], // YYYY-MM-DD
      customerId: parseInt(values.customerId),
      paymentMethodId: parseInt(values.paymentMethodId),
      sellerId: parseInt(values.sellerId),
      serviceTypeId: values.serviceTypeId ? parseInt(values.serviceTypeId) : null,
      serviceProviderId: values.serviceProviderId ? parseInt(values.serviceProviderId) : null,
      items: values.items.map(item => ({
        serviceId: parseInt(item.serviceId),
        quantity: parseInt(item.quantity),
        notes: item.notes || "",
      })),
      totalAmount: values.totalAmount,
      notes: values.notes || "",
      installments: parseInt(values.installments),
      correctionNotes: values.correctionNotes || "",
    };

    // Escolher a mutação apropriada baseado no status da venda
    if (saleData?.status === "returned") {
      resubmitReturnedSale.mutate(formattedData);
    } else {
      saveOrUpdateSale.mutate(formattedData);
    }
  };

  // Função para adicionar um novo item
  const addItem = () => {
    const currentItems = form.getValues("items");
    form.setValue("items", [
      ...currentItems,
      { serviceId: "", quantity: "1", notes: "" },
    ]);
  };

  // Função para remover um item
  const removeItem = (index: number) => {
    const currentItems = form.getValues("items");
    if (currentItems.length > 1) {
      const filteredItems = currentItems.filter((_, i) => i !== index);
      form.setValue("items", filteredItems);
    } else {
      toast({
        title: "Atenção",
        description: "A venda deve ter pelo menos um item",
        variant: "destructive",
      });
    }
  };

  // Função para formatar data para exibição
  function formatDateForDisplay(isoDate: string): string {
    if (!isoDate) return '';
    
    try {
      // Para datas no formato ISO (YYYY-MM-DD)
      if (isoDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = isoDate.split('-').map(Number);
        return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
      }
      
      // Se a data incluir hora (formato ISO completo)
      if (isoDate.includes('T')) {
        const parts = isoDate.split('T')[0].split('-');
        if (parts.length === 3) {
          const [year, month, day] = parts.map(Number);
          return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        }
      }
      
      // Fallback para o formato do date-fns
      return format(new Date(isoDate), 'dd/MM/yyyy');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {saleId 
              ? (saleData?.status === "returned" 
                ? "Corrigir e Reenviar Venda" 
                : "Editar Venda") 
              : "Nova Venda"}
          </DialogTitle>
        </DialogHeader>
        
        {isSaleLoading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : saleError ? (
          <div className="p-4 text-red-500">
            Erro ao carregar dados da venda: {(saleError as Error).message}
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="orderNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Pedido</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                      <FormLabel>Data da Venda</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "pl-3 text-left font-normal",
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <SelectItem
                              key={customer.id}
                              value={customer.id.toString()}
                            >
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
                  name="sellerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendedor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um vendedor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sellers
                            .filter((seller: any) => seller.role === "vendedor" || seller.role === "admin")
                            .map((seller: any) => (
                              <SelectItem
                                key={seller.id}
                                value={seller.id.toString()}
                              >
                                {seller.username}
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
                <FormField
                  control={form.control}
                  name="paymentMethodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Método de Pagamento</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um método" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {paymentMethods.map((method: any) => (
                            <SelectItem
                              key={method.id}
                              value={method.id.toString()}
                            >
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
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parcelas</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Número de parcelas" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((number) => (
                            <SelectItem
                              key={number}
                              value={number.toString()}
                            >
                              {number} {number === 1 ? "parcela" : "parcelas"}
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
                <FormField
                  control={form.control}
                  name="serviceTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Execução</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo (opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {serviceTypes.map((type: any) => (
                            <SelectItem
                              key={type.id}
                              value={type.id.toString()}
                            >
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {form.watch("serviceTypeId") === "1" && ( // ID 1 é para SINDICATO
                  <FormField
                    control={form.control}
                    name="serviceProviderId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prestador de Serviço</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o prestador" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Nenhum</SelectItem>
                            {serviceProviders.map((provider: any) => (
                              <SelectItem
                                key={provider.id}
                                value={provider.id.toString()}
                              >
                                {provider.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              {/* Seção de Itens */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Itens da Venda</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {form.watch("items").map((_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-12 gap-2 items-end"
                    >
                      <div className="col-span-5">
                        <FormField
                          control={form.control}
                          name={`items.${index}.serviceId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Serviço</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {services.map((service: any) => (
                                    <SelectItem
                                      key={service.id}
                                      value={service.id.toString()}
                                    >
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
                      
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Qtd</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  {...field}
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.notes`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Observações</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                  >
                    Adicionar Item
                  </Button>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total (R$)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="0,00"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observações Gerais</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Observações sobre a venda" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Campo para notas de correção quando for reenvio de venda devolvida */}
              {saleData?.status === "returned" && (
                <FormField
                  control={form.control}
                  name="correctionNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notas de Correção</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Descreva as correções realizadas"
                          className="h-24"
                          required
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isLoading || form.formState.isSubmitting}
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Processando...
                    </>
                  ) : saleData?.status === "returned" ? (
                    "Reenviar Venda Corrigida"
                  ) : saleId ? (
                    "Atualizar Venda"
                  ) : (
                    "Criar Venda"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}