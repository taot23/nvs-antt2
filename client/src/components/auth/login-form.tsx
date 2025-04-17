import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const loginSchema = z.object({
  username: z.string().min(1, "O email é obrigatório"),
  password: z.string().min(1, "A senha é obrigatória"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const { loginMutation } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate({
      username: values.username,
      password: values.password,
    }, {
      onSuccess: () => {
        onSuccess?.();
      }
    });
  };

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Bem-vindo de volta</h2>
        <p className="text-gray-600 mt-1">Faça login para continuar</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem className="relative">
                <FormLabel className={`absolute top-3 left-4 text-gray-500 pointer-events-none transition-all duration-200 ${
                  field.value ? "transform scale-85 -translate-y-5" : ""
                }`}>
                  Email
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className="h-14 pt-6 px-4"
                    autoComplete="username"
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
              <FormItem className="relative">
                <FormLabel className={`absolute top-3 left-4 text-gray-500 pointer-events-none transition-all duration-200 ${
                  field.value ? "transform scale-85 -translate-y-5" : ""
                }`}>
                  Senha
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      type={showPassword ? "text" : "password"}
                      className="h-14 pt-6 px-4 pr-10"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="remember-me"
                      />
                    </FormControl>
                    <label
                      htmlFor="remember-me"
                      className="text-sm text-gray-700 cursor-pointer"
                    >
                      Lembrar-me
                    </label>
                  </FormItem>
                )}
              />
            </div>

            <a
              href="#"
              className="text-sm font-medium text-primary hover:text-primary/90"
            >
              Esqueceu a senha?
            </a>
          </div>

          <Button
            type="submit"
            className="w-full h-12"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Entrando..." : "Entrar"}
          </Button>
        </form>
      </Form>
    </>
  );
}
