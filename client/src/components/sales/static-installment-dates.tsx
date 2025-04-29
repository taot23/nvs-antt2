import React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatIsoToBrazilian } from "@/utils/date-formatter";

/**
 * Componente totalmente estático para exibir datas de parcelas
 * Exibe exatamente as datas que vêm do banco, sem qualquer manipulação
 */
export function StaticInstallmentDates({
  installments = [],
  readOnly = true
}: {
  installments: Array<{
    installmentNumber: number;
    amount: string;
    dueDate: string;
    status?: string;
  }>;
  readOnly?: boolean;
}) {
  if (!installments || installments.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-gray-50">
        <p className="text-muted-foreground">Não há parcelas definidas.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Parcela</TableHead>
          <TableHead>Data de Vencimento</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {installments.map((installment) => (
          <TableRow key={`static-installment-${installment.installmentNumber}`}>
            <TableCell>{installment.installmentNumber}</TableCell>
            <TableCell>{formatIsoToBrazilian(installment.dueDate)}</TableCell>
            <TableCell>R$ {installment.amount.replace(".", ",")}</TableCell>
            <TableCell>
              {installment.status === 'paid' ? (
                <span className="text-green-600 font-medium">Paga</span>
              ) : (
                <span className="text-amber-600">Pendente</span>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}