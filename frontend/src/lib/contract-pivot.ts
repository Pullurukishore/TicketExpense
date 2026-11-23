/**
 * Contract Pivot Table Computation & Excel Export
 * Reproduces and enhances the official Excel Pivot summary for Kardex Remstar machines.
 */
import ExcelJS from 'exceljs';
import { normalizeEngineerNames } from './utils';

export interface PivotMachineItem {
  id: number;
  customerName: string;
  customerClass?: string | null;
  place?: string | null;
  zoneName?: string | null;
  engineerName?: string | null;
  serialNumber: string;
  unitType?: string | null;
  contractType?: string | null;
  mcValue?: number | null;
  installationYear?: string | null;
  mcStartDate?: string | null;
  mcEndDate?: string | null;
}

export interface EngineerZonePivotRow {
  engineer: string;
  zone: string;
  noCount: number;
  umcCount: number;
  uwCount: number;
  totalCount: number;
  noValue: number;
  umcValue: number;
  uwValue: number;
  totalValue: number;
}

export interface ZoneSummaryPivotRow {
  zone: string;
  noCount: number;
  umcCount: number;
  uwCount: number;
  totalCount: number;
  totalValue: number;
  umcPercentage: number;
}

export interface ClassPivotRow {
  customerClass: string;
  noCount: number;
  umcCount: number;
  uwCount: number;
  totalCount: number;
  totalValue: number;
  umcPercentage: number;
}

export interface UnitTypePivotRow {
  unitType: string;
  noCount: number;
  umcCount: number;
  uwCount: number;
  totalCount: number;
  totalValue: number;
  umcPercentage: number;
}

export interface PivotTotals {
  noCount: number;
  umcCount: number;
  uwCount: number;
  totalCount: number;
  noValue: number;
  umcValue: number;
  uwValue: number;
  totalValue: number;
}

export interface ContractPivotData {
  engineerZoneRows: EngineerZonePivotRow[];
  zoneRows: ZoneSummaryPivotRow[];
  classRows: ClassPivotRow[];
  unitTypeRows: UnitTypePivotRow[];
  totals: PivotTotals;
  totalMachines: number;
  umcRate: number;
}

/**
 * Categorize a contract type string into 'UMC' | 'UW' | 'NO'
 */
export function categorizeContractStatus(raw: string | null | undefined): 'UMC' | 'UW' | 'NO' {
  if (!raw) return 'NO';
  const upper = raw.toUpperCase().trim();
  if (upper === 'UMC' || upper === 'AMC' || upper === 'CMC') return 'UMC';
  if (upper === 'UW' || upper.includes('WARRANTY')) return 'UW';
  return 'NO';
}

/**
 * Computes all pivot tables from an array of machines.
 */
export function computeContractPivots(machines: PivotMachineItem[]): ContractPivotData {
  const engMap: Record<string, { engineer: string; zone: string; noCount: number; umcCount: number; uwCount: number; noVal: number; umcVal: number; uwVal: number }> = {};
  const zoneMap: Record<string, { zone: string; noCount: number; umcCount: number; uwCount: number; totalVal: number }> = {};
  const classMap: Record<string, { customerClass: string; noCount: number; umcCount: number; uwCount: number; totalVal: number }> = {};
  const unitTypeMap: Record<string, { unitType: string; noCount: number; umcCount: number; uwCount: number; totalVal: number }> = {};

  const totals: PivotTotals = {
    noCount: 0,
    umcCount: 0,
    uwCount: 0,
    totalCount: 0,
    noValue: 0,
    umcValue: 0,
    uwValue: 0,
    totalValue: 0,
  };

  for (const m of machines) {
    const status = categorizeContractStatus(m.contractType);
    const val = Number(m.mcValue) || 0;
    const zone = (m.zoneName || 'Unknown').trim() || 'Unknown';
    const normEngNames = normalizeEngineerNames(m.engineerName);
    const engineer = normEngNames.length > 0 ? normEngNames.join(', ') : (m.engineerName?.trim() || 'Unassigned');
    const customerClass = (m.customerClass || 'Unassigned').trim().toUpperCase() || 'Unassigned';
    const unitType = (m.unitType || 'Other').trim() || 'Other';

    // Totals
    totals.totalCount++;
    totals.totalValue += val;
    if (status === 'UMC') {
      totals.umcCount++;
      totals.umcValue += val;
    } else if (status === 'UW') {
      totals.uwCount++;
      totals.uwValue += val;
    } else {
      totals.noCount++;
      totals.noValue += val;
    }

    // 1. Engineer & Zone
    const engKey = `${engineer}___${zone}`;
    if (!engMap[engKey]) {
      engMap[engKey] = { engineer, zone, noCount: 0, umcCount: 0, uwCount: 0, noVal: 0, umcVal: 0, uwVal: 0 };
    }
    if (status === 'UMC') {
      engMap[engKey].umcCount++;
      engMap[engKey].umcVal += val;
    } else if (status === 'UW') {
      engMap[engKey].uwCount++;
      engMap[engKey].uwVal += val;
    } else {
      engMap[engKey].noCount++;
      engMap[engKey].noVal += val;
    }

    // 2. Zone Summary
    if (!zoneMap[zone]) {
      zoneMap[zone] = { zone, noCount: 0, umcCount: 0, uwCount: 0, totalVal: 0 };
    }
    zoneMap[zone].totalVal += val;
    if (status === 'UMC') zoneMap[zone].umcCount++;
    else if (status === 'UW') zoneMap[zone].uwCount++;
    else zoneMap[zone].noCount++;

    // 3. Customer Class
    if (!classMap[customerClass]) {
      classMap[customerClass] = { customerClass, noCount: 0, umcCount: 0, uwCount: 0, totalVal: 0 };
    }
    classMap[customerClass].totalVal += val;
    if (status === 'UMC') classMap[customerClass].umcCount++;
    else if (status === 'UW') classMap[customerClass].uwCount++;
    else classMap[customerClass].noCount++;

    // 4. Unit Type
    if (!unitTypeMap[unitType]) {
      unitTypeMap[unitType] = { unitType, noCount: 0, umcCount: 0, uwCount: 0, totalVal: 0 };
    }
    unitTypeMap[unitType].totalVal += val;
    if (status === 'UMC') unitTypeMap[unitType].umcCount++;
    else if (status === 'UW') unitTypeMap[unitType].uwCount++;
    else unitTypeMap[unitType].noCount++;
  }

  // Convert & Sort Engineer & Zone Rows (by total machines descending)
  const engineerZoneRows: EngineerZonePivotRow[] = Object.values(engMap).map(e => ({
    engineer: e.engineer,
    zone: e.zone,
    noCount: e.noCount,
    umcCount: e.umcCount,
    uwCount: e.uwCount,
    totalCount: e.noCount + e.umcCount + e.uwCount,
    noValue: e.noVal,
    umcValue: e.umcVal,
    uwValue: e.uwVal,
    totalValue: e.noVal + e.umcVal + e.uwVal,
  })).sort((a, b) => b.totalCount - a.totalCount);

  // Preferred Zone order: West, South, North, East
  const zoneOrder = ['West', 'South', 'North', 'East'];
  const zoneRows: ZoneSummaryPivotRow[] = Object.values(zoneMap).map(z => {
    const total = z.noCount + z.umcCount + z.uwCount;
    return {
      zone: z.zone,
      noCount: z.noCount,
      umcCount: z.umcCount,
      uwCount: z.uwCount,
      totalCount: total,
      totalValue: z.totalVal,
      umcPercentage: total > 0 ? (z.umcCount / total) * 100 : 0,
    };
  }).sort((a, b) => {
    const idxA = zoneOrder.indexOf(a.zone);
    const idxB = zoneOrder.indexOf(b.zone);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return b.totalCount - a.totalCount;
  });

  // Class Rows: A, B, C, Unassigned
  const classOrder = ['A', 'B', 'C'];
  const classRows: ClassPivotRow[] = Object.values(classMap).map(c => {
    const total = c.noCount + c.umcCount + c.uwCount;
    return {
      customerClass: c.customerClass,
      noCount: c.noCount,
      umcCount: c.umcCount,
      uwCount: c.uwCount,
      totalCount: total,
      totalValue: c.totalVal,
      umcPercentage: total > 0 ? (c.umcCount / total) * 100 : 0,
    };
  }).sort((a, b) => {
    const idxA = classOrder.indexOf(a.customerClass);
    const idxB = classOrder.indexOf(b.customerClass);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return b.totalCount - a.totalCount;
  });

  // Unit Type Rows
  const unitTypeRows: UnitTypePivotRow[] = Object.values(unitTypeMap).map(u => {
    const total = u.noCount + u.umcCount + u.uwCount;
    return {
      unitType: u.unitType,
      noCount: u.noCount,
      umcCount: u.umcCount,
      uwCount: u.uwCount,
      totalCount: total,
      totalValue: u.totalVal,
      umcPercentage: total > 0 ? (u.umcCount / total) * 100 : 0,
    };
  }).sort((a, b) => b.totalCount - a.totalCount);

  const umcRate = totals.totalCount > 0 ? (totals.umcCount / totals.totalCount) * 100 : 0;

  return {
    engineerZoneRows,
    zoneRows,
    classRows,
    unitTypeRows,
    totals,
    totalMachines: totals.totalCount,
    umcRate,
  };
}

/**
 * Adds the two official Pivot sheets (Engineer & Zone Pivot + Zone Summary Pivot) to any ExcelJS workbook.
 */
export function addPivotSheetsToWorkbook(
  workbook: ExcelJS.Workbook,
  pivotData: ContractPivotData,
  subtitle: string = 'Kardex Remstar Annual Contracts — Executive Pivot Report'
): void {
  const NAVY = '1F3864';
  const HEADER_FILL = '203764';
  const SUBHEADER_FILL = '305496';
  const TOTAL_FILL = '1B365D';
  const BORDER_COLOR = 'D9D9D9';
  const ZEBRA_FILL = 'F9FAFB';

  const thinBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
    left: { style: 'thin', color: { argb: BORDER_COLOR } },
    right: { style: 'thin', color: { argb: BORDER_COLOR } },
  };

  const doubleBottomBorder: Partial<ExcelJS.Borders> = {
    top: { style: 'thin', color: { argb: 'FFFFFF' } },
    bottom: { style: 'double', color: { argb: 'FFFFFF' } },
    left: { style: 'thin', color: { argb: '1F3864' } },
    right: { style: 'thin', color: { argb: '1F3864' } },
  };

  // ==========================================
  // SHEET: Engineer & Zone Breakdown (Table 1)
  // ==========================================
  const ws1 = workbook.addWorksheet('Engineer & Zone Pivot', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 5 }],
  });

  // Title Block
  ws1.mergeCells('A1:J1');
  const titleCell1 = ws1.getCell('A1');
  titleCell1.value = 'KARDEX REMSTAR — CONTRACT PIVOT SUMMARY';
  titleCell1.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  titleCell1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws1.getRow(1).height = 30;

  ws1.mergeCells('A2:J2');
  const subCell1 = ws1.getCell('A2');
  subCell1.value = `${subtitle} | Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`;
  subCell1.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: '595959' } };
  subCell1.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws1.getRow(2).height = 18;

  // Header Super-groups (Row 3)
  ws1.mergeCells('A3:B4');
  const engHeader = ws1.getCell('A3');
  engHeader.value = 'Engineer & Zone';
  engHeader.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  engHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
  engHeader.alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells('C3:F3');
  const countGroup = ws1.getCell('C3');
  countGroup.value = 'Count of Serial Number';
  countGroup.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  countGroup.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBHEADER_FILL } };
  countGroup.alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.mergeCells('G3:J3');
  const valGroup = ws1.getCell('G3');
  valGroup.value = 'Sum of MC Value (₹)';
  valGroup.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
  valGroup.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: SUBHEADER_FILL } };
  valGroup.alignment = { horizontal: 'center', vertical: 'middle' };

  ws1.getRow(3).height = 20;

  // Subheaders (Row 4)
  const subHeaders1 = [
    'Kdx Engineer', 'Zone',
    'NO', 'UMC', 'UW', 'Total Count',
    'NO (₹)', 'UMC (₹)', 'UW (₹)', 'Total Value (₹)'
  ];

  const row4 = ws1.getRow(4);
  row4.values = subHeaders1;
  row4.height = 22;
  row4.eachCell((cell, colNum) => {
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { horizontal: colNum <= 2 ? 'left' : 'right', vertical: 'middle' };
    cell.border = thinBorder;
  });

  // Data Rows
  let rIdx = 5;
  for (const r of pivotData.engineerZoneRows) {
    const row = ws1.getRow(rIdx);
    row.values = [
      r.engineer,
      r.zone,
      r.noCount || null,
      r.umcCount || null,
      r.uwCount || null,
      r.totalCount,
      r.noValue || null,
      r.umcValue || null,
      r.uwValue || null,
      r.totalValue || null,
    ];
    row.height = 19;

    const isZebra = rIdx % 2 === 1;
    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.border = thinBorder;
      if (isZebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_FILL } };
      }
      if (colNum <= 2) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
      } else if (colNum <= 6) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0';
        if (colNum === 6) cell.font = { name: 'Segoe UI', size: 9, bold: true };
      } else {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '₹#,##0';
        if (colNum === 10) cell.font = { name: 'Segoe UI', size: 9, bold: true };
      }
    });
    rIdx++;
  }

  // Grand Total Row
  const totRow1 = ws1.getRow(rIdx);
  totRow1.values = [
    'Grand Total',
    '',
    pivotData.totals.noCount,
    pivotData.totals.umcCount,
    pivotData.totals.uwCount,
    pivotData.totals.totalCount,
    pivotData.totals.noValue,
    pivotData.totals.umcValue,
    pivotData.totals.uwValue,
    pivotData.totals.totalValue,
  ];
  totRow1.height = 24;
  totRow1.eachCell((cell, colNum) => {
    cell.font = { name: 'Segoe UI', size: 9.5, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_FILL } };
    cell.border = doubleBottomBorder;
    if (colNum <= 2) {
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    } else if (colNum <= 6) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '#,##0';
    } else {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '₹#,##0';
    }
  });

  ws1.columns = [
    { width: 22 }, // Engineer
    { width: 14 }, // Zone
    { width: 10 }, // NO Count
    { width: 12 }, // UMC Count
    { width: 10 }, // UW Count
    { width: 14 }, // Total Count
    { width: 16 }, // NO Value
    { width: 18 }, // UMC Value
    { width: 14 }, // UW Value
    { width: 20 }, // Total Value
  ];

  // ==========================================
  // SHEET: Zone Summary Breakdown (Table 2)
  // ==========================================
  const ws2 = workbook.addWorksheet('Zone Summary Pivot', {
    views: [{ showGridLines: true, state: 'frozen', ySplit: 4 }],
  });

  ws2.mergeCells('A1:G1');
  const titleCell2 = ws2.getCell('A1');
  titleCell2.value = 'KARDEX REMSTAR — ZONE CONTRACT SUMMARY';
  titleCell2.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFF' } };
  titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
  titleCell2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws2.getRow(1).height = 30;

  ws2.mergeCells('A2:G2');
  const subCell2 = ws2.getCell('A2');
  subCell2.value = `Zone-wise distribution and contract penetration rate | Generated on ${new Date().toLocaleDateString('en-IN')}`;
  subCell2.font = { name: 'Segoe UI', size: 9.5, italic: true, color: { argb: '595959' } };
  subCell2.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws2.getRow(2).height = 18;

  // Header (Row 3)
  const zoneHeaders = ['Zone', 'NO (Expired)', 'UMC (Contract)', 'UW (Warranty)', 'Total Machines', 'Total Value (₹)', 'AMC Penetration %'];
  const rowZoneH = ws2.getRow(3);
  rowZoneH.values = zoneHeaders;
  rowZoneH.height = 24;
  rowZoneH.eachCell((cell, colNum) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } };
    cell.alignment = { horizontal: colNum === 1 ? 'left' : 'right', vertical: 'middle' };
    cell.border = thinBorder;
  });

  let zIdx = 4;
  for (const z of pivotData.zoneRows) {
    const row = ws2.getRow(zIdx);
    row.values = [
      z.zone,
      z.noCount,
      z.umcCount,
      z.uwCount,
      z.totalCount,
      z.totalValue,
      z.umcPercentage / 100,
    ];
    row.height = 20;
    const isZebra = zIdx % 2 === 1;

    row.eachCell((cell, colNum) => {
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.border = thinBorder;
      if (isZebra) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA_FILL } };
      if (colNum === 1) {
        cell.alignment = { horizontal: 'left', vertical: 'middle' };
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
      } else if (colNum <= 5) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '#,##0';
        if (colNum === 5) cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
      } else if (colNum === 6) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '₹#,##0';
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
      } else {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
        cell.numFmt = '0.0%';
        cell.font = { name: 'Segoe UI', size: 9.5, bold: true };
      }
    });
    zIdx++;
  }

  // Zone Grand Total
  const totZoneRow = ws2.getRow(zIdx);
  totZoneRow.values = [
    'Grand Total',
    pivotData.totals.noCount,
    pivotData.totals.umcCount,
    pivotData.totals.uwCount,
    pivotData.totals.totalCount,
    pivotData.totals.totalValue,
    pivotData.umcRate / 100,
  ];
  totZoneRow.height = 24;
  totZoneRow.eachCell((cell, colNum) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: TOTAL_FILL } };
    cell.border = doubleBottomBorder;
    if (colNum === 1) {
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    } else if (colNum <= 5) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '#,##0';
    } else if (colNum === 6) {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '₹#,##0';
    } else {
      cell.alignment = { horizontal: 'right', vertical: 'middle' };
      cell.numFmt = '0.0%';
    }
  });

  ws2.columns = [
    { width: 16 }, // Zone
    { width: 16 }, // NO Count
    { width: 18 }, // UMC Count
    { width: 16 }, // UW Count
    { width: 18 }, // Total Count
    { width: 22 }, // Total Value
    { width: 20 }, // Penetration %
  ];
}

/**
 * Export the complete Pivot Table to an Excel workbook (.xlsx) with formatting
 */
export async function exportContractPivotToExcel(
  pivotData: ContractPivotData,
  subtitle: string = 'Kardex Remstar Annual Contracts — Executive Pivot Report'
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Kardex Remstar';
  workbook.lastModifiedBy = 'Kardex Remstar System';
  workbook.created = new Date();
  workbook.modified = new Date();

  addPivotSheetsToWorkbook(workbook, pivotData, subtitle);

  // Write and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const dateStr = new Date().toISOString().slice(0, 10);
  link.download = `Contract_Pivot_Report_${dateStr}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
