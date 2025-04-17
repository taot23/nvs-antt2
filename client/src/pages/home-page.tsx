import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user, logoutMutation } = useAuth();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
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

      <Footer />
    </div>
  );
}
