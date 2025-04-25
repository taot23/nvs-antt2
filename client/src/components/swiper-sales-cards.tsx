import React, { useEffect, useRef } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  ClipboardList,
  Edit,
  Trash2,
  CornerDownRight,
  CheckCircle2,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { getStatusLabel, getStatusVariant } from "@/lib/status-utils";
import { Sale } from "@shared/schema";

// Import Swiper
import { Swiper, SwiperSlide } from 'swiper/react';
import { Virtual, Mousewheel, FreeMode } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/virtual';
import 'swiper/css/free-mode';

interface SwiperSalesCardsProps {
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

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => (
  <Badge variant={getStatusVariant(status) as any}>
    {getStatusLabel(status)}
  </Badge>
);

// Sale Card Component
const SaleCard: React.FC<{
  sale: Sale;
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
}> = ({
  sale,
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
  return (
    <Card 
      className="swiper-sale-card border mb-4 relative overflow-hidden w-full"
      data-status={sale.status}
    >
      {/* Status indicator bar */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ 
          backgroundColor: 
            sale.status === "completed" ? "#86efac" : 
            sale.status === "in_progress" ? "#fdba74" :
            sale.status === "returned" ? "#fca5a5" :
            sale.status === "corrected" ? "#fef08a" : "#e5e7eb"
        }}
      />
      
      <CardContent className="p-4 pl-5">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="font-medium text-lg">{sale.orderNumber}</div>
            <div className="text-sm text-muted-foreground">
              {format(new Date(sale.date || sale.createdAt), 'dd/MM/yyyy')}
            </div>
          </div>
          <div>
            <StatusBadge status={sale.status} />
            {sale.financialStatus === 'paid' && (
              <div className="text-xs text-green-600 text-right mt-1 font-semibold">Pago</div>
            )}
          </div>
        </div>
        
        {/* Sale details */}
        <div className="text-sm space-y-2 mb-3">
          <div className="flex justify-between mb-1">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium truncate ml-2 text-right" style={{ maxWidth: '60%' }}>
              {(sale as any).customerName || `ID: ${sale.customerId}`}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor:</span>
            <span className="font-medium">
              {`R$ ${parseFloat(sale.totalAmount).toFixed(2).replace('.', ',')}`}
            </span>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(sale)}
            className="h-8 w-8 p-0 rounded-full"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewHistory(sale)}
            className="h-8 w-8 p-0 rounded-full"
          >
            <ClipboardList className="h-4 w-4" />
          </Button>
          
          {user?.role === "admin" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(sale)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          {/* Role-specific actions */}
          {(user?.role === "admin" || user?.role === "operacional") && 
           sale.status === "pending" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStartExecution(sale)}
              className="h-8 w-8 p-0 rounded-full text-orange-500"
            >
              <CornerDownRight className="h-4 w-4" />
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "operacional") && 
           sale.status === "in_progress" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCompleteExecution(sale)}
              className="h-8 w-8 p-0 rounded-full text-green-500"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
          
          {(user?.role === "admin" || user?.role === "supervisor") && 
           (sale.status === "pending" || sale.status === "in_progress") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReturnClick(sale)}
              className="h-8 w-8 p-0 rounded-full text-red-500"
            >
              <AlertTriangle className="h-4 w-4" />
            </Button>
          )}
          
          {/* Special action buttons */}
          <ReenviaButton sale={sale} />
          <DevolveButton sale={sale} />
          
          {(user?.role === "admin" || user?.role === "financeiro") && 
           sale.status === "completed" && 
           sale.financialStatus !== "paid" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMarkAsPaid(sale)}
              className="h-8 w-8 p-0 rounded-full text-green-500"
            >
              <DollarSign className="h-4 w-4" />
            </Button>
          )}
          
          {user?.role === "admin" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteClick(sale)}
              className="h-8 w-8 p-0 rounded-full text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Loading skeleton component
const SaleCardSkeleton = () => (
  <Card className="p-4 h-[180px] w-full mb-4">
    <div className="flex justify-between items-start mb-3">
      <div>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-20 mt-1" />
      </div>
      <Skeleton className="h-6 w-20" />
    </div>
    <div className="space-y-2 mb-3">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
    <div className="flex gap-2 pt-2 mt-2 border-t">
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-full" />
      <Skeleton className="h-8 w-8 rounded-full" />
    </div>
  </Card>
);

// Main Swiper component
const SwiperSalesCards: React.FC<SwiperSalesCardsProps> = ({
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
  const swiperRef = useRef<any>(null);

  // Configure body for mobile
  useEffect(() => {
    // Lock body scrolling but allow Swiper to handle it
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';
    
    // Apply special styles for Swiper container
    const swiperContainer = document.querySelector('.swiper');
    if (swiperContainer) {
      (swiperContainer as HTMLElement).style.height = 'calc(100vh - 190px)';
    }
    
    return () => {
      // Cleanup on unmount
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
    };
  }, []);

  // Render loading state
  if (isLoading) {
    return (
      <div className="space-y-4 p-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <SaleCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="text-center py-4 px-2 bg-red-50 rounded-md text-red-500 border border-red-200">
        <p>Erro ao carregar vendas:</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <div className="text-center py-4 bg-muted/20 rounded-md">
        <p className="text-muted-foreground">Nenhuma venda encontrada</p>
      </div>
    );
  }

  return (
    <div className="swiper-container h-full">
      <Swiper
        direction="vertical"
        modules={[Virtual, Mousewheel, FreeMode]}
        spaceBetween={16}
        slidesPerView="auto"
        mousewheel={true}
        freeMode={{
          enabled: true,
          sticky: false,
          momentumBounce: false
        }}
        virtual={{
          addSlidesBefore: 3,
          addSlidesAfter: 3
        }}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="sales-swiper pb-10"
        style={{
          height: 'calc(100vh - 190px)',
          maxHeight: 'calc(100vh - 190px)',
        }}
      >
        {data.map((sale, index) => (
          <SwiperSlide key={sale.id} virtualIndex={index} className="!height-auto">
            <SaleCard
              sale={sale}
              onViewDetails={onViewDetails}
              onViewHistory={onViewHistory}
              onEdit={onEdit}
              onStartExecution={onStartExecution}
              onCompleteExecution={onCompleteExecution}
              onReturnClick={onReturnClick}
              onMarkAsPaid={onMarkAsPaid}
              onDeleteClick={onDeleteClick}
              user={user}
              ReenviaButton={ReenviaButton}
              DevolveButton={DevolveButton}
            />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SwiperSalesCards;