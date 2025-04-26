/**
 * Implementação final da exportação de dados para Excel e PDF
 * Utilizando bibliotecas oficiais e estáveis: xlsx e jspdf
 */

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

// Tipo para representar os dados formatados completos
interface FormattedData {
  id: number;
  orderNumber: string;
  vendedor: string;
  cliente: string;
  data: string;
  valor: string;
  totalPago: string;
  totalEmAberto: string;
  custosOperacionais: string;
  resultadoLiquido: string;
  metodo: string;
  tipoServico: string;
  parcelas: number;
  ultimoStatus: string;
  statusFinanceiro: string;
  status: string;
  observacoes: string;
}

/**
 * Formata os dados brutos para um formato mais completo adequado para exportação
 */
function formatarDados(dadosBrutos: any[]): FormattedData[] {
  return dadosBrutos.map(item => {
    // Calcular informações financeiras 
    const totalPago = item.installments ? 
      item.installments
        .filter((inst: any) => inst.status === 'paid')
        .reduce((sum: number, inst: any) => sum + parseFloat(inst.amount || 0), 0) : 0;
    
    const totalEmAberto = item.installments ?
      item.installments
        .filter((inst: any) => inst.status !== 'paid')
        .reduce((sum: number, inst: any) => sum + parseFloat(inst.amount || 0), 0) : 0;
    
    // Calcular custos operacionais
    const custoTotal = item.operationalCosts ? 
      item.operationalCosts.reduce((sum: number, cost: any) => sum + parseFloat(cost.amount || 0), 0) : 0;
    
    // Calcular resultado líquido
    const totalVenda = parseFloat(item.totalAmount || 0);
    const resultadoLiquido = totalVenda - custoTotal;
    
    // Formatação de valores monetários
    const formatarMoeda = (valor: number) => {
      return valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});
    };

    return {
      id: item.id || 0,
      orderNumber: item.orderNumber || '',
      vendedor: item.sellerName || '',
      cliente: item.customerName || '',
      data: item.date ? new Date(item.date).toLocaleDateString('pt-BR') : '',
      valor: typeof item.totalAmount === 'number' 
        ? formatarMoeda(item.totalAmount)
        : item.totalAmount || '0',
      totalPago: formatarMoeda(totalPago),
      totalEmAberto: formatarMoeda(totalEmAberto),
      custosOperacionais: formatarMoeda(custoTotal),
      resultadoLiquido: formatarMoeda(resultadoLiquido),
      metodo: item.paymentMethodName || '',
      tipoServico: item.serviceTypeName || '',
      parcelas: item.installments?.length || 0,
      ultimoStatus: item.lastStatusUpdate ? new Date(item.lastStatusUpdate).toLocaleDateString('pt-BR') : '',
      statusFinanceiro: item.financialStatus || '',
      status: item.status || '',
      observacoes: item.notes || ''
    };
  });
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
      'Valor Total': item.valor,
      'Valor Pago': item.totalPago,
      'Valor em Aberto': item.totalEmAberto,
      'Custos Operacionais': item.custosOperacionais,
      'Resultado Líquido': item.resultadoLiquido,
      'Forma de Pagamento': item.metodo,
      'Tipo de Serviço': item.tipoServico,
      'Parcelas': item.parcelas,
      'Última Atualização': item.ultimoStatus,
      'Status Financeiro': item.statusFinanceiro,
      'Status Operacional': item.status,
      'Observações': item.observacoes
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
      { wch: 15 }, // Valor Total
      { wch: 15 }, // Valor Pago
      { wch: 15 }, // Valor em Aberto
      { wch: 15 }, // Custos Operacionais
      { wch: 15 }, // Resultado Líquido
      { wch: 20 }, // Forma de Pagamento
      { wch: 20 }, // Tipo de Serviço
      { wch: 10 }, // Parcelas
      { wch: 15 }, // Última Atualização
      { wch: 20 }, // Status Financeiro
      { wch: 20 }, // Status Operacional
      { wch: 30 }  // Observações
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
    // Utilizamos tamanho A3 para caber mais dados
    const doc = new jsPDF('landscape', 'mm', 'a3');
    
    // Adicionar título
    doc.setFontSize(18);
    doc.text('Relatório Financeiro', 14, 22);
    
    // Adicionar data de geração
    doc.setFontSize(11);
    doc.text(`Data de geração: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
    
    // Preparar dados para a tabela - incluindo todas as informações disponíveis
    const dadosTabela = dadosFormatados.map(item => [
      item.orderNumber,
      item.vendedor,
      item.cliente,
      item.data,
      item.valor,
      item.totalPago,
      item.totalEmAberto,
      item.custosOperacionais,
      item.resultadoLiquido,
      item.metodo,
      item.tipoServico,
      item.parcelas.toString(),
      item.statusFinanceiro,
      item.status
    ]);
    
    // Criar tabela com autotable - cabeçalhos completos
    autoTable(doc, {
      head: [['Nº OS', 'Vendedor', 'Cliente', 'Data', 'Valor Total', 'Valor Pago', 'Valor em Aberto', 
              'Custos', 'Resultado', 'Forma Pgto', 'Tipo Serviço', 'Parcelas', 'Status Fin.', 'Status Op.']],
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
        0: { cellWidth: 15 },    // Nº OS
        1: { cellWidth: 25 },    // Vendedor
        2: { cellWidth: 25 },    // Cliente
        3: { cellWidth: 15 },    // Data
        4: { cellWidth: 18 },    // Valor Total
        5: { cellWidth: 18 },    // Valor Pago
        6: { cellWidth: 18 },    // Valor em Aberto
        7: { cellWidth: 15 },    // Custos
        8: { cellWidth: 15 },    // Resultado
        9: { cellWidth: 20 },    // Forma Pgto
        10: { cellWidth: 20 },   // Tipo Serviço
        11: { cellWidth: 15 },   // Parcelas
        12: { cellWidth: 18 },   // Status Fin.
        13: { cellWidth: 18 }    // Status Op.
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