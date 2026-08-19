'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Zap,
  Plus,
  Upload,
  Download,
  MapPin,
  Home,
  DollarSign,
  Calculator,
  Shield,
  Leaf,
  FileText,
  Menu,
  Eye,
  Edit,
  ArrowRight,
  CheckCircle,
  XCircle,
  LayoutGrid,
  Clock,
  HelpCircle,
  PlugZap,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Users,
  MousePointer,
  Share2,
  RefreshCw,
  Settings,
  Activity,
  Globe,
  Sparkles,
} from 'lucide-react';
import ElectricPageList from '@/components/admin/electric/ElectricPageList';
import ElectricMenuList from '@/components/admin/electric/ElectricMenuList';
import ChargingStationList from '@/components/admin/electric/ChargingStationList';

interface ElectricPage {
  id: string;
  title: string;
  slug: string;
  pageType: string;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  chargingStations?: ChargingStation[];
}

interface ChargingStation {
  id: string;
  name: string;
  city: string;
  stationType: string;
  chargerCount: number;
  maxPower: string;
  isActive: boolean;
}

const PAGE_CARDS = [
  {
    title: 'Charging Map',
    slug: 'charging-map',
    pageType: 'charging-map',
    route: '/electric/charging-map',
    icon: MapPin,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    borderColor: 'border-green-200',
    badge: 'bg-green-50 text-green-700 border-green-200',
    editRoute: '/admin/electric/stations',
    description: 'Interactive charging station map and locations',
  },
  {
    title: 'Home Charging',
    slug: 'home-charging',
    pageType: 'home-charging',
    route: '/electric/home-charging',
    icon: Home,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
    editRoute: '/admin/electric/battery',
    description: 'Home installation guides and equipment',
  },
  {
    title: 'Fast Charging',
    slug: 'fast-charging',
    pageType: 'fast-charging',
    route: '/electric/fast-charging',
    icon: Zap,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    badge: 'bg-purple-50 text-purple-700 border-purple-200',
    editRoute: '/admin/electric/benefits/government-incentives',
    description: 'DC fast charging speeds and network info',
  },
  {
    title: 'Cost Calculator',
    slug: 'cost-calculator',
    pageType: 'custom',
    route: '/electric/cost-calculator',
    icon: Calculator,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-200',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    editRoute: '/admin/electric/benefits/cost-calculator',
    description: 'Compare fuel costs vs electricity',
  },
  {
    title: 'Government Incentives',
    slug: 'government-incentives',
    pageType: 'custom',
    route: '/electric/government-incentives',
    icon: Shield,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    editRoute: '/admin/electric/benefits/government-incentives',
    description: 'Tax credits, rebates & subsidies',
  },
  {
    title: 'Environment Impact',
    slug: 'environmental-impact',
    pageType: 'custom',
    route: '/electric/environmental-impact',
    icon: Leaf,
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    borderColor: 'border-teal-200',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
    editRoute: '/admin/electric/benefits/environmental-impact',
    description: 'CO2 savings and sustainability info',
  },
];

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return 'N/A';
  }
}

export default function ElectricManagementPage() {
  const [activeTab, setActiveTab] = useState<'pages' | 'menu'>('pages');
  const [pages, setPages] = useState<ElectricPage[]>([]);
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    avgTimeOnPage: '0:00',
    bounceRate: 0,
    testDriveRequests: 0,
    downloads: 0,
    shares: 0,
    growth: {
      testDrives: 0,
      contacts: 0,
      views: 0,
      avgTime: 0,
      bounceRate: 0,
      downloads: 0,
    },
  });
  const [refreshing, setRefreshing] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  useEffect(() => {
    fetchData();
    fetchAnalytics();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/admin/electric?includeStations=true');
      const data = await response.json();
      const fetchedPages: ElectricPage[] = data.pages || [];
      setPages(fetchedPages);

      const allStations: ChargingStation[] = [];
      fetchedPages.forEach((p) => {
        if (p.chargingStations) {
          allStations.push(...p.chargingStations);
        }
      });
      setStations(allStations);
    } catch (error) {
      console.error('Error fetching electric data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await fetch('/api/admin/electric/analytics');
      const data = await response.json();
      if (data.analytics) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchAnalytics()]);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleBulkPublish = async () => {
    if (!confirm('Are you sure you want to publish all 6 EV pages? This will make them visible on the website.')) {
      return;
    }
    
    try {
      // Future: Implement bulk publish API
      alert('Publishing all pages... This feature will be implemented to publish all 6 EV pages at once.');
      await fetchData(); // Refresh after publishing
    } catch (error) {
      console.error('Error bulk publishing:', error);
      alert('Failed to publish pages. Please try again.');
    }
  };

  const handleExport = async () => {
    try {
      // Future: Implement export API
      alert('Exporting electric pages data...');
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  const totalPages = 6;
  const publishedCount = pages.filter((p) => p.isPublished).length;
  const draftCount = pages.length - publishedCount;
  const stationCount = stations.length;

  const getPageData = (cardSlug: string, cardType: string) => {
    return (
      pages.find(
        (p) =>
          p.slug === cardSlug ||
          p.pageType === cardType ||
          p.title.toLowerCase().includes(cardSlug.replace(/-/g, ' '))
      ) || null
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/20">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Electric Pages Management
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage all 6 electric vehicle informational pages and charging infrastructure
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/admin/electric/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-sm hover:from-green-700 hover:to-green-800 transition-all font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Page
          </Link>
          <button
            onClick={handleBulkPublish}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow-sm hover:from-blue-700 hover:to-blue-800 transition-all font-medium text-sm"
          >
            <Globe className="w-4 h-4" />
            Publish All
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200/50 shadow-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Analytics Overview</h2>
              <p className="text-sm text-gray-600">Last 30 days performance</p>
            </div>
          </div>
          <Link
            href="/admin/analytics"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
          >
            View Detailed Analytics
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {/* Total Views */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Eye className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-xs text-gray-600 font-medium">Total Views</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsLoading ? '—' : analytics.totalViews.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{analytics.growth?.views?.toFixed(1) || '0'}%
            </div>
          </div>

          {/* Avg Time */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Clock className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-xs text-gray-600 font-medium">Avg Time</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsLoading ? '—' : analytics.avgTimeOnPage}
            </div>
            <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{analytics.growth?.avgTime?.toFixed(1) || '0'}%
            </div>
          </div>

          {/* Bounce Rate */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <MousePointer className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-xs text-gray-600 font-medium">Bounce Rate</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsLoading ? '—' : `${analytics.bounceRate}%`}
            </div>
            <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 rotate-180" />
              {analytics.growth?.bounceRate?.toFixed(1) || '0'}%
            </div>
          </div>

          {/* Test Drives */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <Users className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xs text-gray-600 font-medium">Test Drives</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsLoading ? '—' : analytics.testDriveRequests}
            </div>
            <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{analytics.growth?.testDrives?.toFixed(1) || '0'}%
            </div>
          </div>

          {/* Downloads */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Download className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-xs text-gray-600 font-medium">Downloads</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsLoading ? '—' : analytics.downloads}
            </div>
            <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{analytics.growth?.downloads?.toFixed(1) || '0'}%
            </div>
          </div>

          {/* Shares */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-rose-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-rose-100 rounded-lg">
                <Share2 className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-xs text-gray-600 font-medium">Social Shares</div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsLoading ? '—' : analytics.shares}
            </div>
            <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              +{(analytics.shares * 0.15).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Dashboard Row */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pages */}
        <div className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden shadow-sm">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-green-400 to-emerald-600 opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full">100%</span>
            </div>
            <div className="text-3xl font-bold tracking-tight bg-gradient-to-br from-green-600 to-emerald-600 bg-clip-text text-transparent">
              {loading ? '—' : totalPages}
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">Total Pages</div>
            <div className="text-xs text-gray-500 mt-0.5">All EV content</div>
          </div>
        </div>

        {/* Published */}
        <div className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden shadow-sm">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">Live</span>
            </div>
            <div className="text-3xl font-bold tracking-tight bg-gradient-to-br from-blue-600 to-blue-600 bg-clip-text text-transparent">
              {loading ? '—' : publishedCount}
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">Published</div>
            <div className="text-xs text-gray-500 mt-0.5">Live on website</div>
          </div>
        </div>

        {/* Drafts */}
        <div className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden shadow-sm">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-amber-400 to-amber-600 opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full">Pending</span>
            </div>
            <div className="text-3xl font-bold tracking-tight bg-gradient-to-br from-amber-600 to-amber-600 bg-clip-text text-transparent">
              {loading ? '—' : Math.max(0, totalPages - publishedCount)}
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">Drafts</div>
            <div className="text-xs text-gray-500 mt-0.5">Awaiting review</div>
          </div>
        </div>

        {/* Charging Stations */}
        <div className="group relative bg-white rounded-xl border border-gray-200 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden shadow-sm">
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-violet-400 to-violet-600 opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700" />
          <div className="relative">
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-violet-600 shadow-lg shadow-violet-500/25 flex items-center justify-center group-hover:scale-110 transition-transform">
                <PlugZap className="w-6 h-6 text-white" />
              </div>
              <span className="px-2 py-1 bg-violet-50 text-violet-700 text-xs font-bold rounded-full">Active</span>
            </div>
            <div className="text-3xl font-bold tracking-tight bg-gradient-to-br from-violet-600 to-violet-600 bg-clip-text text-transparent">
              {loading ? '—' : stationCount}
            </div>
            <div className="mt-1 text-sm font-semibold text-gray-900">Charging Stations</div>
            <div className="text-xs text-gray-500 mt-0.5">Network locations</div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-xl border border-gray-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => alert('Opening SEO Report...')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">SEO Report</span>
          </button>
          <button
            onClick={() => alert('Opening Performance Metrics...')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Activity className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">Performance</span>
          </button>
          <button
            onClick={() => alert('Opening Bulk Editor...')}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Settings className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">Bulk Edit</span>
          </button>
          <button
            onClick={handleExport}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-amber-300 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Download className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-gray-700 text-center">Export Data</span>
          </button>
        </div>
      </div>

      {/* Page Overview Cards Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Page Overview</h2>
          </div>
          <span className="text-xs text-gray-500">Click Manage Content to edit a page</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {PAGE_CARDS.map((card) => {
            const Icon = card.icon;
            const pageData = getPageData(card.slug, card.pageType);
            const isPublished = pageData?.isPublished ?? false;

            return (
              <div
                key={card.slug}
                className={`group bg-white rounded-xl border ${card.borderColor} shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-lg ${card.iconBg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 leading-tight">
                          {card.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{card.description}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
                        isPublished
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}
                    >
                      {isPublished ? (
                        <CheckCircle className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <code className="inline-block text-xs bg-gray-50 text-gray-600 px-2.5 py-1 rounded-md border border-gray-200">
                      {card.route}
                    </code>
                  </div>

                  <div className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Last updated: {pageData?.updatedAt ? formatDate(pageData.updatedAt) : 'Not set'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={card.editRoute}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${card.badge} border hover:opacity-90`}
                    >
                      <Edit className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                    <a
                      href={card.route}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>
                  </div>
                </div>

                <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between text-xs">
                  <Link
                    href={card.editRoute}
                    className="font-medium text-gray-700 hover:text-gray-900 inline-flex items-center gap-1"
                  >
                    Manage Content
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <a
                    href={card.route}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    Live Preview
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Links Section with Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-2 pt-2 sm:px-4 sm:pt-4">
          <div className="flex gap-1 sm:gap-2">
            <button
              onClick={() => setActiveTab('pages')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 ${
                activeTab === 'pages'
                  ? 'border-green-600 text-green-700 bg-green-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              Pages List
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all border-b-2 ${
                activeTab === 'menu'
                  ? 'border-green-600 text-green-700 bg-green-50/50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Menu className="w-4 h-4" />
              Menu Structure
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'pages' ? (
            <ElectricPageList />
          ) : (
            <ElectricMenuList />
          )}
        </div>
      </div>

      {/* Charging Stations Preview */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Charging Stations Preview</h2>
          </div>
          <Link
            href="/admin/electric/stations"
            className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
          >
            View all stations
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <ChargingStationList />
        </div>
      </div>

      {/* Informational Help Box */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <HelpCircle className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              How the Electric Pages System Works
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-blue-800">
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">1</span>
                <p>
                  <strong>6 Dedicated Pages</strong> — Each covers a unique EV topic from charging maps to environmental impact.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">2</span>
                <p>
                  <strong>Published vs Draft</strong> — Toggle page status to control visibility on the public website.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">3</span>
                <p>
                  <strong>Menu Structure</strong> — Organize pages into menu sections and items that appear in the site navigation.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">4</span>
                <p>
                  <strong>Charging Stations</strong> — Add and manage locations shown on the Charging Map page.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">5</span>
                <p>
                  <strong>Live Preview</strong> — Always test changes using the Live Preview link before publishing updates.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">6</span>
                <p>
                  <strong>Instant Changes</strong> — Published updates appear immediately on the website for visitors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
