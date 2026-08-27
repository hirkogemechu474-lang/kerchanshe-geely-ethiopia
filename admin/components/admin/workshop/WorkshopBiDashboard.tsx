'use client';

import { useEffect, useState, useCallback } from 'react';
import { Gauge, ClipboardCheck, Timer, ShieldCheck, Star, Download, Loader2 } from 'lucide-react';
import { Card, StatTile } from '@/components/admin/ui';

interface BiData {
  period: { from: string; to: string; label: string; monthValue: string };
  kpis: {
    jobsClosedCount: number;
    firstTimeFixRate: number | null;
    avgTurnaroundHours: number | null;
    avgWarrantyTurnaroundDays: number | null;
    claimsResolved: number;
    claimsApproved: number;
    claimsRejected: number;
  };
  revenue: { standard: number; warrantyGoodwill: number; total: number };
  csi: { available: true; averageRating: number; responseCount: number } | { available: false; reason: string };
  generatedAt: string;
}

interface TrendPoint {
  monthValue: string;
  label: string;
  jobsClosedCount: number;
  firstTimeFixRate: number | null;
  avgTurnaroundHours: number | null;
  revenueTotal: number;
  csiAverage: number | null;
}

function currentMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function WorkshopBiDashboard({ canExport }: { canExport: boolean }) {
  const [month, setMonth] = useState(currentMonthValue());
  const [data, setData] = useState<BiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [trendLoading, setTrendLoading] = useState(true);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/workshop/bi-dashboard?month=${m}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  useEffect(() => {
    (async () => {
      setTrendLoading(true);
      const res = await fetch('/api/admin/workshop/bi-dashboard/trend?months=6');
      if (res.ok) setTrend((await res.json()).trend);
      setTrendLoading(false);
    })();
  }, []);

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(`/api/admin/workshop/bi-dashboard?month=${month}&format=csv`);
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workshop-bi-${month}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const csiAverage = data?.csi.available ? data.csi.averageRating : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="bi-month">
          Month
        </label>
        <input
          id="bi-month"
          type="month"
          value={month}
          max={currentMonthValue()}
          onChange={(e) => setMonth(e.target.value)}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-900 dark:text-gray-100"
        />
        {canExport && (
          <button
            onClick={handleExport}
            disabled={exporting || !data}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export CSV
          </button>
        )}
      </div>

      {loading || !data ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatTile label="Jobs Closed" value={data.kpis.jobsClosedCount} icon={ClipboardCheck} />
            <StatTile
              label="First-Time-Fix"
              value={data.kpis.firstTimeFixRate === null ? '—' : `${data.kpis.firstTimeFixRate}%`}
              icon={Gauge}
            />
            <StatTile
              label="Avg. Turnaround"
              value={data.kpis.avgTurnaroundHours === null ? '—' : `${data.kpis.avgTurnaroundHours}h`}
              icon={Timer}
            />
            <StatTile
              label="Warranty Turnaround"
              value={data.kpis.avgWarrantyTurnaroundDays === null ? '—' : `${data.kpis.avgWarrantyTurnaroundDays}d`}
              icon={ShieldCheck}
            />
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">First-Time-Fix Rate — 6 Month Trend</h3>
              {trendLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
            {!trendLoading && (!trend || trend.every((p) => p.firstTimeFixRate === null)) ? (
              <p className="text-sm text-gray-400">Not enough closed job cards yet to chart a trend.</p>
            ) : trend ? (
              <div className="flex items-end gap-3 h-32">
                {trend.map((p) => {
                  const heightPct = p.firstTimeFixRate ?? 0;
                  const isCurrent = p.monthValue === month;
                  return (
                    <div key={p.monthValue} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                        {p.firstTimeFixRate === null ? '—' : `${p.firstTimeFixRate}%`}
                      </span>
                      <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t-md h-full flex items-end overflow-hidden">
                        <div
                          className={`w-full rounded-t-md transition-all ${isCurrent ? 'bg-blue-600' : 'bg-blue-300 dark:bg-blue-800'}`}
                          style={{ height: `${Math.max(heightPct, p.firstTimeFixRate === null ? 0 : 4)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {p.label.split(' ')[0].slice(0, 3)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue Mix — {data.period.label}</h3>
            <div className="space-y-4">
              {[
                { label: 'Standard / Chargeable', value: data.revenue.standard, color: 'bg-geely-blue' },
                { label: 'Warranty / Goodwill', value: data.revenue.warrantyGoodwill, color: 'bg-purple-600' },
              ].map((row) => {
                const pct = data.revenue.total > 0 ? Math.round((row.value / data.revenue.total) * 100) : 0;
                return (
                  <div key={row.label}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{row.label}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {row.value.toLocaleString()} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div className={`${row.color} h-2.5 rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm font-semibold text-gray-900 dark:text-gray-100">
                <span>Total</span>
                <span>{data.revenue.total.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Bucketed by the job card&apos;s warranty/goodwill flag — no separate service-type category exists yet.
            </p>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Warranty Claims Resolved</h3>
            <div className="flex flex-wrap gap-3 text-sm">
              <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 font-medium">
                Approved: {data.kpis.claimsApproved}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 font-medium">
                Rejected: {data.kpis.claimsRejected}
              </span>
              <span className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                Total Resolved: {data.kpis.claimsResolved}
              </span>
            </div>
          </Card>

          <Card className={csiAverage === null ? 'border-dashed' : ''}>
            <div className="flex items-center gap-3">
              {csiAverage !== null ? (
                <div className="flex" aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-5 h-5 ${
                        n <= Math.round(csiAverage) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <Star className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Customer Satisfaction (CSI)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {data.csi.available
                    ? `${data.csi.averageRating.toFixed(2)} / 5 average from ${data.csi.responseCount} response${data.csi.responseCount === 1 ? '' : 's'} this month`
                    : `No data — ${data.csi.reason}`}
                </p>
              </div>
            </div>
          </Card>

          <p className="text-xs text-gray-400">Generated {new Date(data.generatedAt).toLocaleString()}</p>
        </>
      )}
    </div>
  );
}
