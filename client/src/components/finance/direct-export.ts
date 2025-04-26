/**
 * Módulo de exportação direta - abordagem extremamente simples e direta
 */

export async function exportTableToPDF(tableId: string, title: string): Promise<string> {
  // Importar jsPDF diretamente
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;
  
  try {
    // Pegar a tabela diretamente do DOM
    const table = document.getElementById(tableId);
    if (!table) {
      throw new Error('Tabela não encontrada no DOM');
    }
    
    // Criar documento em modo paisagem
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Adicionar título
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    
    // Copiar a tabela HTML para um HTML temporário para processamento
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = table.outerHTML;
    
    // Remover colunas de ação (última coluna)
    const tempTable = tempDiv.querySelector('table');
    if (tempTable) {
      const headers = tempTable.querySelectorAll('th');
      const lastHeaderIndex = headers.length - 1;
      
      // Remover cabeçalho de ação (última coluna)
      if (headers[lastHeaderIndex]) {
        headers[lastHeaderIndex].remove();
      }
      
      // Remover células de ação (última coluna de cada linha)
      const rows = tempTable.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length > 0) {
          const lastCellIndex = cells.length - 1;
          if (cells[lastCellIndex]) {
            cells[lastCellIndex].remove();
          }
        }
      });
    }
    
    // Converter tabela HTML para PDF usando autoTable
    const autoTable = (await import('jspdf-autotable')).default;
    autoTable(doc, { 
      html: tempTable,
      startY: 20,
      styles: { 
        fontSize: 8,
        cellWidth: 'auto',
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: { 
        fillColor: [41, 128, 185], 
        textColor: 255,
        fontSize: 9
      },
      alternateRowStyles: { 
        fillColor: [240, 240, 240] 
      },
      margin: { top: 20 }
    });
    
    // Gerar nome de arquivo único
    const now = new Date();
    const fileName = `relatorio_${now.getTime()}.pdf`;
    
    // Salvar arquivo
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error('Erro ao exportar tabela para PDF:', error);
    throw error;
  }
}

export async function exportTableToExcel(tableId: string, sheetName: string): Promise<string> {
  // Importar XLSX diretamente  
  const XLSX = await import('xlsx');
  
  try {
    // Pegar a tabela diretamente do DOM
    const table = document.getElementById(tableId);
    if (!table) {
      throw new Error('Tabela não encontrada no DOM');
    }
    
    // Copiar a tabela HTML para um HTML temporário para processamento
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = table.outerHTML;
    
    // Remover colunas de ação (última coluna)
    const tempTable = tempDiv.querySelector('table');
    if (tempTable) {
      const headers = tempTable.querySelectorAll('th');
      const lastHeaderIndex = headers.length - 1;
      
      // Remover cabeçalho de ação (última coluna)
      if (headers[lastHeaderIndex]) {
        headers[lastHeaderIndex].remove();
      }
      
      // Remover células de ação (última coluna de cada linha)
      const rows = tempTable.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td, th');
        if (cells.length > 0) {
          const lastCellIndex = cells.length - 1;
          if (cells[lastCellIndex]) {
            cells[lastCellIndex].remove();
          }
        }
      });
      
      // Remover botões e ícones (se houver)
      const buttons = tempTable.querySelectorAll('button');
      buttons.forEach(button => button.remove());
      
      const icons = tempTable.querySelectorAll('svg');
      icons.forEach(icon => icon.remove());
    }
    
    // Converter HTML para workbook
    const wb = XLSX.utils.table_to_book(tempTable, { sheet: sheetName });
    
    // Gerar nome de arquivo único
    const now = new Date();
    const fileName = `relatorio_${now.getTime()}.xlsx`;
    
    // Salvar arquivo
    XLSX.writeFile(wb, fileName);
    
    return fileName;
  } catch (error) {
    console.error('Erro ao exportar tabela para Excel:', error);
    throw error;
  }
}