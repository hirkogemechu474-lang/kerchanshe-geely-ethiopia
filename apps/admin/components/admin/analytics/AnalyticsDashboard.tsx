'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Calendar, Car, FileText, Star, Wrench, Loader2,
  AlertTriangle, Gauge, ClipboardList, ShieldCheck, PackageSearch, MessageSquare, Plus, BarChart3, QrCode, RefreshCw,
  Wallet, FileCheck2, PackageCheck, Banknote, Percent, ShoppingCart, Building2, LayoutGrid, Route, Boxes, Target, type LucideIcon,
} from 'lucide-react';
import { Card, StatTile, LinkButton, Button, PageHeader } from '@/components/admin/ui';
import {
  OverviewTile, RankedBarChart, StatusBarChart, UtilizationBar,
  KpiTile, SalesMixChart, ShowroomRankingTable, RiskFlagsList, FunnelChart,
  AchievementBar, QuarterlyPlanChart, MtdTrendChart,
  type RiskFlag,
} from '@/components/admin/analytics/AnalyticsCharts';
import ReportExportBar from '@/components/admin/reports/ReportExportBar';
import { DashboardReport, statsSection, tableSection } from '@/lib/reportExport';
import { WARRANTY_CLAIM_STATUS_LABELS } from '@/lib/services/workshop/warrantyClaimStateMachine';
import apiClient from '@/lib/apiClient';
import { CHART_CATEGORICAL, CHART_CHROME, CHART_STATUS } from '@/lib/chartPalette';

// Warranty claim status is an actual state indicator (matches the app's status
// badges elsewhere), so per the dataviz method it maps onto the shared
// CHART_STATUS palette rather than inventing ad hoc hex/Tailwind colors.
// DRAFTED isn't a real state yet (no claim has been submitted), so it gets a
// neutral chrome gray instead of one of the four reserved status colors.
// REIMBURSED and APPROVED are both "good" outcomes; UNDER_REVIEW is treated as
// more urgent ("serious") than a freshly-queued SUBMITTED ("warning") since
// it's the stage immediately before an approve/reject decision.
const WARRANTY_STATUS_COLOR: Record<string, string> = {
  DRAFTED: CHART_CHROME.mutedText,
  SUBMITTED: CHART_STATUS.warning,
  UNDER_REVIEW: CHART_STATUS.serious,
  APPROVED: CHART_STATUS.good,
  REJECTED: CHART_STATUS.critical,
  REIMBURSED: CHART_STATUS.good,
};

interface LeadershipData {
  kpis: {
    revenueMTD: number;
    revenueMTDTargetPct: number | null;
    revenueYTD: number;
    unitsSoldMTD: number;
    unitsSoldMTDTargetPct: number | null;
    avgDealSizeMTD: number;
    conversionRate: number;
    avgRating: number;
  };
  monthlyTarget: { month: string; revenueTarget: number; unitsTarget: number } | null;
  dailyTrend: { day: number; label: string; cumulativeRevenue: number; pace: number | null }[];
  revenueByShowroom: { dealerId: string; name: string; revenue: number; units: number; target: number | null; achievementPct: number | null }[];
  salesMixByModel: { model: string; count: number; revenue: number }[];
  quarterlyRevenue: { quarter: string; label: string; actual: number; plan: number | null; isCurrent: boolean; isFuture: boolean; projectedActual: number | null }[];
  financialSnapshot: {
    receivablesOutstanding: number;
    receivablesAgedOver60d: number;
    inventoryValue: number;
    inventoryUnits: number;
    daysSalesOfInventory: number | null;
    cashCollectedMTD: number;
    cashCollectedMTDPctOfRevenue: number | null;
  };
  risks: RiskFlag[];
}

interface AnalyticsData {
  overview: {
    totalVehicles: number;
    totalTestDrives: number;
    totalQuotations: number;
    totalServiceBookings: number;
    totalReviews: number;
    avgRating: number;
  };
  recentActivity: {
    testDrives: number;
    quotations: number;
    reviews: number;
  };
  salesByCategory: { category: string; count: number }[];
  topVehicles: { name: string; testDrives: number }[];
  needsAttention: {
    pendingQuotations: number;
    pendingReviews: number;
    unreadMessages: number;
    overdueJobCards: number;
    partsBelowReorder: number;
  };
  workshop: {
    kpis: {
      baysBusy: number;
      baysTotal: number;
      jobsToday: number;
      avgTurnaroundMinutes: number | null;
      pendingApproval: number;
      overdueCount: number;
      partsBelowReorder: number;
    };
    bays: { id: string; name: string; status: string }[];
    warrantyClaimsByStatus: { status: string; count: number }[];
  } | null;
  salesPipeline: {
    payment: { unpaid: number; pendingReview: number; paid: number; totalCollected: number };
    agreement: { approved: number; sent: number; signed: number; countersigned: number };
    handover: { delivered: number; signed: number; countersigned: number };
    orderLinkedTestDrives: number;
  } | null;
  leadership: LeadershipData | null;
}

/** Shared section header — icon + title + optional right-aligned actions —
 * so every band of the dashboard reads as one consistent system instead of
 * a mix of hand-rolled flex rows. */
function SectionHeading({ icon: Icon, title, actions }: { icon: LucideIcon; title: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
        <Icon className="w-4 h-4 text-geely-blue" />
        {title}
      </h2>
      {actions}
    </div>
  );
}

function formatETB(value: number) {
  return `ETB ${Math.round(value).toLocaleString('en-US')}`;
}

/** Compact axis-tick form for large currency values (e.g. "1.2M", "480k"). */
function formatETBAxis(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${Math.round(value / 1000)}k`;
  return value.toLocaleString('en-US');
}

function formatMinutes(mins: number | null) {
  if (mins === null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function normalizeAnalyticsData(responseData: any): AnalyticsData {
  const overview = responseData?.overview || {};
  const recentActivity = responseData?.recentActivity || {};
  const needsAttention = responseData?.needsAttention || {};

  return {
    overview: {
      totalVehicles: overview.totalVehicles ?? 0,
      totalTestDrives: overview.totalTestDrives ?? 0,
      totalQuotations: overview.totalQuotations ?? responseData?.totalOrders ?? 0,
      totalServiceBookings: overview.totalServiceBookings ?? responseData?.totalJobCards ?? 0,
      totalReviews: overview.totalReviews ?? 0,
      avgRating: overview.avgRating ?? 0,
    },
    recentActivity: {
      testDrives: recentActivity.testDrives ?? 0,
      quotations: recentActivity.quotations ?? 0,
      reviews: recentActivity.reviews ?? 0,
    },
    salesByCategory: Array.isArray(responseData?.salesByCategory) ? responseData.salesByCategory : [],
    topVehicles: Array.isArray(responseData?.topVehicles) ? responseData.topVehicles : [],
    needsAttention: {
      pendingQuotations: needsAttention.pendingQuotations ?? 0,
      pendingReviews: needsAttention.pendingReviews ?? 0,
      unreadMessages: needsAttention.unreadMessages ?? 0,
      overdueJobCards: needsAttention.overdueJobCards ?? 0,
      partsBelowReorder: needsAttention.partsBelowReorder ?? 0,
    },
    workshop: responseData?.workshop ?? null,
    salesPipeline: responseData?.salesPipeline ?? null,
    leadership: responseData?.leadership ?? null,
  };
}

function buildReport(data: AnalyticsData): DashboardReport {
  const sections = [
    statsSection('Business Overview', [
      { label: 'Total Vehicles', value: data.overview.totalVehicles },
      { label: 'Test Drive Bookings', value: `${data.overview.totalTestDrives} (${data.recentActivity.testDrives} this month)` },
      { label: 'Quote Requests', value: `${data.overview.totalQuotations} (${data.recentActivity.quotations} pending)` },
      { label: 'Service Bookings', value: data.overview.totalServiceBookings },
      { label: 'Customer Reviews', value: `${data.overview.totalReviews} (★ ${data.overview.avgRating.toFixed(1)} average)` },
      { label: 'New Reviews This Month', value: data.recentActivity.reviews },
    ]),
    statsSection('Needs Attention', [
      { label: 'Overdue Job Cards', value: data.needsAttention.overdueJobCards },
      { label: 'Parts Below Reorder Level', value: data.needsAttention.partsBelowReorder },
      { label: 'New Quote Requests', value: data.needsAttention.pendingQuotations },
      { label: 'Unread Messages', value: data.needsAttention.unreadMessages },
      { label: 'Reviews Awaiting Moderation', value: data.needsAttention.pendingReviews },
    ]),
    tableSection(
      'Test Drives by Category',
      ['Category', 'Test Drives'],
      data.salesByCategory.map((c) => [c.category, c.count])
    ),
    tableSection(
      'Most Popular Vehicles',
      ['Vehicle', 'Test Drives'],
      data.topVehicles.map((v) => [v.name, v.testDrives])
    ),
  ];

  if (data.leadership) {
    const l = data.leadership;
    sections.push(
      statsSection('Key Performance Indicators', [
        { label: 'Revenue — MTD', value: formatETB(l.kpis.revenueMTD) },
        { label: 'Revenue — YTD', value: formatETB(l.kpis.revenueYTD) },
        { label: 'Units Sold — MTD', value: l.kpis.unitsSoldMTD },
        { label: 'Average Deal Size (MTD)', value: formatETB(l.kpis.avgDealSizeMTD) },
        { label: 'Quotation → Order Conversion', value: `${l.kpis.conversionRate}%` },
        { label: 'Average Customer Rating', value: `★ ${l.kpis.avgRating.toFixed(1)}` },
        ...(l.monthlyTarget
          ? [
              { label: 'Monthly Revenue Target', value: formatETB(l.monthlyTarget.revenueTarget) },
              { label: 'Monthly Units Target', value: l.monthlyTarget.unitsTarget },
            ]
          : []),
      ]),
      tableSection(
        'Revenue Trend — Month to Date',
        ['Day', 'Cumulative Revenue', 'Pace to Target'],
        l.dailyTrend.map((d) => [d.day, formatETB(d.cumulativeRevenue), d.pace != null ? formatETB(d.pace) : '—'])
      ),
      tableSection(
        'Revenue by Showroom — MTD',
        ['Showroom', 'Units', 'Revenue', 'Target', 'Achievement'],
        l.revenueByShowroom.map((r) => [
          r.name,
          r.units,
          formatETB(r.revenue),
          r.target != null ? formatETB(r.target) : 'Not set',
          r.achievementPct != null ? `${r.achievementPct}%` : '—',
        ])
      ),
      tableSection(
        'Sales Mix by Model — MTD',
        ['Model', 'Units', 'Revenue'],
        l.salesMixByModel.map((m) => [m.model, m.count, formatETB(m.revenue)])
      ),
      tableSection(
        'Quarterly Revenue — Actual vs. Plan',
        ['Quarter', 'Actual', 'Plan'],
        l.quarterlyRevenue.map((q) => [q.label, formatETB(q.actual), q.plan != null ? formatETB(q.plan) : 'Not set'])
      ),
      statsSection('Financial Snapshot', [
        { label: 'Receivables Outstanding', value: formatETB(l.financialSnapshot.receivablesOutstanding) },
        { label: 'Receivables Aged >60 Days', value: formatETB(l.financialSnapshot.receivablesAgedOver60d) },
        { label: 'Inventory Value (Stock)', value: formatETB(l.financialSnapshot.inventoryValue) },
        { label: 'Inventory Units on Ground', value: l.financialSnapshot.inventoryUnits },
        { label: 'Days Sales of Inventory', value: l.financialSnapshot.daysSalesOfInventory != null ? `${l.financialSnapshot.daysSalesOfInventory} days` : '—' },
        { label: 'Cash Collected — MTD', value: formatETB(l.financialSnapshot.cashCollectedMTD) },
      ]),
      tableSection(
        'Risks & Flags for Leadership',
        ['Risk', 'Severity'],
        l.risks.length > 0 ? l.risks.map((r) => [r.label, r.severity]) : [['No leadership-level risks flagged right now.', '—']]
      )
    );
  }

  if (data.salesPipeline) {
    const { payment, agreement, handover, orderLinkedTestDrives } = data.salesPipeline;
    sections.push(
      tableSection(
        'Sales Pipeline — Order Lifecycle Funnel',
        ['Stage', 'Count'],
        [
          ['Quotations', data.overview.totalQuotations],
          ['Paid', payment.paid],
          ['Agreement Countersigned', agreement.countersigned],
          ['Delivered', handover.delivered],
        ]
      ),
      statsSection('Sales Pipeline — Payment', [
        { label: 'Unpaid', value: payment.unpaid },
        { label: 'Pending Review', value: payment.pendingReview },
        { label: 'Paid', value: payment.paid },
        { label: 'Total Collected', value: formatETB(payment.totalCollected) },
      ]),
      statsSection('Sales Pipeline — Agreement', [
        { label: 'Approved', value: agreement.approved },
        { label: 'Sent to Customer', value: agreement.sent },
        { label: 'Signed', value: agreement.signed },
        { label: 'Countersigned', value: agreement.countersigned },
      ]),
      statsSection('Sales Pipeline — Handover & Other', [
        { label: 'Delivered', value: handover.delivered },
        { label: 'Handover Signed', value: handover.signed },
        { label: 'Handover Countersigned', value: handover.countersigned },
        { label: 'Order-Linked Test Drives', value: orderLinkedTestDrives },
      ])
    );
  }

  if (data.workshop) {
    const { kpis, warrantyClaimsByStatus, bays } = data.workshop;
    sections.push(
      statsSection('Workshop Operations (SWMS)', [
        { label: 'Bays Busy', value: `${kpis.baysBusy} / ${kpis.baysTotal}` },
        { label: 'Jobs Today', value: kpis.jobsToday },
        { label: 'Avg. Turnaround', value: formatMinutes(kpis.avgTurnaroundMinutes) },
        { label: 'Pending Approval', value: kpis.pendingApproval },
        { label: 'Overdue (3+ days)', value: kpis.overdueCount },
        { label: 'Parts Below Reorder', value: kpis.partsBelowReorder },
      ]),
      tableSection(
        'Service Bays',
        ['Bay', 'Status'],
        bays.map((b) => [b.name, b.status.replace(/_/g, ' ')])
      ),
      tableSection(
        'Warranty Claims by Status',
        ['Status', 'Count'],
        warrantyClaimsByStatus.map((c) => [
          WARRANTY_CLAIM_STATUS_LABELS[c.status as keyof typeof WARRANTY_CLAIM_STATUS_LABELS] ?? c.status,
          c.count,
        ])
      )
    );
  }

  return {
    title: 'Executive Overview',
    subtitle: 'Everything across the showroom, workshop, and website in one place',
    sections,
  };
}

export default function AnalyticsDashboard({
  canExport,
  canViewExecutive,
}: {
  canExport: boolean;
  canViewExecutive: boolean;
}) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const { data: result } = await apiClient.get('/analytics');
      setData(normalizeAnalyticsData(result));
    } catch (err) {
      if (err && typeof err === 'object' && 'response' in err && (err as { response?: { status?: number } }).response?.status === 401) {
        return;
      }
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const report = useMemo(() => (data ? buildReport(data) : null), [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-geely-blue animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
        <p className="text-red-600 dark:text-red-400 font-medium">{error || 'No data available'}</p>
        <Button variant="danger" onClick={fetchAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  // Individual-contributor roles (sales reps, technicians, service advisors,
  // marketing, viewer) still land on this page after login, but they don't get
  // the executive BI view — no charts, no revenue, no cross-department data.
  // The /analytics response has nothing scoped to "your own" activity (no
  // per-user fields), so we fall back to the least sensitive company-wide
  // counts: total fleet size and two operational booking counts that are
  // broadly relevant across sales and service roles alike.
  if (!canViewExecutive) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Card className="overflow-hidden border-0 bg-gradient-to-r from-navy via-[#143b82] to-geely-blue text-white shadow-xl">
          <div className="p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Welcome back</p>
            <h2 className="mt-1 text-2xl font-bold">Geely Ethiopia Dashboard</h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              A quick snapshot of what&apos;s happening across the showroom and workshop today.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <OverviewTile label="Total Vehicles" value={data.overview.totalVehicles} icon={Car} accent="blue" />
          <OverviewTile
            label="Test Drive Bookings"
            value={data.overview.totalTestDrives}
            hint={`${data.recentActivity.testDrives} this month`}
            icon={Calendar}
            accent="green"
          />
          <OverviewTile label="Service Bookings" value={data.overview.totalServiceBookings} icon={Wrench} accent="orange" />
        </div>
      </div>
    );
  }

  const attention = data.needsAttention;
  const attentionItems = [
    attention.overdueJobCards > 0 && {
      label: `${attention.overdueJobCards} overdue job card${attention.overdueJobCards === 1 ? '' : 's'}`,
      href: '/admin/workshop/job-cards',
      icon: AlertTriangle,
    },
    attention.partsBelowReorder > 0 && {
      label: `${attention.partsBelowReorder} part${attention.partsBelowReorder === 1 ? '' : 's'} below reorder level`,
      href: '/admin/parts',
      icon: PackageSearch,
    },
    attention.pendingQuotations > 0 && {
      label: `${attention.pendingQuotations} new quote request${attention.pendingQuotations === 1 ? '' : 's'}`,
      href: '/admin/quotations',
      icon: FileText,
    },
    attention.unreadMessages > 0 && {
      label: `${attention.unreadMessages} unread message${attention.unreadMessages === 1 ? '' : 's'}`,
      href: '/admin/messages',
      icon: MessageSquare,
    },
    attention.pendingReviews > 0 && {
      label: `${attention.pendingReviews} review${attention.pendingReviews === 1 ? '' : 's'} awaiting moderation`,
      href: '/admin/reviews',
      icon: Star,
    },
  ].filter(Boolean) as { label: string; href: string; icon: any }[];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Executive Overview"
        description="Everything across the showroom, workshop, and website in one place"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <LinkButton href="/admin/crm-dashboard" variant="secondary" size="sm">
              <BarChart3 className="w-4 h-4" /> CRM Dashboard
            </LinkButton>
            <LinkButton href="/admin/workshop/bi-dashboard" variant="secondary" size="sm">
              <Gauge className="w-4 h-4" /> Workshop BI
            </LinkButton>
            <Button variant="secondary" size="sm" onClick={fetchAnalytics} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        }
      />

      <Card className="overflow-hidden border-0 bg-gradient-to-r from-navy via-[#143b82] to-geely-blue text-white shadow-xl">
        <div className="flex flex-col gap-5 p-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Insights &amp; reporting</p>
            <h2 className="mt-1 text-2xl font-bold">Showroom, CRM &amp; Workshop at a Glance</h2>
            <p className="mt-2 max-w-2xl text-sm text-blue-100">
              Review sales, CRM, and workshop performance from one place, then download the current report in the format your team needs.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <LinkButton href="/admin/crm-dashboard" className="bg-white text-navy hover:bg-blue-50" size="sm">
              <BarChart3 className="w-4 h-4" /> Open CRM
            </LinkButton>
            <LinkButton href="/admin/workshop/bi-dashboard" className="bg-white/15 text-white hover:bg-white/25" size="sm">
              <Wrench className="w-4 h-4" /> Open Workshop BI
            </LinkButton>
          </div>
        </div>
        {canExport && (
          <div className="border-t border-white/15 px-6 py-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-100">Download this dashboard</p>
            {report && <ReportExportBar report={report} canExport={canExport} />}
          </div>
        )}
      </Card>

      {/* Leadership BI: KPIs, revenue by showroom, sales mix, quarterly trend,
          financial snapshot, showroom ranking, and risk flags — restricted to
          canViewExecutive server-side too (the /analytics API only fills in
          `leadership` for a session with canViewExecutiveDashboards). */}
      {data.leadership && (
        <div className="space-y-6">
          <div>
            <SectionHeading
              icon={Gauge}
              title="Key Performance Indicators"
              actions={
                <LinkButton href="/admin/sales-targets" variant="ghost" size="sm">
                  <Target className="w-4 h-4" /> Manage Targets
                </LinkButton>
              }
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <KpiTile
                label="Revenue — MTD"
                value={formatETB(data.leadership.kpis.revenueMTD)}
                icon={Banknote}
                accent="blue"
                progressPct={data.leadership.kpis.revenueMTDTargetPct}
                sparkline={data.leadership.dailyTrend.map((d) => d.cumulativeRevenue)}
                hint={
                  data.leadership.monthlyTarget
                    ? `${data.leadership.kpis.revenueMTDTargetPct ?? 0}% of ${formatETB(data.leadership.monthlyTarget.revenueTarget)} target`
                    : 'No monthly target set'
                }
              />
              <KpiTile
                label="Revenue — YTD"
                value={formatETB(data.leadership.kpis.revenueYTD)}
                icon={TrendingUp}
                accent="green"
                hint={`Since Jan 1, ${new Date().getFullYear()}`}
              />
              <KpiTile
                label="Units Sold — MTD"
                value={data.leadership.kpis.unitsSoldMTD}
                icon={ShoppingCart}
                accent="purple"
                progressPct={data.leadership.kpis.unitsSoldMTDTargetPct}
                hint={
                  data.leadership.monthlyTarget
                    ? `${data.leadership.kpis.unitsSoldMTDTargetPct ?? 0}% of ${data.leadership.monthlyTarget.unitsTarget}-unit target`
                    : 'No monthly target set'
                }
              />
              <KpiTile label="Average Deal Size" value={formatETB(data.leadership.kpis.avgDealSizeMTD)} icon={Wallet} accent="orange" hint="Month-to-date" />
              <KpiTile label="Quote → Order Conversion" value={`${data.leadership.kpis.conversionRate}%`} icon={Percent} accent="indigo" />
              <KpiTile label="Customer Rating" value={`★ ${data.leadership.kpis.avgRating.toFixed(1)}`} icon={Star} accent="pink" />
            </div>
          </div>

          <MtdTrendChart
            title="Revenue Trend — Month to Date"
            data={data.leadership.dailyTrend}
            valueFormatter={formatETB}
            axisFormatter={formatETBAxis}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="flex items-center gap-1.5 text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                <Building2 className="w-4 h-4 text-gray-400 dark:text-gray-500" /> Revenue by Showroom — MTD
              </h3>
              {data.leadership.revenueByShowroom.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">No orders booked yet this month.</p>
              ) : (
                <div className="space-y-4">
                  {data.leadership.revenueByShowroom.map((r) => (
                    <AchievementBar key={r.dealerId} label={r.name} value={r.revenue} target={r.target} valueFormatter={formatETB} />
                  ))}
                </div>
              )}
            </Card>
            <SalesMixChart
              title="Sales Mix by Model — MTD"
              icon={Car}
              data={data.leadership.salesMixByModel.map((m) => ({ label: m.model, count: m.count, revenue: m.revenue }))}
              valueFormatter={formatETB}
            />
          </div>

          <QuarterlyPlanChart
            title="Quarterly Revenue — Actual vs. Plan"
            data={data.leadership.quarterlyRevenue}
            valueFormatter={formatETB}
            axisFormatter={formatETBAxis}
          />

          <div>
            <SectionHeading icon={Wallet} title="Financial Snapshot" />
            <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2 mb-3">Working capital and cash position</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatTile
                label="Receivables Outstanding"
                value={formatETB(data.leadership.financialSnapshot.receivablesOutstanding)}
                icon={AlertTriangle}
                tone={data.leadership.financialSnapshot.receivablesOutstanding > 0 ? 'highlight' : 'default'}
              />
              <StatTile label="Inventory Value (Stock)" value={formatETB(data.leadership.financialSnapshot.inventoryValue)} icon={Boxes} />
              <StatTile
                label="Days Sales of Inventory"
                value={data.leadership.financialSnapshot.daysSalesOfInventory != null ? `${data.leadership.financialSnapshot.daysSalesOfInventory} days` : '—'}
                icon={ClipboardList}
              />
              <StatTile label="Cash Collected — MTD" value={formatETB(data.leadership.financialSnapshot.cashCollectedMTD)} icon={Wallet} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-1.5">
              <p className="text-xs text-gray-400 dark:text-gray-500">ETB {Math.round(data.leadership.financialSnapshot.receivablesAgedOver60d).toLocaleString()} aged &gt;60 days</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{data.leadership.financialSnapshot.inventoryUnits} units on ground</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Based on last 30 days' sales pace</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {data.leadership.financialSnapshot.cashCollectedMTDPctOfRevenue != null ? `${data.leadership.financialSnapshot.cashCollectedMTDPctOfRevenue}% of MTD revenue` : 'No MTD revenue yet'}
              </p>
            </div>
          </div>

          <ShowroomRankingTable
            title="Showroom Ranking — MTD Achievement"
            valueFormatter={formatETB}
            rows={data.leadership.revenueByShowroom.map((r) => ({ id: r.dealerId, name: r.name, revenue: r.revenue, units: r.units, achievementPct: r.achievementPct }))}
          />

          <RiskFlagsList title="Risks & Flags for Leadership" risks={data.leadership.risks} />
        </div>
      )}

      {/* Needs Attention */}
      <div>
        <SectionHeading icon={AlertTriangle} title="Needs Attention" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RankedBarChart
              title="Open Items by Category"
              icon={AlertTriangle}
              emptyLabel="Nothing needs attention right now."
              data={[
                { label: 'Overdue Job Cards', value: attention.overdueJobCards },
                { label: 'Parts Below Reorder', value: attention.partsBelowReorder },
                { label: 'New Quote Requests', value: attention.pendingQuotations },
                { label: 'Unread Messages', value: attention.unreadMessages },
                { label: 'Reviews Awaiting Moderation', value: attention.pendingReviews },
              ].filter((d) => d.value > 0)}
            />
          </div>
          <Card className={attentionItems.length > 0 ? 'border-orange-200 dark:border-orange-800' : ''}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Jump to Item</h3>
            {attentionItems.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">All caught up — nothing needs attention.</p>
            ) : (
              <ul className="space-y-2">
                {attentionItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-2 text-sm text-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="flex flex-wrap gap-3">
        <LinkButton href="/admin/workshop/job-cards/new" variant="secondary" size="sm">
          <Plus className="w-4 h-4" /> New Job Card
        </LinkButton>
        <LinkButton href="/admin/workshop/warranty-claims" variant="secondary" size="sm">
          <ShieldCheck className="w-4 h-4" /> Warranty Claims
        </LinkButton>
        <LinkButton href="/admin/parts" variant="secondary" size="sm">
          <PackageSearch className="w-4 h-4" /> Spare Parts
        </LinkButton>
        <LinkButton href="/admin/test-drives/new" variant="secondary" size="sm">
          <Plus className="w-4 h-4" /> New Test Drive
        </LinkButton>
        <LinkButton href="/admin/showroom-visits" variant="secondary" size="sm">
          <QrCode className="w-4 h-4" /> Showroom Visits
        </LinkButton>
      </Card>

      {/* Business Overview */}
      <div>
        <SectionHeading icon={LayoutGrid} title="Business Overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <OverviewTile label="Total Vehicles" value={data.overview.totalVehicles} icon={Car} accent="blue" />
          <OverviewTile
            label="Test Drive Bookings"
            value={data.overview.totalTestDrives}
            hint={`${data.recentActivity.testDrives} this month`}
            icon={Calendar}
            accent="green"
          />
          <OverviewTile
            label="Quote Requests"
            value={data.overview.totalQuotations}
            hint={`${data.recentActivity.quotations} pending`}
            icon={FileText}
            accent="purple"
          />
          <OverviewTile label="Service Bookings" value={data.overview.totalServiceBookings} icon={Wrench} accent="orange" />
          <OverviewTile
            label="Customer Reviews"
            value={data.overview.totalReviews}
            hint={`★ ${data.overview.avgRating.toFixed(1)} average rating`}
            icon={Star}
            accent="pink"
          />
          <OverviewTile
            label="New Reviews"
            value={data.recentActivity.reviews}
            hint="This month"
            icon={TrendingUp}
            accent="indigo"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <RankedBarChart
            title="Test Drives by Category"
            data={data.salesByCategory.map((c) => ({ label: c.category, value: c.count }))}
            actions={
              <LinkButton href="/admin/test-drives" variant="ghost" size="sm">
                View all
              </LinkButton>
            }
          />

          <RankedBarChart
            title="Most Popular Vehicles"
            data={data.topVehicles.map((v) => ({ label: v.name, value: v.testDrives }))}
            actions={
              <LinkButton href="/admin/vehicles" variant="ghost" size="sm">
                View all
              </LinkButton>
            }
          />
        </div>
      </div>

      {/* Sales Pipeline: payment, agreement, and handover progress — only
          present for viewers who can see quotations/orders */}
      {data.salesPipeline && (
        <div>
          <SectionHeading
            icon={Route}
            title="Sales Pipeline"
            actions={
              <LinkButton href="/admin/orders" variant="secondary" size="sm">
                <FileText className="w-4 h-4" /> View Orders
              </LinkButton>
            }
          />

          {/* Total Collected (currency) and Order-Linked Test Drives (a plain count)
              are single current values of two different units/scales, so per the
              one-axis rule they stay as stat tiles rather than sharing a chart. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <StatTile label="Total Collected" value={formatETB(data.salesPipeline.payment.totalCollected)} icon={TrendingUp} />
            <StatTile label="Order-Linked Test Drives" value={data.salesPipeline.orderLinkedTestDrives} icon={Calendar} />
          </div>

          {/* Whole-lifecycle funnel (an ordered, narrowing population — quote
              to delivered) alongside the payment-status split as a
              proportion-of-one-whole bar, both new "more chart" additions
              distinct from the per-stage breakdowns below. */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <FunnelChart
                title="Order Lifecycle Funnel"
                icon={TrendingUp}
                stages={[
                  { stage: 'Quotations', count: data.overview.totalQuotations },
                  { stage: 'Paid', count: data.salesPipeline.payment.paid },
                  { stage: 'Agreement Countersigned', count: data.salesPipeline.agreement.countersigned },
                  { stage: 'Delivered', count: data.salesPipeline.handover.delivered },
                ]}
              />
            </div>
            <UtilizationBar
              title="Payment Mix"
              icon={Wallet}
              segments={[
                { label: 'Paid', value: data.salesPipeline.payment.paid, color: CHART_STATUS.good },
                { label: 'Pending Review', value: data.salesPipeline.payment.pendingReview, color: CHART_STATUS.warning },
                { label: 'Unpaid', value: data.salesPipeline.payment.unpaid, color: CHART_STATUS.critical },
              ]}
            />
          </div>

          {/* Each pipeline stage-breakdown is a magnitude comparison across an
              ordered set of stages with no independent identity elsewhere, so —
              per the method — a single brand-hue bar chart is the safe default
              (not a distinct categorical color per stage). */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <RankedBarChart
              title="Payment Status"
              icon={Wallet}
              data={[
                { label: 'Unpaid', value: data.salesPipeline.payment.unpaid },
                { label: 'Pending Review', value: data.salesPipeline.payment.pendingReview },
                { label: 'Paid', value: data.salesPipeline.payment.paid },
              ]}
            />
            <RankedBarChart
              title="Agreement Progress"
              icon={FileCheck2}
              data={[
                { label: 'Approved', value: data.salesPipeline.agreement.approved },
                { label: 'Sent to Customer', value: data.salesPipeline.agreement.sent },
                { label: 'Signed', value: data.salesPipeline.agreement.signed },
                { label: 'Countersigned', value: data.salesPipeline.agreement.countersigned },
              ]}
            />
            <RankedBarChart
              title="Handover Progress"
              icon={PackageCheck}
              data={[
                { label: 'Delivered', value: data.salesPipeline.handover.delivered },
                { label: 'Signed', value: data.salesPipeline.handover.signed },
                { label: 'Countersigned', value: data.salesPipeline.handover.countersigned },
              ]}
            />
          </div>
        </div>
      )}

      {/* Workshop Operations — only present for viewers who can see workshop data */}
      {data.workshop && (
        <div>
          <SectionHeading
            icon={Wrench}
            title="Workshop Operations (SWMS)"
            actions={
              <div className="flex items-center gap-2">
                <LinkButton href="/admin/workshop/dashboard" variant="secondary" size="sm">
                  <Gauge className="w-4 h-4" /> Live Dashboard
                </LinkButton>
                <LinkButton href="/admin/workshop/bi-dashboard" variant="secondary" size="sm">
                  <BarChart3 className="w-4 h-4" /> BI Dashboard
                </LinkButton>
              </div>
            }
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <StatTile label="Bays Busy" value={`${data.workshop.kpis.baysBusy} / ${data.workshop.kpis.baysTotal}`} icon={Gauge} />
            <StatTile label="Jobs Today" value={data.workshop.kpis.jobsToday} icon={ClipboardList} />
            <StatTile label="Avg. Turnaround" value={formatMinutes(data.workshop.kpis.avgTurnaroundMinutes)} icon={Wrench} />
          </div>

          {/* Bay Utilization is a proportion of one fixed total (one bar);
              the three alert counts below are independent magnitudes with no
              natural order (a ranked bar chart), so — per the one-axis rule —
              they stay as two separate charts rather than one combined chart. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <UtilizationBar
              title="Bay Utilization"
              icon={Gauge}
              emptyLabel="No active bays configured."
              segments={[
                { label: 'Busy', value: data.workshop.kpis.baysBusy, color: CHART_CATEGORICAL[0] },
                { label: 'Available', value: Math.max(0, data.workshop.kpis.baysTotal - data.workshop.kpis.baysBusy), color: CHART_CHROME.gridline },
              ]}
            />
            <RankedBarChart
              title="Operational Alerts"
              icon={AlertTriangle}
              emptyLabel="No open operational alerts."
              data={[
                { label: 'Pending Approval', value: data.workshop.kpis.pendingApproval },
                { label: 'Overdue (3+ days)', value: data.workshop.kpis.overdueCount },
                { label: 'Parts Below Reorder', value: data.workshop.kpis.partsBelowReorder },
              ].filter((d) => d.value > 0)}
            />
          </div>

          <StatusBarChart
            title="Warranty Claims by Status"
            data={data.workshop.warrantyClaimsByStatus.map((c) => ({
              status: c.status,
              label: WARRANTY_CLAIM_STATUS_LABELS[c.status as keyof typeof WARRANTY_CLAIM_STATUS_LABELS],
              count: c.count,
              color: WARRANTY_STATUS_COLOR[c.status] ?? CHART_CHROME.mutedText,
            }))}
          />
        </div>
      )}
    </div>
  );
}
