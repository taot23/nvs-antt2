import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { 
  Plus, Search, Edit, Trash2, 
  RefreshCw, ChevronUp, ChevronDown,
  User as UserIcon, Download, Filter, X,
  FileText, FileSpreadsheet, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import UserDialog from "../components/users/user-dialog";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";

export default function UsersPage() {
  console.log("Renderizando UsersPage");
  
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentUser2Edit, setCurrentUser2Edit] = useState<User | null>(null);
  
  // Estados para ordenação
  const [sortField, setSortField] = useState<string>("username");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Buscar usuários
  const { 
    data: users = [], 
    isLoading,
    isError,
    refetch
  } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include"
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Erro ${res.status}: ${errorText || res.statusText}`);
      }
      return res.json();
    }
  });

  // Função de ordenação
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Se o campo já está selecionado, inverte a direção
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Se é um novo campo, define-o como o campo de ordenação e começa com asc
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filtrar usuários pelo termo de busca
  const filteredUsers = users.filter(user => {
    return user.username.toLowerCase().includes(searchTerm.toLowerCase());
  })
  // Aplicar ordenação
  .sort((a, b) => {
    let aValue: any = a[sortField as keyof User];
    let bValue: any = b[sortField as keyof User];
    
    // Ordenação de string
    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortDirection === "asc" 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    // Ordenação de valores numéricos ou outros tipos
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });
  
  // Função para exportar para Excel
  const exportToExcel = () => {
    try {
      // Preparar dados para exportação - não incluir a senha
      const exportData = filteredUsers.map(user => ({
        'ID': user.id,
        'Usuário': user.username,
        'Perfil': user.role || 'Usuário'
      }));
      
      // Criar uma nova planilha
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Usuários");
      
      // Gerar arquivo e download
      XLSX.writeFile(workbook, "usuarios.xlsx");
      
      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados para Excel com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao exportar para Excel:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para Excel.",
        variant: "destructive",
      });
    }
  };
  
  // Função para exportar para PDF
  const exportToPDF = () => {
    try {
      // Criar novo documento PDF
      const doc = new jsPDF();
      
      // Adicionar título
      doc.setFontSize(18);
      doc.text("Relatório de Usuários", 14, 22);
      doc.setFontSize(11);
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
      
      // Preparar dados para a tabela
      const tableColumn = [
        "ID", 
        "Usuário", 
        "Perfil"
      ];
      
      const tableRows = filteredUsers.map(user => [
        user.id,
        user.username,
        user.role || 'Usuário'
      ]);
      
      // Adicionar tabela automática
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 40,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [41, 128, 185], textColor: 255 },
        alternateRowStyles: { fillColor: [240, 240, 240] },
        margin: { top: 40 },
      });
      
      // Salvar o PDF
      doc.save("usuarios.pdf");
      
      toast({
        title: "Exportação concluída",
        description: "Os dados foram exportados para PDF com sucesso.",
        variant: "default",
      });
    } catch (error) {
      console.error("Erro ao exportar para PDF:", error);
      toast({
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados para PDF.",
        variant: "destructive",
      });
    }
  };

  // Deletar usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Não foi possível excluir o usuário.",
        variant: "destructive",
      });
    }
  });

  const handleDelete = async (id: number) => {
    // Não permitir excluir o usuário atual
    if (id === currentUser?.id) {
      toast({
        title: "Operação não permitida",
        description: "Você não pode excluir seu próprio usuário.",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm("Tem certeza que deseja excluir este usuário?")) {
      deleteUserMutation.mutate(id);
    }
  };

  const handleEdit = (user: User) => {
    // Não enviar a senha para o formulário de edição
    const userWithoutPassword = { ...user, password: '' };
    setCurrentUser2Edit(userWithoutPassword as User);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentUser2Edit(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentUser2Edit(null);
  };

  const handleSaveSuccess = () => {
    setDialogOpen(false);
    setCurrentUser2Edit(null);
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Usuários</h1>
            <p className="text-gray-600 mt-1">Gerencie os usuários do sistema</p>
          </div>
          <div className="mt-4 sm:mt-0 flex">
            <Button 
              onClick={handleAdd}
              className="flex items-center w-full sm:w-auto justify-center py-2 px-4"
              style={{ WebkitAppearance: "none" }}
            >
              <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="whitespace-nowrap">Novo Usuário</span>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Buscar usuários..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ WebkitAppearance: "none" }}
                    spellCheck="false"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                  />
                </div>
                
                {/* Botões de exportação */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-9 gap-1"
                      disabled={filteredUsers.length === 0}
                    >
                      <Download className="h-4 w-4" />
                      <span className="hidden sm:inline">Exportar</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={exportToPDF} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      <span>Exportar para PDF</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportToExcel} className="cursor-pointer">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      <span>Exportar para Excel</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="flex items-center gap-2">
                {searchTerm && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSearchTerm("")}
                    className="h-9 gap-1"
                  >
                    <X className="h-4 w-4" />
                    <span className="hidden sm:inline">Limpar busca</span>
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => refetch()}
                  disabled={isLoading}
                  style={{ WebkitAppearance: "none" }}
                  className="w-9 h-9 flex items-center justify-center p-0"
                  title="Atualizar lista"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-600 text-sm leading-normal">
                <tr>
                  <th 
                    className="py-3 px-4 font-medium cursor-pointer"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center">
                      <span>ID</span>
                      {sortField === 'id' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="py-3 px-4 font-medium cursor-pointer"
                    onClick={() => handleSort('username')}
                  >
                    <div className="flex items-center">
                      <span>Usuário</span>
                      {sortField === 'username' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="py-3 px-4 font-medium">Perfil</th>
                  <th className="py-3 px-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="text-gray-600 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>Carregando usuários...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center">
                      Nenhum usuário encontrado. {searchTerm && "Tente usar outros termos de busca."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className={`border-t border-gray-100 hover:bg-gray-50 ${user.id === currentUser?.id ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 px-4">{user.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1.5 text-blue-600" />
                          <span>{user.username}</span>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="ml-2 px-2 py-0 text-xs">Você</Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="h-4 w-4 mr-1.5 text-purple-600" />
                              <span>Administrador</span>
                            </>
                          ) : (
                            <>
                              <UserIcon className="h-4 w-4 mr-1.5 text-gray-600" />
                              <span>Usuário</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(user)}
                            className="h-8 w-8"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(user.id)}
                            className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                            title="Excluir"
                            disabled={user.id === currentUser?.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* Modal de adicionar/editar usuário */}
      <UserDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        user={currentUser2Edit}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  );
}