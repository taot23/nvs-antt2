import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from "@/hooks/use-toast";
import { getStatusLabel } from '@/lib/status-utils';

// Tipo para venda
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
  responsibleOperationalId: number | null;
  responsibleFinancialId: number | null;
  createdAt: string;
  updatedAt: string;
};

interface UltraNativeMobileViewProps {
  data: Sale[];
  isLoading: boolean;
  error: Error | null;
  onViewDetails: (sale: Sale) => void;
  onViewHistory: (sale: Sale) => void;
  onEdit: (sale: Sale) => void;
  onStartExecution: (sale: Sale) => void;
  onCompleteExecution: (sale: Sale) => void;
  onReturnClick: (sale: Sale) => void;
  onMarkAsPaid: (sale: Sale) => void;
  onDeleteClick: (sale: Sale) => void;
  user: { id: number; username: string; role: string } | null;
  ReenviaButton: React.ComponentType<{ sale: Sale }>;
  DevolveButton: React.ComponentType<{ sale: Sale }>;
}

// Abordagem ultra radical para dispositivos móveis
const UltraNativeMobileView: React.FC<UltraNativeMobileViewProps> = ({
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
  ReenviaButton,
  DevolveButton
}) => {
  const { toast } = useToast();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  
  // Manipulador de mensagens do iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'sale-action') {
        const { action, saleId } = event.data;
        const sale = data.find(s => s.id === saleId);
        
        if (!sale) {
          console.error(`Venda com ID ${saleId} não encontrada`);
          return;
        }
        
        switch (action) {
          case 'view-details':
            onViewDetails(sale);
            break;
          case 'view-history':
            onViewHistory(sale);
            break;
          case 'edit':
            onEdit(sale);
            break;
          case 'start-execution':
            onStartExecution(sale);
            break;
          case 'complete-execution':
            onCompleteExecution(sale);
            break;
          case 'return':
            onReturnClick(sale);
            break;
          case 'mark-paid':
            onMarkAsPaid(sale);
            break;
          case 'delete':
            onDeleteClick(sale);
            break;
          default:
            console.error(`Ação desconhecida: ${action}`);
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [data, onViewDetails, onViewHistory, onEdit, onStartExecution, onCompleteExecution, onReturnClick, onMarkAsPaid, onDeleteClick]);
  
  // Injetar HTML/CSS/JS no iframe após carregamento
  useEffect(() => {
    if (!iframeLoaded || !iframeRef.current || isLoading || error || data.length === 0) return;
    
    const iframe = iframeRef.current;
    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    
    if (!iframeDoc) return;
    
    // Transformar dados para injestão de performance
    const salesData = JSON.stringify(data.map(sale => ({
      id: sale.id,
      orderNumber: sale.orderNumber,
      date: format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR }),
      customerName: sale.customerName || `Cliente #${sale.customerId}`,
      sellerName: sale.sellerName || `Vendedor #${sale.sellerId}`,
      totalAmount: parseFloat(sale.totalAmount).toFixed(2).replace('.', ','),
      status: sale.status,
      statusLabel: getStatusLabel(sale.status),
      serviceTypeName: sale.serviceTypeName,
      serviceProviderName: sale.serviceProviderName,
      returnReason: sale.returnReason,
      financialStatus: sale.financialStatus
    })));
    
    const userRole = user?.role || '';
    const userId = user?.id || 0;
    
    // Criar HTML básico e injetar no iframe
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>Lista de Vendas</title>
        <style>
          * {
            box-sizing: border-box;
            -webkit-tap-highlight-color: transparent;
          }
          
          html, body {
            margin: 0;
            padding: 0;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.5;
            background-color: #f5f5f5;
            color: #333;
            -webkit-overflow-scrolling: touch;
            overflow-x: hidden;
            overscroll-behavior: none;
            height: 100%;
            width: 100%;
            position: fixed;
            touch-action: pan-y;
          }
          
          .container {
            padding: 0;
            margin: 0;
            height: 100%;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior: none;
          }
          
          .sale-card {
            margin: 10px;
            padding: 0;
            border-radius: 8px;
            background-color: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          
          .sale-pending { background-color: #f8fafc; }
          .sale-in_progress { background-color: #fff7ed; }
          .sale-completed { background-color: #f0fdf4; }
          .sale-returned { background-color: #fef2f2; }
          .sale-corrected { background-color: #fefce8; }
          
          .sale-header {
            display: flex;
            justify-content: space-between;
            padding: 10px;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .sale-status {
            font-size: 11px;
            padding: 3px 8px;
            border-radius: 12px;
            font-weight: 500;
          }
          
          .status-pending { background-color: #e2e8f0; color: #475569; }
          .status-in_progress { background-color: #ffedd5; color: #c2410c; }
          .status-completed { background-color: #dcfce7; color: #16a34a; }
          .status-returned { background-color: #fee2e2; color: #dc2626; }
          .status-corrected { background-color: #fef9c3; color: #ca8a04; }
          
          .sale-content {
            padding: 10px;
          }
          
          .sale-info-item {
            margin-bottom: 8px;
          }
          
          .sale-info-label {
            font-size: 11px;
            color: #64748b;
            margin-bottom: 2px;
          }
          
          .sale-info-value {
            font-size: 13px;
          }
          
          .return-reason {
            color: #dc2626;
            font-size: 12px;
            margin-top: 8px;
            padding: 8px;
            background-color: #fee2e2;
            border-radius: 4px;
          }
          
          .sale-actions {
            padding: 10px;
            border-top: 1px solid #e5e7eb;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          
          .btn {
            display: inline-block;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 13px;
            font-weight: 500;
            text-align: center;
            cursor: pointer;
            border: none;
            width: 100%;
          }
          
          .btn-primary {
            background-color: #1e40af;
            color: white;
          }
          
          .btn-secondary {
            background-color: #f1f5f9;
            color: #475569;
            border: 1px solid #cbd5e1;
          }
          
          .btn-destructive {
            background-color: #dc2626;
            color: white;
          }
          
          .btn-full {
            grid-column: span 2;
          }
          
          .pagination {
            padding: 10px;
            text-align: center;
            position: sticky;
            bottom: 0;
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(4px);
            border-top: 1px solid #e5e7eb;
          }
          
          .pagination-info {
            font-size: 12px;
            color: #64748b;
            margin-bottom: 8px;
          }
          
          .pagination-buttons {
            display: flex;
            justify-content: center;
            gap: 8px;
          }
          
          .page-btn {
            padding: 6px 12px;
            background-color: #f1f5f9;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
          }
          
          .page-btn[disabled] {
            opacity: 0.5;
            cursor: not-allowed;
          }
        </style>
      </head>
      <body ontouchstart="">
        <div class="container" id="sales-container">
          <!-- Sales will be dynamically inserted here -->
        </div>
        
        <script>
          // Dados injestados
          const sales = ${salesData};
          const userRole = "${userRole}";
          const userId = ${userId};
          
          // Função para renderizar vendas
          function renderSales() {
            const container = document.getElementById('sales-container');
            if (!container) return;
            
            // Limpar container
            container.innerHTML = '';
            
            // Adicionar cada venda
            sales.forEach(sale => {
              const card = document.createElement('div');
              card.className = \`sale-card sale-\${sale.status}\`;
              card.setAttribute('data-sale-id', sale.id);
              
              // Cabeçalho
              const header = document.createElement('div');
              header.className = 'sale-header';
              
              const orderInfo = document.createElement('div');
              orderInfo.innerHTML = \`
                <div><strong>OS: \${sale.orderNumber}</strong></div>
                <div style="font-size: 12px; color: #64748b;">\${sale.date}</div>
              \`;
              
              const statusBadge = document.createElement('div');
              statusBadge.className = \`sale-status status-\${sale.status}\`;
              statusBadge.textContent = sale.statusLabel;
              
              header.appendChild(orderInfo);
              header.appendChild(statusBadge);
              
              // Conteúdo
              const content = document.createElement('div');
              content.className = 'sale-content';
              
              content.innerHTML = \`
                <div class="sale-info-item">
                  <div class="sale-info-label">Cliente</div>
                  <div class="sale-info-value">\${sale.customerName}</div>
                </div>
                
                <div class="sale-info-item">
                  <div class="sale-info-label">Vendedor</div>
                  <div class="sale-info-value">\${sale.sellerName}</div>
                </div>
                
                <div class="sale-info-item">
                  <div class="sale-info-label">Valor</div>
                  <div class="sale-info-value"><strong>R$ \${sale.totalAmount}</strong></div>
                </div>
              \`;
              
              // Adicionar tipo de serviço e prestador se disponíveis
              if (sale.serviceTypeName) {
                content.innerHTML += \`
                  <div class="sale-info-item">
                    <div class="sale-info-label">Tipo de Serviço</div>
                    <div class="sale-info-value">\${sale.serviceTypeName}</div>
                  </div>
                \`;
              }
              
              if (sale.serviceProviderName) {
                content.innerHTML += \`
                  <div class="sale-info-item">
                    <div class="sale-info-label">Prestador</div>
                    <div class="sale-info-value">\${sale.serviceProviderName}</div>
                  </div>
                \`;
              }
              
              // Adicionar motivo da devolução se houver
              if (sale.returnReason) {
                content.innerHTML += \`
                  <div class="return-reason">
                    <strong>Motivo da Devolução:</strong><br>
                    \${sale.returnReason}
                  </div>
                \`;
              }
              
              // Ações
              const actions = document.createElement('div');
              actions.className = 'sale-actions';
              
              // Ações básicas
              actions.innerHTML = \`
                <button class="btn btn-primary" data-action="view-details">Detalhes</button>
                <button class="btn btn-secondary" data-action="view-history">Histórico</button>
              \`;
              
              // Ações condicionais baseadas no papel do usuário e status da venda
              let conditionalActions = '';
              
              if (['admin', 'vendedor', 'supervisor'].includes(userRole)) {
                conditionalActions += \`<button class="btn btn-secondary" data-action="edit">Editar</button>\`;
              }
              
              if (['admin', 'operacional'].includes(userRole) && 
                  (sale.status === 'pending' || sale.status === 'corrected')) {
                conditionalActions += \`
                  <button class="btn \${sale.status === 'corrected' ? 'btn-primary' : 'btn-secondary'}" 
                    data-action="start-execution">Iniciar</button>
                \`;
              }
              
              if (['admin', 'operacional'].includes(userRole) && sale.status === 'in_progress') {
                conditionalActions += \`
                  <button class="btn btn-secondary" data-action="complete-execution">Concluir</button>
                \`;
              }
              
              if (['admin', 'operacional'].includes(userRole) && 
                  (sale.status === 'pending' || sale.status === 'in_progress')) {
                conditionalActions += \`
                  <button class="btn btn-secondary" style="color: #dc2626; border-color: #dc2626;" 
                    data-action="return">Devolver</button>
                \`;
              }
              
              if (['admin', 'financeiro'].includes(userRole) && 
                  sale.status === 'completed' && sale.financialStatus !== 'paid') {
                conditionalActions += \`
                  <button class="btn btn-secondary" data-action="mark-paid">Pago</button>
                \`;
              }
              
              if (['admin', 'supervisor'].includes(userRole)) {
                conditionalActions += \`
                  <button class="btn btn-destructive" data-action="delete">Excluir</button>
                \`;
              }
              
              // Adicionar botões condicionais
              if (conditionalActions) {
                actions.innerHTML += conditionalActions;
              }
              
              // Reunir todos os componentes
              card.appendChild(header);
              card.appendChild(content);
              card.appendChild(actions);
              container.appendChild(card);
            });
            
            // Adicionar event listeners para os botões
            setupEventListeners();
            
            // Ativar rolagem por toque (importante para iOS)
            enableTouchScroll();
          }
          
          // Configurar event listeners
          function setupEventListeners() {
            document.querySelectorAll('.btn').forEach(button => {
              button.addEventListener('click', function(e) {
                e.preventDefault();
                const action = this.getAttribute('data-action');
                const saleId = parseInt(this.closest('.sale-card').getAttribute('data-sale-id'));
                
                if (action && saleId) {
                  // Enviar mensagem para o React
                  window.parent.postMessage({
                    type: 'sale-action',
                    action,
                    saleId
                  }, '*');
                  
                  // Visual feedback
                  this.style.opacity = '0.7';
                  setTimeout(() => {
                    this.style.opacity = '1';
                  }, 200);
                }
              });
            });
          }
          
          // Habilitar rolagem por toque otimizada
          function enableTouchScroll() {
            const container = document.getElementById('sales-container');
            if (!container) return;
            
            // Prevenir efeito de "bounce" do iOS
            document.body.addEventListener('touchmove', function(e) {
              if (container.scrollTop === 0 && container.scrollTop + container.clientHeight >= container.scrollHeight) {
                e.preventDefault();
              }
            }, { passive: false });
            
            // Fixar tamanho da viewport para iOS
            const viewportMeta = document.createElement('meta');
            viewportMeta.name = 'viewport';
            viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(viewportMeta);
            
            // Correção adicional para problemas de rolagem no iOS
            document.addEventListener('gesturestart', function(e) {
              e.preventDefault();
            }, { passive: false });
          }
          
          // Renderizar inicialmente
          document.addEventListener('DOMContentLoaded', function() {
            renderSales();
          });
          
          // Notificar que iframe está pronto
          window.parent.postMessage({ type: 'iframe-ready' }, '*');
        </script>
      </body>
      </html>
    `;
    
    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();
    
  }, [iframeLoaded, data, user, isLoading, error]);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 mt-4 text-center text-red-500">
        <p>Erro ao carregar vendas: {error.message}</p>
      </div>
    );
  }
  
  if (data.length === 0) {
    return (
      <div className="p-4 mt-4 text-center">
        <p className="text-muted-foreground">Nenhuma venda encontrada.</p>
      </div>
    );
  }
  
  return (
    <div className="h-[calc(100vh-230px)] border rounded-lg overflow-hidden iframe-container">
      <iframe
        ref={iframeRef}
        className="w-full h-full border-none"
        title="Lista de Vendas Nativa"
        onLoad={() => setIframeLoaded(true)}
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default UltraNativeMobileView;