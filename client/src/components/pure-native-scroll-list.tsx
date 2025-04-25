import React, { useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStatusLabel, getStatusVariant, getStatusStyle } from "@/lib/status-utils";

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
interface PureNativeScrollListProps {
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

const PureNativeScrollList: React.FC<PureNativeScrollListProps> = ({
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
  DevolveButton,
}) => {
  useEffect(() => {
    // Adicionar classe para configurar o body
    document.body.classList.add('pure-native-mode');
    
    // Limpar ao desmontar
    return () => {
      document.body.classList.remove('pure-native-mode');
    };
  }, []);

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Carregando...</div>;
  }

  if (error) {
    return <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>Erro: {error.message}</div>;
  }

  if (data.length === 0) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Nenhuma venda encontrada.</div>;
  }

  // Abordagem com HTML puro e CSS inline mínimo
  return (
    <div 
      style={{ 
        height: 'calc(100vh - 220px)',
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch',
        padding: '10px',
        paddingBottom: '30px'
      }}
      className="pure-native-scroll-container"
    >
      {data.map((sale) => {
        // Definir cor de fundo com base no status
        let bgColor = '#ffffff';
        if (sale.status === 'pending') bgColor = 'rgba(226, 232, 240, 0.3)';
        if (sale.status === 'in_progress') bgColor = 'rgba(255, 159, 64, 0.3)';
        if (sale.status === 'completed') bgColor = 'rgba(134, 239, 172, 0.3)';
        if (sale.status === 'returned') bgColor = 'rgba(252, 165, 165, 0.3)';
        if (sale.status === 'corrected') bgColor = 'rgba(250, 240, 137, 0.3)';
        
        return (
          <div 
            key={sale.id}
            style={{
              backgroundColor: bgColor,
              borderRadius: '8px',
              marginBottom: '10px',
              overflow: 'hidden',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ 
              padding: '10px', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>OS: {sale.orderNumber}</div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  {format(new Date(sale.date), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              </div>
              <span style={{ 
                fontSize: '0.75rem',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: sale.status === 'pending' ? '#f1f5f9' : 
                                sale.status === 'in_progress' ? '#ffedd5' :
                                sale.status === 'completed' ? '#dcfce7' :
                                sale.status === 'returned' ? '#fee2e2' :
                                sale.status === 'corrected' ? '#fef9c3' : '#f1f5f9',
                color: sale.status === 'pending' ? '#334155' : 
                      sale.status === 'in_progress' ? '#9a3412' :
                      sale.status === 'completed' ? '#166534' :
                      sale.status === 'returned' ? '#b91c1c' :
                      sale.status === 'corrected' ? '#854d0e' : '#334155',
                fontWeight: '500'
              }}>
                {getStatusLabel(sale.status)}
              </span>
            </div>
            
            <div style={{ padding: '10px' }}>
              <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Cliente:</span>{" "}
                {sale.customerName}
              </div>
              
              <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Vendedor:</span>{" "}
                {sale.sellerName}
              </div>
              
              <div style={{ fontSize: '0.875rem', marginBottom: '4px' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Valor:</span>{" "}
                <span style={{ fontWeight: '600' }}>
                  R$ {parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}
                </span>
              </div>
              
              {sale.returnReason && (
                <div style={{ fontSize: '0.875rem', marginTop: '6px', color: '#dc2626' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>Motivo da devolução:</span>{" "}
                  {sale.returnReason}
                </div>
              )}
            </div>
            
            <div style={{ 
              padding: '8px', 
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px'
            }}>
              {/* Botões com HTML puro */}
              <button 
                onClick={() => onViewDetails(sale)}
                style={{
                  backgroundColor: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  flex: '1',
                  minHeight: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Detalhes
              </button>
              
              <button 
                onClick={() => onViewHistory(sale)}
                style={{
                  backgroundColor: 'transparent',
                  color: '#334155',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  flex: '1',
                  minHeight: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                Histórico
              </button>
              
              {/* Botão Editar */}
              {(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") && (
                <button 
                  onClick={() => onEdit(sale)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    flex: '1',
                    minHeight: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Editar
                </button>
              )}
              
              {/* Botão para iniciar execução */}
              {(user?.role === "admin" || user?.role === "operacional") && 
                (sale.status === "pending" || sale.status === "corrected") && (
                <button 
                  onClick={() => onStartExecution(sale)}
                  style={{
                    backgroundColor: sale.status === "corrected" ? '#0d9488' : 'transparent',
                    color: sale.status === "corrected" ? 'white' : '#334155',
                    border: sale.status === "corrected" ? 'none' : '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    flex: '1',
                    minHeight: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Iniciar
                </button>
              )}
              
              {/* Botão para completar execução */}
              {(user?.role === "admin" || user?.role === "operacional") && 
                sale.status === "in_progress" && (
                <button 
                  onClick={() => onCompleteExecution(sale)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    flex: '1',
                    minHeight: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Concluir
                </button>
              )}
              
              {/* Botão para devolver */}
              {(user?.role === "admin" || user?.role === "operacional") && 
                (sale.status === "pending" || sale.status === "in_progress") && (
                <button 
                  onClick={() => onReturnClick(sale)}
                  style={{
                    backgroundColor: 'transparent',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    flex: '1',
                    minHeight: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Devolver
                </button>
              )}
              
              {/* Uso de componentes externos com técnica especial */}
              {sale.status === 'returned' && (
                <div style={{ flex: '1', minHeight: '30px' }}>
                  <ReenviaButton sale={sale} />
                </div>
              )}
              
              {sale.status === "corrected" && (
                <div style={{ flex: '1', minHeight: '30px' }}>
                  <DevolveButton sale={sale} />
                </div>
              )}
              
              {/* Botão marcar como pago */}
              {(user?.role === "admin" || user?.role === "financeiro") && 
                sale.status === "completed" && 
                sale.financialStatus !== "paid" && (
                <button 
                  onClick={() => onMarkAsPaid(sale)}
                  style={{
                    backgroundColor: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    flex: '1',
                    minHeight: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Pago
                </button>
              )}
              
              {/* Botão de excluir */}
              {(user?.role === "admin" || user?.role === "supervisor") && (
                <button 
                  onClick={() => onDeleteClick(sale)}
                  style={{
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    flex: '1',
                    minHeight: '30px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  Excluir
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PureNativeScrollList;