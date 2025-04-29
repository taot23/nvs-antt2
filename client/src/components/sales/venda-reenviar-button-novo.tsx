import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SendHorizontal } from 'lucide-react';
import VendaReenviarDialog from './venda-reenviar-dialog-novo';

// Usar um tipo mais flexível para evitar problemas de compatibilidade
type Sale = {
  id: number;
  status: string;
  [key: string]: any;
};

interface VendaReenviarButtonProps {
  sale: Sale;
  iconOnly?: boolean;
}

export default function VendaReenviarButton({ sale, iconOnly = false }: VendaReenviarButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Essa venda pode ser reenviada?
  const podeReenviar = sale.status === 'returned';

  // Se não puder reenviar, não renderiza o botão
  if (!podeReenviar) return null;

  return (
    <>
      {iconOnly ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDialogOpen(true)}
          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
          title="Reenviar venda corrigida"
        >
          <SendHorizontal className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          size="sm"
          variant="default"
          className="h-8 px-3"
          onClick={() => setDialogOpen(true)}
        >
          <SendHorizontal className="h-4 w-4 mr-1" />
          Reenviar
        </Button>
      )}

      {/* Usar o novo componente de diálogo */}
      <VendaReenviarDialog 
        isOpen={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        sale={sale} 
      />
    </>
  );
}