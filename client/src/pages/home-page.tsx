import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Users } from "lucide-react";

export default function HomePage() {
  console.log("Renderizando HomePage");
  const { user } = useAuth();
  console.log("HomePage: user=", user);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
            <p className="text-gray-600 mt-1">Painel de controle principal</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
                  <Link href="/customers">
                    <span className="text-blue-600 text-sm hover:underline cursor-pointer">
                      Gerenciar clientes →
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
