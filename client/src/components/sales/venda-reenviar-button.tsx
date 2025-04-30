import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { SendHorizontal, Loader2, Edit, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import SaleDialog from './sale-dialog';

/**
 * Interface para a propriedade de venda
 */
interface Sale {
  id: number;
  orderNumber: string;
  date: string | null;
  customerId: number;
  customerName?: string;
  paymentMethodId: number;
  paymentMethodName?: string;
  sellerId: number;
  sellerName?: string;
  serviceTypeId?: number;
  serviceTypeName?: string;
  serviceProviderId?: number;
  serviceProviderName?: string;
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

interface VendaReenviarButtonProps {
  sale: Sale;
  iconOnly?: boolean;
}

/**
 * Componente de botão para reenviar uma venda que foi devolvida para correção
 * Abre um SaleDialog completo para edição e reenvio da venda
 */
export default function VendaReenviarButton({ sale, iconOnly = false }: VendaReenviarButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Validar se a venda pode ser reenviada (apenas status "returned")
  const podeReenviar = sale.status === 'returned';

  // Para garantir limpeza de cache ao abrir o diálogo
  useEffect(() => {
    if (dialogOpen) {
      // Forçar recarga dos dados da venda do servidor ao abrir
      queryClient.invalidateQueries({ queryKey: ['/api/sales', sale.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales', sale.id, 'items'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales', sale.id, 'installments'] });
    }
  }, [dialogOpen, sale.id, queryClient]);

  // Se não puder reenviar, não renderiza o botão
  if (!podeReenviar) return null;

  // Handler para abrir o diálogo de edição
  const handleEditClick = () => {
    console.log("🔄 Abrindo diálogo para edição e reenvio de venda devolvida:", sale.id);
    setDialogOpen(true);
  };

  // Handler para quando a venda for salva com sucesso
  const handleSaveSuccess = () => {
    toast({
      title: "Venda reenviada com sucesso",
      description: "As correções foram registradas e a venda foi reenviada ao operacional.",
    });
    
    // Invalidar as consultas para atualizar a lista de vendas
    queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
    
    // Fechar o diálogo
    setDialogOpen(false);
  };

  return (
    <>
      {iconOnly ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleEditClick}
          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          title="Editar e reenviar venda devolvida"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="default"
          className="h-8 px-3"
          onClick={handleEditClick}
        >
          <SendHorizontal className="h-4 w-4 mr-1" />
          Reenviar
        </Button>
      )}

      {/* Diálogo de edição completo da venda */}
      {dialogOpen && (
        <SaleDialog
          open={dialogOpen}
          onClose={() => {
            console.log("🔄 Fechando diálogo de edição de venda devolvida");
            setDialogOpen(false);
          }}
          saleId={sale.id}
          onSaveSuccess={handleSaveSuccess}
          // Força o modo de reenvio para que o componente entenda que é uma venda devolvida
          forceResendMode={true}
        />
      )}
    </>
  );
}