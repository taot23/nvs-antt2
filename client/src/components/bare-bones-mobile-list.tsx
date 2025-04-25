import React from 'react';

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

interface BareBonesMobileListProps {
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

/**
 * Componente ultra-simplificado para dispositivos móveis
 * Projetado para ter compatibilidade máxima e desempenho com foco em usabilidade
 */
export default function BareBonesMobileList({
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
}: BareBonesMobileListProps) {
  
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
        Carregando...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '20px', 
        color: '#d32f2f',
        backgroundColor: '#ffebee',
        margin: '10px',
        borderRadius: '4px'
      }}>
        Erro: {error.message}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '20px', 
        color: '#666',
        backgroundColor: '#f5f5f5',
        margin: '10px',
        borderRadius: '4px'
      }}>
        Nenhuma venda encontrada
      </div>
    );
  }

  return (
    <div style={{ padding: '10px', maxWidth: '100%', overflowX: 'hidden' }}>
      <h3 style={{ 
        textAlign: 'center', 
        margin: '10px 0', 
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#333'
      }}>
        Lista de Vendas
      </h3>
      
      <table 
        style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '14px',
          tableLayout: 'fixed'
        }}
      >
        <thead>
          <tr style={{ backgroundColor: '#f5f5f5' }}>
            <th style={{ 
              padding: '8px', 
              textAlign: 'left', 
              borderBottom: '1px solid #ddd',
              width: '30%'
            }}>
              OS
            </th>
            <th style={{ 
              padding: '8px', 
              textAlign: 'left', 
              borderBottom: '1px solid #ddd',
              width: '40%'
            }}>
              Cliente
            </th>
            <th style={{ 
              padding: '8px', 
              textAlign: 'right', 
              borderBottom: '1px solid #ddd',
              width: '30%'
            }}>
              Ações
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((sale) => {
            // Determinar cor de fundo com base no status
            let statusColor = '#fff';
            switch(sale.status) {
              case 'pending': statusColor = '#f8f8f8'; break;
              case 'in_progress': statusColor = '#fff8e1'; break;
              case 'completed': statusColor = '#e8f5e9'; break;
              case 'returned': statusColor = '#ffebee'; break;
              case 'corrected': statusColor = '#e1f5fe'; break;
              default: statusColor = '#fff';
            }
            
            return (
              <React.Fragment key={sale.id}>
                <tr style={{ backgroundColor: statusColor }}>
                  <td style={{ 
                    padding: '8px', 
                    borderBottom: '1px solid #ddd',
                    fontWeight: 'bold'
                  }}>
                    {sale.orderNumber}
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666',
                      fontWeight: 'normal'
                    }}>
                      {formatStatus(sale.status)}
                    </div>
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    borderBottom: '1px solid #ddd'
                  }}>
                    <div style={{ fontSize: '14px' }}>
                      {sale.customerName || `Cliente #${sale.customerId}`}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#666'
                    }}>
                      {formatCurrency(sale.totalAmount)}
                    </div>
                  </td>
                  <td style={{ 
                    padding: '8px', 
                    borderBottom: '1px solid #ddd',
                    textAlign: 'right'
                  }}>
                    <button 
                      onClick={() => onViewDetails(sale)}
                      style={{
                        backgroundColor: '#2196f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        margin: '2px',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
                <tr style={{ backgroundColor: statusColor }}>
                  <td colSpan={3} style={{ 
                    padding: '0 8px 8px',
                    borderBottom: '1px solid #ddd'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexWrap: 'wrap',
                      gap: '5px',
                      justifyContent: 'center'
                    }}>
                      {/* Primary Actions - Always Visible */}
                      <button 
                        onClick={() => onViewHistory(sale)}
                        style={{
                          backgroundColor: '#607d8b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          margin: '2px',
                          fontSize: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        Histórico
                      </button>
                      
                      {/* Edit Button - For admin, vendedor, supervisor */}
                      {(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") && (
                        <button 
                          onClick={() => onEdit(sale)}
                          style={{
                            backgroundColor: '#9e9e9e',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            margin: '2px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Editar
                        </button>
                      )}
                      
                      {/* Start Execution Button - For admin, operacional */}
                      {(user?.role === "admin" || user?.role === "operacional") && 
                       (sale.status === "pending" || sale.status === "corrected") && (
                        <button 
                          onClick={() => onStartExecution(sale)}
                          style={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            margin: '2px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Iniciar
                        </button>
                      )}
                      
                      {/* Complete Execution Button - For admin, operacional */}
                      {(user?.role === "admin" || user?.role === "operacional") && 
                       sale.status === "in_progress" && (
                        <button 
                          onClick={() => onCompleteExecution(sale)}
                          style={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            margin: '2px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Concluir
                        </button>
                      )}
                      
                      {/* Return Button - For admin, operacional */}
                      {(user?.role === "admin" || user?.role === "operacional") && 
                       (sale.status === "pending" || sale.status === "in_progress") && (
                        <button 
                          onClick={() => onReturnClick(sale)}
                          style={{
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            margin: '2px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Devolver
                        </button>
                      )}
                      
                      {/* Mark as Paid Button - For admin, financeiro */}
                      {(user?.role === "admin" || user?.role === "financeiro") && 
                       sale.status === "completed" && sale.financialStatus !== "paid" && (
                        <button 
                          onClick={() => onMarkAsPaid(sale)}
                          style={{
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            margin: '2px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Pago
                        </button>
                      )}
                      
                      {/* Delete Button - For admin, supervisor */}
                      {(user?.role === "admin" || user?.role === "supervisor") && (
                        <button 
                          onClick={() => onDeleteClick(sale)}
                          style={{
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            padding: '4px 8px',
                            margin: '2px',
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Excluir
                        </button>
                      )}
                      
                      {/* Custom Buttons */}
                      <div style={{ display: 'inline-block' }}>
                        <ReenviaButton sale={sale} />
                      </div>
                      <div style={{ display: 'inline-block' }}>
                        <DevolveButton sale={sale} />
                      </div>
                    </div>
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Função auxiliar para formatar status
function formatStatus(status: string): string {
  switch(status) {
    case 'pending': return 'Pendente';
    case 'in_progress': return 'Em Andamento';
    case 'completed': return 'Concluída';
    case 'returned': return 'Devolvida';
    case 'corrected': return 'Corrigida';
    default: return status;
  }
}

// Função auxiliar para formatar moeda
function formatCurrency(value: string): string {
  const numValue = parseFloat(value);
  return numValue.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
}