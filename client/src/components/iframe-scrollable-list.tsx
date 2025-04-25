import React, { useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

// Interface para as props do componente
interface IframeScrollableListProps {
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

// Este componente renderiza o conteúdo que vai dentro do iframe
const IframeContent: React.FC<IframeScrollableListProps> = (props) => {
  const iframeDocument = document.currentScript?.ownerDocument;
  
  // Chegar se estamos rodando dentro de um iframe
  if (!iframeDocument) {
    return null; // Não estamos dentro de um iframe
  }
  
  // Função para gerar o HTML do conteúdo a ser renderizado no iframe
  const generateContentHTML = () => {
    const { data, isLoading, error, user } = props;
    
    if (isLoading) {
      return `<div style="padding: 20px; text-align: center;">Carregando...</div>`;
    }
    
    if (error) {
      return `<div style="padding: 20px; text-align: center; color: red;">Erro: ${error.message}</div>`;
    }
    
    if (data.length === 0) {
      return `<div style="padding: 20px; text-align: center;">Nenhuma venda encontrada.</div>`;
    }
    
    // Criar uma string de HTML para cada venda
    const salesHTML = data.map((sale) => {
      // Definir cor de fundo com base no status
      let bgColor = '#ffffff';
      if (sale.status === 'pending') bgColor = 'rgba(226, 232, 240, 0.3)';
      if (sale.status === 'in_progress') bgColor = 'rgba(255, 159, 64, 0.3)';
      if (sale.status === 'completed') bgColor = 'rgba(134, 239, 172, 0.3)';
      if (sale.status === 'returned') bgColor = 'rgba(252, 165, 165, 0.3)';
      if (sale.status === 'corrected') bgColor = 'rgba(250, 240, 137, 0.3)';
      
      // Labels baseados no status
      const statusLabel = 
        sale.status === 'pending' ? 'Pendente' :
        sale.status === 'in_progress' ? 'Em Andamento' :
        sale.status === 'completed' ? 'Concluído' :
        sale.status === 'returned' ? 'Devolvido' :
        sale.status === 'corrected' ? 'Corrigido' : 'Desconhecido';
      
      // Cores baseadas no status para o badge
      const statusBgColor = 
        sale.status === 'pending' ? '#f1f5f9' :
        sale.status === 'in_progress' ? '#ffedd5' :
        sale.status === 'completed' ? '#dcfce7' :
        sale.status === 'returned' ? '#fee2e2' :
        sale.status === 'corrected' ? '#fef9c3' : '#f1f5f9';
        
      const statusTextColor = 
        sale.status === 'pending' ? '#334155' :
        sale.status === 'in_progress' ? '#9a3412' :
        sale.status === 'completed' ? '#166534' :
        sale.status === 'returned' ? '#b91c1c' :
        sale.status === 'corrected' ? '#854d0e' : '#334155';
      
      // Formatar a data
      const dateParts = new Date(sale.date).toLocaleDateString('pt-BR').split('/');
      const formattedDate = `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`;
      
      return `
        <div 
          class="sale-card"
          data-id="${sale.id}"
          style="
            background-color: ${bgColor};
            border-radius: 8px;
            margin-bottom: 10px;
            overflow: hidden;
            border: 1px solid #e2e8f0;
          "
        >
          <div style="
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 1px solid #e2e8f0;
          ">
            <div>
              <div style="font-weight: bold;">OS: ${sale.orderNumber}</div>
              <div style="font-size: 0.875rem; color: #64748b;">
                ${formattedDate}
              </div>
            </div>
            <span style="
              font-size: 0.75rem;
              padding: 2px 8px;
              border-radius: 9999px;
              background-color: ${statusBgColor};
              color: ${statusTextColor};
              font-weight: 500;
            ">
              ${statusLabel}
            </span>
          </div>
          
          <div style="padding: 10px;">
            <div style="font-size: 0.875rem; margin-bottom: 4px;">
              <span style="color: #64748b; font-size: 0.75rem;">Cliente:</span>
              ${sale.customerName}
            </div>
            
            <div style="font-size: 0.875rem; margin-bottom: 4px;">
              <span style="color: #64748b; font-size: 0.75rem;">Vendedor:</span>
              ${sale.sellerName}
            </div>
            
            <div style="font-size: 0.875rem; margin-bottom: 4px;">
              <span style="color: #64748b; font-size: 0.75rem;">Valor:</span>
              <span style="font-weight: 600;">
                R$ ${parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
              </span>
            </div>
            
            ${sale.returnReason ? `
              <div style="font-size: 0.875rem; margin-top: 6px; color: #dc2626;">
                <span style="font-size: 0.75rem; font-weight: 600;">Motivo da devolução:</span>
                ${sale.returnReason}
              </div>
            ` : ''}
          </div>
          
          <div style="
            padding: 8px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
          ">
            <!-- Botão de Detalhes -->
            <button 
              class="action-button"
              data-action="details"
              data-id="${sale.id}"
              style="
                background-color: #0ea5e9;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 4px 10px;
                font-size: 0.75rem;
                cursor: pointer;
                flex: 1;
                min-height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              Detalhes
            </button>
            
            <!-- Botão de Histórico -->
            <button 
              class="action-button"
              data-action="history"
              data-id="${sale.id}"
              style="
                background-color: transparent;
                color: #334155;
                border: 1px solid #cbd5e1;
                border-radius: 4px;
                padding: 4px 10px;
                font-size: 0.75rem;
                cursor: pointer;
                flex: 1;
                min-height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
              "
            >
              Histórico
            </button>
            
            <!-- Botão Editar -->
            ${(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") ? `
              <button 
                class="action-button"
                data-action="edit"
                data-id="${sale.id}"
                style="
                  background-color: transparent;
                  color: #334155;
                  border: 1px solid #cbd5e1;
                  border-radius: 4px;
                  padding: 4px 10px;
                  font-size: 0.75rem;
                  cursor: pointer;
                  flex: 1;
                  min-height: 30px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                Editar
              </button>
            ` : ''}
            
            <!-- Botão para iniciar execução -->
            ${(user?.role === "admin" || user?.role === "operacional") && 
              (sale.status === "pending" || sale.status === "corrected") ? `
              <button 
                class="action-button"
                data-action="start-execution"
                data-id="${sale.id}"
                style="
                  background-color: ${sale.status === "corrected" ? '#0d9488' : 'transparent'};
                  color: ${sale.status === "corrected" ? 'white' : '#334155'};
                  border: ${sale.status === "corrected" ? 'none' : '1px solid #cbd5e1'};
                  border-radius: 4px;
                  padding: 4px 10px;
                  font-size: 0.75rem;
                  cursor: pointer;
                  flex: 1;
                  min-height: 30px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                Iniciar
              </button>
            ` : ''}
            
            <!-- Botão para completar execução -->
            ${(user?.role === "admin" || user?.role === "operacional") && 
              sale.status === "in_progress" ? `
              <button 
                class="action-button"
                data-action="complete-execution"
                data-id="${sale.id}"
                style="
                  background-color: transparent;
                  color: #334155;
                  border: 1px solid #cbd5e1;
                  border-radius: 4px;
                  padding: 4px 10px;
                  font-size: 0.75rem;
                  cursor: pointer;
                  flex: 1;
                  min-height: 30px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                Concluir
              </button>
            ` : ''}
            
            <!-- Botão para devolver -->
            ${(user?.role === "admin" || user?.role === "operacional") && 
              (sale.status === "pending" || sale.status === "in_progress") ? `
              <button 
                class="action-button"
                data-action="return"
                data-id="${sale.id}"
                style="
                  background-color: transparent;
                  color: #dc2626;
                  border: 1px solid #dc2626;
                  border-radius: 4px;
                  padding: 4px 10px;
                  font-size: 0.75rem;
                  cursor: pointer;
                  flex: 1;
                  min-height: 30px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                Devolver
              </button>
            ` : ''}
            
            <!-- Botão marcar como pago -->
            ${(user?.role === "admin" || user?.role === "financeiro") && 
              sale.status === "completed" && 
              sale.financialStatus !== "paid" ? `
              <button 
                class="action-button"
                data-action="mark-as-paid"
                data-id="${sale.id}"
                style="
                  background-color: #f8fafc;
                  color: #334155;
                  border: 1px solid #cbd5e1;
                  border-radius: 4px;
                  padding: 4px 10px;
                  font-size: 0.75rem;
                  cursor: pointer;
                  flex: 1;
                  min-height: 30px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                Pago
              </button>
            ` : ''}
            
            <!-- Botão de excluir -->
            ${(user?.role === "admin" || user?.role === "supervisor") ? `
              <button 
                class="action-button"
                data-action="delete"
                data-id="${sale.id}"
                style="
                  background-color: #dc2626;
                  color: white;
                  border: none;
                  border-radius: 4px;
                  padding: 4px 10px;
                  font-size: 0.75rem;
                  cursor: pointer;
                  flex: 1;
                  min-height: 30px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                "
              >
                Excluir
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    return `
      <div style="padding: 10px; padding-bottom: 30px;">
        ${salesHTML}
      </div>
    `;
  };
  
  return (
    <div
      dangerouslySetInnerHTML={{
        __html: generateContentHTML(),
      }}
    />
  );
};

// Componente principal que usa o iframe
const IframeScrollableList: React.FC<IframeScrollableListProps> = (props) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState('calc(100vh - 220px)');
  
  // Preparar o conteúdo do iframe
  const iframeContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <style>
        html, body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          -webkit-overflow-scrolling: touch;
          overflow-y: auto;
          height: 100%;
          background: transparent;
        }
        
        * {
          -webkit-tap-highlight-color: transparent;
          box-sizing: border-box;
        }
        
        .sale-card {
          transition: transform 0.1s ease;
        }
        
        .sale-card:active {
          transform: scale(0.98);
        }
        
        .action-button {
          -webkit-appearance: none;
          -moz-appearance: none;
          appearance: none;
          user-select: none;
        }
      </style>
    </head>
    <body>
      <div id="content"></div>
      <script>
        // Função para lidar com cliques nos botões
        document.addEventListener('click', function(e) {
          // Encontrar o botão mais próximo se clicar em algum elemento dentro dele
          let target = e.target;
          while (target && !target.classList.contains('action-button')) {
            target = target.parentElement;
          }
          
          // Se encontramos um botão
          if (target && target.classList.contains('action-button')) {
            const action = target.getAttribute('data-action');
            const id = parseInt(target.getAttribute('data-id'), 10);
            
            // Enviar a ação para o componente React
            window.parent.postMessage({
              type: 'iframe-action',
              action: action,
              id: id
            }, '*');
          }
        });
      </script>
    </body>
    </html>
  `;
  
  useEffect(() => {
    // Funçào para tratar mensagens do iframe
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'iframe-action') {
        const { action, id } = event.data;
        // Encontrar a venda pelo ID
        const sale = props.data.find(sale => sale.id === id);
        
        if (sale) {
          // Executar a ação apropriada
          switch (action) {
            case 'details':
              props.onViewDetails(sale);
              break;
            case 'history':
              props.onViewHistory(sale);
              break;
            case 'edit':
              props.onEdit(sale);
              break;
            case 'start-execution':
              props.onStartExecution(sale);
              break;
            case 'complete-execution':
              props.onCompleteExecution(sale);
              break;
            case 'return':
              props.onReturnClick(sale);
              break;
            case 'mark-as-paid':
              props.onMarkAsPaid(sale);
              break;
            case 'delete':
              props.onDeleteClick(sale);
              break;
          }
        }
      }
    };
    
    // Adicionar listener para mensagens do iframe
    window.addEventListener('message', handleMessage);
    
    // Carregar o conteúdo no iframe
    const iframe = iframeRef.current;
    if (iframe && iframe.contentWindow) {
      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(iframeContent);
      doc.close();
      
      // Renderizar o conteúdo
      const contentDiv = doc.getElementById('content');
      if (contentDiv) {
        // Renderizar as vendas dentro do iframe
        contentDiv.innerHTML = `
          ${props.isLoading ? '<div style="padding: 20px; text-align: center;">Carregando...</div>' : ''}
          ${props.error ? `<div style="padding: 20px; text-align: center; color: red;">Erro: ${props.error.message}</div>` : ''}
          ${!props.isLoading && !props.error && props.data.length === 0 ? '<div style="padding: 20px; text-align: center;">Nenhuma venda encontrada.</div>' : ''}
        `;
        
        if (!props.isLoading && !props.error && props.data.length > 0) {
          // Criar cartões para cada venda
          const salesContainer = document.createElement('div');
          salesContainer.style.padding = '10px';
          salesContainer.style.paddingBottom = '30px';
          
          props.data.forEach((sale) => {
            // Definir cor de fundo com base no status
            let bgColor = '#ffffff';
            if (sale.status === 'pending') bgColor = 'rgba(226, 232, 240, 0.3)';
            if (sale.status === 'in_progress') bgColor = 'rgba(255, 159, 64, 0.3)';
            if (sale.status === 'completed') bgColor = 'rgba(134, 239, 172, 0.3)';
            if (sale.status === 'returned') bgColor = 'rgba(252, 165, 165, 0.3)';
            if (sale.status === 'corrected') bgColor = 'rgba(250, 240, 137, 0.3)';
            
            // Labels baseados no status
            const statusLabel = 
              sale.status === 'pending' ? 'Pendente' :
              sale.status === 'in_progress' ? 'Em Andamento' :
              sale.status === 'completed' ? 'Concluído' :
              sale.status === 'returned' ? 'Devolvido' :
              sale.status === 'corrected' ? 'Corrigido' : 'Desconhecido';
            
            // Cores baseadas no status para o badge
            const statusBgColor = 
              sale.status === 'pending' ? '#f1f5f9' :
              sale.status === 'in_progress' ? '#ffedd5' :
              sale.status === 'completed' ? '#dcfce7' :
              sale.status === 'returned' ? '#fee2e2' :
              sale.status === 'corrected' ? '#fef9c3' : '#f1f5f9';
              
            const statusTextColor = 
              sale.status === 'pending' ? '#334155' :
              sale.status === 'in_progress' ? '#9a3412' :
              sale.status === 'completed' ? '#166534' :
              sale.status === 'returned' ? '#b91c1c' :
              sale.status === 'corrected' ? '#854d0e' : '#334155';
              
            // Criar o cartão da venda
            const card = document.createElement('div');
            card.className = 'sale-card';
            card.setAttribute('data-id', sale.id.toString());
            card.style.backgroundColor = bgColor;
            card.style.borderRadius = '8px';
            card.style.marginBottom = '10px';
            card.style.overflow = 'hidden';
            card.style.border = '1px solid #e2e8f0';
            
            // Cabeçalho
            const header = document.createElement('div');
            header.style.padding = '10px';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'flex-start';
            header.style.borderBottom = '1px solid #e2e8f0';
            
            const headerLeft = document.createElement('div');
            
            const orderNumber = document.createElement('div');
            orderNumber.style.fontWeight = 'bold';
            orderNumber.textContent = `OS: ${sale.orderNumber}`;
            
            const dateEl = document.createElement('div');
            dateEl.style.fontSize = '0.875rem';
            dateEl.style.color = '#64748b';
            dateEl.textContent = format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR });
            
            headerLeft.appendChild(orderNumber);
            headerLeft.appendChild(dateEl);
            
            const statusBadge = document.createElement('span');
            statusBadge.style.fontSize = '0.75rem';
            statusBadge.style.padding = '2px 8px';
            statusBadge.style.borderRadius = '9999px';
            statusBadge.style.backgroundColor = statusBgColor;
            statusBadge.style.color = statusTextColor;
            statusBadge.style.fontWeight = '500';
            statusBadge.textContent = statusLabel;
            
            header.appendChild(headerLeft);
            header.appendChild(statusBadge);
            
            // Conteúdo
            const content = document.createElement('div');
            content.style.padding = '10px';
            
            const customerInfo = document.createElement('div');
            customerInfo.style.fontSize = '0.875rem';
            customerInfo.style.marginBottom = '4px';
            
            const customerLabel = document.createElement('span');
            customerLabel.style.color = '#64748b';
            customerLabel.style.fontSize = '0.75rem';
            customerLabel.textContent = 'Cliente: ';
            
            customerInfo.appendChild(customerLabel);
            customerInfo.appendChild(document.createTextNode(sale.customerName || ''));
            
            const sellerInfo = document.createElement('div');
            sellerInfo.style.fontSize = '0.875rem';
            sellerInfo.style.marginBottom = '4px';
            
            const sellerLabel = document.createElement('span');
            sellerLabel.style.color = '#64748b';
            sellerLabel.style.fontSize = '0.75rem';
            sellerLabel.textContent = 'Vendedor: ';
            
            sellerInfo.appendChild(sellerLabel);
            sellerInfo.appendChild(document.createTextNode(sale.sellerName || ''));
            
            const totalInfo = document.createElement('div');
            totalInfo.style.fontSize = '0.875rem';
            totalInfo.style.marginBottom = '4px';
            
            const totalLabel = document.createElement('span');
            totalLabel.style.color = '#64748b';
            totalLabel.style.fontSize = '0.75rem';
            totalLabel.textContent = 'Valor: ';
            
            const totalValue = document.createElement('span');
            totalValue.style.fontWeight = '600';
            totalValue.textContent = `R$ ${parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}`;
            
            totalInfo.appendChild(totalLabel);
            totalInfo.appendChild(totalValue);
            
            content.appendChild(customerInfo);
            content.appendChild(sellerInfo);
            content.appendChild(totalInfo);
            
            if (sale.returnReason) {
              const returnInfo = document.createElement('div');
              returnInfo.style.fontSize = '0.875rem';
              returnInfo.style.marginTop = '6px';
              returnInfo.style.color = '#dc2626';
              
              const returnLabel = document.createElement('span');
              returnLabel.style.fontSize = '0.75rem';
              returnLabel.style.fontWeight = '600';
              returnLabel.textContent = 'Motivo da devolução: ';
              
              returnInfo.appendChild(returnLabel);
              returnInfo.appendChild(document.createTextNode(sale.returnReason));
              
              content.appendChild(returnInfo);
            }
            
            // Footer com botões
            const footer = document.createElement('div');
            footer.style.padding = '8px';
            footer.style.borderTop = '1px solid #e2e8f0';
            footer.style.display = 'flex';
            footer.style.flexWrap = 'wrap';
            footer.style.gap = '4px';
            
            // Botão de Detalhes
            const detailsButton = document.createElement('button');
            detailsButton.className = 'action-button';
            detailsButton.setAttribute('data-action', 'details');
            detailsButton.setAttribute('data-id', sale.id.toString());
            detailsButton.style.backgroundColor = '#0ea5e9';
            detailsButton.style.color = 'white';
            detailsButton.style.border = 'none';
            detailsButton.style.borderRadius = '4px';
            detailsButton.style.padding = '4px 10px';
            detailsButton.style.fontSize = '0.75rem';
            detailsButton.style.cursor = 'pointer';
            detailsButton.style.flex = '1';
            detailsButton.style.minHeight = '30px';
            detailsButton.style.display = 'flex';
            detailsButton.style.alignItems = 'center';
            detailsButton.style.justifyContent = 'center';
            detailsButton.textContent = 'Detalhes';
            
            footer.appendChild(detailsButton);
            
            // Botão de Histórico
            const historyButton = document.createElement('button');
            historyButton.className = 'action-button';
            historyButton.setAttribute('data-action', 'history');
            historyButton.setAttribute('data-id', sale.id.toString());
            historyButton.style.backgroundColor = 'transparent';
            historyButton.style.color = '#334155';
            historyButton.style.border = '1px solid #cbd5e1';
            historyButton.style.borderRadius = '4px';
            historyButton.style.padding = '4px 10px';
            historyButton.style.fontSize = '0.75rem';
            historyButton.style.cursor = 'pointer';
            historyButton.style.flex = '1';
            historyButton.style.minHeight = '30px';
            historyButton.style.display = 'flex';
            historyButton.style.alignItems = 'center';
            historyButton.style.justifyContent = 'center';
            historyButton.textContent = 'Histórico';
            
            footer.appendChild(historyButton);
            
            // Botão Editar (condicional)
            if (props.user?.role === "admin" || props.user?.role === "vendedor" || props.user?.role === "supervisor") {
              const editButton = document.createElement('button');
              editButton.className = 'action-button';
              editButton.setAttribute('data-action', 'edit');
              editButton.setAttribute('data-id', sale.id.toString());
              editButton.style.backgroundColor = 'transparent';
              editButton.style.color = '#334155';
              editButton.style.border = '1px solid #cbd5e1';
              editButton.style.borderRadius = '4px';
              editButton.style.padding = '4px 10px';
              editButton.style.fontSize = '0.75rem';
              editButton.style.cursor = 'pointer';
              editButton.style.flex = '1';
              editButton.style.minHeight = '30px';
              editButton.style.display = 'flex';
              editButton.style.alignItems = 'center';
              editButton.style.justifyContent = 'center';
              editButton.textContent = 'Editar';
              
              footer.appendChild(editButton);
            }
            
            // Outros botões condicionais conforme permissões e estado da venda
            
            // Botão para iniciar execução
            if ((props.user?.role === "admin" || props.user?.role === "operacional") && 
                (sale.status === "pending" || sale.status === "corrected")) {
              const startButton = document.createElement('button');
              startButton.className = 'action-button';
              startButton.setAttribute('data-action', 'start-execution');
              startButton.setAttribute('data-id', sale.id.toString());
              startButton.style.backgroundColor = sale.status === "corrected" ? '#0d9488' : 'transparent';
              startButton.style.color = sale.status === "corrected" ? 'white' : '#334155';
              startButton.style.border = sale.status === "corrected" ? 'none' : '1px solid #cbd5e1';
              startButton.style.borderRadius = '4px';
              startButton.style.padding = '4px 10px';
              startButton.style.fontSize = '0.75rem';
              startButton.style.cursor = 'pointer';
              startButton.style.flex = '1';
              startButton.style.minHeight = '30px';
              startButton.style.display = 'flex';
              startButton.style.alignItems = 'center';
              startButton.style.justifyContent = 'center';
              startButton.textContent = 'Iniciar';
              
              footer.appendChild(startButton);
            }
            
            // Botão para completar execução
            if ((props.user?.role === "admin" || props.user?.role === "operacional") && 
                sale.status === "in_progress") {
              const completeButton = document.createElement('button');
              completeButton.className = 'action-button';
              completeButton.setAttribute('data-action', 'complete-execution');
              completeButton.setAttribute('data-id', sale.id.toString());
              completeButton.style.backgroundColor = 'transparent';
              completeButton.style.color = '#334155';
              completeButton.style.border = '1px solid #cbd5e1';
              completeButton.style.borderRadius = '4px';
              completeButton.style.padding = '4px 10px';
              completeButton.style.fontSize = '0.75rem';
              completeButton.style.cursor = 'pointer';
              completeButton.style.flex = '1';
              completeButton.style.minHeight = '30px';
              completeButton.style.display = 'flex';
              completeButton.style.alignItems = 'center';
              completeButton.style.justifyContent = 'center';
              completeButton.textContent = 'Concluir';
              
              footer.appendChild(completeButton);
            }
            
            // Botão para devolver
            if ((props.user?.role === "admin" || props.user?.role === "operacional") && 
                (sale.status === "pending" || sale.status === "in_progress")) {
              const returnButton = document.createElement('button');
              returnButton.className = 'action-button';
              returnButton.setAttribute('data-action', 'return');
              returnButton.setAttribute('data-id', sale.id.toString());
              returnButton.style.backgroundColor = 'transparent';
              returnButton.style.color = '#dc2626';
              returnButton.style.border = '1px solid #dc2626';
              returnButton.style.borderRadius = '4px';
              returnButton.style.padding = '4px 10px';
              returnButton.style.fontSize = '0.75rem';
              returnButton.style.cursor = 'pointer';
              returnButton.style.flex = '1';
              returnButton.style.minHeight = '30px';
              returnButton.style.display = 'flex';
              returnButton.style.alignItems = 'center';
              returnButton.style.justifyContent = 'center';
              returnButton.textContent = 'Devolver';
              
              footer.appendChild(returnButton);
            }
            
            // Botão marcar como pago
            if ((props.user?.role === "admin" || props.user?.role === "financeiro") && 
                sale.status === "completed" && 
                sale.financialStatus !== "paid") {
              const paidButton = document.createElement('button');
              paidButton.className = 'action-button';
              paidButton.setAttribute('data-action', 'mark-as-paid');
              paidButton.setAttribute('data-id', sale.id.toString());
              paidButton.style.backgroundColor = '#f8fafc';
              paidButton.style.color = '#334155';
              paidButton.style.border = '1px solid #cbd5e1';
              paidButton.style.borderRadius = '4px';
              paidButton.style.padding = '4px 10px';
              paidButton.style.fontSize = '0.75rem';
              paidButton.style.cursor = 'pointer';
              paidButton.style.flex = '1';
              paidButton.style.minHeight = '30px';
              paidButton.style.display = 'flex';
              paidButton.style.alignItems = 'center';
              paidButton.style.justifyContent = 'center';
              paidButton.textContent = 'Pago';
              
              footer.appendChild(paidButton);
            }
            
            // Botão de excluir
            if (props.user?.role === "admin" || props.user?.role === "supervisor") {
              const deleteButton = document.createElement('button');
              deleteButton.className = 'action-button';
              deleteButton.setAttribute('data-action', 'delete');
              deleteButton.setAttribute('data-id', sale.id.toString());
              deleteButton.style.backgroundColor = '#dc2626';
              deleteButton.style.color = 'white';
              deleteButton.style.border = 'none';
              deleteButton.style.borderRadius = '4px';
              deleteButton.style.padding = '4px 10px';
              deleteButton.style.fontSize = '0.75rem';
              deleteButton.style.cursor = 'pointer';
              deleteButton.style.flex = '1';
              deleteButton.style.minHeight = '30px';
              deleteButton.style.display = 'flex';
              deleteButton.style.alignItems = 'center';
              deleteButton.style.justifyContent = 'center';
              deleteButton.textContent = 'Excluir';
              
              footer.appendChild(deleteButton);
            }
            
            // Montar o cartão completo
            card.appendChild(header);
            card.appendChild(content);
            card.appendChild(footer);
            
            salesContainer.appendChild(card);
          });
          
          contentDiv.appendChild(salesContainer);
        }
      }
    }
    
    // Detectar dispositivo iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
    // Ajustar altura para dispositivos iOS
    if (isIOS) {
      setIframeHeight('calc(100vh - 240px)');
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [props, props.data, props.isLoading, props.error, props.user]);
  
  return (
    <iframe
      ref={iframeRef}
      title="Sales Scrollable List"
      style={{
        width: '100%',
        height: iframeHeight,
        border: 'none',
        background: 'transparent',
        borderRadius: '8px',
        overflowY: 'auto',
      }}
      sandbox="allow-same-origin allow-scripts"
    />
  );
};

export default IframeScrollableList;