import React, { useState, useEffect } from 'react';
import { SendHorizontal, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import SaleDialog from './sale-dialog';
import { Dialog, DialogContent } from '@/components/ui/dialog';

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
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saleDataReady, setSaleDataReady] = useState(false);

  console.log('🔄 ReenviaButton - sale:', sale?.id, 'status:', sale?.status, 'dialogOpen:', dialogOpen, 'userRole:', user?.role);
  
  // Pré-carrega os dados da venda para evitar flickering
  useEffect(() => {
    if (dialogOpen && selectedSale) {
      setIsLoading(true);
      
      // Pré-carrega os dados da venda
      fetch(`/api/sales/${selectedSale.id}`)
        .then(response => response.json())
        .then(data => {
          console.log("✅ Dados da venda pré-carregados com sucesso:", data);
          setSaleDataReady(true);
        })
        .catch(error => {
          console.error("❌ Erro ao pré-carregar dados da venda:", error);
          toast({
            title: "Erro ao carregar venda",
            description: "Houve um problema ao carregar os dados da venda",
            variant: "destructive",
          });
          // Fecha o diálogo em caso de erro
          setDialogOpen(false);
          setSelectedSale(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      // Reset quando o diálogo fecha
      setSaleDataReady(false);
    }
  }, [dialogOpen, selectedSale, toast]);
  
  // Função para abrir o diálogo de edição
  const handleEditClick = () => {
    console.log('🔄 Abrindo diálogo de edição para corrigir venda devolvida:', sale.id);
    setSelectedSale(sale);
    setSaleDataReady(false); // Reset o estado para forçar o pré-carregamento
    setDialogOpen(true);
  };

  // Handler para quando a edição for concluída com sucesso
  const handleEditSuccess = () => {
    console.log('🔄 Edição da venda concluída com sucesso');
    setDialogOpen(false);
    setSelectedSale(null);
    toast({
      title: 'Venda reenviada com sucesso',
      description: 'A venda foi corrigida e reenviada para o operacional.'
    });
    // Recarregar a lista de vendas
    queryClient.invalidateQueries({ queryKey: ['/api/sales'] });
  };

  // Não mostrar o botão se a venda não estiver em status "returned"
  // Verificar permissões: administrador, supervisor ou vendedor responsável
  console.log("VERIFICANDO RENDERIZAÇÃO, venda:", sale.id, "status:", sale.status, "role:", user?.role);
  
  // Verificação simplificada para depuração
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

      {/* Diálogo de carregamento enquanto os dados não estão prontos */}
      {dialogOpen && isLoading && (
        <Dialog open={dialogOpen} onOpenChange={(open) => !open && setDialogOpen(false)}>
          <DialogContent className="max-w-md">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-center text-lg font-medium">
                Carregando dados da venda...
              </p>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Por favor, aguarde enquanto preparamos os dados para edição.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo de edição completa da venda quando os dados estão prontos */}
      {dialogOpen && selectedSale && !isLoading && saleDataReady && (
        <SaleDialog
          open={dialogOpen}
          onClose={() => {
            console.log("🔄 Fechando diálogo de edição de venda devolvida");
            setDialogOpen(false);
            setSelectedSale(null);
          }}
          saleId={selectedSale.id} 
          onSaveSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}