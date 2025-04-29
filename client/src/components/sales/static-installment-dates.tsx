import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIsoToBrazilian } from "@/utils/date-formatter";

/**
 * Componente totalmente estático para exibir datas de parcelas
 * Exibe exatamente as datas que vêm do banco, sem qualquer manipulação
 */
export function StaticInstallmentDates({
  installments = [],
  readOnly = true,
}: {
  installments: {
    id?: number;
    installmentNumber: number;
    amount: string;
    dueDate: string;
    status?: string;
  }[];
  readOnly?: boolean;
}) {
  if (!installments || installments.length === 0) {
    return null;
  }

  // Mostrar exatamente as datas que vêm do banco
  return (
    <div className="border rounded-md p-4 mt-4">
      <h3 className="font-medium mb-2">Parcelas ({installments.length})</h3>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nº</TableHead>
            <TableHead>Data de Vencimento (Banco)</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((installment) => {
            // Formatar o valor da parcela
            const installmentAmount = installment.amount || "0.00";
            
            // Converter a data do formato ISO (YYYY-MM-DD) para o formato brasileiro (DD/MM/YYYY)
            const formattedDate = formatIsoToBrazilian(installment.dueDate);
            
            return (
              <TableRow key={`installment-${installment.installmentNumber}`}>
                <TableCell>{installment.installmentNumber}</TableCell>
                <TableCell>
                  <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
                    <span>{formattedDate}</span>
                    <span className="text-xs text-gray-500">Original: {installment.dueDate}</span>
                  </div>
                </TableCell>
                <TableCell>R$ {installmentAmount.replace(".", ",")}</TableCell>
                <TableCell>
                  {installment.status === 'paid' ? (
                    <span className="text-green-600 font-medium">Paga</span>
                  ) : (
                    <span className="text-amber-600">Pendente</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}