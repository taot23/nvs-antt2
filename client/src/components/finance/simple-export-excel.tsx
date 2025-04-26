import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportExcelData {
  orderNumber: string;
  sellerName: string;
  customerName: string;
  date: string;
  totalAmount: string;
  status: string;
}

export function exportFinanceToExcel(status: string, data: ExportExcelData[]) {
  // Preparar dados para o Excel
  const excelData = data.map(item => ({
    'Nº OS': item.orderNumber,
    'Vendedor': item.sellerName,
    'Cliente': item.customerName,
    'Data': item.date,
    'Valor Total': item.totalAmount,
    'Status': item.status
  }));
  
  // Criar planilha
  const worksheet = XLSX.utils.json_to_sheet(excelData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Financeiro');
  
  // Definir nome do arquivo e exportar
  const fileName = `financeiro_${status}_${format(new Date(), 'dd-MM-yyyy')}.xlsx`;
  XLSX.writeFile(workbook, fileName);
  
  return fileName;
}