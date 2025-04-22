import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { insertServiceSchema, Service } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { Switch } from "@/components/ui/switch";

// Estender o schema para adicionar validação personalizada
const serviceFormSchema = insertServiceSchema.extend({
  name: z.string()
    .min(3, "Nome do serviço precisa ter pelo menos 3 caracteres")
    .max(100, "Nome do serviço não pode ter mais de 100 caracteres"),
  description: z.string().optional(),
  price: z.string()
    .min(1, "Preço é obrigatório")
    .regex(/^\d+(\.\d{1,2})?$/, "Preço deve ser um número válido (ex: 100.00)"),
  duration: z.coerce.number()
    .min(1, "Duração deve ser pelo menos 1 minuto")
    .max(1440, "Duração máxima é de 1440 minutos (24 horas)")
    .optional(),
  active: z.boolean().default(true),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceDialogProps {
  open: boolean;
  onClose: () => void;
  service: Service | null;
  onSaveSuccess: () => void;
}

export default function ServiceDialog({
  open,
  onClose,
  service,
  onSaveSuccess,
}: ServiceDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isNewService = !service;

  // Configurar formulário com valores padrão
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name || "",
      description: service?.description || "",
      price: service?.price || "",
      duration: service?.duration || undefined,
      active: service?.active !== undefined ? service.active : true,
    },
  });

  // Reset do formulário quando o serviço muda
  useState(() => {
    if (open) {
      form.reset({
        name: service?.name || "",
        description: service?.description || "",
        price: service?.price || "",
        duration: service?.duration || undefined,
        active: service?.active !== undefined ? service.active : true,
      });
    }
  });

  // Criar um novo serviço
  const createService = async (data: ServiceFormValues) => {
    try {
      setIsSubmitting(true);
      const res = await apiRequest("POST", "/api/services", data);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao criar serviço");
      }

      toast({
        title: "Sucesso",
        description: "Serviço criado com sucesso",
      });
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao criar serviço:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao criar serviço",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Atualizar um serviço existente
  const updateService = async (id: number, data: ServiceFormValues) => {
    try {
      setIsSubmitting(true);
      const res = await apiRequest("PUT", `/api/services/${id}`, data);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao atualizar serviço");
      }

      toast({
        title: "Sucesso",
        description: "Serviço atualizado com sucesso",
      });
      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao atualizar serviço:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar serviço",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Processar o envio do formulário
  const onSubmit = (data: ServiceFormValues) => {
    if (isNewService) {
      createService(data);
    } else if (service) {
      updateService(service.id, data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isNewService ? "Novo Serviço" : "Editar Serviço"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do serviço</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome do serviço"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o serviço (opcional)"
                      disabled={isSubmitting}
                      className="h-24 resize-none"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        inputMode="decimal"
                        placeholder="99.90"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Duração"
                        disabled={isSubmitting}
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === "" ? undefined : parseInt(value, 10));
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Serviço ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Determina se o serviço está disponível para uso
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}