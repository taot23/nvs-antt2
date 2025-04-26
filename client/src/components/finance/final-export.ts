/**
 * Implementação final da exportação de dados para Excel e PDF
 * Utilizando bibliotecas oficiais e estáveis: xlsx e jspdf
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

// Tipo para representar os dados formatados
interface FormattedData {
  id: number;
  orderNumber: string;
  vendedor: string;
  cliente: string;
  data: string;
  valor: string;
  status: string;
}

/**
 * Formata os dados brutos para um formato adequado para exportação
 */
function formatarDados(dadosBrutos: any[]): FormattedData[] {
  return dadosBrutos.map(item => ({
    id: item.id || 0,
    orderNumber: item.orderNumber || '',
    vendedor: item.sellerName || '',
    cliente: item.customerName || '',
    data: item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '',
    valor: typeof item.totalAmount === 'number' 
      ? item.totalAmount.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})
      : item.totalAmount || '0',
    status: item.financialStatus || item.status || ''
  }));
}

/**
 * Exporta os dados para Excel usando a biblioteca xlsx
 */
export function exportToExcel(dados: any[]): void {
  try {
    console.log('Iniciando exportação para Excel...');
    
    // Verificar dados
    if (!dados || dados.length === 0) {
      alert('Não há dados para exportar');
      return;
    }
    
    // Formatar dados
    const dadosFormatados = formatarDados(dados);
    
    // Preparar dados para o formato que a biblioteca xlsx espera
    const dadosParaWorksheet = dadosFormatados.map(item => ({
      'Nº OS': item.orderNumber,
      'Vendedor': item.vendedor,
      'Cliente': item.cliente, 
      'Data': item.data,
      'Valor': item.valor,
      'Status': item.status
    }));
    
    // Criar workbook e worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(dadosParaWorksheet);
    
    // Adicionar formatação (largura das colunas)
    const wscols = [
      { wch: 10 }, // Nº OS
      { wch: 20 }, // Vendedor
      { wch: 25 }, // Cliente
      { wch: 12 }, // Data 
      { wch: 15 }, // Valor
      { wch: 20 }  // Status
    ];
    ws['!cols'] = wscols;
    
    // Adicionar worksheet ao workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    
    // Gerar arquivo e baixar
    XLSX.writeFile(wb, 'relatorio_financeiro.xlsx');
    
    console.log('Exportação para Excel concluída com sucesso!');
  } catch (error) {
    console.error('Erro na exportação para Excel:', error);
    alert(`Erro ao exportar para Excel: ${error}`);
  }
}

/**
 * Exporta os dados para PDF usando jsPDF
 */
export function exportToPDF(dados: any[]): void {
  try {
    console.log('Iniciando exportação para PDF...');
    
    // Verificar dados
    if (!dados || dados.length === 0) {
      alert('Não há dados para exportar');
      return;
    }
    
    // Formatar dados
    const dadosFormatados = formatarDados(dados);
    
    // Criar documento PDF (orientação paisagem para caber mais colunas)
    const doc = new jsPDF('landscape');
    
    // Adicionar título
    doc.setFontSize(18);
    doc.text('Relatório Financeiro', 14, 22);
    
    // Adicionar data de geração
    doc.setFontSize(11);
    doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    // Preparar dados para a tabela
    const dadosTabela = dadosFormatados.map(item => [
      item.orderNumber,
      item.vendedor,
      item.cliente,
      item.data,
      item.valor,
      item.status
    ]);
    
    // Criar tabela com autotable
    autoTable(doc, {
      head: [['Nº OS', 'Vendedor', 'Cliente', 'Data', 'Valor', 'Status']],
      body: dadosTabela,
      startY: 35,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [0, 0, 0],
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      },
      columnStyles: {
        0: { cellWidth: 30 },    // Nº OS
        1: { cellWidth: 50 },    // Vendedor
        2: { cellWidth: 50 },    // Cliente
        3: { cellWidth: 30 },    // Data
        4: { cellWidth: 40 },    // Valor
        5: { cellWidth: 40 }     // Status
      }
    });
    
    // Adicionar rodapé
    const totalPaginas = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPaginas; i++) {
      doc.setPage(i);
      doc.setFontSize(10);
      doc.text(
        `Página ${i} de ${totalPaginas}`, 
        doc.internal.pageSize.getWidth() / 2, 
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Salvar o PDF
    doc.save('relatorio_financeiro.pdf');
    
    console.log('Exportação para PDF concluída com sucesso!');
  } catch (error) {
    console.error('Erro na exportação para PDF:', error);
    alert(`Erro ao exportar para PDF: ${error}`);
  }
}