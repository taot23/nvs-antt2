import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import SaleDialog from "@/components/sales/sale-dialog";
import { Pencil, Search, DollarSign, BarChart4 } from "lucide-react";
import { OperationalCosts } from "@/components/finance/operational-costs";
import { PaymentConfirmation } from "@/components/finance/payment-confirmation";
import FinanceSalesTable from "@/components/finance/finance-sales-table";

export default function FinancePage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSaleId, setSelectedSaleId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState("pending");

  // Verificar as permissões do usuário
  const canPerformFinancialOperations = user?.role === "admin" || user?.role === "financeiro";

  // Buscar dados do usuário selecionado para exibir informações
  const { data: selectedSale } = useQuery({
    queryKey: [`/api/sales/${selectedSaleId}`],
    enabled: !!selectedSaleId,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // O componente de tabela irá se encarregar de usar o searchTerm
  };

  const handleViewFinancials = (saleId: number) => {
    setSelectedSaleId(saleId);
  };

  const handleCloseDialog = () => {
    setSelectedSaleId(null);
  };

  const getStatusForActiveTab = (): string => {
    switch (activeTab) {
      case "pending":
        return "approved";
      case "inProgress":
        return "in_progress";
      case "completed":
        return "completed";
      case "paid":
        return "paid";
      default:
        return "approved";
    }
  };

  return (
    <div className="container py-6 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Módulo Financeiro</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os pagamentos e custos operacionais das vendas
            </p>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Buscar vendas por número, cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
            <Button type="submit" className="shrink-0">
              <Search className="h-4 w-4 mr-2" />
              Buscar
            </Button>
          </form>
        </div>

        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between pb-3">
            <TabsList>
              <TabsTrigger value="pending" className="flex items-center gap-1">
                <Pencil className="h-4 w-4" />
                <span>Aguardando Pagamento</span>
              </TabsTrigger>
              <TabsTrigger value="inProgress" className="flex items-center gap-1">
                <BarChart4 className="h-4 w-4" />
                <span>Em Execução</span>
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex items-center gap-1">
                <Pencil className="h-4 w-4" />
                <span>Executado</span>
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex items-center gap-1">
                <DollarSign className="h-4 w-4" />
                <span>Pagos</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="space-y-4">
            <FinanceSalesTable 
              status={getStatusForActiveTab()}
              searchTerm={searchTerm}
              onViewFinancials={handleViewFinancials}
            />
          </TabsContent>

          <TabsContent value="inProgress" className="space-y-4">
            <FinanceSalesTable 
              status={getStatusForActiveTab()}
              searchTerm={searchTerm}
              onViewFinancials={handleViewFinancials}
            />
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <FinanceSalesTable 
              status={getStatusForActiveTab()}
              searchTerm={searchTerm}
              onViewFinancials={handleViewFinancials}
            />
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            <FinanceSalesTable 
              status={getStatusForActiveTab()}
              searchTerm={searchTerm}
              onViewFinancials={handleViewFinancials}
            />
          </TabsContent>
        </Tabs>

        {/* Diálogo de gestão financeira */}
        {selectedSaleId && (
          <SaleDialog
            open={!!selectedSaleId}
            onClose={handleCloseDialog}
            saleId={selectedSaleId}
            readOnly={!canPerformFinancialOperations}
            renderAdditionalContent={() => (
              <div className="mt-6 space-y-6">
                <PaymentConfirmation 
                  saleId={selectedSaleId} 
                  canManage={canPerformFinancialOperations}
                />
                
                <OperationalCosts 
                  saleId={selectedSaleId} 
                  canManage={canPerformFinancialOperations}
                />
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}