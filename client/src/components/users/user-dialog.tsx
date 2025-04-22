import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { User, InsertUser, insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";

// Schema extendido para formulário com validação
const userFormSchema = insertUserSchema.extend({
  id: z.number().optional(),
  confirmPassword: z.string().min(6, { message: "A senha deve ter pelo menos 6 caracteres" }),
  role: z.enum(["user", "admin"], {
    description: "Escolha o perfil do usuário",
    required_error: "Por favor, selecione um perfil"
  }).default("user")
}).refine((data) => {
  // Se tivermos um ID, provavelmente estamos editando e a senha pode estar vazia
  if (data.id && (!data.password || data.password.length === 0)) {
    return true;
  }
  // Caso contrário, verifique se as senhas coincidem
  return data.password === data.confirmPassword;
}, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
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
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  // Configuração do formulário com valores padrão
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      role: "user"
    }
  });

  // Atualizar o formulário quando o usuário mudar
  useEffect(() => {
    if (user) {
      form.reset({
        id: user.id,
        username: user.username,
        password: "", // Não mostrar a senha atual
        confirmPassword: "",
        role: user.role as "user" | "admin" || "user"
      });
    } else {
      form.reset({
        username: "",
        password: "",
        confirmPassword: "",
        role: "user"
      });
    }
  }, [user, form]);

  // Mutação para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormValues) => {
      // Remover campos que não são parte do schema de inserção
      const { confirmPassword, id, ...insertData } = data;
      const res = await apiRequest("POST", "/api/users", insertData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
        variant: "default",
      });
      onSaveSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário.",
        variant: "destructive",
      });
    }
  });

  // Mutação para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; user: Partial<UserFormValues> }) => {
      // Remover campos que não são parte do schema de atualização
      const { confirmPassword, ...updateData } = data.user;
      
      // Se a senha estiver vazia, remova-a do objeto de atualização
      if (!updateData.password) {
        delete updateData.password;
      }
      
      const res = await apiRequest("PATCH", `/api/users/${data.id}`, updateData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso.",
        variant: "default",
      });
      onSaveSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Não foi possível atualizar o usuário.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: UserFormValues) => {
    setLoading(true);
    
    try {
      if (user?.id) {
        // Atualizando usuário existente
        updateUserMutation.mutate({
          id: user.id,
          user: data
        });
      } else {
        // Criando novo usuário
        createUserMutation.mutate(data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Identifica se o usuário atual está editando seu próprio perfil
  const isEditingSelf = user?.id === currentUser?.id;

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
          <DialogDescription>
            {user 
              ? "Atualize as informações do usuário abaixo. Deixe a senha em branco para mantê-la inalterada." 
              : "Preencha as informações para criar um novo usuário."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Digite o nome de usuário" 
                      {...field} 
                      autoComplete="off"
                    />
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
                  <FormLabel>{user ? "Nova Senha (opcional)" : "Senha"}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={user ? "Deixe em branco para manter a senha atual" : "Digite a senha"} 
                      {...field} 
                      autoComplete="new-password"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{user ? "Confirme a Nova Senha" : "Confirme a Senha"}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirme a senha" 
                      {...field}
                      autoComplete="new-password" 
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
                <FormItem className="space-y-3">
                  <FormLabel>Perfil</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                      disabled={isEditingSelf} // Não permitir alterar o próprio perfil
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="user" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Usuário
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="admin" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Administrador
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                  {isEditingSelf && (
                    <p className="text-sm text-muted-foreground">
                      Você não pode alterar seu próprio perfil.
                    </p>
                  )}
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? "Salvando..." : user ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}