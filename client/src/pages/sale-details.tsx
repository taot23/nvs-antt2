import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

type SaleItem = {
  id: number;
  saleId: number;
  serviceId: number;
  serviceName?: string;
  quantity: number;
  price: string;
  notes: string | null;
  totalPrice: string;
};

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
  notes: string | null;
  returnReason: string | null;
};

type HistoryItem = {
  id: number;
  saleId: number;
  fromStatus: string;
  toStatus: string;
  userId: number;
  userName?: string;
  reason: string | null;
  timestamp: string;
};

export default function SaleDetailsPage() {
  const { user } = useAuth();
  const [sale, setSale] = useState<Sale | null>(null);
  const [items, setItems] = useState<SaleItem[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadSaleDetails() {
      try {
        setLoading(true);
        
        // Obter o ID da venda da URL
        const params = new URLSearchParams(window.location.search);
        const saleId = params.get('id');
        
        if (!saleId) {
          throw new Error("ID da venda não especificado");
        }
        
        // Carregar dados da venda
        const saleRes = await fetch(`/api/sales/${saleId}`);
        if (!saleRes.ok) {
          throw new Error("Falha ao carregar detalhes da venda");
        }
        const saleData = await saleRes.json();
        
        // Carregar itens da venda
        const itemsRes = await fetch(`/api/sales/${saleId}/items`);
        if (!itemsRes.ok) {
          throw new Error("Falha ao carregar itens da venda");
        }
        const itemsData = await itemsRes.json();
        
        // Carregar histórico da venda
        const historyRes = await fetch(`/api/sales/${saleId}/history`);
        if (!historyRes.ok) {
          throw new Error("Falha ao carregar histórico da venda");
        }
        const historyData = await historyRes.json();
        
        // Carregar dados auxiliares
        const [customersRes, usersRes, pmRes, servicesRes] = await Promise.all([
          fetch("/api/customers"),
          fetch("/api/users"),
          fetch("/api/payment-methods"),
          fetch("/api/services")
        ]);
        
        const customers = await customersRes.json();
        const users = await usersRes.json();
        const paymentMethods = await pmRes.json();
        const services = await servicesRes.json();
        
        // Enriquecer dados
        const customer = customers.find((c: any) => c.id === saleData.customerId);
        const seller = users.find((u: any) => u.id === saleData.sellerId);
        const paymentMethod = paymentMethods.find((p: any) => p.id === saleData.paymentMethodId);
        
        const enrichedSale = {
          ...saleData,
          customerName: customer?.name || `Cliente #${saleData.customerId}`,
          sellerName: seller?.username || `Vendedor #${saleData.sellerId}`,
          paymentMethodName: paymentMethod?.name || `Pagamento #${saleData.paymentMethodId}`
        };
        
        // Enriquecer itens
        const enrichedItems = itemsData.map((item: any) => {
          const service = services.find((s: any) => s.id === item.serviceId);
          return {
            ...item,
            serviceName: service?.name || `Serviço #${item.serviceId}`
          };
        });
        
        // Enriquecer histórico
        const enrichedHistory = historyData.map((historyItem: any) => {
          const historyUser = users.find((u: any) => u.id === historyItem.userId);
          return {
            ...historyItem,
            userName: historyUser?.username || `Usuário #${historyItem.userId}`
          };
        });
        
        setSale(enrichedSale);
        setItems(enrichedItems);
        setHistory(enrichedHistory);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadSaleDetails();
  }, []);

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
  
  // Função para formatar data
  function formatDate(dateString: string | null) {
    if (!dateString) return 'Sem data';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR');
  }
  
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: '#666'
      }}>
        Carregando...
      </div>
    );
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
  
  if (!sale) {
    return (
      <div style={{
        padding: '20px',
        color: '#856404',
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeeba',
        borderRadius: '4px',
        margin: '20px',
        textAlign: 'center'
      }}>
        Venda não encontrada
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
        Detalhes da Venda
      </h1>
      
      <div style={{
        padding: '15px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        backgroundColor: '#fff',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '15px',
          alignItems: 'center'
        }}>
          <h2 style={{fontSize: '18px', margin: 0}}>OS: {sale.orderNumber}</h2>
          <div style={{
            backgroundColor: getStatusColor(sale.status),
            color: '#fff',
            padding: '5px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold'
          }}>
            {formatStatus(sale.status)}
          </div>
        </div>
        
        <div style={{fontSize: '14px', marginBottom: '5px'}}>
          <strong>Data:</strong> {formatDate(sale.date)}
        </div>
        
        <div style={{fontSize: '14px', marginBottom: '5px'}}>
          <strong>Cliente:</strong> {sale.customerName}
        </div>
        
        <div style={{fontSize: '14px', marginBottom: '5px'}}>
          <strong>Vendedor:</strong> {sale.sellerName}
        </div>
        
        <div style={{fontSize: '14px', marginBottom: '5px'}}>
          <strong>Forma de Pagamento:</strong> {sale.paymentMethodName}
        </div>
        
        <div style={{fontSize: '14px', marginBottom: '5px'}}>
          <strong>Total:</strong> {formatCurrency(sale.totalAmount)}
        </div>
        
        {sale.notes && (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            marginTop: '10px'
          }}>
            <strong>Observações:</strong> {sale.notes}
          </div>
        )}
        
        {sale.returnReason && (
          <div style={{
            backgroundColor: '#ffebee',
            padding: '10px',
            borderRadius: '4px',
            marginTop: '10px',
            color: '#c62828'
          }}>
            <strong>Motivo da Devolução:</strong> {sale.returnReason}
          </div>
        )}
      </div>
      
      <h2 style={{
        fontSize: '18px',
        margin: '20px 0 10px',
        color: '#333'
      }}>
        Itens da Venda
      </h2>
      
      {items.length === 0 ? (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#666'
        }}>
          Nenhum item encontrado
        </div>
      ) : (
        items.map(item => (
          <div key={item.id} style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '10px',
            backgroundColor: '#fff'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <div style={{fontSize: '16px', fontWeight: 'bold'}}>
                {item.serviceName}
              </div>
              <div style={{fontSize: '16px', fontWeight: 'bold'}}>
                {formatCurrency(item.totalPrice)}
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '14px',
              color: '#666',
              marginTop: '5px'
            }}>
              <div>Quantidade: {item.quantity}</div>
              <div>Preço Unit.: {formatCurrency(item.price)}</div>
            </div>
            
            {item.notes && (
              <div style={{
                fontSize: '14px',
                marginTop: '5px',
                backgroundColor: '#f8f9fa',
                padding: '5px',
                borderRadius: '4px'
              }}>
                <strong>Observações:</strong> {item.notes}
              </div>
            )}
          </div>
        ))
      )}
      
      <h2 style={{
        fontSize: '18px',
        margin: '20px 0 10px',
        color: '#333'
      }}>
        Histórico
      </h2>
      
      {history.length === 0 ? (
        <div style={{
          padding: '15px',
          backgroundColor: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '4px',
          textAlign: 'center',
          color: '#666'
        }}>
          Nenhum histórico encontrado
        </div>
      ) : (
        history.map(item => (
          <div key={item.id} style={{
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '10px',
            backgroundColor: '#fff'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '5px'
            }}>
              <div style={{fontSize: '14px'}}>
                <strong>De:</strong> {formatStatus(item.fromStatus)} <strong>Para:</strong> {formatStatus(item.toStatus)}
              </div>
              <div style={{fontSize: '12px', color: '#666'}}>
                {formatDate(item.timestamp)}
              </div>
            </div>
            
            <div style={{fontSize: '14px'}}>
              <strong>Usuário:</strong> {item.userName}
            </div>
            
            {item.reason && (
              <div style={{
                fontSize: '14px',
                marginTop: '5px',
                backgroundColor: '#f8f9fa',
                padding: '5px',
                borderRadius: '4px'
              }}>
                <strong>Motivo:</strong> {item.reason}
              </div>
            )}
          </div>
        ))
      )}
      
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
        <button onClick={() => window.history.back()} style={{
          backgroundColor: '#6c757d',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          padding: '8px 12px',
          cursor: 'pointer',
          fontSize: '14px'
        }}>
          Voltar
        </button>
      </div>
    </div>
  );
}