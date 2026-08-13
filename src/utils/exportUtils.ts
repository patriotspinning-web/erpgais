import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COMPANY_HEADER = 'Patriot Spinning Mills Ltd. - ERP System';

/**
 * Export data array to Excel (.xlsx)
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

/**
 * Export structured table data to PDF using jsPDF
 */
export function exportToPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
  orientation: 'portrait' | 'landscape' = 'portrait'
) {
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  // Header background banner
  doc.setFillColor(30, 50, 216); // Brand Blue
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PATRIOT SPINNING MILLS LTD.', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-GB')}`, doc.internal.pageSize.getWidth() - 14, 12, {
    align: 'right',
  });

  // Subtitle / Document Title
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(title, 14, 30);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 35,
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [37, 65, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}
