import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';

export default function UltraSimpleMobilePage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function loadSales() {
      try {
        setLoading(true);
        const res = await fetch('/api/sales');
        if (!res.ok) {
          throw new Error('Falha ao carregar vendas');
        }
        const data = await res.json();
        setSales(data.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    loadSales();
  }, []);

  // Função para formatar moeda brasileira
  function formatCurrency(value: string) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
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

  // Função para obter cor do status
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

  // Função para visualizar detalhes
  function viewSaleDetails(id: number) {
    window.location.href = `/sale-details?id=${id}`;
  }

  // Renderiza HTML diretamente para evitar problemas com componentes React
  const renderSalesHtml = () => {
    const salesHtml = sales.map(sale => {
      const statusColor = getStatusColor(sale.status);
      return `
        <div onclick="window.location.href='/sale-details?id=${sale.id}'" style="
          margin-bottom: 10px; 
          padding: 10px; 
          border: 1px solid #ddd; 
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          background-color: white;
        ">
          <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
            <strong style="font-size: 16px;">OS: ${sale.orderNumber}</strong>
            <span style="
              background-color: ${statusColor}; 
              color: white; 
              padding: 3px 8px; 
              border-radius: 4px;
              font-size: 12px;
            ">${formatStatus(sale.status)}</span>
          </div>
          <div style="font-size: 14px; margin-bottom: 4px;">Cliente: ${sale.customerName || 'N/A'}</div>
          <div style="font-size: 14px; margin-bottom: 4px;">Vendedor: ${sale.sellerName || 'N/A'}</div>
          <div style="display: flex; justify-content: space-between; margin-top: 5px;">
            <div style="font-size: 14px; color: #666;">Data: ${new Date(sale.date).toLocaleDateString('pt-BR')}</div>
            <div style="font-size: 16px; font-weight: bold;">${formatCurrency(sale.totalAmount)}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div style="padding: 10px; font-family: system-ui, -apple-system, sans-serif;">
        <h1 style="font-size: 20px; text-align: center; margin-bottom: 15px;">Vendas - Versão Ultra Simples</h1>
        <div>${salesHtml}</div>
      </div>
    `;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '16px'
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
        margin: '20px'
      }}>
        Erro ao carregar dados: {error}
      </div>
    );
  }

  // Uso de uma string HTML direta para evitar problemas com renderização React
  return (
    <>
      {/* Cabeçalho simples com botão de voltar */}
      <div style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'white',
        padding: '10px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 10
      }}>
        <button 
          onClick={() => window.history.back()}
          style={{
            background: 'none',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '5px 10px',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Voltar
        </button>
        <div style={{ fontWeight: 'bold' }}>
          {user?.username} ({user?.role})
        </div>
      </div>
      
      {/* Conteúdo principal com HTML inserido diretamente para evitar problemas de renderização */}
      <div 
        style={{ overflowY: 'auto', height: 'calc(100vh - 50px)' }} 
        dangerouslySetInnerHTML={{ __html: renderSalesHtml() }} 
      />
    </>
  );
}