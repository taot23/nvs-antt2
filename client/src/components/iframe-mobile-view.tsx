import React, { useEffect, useRef, useState } from 'react';
import { Sale } from '@shared/schema';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface EnrichedSale extends Sale {
  customerName?: string;
  paymentMethodName?: string;
  sellerName?: string;
  serviceTypeName?: string | null;
  serviceProviderName?: string | null;
}

interface IframeMobileViewProps {
  data: EnrichedSale[];
  isLoading: boolean;
  error: Error | null;
  onViewDetails: (sale: EnrichedSale) => void;
  onViewHistory: (sale: EnrichedSale) => void;
  onEdit: (sale: EnrichedSale) => void;
  onStartExecution: (sale: EnrichedSale) => void;
  onCompleteExecution: (sale: EnrichedSale) => void; 
  onReturnClick: (sale: EnrichedSale) => void;
  onMarkAsPaid: (sale: EnrichedSale) => void;
  onDeleteClick: (sale: EnrichedSale) => void;
  user: { id: number; username: string; role: string } | null;
  onRefresh?: () => void;
}

const IframeMobileView: React.FC<IframeMobileViewProps> = ({
  data,
  isLoading,
  error,
  onViewDetails,
  onViewHistory,
  onEdit,
  onStartExecution,
  onCompleteExecution,
  onReturnClick,
  onMarkAsPaid,
  onDeleteClick,
  user,
  onRefresh
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  // Calculate total pages
  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));
  
  // Get current page items
  const currentItems = data.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const handleIframeLoad = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      
      // Inject styles for better mobile experience
      const style = doc.createElement('style');
      style.textContent = `
        * {
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-tap-highlight-color: transparent;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          background-color: #f9f9f9;
          -webkit-overflow-scrolling: touch;
          overflow-y: auto;
          overscroll-behavior: none;
          touch-action: manipulation;
          position: relative;
          height: 100%;
          width: 100%;
        }
        
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin: 8px;
          padding: 12px;
          position: relative;
          overflow: hidden;
          border-left: 4px solid #ddd;
        }
        
        .card.pending { border-left-color: #9ca3af; }
        .card.in_progress { border-left-color: #f97316; }
        .card.completed { border-left-color: #22c55e; }
        .card.returned { border-left-color: #ef4444; }
        .card.corrected { border-left-color: #eab308; }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 8px;
        }
        
        .order-number {
          font-weight: 600;
          font-size: 14px;
        }
        
        .date {
          font-size: 12px;
          color: #6b7280;
        }
        
        .amount {
          font-weight: 600;
          font-size: 14px;
        }
        
        .status {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          margin-top: 4px;
        }
        
        .status.pending { background: #f3f4f6; color: #4b5563; }
        .status.in_progress { background: #ffedd5; color: #c2410c; }
        .status.completed { background: #dcfce7; color: #15803d; }
        .status.returned { background: #fee2e2; color: #b91c1c; }
        .status.corrected { background: #fef9c3; color: #a16207; }
        
        .info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 12px;
          font-size: 12px;
        }
        
        .info-label {
          font-size: 10px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        
        .info-value {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .actions {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
          margin-bottom: 8px;
        }
        
        .action-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }
        
        button {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          line-height: 1;
          height: 30px;
          touch-action: manipulation;
        }
        
        button:active {
          transform: scale(0.98);
        }
        
        button.primary {
          background: #2563eb;
          color: white;
          border-color: #1d4ed8;
        }
        
        button.secondary {
          background: #4b5563;
          color: white;
          border-color: #374151;
        }
        
        button.warning {
          background: #ef4444;
          color: white;
          border-color: #dc2626;
        }
        
        button.success {
          background: #22c55e;
          color: white;
          border-color: #16a34a;
        }
        
        .bottom-navigation {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          border-top: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          z-index: 10;
        }
        
        .pagination-info {
          font-size: 14px;
          font-weight: 500;
        }
        
        .loading {
          padding: 16px;
          text-align: center;
        }
        
        .error {
          margin: 16px;
          padding: 16px;
          background: #fee2e2;
          color: #b91c1c;
          border-radius: 8px;
          font-weight: 500;
        }
        
        .empty {
          margin: 16px;
          padding: 16px;
          background: #f3f4f6;
          color: #4b5563;
          border-radius: 8px;
          text-align: center;
        }
        
        .content {
          padding-bottom: 60px;
        }
      `;
      
      doc.head.appendChild(style);
      
      // Create content HTML
      let contentHTML = '';
      
      if (isLoading) {
        contentHTML = '<div class="loading">Carregando vendas...</div>';
      } else if (error) {
        contentHTML = '<div class="error">' +
          '<div style="font-weight: 600; margin-bottom: 4px;">Erro ao carregar vendas</div>' +
          '<div>' + error.message + '</div>' +
          '</div>';
      } else if (currentItems.length === 0) {
        contentHTML = '<div class="empty">Nenhuma venda encontrada</div>';
      } else {
        contentHTML = '<div class="content">';
        
        // Add sales cards
        currentItems.forEach(sale => {
          let statusLabel = '';
          switch(sale.status) {
            case 'pending': statusLabel = 'Pendente'; break;
            case 'in_progress': statusLabel = 'Em Andamento'; break;
            case 'completed': statusLabel = 'Concluída'; break;
            case 'returned': statusLabel = 'Devolvida'; break;
            case 'corrected': statusLabel = 'Corrigida'; break;
            default: statusLabel = sale.status;
          }
          
          const date = new Date(sale.date);
          const formattedDate = date.toLocaleDateString('pt-BR');
          const amount = parseFloat(sale.totalAmount).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
          });
          
          let cardHtml = '<div class="card ' + sale.status + '" data-id="' + sale.id + '">' +
            '<div class="header">' +
              '<div>' +
                '<div class="order-number">OS: ' + sale.orderNumber + '</div>' +
                '<div class="date">' + formattedDate + '</div>' +
                '<div class="status ' + sale.status + '">' + statusLabel + '</div>' +
              '</div>' +
              '<div class="amount">' + amount + '</div>' +
            '</div>' +
            
            '<div class="info">' +
              '<div>' +
                '<div class="info-label">Cliente</div>' +
                '<div class="info-value">' + (sale.customerName || 'Cliente #' + sale.customerId) + '</div>' +
              '</div>' +
              '<div>' +
                '<div class="info-label">Vendedor</div>' +
                '<div class="info-value">' + (sale.sellerName || 'Vendedor #' + sale.sellerId) + '</div>' +
              '</div>' +
            '</div>' +
            
            '<div class="actions">' +
              '<button class="primary" data-action="details" data-id="' + sale.id + '">Detalhes</button>' +
              '<button class="secondary" data-action="history" data-id="' + sale.id + '">Histórico</button>';
              
          if (user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") {
            cardHtml += '<button data-action="edit" data-id="' + sale.id + '">Editar</button>';
          } else {
            cardHtml += '<div></div>';
          }
          
          cardHtml += '</div><div class="action-row">';
          
          // Conditional buttons based on role and status
          if ((user?.role === "admin" || user?.role === "operacional") && 
              (sale.status === "pending" || sale.status === "corrected")) {
            cardHtml += '<button class="success" data-action="start" data-id="' + sale.id + '">Iniciar</button>';
          }
          
          if ((user?.role === "admin" || user?.role === "operacional") && 
              sale.status === "in_progress") {
            cardHtml += '<button class="success" data-action="complete" data-id="' + sale.id + '">Concluir</button>';
          }
          
          if ((user?.role === "admin" || user?.role === "operacional") && 
              (sale.status === "pending" || sale.status === "in_progress")) {
            cardHtml += '<button class="warning" data-action="return" data-id="' + sale.id + '">Devolver</button>';
          }
          
          if ((user?.role === "admin" || user?.role === "financeiro") && 
              sale.status === "completed" && sale.financialStatus !== "paid") {
            cardHtml += '<button class="success" data-action="paid" data-id="' + sale.id + '">Pago</button>';
          }
          
          if (user?.role === "admin" || user?.role === "supervisor") {
            cardHtml += '<button class="warning" data-action="delete" data-id="' + sale.id + '">Excluir</button>';
          }
          
          cardHtml += '</div></div>';
          
          contentHTML += cardHtml;
        });
        
        contentHTML += '</div>';
      }
      
      // Add bottom navigation
      contentHTML += '<div class="bottom-navigation">' +
        '<button ' + 
          (currentPage <= 1 ? 'disabled style="opacity: 0.5;"' : '') + 
          ' data-action="prev-page">' +
          'Anterior' +
        '</button>' +
        '<div class="pagination-info">' +
          currentPage + ' / ' + totalPages +
        '</div>' +
        '<button ' + 
          (currentPage >= totalPages ? 'disabled style="opacity: 0.5;"' : '') + 
          ' data-action="next-page">' +
          'Próxima' +
        '</button>' +
      '</div>';
      
      // Set content HTML
      doc.body.innerHTML = contentHTML;
      
      // Add event listeners
      const buttons = doc.querySelectorAll('button[data-action]');
      buttons.forEach(button => {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          const target = e.currentTarget as HTMLButtonElement;
          const action = target.getAttribute('data-action');
          const id = target.getAttribute('data-id');
          
          if (action === 'prev-page') {
            window.parent.postMessage({ type: 'prev-page' }, '*');
            return;
          }
          
          if (action === 'next-page') {
            window.parent.postMessage({ type: 'next-page' }, '*');
            return;
          }
          
          if (id) {
            const saleId = parseInt(id, 10);
            const sale = data.find(s => s.id === saleId);
            
            if (sale) {
              window.parent.postMessage({
                type: action,
                saleId: saleId,
              }, '*');
            }
          }
        });
      });
      
      // Scale iframe height to content
      iframe.style.height = doc.body.scrollHeight + 'px';
    };
    
    if (iframeRef.current) {
      iframeRef.current.addEventListener('load', handleIframeLoad);
    }
    
    return () => {
      if (iframeRef.current) {
        iframeRef.current.removeEventListener('load', handleIframeLoad);
      }
    };
  }, [data, isLoading, error, currentItems, currentPage, totalPages, user]);
  
  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (typeof event.data !== 'object') return;
      
      const { type, saleId } = event.data;
      
      if (type === 'prev-page' && currentPage > 1) {
        setCurrentPage(prev => prev - 1);
        return;
      }
      
      if (type === 'next-page' && currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
        return;
      }
      
      if (saleId) {
        const sale = data.find(s => s.id === saleId);
        if (!sale) return;
        
        switch (type) {
          case 'details':
            onViewDetails(sale);
            break;
          case 'history':
            onViewHistory(sale);
            break;
          case 'edit':
            onEdit(sale);
            break;
          case 'start':
            onStartExecution(sale);
            break;
          case 'complete':
            onCompleteExecution(sale);
            break;
          case 'return':
            onReturnClick(sale);
            break;
          case 'paid':
            onMarkAsPaid(sale);
            break;
          case 'delete':
            onDeleteClick(sale);
            break;
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [
    currentPage, 
    totalPages, 
    data, 
    onViewDetails, 
    onViewHistory, 
    onEdit, 
    onStartExecution, 
    onCompleteExecution, 
    onReturnClick, 
    onMarkAsPaid, 
    onDeleteClick
  ]);
  
  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };
  
  if (isLoading && !data.length) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div className="relative">
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="w-8 h-8 p-0 rounded-full"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          <span className="sr-only">Atualizar</span>
        </Button>
      </div>
      <iframe
        ref={iframeRef}
        className="w-full border-0"
        style={{ 
          minHeight: '600px',
          height: '100%',
          width: '100%',
          overflow: 'hidden',
          display: 'block'
        }}
        title="Lista de Vendas (Versão Móvel)"
        sandbox="allow-same-origin allow-scripts"
        srcDoc="<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no' /></head><body><div id='content'>Carregando...</div></body></html>"
      />
    </div>
  );
};

