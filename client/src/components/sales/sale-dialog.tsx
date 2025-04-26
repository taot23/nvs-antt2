import { useState, useEffect, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

// Tipo Sale para tipagem da venda
type Sale = {
  id: number;
  orderNumber: string;
  date: string;
  customerId: number;
  paymentMethodId: number;
  sellerId: number;
  totalAmount: string;
  installments: number;
  installmentValue: string | null;
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
  serviceTypeId: z.coerce.number().min(1, "Tipo de serviço é obrigatório"),
  sellerId: z.coerce.number().min(1, "Vendedor é obrigatório"),
  totalAmount: z.string().optional(),
  installments: z.coerce.number().min(1, "Número de parcelas deve ser pelo menos 1").default(1),
  notes: z.string().optional(),
  items: z.array(saleItemSchema).min(1, "Adicione pelo menos um item à venda"),
});

// Tipo SaleItem para tipagem de itens da venda
type SaleItem = {
  id?: number;
  serviceId: number;
  serviceTypeId: number;
  quantity: number;
  price: string;
  totalPrice: string;
  status?: string;
  notes?: string | null;
};

interface SaleDialogProps {
  open: boolean;
  onClose: () => void;
  sale?: Sale | null;
  saleId?: number;
  readOnly?: boolean;
  renderAdditionalContent?: () => React.ReactNode;
  onSaveSuccess?: () => void;
}

export default function SaleDialog({ 
  open, 
  onClose, 
  sale: propSale, 
  saleId,
  readOnly = false,
  renderAdditionalContent,
  onSaveSuccess 
}: SaleDialogProps) {
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
  
  // Estados para controle das parcelas e datas de vencimento
  const [installmentDates, setInstallmentDates] = useState<Date[]>([]);
  const [firstDueDate, setFirstDueDate] = useState<Date>(addMonths(new Date(), 1));
  

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
    installments: 1, // Padrão: pagamento à vista
    notes: "",
    items: [] // Sem item inicial, usuário precisa adicionar manualmente
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
  
  // Consulta para obter a venda pelo ID
  const { data: sale = null, isLoading: isLoadingSale } = useQuery({
    queryKey: ["/api/sales", saleId],
    queryFn: async () => {
      if (!saleId) return propSale || null;
      const response = await fetch(`/api/sales/${saleId}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar venda");
      }
      return response.json();
    },
    enabled: !!saleId,
    initialData: propSale || null
  });

  // Consulta para obter os itens da venda ao editar
  const { data: saleItems = [] } = useQuery({
    queryKey: ["/api/sales", sale?.id || saleId, "items"],
    queryFn: async () => {
      const id = sale?.id || saleId;
      if (!id) return [];
      const response = await fetch(`/api/sales/${id}/items`);
      if (!response.ok) {
        throw new Error("Erro ao carregar itens da venda");
      }
      return response.json();
    },
    enabled: !!(sale?.id || saleId)
  });
  
  // Consulta para obter as parcelas da venda ao editar
  const { data: saleInstallments = [] } = useQuery({
    queryKey: ["/api/sales", sale?.id || saleId, "installments"],
    queryFn: async () => {
      const id = sale?.id || saleId;
      if (!id) return [];
      const response = await fetch(`/api/sales/${id}/installments`);
      if (!response.ok) {
        throw new Error("Erro ao carregar parcelas da venda");
      }
      return response.json();
    },
    enabled: !!(sale?.id || saleId)
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
    onSuccess: (customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Cliente criado",
        description: "Cliente criado com sucesso",
      });
      
      // Atualiza o formulário com o novo cliente
      form.setValue("customerId", customer.id);
      setCustomerSearchTerm(customer.name);
      setShowNewCustomerForm(false);
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

  // Mostra todos os usuários para perfis admin, supervisor, operacional e financeiro
  // Para perfil vendedor, mostra apenas ele mesmo
  const sellers = user?.role === 'vendedor'
    ? users.filter((u: any) => u.id === user.id)
    : users;
  
  const filteredSellers = sellers.filter((seller: any) => 
    seller.username.toLowerCase().includes(sellerSearchTerm.toLowerCase())
  );
  
  // Filtra serviços com base no termo de busca
  const filteredServices = services.filter((service: any) =>
    service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())
  );

  // Função para gerar as datas de vencimento com base na data do primeiro vencimento
  const generateInstallmentDates = (firstDate: Date, numberOfInstallments: number) => {
    const dates = [];
    dates.push(new Date(firstDate)); // A primeira data é a própria data fornecida
    
    for (let i = 1; i < numberOfInstallments; i++) {
      // Adiciona um mês para cada parcela subsequente
      dates.push(addMonths(new Date(firstDate), i));
    }
    
    return dates;
  };
  
  // Efeito para atualizar as datas de vencimento quando o número de parcelas muda
  useEffect(() => {
    const installmentsValue = form.getValues("installments");
    if (installmentsValue > 1) {
      const dates = generateInstallmentDates(firstDueDate, installmentsValue);
      setInstallmentDates(dates);
    } else {
      setInstallmentDates([]);
    }
  }, [form.watch("installments"), firstDueDate]);
  
  // Efeito para atualizar o formulário quando os itens e parcelas são carregados
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
        installments: sale.installments || 1, // Garante que tenha pelo menos 1 parcela
        notes: sale.notes,
        items: saleItems.map((item: SaleItem) => ({
          serviceId: item.serviceId,
          serviceTypeId: item.serviceTypeId,
          quantity: item.quantity,
          notes: item.notes,
          price: item.price,
          totalPrice: item.totalPrice,
          status: item.status || "pending"
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
      
      // Se temos um parcelamento, carregamos as datas de vencimento
      if (sale.installments > 1 && saleInstallments.length > 0) {
        // Ordenamos as parcelas por número da parcela
        const sortedInstallments = [...saleInstallments].sort((a: any, b: any) => a.installmentNumber - b.installmentNumber);
        
        // A primeira parcela define a data inicial de vencimento
        const firstInstallment = sortedInstallments.find((i: any) => i.installmentNumber === 1);
        if (firstInstallment) {
          setFirstDueDate(new Date(firstInstallment.dueDate));
        }
        
        // Carregamos todas as datas de vencimento das parcelas existentes
        const dates = sortedInstallments.map((installment: any) => new Date(installment.dueDate));
        setInstallmentDates(dates);
        
        console.log("Parcelas carregadas:", sortedInstallments.length);
      }
      
      formInitialized.current = true;
      console.log("Formulário inicializado com dados da venda e itens");
    }
  }, [sale, saleItems, saleInstallments, customers, users, form]);
  
  // Função para adicionar um item à venda
  const handleAddItem = () => {
    // Validação básica
    if (selectedServiceId <= 0) {
      toast({
        title: "Serviço não selecionado",
        description: "Selecione um serviço válido para adicionar",
        variant: "destructive",
      });
      return;
    }
    
    const serviceTypeId = form.getValues("serviceTypeId");
    if (!serviceTypeId || serviceTypeId <= 0) {
      toast({
        title: "Tipo de serviço não selecionado",
        description: "Selecione um tipo de execução válido antes de adicionar itens",
        variant: "destructive",
      });
      return;
    }
    
    // Adiciona o serviço (sem preço individual)
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
    
    toast({
      title: "Item adicionado",
      description: "Item adicionado com sucesso à venda",
    });
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
      
      // Calcula o valor de cada parcela com base no valor total e número de parcelas
      const totalAmountValue = parseFloat(data.totalAmount?.replace(',', '.') || "0");
      const installmentValueCalculated = data.installments > 1 
        ? (totalAmountValue / data.installments).toFixed(2) 
        : null;
      
      // Formato ISO para data que será corretamente processado pelo servidor
      // Também converte o formato de número brasileiro (com vírgula) para o formato com ponto
      // Verificamos e convertemos, de forma MUITO cuidadosa, o número de parcelas
      const rawInstallmentsValue = data.installments;
      let parsedInstallments = 1; // Padrão para evitar problemas
      
      console.log(`🔧 CORREÇÃO - Valor bruto de parcelas: [${rawInstallmentsValue}], tipo: ${typeof rawInstallmentsValue}`);
      
      // Forçar a conversão para número
      if (typeof rawInstallmentsValue === 'number') {
        parsedInstallments = Number(rawInstallmentsValue);
      } else if (typeof rawInstallmentsValue === 'string') {
        parsedInstallments = Number(parseInt(rawInstallmentsValue, 10));
      }
      
      // SUPER GARANTIA de valor válido
      if (isNaN(parsedInstallments) || parsedInstallments < 1) {
        parsedInstallments = 1;
        console.log(`⚠️ ALERTA DE SEGURANÇA - Valor de parcelas inválido detectado e corrigido para 1`);
      }
      
      console.log(`✅ CORREÇÃO FINAL - Número de parcelas após validação: ${parsedInstallments}, tipo: ${typeof parsedInstallments}`);
      
      // Forçar que seja um número inteiro explicitamente, com Number()
      const finalInstallmentsNumber = Number(parsedInstallments);
      console.log(`✅ CORREÇÃO FINAL - Valor numérico final: ${finalInstallmentsNumber}, tipo: ${typeof finalInstallmentsNumber}`);
      
      // Garantia absoluta de que é um número válido
      const installmentsToSend = isNaN(finalInstallmentsNumber) ? 1 : finalInstallmentsNumber;
      
      const formattedData = {
        ...data,
        date: data.date instanceof Date ? data.date.toISOString() : data.date,
        totalAmount: data.totalAmount ? data.totalAmount.replace(',', '.') : "0",
        // SOLUÇÃO DEFINITIVA: Garantir que installments seja um número com várias camadas de segurança
        installments: installmentsToSend,
        // Calculamos o valor da parcela com base no valor total e número de parcelas
        installmentValue: installmentValueCalculated,
      };
      
      // Log especial para verificação final antes do envio
      console.log(`✅ VERIFICAÇÃO FINAL:
      - Número de parcelas original: ${data.installments}, tipo: ${typeof data.installments}
      - Número de parcelas processado: ${installmentsToSend}, tipo: ${typeof installmentsToSend}
      - Valor da parcela calculado: ${installmentValueCalculated}
      `);
      
      console.log("Debug - Dados formatados a serem enviados:", JSON.stringify(formattedData, null, 2));
      
      // SUPER CORREÇÃO V2: Garantir que as datas de parcelas sejam enviadas 
      // Forçar a geração das datas para qualquer número de parcelas maior que zero
      let installmentDatesToSend = installmentDates;
      
      // Independente do número de parcelas, sempre enviamos as datas
      // Se não temos datas suficientes ou nenhuma data, geramos novas
      if (installmentDatesToSend.length !== data.installments) {
        console.log("⚠️ CORREÇÃO V2: Número de datas não corresponde ao número de parcelas!");
        const firstDate = firstDueDate || new Date(); // Usa a data selecionada ou a atual
        installmentDatesToSend = generateInstallmentDates(firstDate, data.installments);
        console.log(`⚠️ CORREÇÃO V2: Geradas ${installmentDatesToSend.length} novas datas para ${data.installments} parcelas`);
      }
      
      // 🛑🛑🛑 SUPER CORREÇÃO - 26/04/2025
      // Verificação extrema do tipo e valor das parcelas
      console.log("🔄 CORREÇÃO EXTREMA - Seleção de parcelas alterada para:", data.installments, "tipo:", typeof data.installments);
      
      // Forçar conversão para número inteiro
      const numInstalments = typeof data.installments === 'string' 
        ? parseInt(data.installments) 
        : (typeof data.installments === 'number' ? Math.floor(data.installments) : 1);
        
      console.log("🔄 CORREÇÃO EXTREMA - Valor após processamento:", numInstalments, "tipo:", typeof numInstalments);
      
      // Aplicar o valor correto diretamente no form data
      formattedData.installments = numInstalments;
      
      console.log("🔄 VERIFICAÇÃO CRÍTICA - Valor atual no form:", formattedData.installments, "tipo:", typeof formattedData.installments);
      
      // Verificação final para garantir consistência
      console.log("🔄 DADOS FINAIS DO FORMULÁRIO:", "Parcelas:", data.installments, "Tipo esperado:", "number", "Valor atual no form:", formattedData.installments, "Tipo atual no form:", typeof formattedData.installments);
      
      // 🛑 GERAÇÃO DE DATAS DE PARCELAS - Forçar a criação correta
      // Garantir que temos exatamente o número certo de datas para as parcelas
      const requiredInstallments = numInstalments;
      const installmentDates = [];
      
      // Gerar datas para cada parcela (independente do que foi selecionado na interface)
      const baseDate = new Date();
      for (let i = 0; i < requiredInstallments; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(baseDate.getMonth() + i);
        installmentDates.push(dueDate);
      }
      
      console.log("🛑 SUPER CORREÇÃO - Geradas", installmentDates.length, "datas para", requiredInstallments, "parcelas");
      
      // Adiciona ao objeto diretamente como uma string para evitar problemas de tipagem
      formattedData.installmentDates = installmentDates.map(date => date.toISOString());
      
      const url = sale ? `/api/sales/${sale.id}` : "/api/sales";
      const method = sale ? "PATCH" : "POST";
      
      // Log para debug do payload
      console.log("Payload completo da venda:", JSON.stringify(formattedData, null, 2));
      
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
      
      const savedSale = await response.json();
      
      // O frontend não vai mais criar as parcelas, essa responsabilidade é do backend
      // O frontend apenas envia o número de parcelas e as datas de vencimento
      console.log("Parcelas serão criadas pelo backend, evitando duplicação.");
      
      // Vamos verificar se as parcelas foram criadas corretamente
      if (data.installments > 1) {
        try {
          // Verificar se as parcelas foram criadas, apenas para debug
          const installmentsResponse = await fetch(`/api/sales/${savedSale.id}/installments`);
          const instalments = await installmentsResponse.json();
          console.log(`Parcelas da venda #${savedSale.id}:`, instalments.length);
        } catch (err) {
          console.error("Erro ao verificar parcelas:", err);
        }
      }
      
      return savedSale;
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
    try {
      // Logs detalhados para debug
      console.log("Formulário validado com sucesso!");
      console.log("Valores do formulário:", values);
      console.log("Número de itens:", values.items.length);
      
      // Verificação adicional do número de parcelas antes do envio
      console.log("⚠️ IMPORTANTE! Verificando número de parcelas no onSubmit:", values.installments);
      console.log("⚠️ Tipo do valor de parcelas:", typeof values.installments);
      
      // Verificação completa dos campos
      if (!values.orderNumber) {
        toast({
          title: "Número de OS obrigatório",
          description: "Por favor, preencha o número da OS",
          variant: "destructive",
        });
        return;
      }
      
      if (values.customerId <= 0) {
        toast({
          title: "Cliente não selecionado",
          description: "Selecione um cliente válido",
          variant: "destructive",
        });
        return;
      }
      
      if (values.sellerId <= 0) {
        toast({
          title: "Vendedor não selecionado",
          description: "Selecione um vendedor válido",
          variant: "destructive",
        });
        return;
      }
      
      if (values.items.length === 0) {
        toast({
          title: "Nenhum item adicionado",
          description: "Adicione pelo menos um item à venda",
          variant: "destructive",
        });
        return;
      }
      
      // CORREÇÃO CRÍTICA: Garante que o número de parcelas seja sempre um número inteiro válido
      // Este campo está sendo processado incorretamente no servidor, por isso estamos realizando
      // múltiplas validações e logs para diagnóstico do problema
      
      // SOLUÇÃO DEFINITIVA PARA PARCELAS
      console.log("🔴 SUPER-SOLUÇÃO INICIADA PARA PARCELAS 🔴");
      
      // Vamos FORÇAR um valor padrão seguro
      let validatedInstallments = 1; // Valor padrão absolutamente seguro
      const rawInstallments = values.installments;
      
      console.log("🔴 DIAGNÓSTICO DE PARCELAS 🔴");
      console.log("🔴 VALOR ORIGINAL:", rawInstallments);
      console.log("🔴 TIPO DO VALOR:", typeof rawInstallments);
      console.log("🔴 REPRESENTAÇÃO JSON:", JSON.stringify(rawInstallments));
      console.log("🔴 VALORES DISPONÍVEIS NO FORM:", form.getValues());
      
      // Nova abordagem ultra-agressiva para garantir um valor
      // Se não temos valor explícito no formulário, vamos buscar em outros lugares
      if (rawInstallments === undefined || rawInstallments === null) {
        console.log("🔴 ERRO CRÍTICO: Valor de parcelas ausente, implementando soluções alternativas");
        
        // Solução #1: Verificar o campo diretamente via DOM
        try {
          const selectInstallments = document.querySelector('select[name="installments"]');
          if (selectInstallments) {
            const domValue = (selectInstallments as HTMLSelectElement).value;
            console.log("🔴 SOLUÇÃO #1: Valor encontrado via DOM:", domValue);
            const parsedValue = parseInt(domValue, 10);
            if (!isNaN(parsedValue) && parsedValue > 0) {
              validatedInstallments = parsedValue;
              console.log("🔴 CORRIGIDO VIA DOM:", validatedInstallments);
            }
          }
        } catch (e) {
          console.error("🔴 Erro ao acessar DOM:", e);
        }
        
        // Solução #2: Verificar as datas de parcelas
        if (installmentDates && installmentDates.length > 0) {
          console.log("🔴 SOLUÇÃO #2: Usando número de datas de parcelas:", installmentDates.length);
          validatedInstallments = Math.max(installmentDates.length, 1);
        }
        
        // Solução #3: Verificar a última seleção conhecida do usuário
        const selectedInField = field => {
          try {
            const selectElement = document.getElementById(field) as HTMLSelectElement;
            return selectElement ? selectElement.value : null;
          } catch (e) {
            return null;
          }
        };
        
        // Força a definição do valor no formulário para evitar problemas
        // Esta é uma medida extrema de segurança
        form.setValue("installments", validatedInstallments, { shouldValidate: true });
        console.log("🔴 VALOR FORÇADO NO FORMULÁRIO:", validatedInstallments);
      } else {
        // Processamento normal se tivermos um valor
        if (typeof rawInstallments === 'number') {
          validatedInstallments = Math.floor(rawInstallments);
          console.log("🔴 CONVERSÃO DIRETA: Numérico para inteiro =", validatedInstallments);
        } else if (typeof rawInstallments === 'string') {
          const parsed = parseInt(rawInstallments, 10);
          if (!isNaN(parsed)) {
            validatedInstallments = parsed;
            console.log("🔴 CONVERSÃO: String para inteiro =", validatedInstallments);
          } else {
            console.log("🔴 ERRO DE CONVERSÃO: String inválida:", rawInstallments);
          }
        } else {
          console.log("🔴 TIPO INESPERADO:", typeof rawInstallments);
        }
      }
      
      // Garantir valor mínimo válido
      if (validatedInstallments < 1) {
        validatedInstallments = 1;
        console.log("⚠️ VALOR MENOR QUE 1, corrigido para:", validatedInstallments);
      }
      
      // Garantir que parcelas só pode ser um número inteiro (não decimal)
      validatedInstallments = Math.floor(validatedInstallments);
      
      console.log("⚠️ VALOR FINAL DE PARCELAS:", validatedInstallments);
      console.log("⚠️ TIPO FINAL:", typeof validatedInstallments);
      console.log("-------- FIM DA VALIDAÇÃO DE PARCELAS --------");
      
      // CORREÇÃO CRÍTICA: Trata e valida todos os campos numéricos para garantir tipos corretos
      // Objeto para envio ao servidor com valores convertidos e validados
      const correctedValues = {
        ...values,
        // Garante que o número da OS esteja definido
        orderNumber: values.orderNumber.trim() || `OS-${Date.now()}`,
        // Garante que a data seja válida
        date: values.date || new Date(),
        // Garante que o valor total esteja sempre no formato correto (ponto, não vírgula)
        totalAmount: values.totalAmount ? values.totalAmount.replace(',', '.') : "0",
        // CORREÇÃO CRÍTICA: A propriedade installments deve ser explicitamente um número inteiro
        // Observe que estamos usando validatedInstallments diretamente e não values.installments
        installments: Number(validatedInstallments),
        // Também garantimos que qualquer valor de parcela seja formato corretamente
        installmentValue: values.installmentValue ? String(values.installmentValue).replace(',', '.') : null,
        // Corrige os itens
        items: values.items.map(item => ({
          ...item,
          serviceTypeId: values.serviceTypeId, // Usa o serviceTypeId da venda para todos os itens
          quantity: Number(item.quantity) || 1 // Garante que quantidade seja número
        }))
      };
      
      console.log("Valores corrigidos:", correctedValues);
      console.log("Itens da venda corrigidos:", JSON.stringify(correctedValues.items, null, 2));
      
      // Chama a mutação para salvar a venda com os valores corrigidos
      console.log("Chamando saveMutation...");
      saveMutation.mutate(correctedValues);
    } catch (error) {
      console.error("Erro ao enviar formulário:", error);
      toast({
        title: "Erro ao processar formulário",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    }
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

  // Log para debug
  console.log('SaleDialog renderizado, open =', open, 'sale =', sale ? sale.id : null);

  // Se não estiver aberto, não renderizar o conteúdo para evitar problemas de performance
  if (!open) {
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={(isOpen) => {
      console.log('Dialog onOpenChange: ', isOpen);
      if (!isOpen) onClose();
    }}>
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
                        placeholder="CPF ou CNPJ sem pontuação"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end mt-4 gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setShowNewCustomerForm(false)}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCreateCustomer}
                      disabled={createCustomerMutation.isPending}
                    >
                      {createCustomerMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando...
                        </>
                      ) : (
                        "Criar Cliente"
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Vendedor */}
              <FormField
                control={form.control}
                name="sellerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Vendedor
                    </FormLabel>
                    <div className="relative">
                      <Popover
                        open={showSellerPopover}
                        onOpenChange={(open) => {
                          setShowSellerPopover(open);
                          if (!open && !field.value) {
                            setSellerSearchTerm("");
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
                              placeholder="Buscar vendedor"
                              value={sellerSearchTerm}
                              onValueChange={(value) => setSellerSearchTerm(value)}
                              className="border-none focus:ring-0"
                            />
                            <CommandList>
                              <CommandEmpty className="py-6 text-center">
                                Nenhum vendedor encontrado
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
                                  >
                                    <div className="flex items-center">
                                      <span>{seller.username}</span>
                                      <Badge variant="secondary" className="ml-2 text-xs">
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
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              
              {/* Valor Total */}
              <FormField
                control={form.control}
                name="totalAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Valor Total
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="0,00" 
                        {...field} 
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
                    <FormLabel className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      Parcelas
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        console.log("🔄 CORREÇÃO EXTREMA - Seleção de parcelas alterada para:", value, "tipo:", typeof value);
                        
                        // HIPER-CORREÇÃO - Garantia absoluta de que teremos um número inteiro válido
                        let numParcelas = 1; // Valor padrão super-seguro
                        
                        try {
                          // Converter para número com verificações múltiplas
                          if (value) {
                            const tempValue = parseInt(value, 10);
                            if (!isNaN(tempValue) && tempValue > 0) {
                              numParcelas = tempValue;
                            }
                          }
                        } catch (error) {
                          console.error("🔄 ERRO NA CONVERSÃO:", error);
                        }
                        
                        // Garantia absoluta de que é um número inteiro (não string)
                        console.log("🔄 CORREÇÃO EXTREMA - Valor após processamento:", numParcelas, "tipo:", typeof numParcelas);
                        
                        // MUDANÇA CRÍTICA: Garante que o número de parcelas seja definitivamente um número!
                        // Define o valor no campo como NUMBER, não string
                        field.onChange(numParcelas);
                        
                        // HIPER-VALIDAÇÃO: Verifica se realmente foi salvo como número
                        const valorAtual = form.getValues("installments");
                        console.log("🔄 VERIFICAÇÃO CRÍTICA - Valor atual no form:", valorAtual, "tipo:", typeof valorAtual);
                        
                        // Se por algum motivo ainda estiver como string, força novamente como número
                        if (typeof valorAtual === 'string') {
                          console.log("🔄 ALERTA MÁXIMO! Ainda é string, forçando novamente como número");
                          form.setValue("installments", numParcelas, { shouldValidate: true });
                        }
                        
                        // Log detalhado para debug
                        console.log(
                          "🔄 DADOS FINAIS DO FORMULÁRIO:",
                          "Parcelas:", numParcelas,
                          "Tipo esperado:", typeof numParcelas,
                          "Valor atual no form:", form.getValues("installments"),
                          "Tipo atual no form:", typeof form.getValues("installments")
                        );
                        
                        // Força atualização das datas de parcelas
                        if (firstDueDate) {
                          // Criar datas de vencimento baseadas no número de parcelas selecionado
                          const novasDatas = generateInstallmentDates(firstDueDate, numParcelas);
                          setInstallmentDates(novasDatas);
                          console.log(`🛑 SUPER CORREÇÃO - Geradas ${novasDatas.length} datas para ${numParcelas} parcelas`);
                        }
                      }}
                      value={field.value ? String(field.value) : "1"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((parcela) => (
                          <SelectItem key={parcela} value={String(parcela)}>
                            {parcela === 1 ? 'À vista' : `${parcela}x`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Datas de vencimento */}
            {form.watch("installments") > 1 && (
              <div className="mt-4 border rounded-md p-4 bg-muted/20">
                <div className="mb-4">
                  <h3 className="text-lg font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Datas de Vencimento
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure as datas de vencimento para cada parcela
                  </p>
                </div>
                
                <div className="mb-4">
                  <FormLabel className="text-sm">Primeira data de vencimento</FormLabel>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="DD/MM/AAAA"
                        value={firstDueDate ? format(firstDueDate, "dd/MM/yyyy") : ""}
                        onChange={(e) => {
                          try {
                            // Tentar converter a string para data
                            const parts = e.target.value.split('/');
                            if (parts.length === 3) {
                              const day = parseInt(parts[0]);
                              const month = parseInt(parts[1]) - 1; // Mês em JS é 0-indexed
                              const year = parseInt(parts[2]);
                              
                              if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                const newDate = new Date(year, month, day);
                                
                                if (isValid(newDate)) {
                                  setFirstDueDate(newDate);
                                  // Atualiza todas as datas de vencimento quando a primeira muda
                                  const newDates = generateInstallmentDates(newDate, form.getValues("installments"));
                                  setInstallmentDates(newDates);
                                }
                              }
                            }
                          } catch (error) {
                            console.error("Erro ao converter data:", error);
                          }
                        }}
                        className="w-36"
                      />
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="h-9 px-2">
                            <Calendar className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={firstDueDate}
                            onSelect={(date) => {
                              if (date) {
                                setFirstDueDate(date);
                                // Atualiza todas as datas de vencimento quando a primeira muda
                                const newDates = generateInstallmentDates(date, form.getValues("installments"));
                                setInstallmentDates(newDates);
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <span className="text-sm text-muted-foreground">
                      As demais datas serão calculadas inicialmente, mas podem ser editadas individualmente
                    </span>
                  </div>
                </div>
                
                {installmentDates.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parcela</TableHead>
                        <TableHead>Data de Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Calendário</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {installmentDates.map((date, index) => {
                        const installmentAmount = form.getValues("totalAmount") 
                          ? (parseFloat(form.getValues("totalAmount").replace(",", ".")) / installmentDates.length).toFixed(2)
                          : "0.00";
                        
                        return (
                          <TableRow key={index}>
                            <TableCell>{index + 1}ª parcela</TableCell>
                            <TableCell>
                              <Input
                                type="text"
                                size={10}
                                placeholder="DD/MM/AAAA"
                                defaultValue={format(date, "dd/MM/yyyy")}
                                onChange={(e) => {
                                  try {
                                    // Tentar converter a string para data
                                    const parts = e.target.value.split('/');
                                    if (parts.length === 3) {
                                      const day = parseInt(parts[0]);
                                      const month = parseInt(parts[1]) - 1; // Mês em JS é 0-indexed
                                      const year = parseInt(parts[2]);
                                      
                                      if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                                        const newDate = new Date(year, month, day);
                                        
                                        if (isValid(newDate)) {
                                          // Atualiza apenas a data específica dessa parcela
                                          const newDates = [...installmentDates];
                                          newDates[index] = newDate;
                                          setInstallmentDates(newDates);
                                        }
                                      }
                                    }
                                  } catch (error) {
                                    console.error("Erro ao converter data:", error);
                                  }
                                }}
                                className="w-28"
                              />
                            </TableCell>
                            <TableCell>R$ {installmentAmount.replace(".", ",")}</TableCell>
                            <TableCell>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm" className="h-9 px-2">
                                    <Calendar className="h-4 w-4" />
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={date}
                                    onSelect={(newDate) => {
                                      if (newDate) {
                                        // Atualiza apenas a data específica dessa parcela
                                        const newDates = [...installmentDates];
                                        newDates[index] = newDate;
                                        setInstallmentDates(newDates);
                                      }
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
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
                      placeholder="Observações adicionais sobre a venda"
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Seção de Itens */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Itens da Venda</h3>
              </div>
              
              {/* Busca de serviços e adição por busca dinâmica */}
              <div className="flex flex-col md:flex-row gap-4 items-end mb-4">
                <div className="flex-1">
                  <FormLabel className="text-xs mb-1.5 block">Buscar Serviço</FormLabel>
                  <div className="relative">
                    <Popover
                      open={showServicePopover}
                      onOpenChange={(open) => {
                        setShowServicePopover(open);
                        if (!open && selectedServiceId === 0) {
                          setServiceSearchTerm("");
                        }
                      }}
                    >
                      <PopoverTrigger asChild>
                        <div className="relative w-full">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Digite o nome do serviço"
                            value={serviceSearchTerm}
                            onChange={(e) => {
                              setServiceSearchTerm(e.target.value);
                              setShowServicePopover(true);
                            }}
                            className="pl-9 pr-4"
                            onClick={() => setShowServicePopover(true)}
                          />
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] max-h-[300px] overflow-y-auto">
                        <Command>
                          <CommandInput 
                            id="service-search-input"
                            placeholder="Buscar serviço"
                            value={serviceSearchTerm}
                            onValueChange={(value) => {
                              setServiceSearchTerm(value);
                            }}
                            onKeyDown={(e) => {
                              // Navegar diretamente para CommandItem ao pressionar seta para baixo
                              if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                const firstItem = document.querySelector('[cmdk-item]') as HTMLElement;
                                if (firstItem) {
                                  firstItem.focus();
                                }
                              }
                              // Fechar o popover e voltar ao input principal se pressionar Escape
                              else if (e.key === 'Escape') {
                                setShowServicePopover(false);
                              }
                            }}
                            className="border-none focus:ring-0"
                          />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center">
                              Nenhum serviço encontrado
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
                                    
                                    // Foco automático no campo de quantidade após selecionar o serviço
                                    setTimeout(() => {
                                      const quantityInput = document.getElementById('service-quantity');
                                      if (quantityInput) {
                                        quantityInput.focus();
                                      }
                                    }, 100);
                                  }}
                                  onKeyDown={(e) => {
                                    // Pressionar Tab ou Enter neste item fechará o popover e avançará para o campo quantidade
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault();
                                      setSelectedServiceId(service.id);
                                      setServiceSearchTerm(service.name);
                                      setShowServicePopover(false);
                                      
                                      setTimeout(() => {
                                        const quantityInput = document.getElementById('service-quantity');
                                        if (quantityInput) {
                                          quantityInput.focus();
                                        }
                                      }, 100);
                                    }
                                  }}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">{service.name}</span>
                                    <span className="text-xs text-muted-foreground">{service.description}</span>
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
                </div>
                <div className="w-24">
                  <FormLabel className="text-xs mb-1.5 block">Quantidade</FormLabel>
                  <Input
                    id="service-quantity"
                    type="number"
                    min="1"
                    value={selectedServiceQuantity}
                    onChange={(e) => setSelectedServiceQuantity(parseInt(e.target.value) || 1)}
                    onKeyDown={(e) => {
                      // Pressionar Enter no campo de quantidade adiciona o item
                      if (e.key === 'Enter' && selectedServiceId > 0) {
                        e.preventDefault();
                        handleAddItem();
                        
                        // Reset e volta o foco para o campo de busca de serviço
                        setTimeout(() => {
                          setSelectedServiceId(0);
                          setSelectedServiceQuantity(1);
                          setServiceSearchTerm("");
                          
                          const serviceInput = document.getElementById('service-search-input');
                          if (serviceInput) {
                            serviceInput.focus();
                          }
                        }, 100);
                      }
                    }}
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleAddItem}
                  disabled={selectedServiceId === 0}
                  size="sm"
                  className="h-10"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Incluir
                </Button>
              </div>
              
              {/* Lista de itens adicionados */}
              <div className="rounded-md border">
                <div className="bg-muted py-2 px-4 text-sm font-medium grid grid-cols-12 gap-4">
                  <div className="col-span-8">Serviço</div>
                  <div className="col-span-3">Qtd</div>
                  <div className="col-span-1"></div>
                </div>
                <div className="divide-y">
                  {fields.length === 0 ? (
                    <div className="py-4 px-4 text-center text-muted-foreground">
                      Nenhum item adicionado à venda
                    </div>
                  ) : (
                    fields.map((field, index) => {
                      const serviceId = form.getValues(`items.${index}.serviceId`);
                      const service = services.find((s: any) => s.id === serviceId);
                      
                      return (
                        <div key={field.id} className="py-2 px-4 grid grid-cols-12 gap-4 items-center text-sm">
                          <div className="col-span-8">
                            {service ? service.name : "Serviço não encontrado"}
                          </div>
                          <div className="col-span-3">
                            <Input
                              type="number"
                              min="1"
                              {...form.register(`items.${index}.quantity`, { valueAsNumber: true })}
                              className="h-8"
                              onKeyDown={(e) => {
                                // Ao pressionar Enter no campo de quantidade de um item já adicionado
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  // Foca no campo de busca de serviço se for o último item
                                  if (index === fields.length - 1) {
                                    const serviceInput = document.getElementById('service-search-input');
                                    if (serviceInput) {
                                      serviceInput.focus();
                                    }
                                  } else {
                                    // Senão, foca no próximo campo de quantidade
                                    const nextInput = document.querySelector(`input[name="items.${index + 1}.quantity"]`) as HTMLInputElement;
                                    if (nextInput) {
                                      nextInput.focus();
                                    }
                                  }
                                }
                              }}
                            />
                          </div>
                          <div className="col-span-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-8 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  console.log("Botão Cancelar clicado");
                  onClose();
                }}
              >
                Cancelar
              </Button>
              
              {/* Botão para salvar vendas */}
              <Button
                type="button"
                className="bg-green-600 hover:bg-green-700"
                onClick={(e) => {
                  e.preventDefault();
                  console.log("Botão alternativo clicado - Modo direto");
                  
                  const values = form.getValues();
                  console.log("Valores originais:", values);
                  
                  // Verifica campos críticos
                  if (!values.customerId || values.customerId <= 0) {
                    toast({
                      title: "Cliente obrigatório",
                      description: "Selecione um cliente válido",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (!values.serviceTypeId || values.serviceTypeId <= 0) {
                    toast({
                      title: "Tipo de execução obrigatório",
                      description: "Selecione um tipo de execução válido",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (!values.items || values.items.length === 0) {
                    toast({
                      title: "Itens obrigatórios",
                      description: "Adicione pelo menos um item à venda",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // Obter o número correto de parcelas
                  const numberOfInstallments = Number(values.installments) || 1;
                  
                  // CORREÇÃO CRÍTICA: Usar as datas das parcelas editadas pelo usuário
                  const datesForApi: string[] = [];
                  
                  // Verificar se temos o número correto de datas para as parcelas
                  if (installmentDates.length === numberOfInstallments) {
                    // Usar as datas exatas que o usuário editou na interface
                    console.log("✓ Usando datas específicas editadas pelo usuário");
                    for (let i = 0; i < numberOfInstallments; i++) {
                      datesForApi.push(installmentDates[i].toISOString());
                    }
                  } else {
                    // Se não tivermos o número correto de datas (caso raro), gerar automaticamente
                    console.log("⚠️ Gerando datas automaticamente porque o número não corresponde");
                    const currentDate = new Date();
                    for (let i = 0; i < numberOfInstallments; i++) {
                      const dueDate = new Date(currentDate);
                      dueDate.setMonth(currentDate.getMonth() + i);
                      datesForApi.push(dueDate.toISOString());
                    }
                  }
                  
                  // Log para debug
                  console.log(`🔄 VERIFICANDO DATAS DE PARCELAS:
                  - Parcelas solicitadas: ${numberOfInstallments}
                  - Datas armazenadas na interface: ${installmentDates.length}
                  - Datas a serem enviadas: ${datesForApi.length}
                  `);
                  
                  // Verificar se o usuário forneceu um número de ordem ou se precisa gerar um
                  // CORREÇÃO CRÍTICA: Usar o número da ordem definido pelo usuário
                  let orderNumberToUse = values.orderNumber;
                  
                  // Apenas se o campo estiver vazio, gerar um número automático
                  if (!orderNumberToUse || orderNumberToUse.trim() === '') {
                    orderNumberToUse = `OS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
                    console.log("⚠️ Número de ordem não fornecido, gerando automaticamente:", orderNumberToUse);
                  } else {
                    console.log("✓ Usando número de ordem fornecido pelo usuário:", orderNumberToUse);
                  }
                  
                  // Monta o objeto manualmente ignorando a validação do Zod
                  const saleData = {
                    // CORREÇÃO CRÍTICA: Usar o número da ordem definido pelo usuário
                    orderNumber: orderNumberToUse,
                    date: values.date || new Date(),
                    customerId: values.customerId,
                    paymentMethodId: values.paymentMethodId || 1,
                    serviceTypeId: values.serviceTypeId,
                    sellerId: values.sellerId || user?.id,
                    totalAmount: values.totalAmount ? values.totalAmount.replace(",", ".") : "0",
                    notes: values.notes || "",
                    // CORREÇÃO CRÍTICA: Incluir o número de parcelas (installments)
                    installments: numberOfInstallments,
                    // CORREÇÃO CRÍTICA: Usar as datas efetivamente editadas pelo usuário
                    installmentDates: datesForApi,
                    items: values.items.map(item => ({
                      serviceId: item.serviceId,
                      serviceTypeId: values.serviceTypeId, // Usa o serviceTypeId da venda
                      quantity: item.quantity || 1,
                      price: "0", // Preço unitário fixado em zero
                      totalPrice: "0", // Preço total do item fixado em zero - só usamos o valor total da venda
                      status: "pending",
                      notes: item.notes || ""
                    }))
                  };
                  
                  // Debug adicional para certificar que o número de parcelas está sendo enviado
                  console.log("🔎 VERIFICAÇÃO DE PARCELAS:", {
                    valorOriginal: values.installments,
                    tipoOriginal: typeof values.installments,
                    valorProcessado: Number(values.installments) || 1,
                    tipoProcessado: typeof (Number(values.installments) || 1)
                  });
                  
                  console.log("Dados de venda preparados:", saleData);
                  
                  // Chama diretamente a API para salvar a venda
                  setIsSubmitting(true);
                  fetch("/api/sales", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(saleData),
                  })
                    .then(response => {
                      if (!response.ok) {
                        throw new Error("Erro ao salvar venda");
                      }
                      return response.json();
                    })
                    .then(data => {
                      console.log("Venda salva com sucesso:", data);
                      
                      // SOLUÇÃO ESPECIAL: Verificar se o valor total foi salvo corretamente
                      // Se não foi, vamos atualizá-lo usando a rota especial
                      if (data && data.id && 
                          (data.totalAmount === "0" || data.totalAmount === "0.00" || !data.totalAmount) && 
                          saleData.totalAmount && saleData.totalAmount !== "0" && saleData.totalAmount !== "0.00") {
                        
                        console.log(`Valor total da venda não foi salvo corretamente. Atualizando usando rota especial...`);
                        console.log(`Valor atual: ${data.totalAmount}, Valor esperado: ${saleData.totalAmount}`);
                        
                        // Chamar API especial para atualizar o valor total
                        fetch(`/api/sales/${data.id}/update-total`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ totalAmount: saleData.totalAmount }),
                        })
                          .then(response => {
                            if (!response.ok) {
                              console.error("Erro ao atualizar valor total:", response.statusText);
                              return;
                            }
                            return response.json();
                          })
                          .then(updatedSale => {
                            console.log("Valor total atualizado com sucesso:", updatedSale);
                            // Atualizar o cache para refletir o novo valor
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
                      onSaveSuccess();
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
                }}
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