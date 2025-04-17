import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Customer, InsertCustomer, insertCustomerSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

// Estendendo o schema para adicionar validações adicionais
const customerFormSchema = insertCustomerSchema.extend({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  email: z.string().email("E-mail inválido"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato 000.000.000-00"),
  phone: z.string().regex(/^\(\d{2}\) \d{5}-\d{4}$/, "Telefone deve estar no formato (00) 00000-0000"),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

interface CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  customer: Customer | null;
  onSaveSuccess: () => void;
}

export default function CustomerDialog({
  open,
  onClose,
  customer,
  onSaveSuccess,
}: CustomerDialogProps) {
  const { toast } = useToast();
  const isEditing = !!customer;

  // Inicializar o formulário
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer ? {
      name: customer.name,
      email: customer.email,
      cpf: customer.cpf,
      phone: customer.phone,
    } : {
      name: "",
      email: "",
      cpf: "",
      phone: "",
    },
  });

  // Cadastrar novo cliente
  const createCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormValues) => {
      const res = await apiRequest("POST", "/api/customers", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente cadastrado",
        description: "O cliente foi cadastrado com sucesso.",
        variant: "default",
      });
      onSaveSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cadastrar cliente",
        description: error.message || "Não foi possível cadastrar o cliente.",
        variant: "destructive",
      });
    },
  });

  // Atualizar cliente existente
  const updateCustomerMutation = useMutation({
    mutationFn: async (data: { id: number; customer: CustomerFormValues }) => {
      const res = await apiRequest("PUT", `/api/customers/${data.id}`, data.customer);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Cliente atualizado",
        description: "O cliente foi atualizado com sucesso.",
        variant: "default",
      });
      onSaveSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Não foi possível atualizar o cliente.",
        variant: "destructive",
      });
    },
  });

  // Formatar os campos conforme o usuário digita
  const formatCPF = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    
    // Aplica a máscara: 000.000.000-00
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})/, "$1-$2")
      .replace(/(-\d{2})\d+?$/, "$1");
  };

  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, "");
    
    // Aplica a máscara: (00) 00000-0000
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  };

  // Handler para submit do formulário
  const onSubmit = (data: CustomerFormValues) => {
    if (isEditing && customer) {
      updateCustomerMutation.mutate({
        id: customer.id,
        customer: data,
      });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const isPending = createCustomerMutation.isPending || updateCustomerMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cliente" : "Novo Cliente"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input placeholder="email@exemplo.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="000.000.000-00" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(formatCPF(e.target.value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="(00) 00000-0000" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(formatPhone(e.target.value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}