import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { UsterReport, UsterStage } from '../types';

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

/**
 * Uster Test PDF Stages Definition in Exact Specified Sequence:
 * 1. Finished Yarn
 * 2. Ring (Ring Yarn)
 * 3. Simplex (Simplex Roving)
 * 4. F. Drawing (Finisher Drawing)
 * 5. B Drawing (Breaker Drawing)
 * 6. Carding (Card Sliver)
 * Note: Entire PDF output is strictly 100% English (No Bengali characters).
 */
export const USTER_ORDERED_STAGES: {
  key: UsterStage;
  orderNumber: number;
  stageName: string;
  department: string;
  type: 'yarn' | 'sliver_roving';
  description: string;
}[] = [
  {
    key: 'finished_yarn',
    orderNumber: 1,
    stageName: 'Finished Yarn Test',
    department: 'Winding / Autoconer Section',
    type: 'yarn',
    description: 'Final Cone Quality: A. Count, CSP Strength, U%, CVm%, Imperfections (Thin, Thick, Neps, Total IPI), Hairiness',
  },
  {
    key: 'ring_yarn',
    orderNumber: 2,
    stageName: 'Ring Yarn Test',
    department: 'Ring Spinning Section',
    type: 'yarn',
    description: 'Cop Quality: A. Count, CSP Strength, U%, CVm%, Imperfections (Thin, Thick, Neps, Total IPI), Hairiness',
  },
  {
    key: 'simplex_roving',
    orderNumber: 3,
    stageName: 'Simplex Roving Test',
    department: 'Speed Frame / Simplex Section',
    type: 'sliver_roving',
    description: 'Roving Uniformity: U%, CVm%, Cut-Length Mass Variations (CVm 1m, CVm 3m)',
  },
  {
    key: 'f_drawing',
    orderNumber: 4,
    stageName: 'F. Drawing Test',
    department: 'Finisher Drawing Section',
    type: 'sliver_roving',
    description: 'Finisher Sliver Quality: Auto-Leveler Verification, U%, CVm%, CVm 1m, CVm 3m',
  },
  {
    key: 'b_drawing',
    orderNumber: 5,
    stageName: 'B Drawing Test',
    department: 'Breaker Drawing Section',
    type: 'sliver_roving',
    description: 'Breaker Sliver Uniformity: U%, CVm%, CVm 1m, CVm 3m',
  },
  {
    key: 'card_sliver',
    orderNumber: 6,
    stageName: 'Carding Sliver Test',
    department: 'Carding Section',
    type: 'sliver_roving',
    description: 'Card Sliver Evenness: U%, CVm%, CVm 1m, CVm 3m',
  },
];

/**
 * Dedicated Uster Quality Test PDF Generator
 * Output Order: Finished Yarn -> Ring -> Simplex -> F. Drawing -> B Drawing -> Carding
 * Page Layout: Ultra-compact A4 Portrait Mode (210mm x 297mm) engineered to fit on 1 single page
 * Language: Strictly 100% English (No Bengali characters)
 */
export function exportUsterPDFReport(
  allReports: UsterReport[],
  targetStage: UsterStage | 'all' = 'all',
  activeLotFilter: string = 'ALL'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm

  // Helper function to draw compact corporate header
  const drawHeader = () => {
    // Top banner (slim 12mm)
    doc.setFillColor(30, 41, 59); // Slate 900
    doc.rect(0, 0, pageWidth, 12, 'F');

    // Accent line
    doc.setFillColor(147, 51, 234); // Purple 600
    doc.rect(0, 12, pageWidth, 0.8, 'F');

    // Mill Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text('PATRIOT SPINNING MILLS LTD.', 10, 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(203, 213, 225); // Slate 300
    doc.text('Central Quality Assurance Laboratory - Uster Textile Testing Division', 10, 9.5);

    // Document Title & Timestamp
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('USTER QUALITY REPORT', pageWidth - 10, 5.5, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(203, 213, 225);
    const filterText = activeLotFilter !== 'ALL' ? ` | Lot: ${activeLotFilter}` : '';
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}${filterText}`, pageWidth - 10, 9.5, { align: 'right' });
  };

  // Helper function to draw footer
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(10, pageHeight - 11, pageWidth - 10, pageHeight - 11);

    // Signatures
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(100, 116, 139);
    doc.text('Tested By (Lab Technician)', 14, pageHeight - 6);
    doc.text('Quality Assurance In-Charge', pageWidth / 2, pageHeight - 6, { align: 'center' });
    doc.text('General Manager / Mill Head', pageWidth - 14, pageHeight - 6, { align: 'right' });

    // Page Number
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth / 2, pageHeight - 2.5, { align: 'center' });
  };

  drawHeader();

  let currentY = 15;

  // Filter stages according to selection
  const stagesToRender =
    targetStage === 'all'
      ? USTER_ORDERED_STAGES
      : USTER_ORDERED_STAGES.filter((s) => s.key === targetStage);

  stagesToRender.forEach((stageDef) => {
    // Filter records for this stage and lot
    const stageRecords = allReports.filter((r) => {
      const itemStage = r.stage || (r.count ? 'ring_yarn' : 'card_sliver');
      if (itemStage !== stageDef.key) return false;
      if (activeLotFilter !== 'ALL' && r.lotNo !== activeLotFilter) return false;
      return true;
    });

    // Check page remaining space
    if (currentY > pageHeight - 25) {
      doc.addPage();
      drawHeader();
      currentY = 15;
    }

    // Slim Section Header Strip (4.8mm)
    doc.setFillColor(243, 244, 246); // Gray 100
    doc.rect(10, currentY, pageWidth - 20, 4.8, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.rect(10, currentY, pageWidth - 20, 4.8, 'D');

    // Section Number Badge
    doc.setFillColor(147, 51, 234); // Purple 600
    doc.rect(10.8, currentY + 0.6, 3.6, 3.6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text(String(stageDef.orderNumber), 12.6, currentY + 3.2, { align: 'center' });

    // Section Title
    doc.setTextColor(17, 24, 39); // Gray 900
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.text(`${stageDef.stageName.toUpperCase()}`, 16, currentY + 3.4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(107, 114, 128);
    doc.text(`[ ${stageDef.department} ] - Tests: ${stageRecords.length}`, 65, currentY + 3.4);

    currentY += 5.5;

    if (stageRecords.length === 0) {
      // Empty placeholder
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6);
      doc.setTextColor(156, 163, 175);
      doc.text(`No test records registered for ${stageDef.stageName}.`, 12, currentY + 1.2);
      currentY += 3.5;
      return;
    }

    if (stageDef.type === 'yarn') {
      // Yarn Table Headers (Finished Yarn & Ring Yarn) in Ultra-compact Mode
      const headers = [
        'Test ID',
        'Date',
        'Machine',
        'Lot',
        'Count',
        'CSP',
        'U%',
        'CVm%',
        'Thin',
        'Thick',
        'Neps',
        'IPI',
        'H',
        'Remarks',
      ];

      let sumCsp = 0;
      let sumU = 0;
      let sumCvm = 0;
      let sumThin = 0;
      let sumThick = 0;
      let sumNeps = 0;
      let sumIpi = 0;
      let sumH = 0;
      let countCsp = 0;
      let countH = 0;

      const rows = stageRecords.map((r) => {
        const thin = r.thinPlaces ?? 0;
        const thick = r.thickPlaces ?? 0;
        const neps = r.neps ?? 0;
        const totalIpi = r.ipi !== undefined ? r.ipi : thin + thick + neps;

        sumU += Number(r.unevenness || 0);
        sumCvm += Number(r.cvm || 0);
        sumThin += thin;
        sumThick += thick;
        sumNeps += neps;
        sumIpi += totalIpi;

        if (r.csp) {
          sumCsp += Number(r.csp);
          countCsp++;
        }
        if (r.hairiness !== undefined && r.hairiness !== null) {
          sumH += Number(r.hairiness);
          countH++;
        }

        return [
          r.uTestId || `UT-${r.id}`,
          r.testDate,
          r.machine,
          r.lotNo,
          r.count || '-',
          r.csp ? String(r.csp) : '-',
          `${Number(r.unevenness).toFixed(1)}%`,
          `${Number(r.cvm).toFixed(1)}%`,
          String(thin),
          String(thick),
          String(neps),
          String(totalIpi),
          r.hairiness !== undefined && r.hairiness !== null ? String(r.hairiness) : '-',
          r.remarks || '-',
        ];
      });

      // Append Average Row
      const count = stageRecords.length;
      const avgRow = [
        'AVG',
        '-',
        '-',
        '-',
        '-',
        countCsp ? String(Math.round(sumCsp / countCsp)) : '-',
        `${(sumU / count).toFixed(1)}%`,
        `${(sumCvm / count).toFixed(1)}%`,
        (sumThin / count).toFixed(1),
        (sumThick / count).toFixed(1),
        (sumNeps / count).toFixed(1),
        String(Math.round(sumIpi / count)),
        countH ? (sumH / countH).toFixed(2) : '-',
        '-',
      ];
      rows.push(avgRow);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: currentY,
        styles: {
          fontSize: 5.6,
          cellPadding: 0.8,
          textColor: [30, 41, 59],
          lineWidth: 0.08,
          lineColor: [226, 232, 240],
          minCellHeight: 3.5,
        },
        headStyles: {
          fillColor: stageDef.key === 'finished_yarn' ? [225, 29, 72] : [5, 150, 105], // Rose 600 for Finished, Emerald 600 for Ring
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 5.8,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 16 },
          1: { cellWidth: 14 },
          2: { cellWidth: 15 },
          3: { cellWidth: 15 },
          4: { fontStyle: 'bold', textColor: [109, 40, 217], cellWidth: 18 },
          5: { fontStyle: 'bold', halign: 'right', textColor: [4, 120, 87], cellWidth: 11 },
          6: { halign: 'right', cellWidth: 11 },
          7: { fontStyle: 'bold', halign: 'right', cellWidth: 12 },
          8: { halign: 'right', cellWidth: 9 },
          9: { halign: 'right', cellWidth: 9 },
          10: { halign: 'right', cellWidth: 9 },
          11: { fontStyle: 'bold', halign: 'right', textColor: [225, 29, 72], cellWidth: 11 },
          12: { halign: 'right', cellWidth: 9 },
        },
        didParseCell: (data) => {
          if (data.row.index === rows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
            data.cell.styles.textColor = [15, 23, 42];
          }
        },
        margin: { left: 10, right: 10 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 3;
    } else {
      // Sliver & Roving Table Headers (Simplex, F. Drawing, B Drawing, Carding)
      const headers = [
        'Test ID',
        'Date',
        'Machine',
        'Lot No',
        'Mixing / Blend',
        'U% (Unevenness)',
        'CVm%',
        'CVm 1m',
        'CVm 3m',
        'Shift',
        'Remarks',
      ];

      let sumU = 0;
      let sumCvm = 0;
      let sumCvm1m = 0;
      let sumCvm3m = 0;
      let countCvm1m = 0;
      let countCvm3m = 0;

      const rows = stageRecords.map((r) => {
        sumU += Number(r.unevenness || 0);
        sumCvm += Number(r.cvm || 0);

        if (r.cvm1m !== undefined && r.cvm1m !== null) {
          sumCvm1m += Number(r.cvm1m);
          countCvm1m++;
        }
        if (r.cvm3m !== undefined && r.cvm3m !== null) {
          sumCvm3m += Number(r.cvm3m);
          countCvm3m++;
        }

        return [
          r.uTestId || `UT-${r.id}`,
          r.testDate,
          r.machine,
          r.lotNo,
          r.mixing || '-',
          `${Number(r.unevenness).toFixed(2)}%`,
          `${Number(r.cvm).toFixed(2)}%`,
          r.cvm1m !== undefined && r.cvm1m !== null ? `${Number(r.cvm1m).toFixed(2)}%` : '-',
          r.cvm3m !== undefined && r.cvm3m !== null ? `${Number(r.cvm3m).toFixed(2)}%` : '-',
          r.shift || 'A',
          r.remarks || '-',
        ];
      });

      // Append Average Row
      const count = stageRecords.length;
      const avgRow = [
        'AVG',
        '-',
        '-',
        '-',
        '-',
        `${(sumU / count).toFixed(2)}%`,
        `${(sumCvm / count).toFixed(2)}%`,
        countCvm1m ? `${(sumCvm1m / countCvm1m).toFixed(2)}%` : '-',
        countCvm3m ? `${(sumCvm3m / countCvm3m).toFixed(2)}%` : '-',
        '-',
        '-',
      ];
      rows.push(avgRow);

      // Section Head Colors
      let headBg = [79, 70, 229]; // Indigo 600 for Simplex
      if (stageDef.key === 'f_drawing') headBg = [67, 56, 202]; // Indigo 700
      if (stageDef.key === 'b_drawing') headBg = [37, 99, 235]; // Blue 600
      if (stageDef.key === 'card_sliver') headBg = [217, 119, 6]; // Amber 600

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: currentY,
        styles: {
          fontSize: 5.8,
          cellPadding: 0.8,
          textColor: [30, 41, 59],
          lineWidth: 0.08,
          lineColor: [226, 232, 240],
          minCellHeight: 3.5,
        },
        headStyles: {
          fillColor: headBg as [number, number, number],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 6,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 18 },
          1: { cellWidth: 15 },
          2: { cellWidth: 16 },
          3: { cellWidth: 16 },
          4: { cellWidth: 24 },
          5: { fontStyle: 'bold', halign: 'right', textColor: [126, 34, 206], cellWidth: 17 },
          6: { fontStyle: 'bold', halign: 'right', textColor: [67, 56, 202], cellWidth: 15 },
          7: { halign: 'right', textColor: [37, 99, 235], cellWidth: 15 },
          8: { halign: 'right', textColor: [2, 132, 199], cellWidth: 15 },
        },
        didParseCell: (data) => {
          if (data.row.index === rows.length - 1) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fillColor = [241, 245, 249];
            data.cell.styles.textColor = [15, 23, 42];
          }
        },
        margin: { left: 10, right: 10 },
      });

      currentY = (doc as any).lastAutoTable.finalY + 3;
    }
  });

  // Apply footers and page numbering to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  const fileDate = new Date().toISOString().split('T')[0];
  const fileStage = targetStage === 'all' ? 'All_Stages' : targetStage.toUpperCase();
  doc.save(`Patriot_Spinning_Uster_${fileStage}_Report_${fileDate}.pdf`);
}

