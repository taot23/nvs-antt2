import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { ServiceProvider } from '@shared/schema';

// Schema para validação do formulário
const serviceProviderFormSchema = z.object({
  name: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  document: z.string().min(11, { message: 'Documento inválido' }),
  documentType: z.enum(['cpf', 'cnpj'], { 
    required_error: "Selecione o tipo de documento",
    invalid_type_error: "Tipo de documento inválido" 
  }),
  contactName: z.string().optional(),
  phone: z.string().min(10, { message: 'Telefone deve ter pelo menos 10 dígitos' }),
  phone2: z.string().optional(),
  email: z.string().email({ message: 'E-mail inválido' }),
  address: z.string().optional(),
  active: z.boolean().default(true)
});

type ServiceProviderFormValues = z.infer<typeof serviceProviderFormSchema>;

interface ServiceProviderDialogProps {
  open: boolean;
  onClose: () => void;
  serviceProvider: ServiceProvider | null;
  onSaveSuccess: () => void;
}

export default function ServiceProviderDialog({
  open,
  onClose,
  serviceProvider,
  onSaveSuccess
}: ServiceProviderDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!serviceProvider;

  // Inicializar formulário com react-hook-form e validação zod
  const form = useForm<ServiceProviderFormValues>({
    resolver: zodResolver(serviceProviderFormSchema),
    defaultValues: {
      name: '',
      document: '',
      documentType: 'cpf',
      contactName: '',
      phone: '',
      phone2: '',
      email: '',
      address: '',
      active: true
    },
  });

  // Carregar dados para edição
  useEffect(() => {
    if (serviceProvider) {
      form.reset({
        name: serviceProvider.name,
        document: serviceProvider.document,
        documentType: serviceProvider.documentType as 'cpf' | 'cnpj',
        contactName: serviceProvider.contactName || '',
        phone: serviceProvider.phone,
        phone2: serviceProvider.phone2 || '',
        email: serviceProvider.email,
        address: serviceProvider.address || '',
        active: serviceProvider.active
      });
    } else {
      form.reset({
        name: '',
        document: '',
        documentType: 'cpf',
        contactName: '',
        phone: '',
        phone2: '',
        email: '',
        address: '',
        active: true
      });
    }
  }, [serviceProvider, form]);

  // Mutation para criar um novo prestador de serviço
  const createMutation = useMutation({
    mutationFn: async (data: ServiceProviderFormValues) => {
      const res = await apiRequest('POST', '/api/service-providers', data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Prestador de serviço criado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      onClose();
      onSaveSuccess();
    },
    onError: (error: Error) => {
      console.error('Erro ao criar prestador de serviço:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar prestador de serviço",
        variant: "destructive",
      });
    },
  });

  // Mutation para atualizar um prestador de serviço existente
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; serviceProvider: ServiceProviderFormValues }) => {
      const res = await apiRequest('PUT', `/api/service-providers/${data.id}`, data.serviceProvider);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Prestador de serviço atualizado com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/service-providers'] });
      onClose();
      onSaveSuccess();
    },
    onError: (error: Error) => {
      console.error('Erro ao atualizar prestador de serviço:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar prestador de serviço",
        variant: "destructive",
      });
    },
  });

  // Função para lidar com o submit do formulário
  const onSubmit = (data: ServiceProviderFormValues) => {
    setIsSubmitting(true);
    
    try {
      if (isEditing && serviceProvider) {
        updateMutation.mutate({
          id: serviceProvider.id,
          serviceProvider: data
        });
      } else {
        createMutation.mutate(data);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Formatar CPF/CNPJ ao digitar
  const formatDocument = (value: string, type: 'cpf' | 'cnpj'): string => {
    // Remover todos os caracteres não numéricos
    const onlyNumbers = value.replace(/\D/g, '');
    
    if (type === 'cpf') {
      // Formatar CPF: 000.000.000-00
      if (onlyNumbers.length <= 3) {
        return onlyNumbers;
      } else if (onlyNumbers.length <= 6) {
        return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3)}`;
      } else if (onlyNumbers.length <= 9) {
        return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3, 6)}.${onlyNumbers.slice(6)}`;
      } else {
        return `${onlyNumbers.slice(0, 3)}.${onlyNumbers.slice(3, 6)}.${onlyNumbers.slice(6, 9)}-${onlyNumbers.slice(9, 11)}`;
      }
    } else {
      // Formatar CNPJ: 00.000.000/0000-00
      if (onlyNumbers.length <= 2) {
        return onlyNumbers;
      } else if (onlyNumbers.length <= 5) {
        return `${onlyNumbers.slice(0, 2)}.${onlyNumbers.slice(2)}`;
      } else if (onlyNumbers.length <= 8) {
        return `${onlyNumbers.slice(0, 2)}.${onlyNumbers.slice(2, 5)}.${onlyNumbers.slice(5)}`;
      } else if (onlyNumbers.length <= 12) {
        return `${onlyNumbers.slice(0, 2)}.${onlyNumbers.slice(2, 5)}.${onlyNumbers.slice(5, 8)}/${onlyNumbers.slice(8)}`;
      } else {
        return `${onlyNumbers.slice(0, 2)}.${onlyNumbers.slice(2, 5)}.${onlyNumbers.slice(5, 8)}/${onlyNumbers.slice(8, 12)}-${onlyNumbers.slice(12, 14)}`;
      }
    }
  };

  // Formatar telefone ao digitar
  const formatPhone = (value: string): string => {
    // Remover todos os caracteres não numéricos
    const onlyNumbers = value.replace(/\D/g, '');
    
    // Formatar telefone: (00) 0000-0000 ou (00) 00000-0000
    if (onlyNumbers.length <= 2) {
      return onlyNumbers.length ? `(${onlyNumbers}` : '';
    } else if (onlyNumbers.length <= 6) {
      return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2)}`;
    } else if (onlyNumbers.length <= 10) {
      return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2, 6)}-${onlyNumbers.slice(6)}`;
    } else {
      return `(${onlyNumbers.slice(0, 2)}) ${onlyNumbers.slice(2, 7)}-${onlyNumbers.slice(7, 11)}`;
    }
  };

  // Determinar quando mostrar o campo de nome de contato
  const documentType = form.watch('documentType');
  const showContactName = documentType === 'cnpj';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Prestador de Serviço' : 'Novo Prestador de Serviço'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
            {/* Tipo de Documento */}
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Tipo de Documento</FormLabel>
                  <RadioGroup
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Limpar o documento ao trocar o tipo
                      form.setValue('document', '');
                      if (value === 'cnpj') {
                        form.setValue('contactName', '');
                      }
                    }}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cpf" id="cpf" />
                      <Label htmlFor="cpf">CPF</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cnpj" id="cnpj" />
                      <Label htmlFor="cnpj">CNPJ</Label>
                    </div>
                  </RadioGroup>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Nome/Razão Social */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {documentType === 'cpf' ? 'Nome Completo' : 'Razão Social'}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder={documentType === 'cpf' ? 'Nome completo do prestador' : 'Razão social da empresa'} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Nome do Contato (apenas para CNPJ) */}
            {showContactName && (
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da pessoa de contato" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            {/* Documento (CPF/CNPJ) */}
            <FormField
              control={form.control}
              name="document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{documentType.toUpperCase()}</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder={documentType === 'cpf' ? '000.000.000-00' : '00.000.000/0000-00'} 
                      {...field} 
                      value={formatDocument(field.value, documentType as 'cpf' | 'cnpj')} 
                      onChange={(e) => {
                        // Limitar o número de caracteres
                        const maxLength = documentType === 'cpf' ? 14 : 18; // 14 para CPF com formatação, 18 para CNPJ
                        if (formatDocument(e.target.value, documentType as 'cpf' | 'cnpj').length <= maxLength) {
                          field.onChange(e);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Telefones - colocar lado a lado em telas maiores */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone Principal</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(00) 00000-0000" 
                        {...field} 
                        value={formatPhone(field.value)}
                        onChange={(e) => {
                          // Limitar o número de caracteres
                          const maxLength = 15; // (00) 00000-0000
                          if (formatPhone(e.target.value).length <= maxLength) {
                            field.onChange(e);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="phone2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone Secundário</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="(00) 00000-0000 (Opcional)" 
                        {...field} 
                        value={formatPhone(field.value || '')}
                        onChange={(e) => {
                          // Limitar o número de caracteres
                          const maxLength = 15; // (00) 00000-0000
                          if (formatPhone(e.target.value).length <= maxLength) {
                            field.onChange(e);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Endereço */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço Completo</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Endereço completo (opcional)" 
                      className="resize-none" 
                      {...field} 
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Status Ativo */}
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Prestador Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Marque se o prestador está ativo para prestação de serviços
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? 'Salvando...' 
                  : isEditing 
                    ? 'Atualizar' 
                    : 'Cadastrar'
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}