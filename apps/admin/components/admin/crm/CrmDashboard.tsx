'use client';

import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import {
  Users, FileText, ShoppingCart, TrendingUp, Gauge, RefreshCw, Loader2, BadgeDollarSign,
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, LabelList,
} from 'recharts';
import { Card, StatTile, Button, PageHeader } from '@/components/admin/ui';
import { UtilizationBar } from '@/components/admin/analytics/AnalyticsCharts';
import ReportExportBar from '@/components/admin/reports/ReportExportBar';
import { DashboardReport, statsSection, tableSection } from '@/lib/reportExport';
import { CHART_CATEGORICAL, CHART_SEQUENTIAL_BLUE, CHART_CHROME, CHART_STATUS } from '@/lib/chartPalette';

interface CrmDashboard {
  pipeline: {
    leads: { total: number; new: number; qualified: number; converting: number };
    quotations: { total: number; pending: number; approved: number; sent: number };
    orders: { total: number; quoted: number; booked: number; financing: number; ready: number; delivered: number; cancelled: number };
  };
  revenue: {
    last30Days: { total: number; count: number };
    last90Days: { total: number; count: number };
    allTime: { total: number; count: number };
  };
  conversionRates: { leadToQuotation: number; quotationToOrder: number; orderToDelivery: number };
  agentPerformance: { agentId: string | null; agentName: string; ordersCount: number; totalRevenue: number; totalCommission: number }[];
  financing: { pending: number; approved: number; declined: number };
  tradeIns: { pending: number; approved: number };
  slaCompliance: number;
}

interface AgentPerf {
  agentId: string;
  agentName: string;
  totalOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalRevenue: number;
  totalCommission: number;
  earnedCommission: number;
  conversionRate: number;
}

interface LeadSource { source: string; count: number; percentage: number }
interface RevenuePoint { month: string; label: string; revenue: number; orders: number }

function fmt(value: number) {
  return `ETB ${Math.round(value).toLocaleString('en-US')}`;
}

// Fixed color assignment for the known FR-101 lead sources (see
// backend/prisma/schema.prisma: 'website' | 'walk-in' | 'referral' | 'phone' |
// 'other') — color follows the source's identity, in this fixed order, never
// the order the API happens to return them in or which are visible.
const LEAD_SOURCE_ORDER = ['website', 'referral', 'walkin', 'phone', 'other'];

function leadSourceKey(source: string) {
  return source.toLowerCase().replace(/[-_\s]/g, '');
}

function leadSourceColor(source: string) {
  const key = leadSourceKey(source);
  const idx = LEAD_SOURCE_ORDER.indexOf(key);
  if (idx !== -1) return CHART_CATEGORICAL[idx];
  // Deterministic fallback for a source outside the known set, so an
  // unexpected value still gets a stable color instead of a cycled/random one.
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  const remaining = CHART_CATEGORICAL.length - LEAD_SOURCE_ORDER.length;
  return CHART_CATEGORICAL[LEAD_SOURCE_ORDER.length + (hash % remaining)];
}

function formatSourceLabel(source: string) {
  return source.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// Ordered stages, light -> dark on the single-hue sequential ramp (magnitude
// across ordered stages, not independent categories — see CHART_SEQUENTIAL_BLUE
// usage rule in lib/chartPalette.ts).
const FUNNEL_COLOR_STEPS = [2, 5, 8, 11];

function ChartTooltipBox({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-0.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-xs shadow-md">
      {children}
    </div>
  );
}

function RevenueTrendTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as RevenuePoint;
  return (
    <ChartTooltipBox>
      <p className="font-semibold text-gray-900 dark:text-gray-100">{p.label}</p>
      <p className="text-gray-700 dark:text-gray-300">{fmt(p.revenue)}</p>
      <p className="text-gray-400">{p.orders} order{p.orders === 1 ? '' : 's'}</p>
    </ChartTooltipBox>
  );
}

function LeadSourceTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as LeadSource;
  return (
    <ChartTooltipBox>
      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatSourceLabel(p.source)}</p>
      <p className="text-gray-700 dark:text-gray-300">{p.count} lead{p.count === 1 ? '' : 's'} &middot; {p.percentage}%</p>
    </ChartTooltipBox>
  );
}

function FunnelTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as { stage: string; count: number; rate: number | null };
  return (
    <ChartTooltipBox>
      <p className="font-semibold text-gray-900 dark:text-gray-100">{p.stage}</p>
      <p className="text-gray-700 dark:text-gray-300">{p.count.toLocaleString()}</p>
      {p.rate != null && <p className="text-gray-400">{p.rate}% of prior stage</p>}
    </ChartTooltipBox>
  );
}

function buildReport(data: CrmDashboard, agents: AgentPerf[], sources: LeadSource[], trend: RevenuePoint[]): DashboardReport {
  return {
    title: 'CRM Dashboard',
    subtitle: 'Sales funnel, conversion, revenue, and agent performance across the CRM lifecycle',
    sections: [
      statsSection('Sales Pipeline', [
        { label: 'Total Leads', value: data.pipeline.leads.total },
        { label: 'Quotations', value: data.pipeline.quotations.total },
        { label: 'Orders', value: data.pipeline.orders.total },
        { label: 'Delivered', value: data.pipeline.orders.delivered },
        { label: 'Cancelled', value: data.pipeline.orders.cancelled },
        { label: 'SLA Compliance', value: `${data.slaCompliance}%` },
      ]),
      statsSection('Conversion Rates', [
        { label: 'Lead → Quotation', value: `${data.conversionRates.leadToQuotation}%` },
        { label: 'Quotation → Order', value: `${data.conversionRates.quotationToOrder}%` },
        { label: 'Order → Delivery', value: `${data.conversionRates.orderToDelivery}%` },
        { label: 'Financing', value: `${data.financing.approved} approved / ${data.financing.pending} pending / ${data.financing.declined} declined` },
        { label: 'Trade-ins', value: `${data.tradeIns.approved} approved / ${data.tradeIns.pending} pending` },
      ]),
      statsSection('Revenue', [
        { label: 'Last 30 days', value: `${fmt(data.revenue.last30Days.total)} (${data.revenue.last30Days.count} orders)` },
        { label: 'Last 90 days', value: `${fmt(data.revenue.last90Days.total)} (${data.revenue.last90Days.count} orders)` },
        { label: 'All-time (delivered)', value: `${fmt(data.revenue.allTime.total)} (${data.revenue.allTime.count} orders)` },
      ]),
      tableSection(
        'Lead Sources',
        ['Source', 'Count', 'Percentage'],
        sources.map((s) => [s.source.replace(/_/g, ' '), s.count, `${s.percentage}%`])
      ),
      tableSection(
        'Monthly Revenue Trend',
        ['Month', 'Revenue', 'Orders'],
        trend.map((p) => [p.label, fmt(p.revenue), p.orders])
      ),
      tableSection(
        'Agent Performance',
        ['Agent', 'Orders', 'Delivered', 'Conversion', 'Revenue', 'Commission'],
        agents.map((a) => [a.agentName, a.totalOrders, a.deliveredOrders, `${a.conversionRate}%`, fmt(a.totalRevenue), fmt(a.earnedCommission)])
      ),
    ],
  };
}

export default function CrmDashboard({ canExport }: { canExport: boolean }) {
  const [data, setData] = useState<CrmDashboard | null>(null);
  const [agents, setAgents] = useState<AgentPerf[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [trend, setTrend] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [crmRes, agentRes, sourceRes, trendRes] = await Promise.all([
        fetch('/api/dashboard/crm'),
        fetch('/api/dashboard/agent-performance'),
        fetch('/api/dashboard/lead-sources'),
        fetch('/api/dashboard/revenue-trend'),
      ]);
      if (crmRes.ok) setData(await crmRes.json());
      if (agentRes.ok) setAgents(await agentRes.json());
      if (sourceRes.ok) setSources((await sourceRes.json()).sources);
      if (trendRes.ok) setTrend(await trendRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const report = useMemo(() => (data ? buildReport(data, agents, sources, trend) : null), [data, agents, sources, trend]);

  const trendChartData = useMemo(
    () => trend.map((p) => ({ ...p, shortLabel: p.label.split(' ')[0].slice(0, 3) })),
    [trend]
  );

  const sourceChartData = useMemo(
    () => [...sources].sort((a, b) => b.count - a.count).map((s) => ({ ...s, valueLabel: `${s.count} (${s.percentage}%)` })),
    [sources]
  );

  const funnelData = useMemo(() => {
    if (!data) return [];
    return [
      { stage: 'Leads', count: data.pipeline.leads.total, rate: null as number | null },
      { stage: 'Quotations', count: data.pipeline.quotations.total, rate: data.conversionRates.leadToQuotation },
      { stage: 'Orders', count: data.pipeline.orders.total, rate: data.conversionRates.quotationToOrder },
      { stage: 'Delivered', count: data.pipeline.orders.delivered, rate: data.conversionRates.orderToDelivery },
    ];
  }, [data]);

  const maxAgentOrders = Math.max(1, ...agents.map((a) => a.totalOrders));

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="CRM Dashboard"
        description="End-to-end sales lifecycle: leads, quotations, orders, delivery, revenue, and agent performance"
        actions={
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        }
      />

      <Card className="overflow-hidden border-0 bg-gradient-to-r from-navy via-[#143b82] to-geely-blue text-white shadow-xl">
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Sales &amp; CRM</p>
            <h2 className="mt-1 text-2xl font-bold">CRM Performance Center</h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Track leads, quotations, orders, delivery, revenue, and agent performance across the full sales lifecycle.
            </p>
          </div>
        </div>
        {canExport && report && (
          <div className="border-t border-white/15 px-6 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-100">Download this dashboard</p>
            <ReportExportBar report={report} canExport={canExport} />
          </div>
        )}
      </Card>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-geely-blue animate-spin" />
        </div>
      ) : data ? (
        <>
          {/* Pipeline */}
          <div>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Sales Pipeline</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
              <StatTile label="Total Leads" value={data.pipeline.leads.total} icon={Users} />
              <StatTile label="Quotations" value={data.pipeline.quotations.total} icon={FileText}
                tone={data.pipeline.quotations.pending > 0 ? 'highlight' : 'default'} />
              <StatTile label="Orders" value={data.pipeline.orders.total} icon={ShoppingCart} />
              <StatTile label="Delivered" value={data.pipeline.orders.delivered} icon={TrendingUp} />
              <StatTile label="Cancelled" value={data.pipeline.orders.cancelled} icon={ShoppingCart}
                tone={data.pipeline.orders.cancelled > 0 ? 'highlight' : 'default'} />
              <StatTile label="SLA Compliance" value={`${data.slaCompliance}%`} icon={Gauge} />
            </div>
          </div>

          {/* Funnel + Revenue + Lead Sources */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Sales Funnel</h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={funnelData} layout="vertical" margin={{ top: 4, right: 44, bottom: 4, left: 4 }} barCategoryGap="26%">
                  <CartesianGrid horizontal={false} stroke={CHART_CHROME.gridline} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tick={{ fill: CHART_CHROME.mutedText, fontSize: 12 }}
                    axisLine={{ stroke: CHART_CHROME.axis }}
                    tickLine={false}
                    width={78}
                  />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<FunnelTooltip />} />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
                    {funnelData.map((stage, i) => (
                      <Cell key={stage.stage} fill={CHART_SEQUENTIAL_BLUE[FUNNEL_COLOR_STEPS[i]]} />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="right"
                      formatter={(v: number) => v.toLocaleString()}
                      style={{ fill: CHART_CHROME.mutedText, fontSize: 11, fontWeight: 600 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                <span>Lead → Quotation: <strong className="text-gray-700 dark:text-gray-300">{data.conversionRates.leadToQuotation}%</strong></span>
                <span>Quotation → Order: <strong className="text-gray-700 dark:text-gray-300">{data.conversionRates.quotationToOrder}%</strong></span>
                <span>Order → Delivery: <strong className="text-gray-700 dark:text-gray-300">{data.conversionRates.orderToDelivery}%</strong></span>
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Revenue</h3>
              <div className="space-y-3">
                {[
                  { label: 'Last 30 days', value: data.revenue.last30Days.total, count: data.revenue.last30Days.count },
                  { label: 'Last 90 days', value: data.revenue.last90Days.total, count: data.revenue.last90Days.count },
                  { label: 'All-time (delivered)', value: data.revenue.allTime.total, count: data.revenue.allTime.count },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">{r.label}</span>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900 dark:text-gray-100">{fmt(r.value)}</div>
                      <div className="text-xs text-gray-400">{r.count} order{r.count === 1 ? '' : 's'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Lead Sources</h3>
              {sourceChartData.length === 0 ? (
                <p className="text-sm text-gray-400">No data yet.</p>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(140, sourceChartData.length * 40)}>
                  <BarChart data={sourceChartData} layout="vertical" margin={{ top: 4, right: 56, bottom: 4, left: 4 }} barCategoryGap="30%">
                    <CartesianGrid horizontal={false} stroke={CHART_CHROME.gridline} />
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="source"
                      tickFormatter={formatSourceLabel}
                      tick={{ fill: CHART_CHROME.mutedText, fontSize: 12 }}
                      axisLine={{ stroke: CHART_CHROME.axis }}
                      tickLine={false}
                      width={78}
                    />
                    <Tooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} content={<LeadSourceTooltip />} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
                      {sourceChartData.map((s) => (
                        <Cell key={s.source} fill={leadSourceColor(s.source)} />
                      ))}
                      <LabelList
                        dataKey="valueLabel"
                        position="right"
                        style={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Financing & trade-in pipelines — each a proportion of one whole
              (all applications this dashboard knows about), so per the
              dataviz method these are single stacked bars with a
              direct-labeled legend rather than per-category bars. Approved/
              pending/declined map onto the shared status colors since that's
              a real outcome state, matching how the same colors read
              everywhere else in the app. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <UtilizationBar
              title="Financing Pipeline"
              icon={BadgeDollarSign}
              segments={[
                { label: 'Approved', value: data.financing.approved, color: CHART_STATUS.good },
                { label: 'Pending', value: data.financing.pending, color: CHART_STATUS.warning },
                { label: 'Declined', value: data.financing.declined, color: CHART_STATUS.critical },
              ]}
            />
            <UtilizationBar
              title="Trade-in Pipeline"
              icon={ShoppingCart}
              segments={[
                { label: 'Approved', value: data.tradeIns.approved, color: CHART_STATUS.good },
                { label: 'Pending', value: data.tradeIns.pending, color: CHART_STATUS.warning },
              ]}
            />
          </div>

          {/* Revenue trend */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Revenue Trend — 12 Months</h3>
            {trendChartData.length === 0 ? (
              <p className="text-sm text-gray-400">No delivered orders yet to chart.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendChartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid vertical={false} stroke={CHART_CHROME.gridline} />
                  <XAxis
                    dataKey="shortLabel"
                    tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
                    axisLine={{ stroke: CHART_CHROME.axis }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) => `${Math.round(v / 1000).toLocaleString()}k`}
                    tick={{ fill: CHART_CHROME.mutedText, fontSize: 11 }}
                    axisLine={{ stroke: CHART_CHROME.axis }}
                    tickLine={false}
                    width={52}
                  />
                  <Tooltip cursor={{ stroke: CHART_CHROME.axis }} content={<RevenueTrendTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={CHART_CATEGORICAL[0]}
                    strokeWidth={2}
                    fill={CHART_CATEGORICAL[0]}
                    fillOpacity={0.1}
                    dot={{ r: 4, fill: CHART_CATEGORICAL[0], strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Agent performance */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Agent Performance</h3>
            {(agents.length === 0) ? (
              <p className="text-sm text-gray-400">No agent data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase text-xs">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold">Agent</th>
                      <th className="text-left px-4 py-3 font-semibold">Orders</th>
                      <th className="text-left px-4 py-3 font-semibold">Delivered</th>
                      <th className="text-left px-4 py-3 font-semibold">Conversion</th>
                      <th className="text-left px-4 py-3 font-semibold">Revenue</th>
                      <th className="text-left px-4 py-3 font-semibold">Commission</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {agents.map((a) => (
                      <tr key={a.agentId} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{a.agentName}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums w-5 text-right">{a.totalOrders}</span>
                            <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                              <div
                                className="h-1.5 rounded-full"
                                style={{ width: `${(a.totalOrders / maxAgentOrders) * 100}%`, backgroundColor: CHART_CATEGORICAL[0] }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.deliveredOrders}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.conversionRate}%</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{fmt(a.totalRevenue)}</td>
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          <BadgeDollarSign className="w-3.5 h-3.5" /> {fmt(a.earnedCommission)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      ) : (
        <p className="text-sm text-gray-500">Failed to load CRM dashboard.</p>
      )}
    </div>
  );
}
