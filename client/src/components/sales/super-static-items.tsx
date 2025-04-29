import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * Componente TOTALMENTE ESTÁTICO para exibir itens da venda
 * SOLUÇÃO RADICAL para o problema de flickering
 * 
 * Não mantém estado, não faz cálculos, apenas renderiza o que recebe
 */
export function SuperStaticItems({
  items = [],
  services = [],
  serviceTypes = [],
  readOnly = true
}: {
  items: any[];
  services: any[];
  serviceTypes: any[];
  readOnly?: boolean;
}) {
  if (!items || items.length === 0) {
    return (
      <div className="border rounded-md p-4 mt-4">
        <h3 className="font-medium mb-2">Itens da Venda</h3>
        <div className="flex justify-center items-center p-4 text-muted-foreground">
          Nenhum item adicionado.
        </div>
      </div>
    );
  }

  // Usar uma tabela em vez de divs para melhor estrutura sem flickering
  return (
    <div className="border rounded-md p-4 mt-4">
      <h3 className="font-medium mb-2">Itens da Venda ({items.length})</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Serviço</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Qtd</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const service = services.find((s) => s.id === item.serviceId);
            const serviceType = serviceTypes.find((t) => t.id === item.serviceTypeId);
            
            // Formatar valores para exibição
            const itemPrice = item.price ? parseFloat(item.price).toFixed(2).replace('.', ',') : '0,00';
            const totalPrice = item.totalPrice ? parseFloat(item.totalPrice).toFixed(2).replace('.', ',') : '0,00';
            
            return (
              <TableRow key={`item-${index}-${item.serviceId}-${Math.random().toString(36).substr(2, 9)}`}>
                <TableCell className="font-medium">{service?.name || "Serviço não encontrado"}</TableCell>
                <TableCell>{serviceType?.name || "Tipo não encontrado"}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell className="text-right">R$ {totalPrice}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}