'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileText, ShoppingCart, CheckCircle2, Percent, Loader2, RefreshCw, Plus, UserPlus, Target as TargetIcon,
} from 'lucide-react';
import { Card, Button, LinkButton, PageHeader, Badge, Modal, ModalActions, type Tone } from '@/components/admin/ui';
import { OverviewTile, AchievementBar } from '@/components/admin/analytics/AnalyticsCharts';
import apiClient from '@/lib/apiClient';

interface SalesDashboardData {
  today: {
    quoted: { count: number; value: number };
    ordered: { count: number; value: number };
    paid: { count: number; value: number };
    quoteToPaidConversionPct: number;
  };
  targetVsPlan: {
    month: string;
    unitsTarget: number;
    unitsAchieved: number;
    revenueTarget: number;
    revenueAchieved: number;
    daysElapsed: number;
    daysInMonth: number;
  } | null;
  visitorsToday: {
    id: string;
    name: string;
    modelInterest: string | null;
    rep: string | null;
    status: string;
    source: 'qr' | 'walk-in';
    createdAt: string;
  }[];
}

interface MarketingActivity {
  id: string;
  activity: string;
  channel: string;
  leads: number;
  status: 'planned' | 'ongoing' | 'completed';
  createdAt: string;
}

function formatETB(value: number) {
  return `ETB ${Math.round(value).toLocaleString('en-US')}`;
}

const ACTIVITY_STATUS_TONE: Record<string, Tone> = { planned: 'gray', ongoing: 'orange', completed: 'green' };

function LogActivityModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [activity, setActivity] = useState('');
  const [channel, setChannel] = useState('Social Media');
  const [leads, setLeads] = useState('0');
  const [status, setStatus] = useState<'planned' | 'ongoing' | 'completed'>('planned');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!activity.trim()) { setError('Activity name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      await apiClient.post('/marketing-activities', { activity, channel, leads: Number(leads) || 0, status });
      onSaved();
      onClose();
    } catch {
      setError('Failed to save activity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Log Marketing Activity" onClose={onClose}>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Activity</label>
          <input
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="e.g. Facebook lead campaign"
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Channel</label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
          >
            {['Social Media', 'Outdoor', 'Event', 'SMS', 'Radio', 'Other'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Leads so far</label>
            <input
              type="number"
              min={0}
              value={leads}
              onChange={(e) => setLeads(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
            >
              <option value="planned">Planned</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>
      </div>
      <ModalActions>
        <Button variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
      </ModalActions>
    </Modal>
  );
}

export default function SalesDashboard() {
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [activities, setActivities] = useState<MarketingActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLogActivity, setShowLogActivity] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, actRes] = await Promise.all([
        apiClient.get<SalesDashboardData>('/analytics/sales-dashboard'),
        apiClient.get<{ items: MarketingActivity[] }>('/marketing-activities'),
      ]);
      setData(dashRes.data);
      setActivities(actRes.data.items);
    } catch (err) {
      if (!(err && typeof err === 'object' && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401)) {
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const today = new Date();
  const monthLabel = today.toLocaleDateString('en-US', { month: 'short' });
  const mtdRangeLabel = `MTD: ${monthLabel} 1–${today.getDate()}`;

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 text-geely-blue animate-spin" />
      </div>
    );
  }

  const tp = data?.targetVsPlan;
  const pctElapsed = tp ? Math.round((tp.daysElapsed / tp.daysInMonth) * 100) : 0;
  const pctRevenueAchieved = tp && tp.revenueTarget > 0 ? Math.round((tp.revenueAchieved / tp.revenueTarget) * 100) : 0;
  const paceDelta = tp ? pctRevenueAchieved - pctElapsed : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {showLogActivity && <LogActivityModal onClose={() => setShowLogActivity(false)} onSaved={load} />}

      <PageHeader
        title="Sales Dashboard"
        description="Month-to-date target tracking, marketing activity, showroom traffic, and order pipeline."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300">
              {mtdRangeLabel}
            </span>
            <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button size="sm" onClick={() => setShowLogActivity(true)}>
              <Plus className="w-4 h-4" /> Log Today&apos;s Activity
            </Button>
          </div>
        }
      />

      {/* Target vs Plan */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Target vs Plan — {today.toLocaleDateString('en-US', { month: 'long' })}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Progress against the monthly sales plan</p>
          </div>
          {tp && (
            <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/20 text-geely-blue dark:text-blue-400 px-3 py-1.5 text-xs font-semibold">
              {tp.daysElapsed} / {tp.daysInMonth} days elapsed ({pctElapsed}%)
            </span>
          )}
        </div>
        {!tp ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No sales target set for this month yet.</p>
            <LinkButton href="/admin/sales-targets" variant="secondary" size="sm">
              <TargetIcon className="w-4 h-4" /> Set a Target
            </LinkButton>
          </div>
        ) : (
          <div className="space-y-4">
            <AchievementBar label="Units — MTD" value={tp.unitsAchieved} target={tp.unitsTarget} />
            <AchievementBar label="Revenue — MTD" value={tp.revenueAchieved} target={tp.revenueTarget} valueFormatter={formatETB} />
            <div className="flex items-center justify-between text-sm pt-1 border-t border-gray-100 dark:border-gray-700">
              <span className="text-gray-500 dark:text-gray-400">Pace vs. elapsed time — {pctRevenueAchieved}% of target vs {pctElapsed}% of month elapsed</span>
              <strong className={paceDelta >= 0 ? 'text-green-600' : 'text-red-600'}>
                {paceDelta >= 0 ? '+' : ''}{paceDelta} pts {paceDelta >= 0 ? 'ahead' : 'behind'}
              </strong>
            </div>
          </div>
        )}
      </Card>

      {/* Today's KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <OverviewTile
          label="Quoted Today"
          value={data?.today.quoted.count ?? 0}
          hint={formatETB(data?.today.quoted.value ?? 0) + ' quoted value'}
          icon={FileText}
          accent="blue"
        />
        <OverviewTile
          label="Ordered Today"
          value={data?.today.ordered.count ?? 0}
          hint={formatETB(data?.today.ordered.value ?? 0) + ' order value'}
          icon={ShoppingCart}
          accent="orange"
        />
        <OverviewTile
          label="Paid Today"
          value={data?.today.paid.count ?? 0}
          hint={formatETB(data?.today.paid.value ?? 0) + ' collected'}
          icon={CheckCircle2}
          accent="green"
        />
        <OverviewTile
          label="Quote → Paid Conversion"
          value={`${data?.today.quoteToPaidConversionPct ?? 0}%`}
          hint={`${data?.today.paid.count ?? 0} of ${data?.today.quoted.count ?? 0} quotes today`}
          icon={Percent}
          accent="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Marketing Activities */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Daily Marketing Activities</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Today, {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowLogActivity(true)}>
              <Plus className="w-4 h-4" /> Log
            </Button>
          </div>
          {activities.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">No marketing activity logged today yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Activity</th>
                    <th className="text-left px-4 py-3 font-semibold">Channel</th>
                    <th className="text-left px-4 py-3 font-semibold">Leads</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {activities.map((a) => (
                    <tr key={a.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{a.activity}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{a.channel}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 tabular-nums">{a.leads}</td>
                      <td className="px-4 py-3">
                        <Badge tone={ACTIVITY_STATUS_TONE[a.status]}>{a.status.charAt(0).toUpperCase() + a.status.slice(1)}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Daily Visitors & Registrations */}
        <Card padding="none">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Daily Visitors &amp; Registrations</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Today, {today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} &middot; {data?.visitorsToday.length ?? 0} walk-ins
              </p>
            </div>
            <LinkButton href="/admin/walk-ins/new" variant="ghost" size="sm">
              <UserPlus className="w-4 h-4" /> Log Walk-in
            </LinkButton>
          </div>
          {!data || data.visitorsToday.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-500 dark:text-gray-400 text-center">No showroom visitors logged today yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/60 text-gray-500 dark:text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold">Visitor</th>
                    <th className="text-left px-4 py-3 font-semibold">Model Interest</th>
                    <th className="text-left px-4 py-3 font-semibold">Rep</th>
                    <th className="text-left px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {data.visitorsToday.map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-700/40">
                      <td className="px-4 py-3 text-gray-900 dark:text-gray-100 font-medium">{v.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.modelInterest || '—'}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.rep || 'Self-service'}</td>
                      <td className="px-4 py-3">
                        <Badge tone={v.source === 'walk-in' ? 'blue' : 'gray'}>{v.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
