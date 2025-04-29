import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ArrowLeft, AlertTriangle, RefreshCw } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ReturnedSaleHandler } from '@/components/sales/returned-sale-handler';

export default function ReturnedSalesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Consulta para buscar apenas vendas com status "returned"
  const { data: returnedSales = [], isLoading, error, refetch } = useQuery({
    queryKey: ['/api/sales', 'returned', user?.id],
    queryFn: async () => {
      // Construir parâmetros de consulta
      const queryParams = new URLSearchParams();
      queryParams.append('status', 'returned');
      
      // Se o usuário for vendedor, buscar apenas suas próprias vendas
      if (user?.role === 'vendedor') {
        queryParams.append('sellerId', user.id.toString());
      }
      
      const response = await fetch(`/api/sales?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error('Erro ao carregar vendas devolvidas');
      }
      
      const data = await response.json();
      return data.data || [];
    },
    // Refrescar dados mais frequentemente para esta página
    staleTime: 10000, // 10 segundos
    refetchOnWindowFocus: true,
  });

  // Função para atualizar manualmente os dados
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast({
        title: 'Dados atualizados',
        description: 'As vendas devolvidas foram atualizadas',
      });
    } catch (err) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar as vendas',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Atualizar dados quando a página for carregada
  useEffect(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="container py-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2">
            <Link to="/sales" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold">Vendas Devolvidas</h1>
          </div>
          <p className="text-muted-foreground">
            Visualize e corrija vendas que foram devolvidas pelo setor operacional
          </p>
        </div>
        
        <Button 
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Atualizar dados"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="h-24 bg-gray-100 rounded"></div>
              <div className="h-24 bg-gray-100 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
            <p>Erro ao carregar vendas devolvidas: {(error as Error).message}</p>
          </CardContent>
        </Card>
      ) : returnedSales.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="p-4 bg-green-50 rounded-md border border-green-100 mb-3">
              <p className="text-green-700">Não há vendas devolvidas pendentes de correção!</p>
            </div>
            <p className="text-muted-foreground">
              Todas as suas vendas foram processadas corretamente. Se tiver dúvidas, entre em contato com o setor operacional.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Instruções</CardTitle>
              <CardDescription>
                As vendas abaixo foram devolvidas e precisam ser corrigidas para prosseguir com o processamento.
                Clique no botão "Corrigir e Reenviar Venda" para fazer as correções necessárias e reenviar ao setor operacional.
              </CardDescription>
            </CardHeader>
          </Card>
          
          {/* Lista de vendas devolvidas */}
          <div className="space-y-4">
            {returnedSales.map((sale: any) => (
              <ReturnedSaleHandler 
                key={sale.id}
                sale={sale}
                onSuccess={() => {
                  queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
                  toast({
                    title: 'Venda reenviada',
                    description: 'A venda foi corrigida e reenviada com sucesso',
                  });
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}