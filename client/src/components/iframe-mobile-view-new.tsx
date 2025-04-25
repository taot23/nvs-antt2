import React, { useRef, useEffect, useState } from 'react';

interface EnrichedSale {
  id: number;
  orderNumber: string;
  date: string;
  customerId: number;
  customerName?: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  sellerId: number;
  sellerName?: string;
  serviceTypeId?: number | null;
  serviceTypeName?: string | null;
  serviceProviderId?: number | null;
  serviceProviderName?: string | null;
  totalAmount: string;
  status: string;
  executionStatus: string;
  financialStatus: string;
  notes: string | null;
  returnReason: string | null;
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
          border-left: l;
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
      
      // Add event listeners for actions
      const handleButtonClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON') {
          const action = target.getAttribute('data-action');
          const saleId = target.getAttribute('data-id');
          
          if (action && saleId) {
            const id = parseInt(saleId, 10);
            const sale = data.find(s => s.id === id);
            
            if (sale) {
              // Execute action
              switch(action) {
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
                case 'prev-page':
                  if (currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                  }
                  break;
                case 'next-page':
                  if (currentPage < totalPages) {
                    setCurrentPage(currentPage + 1);
                  }
                  break;
              }
            }
          }
        }
      };
      
      // Add bubble event listener
      doc.addEventListener('click', handleButtonClick);
      
      return () => {
        doc.removeEventListener('click', handleButtonClick);
      };
    };
    
    // Set up iframe load listener
    const iframe = iframeRef.current;
    if (iframe) {
      iframe.addEventListener('load', handleIframeLoad);
      return () => {
        iframe.removeEventListener('load', handleIframeLoad);
      };
    }
  }, [
    currentPage,
    totalPages,
    currentItems,
    isLoading,
    error,
    data,
    onViewDetails,
    onViewHistory,
    onEdit,
    onStartExecution,
    onCompleteExecution,
    onReturnClick,
    onMarkAsPaid,
    onDeleteClick,
    user
  ]);
  
  // Force iframe refresh when data changes
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe) {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        // This forces a reload of the iframe content
        iframe.src = 'about:blank';
        iframe.src = 'javascript:void(0)';
      }
    }
  }, [data, currentPage]);
  
  // Handle manual refresh
  const handleRefresh = () => {
    if (onRefresh) {
      setIsRefreshing(true);
      onRefresh();
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };
  
  return (
    <div className="w-full h-full max-w-md mx-auto bg-card">
      <iframe
        ref={iframeRef}
        style={{
          border: 'none',
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

export default IframeMobileView;