import { adminCsv } from '@/server/api/schemas/admin';

type CsvCell = string | number | null;

/**
 * Download rows as a CSV file. Cells are quoted, and values that a
 * spreadsheet would run as a formula are neutralised, so exported
 * user-supplied text (an email address, a referrer) is safe to open.
 */
export function downloadCsv(filename: string, rows: CsvCell[][]) {
  // The BOM makes Excel read the file as UTF-8.
  const blob = new Blob(['\uFEFF', adminCsv(rows)], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
