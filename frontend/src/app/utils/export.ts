import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, HeadingLevel, AlignmentType, BorderStyle, ShadingType } from 'docx';
import { saveAs } from 'file-saver';
import { Reservation, Stall } from '../types';
import { getDisplayStallId, getDisplaySectionById, getDisplayCategoryById } from './helpers';

interface ExportRow {
  reservationNumber: string;
  stallId: string;
  displayStallId: string;
  section: string;
  fullName: string;
  contactNumber: string;
  businessName: string;
  dtiNumber: string;
  cedulaNumber: string;
  address: string;
  status: string;
  category: string;
  price?: number | string;
  createdAt: string;
  expiresAt: string;
}

function buildExportData(
  reservations: Reservation[],
  stalls: Stall[],
  mapLabel: string
): ExportRow[] {
  return reservations.map(res => {
    const stall = stalls.find(s => s.id === res.stallId);
    const price = res.price ?? (res.status !== 'pending' ? stall?.price : undefined);
    const row: ExportRow = {
      reservationNumber: res.reservationNumber,
      stallId: res.stallId,
      displayStallId: getDisplayStallId(res.stallId),
      section: stall ? getDisplaySectionById(res.stallId, stall.section) : '',
      fullName: res.fullName,
      contactNumber: res.contactNumber,
      businessName: res.businessName || '',
      dtiNumber: res.dtiNumber || '',
      cedulaNumber: res.cedulaNumber || '',
      address: res.address || '',
      status: res.status.charAt(0).toUpperCase() + res.status.slice(1),
      category: stall ? getDisplayCategoryById(res.stallId, stall.category) : '',
      createdAt: new Date(res.createdAt).toLocaleDateString('en-PH'),
      expiresAt: new Date(res.expiresAt).toLocaleDateString('en-PH'),
    };
    if (price != null && price !== '') {
      row.price = price;
    } else if (res.status === 'pending') {
      row.price = 'To be discussed';
    }
    return row;
  });
}

function getHeaders(data: ExportRow[]): string[] {
  const base = [
    'Reservation No.',
    'Stall ID',
    'Section',
    'Full Name',
    'Contact Number',
    'Business Name',
    'DTI Number',
    'Cedula Number',
    'Address',
    'Status',
    'Category',
  ];
  const hasPrice = data.some(r => r.price != null && r.price !== '');
  if (hasPrice) base.push('Price');
  base.push('Date Created', 'Expiry Date');
  return base;
}

function rowToArray(row: ExportRow, includePrice: boolean): (string | number)[] {
  const arr: (string | number)[] = [
    row.reservationNumber,
    row.displayStallId,
    row.section,
    row.fullName,
    row.contactNumber,
    row.businessName,
    row.dtiNumber,
    row.cedulaNumber,
    row.address,
    row.status,
    row.category,
  ];
  if (includePrice) arr.push(row.price ?? '');
  arr.push(row.createdAt, row.expiresAt);
  return arr;
}

// ─── CSV Export ───────────────────────────────────────────
export function exportToCSV(
  reservations: Reservation[],
  stalls: Stall[],
  mapLabel: string
) {
  const data = buildExportData(reservations, stalls, mapLabel);
  const headers = getHeaders(data);
  const includePrice = headers.includes('Price');
  const rows = data.map(r => rowToArray(r, includePrice));

  const csvContent = [
    headers.join(','),
    ...rows.map(row =>
      row.map(cell => {
        const str = String(cell ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${mapLabel}_Reservations.csv`);
}

// ─── Excel Export ─────────────────────────────────────────
export function exportToExcel(
  reservations: Reservation[],
  stalls: Stall[],
  mapLabel: string
) {
  const data = buildExportData(reservations, stalls, mapLabel);
  const headers = getHeaders(data);
  const includePrice = headers.includes('Price');
  const rows = data.map(r => rowToArray(r, includePrice));

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  const baseCols = [
    { wch: 22 }, // Reservation No.
    { wch: 10 }, // Stall ID
    { wch: 10 }, // Section
    { wch: 22 }, // Full Name
    { wch: 15 }, // Contact
    { wch: 22 }, // Business Name
    { wch: 16 }, // DTI
    { wch: 16 }, // Cedula
    { wch: 30 }, // Address
    { wch: 10 }, // Status
    { wch: 20 }, // Category
  ];
  if (includePrice) baseCols.push({ wch: 10 }); // Price
  baseCols.push({ wch: 14 }, { wch: 14 }); // Created, Expires
  ws['!cols'] = baseCols;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Reservations');

  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `${mapLabel}_Reservations.xlsx`);
}

// ─── Word Export ──────────────────────────────────────────
export async function exportToWord(
  reservations: Reservation[],
  stalls: Stall[],
  mapLabel: string
) {
  const data = buildExportData(reservations, stalls, mapLabel);
  const headers = getHeaders(data);
  const includePrice = headers.includes('Price');

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h =>
      new TableCell({
        children: [new Paragraph({ text: h, bold: true, size: 18 })],
        shading: { type: ShadingType.SOLID, color: '1e40af', fill: '1e40af' },
        width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
      })
    ),
  });

  const dataRows = data.map(row =>
    new TableRow({
      children: rowToArray(row, includePrice).map(cell =>
        new TableCell({
          children: [new Paragraph({ text: String(cell ?? ''), size: 18 })],
          width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
        })
      ),
    })
  );

  const table = new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: `${mapLabel} — Vendor Reservations Report`,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        }),
        new Paragraph({
          text: `Generated on ${new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}`,
          spacing: { after: 100 },
        }),
        new Paragraph({
          text: `Total Records: ${data.length}`,
          spacing: { after: 300 },
        }),
        table,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${mapLabel}_Reservations.docx`);
}
