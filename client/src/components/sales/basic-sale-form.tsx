import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from 'lucide-react';

/**
 * Componente ultra-simplificado para edição de vendas
 * Sem complexidades, apenas o essencial para resolver problemas de edição
 */
const formSchema = z.object({
  orderNumber: z.string().min(1, 'Obrigatório'),
  date: z.string().min(1, 'Obrigatório'),
  customerId: z.coerce.number().min(1, 'Obrigatório'),
  paymentMethodId: z.coerce.number().min(1, 'Obrigatório'),
  serviceTypeId: z.coerce.number().min(1, 'Obrigatório'),
  sellerId: z.coerce.number().min(1, 'Obrigatório'),
  installments: z.coerce.number().min(1, 'Mínimo 1').default(1),
  notes: z.string().optional(),
  // Campos específicos para vendas devolvidas
  correctionNotes: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface BasicSaleFormProps {
  open: boolean;
  onClose: () => void;
  saleId?: number;
  onSaveSuccess?: () => void;
}

export function BasicSaleForm({ 
  open, 
  onClose, 
  saleId,
  onSaveSuccess
}: BasicSaleFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Consultas para dados necessários
  const { data: customers = [] } = useQuery({
    queryKey: ['/api/customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      if (!response.ok) throw new Error('Erro ao carregar clientes');
      return response.json();
    }
  });
  
  const { data: serviceTypes = [] } = useQuery({
    queryKey: ['/api/service-types'],
    queryFn: async () => {
      const response = await fetch('/api/service-types');
      if (!response.ok) throw new Error('Erro ao carregar tipos de serviço');
      return response.json();
    }
  });
  
  const { data: paymentMethods = [] } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      const response = await fetch('/api/payment-methods');
      if (!response.ok) throw new Error('Erro ao carregar formas de pagamento');
      return response.json();
    }
  });
  
  const { data: users = [] } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await fetch('/api/users');
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      return response.json();
    }
  });
  
  // Consulta para obter a venda específica se estamos editando
  const { data: sale = null, isLoading: isLoadingSale } = useQuery({
    queryKey: ['/api/sales', saleId],
    queryFn: async () => {
      if (!saleId) return null;
      const response = await fetch(`/api/sales/${saleId}`);
      if (!response.ok) throw new Error('Erro ao carregar venda');
      return response.json();
    },
    enabled: !!saleId
  });
  
  // Formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      orderNumber: '',
      date: new Date().toISOString().split('T')[0],
      customerId: 0,
      paymentMethodId: 0,
      serviceTypeId: 0,
      sellerId: user?.id || 0,
      installments: 1,
      notes: '',
      correctionNotes: ''
    }
  });
  
  // Atualizar formulário quando a venda for carregada
  useEffect(() => {
    if (sale) {
      form.reset({
        orderNumber: sale.orderNumber || '',
        date: sale.date || new Date().toISOString().split('T')[0],
        customerId: sale.customerId || 0,
        paymentMethodId: sale.paymentMethodId || 0,
        serviceTypeId: sale.serviceTypeId || 0,
        sellerId: sale.sellerId || user?.id || 0,
        installments: sale.installments || 1,
        notes: sale.notes || '',
        correctionNotes: ''
      });
    }
  }, [sale, form, user]);
  
  // Mutação para salvar/atualizar a venda
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = saleId ? `/api/sales/${saleId}` : '/api/sales';
      const method = saleId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar venda');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({ 
        title: 'Sucesso', 
        description: saleId ? 'Venda atualizada com sucesso' : 'Venda criada com sucesso' 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Ocorreu um erro ao salvar a venda',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  });
  
  // Para vendas devolvidas
  const resendMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!saleId) throw new Error('ID da venda não fornecido');
      
      const response = await fetch(`/api/sales/${saleId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao reenviar venda');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({ 
        title: 'Sucesso', 
        description: 'Venda reenviada com sucesso'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
      if (onSaveSuccess) onSaveSuccess();
      onClose();
    },
    onError: (error: Error) => {
      toast({ 
        title: 'Erro', 
        description: error.message || 'Ocorreu um erro ao reenviar a venda',
        variant: 'destructive'
      });
      setIsSubmitting(false);
    }
  });
  
  // Enviar formulário
  const onSubmit = (values: FormValues) => {
    setIsSubmitting(true);
    
    // Formatar data para ISO se necessário
    let formattedDate = values.date;
    if (values.date && values.date.includes('/')) {
      const [day, month, year] = values.date.split('/');
      formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    const data = {
      ...values,
      date: formattedDate,
    };
    
    if (sale?.status === 'returned') {
      // Para vendas devolvidas, usamos a mutação de reenvio
      resendMutation.mutate({
        ...data,
        items: [], // Não estamos lidando com itens nesta versão simplificada
        correctionNotes: values.correctionNotes
      });
    } else {
      // Para novas vendas ou edições regulares
      saveMutation.mutate(data);
    }
  };
  
  // Formatar data para exibição
  function formatDateForDisplay(isoDate: string): string {
    if (!isoDate) return '';
    if (isoDate.includes('/')) return isoDate;
    
    try {
      const [year, month, day] = isoDate.split('T')[0].split('-');
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return isoDate;
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {saleId ? 'Editar Venda' : 'Nova Venda'}
            {sale?.status === 'returned' && ' (Devolvida)'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Campos básicos em grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Número de Ordem */}
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Ordem</FormLabel>
                    <FormControl>
                      <Input placeholder="Número da OS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Data da Venda - versão super simplificada */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Data da Venda
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="DD/MM/AAAA"
                        value={field.value ? formatDateForDisplay(field.value) : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
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
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => field.onChange(Number(value))}
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
              
              {/* Forma de Pagamento */}
              <FormField
                control={form.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de Pagamento</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma forma" />
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
              
              {/* Tipo de Serviço */}
              <FormField
                control={form.control}
                name="serviceTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Serviço</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => field.onChange(Number(value))}
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
              
              {/* Vendedor */}
              <FormField
                control={form.control}
                name="sellerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vendedor</FormLabel>
                    <Select
                      value={field.value?.toString() || ''}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um vendedor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users
                          .filter((u: any) => u.role === 'vendedor' || u.role === 'admin')
                          .map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.username}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                    <Select
                      value={field.value?.toString() || '1'}
                      onValueChange={(value) => field.onChange(Number(value))}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o número" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num === 1 ? 'À Vista' : `${num} parcelas`}
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
                      placeholder="Observações adicionais sobre a venda"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Campo específico para vendas devolvidas */}
            {sale?.status === 'returned' && (
              <FormField
                control={form.control}
                name="correctionNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-red-500 font-medium">
                      Observações de Correção (Obrigatório)
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descreva as correções feitas nesta venda devolvida"
                        className="min-h-[100px] border-red-200 focus:border-red-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}