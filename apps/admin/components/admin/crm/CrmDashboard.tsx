'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Users, FileText, ShoppingCart, Wallet, TrendingUp, Gauge, RefreshCw, Loader2, BadgeDollarSign,
} from 'lucide-react';
import { Card, StatTile, Button } from '@/components/admin/ui';

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

export default function CrmDashboard() {
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

  const maxRevenue = trend.length > 0 ? Math.max(...trend.map((p) => p.revenue)) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sales funnel, conversion, revenue, and agent performance across the CRM lifecycle.
        </p>
        <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

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

          {/* Conversion + Finances */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Conversion Rates</h3>
              <div className="space-y-3 text-sm">
                {[
                  { label: 'Lead → Quotation', value: data.conversionRates.leadToQuotation },
                  { label: 'Quotation → Order', value: data.conversionRates.quotationToOrder },
                  { label: 'Order → Delivery', value: data.conversionRates.orderToDelivery },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 dark:text-gray-300">{r.label}</span>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{r.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-geely-blue h-2 rounded-full" style={{ width: `${Math.min(r.value, 100)}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Financing: {data.financing.approved} approved / {data.financing.pending} pending / {data.financing.declined} declined
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Trade-ins: {data.tradeIns.approved} approved / {data.tradeIns.pending} pending
                  </p>
                </div>
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
              <div className="space-y-3">
                {(sources.length === 0 ? [{ source: 'No data yet', count: 0, percentage: 0 }] : sources).map((s) => (
                  <div key={s.source}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span className="capitalize text-gray-600 dark:text-gray-300">{s.source.replace(/_/g, ' ')}</span>
                      <span className="text-gray-500">{s.count} ({s.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${s.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Revenue trend */}
          <Card>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Revenue Trend — 12 Months</h3>
            {trend.length === 0 ? (
              <p className="text-sm text-gray-400">No delivered orders yet to chart.</p>
            ) : (
              <div className="flex items-end gap-2 h-40">
                {trend.map((p) => (
                  <div key={p.month} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[10px] text-gray-500 tabular-nums">{Math.round(p.revenue / 1000)}k</span>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-t flex items-end overflow-hidden">
                      <div className="w-full bg-geely-blue rounded-t" style={{ height: `${maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0}%` }} />
                    </div>
                    <span className="text-[10px] text-gray-500 whitespace-nowrap">{p.label.split(' ')[0].slice(0, 3)}</span>
                  </div>
                ))}
              </div>
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
                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{a.totalOrders}</td>
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
