/**
 * Solução final de exportação - extremamente simples e direta
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ExportData {
  orderNumber: string;
  sellerName: string;
  customerName: string;
  date: string;
  totalAmount: string;
  status: string;
  totalPaid?: string;
  totalCosts?: string;
  netResult?: string;
}

// Função para formatar valores financeiros
function formatCurrency(value: any): string {
  try {
    if (value === undefined || value === null) return 'R$ 0,00';
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return numValue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
  } catch (error) {
    console.error('Erro ao formatar valor monetário:', error);
    return 'R$ 0,00';
  }
}

// Função para formatar data
function formatDate(dateStr: string): string {
  try {
    if (!dateStr) return 'N/A';
    return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

// Função para obter status formatado
function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Aguardando Pagamento';
    case 'in_progress': return 'Em Execução';
    case 'completed': return 'Executado';
    case 'paid': return 'Pago';
    default: return status || 'Desconhecido';
  }
}

// Função para preparar os dados para exportação
export function prepareDataForExport(data: any[]): ExportData[] {
  return data.map(sale => {
    const result: ExportData = {
      orderNumber: sale.orderNumber || '',
      sellerName: sale.sellerName || `Vendedor #${sale.sellerId || ''}`,
      customerName: sale.customerName || `Cliente #${sale.customerId || ''}`,
      date: sale.date ? formatDate(sale.date) : 'N/A',
      totalAmount: formatCurrency(sale.totalAmount),
      status: getStatusLabel(sale.financialStatus || sale.status)
    };

    // Adicionar campos financeiros se disponíveis
    if (sale.financialSummary) {
      result.totalPaid = formatCurrency(sale.financialSummary.totalPaid);
      result.totalCosts = formatCurrency(sale.financialSummary.totalCosts);
      result.netResult = formatCurrency(sale.financialSummary.netResult);
    }

    return result;
  });
}

// Função para exportar para Excel
export async function finalExportToExcel(data: any[], includeFinancialData: boolean = false): Promise<string> {
  try {
    // Importar XLSX dinamicamente
    const XLSX = await import('xlsx');

    // Preparar os dados
    const exportData = prepareDataForExport(data);

    // Definir as colunas conforme os dados disponíveis
    const columns = [
      { header: 'Nº OS', key: 'orderNumber', width: 15 },
      { header: 'Vendedor', key: 'sellerName', width: 25 },
      { header: 'Cliente', key: 'customerName', width: 25 },
      { header: 'Data', key: 'date', width: 15 },
      { header: 'Valor Total', key: 'totalAmount', width: 15 },
      { header: 'Status', key: 'status', width: 20 },
    ];

    // Adicionar colunas financeiras se necessário
    if (includeFinancialData) {
      columns.push(
        { header: 'Valor Pago', key: 'totalPaid', width: 15 },
        { header: 'Custos', key: 'totalCosts', width: 15 },
        { header: 'Resultado', key: 'netResult', width: 15 }
      );
    }

    // Criar uma planilha diretamente dos dados JSON
    const worksheet = XLSX.utils.json_to_sheet(exportData.map(row => {
      const result: any = {};
      columns.forEach(col => {
        if (row[col.key as keyof ExportData] !== undefined) {
          result[col.header] = row[col.key as keyof ExportData];
        } else {
          result[col.header] = '';
        }
      });
      return result;
    }));

    // Definir larguras das colunas
    const colWidths = columns.map(col => ({ wch: col.width }));
    worksheet['!cols'] = colWidths;

    // Criar workbook e adicionar a planilha
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Relatório Financeiro');

    // Gerar nome de arquivo único
    const fileName = `relatorio_financeiro_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xlsx`;

    // Salvar arquivo
    XLSX.writeFile(workbook, fileName);

    return fileName;
  } catch (error) {
    console.error('Erro ao exportar para Excel:', error);
    throw error;
  }
}

// Função para exportar para PDF
export async function finalExportToPDF(data: any[], includeFinancialData: boolean = false): Promise<string> {
  try {
    // Importar jsPDF dinamicamente
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    const autoTable = (await import('jspdf-autotable')).default;

    // Preparar os dados
    const exportData = prepareDataForExport(data);

    // Definir as colunas conforme os dados disponíveis
    const columns = [
      { header: 'Nº OS', key: 'orderNumber' },
      { header: 'Vendedor', key: 'sellerName' },
      { header: 'Cliente', key: 'customerName' },
      { header: 'Data', key: 'date' },
      { header: 'Valor Total', key: 'totalAmount' },
      { header: 'Status', key: 'status' },
    ];

    // Adicionar colunas financeiras se necessário
    if (includeFinancialData) {
      columns.push(
        { header: 'Valor Pago', key: 'totalPaid' },
        { header: 'Custos', key: 'totalCosts' },
        { header: 'Resultado', key: 'netResult' }
      );
    }

    // Extrair cabeçalhos e dados para o formato que o autoTable espera
    const headers = columns.map(col => col.header);
    const rows = exportData.map(row => 
      columns.map(col => {
        const key = col.key as keyof ExportData;
        return row[key] !== undefined ? row[key] : '';
      })
    );

    // Criar documento PDF em modo paisagem
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    // Adicionar título
    doc.setFontSize(16);
    doc.text('Relatório Financeiro', 14, 15);
    doc.setFontSize(10);
    doc.text(`Data de Geração: ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}`, 14, 22);

    // Criar tabela no PDF
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 25,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 9,
        halign: 'left'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { halign: 'center' }, // Nº OS centralizado
        3: { halign: 'center' }, // Data centralizada
        4: { halign: 'right' },  // Valor Total à direita
        6: { halign: 'right' },  // Valor Pago à direita
        7: { halign: 'right' },  // Custos à direita
        8: { halign: 'right' }   // Resultado à direita
      }
    });

    // Gerar nome de arquivo único
    const fileName = `relatorio_financeiro_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.pdf`;

    // Salvar arquivo
    doc.save(fileName);

    return fileName;
  } catch (error) {
    console.error('Erro ao exportar para PDF:', error);
    throw error;
  }
}