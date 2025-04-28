import React, { useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import SaleDialog from './sale-dialog';

// Definindo a tipagem para a venda
interface Sale {
  id: number;
  orderNumber: string;
  date: string;
  customerId: number;
  customerName?: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  sellerId: number;
  sellerName?: string;
  serviceTypeId?: number;
  serviceTypeName?: string;
  totalAmount: string;
  installments: number;
  installmentValue: string | null;
  status: string;
  executionStatus: string;
  financialStatus: string;
  notes: string | null;
  returnReason: string | null;
  responsibleOperationalId: number | null;
  responsibleFinancialId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ReenviaButtonProps {
  sale: Sale;
}

// Componente que renderiza um botão para reenviar vendas devolvidas
export default function ReenviaButton({ sale }: ReenviaButtonProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Função para abrir o diálogo de edição
  const handleEditClick = () => {
    console.log('🔄 Abrindo diálogo de edição para venda devolvida:', sale.id);
    setDialogOpen(true);
  };

  // Handler para quando a edição for concluída com sucesso
  const handleEditSuccess = () => {
    console.log('🔄 Edição da venda concluída com sucesso');
    setDialogOpen(false);
    toast({
      title: 'Venda reenviada com sucesso',
      description: 'A venda foi corrigida e reenviada para o operacional.'
    });
    // Recarregar a lista de vendas
    queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
  };

  // Não mostrar o botão se a venda não estiver em status "returned"
  if (sale.status !== 'returned') {
    console.log("Botão não mostrado: venda não está com status 'returned'");
    return null;
  }
  
  // Verificação de permissão
  if (user?.role !== 'admin' && user?.role !== 'supervisor' && !(user?.role === 'vendedor' && sale.sellerId === user?.id)) {
    console.log("Botão não mostrado: sem permissão. Role:", user?.role, "Vendedor id:", sale.sellerId);
    return null;
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleEditClick}
        className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
        title="Editar venda devolvida"
      >
        <SendHorizontal className="h-4 w-4" />
      </Button>

      {/* Diálogo de edição simplificado */}
      {dialogOpen && (
        <SaleDialog
          open={dialogOpen}
          onClose={() => {
            console.log("🔄 Fechando diálogo de edição de venda devolvida");
            setDialogOpen(false);
          }}
          saleId={sale.id} 
          onSaveSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}