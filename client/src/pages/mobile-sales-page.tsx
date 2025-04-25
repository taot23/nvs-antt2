import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

// Página ultra simples dedicada exclusivamente para dispositivos móveis
// Sem bibliotecas externas, sem frameworks complexos de UI

type Sale = {
  id: number;
  orderNumber: string;
  date: string;
  customerId: number;
  customerName?: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  sellerId: number;
  sellerName?: string;
  totalAmount: string;
  status: string;
  executionStatus: string;
  financialStatus: string;
};

export default function MobileSalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Carregar dados com fetch padrão
  useEffect(() => {
    async function loadSales() {
      try {
        setLoading(true);
        
        const queryParams = new URLSearchParams();
        queryParams.append("page", page.toString());
        queryParams.append("limit", "10");
        
        // Se for vendedor, exibe apenas suas vendas
        if (user?.role === "vendedor") {
          queryParams.append("sellerId", user.id.toString());
        }
        
        const response = await fetch(`/api/sales?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error("Falha ao carregar vendas");
        }
        
        const data = await response.json();
        
        if (data.data.length === 0 || data.data.length < 10) {
          setHasMore(false);
        }
        
        // Carregar dados auxiliares para enriquecer as vendas
        const customersRes = await fetch("/api/customers");
        const usersRes = await fetch("/api/users");
        const pmRes = await fetch("/api/payment-methods");
        
        const customers = await customersRes.json();
        const users = await usersRes.json();
        const paymentMethods = await pmRes.json();
        
        // Enriquecer dados de vendas
        const enrichedSales = data.data.map((sale: any) => {
          const customer = customers.find((c: any) => c.id === sale.customerId);
          const seller = users.find((u: any) => u.id === sale.sellerId);
          const paymentMethod = paymentMethods.find((p: any) => p.id === sale.paymentMethodId);
          
          return {
            ...sale,
            customerName: customer?.name || `Cliente #${sale.customerId}`,
            sellerName: seller?.username || `Vendedor #${sale.sellerId}`,
            paymentMethodName: paymentMethod?.name || `Pagamento #${sale.paymentMethodId}`
          };
        });
        
        setSales(prevSales => page === 1 ? enrichedSales : [...prevSales, ...enrichedSales]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadSales();
  }, [page, user]);

  // Função para formatar moeda
  function formatCurrency(value: string) {
    const amount = parseFloat(value);
    return amount.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
  
  // Função para formatar status
  function formatStatus(status: string) {
    switch(status) {
      case 'pending': return 'Pendente';
      case 'in_progress': return 'Em Andamento';
      case 'completed': return 'Concluída';
      case 'returned': return 'Devolvida';
      case 'corrected': return 'Corrigida';
      default: return status;
    }
  }
  
  // Função para definir cor do status
  function getStatusColor(status: string) {
    switch(status) {
      case 'pending': return '#FFC107';
      case 'in_progress': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'returned': return '#F44336';
      case 'corrected': return '#FF9800';
      default: return '#9E9E9E';
    }
  }
  
  function loadMore() {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  }
  
  // Função para abrir detalhes da venda em uma nova página
  function viewSaleDetails(id: number) {
    window.open(`/sale-details?id=${id}`, '_blank');
  }
  
  if (error) {
    return (
      <div style={{
        padding: '20px',
        color: '#721c24',
        backgroundColor: '#f8d7da',
        border: '1px solid #f5c6cb',
        borderRadius: '4px',
        margin: '20px',
        textAlign: 'center'
      }}>
        Erro: {error}
      </div>
    );
  }

  return (
    <div style={{
      maxWidth: '100%',
      padding: '10px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        fontSize: '24px',
        textAlign: 'center',
        margin: '10px 0 20px',
        color: '#333'
      }}>
        Vendas
      </h1>
      
      <div style={{overflowY: 'auto', maxHeight: '100%', paddingBottom: '60px'}}>
        {sales.map(sale => (
          <div key={sale.id} style={{
            margin: '0 0 15px',
            padding: '15px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '10px'
            }}>
              <div>
                <strong style={{fontSize: '16px'}}>OS: {sale.orderNumber}</strong>
                <div style={{fontSize: '14px', color: '#666'}}>
                  {sale.date ? new Date(sale.date).toLocaleDateString('pt-BR') : 'Sem data'}
                </div>
              </div>
              <div style={{
                backgroundColor: getStatusColor(sale.status),
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold',
                display: 'inline-block'
              }}>
                {formatStatus(sale.status)}
              </div>
            </div>
            
            <div style={{marginBottom: '10px'}}>
              <div style={{fontSize: '14px'}}>
                <span style={{color: '#666'}}>Cliente:</span> {sale.customerName}
              </div>
              <div style={{fontSize: '14px'}}>
                <span style={{color: '#666'}}>Vendedor:</span> {sale.sellerName}
              </div>
              <div style={{fontSize: '16px', fontWeight: 'bold', marginTop: '5px'}}>
                {formatCurrency(sale.totalAmount)}
              </div>
            </div>
            
            <div>
              <button onClick={() => viewSaleDetails(sale.id)} style={{
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: '14px',
                width: '100%'
              }}>
                Ver Detalhes
              </button>
            </div>
          </div>
        ))}
        
        {loading && (
          <div style={{textAlign: 'center', padding: '20px', color: '#666'}}>
            Carregando...
          </div>
        )}
        
        {!loading && hasMore && (
          <div style={{textAlign: 'center', marginTop: '20px'}}>
            <button onClick={loadMore} style={{
              backgroundColor: '#f8f9fa',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '10px 15px',
              color: '#333',
              fontSize: '14px',
              cursor: 'pointer'
            }}>
              Carregar Mais
            </button>
          </div>
        )}
        
        {!loading && sales.length === 0 && (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#666',
            backgroundColor: '#f8f9fa',
            borderRadius: '4px',
            margin: '20px 0'
          }}>
            Nenhuma venda encontrada
          </div>
        )}
      </div>
      
      <div style={{
        position: 'fixed',
        bottom: '0',
        left: '0',
        right: '0',
        backgroundColor: '#f8f9fa',
        borderTop: '1px solid #ddd',
        padding: '10px',
        textAlign: 'center'
      }}>
        <button onClick={() => window.location.href = '/'} style={{
          backgroundColor: '#6c757d',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '14px',
          marginRight: '10px'
        }}>
          Voltar ao Início
        </button>
        
        <button onClick={() => window.location.reload()} style={{
          backgroundColor: '#28a745',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          Atualizar
        </button>
      </div>
    </div>
  );
}