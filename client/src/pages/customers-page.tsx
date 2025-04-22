import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Customer, InsertCustomer } from "@shared/schema";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { 
  Users, Home, Plus, Search, Edit, Trash2, 
  RefreshCw, ChevronLeft, ChevronRight, Building,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import CustomerDialog from "../components/customers/customer-dialog";

export default function CustomersPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);

  // Buscar clientes
  const { 
    data: customers = [], 
    isLoading,
    isError,
    refetch
  } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const res = await fetch("/api/customers");
      if (!res.ok) throw new Error("Falha ao carregar clientes");
      return res.json();
    }
  });

  // Filtrar clientes pelo termo de busca
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.document && customer.document.includes(searchTerm)) ||
    customer.phone.includes(searchTerm)
  );

  // Deletar cliente
  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
    }
  });

  const handleDelete = async (id: number) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      deleteCustomerMutation.mutate(id);
    }
  };

  const handleEdit = (customer: Customer) => {
    setCurrentCustomer(customer);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setCurrentCustomer(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentCustomer(null);
  };

  const handleSaveSuccess = () => {
    setDialogOpen(false);
    setCurrentCustomer(null);
    queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <div className="flex-grow flex">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 hidden md:block">
          <div className="p-4">
            <div className="text-sm font-medium text-gray-500 uppercase tracking-wider">
              Menu Principal
            </div>
            <nav className="mt-4 space-y-1">
              <div className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md group">
                <Home className="mr-3 h-5 w-5 text-gray-500" />
                <Link href="/">Início</Link>
              </div>
              <div className="flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-md group">
                <Users className="mr-3 h-5 w-5 text-gray-500" />
                <Link href="/clientes">Clientes</Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-semibold text-gray-800">Clientes</h1>
                <p className="text-gray-600 mt-1">Gerencie os cadastros de clientes</p>
              </div>
              <div className="mt-4 sm:mt-0 flex">
                <Button 
                  onClick={handleAdd}
                  className="flex items-center w-full sm:w-auto justify-center py-2 px-4"
                  style={{ WebkitAppearance: "none" }}
                >
                  <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">Novo Cliente</span>
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar clientes..."
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
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => refetch()}
                    disabled={isLoading}
                    style={{ WebkitAppearance: "none" }}
                    className="w-8 h-8 flex items-center justify-center p-0"
                    title="Atualizar lista"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {isError ? (
                <div className="p-8 text-center">
                  <p className="text-red-500 mb-4">Erro ao carregar os clientes</p>
                  <Button 
                    variant="outline" 
                    onClick={() => refetch()} 
                    style={{ WebkitAppearance: "none" }}
                    className="py-2 px-4"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    <span className="whitespace-nowrap">Tentar novamente</span>
                  </Button>
                </div>
              ) : isLoading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                  <p className="text-gray-500">Carregando clientes...</p>
                </div>
              ) : filteredCustomers.length === 0 ? (
                <div className="p-8 text-center">
                  {searchTerm ? (
                    <p className="text-gray-500">Nenhum cliente encontrado para "{searchTerm}"</p>
                  ) : (
                    <div>
                      <p className="text-gray-500 mb-4">Nenhum cliente cadastrado</p>
                      <Button 
                        onClick={handleAdd}
                        className="py-2 px-4"
                        style={{ WebkitAppearance: "none" }}
                      >
                        <Plus className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className="whitespace-nowrap">Adicionar Cliente</span>
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Nome/Razão Social
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Documento
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                          Telefone
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                                {customer.documentType === 'cpf' 
                                  ? <User className="h-4 w-4 text-gray-500" /> 
                                  : <Building className="h-4 w-4 text-gray-500" />}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                                {customer.contactName && (
                                  <div className="text-xs text-gray-500">Contato: {customer.contactName}</div>
                                )}
                                {/* Informações adicionais para mobile */}
                                <div className="sm:hidden flex flex-col mt-1">
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">Tel:</span> {customer.phone}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium">{customer.documentType === 'cpf' ? 'CPF' : 'CNPJ'}:</span> {customer.document}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm text-gray-500">
                              {customer.document}
                              <div className="text-xs text-gray-400">
                                {customer.documentType === 'cpf' ? 'CPF' : 'CNPJ'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap hidden sm:table-cell">
                            <div className="text-sm text-gray-500">
                              {customer.phone}
                              {customer.phone2 && (
                                <div className="text-xs text-gray-400">{customer.phone2}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                            <div className="flex items-center justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(customer)}
                                style={{ WebkitAppearance: "none" }}
                                className="w-8 h-8 flex items-center justify-center"
                              >
                                <Edit className="h-4 w-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(customer.id)}
                                disabled={deleteCustomerMutation.isPending}
                                style={{ WebkitAppearance: "none" }}
                                className="w-8 h-8 flex items-center justify-center"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {filteredCustomers.length > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="text-sm text-gray-500 text-center sm:text-left">
                    Mostrando {filteredCustomers.length} de {customers.length} clientes
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled
                      style={{ WebkitAppearance: "none" }}
                      className="w-8 h-8 flex items-center justify-center p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      disabled
                      style={{ WebkitAppearance: "none" }}
                      className="w-8 h-8 flex items-center justify-center p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      <Footer />

      {dialogOpen && (
        <CustomerDialog
          open={dialogOpen}
          onClose={handleCloseDialog}
          customer={currentCustomer}
          onSaveSuccess={handleSaveSuccess}
        />
      )}
    </div>
  );
}