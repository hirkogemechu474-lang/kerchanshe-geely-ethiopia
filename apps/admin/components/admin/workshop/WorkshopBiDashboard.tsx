'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Gauge,
  ClipboardCheck,
  Timer,
  ShieldCheck,
  Star,
  Loader2,
  Calendar,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ListChecks,
  LucideIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card } from '@/components/admin/ui';
import ReportExportBar from '@/components/admin/reports/ReportExportBar';
import { DashboardReport, statsSection, tableSection } from '@/lib/reportExport';
import { CHART_CATEGORICAL, CHART_STATUS, CHART_CHROME } from '@/lib/chartPalette';
import { useTheme } from '@/components/admin/ThemeProvider';

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

function previousMonthValue() {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function normalizeBiData(raw: any): BiData {
  const kpis = raw?.kpis ?? {};
  const revenue = raw?.revenue ?? {};
  const csi = raw?.csi;

  return {
    period: raw?.period ?? {
      from: '',
      to: '',
      label: 'Selected month',
      monthValue: currentMonthValue(),
    },
    kpis: {
      jobsClosedCount: kpis.jobsClosedCount ?? 0,
      firstTimeFixRate: kpis.firstTimeFixRate ?? null,
      avgTurnaroundHours: kpis.avgTurnaroundHours ?? null,
      avgWarrantyTurnaroundDays: kpis.avgWarrantyTurnaroundDays ?? null,
      claimsResolved: kpis.claimsResolved ?? 0,
      claimsApproved: kpis.claimsApproved ?? 0,
      claimsRejected: kpis.claimsRejected ?? 0,
    },
    revenue: {
      standard: revenue.standard ?? 0,
      warrantyGoodwill: revenue.warrantyGoodwill ?? 0,
      total: revenue.total ?? 0,
    },
    csi: csi && typeof csi === 'object'
      ? csi
      : { available: false, reason: 'Customer satisfaction data is not available.' },
    generatedAt: raw?.generatedAt ?? new Date().toISOString(),
  };
}

function buildReport(data: BiData, trend: TrendPoint[] | null): DashboardReport {
  const csiValue = data.csi.available
    ? `${data.csi.averageRating.toFixed(2)} / 5 (${data.csi.responseCount} response${data.csi.responseCount === 1 ? '' : 's'})`
    : 'No data';
  return {
    title: 'Workshop BI',
    subtitle: `Monthly workshop performance — ${data.period.label}`,
    sections: [
      statsSection('Key Performance Indicators', [
        { label: 'Jobs Closed', value: data.kpis.jobsClosedCount },
        { label: 'First-Time-Fix Rate', value: data.kpis.firstTimeFixRate === null ? '—' : `${data.kpis.firstTimeFixRate}%` },
        { label: 'Avg. Turnaround', value: data.kpis.avgTurnaroundHours === null ? '—' : `${data.kpis.avgTurnaroundHours}h` },
        { label: 'Avg. Warranty Turnaround', value: data.kpis.avgWarrantyTurnaroundDays === null ? '—' : `${data.kpis.avgWarrantyTurnaroundDays}d` },
      ]),
      statsSection('Revenue Mix', [
        { label: 'Standard / Chargeable', value: data.revenue.standard.toLocaleString() },
        { label: 'Warranty / Goodwill', value: data.revenue.warrantyGoodwill.toLocaleString() },
        { label: 'Total', value: data.revenue.total.toLocaleString() },
      ]),
      statsSection('Warranty Claims Resolved', [
        { label: 'Approved', value: data.kpis.claimsApproved },
        { label: 'Rejected', value: data.kpis.claimsRejected },
        { label: 'Total Resolved', value: data.kpis.claimsResolved },
      ]),
      statsSection('Customer Satisfaction (CSI)', [{ label: 'Average Rating', value: csiValue }]),
      tableSection(
        'First-Time-Fix Rate — 6 Month Trend',
        ['Month', 'Jobs Closed', 'First-Time-Fix', 'Avg. Turnaround', 'Revenue'],
        (trend ?? []).map((p) => [
          p.label,
          p.jobsClosedCount,
          p.firstTimeFixRate === null ? '—' : `${p.firstTimeFixRate}%`,
          p.avgTurnaroundHours === null ? '—' : `${p.avgTurnaroundHours}h`,
          p.revenueTotal.toLocaleString(),
        ])
      ),
    ],
  };
}

// ---- Small presentational helpers (local to this dashboard; mirrors the
// stat-tile convention established by analytics/AnalyticsCharts.tsx's
// OverviewTile — icon chip + value + label — without importing across the
// analytics/CRM component trees that are being redesigned concurrently). ----

function withAlpha(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function compactNumber(v: number) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${Math.round(v / 1000)}K`;
  return `${v}`;
}

const TILE_ACCENTS = {
  blue: 'bg-blue-50 text-geely-blue dark:bg-blue-500/10 dark:text-blue-400',
  green: 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400',
  purple: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400',
  orange: 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-gray-700/60 dark:text-gray-300',
} as const;

type TileAccent = keyof typeof TILE_ACCENTS;

function Tile({
  label,
  value,
  icon: Icon,
  accent = 'blue',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  accent?: TileAccent;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${TILE_ACCENTS[accent]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

/** Same tile shape, but the icon chip carries an explicit status color
 * (CHART_STATUS) instead of a decorative accent — reserved for genuine
 * pass/fail state (approved vs. rejected claims), never a generic category. */
function StatusTile({
  label,
  value,
  icon: Icon,
  colorHex,
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  colorHex: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3"
        style={{ color: colorHex, backgroundColor: withAlpha(colorHex, 0.12) }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

function FtfTooltip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-md text-sm">
      <p className="text-gray-500 dark:text-gray-400 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-gray-100">
        {v === null || v === undefined ? 'No closed job cards' : `${v}% first-time-fix`}
      </p>
    </div>
  );
}

function RevenueTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-md text-sm space-y-1">
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: p.color }} />
          <span className="text-gray-500 dark:text-gray-400">{p.name}</span>
          <span className="ml-auto font-semibold text-gray-900 dark:text-gray-100 tabular-nums">
            {Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function WorkshopBiDashboard({ canExport }: { canExport: boolean }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // Recharts marks are plain SVG and can't read Tailwind's `dark:` classes,
  // so chrome colors are resolved explicitly here: CHART_CHROME's exact
  // tokens in light mode (as specified), a parallel muted set in dark mode
  // that matches this file's existing gray-700/gray-600/gray-400 convention.
  const chrome = useMemo(
    () => ({
      grid: isDark ? '#374151' : CHART_CHROME.gridline,
      axis: isDark ? '#4b5563' : CHART_CHROME.axis,
      text: isDark ? '#9ca3af' : CHART_CHROME.mutedText,
      surface: isDark ? '#1f2937' : '#ffffff',
      cursor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
    }),
    [isDark]
  );

  const [month, setMonth] = useState(currentMonthValue());
  const [data, setData] = useState<BiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [trend, setTrend] = useState<TrendPoint[] | null>(null);
  const [trendLoading, setTrendLoading] = useState(true);

  const load = useCallback(async (m: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/workshop/bi-dashboard?month=${m}`);
      if (res.ok) {
        setData(normalizeBiData(await res.json()));
      } else {
        setData(normalizeBiData(null));
      }
    } catch {
      setData(normalizeBiData(null));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(month);
  }, [month, load]);

  useEffect(() => {
    (async () => {
      setTrendLoading(true);
      const res = await fetch('/api/admin/workshop/bi-dashboard/trend?months=6');
      if (res.ok) setTrend((await res.json()).trend ?? []);
      else setTrend([]);
      setTrendLoading(false);
    })();
  }, []);

  const report = useMemo(() => (data ? buildReport(data, trend) : null), [data, trend]);

  const csiAverage = data?.csi.available ? data.csi.averageRating : null;
  let csiText = '';
  if (data) {
    const csi = data.csi;
    if ('reason' in csi) {
      csiText = `No data — ${csi.reason}`;
    } else {
      csiText = `${csi.averageRating.toFixed(2)} / 5 average from ${csi.responseCount} response${csi.responseCount === 1 ? '' : 's'} this month`;
    }
  }

  const revenueChartData = data
    ? [{ name: 'mix', standard: data.revenue.standard, warrantyGoodwill: data.revenue.warrantyGoodwill }]
    : [];

  return (
    <div className="space-y-6">
      {/* Hero / filter bar */}
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-geely-blue via-blue-500 to-indigo-500" />
        <div className="p-5 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="hidden sm:flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 text-geely-blue dark:bg-blue-500/10 dark:text-blue-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-geely-blue dark:text-blue-400">
                Workshop performance
              </p>
              <h2 className="mt-0.5 text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                {data?.period.label ?? 'Selected month'}
                {loading && data && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                First-time-fix rate, turnaround, warranty outcomes, revenue mix and CSI
                {data ? ` — updated ${new Date(data.generatedAt).toLocaleString()}` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 p-1 bg-gray-50 dark:bg-gray-900/40 text-sm">
              <button
                type="button"
                onClick={() => setMonth(currentMonthValue())}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  month === currentMonthValue()
                    ? 'bg-white dark:bg-gray-700 text-geely-blue dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                This month
              </button>
              <button
                type="button"
                onClick={() => setMonth(previousMonthValue())}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  month === previousMonthValue()
                    ? 'bg-white dark:bg-gray-700 text-geely-blue dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Last month
              </button>
            </div>
            <label
              htmlFor="bi-month"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm"
            >
              <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <input
                id="bi-month"
                type="month"
                value={month}
                max={currentMonthValue()}
                onChange={(e) => setMonth(e.target.value)}
                className="bg-transparent text-gray-900 dark:text-gray-100 outline-none"
              />
            </label>
          </div>
        </div>
      </div>

      {canExport && report && (
        <Card>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Download this dashboard</p>
          <ReportExportBar report={report} canExport={canExport} />
        </Card>
      )}

      {!data ? (
        <div className="text-gray-400 text-sm">Loading…</div>
      ) : (
        <div className={loading ? 'space-y-6 opacity-60 transition-opacity pointer-events-none' : 'space-y-6 transition-opacity'}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tile label="Jobs Closed" value={data.kpis.jobsClosedCount} icon={ClipboardCheck} accent="blue" />
            <Tile
              label="First-Time-Fix"
              value={data.kpis.firstTimeFixRate === null ? '—' : `${data.kpis.firstTimeFixRate}%`}
              icon={Gauge}
              accent="green"
            />
            <Tile
              label="Avg. Turnaround"
              value={data.kpis.avgTurnaroundHours === null ? '—' : `${data.kpis.avgTurnaroundHours}h`}
              icon={Timer}
              accent="purple"
            />
            <Tile
              label="Warranty Turnaround"
              value={data.kpis.avgWarrantyTurnaroundDays === null ? '—' : `${data.kpis.avgWarrantyTurnaroundDays}d`}
              icon={ShieldCheck}
              accent="orange"
            />
          </div>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">First-Time-Fix Rate</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">6-month trend</p>
              </div>
              {trendLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>
            {!trendLoading && (!trend || trend.every((p) => p.firstTimeFixRate === null)) ? (
              <p className="text-sm text-gray-400">Not enough closed job cards yet to chart a trend.</p>
            ) : trend ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={trend} margin={{ top: 8, right: 16, left: -8, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke={chrome.grid} />
                  <XAxis
                    dataKey="label"
                    tickFormatter={(l: string) => l.split(' ')[0].slice(0, 3)}
                    tick={{ fill: chrome.text, fontSize: 12 }}
                    axisLine={{ stroke: chrome.axis }}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={(v: number) => `${v}%`}
                    tick={{ fill: chrome.text, fontSize: 12 }}
                    axisLine={{ stroke: chrome.axis }}
                    tickLine={false}
                    width={44}
                  />
                  <Tooltip content={<FtfTooltip />} cursor={{ stroke: chrome.axis, strokeWidth: 1 }} />
                  <Line
                    type="monotone"
                    dataKey="firstTimeFixRate"
                    stroke={CHART_CATEGORICAL[0]}
                    strokeWidth={2}
                    dot={{ r: 4, fill: CHART_CATEGORICAL[0], stroke: chrome.surface, strokeWidth: 2 }}
                    activeDot={{ r: 6, fill: CHART_CATEGORICAL[0], stroke: chrome.surface, strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : null}
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Revenue Mix</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">{data.period.label}</p>
            {data.revenue.total <= 0 ? (
              <p className="text-sm text-gray-400 py-6">No revenue recorded for {data.period.label} yet.</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={110}>
                  <BarChart
                    layout="vertical"
                    data={revenueChartData}
                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid horizontal={false} stroke={chrome.grid} />
                    <XAxis
                      type="number"
                      domain={[0, Math.max(data.revenue.total, 1)]}
                      tick={{ fill: chrome.text, fontSize: 11 }}
                      axisLine={{ stroke: chrome.axis }}
                      tickLine={false}
                      tickFormatter={compactNumber}
                    />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip content={<RevenueTooltip />} cursor={{ fill: chrome.cursor }} />
                    <Bar
                      dataKey="standard"
                      stackId="rev"
                      name="Standard / Chargeable"
                      fill={CHART_CATEGORICAL[0]}
                      stroke={chrome.surface}
                      strokeWidth={2}
                      barSize={22}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="warrantyGoodwill"
                      stackId="rev"
                      name="Warranty / Goodwill"
                      fill={CHART_CATEGORICAL[1]}
                      stroke={chrome.surface}
                      strokeWidth={2}
                      barSize={22}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>

                {/* Legend — always visible for 2+ categories; values shown directly
                    so nothing is gated behind hover. */}
                <div className="mt-2 space-y-2">
                  {[
                    { key: 'standard', label: 'Standard / Chargeable', value: data.revenue.standard, color: CHART_CATEGORICAL[0] },
                    { key: 'warrantyGoodwill', label: 'Warranty / Goodwill', value: data.revenue.warrantyGoodwill, color: CHART_CATEGORICAL[1] },
                  ].map((row) => {
                    const pct = data.revenue.total > 0 ? Math.round((row.value / data.revenue.total) * 100) : 0;
                    return (
                      <div key={row.key} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300">
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: row.color }} />
                          {row.label}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 tabular-nums">
                          {row.value.toLocaleString()} <span className="text-gray-400 dark:text-gray-500">({pct}%)</span>
                        </span>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <span>Total</span>
                    <span className="tabular-nums">{data.revenue.total.toLocaleString()}</span>
                  </div>
                </div>
              </>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Bucketed by the job card&apos;s warranty/goodwill flag — no separate service-type category exists yet.
            </p>
          </Card>

          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Warranty Claims Resolved</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <StatusTile label="Approved" value={data.kpis.claimsApproved} icon={CheckCircle2} colorHex={CHART_STATUS.good} />
              <StatusTile label="Rejected" value={data.kpis.claimsRejected} icon={XCircle} colorHex={CHART_STATUS.critical} />
              <Tile label="Total Resolved" value={data.kpis.claimsResolved} icon={ListChecks} accent="gray" />
            </div>
          </Card>

          <Card className={csiAverage === null ? 'border-dashed' : ''}>
            <div className="flex items-start gap-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-50 text-yellow-500 dark:bg-yellow-500/10 dark:text-yellow-400 shrink-0">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Customer Satisfaction (CSI)</h3>
                {csiAverage !== null ? (
                  <div className="mt-1.5 flex flex-wrap items-baseline gap-3">
                    <span className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                      {csiAverage.toFixed(2)}
                      <span className="text-base font-normal text-gray-400 dark:text-gray-500"> / 5</span>
                    </span>
                    <div className="flex" aria-hidden="true">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          className={`w-4 h-4 ${
                            n <= Math.round(csiAverage) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">{csiText}</p>
              </div>
            </div>
          </Card>

          <p className="text-xs text-gray-400">Generated {new Date(data.generatedAt).toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
