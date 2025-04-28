import React, { useState, useEffect } from 'react';
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface ReenviarVendaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  venda: any;
}

function getStatusLabel(status: string) {
  switch (status) {
    case "pending":
      return "Pendente";
    case "in_progress":
      return "Em Andamento";
    case "completed":
      return "Concluída";
    case "returned":
      return "Devolvida";
    default:
      return status;
  }
}

function getStatusVariant(status: string) {
  switch (status) {
    case "pending":
      return "warning";
    case "in_progress":
      return "default";
    case "completed":
      return "success";
    case "returned":
      return "destructive";
    default:
      return "secondary";
  }
}

export default function ReenviarVendaDialog({ isOpen, onClose, venda }: ReenviarVendaDialogProps) {
  const { toast } = useToast();
  const [observacoes, setObservacoes] = useState("");
  
  console.log("ReenviarVendaDialog renderizado", { isOpen, vendaId: venda?.id });
  
  // Limpar observações quando o diálogo é aberto
  useEffect(() => {
    if (isOpen) {
      console.log("Diálogo aberto - Limpando observações");
      setObservacoes("");
    }
  }, [isOpen]);

  // Mutation para reenviar venda corrigida
  const reenviarMutation = useMutation({
    mutationFn: async () => {
      console.log("Enviando requisição para reenviar venda:", venda.id, "com observações:", observacoes);
      const response = await apiRequest("PUT", `/api/sales/${venda.id}/resend`, {
        correctionNotes: observacoes
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Venda reenviada com sucesso",
        description: "A venda foi reenviada para o operacional com suas observações.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sales"] });
      queryClient.invalidateQueries({ queryKey: ['/api/sales', window.currentUser?.id] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao reenviar venda",
        description: error.message || "Ocorreu um erro ao reenviar a venda.",
        variant: "destructive",
      });
    },
  });
  
  // Handler para o botão de reenvio
  const handleReenviar = () => {
    if (!observacoes.trim()) {
      toast({
        title: "Observação obrigatória",
        description: "Por favor, informe as correções realizadas antes de reenviar.",
        variant: "destructive",
      });
      return;
    }
    
    reenviarMutation.mutate();
  };

  // Não renderizar nada se não houver venda ou se o diálogo não estiver aberto
  if (!venda || !isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      console.log("Dialog onOpenChange:", open);
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Reenviar Venda Corrigida</DialogTitle>
          <DialogDescription>
            Esta venda foi devolvida pelo operacional. Faça as correções necessárias e reenvie.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Número OS</Label>
              <div className="font-medium">{venda.orderNumber}</div>
            </div>
            <div>
              <Label>Data</Label>
              <div className="font-medium">
                {venda.date ? format(new Date(venda.date), 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}
              </div>
            </div>
            <div>
              <Label>Cliente</Label>
              <div className="font-medium">{venda.customerName}</div>
            </div>
            <div>
              <Label>Vendedor</Label>
              <div className="font-medium">{venda.sellerName}</div>
            </div>
            <div>
              <Label>Valor Total</Label>
              <div className="font-medium">
                R$ {parseFloat(venda.totalAmount).toFixed(2).replace('.', ',')}
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <div>
                <Badge variant={getStatusVariant(venda.status) as any}>
                  {getStatusLabel(venda.status)}
                </Badge>
              </div>
            </div>
          </div>

          {venda.returnReason && (
            <div className="space-y-1 border-l-4 border-destructive pl-4 py-2 bg-destructive/10 rounded-sm">
              <Label className="text-destructive">Motivo da Devolução:</Label>
              <div className="text-sm text-destructive/90">{venda.returnReason}</div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-base">Observação das Correções Realizadas *</Label>
            <Textarea 
              id="observacoes" 
              value={observacoes} 
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Descreva as correções realizadas nesta venda..."
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Informe quais correções foram realizadas nesta venda antes de reenviá-la ao operacional.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={reenviarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleReenviar}
            disabled={reenviarMutation.isPending}
          >
            {reenviarMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Reenviando...
              </>
            ) : (
              "Reenviar Venda"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}