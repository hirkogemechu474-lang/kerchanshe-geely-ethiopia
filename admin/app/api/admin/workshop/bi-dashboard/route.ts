import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { getWorkshopBiSummary, resolveMonthPeriod, type WorkshopBiSummary } from '@/lib/services/workshop/biSummary';

// Management BI Dashboard (BRD Screen 8 / FR-702–704). JSON by default;
// ?format=csv streams a one-click export (FR-704), gated separately on
// canExportReports since a role can be allowed to view but not export.
export async function GET(request: Request) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canViewReports) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const period = resolveMonthPeriod(searchParams.get('month'));
  const summary = await getWorkshopBiSummary(period);

  if (searchParams.get('format') === 'csv') {
    if (!session!.user.permissions.canExportReports) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const csv = buildCsv(summary);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="workshop-bi-${period.monthValue}.csv"`,
      },
    });
  }

  return NextResponse.json(summary);
}

function buildCsv(summary: WorkshopBiSummary): string {
  const rows: string[][] = [
    ['Metric', 'Value'],
    ['Period', summary.period.label],
    ['Jobs Closed', String(summary.kpis.jobsClosedCount)],
    ['First-Time-Fix Rate (%)', summary.kpis.firstTimeFixRate === null ? 'N/A' : String(summary.kpis.firstTimeFixRate)],
    ['Avg Turnaround (hours)', summary.kpis.avgTurnaroundHours === null ? 'N/A' : String(summary.kpis.avgTurnaroundHours)],
    [
      'Avg Warranty Turnaround (days)',
      summary.kpis.avgWarrantyTurnaroundDays === null ? 'N/A' : String(summary.kpis.avgWarrantyTurnaroundDays),
    ],
    ['Warranty Claims Resolved', String(summary.kpis.claimsResolved)],
    ['Warranty Claims Approved', String(summary.kpis.claimsApproved)],
    ['Warranty Claims Rejected', String(summary.kpis.claimsRejected)],
    ['Revenue — Standard / Chargeable', summary.revenue.standard.toFixed(2)],
    ['Revenue — Warranty / Goodwill', summary.revenue.warrantyGoodwill.toFixed(2)],
    ['Revenue — Total', summary.revenue.total.toFixed(2)],
    [
      'CSI',
      summary.csi.available
        ? `${summary.csi.averageRating}/5 (${summary.csi.responseCount} response${summary.csi.responseCount === 1 ? '' : 's'})`
        : `No data — ${summary.csi.reason}`,
    ],
    ['Generated At', summary.generatedAt],
  ];

  return rows.map((row) => row.map(csvEscape).join(',')).join('\r\n');
}

function csvEscape(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
