'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, Calendar, Car, FileText, Star, Wrench, Loader2,
  AlertTriangle, Gauge, ClipboardList, ShieldCheck, PackageSearch, MessageSquare, Plus,
} from 'lucide-react';
import { Card, StatTile, LinkButton } from '@/components/admin/ui';
import { WARRANTY_CLAIM_STATUS_LABELS, WARRANTY_CLAIM_STATUS_COLORS } from '@/lib/workshop/warrantyClaimStateMachine';

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
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">{error || 'No data available'}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Everything across the showroom, workshop, and website in one place</p>
      </div>

      {/* Needs Attention */}
      <Card className={attentionItems.length > 0 ? 'border-orange-200' : ''}>
        <h2 className="font-semibold text-gray-900 mb-3">Needs Attention</h2>
        {attentionItems.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing needs attention right now.</p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {attentionItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="flex items-center gap-2 text-sm text-orange-800 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 hover:bg-orange-100 transition-colors"
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
      </Card>

      {/* Business Overview */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Business Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <Car className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-3xl font-bold">{data.overview.totalVehicles}</h3>
            <p className="text-sm text-blue-100 mt-1">Total Vehicles</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <Calendar className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-3xl font-bold">{data.overview.totalTestDrives}</h3>
            <p className="text-sm text-green-100 mt-1">Test Drive Bookings</p>
            <p className="text-xs text-green-200 mt-2">
              {data.recentActivity.testDrives} this month
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <FileText className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-3xl font-bold">{data.overview.totalQuotations}</h3>
            <p className="text-sm text-purple-100 mt-1">Quote Requests</p>
            <p className="text-xs text-purple-200 mt-2">
              {data.recentActivity.quotations} pending
            </p>
          </div>

          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <Wrench className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-3xl font-bold">{data.overview.totalServiceBookings}</h3>
            <p className="text-sm text-orange-100 mt-1">Service Bookings</p>
          </div>

          <div className="bg-gradient-to-br from-pink-600 to-pink-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <Star className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-3xl font-bold">{data.overview.totalReviews}</h3>
            <p className="text-sm text-pink-100 mt-1">Customer Reviews</p>
            <p className="text-xs text-pink-200 mt-2">
              ⭐ {data.overview.avgRating.toFixed(1)} average rating
            </p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
            <TrendingUp className="w-8 h-8 mb-3 opacity-80" />
            <h3 className="text-3xl font-bold">{data.recentActivity.reviews}</h3>
            <p className="text-sm text-indigo-100 mt-1">New Reviews</p>
            <p className="text-xs text-indigo-200 mt-2">This month</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Test Drives by Category</h3>
            <div className="space-y-4">
              {data.salesByCategory.map((item, index) => {
                const maxCount = Math.max(...data.salesByCategory.map(i => i.count));
                const percentage = (item.count / maxCount) * 100;
                const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
                const color = colors[index % colors.length];

                return (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.category}</span>
                      <span className="text-sm font-bold text-gray-900">{item.count} bookings</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`bg-${color}-600 h-3 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Most Popular Vehicles</h3>
            <div className="space-y-4">
              {data.topVehicles.map((vehicle, index) => {
                const maxTestDrives = Math.max(...data.topVehicles.map(v => v.testDrives));
                const percentage = (vehicle.testDrives / maxTestDrives) * 100;
                const colors = ['blue', 'green', 'purple', 'orange', 'pink'];
                const color = colors[index % colors.length];

                return (
                  <div key={vehicle.name}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{vehicle.name}</span>
                      <span className="text-sm font-bold text-gray-900">{vehicle.testDrives} test drives</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`bg-${color}-600 h-3 rounded-full transition-all duration-500 ease-out`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Workshop Operations — only present for viewers who can see workshop data */}
      {data.workshop && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Workshop Operations (SWMS)</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
            <StatTile label="Bays Busy" value={`${data.workshop.kpis.baysBusy} / ${data.workshop.kpis.baysTotal}`} icon={Gauge} />
            <StatTile label="Jobs Today" value={data.workshop.kpis.jobsToday} icon={ClipboardList} />
            <StatTile label="Avg. Turnaround" value={formatMinutes(data.workshop.kpis.avgTurnaroundMinutes)} icon={Wrench} />
            <StatTile label="Pending Approval" value={data.workshop.kpis.pendingApproval} icon={FileText} tone={data.workshop.kpis.pendingApproval > 0 ? 'highlight' : 'default'} />
            <StatTile label="Overdue (3+ days)" value={data.workshop.kpis.overdueCount} icon={AlertTriangle} tone={data.workshop.kpis.overdueCount > 0 ? 'highlight' : 'default'} />
            <StatTile label="Parts Below Reorder" value={data.workshop.kpis.partsBelowReorder} icon={PackageSearch} tone={data.workshop.kpis.partsBelowReorder > 0 ? 'highlight' : 'default'} />
          </div>

          {data.workshop.warrantyClaimsByStatus.length > 0 && (
            <Card>
              <h3 className="font-semibold text-gray-900 mb-3">Warranty Claims by Status</h3>
              <div className="flex flex-wrap gap-3">
                {data.workshop.warrantyClaimsByStatus.map((c) => (
                  <span
                    key={c.status}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${WARRANTY_CLAIM_STATUS_COLORS[c.status as keyof typeof WARRANTY_CLAIM_STATUS_COLORS]}`}
                  >
                    {WARRANTY_CLAIM_STATUS_LABELS[c.status as keyof typeof WARRANTY_CLAIM_STATUS_LABELS]}: {c.count}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={fetchAnalytics}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Refresh Data
            </>
          )}
        </button>
      </div>
    </div>
  );
}
