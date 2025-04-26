import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ExportPDFData {
  orderNumber: string;
  sellerName: string;
  customerName: string;
  date: string;
  totalAmount: string;
  status: string;
}

export function exportFinanceToPDF(title: string, status: string, data: ExportPDFData[]) {
  const doc = new jsPDF();
  
  // Configurações iniciais
  doc.setFont("helvetica");
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  doc.setFontSize(12);
  doc.text(`Status: ${status}`, 14, 30);
  doc.text(`Data de geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 38);
  
  // Definindo colunas e dados para a tabela
  const tableColumns = [
    'Nº OS', 
    'Vendedor', 
    'Cliente', 
    'Data', 
    'Valor Total',
    'Status'
  ];
  
  // Preparando linhas da tabela
  const tableRows = data.map(item => [
    item.orderNumber,
    item.sellerName,
    item.customerName,
    item.date,
    item.totalAmount,
    item.status
  ]);
  
  // Adicionar tabela ao PDF
  autoTable(doc, {
    head: [tableColumns],
    body: tableRows,
    startY: 45,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [60, 60, 60] },
  });
  
  // Salvar o PDF
  const fileName = `financeiro_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
  doc.save(fileName);
  
  return fileName;
}