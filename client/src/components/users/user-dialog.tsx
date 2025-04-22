import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { User, insertUserSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

// Estendendo o schema de usuário para incluir a validação de senha
const userFormSchema = insertUserSchema.extend({
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres",
  }),
});

type UserFormValues = z.infer<typeof userFormSchema>;

interface UserDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onSaveSuccess: () => void;
}

export default function UserDialog({
  open,
  onClose,
  user,
  onSaveSuccess,
}: UserDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Configuração do formulário
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema.partial()),
    defaultValues: {
      username: user?.username || "",
      password: "",
      role: user?.role || "user",
    },
  });

  // Mutação para criar um novo usuário
  const createMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Usuário criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onSaveSuccess();
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Erro ao criar usuário:", error);
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar um usuário existente
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; user: Partial<UserFormValues> }) => {
      const res = await apiRequest(
        "PATCH",
        `/api/users/${data.id}`,
        data.user
      );
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Usuário atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onSaveSuccess();
      onClose();
      form.reset();
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar usuário:", error);
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormValues) => {
    setIsSubmitting(true);
    
    try {
      // Se não foi fornecida senha na edição, remova-a dos dados
      if (user && !data.password) {
        const { password, ...userData } = data;
        
        updateMutation.mutate({
          id: user.id,
          user: userData,
        });
      } else if (user) {
        // Atualizar usuário existente (com senha)
        updateMutation.mutate({
          id: user.id,
          user: data,
        });
      } else {
        // Criar novo usuário
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error("Erro ao processar o formulário:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {user ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome de usuário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {user ? "Senha (deixe em branco para manter a atual)" : "Senha"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={user ? "••••••" : "Digite a senha"}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Perfil de Acesso</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || "user"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um perfil" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">Usuário</SelectItem>
                      <SelectItem value="admin">Administrador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
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