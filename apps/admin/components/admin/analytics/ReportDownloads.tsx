'use client';

import { Download, FileJson, FileSpreadsheet, FileText, Printer } from 'lucide-react';

function flatten(value: unknown, prefix = ''): Array<{ field: string; value: string | number | boolean }> {
  if (value === null || value === undefined) return [{ field: prefix, value: '' }];
  if (typeof value !== 'object') return [{ field: prefix, value: String(value) }];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => flatten(item, prefix ? `${prefix}.${index + 1}` : String(index + 1)));
  }
  return Object.entries(value).flatMap(([key, item]) => flatten(item, prefix ? `${prefix}.${key}` : key));
}

function downloadBlob(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export default function ReportDownloads({ data }: { data: unknown }) {
  const rows = flatten(data);
  const stamp = new Date().toISOString().slice(0, 10);

  const downloadCsv = () => {
    const csv = ['Field,Value', ...rows.map((row) => `${csvEscape(row.field)},${csvEscape(row.value)}`)].join('\n');
    downloadBlob(csv, `analytics-report-${stamp}.csv`, 'text/csv;charset=utf-8');
  };

  const downloadJson = () => {
    downloadBlob(JSON.stringify(data, null, 2), `analytics-report-${stamp}.json`, 'application/json');
  };

  const downloadExcel = () => {
    const table = rows.map((row) => `<tr><td>${row.field}</td><td>${row.value}</td></tr>`).join('');
    const html = `<table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${table}</tbody></table>`;
    downloadBlob(`<!doctype html><html><body>${html}</body></html>`, `analytics-report-${stamp}.xls`, 'application/vnd.ms-excel');
  };

  const downloadHtml = () => {
    const table = rows.map((row) => `<tr><td>${row.field}</td><td>${row.value}</td></tr>`).join('');
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Analytics Report</title><style>body{font:14px Arial;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#194bff;color:#fff}</style></head><body><h1>Analytics Report</h1><p>Generated ${new Date().toLocaleString()}</p><table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${table}</tbody></table></body></html>`;
    downloadBlob(html, `analytics-report-${stamp}.html`, 'text/html;charset=utf-8');
  };

  const printPdf = () => {
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;
    const table = rows.map((row) => `<tr><td>${row.field}</td><td>${row.value}</td></tr>`).join('');
    printWindow.document.write(`<html><head><title>Analytics Report</title><style>body{font:14px Arial;padding:24px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ddd;padding:8px;text-align:left}th{background:#194bff;color:#fff}</style></head><body><h1>Analytics Report</h1><p>Generated ${new Date().toLocaleString()}</p><table><thead><tr><th>Field</th><th>Value</th></tr></thead><tbody>${table}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`);
    printWindow.document.close();
  };

  const actions = [
    { label: 'CSV', icon: Download, onClick: downloadCsv },
    { label: 'JSON', icon: FileJson, onClick: downloadJson },
    { label: 'Excel', icon: FileSpreadsheet, onClick: downloadExcel },
    { label: 'HTML', icon: FileText, onClick: downloadHtml },
    { label: 'PDF', icon: Printer, onClick: printPdf },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ label, icon: Icon, onClick }) => (
        <button
          key={label}
          type="button"
          onClick={onClick}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-geely-blue hover:text-geely-blue dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
