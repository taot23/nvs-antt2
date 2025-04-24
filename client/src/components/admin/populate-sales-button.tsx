import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PopulateSalesButton() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const handlePopulate = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/populate-sales');
      const result = await response.json();
      
      // Atualizar cache das vendas
      queryClient.invalidateQueries({ queryKey: ['/api/sales'] });

      toast({
        title: "Sucesso!",
        description: result.message || "Vendas populadas com sucesso",
      });
    } catch (error: any) {
      console.error("Erro ao popular vendas:", error);
      toast({
        title: "Erro ao popular vendas",
        description: error.message || "Ocorreu um erro ao tentar popular as vendas",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Button 
        variant="default" 
        size="sm" 
        onClick={() => setShowConfirmDialog(true)} 
        disabled={isLoading}
      >
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Popular Vendas Teste
      </Button>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Popular Vendas</DialogTitle>
            <DialogDescription>
              Deseja realmente criar 30 vendas de teste distribuídas entre os usuários?
            </DialogDescription>
          </DialogHeader>
          
          <Alert variant="default">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              Esta ação irá criar 30 novas vendas no sistema com status variados.
              Utilize apenas em ambiente de desenvolvimento ou testes.
            </AlertDescription>
          </Alert>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="default" 
              onClick={handlePopulate} 
              disabled={isLoading}
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}