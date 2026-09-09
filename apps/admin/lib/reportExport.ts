import apiClient from '@/lib/apiClient';

// Shared report data model + CSV/JSON/HTML/Excel/PDF export logic for the
// "Download this dashboard" button that appears on every admin dashboard
// (Analytics, CRM, Workshop BI, Workshop Live). CSV/JSON/HTML/Excel are built
// client-side straight from this structure; PDF is rendered server-side by
// POST /api/reports/dashboard-pdf (see backend/src/services/pdf/dashboardReport.pdf.ts)
// so it can reuse the same Kerchanshe Trading PLC letterhead as the sales
// documents. Keep the section shape in sync with that file's
// DashboardReportSection type.

export interface ReportStatsSection {
  kind: 'stats';
  title: string;
  items: Array<{ label: string; value: string }>;
}

export interface ReportTableSection {
  kind: 'table';
  title: string;
  columns: string[];
  rows: Array<Array<string | number>>;
  note?: string;
}

export type ReportSection = ReportStatsSection | ReportTableSection;

export interface DashboardReport {
  title: string;
  subtitle?: string;
  sections: ReportSection[];
}

export function statsSection(title: string, items: Array<{ label: string; value: string | number }>): ReportStatsSection {
  return { kind: 'stats', title, items: items.map((i) => ({ label: i.label, value: String(i.value) })) };
}

export function tableSection(
  title: string,
  columns: string[],
  rows: Array<Array<string | number>>,
  note?: string
): ReportTableSection {
  return { kind: 'table', title, columns, rows, note };
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function triggerDownload(content: BlobPart, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function reportFilename(report: DashboardReport, ext: string) {
  return `${slugify(report.title)}-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

function csvEscape(value: unknown) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

export function downloadReportCsv(report: DashboardReport) {
  const lines: string[] = [];
  for (const section of report.sections) {
    lines.push(csvEscape(section.title));
    if (section.kind === 'stats') {
      lines.push(['Metric', 'Value'].map(csvEscape).join(','));
      for (const item of section.items) lines.push([item.label, item.value].map(csvEscape).join(','));
    } else {
      lines.push(section.columns.map(csvEscape).join(','));
      for (const row of section.rows) lines.push(row.map(csvEscape).join(','));
    }
    lines.push('');
  }
  triggerDownload(lines.join('\n'), reportFilename(report, 'csv'), 'text/csv;charset=utf-8');
}

export function downloadReportJson(report: DashboardReport) {
  const payload = { ...report, generatedAt: new Date().toISOString() };
  triggerDownload(JSON.stringify(payload, null, 2), reportFilename(report, 'json'), 'application/json');
}

function renderSectionTable(section: ReportSection): string {
  if (section.kind === 'stats') {
    const rows = section.items
      .map((item) => `<tr><td class="label">${item.label}</td><td class="value">${item.value}</td></tr>`)
      .join('');
    return rows || '<tr><td colspan="2" class="empty">No data.</td></tr>';
  }
  const head = `<tr>${section.columns.map((c) => `<th>${c}</th>`).join('')}</tr>`;
  const body = section.rows.length
    ? section.rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')
    : `<tr><td colspan="${section.columns.length}" class="empty">No data.</td></tr>`;
  const note = section.note ? `<p class="note">${section.note}</p>` : '';
  return `<thead>${head}</thead><tbody>${body}</tbody>` + note;
}

function renderReportHtml(report: DashboardReport) {
  const generatedAt = new Date().toLocaleString();
  const sectionsHtml = report.sections
    .map(
      (section) => `
      <section>
        <h2>${section.title}</h2>
        <table>${renderSectionTable(section)}</table>
      </section>`
    )
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${report.title}</title>
<style>
  body { font-family: Arial, Helvetica, sans-serif; color: #212529; padding: 32px; max-width: 960px; margin: 0 auto; }
  header { text-align: center; border-bottom: 2px solid #dee2e7; padding-bottom: 16px; margin-bottom: 24px; }
  header .company { font-size: 16px; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; }
  header .title { font-size: 13px; font-weight: 700; margin-top: 4px; }
  header .subtitle { font-size: 11px; color: #787c82; margin-top: 6px; }
  header .meta { font-size: 10px; color: #787c82; margin-top: 10px; }
  section { margin-bottom: 28px; page-break-inside: avoid; }
  h2 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #dee2e7; padding-bottom: 6px; margin-bottom: 10px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th { text-align: left; background: #f0f2f5; padding: 8px 10px; font-size: 10px; text-transform: uppercase; color: #212529; }
  td { padding: 7px 10px; border-top: 1px solid #dee2e7; }
  td.label { color: #787c82; width: 55%; }
  td.value, td.empty { font-weight: 600; }
  td.empty { color: #787c82; font-weight: 400; font-style: italic; }
  .note { font-size: 10px; color: #787c82; font-style: italic; margin-top: 6px; }
  footer { border-top: 1px solid #dee2e7; padding-top: 10px; margin-top: 24px; font-size: 9px; color: #787c82; text-align: center; }
</style>
</head>
<body>
  <header>
    <div class="company">Kerchanshe Trading PLC</div>
    <div class="title">${report.title}</div>
    ${report.subtitle ? `<div class="subtitle">${report.subtitle}</div>` : ''}
    <div class="meta">Generated ${generatedAt}</div>
  </header>
  ${sectionsHtml}
  <footer>Kerchanshe Trading PLC | GEELY Vehicles | Ethiopia</footer>
</body>
</html>`;
}

export function downloadReportHtml(report: DashboardReport) {
  triggerDownload(renderReportHtml(report), reportFilename(report, 'html'), 'text/html;charset=utf-8');
}

export function downloadReportExcel(report: DashboardReport) {
  // Excel opens an HTML table saved with an .xls extension + this MIME type
  // as a normal workbook — no xlsx library needed for a report this simple.
  triggerDownload(renderReportHtml(report), reportFilename(report, 'xls'), 'application/vnd.ms-excel');
}

export async function downloadReportPdf(report: DashboardReport): Promise<void> {
  const response = await apiClient.post(
    '/reports/dashboard-pdf',
    { title: report.title, subtitle: report.subtitle, sections: report.sections },
    { responseType: 'blob' }
  );
  triggerDownload(response.data, reportFilename(report, 'pdf'), 'application/pdf');
}
