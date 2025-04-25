// Funções de utilidade para status

// Função para obter a descrição do status
export function getStatusLabel(status: string) {
  switch (status) {
    case 'pending': return 'Pendente';
    case 'in_progress': return 'Em Andamento';
    case 'returned': return 'Devolvida';
    case 'completed': return 'Concluída';
    case 'canceled': return 'Cancelada';
    case 'corrected': return 'Corrigida Aguardando Operacional';
    default: return status;
  }
}

// Função para obter a cor do status para componentes Shadcn
export function getStatusVariant(status: string) {
  switch (status) {
    case 'pending': return 'warning';
    case 'in_progress': return 'secondary';
    case 'returned': return 'destructive';
    case 'completed': return 'success';
    case 'canceled': return 'outline';
    case 'corrected': return 'primary';
    default: return 'default';
  }
}

// Função para obter classes CSS para a linha da tabela
export function getStatusRowClass(status: string) {
  // Garantir que sempre retornamos uma string válida
  if (!status) return '';
  
  switch (status) {
    case 'corrected': return 'status-row-corrected'; 
    case 'completed': return 'status-row-completed'; 
    case 'in_progress': return 'status-row-in_progress'; 
    case 'returned': return 'status-row-returned'; 
    default: return '';
  }
}

// Função para obter classes CSS para o card mobile
export function getStatusCardClass(status: string) {
  // Garantir que sempre retornamos uma string válida
  if (!status) return '';
  
  switch (status) {
    case 'corrected': return 'status-card-corrected'; 
    case 'completed': return 'status-card-completed'; 
    case 'in_progress': return 'status-card-in_progress'; 
    case 'returned': return 'status-card-returned'; 
    default: return '';
  }
}

// Função para aplicar estilos inline diretamente
export function getStatusStyle(status: string): Record<string, string> {
  // CORES MAIS INTENSAS USANDO RGB PARA MÁXIMA COMPATIBILIDADE
  switch (status) {
    case 'corrected': 
      return { 
        backgroundColor: 'rgba(250, 240, 137, 0.3)', 
        border: '2px solid rgba(250, 240, 137, 0.6)',
        borderLeft: '5px solid rgba(250, 240, 137, 0.8)'
      }; 
    case 'completed': 
      return { 
        backgroundColor: 'rgba(134, 239, 172, 0.3)', 
        border: '2px solid rgba(134, 239, 172, 0.6)',
        borderLeft: '5px solid rgba(134, 239, 172, 0.8)'
      }; 
    case 'in_progress': 
      return { 
        backgroundColor: 'rgba(255, 159, 64, 0.3)', 
        border: '2px solid rgba(255, 159, 64, 0.6)',
        borderLeft: '5px solid rgba(255, 159, 64, 0.8)'
      }; 
    case 'returned': 
      return { 
        backgroundColor: 'rgba(252, 165, 165, 0.3)', 
        border: '2px solid rgba(252, 165, 165, 0.6)',
        borderLeft: '5px solid rgba(252, 165, 165, 0.8)'
      }; 
    default: 
      return {};
  }
}