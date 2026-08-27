'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Calendar, Car, FileText, Star, Wrench, Loader2,
  AlertTriangle, Gauge, ClipboardList, ShieldCheck, PackageSearch, MessageSquare, Plus, BarChart3, QrCode, RefreshCw,
} from 'lucide-react';
import { Card, StatTile, LinkButton, Button, PageHeader } from '@/components/admin/ui';
import { OverviewTile, RankedBarChart, StatusBarChart } from '@/components/admin/analytics/AnalyticsCharts';
import { WARRANTY_CLAIM_STATUS_LABELS } from '@/lib/workshop/warrantyClaimStateMachine';

const WARRANTY_STATUS_FILL: Record<string, string> = {
  DRAFTED: 'bg-gray-400 dark:bg-gray-500',
  SUBMITTED: 'bg-geely-blue dark:bg-blue-400',
  UNDER_REVIEW: 'bg-orange-500 dark:bg-orange-400',
  APPROVED: 'bg-purple-500 dark:bg-purple-400',
  REJECTED: 'bg-red-500 dark:bg-red-400',
  REIMBURSED: 'bg-green-500 dark:bg-green-400',
};

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
}

function formatMinutes(mins: number | null) {
  if (mins === null) return '—';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        title="Dashboard"
        description="Everything across the showroom, workshop, and website in one place"
        actions={
          <Button variant="secondary" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      {/* Needs Attention */}
      <Card className={attentionItems.length > 0 ? 'border-orange-200 dark:border-orange-800' : ''}>
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Needs Attention</h2>
        {attentionItems.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nothing needs attention right now.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Business Overview</h2>
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

      {/* Workshop Operations — only present for viewers who can see workshop data */}
      {data.workshop && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Workshop Operations (SWMS)</h2>
            <div className="flex items-center gap-2">
              <LinkButton href="/admin/workshop/dashboard" variant="secondary" size="sm">
                <Gauge className="w-4 h-4" /> Live Dashboard
              </LinkButton>
              <LinkButton href="/admin/workshop/bi-dashboard" variant="secondary" size="sm">
                <BarChart3 className="w-4 h-4" /> BI Dashboard
              </LinkButton>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <StatTile label="Bays Busy" value={`${data.workshop.kpis.baysBusy} / ${data.workshop.kpis.baysTotal}`} icon={Gauge} />
            <StatTile label="Jobs Today" value={data.workshop.kpis.jobsToday} icon={ClipboardList} />
            <StatTile label="Avg. Turnaround" value={formatMinutes(data.workshop.kpis.avgTurnaroundMinutes)} icon={Wrench} />
            <StatTile label="Pending Approval" value={data.workshop.kpis.pendingApproval} icon={FileText} tone={data.workshop.kpis.pendingApproval > 0 ? 'highlight' : 'default'} />
            <StatTile label="Overdue (3+ days)" value={data.workshop.kpis.overdueCount} icon={AlertTriangle} tone={data.workshop.kpis.overdueCount > 0 ? 'highlight' : 'default'} />
            <StatTile label="Parts Below Reorder" value={data.workshop.kpis.partsBelowReorder} icon={PackageSearch} tone={data.workshop.kpis.partsBelowReorder > 0 ? 'highlight' : 'default'} />
          </div>

          <StatusBarChart
            title="Warranty Claims by Status"
            data={data.workshop.warrantyClaimsByStatus.map((c) => ({
              status: c.status,
              label: WARRANTY_CLAIM_STATUS_LABELS[c.status as keyof typeof WARRANTY_CLAIM_STATUS_LABELS],
              count: c.count,
              fillClass: WARRANTY_STATUS_FILL[c.status] ?? 'bg-gray-400 dark:bg-gray-500',
            }))}
          />
        </div>
      )}
    </div>
  );
}
