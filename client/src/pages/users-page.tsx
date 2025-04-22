import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Pencil, Plus, Trash2, UserCog } from "lucide-react";
import UserDialog from "@/components/users/user-dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/use-auth";

export default function UsersPage() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Buscar lista de usuários
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) {
        throw new Error("Falha ao buscar usuários");
      }
      return res.json();
    },
  });

  // Filtrar usuários pelo termo de busca
  const filteredUsers = Array.isArray(users) ? users.filter((user: User) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  // Função para abrir o modal de edição
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  // Função para abrir o modal de exclusão
  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setIsDeleteDialogOpen(true);
  };

  // Função para excluir um usuário
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      const res = await apiRequest("DELETE", `/api/users/${userToDelete.id}`);
      
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
        toast({
          title: "Sucesso",
          description: "Usuário excluído com sucesso",
        });
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Erro ao excluir usuário");
      }
    } catch (error) {
      console.error("Erro ao excluir usuário:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir usuário",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  // Verifica se o usuário atual tem permissão para gerenciar usuários
  const hasPermission = currentUser?.role === "admin" || currentUser?.role === "supervisor";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários do sistema
          </p>
        </div>
        {hasPermission && (
          <Button onClick={() => {
            setSelectedUser(null);
            setIsDialogOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Usuário
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            Total de {filteredUsers.length} usuários cadastrados
          </CardDescription>
          <div className="flex justify-between pt-2">
            <div className="relative w-full max-w-sm">
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="w-[100px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Badge variant={
                            user.role === "admin" ? "default" : 
                            user.role === "supervisor" ? "destructive" :
                            user.role === "vendedor" ? "outline" :
                            user.role === "operacional" ? "secondary" : "secondary"
                          }>
                            {user.role === "admin" ? "Administrador" : 
                             user.role === "supervisor" ? "Supervisor" :
                             user.role === "vendedor" ? "Vendedor" :
                             user.role === "operacional" ? "Operacional" : "Usuário"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            {hasPermission && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(user)}
                                >
                                  <Pencil className="h-4 w-4" />
                                  <span className="sr-only">Editar</span>
                                </Button>
                                {currentUser?.id !== user.id && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteClick(user)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    <span className="sr-only">Excluir</span>
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de edição/criação */}
      <UserDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        user={selectedUser}
        onSaveSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/users"] })}
      />

      {/* Modal de confirmação de exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o usuário "{userToDelete?.username}"?
              <br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}