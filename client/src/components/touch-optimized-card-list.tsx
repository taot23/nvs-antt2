import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getStatusLabel, getStatusVariant } from "@/lib/status-utils";

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
interface TouchOptimizedCardListProps {
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

// Componente de cartão de venda com suporte nativo a gestos touch
const TouchOptimizedCardList: React.FC<TouchOptimizedCardListProps> = ({
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState(false);
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const [containerHeight, setContainerHeight] = useState('calc(100vh - 220px)');
  
  // Detectar iOS para ajustes específicos
  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
    if (isIOS) {
      setContainerHeight('calc(100vh - 250px)');
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      document.documentElement.style.position = 'fixed';
      document.documentElement.style.width = '100%';
      document.documentElement.style.height = '100%';
      
      // Prevenindo bounce (efeito elástico) no iOS
      document.addEventListener('touchmove', preventIOSBounce, { passive: false });
      
      return () => {
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';
        document.documentElement.style.position = '';
        document.documentElement.style.width = '';
        document.documentElement.style.height = '';
        document.removeEventListener('touchmove', preventIOSBounce);
      }
    }
  }, []);
  
  // Prevenir efeito de "bounce" no iOS
  const preventIOSBounce = (e: TouchEvent) => {
    if (isScrollLocked) {
      e.preventDefault();
    }
  };
  
  // Handlers para gestos de toque
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStartY(e.touches[0].clientY);
      setTouchStartX(e.touches[0].clientX);
      setIsHorizontalSwipe(false);
      setIsScrollLocked(false);
    }
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touchY = e.touches[0].clientY;
      const touchX = e.touches[0].clientX;
      const deltaY = touchStartY - touchY;
      const deltaX = touchStartX - touchX;
      
      // Determinar se o gesto é horizontal ou vertical
      if (!isHorizontalSwipe && !isScrollLocked) {
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          setIsHorizontalSwipe(true);
          e.preventDefault(); // Prevenir scroll quando for swipe horizontal
        } else if (Math.abs(deltaY) > 10) {
          setIsScrollLocked(true);
        }
      }
      
      // Tratar swipe horizontal
      if (isHorizontalSwipe) {
        e.preventDefault();
      }
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (isHorizontalSwipe) {
      const touchEndX = e.changedTouches[0].clientX;
      const deltaX = touchStartX - touchEndX;
      
      // Swipe de 50px para mudar cartão
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0 && activeCardIndex < data.length - 1) {
          // Swipe para esquerda (próximo)
          setActiveCardIndex(activeCardIndex + 1);
        } else if (deltaX < 0 && activeCardIndex > 0) {
          // Swipe para direita (anterior)
          setActiveCardIndex(activeCardIndex - 1);
        }
      }
    }
    
    setIsHorizontalSwipe(false);
    setIsScrollLocked(false);
  };
  
  // Para navegação manual
  const goToNext = () => {
    if (activeCardIndex < data.length - 1) {
      setActiveCardIndex(activeCardIndex + 1);
    }
  };
  
  const goToPrevious = () => {
    if (activeCardIndex > 0) {
      setActiveCardIndex(activeCardIndex - 1);
    }
  };
  
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
  
  const currentSale = data[activeCardIndex];
  
  return (
    <div className="relative" style={{ height: containerHeight }}>
      {/* Indicador de paginação */}
      <div className="flex justify-between items-center p-2 bg-background/80 sticky top-0 z-10">
        <div className="text-xs text-muted-foreground">
          Venda {activeCardIndex + 1} de {data.length}
        </div>
        <div className="space-x-2">
          <button 
            className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md disabled:opacity-50"
            onClick={goToPrevious}
            disabled={activeCardIndex === 0}
          >
            Anterior
          </button>
          <button 
            className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-md disabled:opacity-50"
            onClick={goToNext}
            disabled={activeCardIndex === data.length - 1}
          >
            Próximo
          </button>
        </div>
      </div>
      
      {/* Área de toque otimizada */}
      <div 
        ref={containerRef}
        className="h-full overflow-y-auto pb-14 touch-pan-y" 
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ 
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain'
        }}
      >
        <div 
          className={`border rounded-lg overflow-hidden mb-4 mx-2 ${
            currentSale.status === 'pending' ? 'bg-slate-50' :
            currentSale.status === 'in_progress' ? 'bg-orange-50' :
            currentSale.status === 'completed' ? 'bg-green-50' :
            currentSale.status === 'returned' ? 'bg-red-50' :
            currentSale.status === 'corrected' ? 'bg-yellow-50' : 'bg-white'
          }`}
        >
          {/* Cabeçalho */}
          <div className="flex justify-between items-start p-4 border-b">
            <div>
              <h3 className="font-semibold">OS: {currentSale.orderNumber}</h3>
              <p className="text-sm text-muted-foreground">
                {format(new Date(currentSale.date), 'dd/MM/yyyy', { locale: ptBR })}
              </p>
            </div>
            <div className={`${getStatusVariant(currentSale.status)} text-xs px-2 py-1 rounded-full`}>
              {getStatusLabel(currentSale.status)}
            </div>
          </div>
          
          {/* Conteúdo */}
          <div className="p-4">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Cliente</p>
                <p className="text-sm">{currentSale.customerName}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Vendedor</p>
                <p className="text-sm">{currentSale.sellerName}</p>
              </div>
              
              <div>
                <p className="text-xs text-muted-foreground mb-1">Valor</p>
                <p className="text-sm font-medium">
                  R$ {parseFloat(currentSale.totalAmount).toFixed(2).replace('.', ',')}
                </p>
              </div>
              
              {currentSale.serviceTypeName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tipo de Serviço</p>
                  <p className="text-sm">{currentSale.serviceTypeName}</p>
                </div>
              )}
              
              {currentSale.serviceProviderName && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Prestador</p>
                  <p className="text-sm">{currentSale.serviceProviderName}</p>
                </div>
              )}
              
              {currentSale.returnReason && (
                <div>
                  <p className="text-xs text-destructive font-medium mb-1">Motivo da Devolução</p>
                  <p className="text-sm text-destructive">{currentSale.returnReason}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Ações */}
          <div className="p-3 border-t grid grid-cols-2 gap-2">
            <button 
              className="w-full p-2 text-xs bg-primary text-primary-foreground rounded-md"
              onClick={() => onViewDetails(currentSale)}
            >
              Detalhes
            </button>
            
            <button 
              className="w-full p-2 text-xs border border-border rounded-md"
              onClick={() => onViewHistory(currentSale)}
            >
              Histórico
            </button>
            
            {/* Botões condicionais para cada tipo de usuário e estado da venda */}
            {(user?.role === "admin" || user?.role === "vendedor" || user?.role === "supervisor") && (
              <button 
                className="w-full p-2 text-xs border border-border rounded-md"
                onClick={() => onEdit(currentSale)}
              >
                Editar
              </button>
            )}
            
            {(user?.role === "admin" || user?.role === "operacional") && 
              (currentSale.status === "pending" || currentSale.status === "corrected") && (
              <button 
                className={`w-full p-2 text-xs rounded-md ${
                  currentSale.status === "corrected" 
                    ? 'bg-secondary text-secondary-foreground'
                    : 'border border-border'
                }`}
                onClick={() => onStartExecution(currentSale)}
              >
                Iniciar
              </button>
            )}
            
            {(user?.role === "admin" || user?.role === "operacional") && 
              currentSale.status === "in_progress" && (
              <button 
                className="w-full p-2 text-xs border border-border rounded-md"
                onClick={() => onCompleteExecution(currentSale)}
              >
                Concluir
              </button>
            )}
            
            {(user?.role === "admin" || user?.role === "operacional") && 
              (currentSale.status === "pending" || currentSale.status === "in_progress") && (
              <button 
                className="w-full p-2 text-xs text-destructive border border-destructive rounded-md"
                onClick={() => onReturnClick(currentSale)}
              >
                Devolver
              </button>
            )}
            
            {currentSale.status === "returned" && (
              <div className="col-span-2">
                <ReenviaButton sale={currentSale} />
              </div>
            )}
            
            {currentSale.status === "corrected" && (
              <div className="col-span-2">
                <DevolveButton sale={currentSale} />
              </div>
            )}
            
            {(user?.role === "admin" || user?.role === "financeiro") && 
              currentSale.status === "completed" && 
              currentSale.financialStatus !== "paid" && (
              <button 
                className="w-full p-2 text-xs border border-border rounded-md"
                onClick={() => onMarkAsPaid(currentSale)}
              >
                Pago
              </button>
            )}
            
            {(user?.role === "admin" || user?.role === "supervisor") && (
              <button 
                className="w-full p-2 text-xs bg-destructive text-destructive-foreground rounded-md"
                onClick={() => onDeleteClick(currentSale)}
              >
                Excluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TouchOptimizedCardList;