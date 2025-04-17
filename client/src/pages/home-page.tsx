import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Users, Home } from "lucide-react";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
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
              <div className="flex items-center px-3 py-2 text-gray-700 bg-gray-100 rounded-md group">
                <Home className="mr-3 h-5 w-5 text-gray-500" />
                <Link href="/">Início</Link>
              </div>
              <div className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md group">
                <Users className="mr-3 h-5 w-5 text-gray-500" />
                <Link href="/clientes">Clientes</Link>
              </div>
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard</h1>

            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h2 className="text-lg font-medium text-gray-800 mb-2">
                Bem-vindo, {user?.username}!
              </h2>
              <p className="text-gray-600">
                Você está logado com sucesso no sistema.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-50 text-blue-600">
                    <Users className="h-8 w-8" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800">Clientes</h3>
                    <Link href="/clientes">
                      <span className="text-blue-600 text-sm hover:underline cursor-pointer">
                        Gerenciar clientes →
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="text-red-500 border-red-200 hover:bg-red-50"
              disabled={logoutMutation.isPending}
            >
              {logoutMutation.isPending ? "Saindo..." : "Sair do Sistema"}
            </Button>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
