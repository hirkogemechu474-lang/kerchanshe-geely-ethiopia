'use client';

import { useState } from 'react';
import { Download, FileJson, FileSpreadsheet, FileText, FileOutput, Loader2 } from 'lucide-react';
import {
  DashboardReport, downloadReportCsv, downloadReportJson, downloadReportExcel, downloadReportHtml, downloadReportPdf,
} from '@/lib/reportExport';

// The "Download this dashboard" export bar shared by every admin dashboard
// (Analytics, CRM, Workshop BI, Workshop Live). Hidden entirely for viewers
// without canExportReports — they can still see the dashboard, they just
// don't get a report out of it, matching the canViewReports/canExportReports
// split already enforced on the export API routes.
export default function ReportExportBar({ report, canExport }: { report: DashboardReport; canExport: boolean }) {
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState('');

  if (!canExport) return null;

  const handlePdf = async () => {
    setPdfError('');
    setPdfLoading(true);
    try {
      await downloadReportPdf(report);
    } catch {
      setPdfError('Could not generate the PDF. Try again.');
    } finally {
      setPdfLoading(false);
    }
  };

  const actions = [
    { label: 'CSV', icon: Download, onClick: () => downloadReportCsv(report) },
    { label: 'JSON', icon: FileJson, onClick: () => downloadReportJson(report) },
    { label: 'Excel', icon: FileSpreadsheet, onClick: () => downloadReportExcel(report) },
    { label: 'HTML', icon: FileText, onClick: () => downloadReportHtml(report) },
  ];

  return (
    <div>
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
        <button
          type="button"
          onClick={handlePdf}
          disabled={pdfLoading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-geely-blue hover:text-geely-blue disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
        >
          {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileOutput className="h-4 w-4" />}
          PDF
        </button>
      </div>
      {pdfError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{pdfError}</p>}
    </div>
  );
}
