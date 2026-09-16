'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useAdminSessionContext, signOut } from './SessionProvider';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Car,
  Calendar,
  FileText,
  MapPin,
  Wrench,
  Package,
  Megaphone,
  Star,
  Newspaper,
  MessageSquare,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Image,
  FolderTree,
  Globe,
  Edit3,
  Search,
  CreditCard,
  Building2,
  Building,
  Phone,
  Share2,
  Cookie,
  UserCircle2,
  Gauge,
  ClipboardList,
  LayoutGrid,
  PenTool,
  UserCog,
  ShieldCheck,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  Layers,
  ListChecks,
  Palette,
  Images,
  LayoutPanelTop,
  BarChart3,
  ShoppingCart,
  BadgeDollarSign,
  Smile,
  AlertCircle,
  Repeat,
  ScrollText,
  Timer,
  GitBranch,
  Bot,
  BookOpen,
  MessagesSquare,
  Award,
} from 'lucide-react';
import type { AdminPermissions } from '@/types';
import { useTheme } from './ThemeProvider';
import BellNotification from './BellNotification';

interface MenuItem {
  name: string;
  href: string;
  icon: any;
  permission?: string;
  badge?: number;
}

// A labeled cluster of links inside an accordion section (e.g. "Vehicles",
// "Marketing" inside Content Management). `label` is omitted for a section's
// first/only subgroup when the section itself is already specific enough.
interface NavSubgroup {
  label?: string;
  items: MenuItem[];
}

interface NavSection {
  id: string;
  label: string;
  icon: any;
  // Pinned sections render as a single always-visible link (or a couple of
  // links) above the accordion, not as a collapsible group — used for
  // Dashboard and User Management so they read as clearly standalone.
  pinned?: boolean;
  subgroups: NavSubgroup[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
  // Server-provided initial user data so the layout renders immediately
  // without waiting for useSession() to hydrate on the client.
  initialUser?: {
    name: string;
    email: string;
    role: string;
    permissions?: AdminPermissions;
  } | null;
}

const navSections: NavSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    pinned: true,
    subgroups: [
      {
        items: [
          { name: 'Analytics', href: '/admin/analytics', icon: LayoutDashboard, permission: 'canViewReports' },
          { name: 'CRM Dashboard', href: '/admin/crm-dashboard', icon: BarChart3, permission: 'canViewReports' },
          { name: 'Workshop BI', href: '/admin/workshop/bi-dashboard', icon: Gauge, permission: 'canViewReports' },
        ],
      },
    ],
  },
  {
    id: 'users',
    label: 'Manage Users',
    icon: Users,
    pinned: true,
    subgroups: [
      {
        items: [
          { name: 'Manage Users', href: '/admin/users', icon: Users, permission: 'canManageUsers' },
          { name: 'Staff Signatures', href: '/admin/signatures', icon: PenTool, permission: 'canManageUsers' },
        ],
      },
    ],
  },
  {
    id: 'content',
    label: 'Manage Content',
    icon: Globe,
    subgroups: [
      {
        label: 'Website',
        items: [
          { name: 'Manage Pages', href: '/admin/pages', icon: Globe, permission: 'canManageContent' },
          { name: 'Manage Homepage', href: '/admin/content/hero', icon: Image, permission: 'canManageContent' },
          { name: 'Manage Geely Team', href: '/admin/content/geely-team', icon: Users, permission: 'canManageContent' },
          { name: 'Manage Navigation', href: '/admin/site-navigation', icon: Menu, permission: 'canManageContent' },
          { name: 'Manage Settings', href: '/admin/settings', icon: Settings, permission: 'canManageSettings' },
        ],
      },
      {
        label: 'Vehicles',
        items: [
          { name: 'Manage Vehicles', href: '/admin/vehicles', icon: Car, permission: 'canManageVehicles' },
          { name: 'Manage Categories', href: '/admin/categories', icon: FolderTree, permission: 'canManageVehicles' },
          { name: 'Manage Models', href: '/admin/vehicles/models-variants', icon: Layers, permission: 'canManageVehicles' },
          { name: 'Manage Specs', href: '/admin/vehicles/specifications', icon: Gauge, permission: 'canManageVehicles' },
          { name: 'Manage Features', href: '/admin/vehicles/features', icon: ListChecks, permission: 'canManageVehicles' },
          { name: 'Manage Colors', href: '/admin/vehicles/colors', icon: Palette, permission: 'canManageVehicles' },
          { name: 'Manage Gallery', href: '/admin/vehicles/gallery', icon: Images, permission: 'canManageVehicles' },
          { name: 'Manage Sections', href: '/admin/vehicles/sections', icon: LayoutPanelTop, permission: 'canManageVehicles' },
          { name: 'Vehicle Settings', href: '/admin/vehicles/settings', icon: Settings, permission: 'canManageSettings' },
        ],
      },
      {
        label: 'Marketing',
        items: [
          { name: 'Manage Promotions', href: '/admin/promotions', icon: Megaphone, permission: 'canManagePromotions' },
          { name: 'Manage News', href: '/admin/news', icon: Newspaper, permission: 'canManageContent' },
          { name: 'Manage Reviews', href: '/admin/reviews', icon: Star, permission: 'canModerateReviews' },
          { name: 'Manage FAQ', href: '/admin/faq', icon: MessageSquare, permission: 'canManageContent' },
        ],
      },
      {
        label: 'Chatbot',
        items: [
          { name: 'Manage Chatbot', href: '/admin/chatbot', icon: Bot, permission: 'canManageContent' },
          { name: 'Manage Knowledge Base', href: '/admin/chatbot/knowledge', icon: BookOpen, permission: 'canManageContent' },
          { name: 'View Conversations', href: '/admin/chatbot/conversations', icon: MessagesSquare, permission: 'canManageContent' },
        ],
      },
      {
        label: 'Dealers & Parts',
        items: [
          { name: 'Manage Dealers', href: '/admin/dealers', icon: MapPin, permission: 'canViewDealers' },
          { name: 'Manage Parts Content', href: '/admin/parts/content', icon: Edit3, permission: 'canManageSpareParts' },
          { name: 'Manage Parts Categories', href: '/admin/parts/categories', icon: FolderTree, permission: 'canManageSpareParts' },
        ],
      },
      {
        label: 'Sales & Financing',
        items: [
          { name: 'Manage Financing', href: '/admin/financing', icon: CreditCard, permission: 'canManageSettings' },
          { name: 'Manage Purchases', href: '/admin/purchases', icon: FileText, permission: 'canManageContent' },
        ],
      },
      {
        label: 'Company',
        items: [
          { name: 'Manage About Page', href: '/admin/settings/about', icon: UserCircle2, permission: 'canManageContent' },
          { name: 'Manage Business Info', href: '/admin/settings/business-settings', icon: Building, permission: 'canManageSettings' },
          { name: 'Manage Contact Info', href: '/admin/settings/contact-information', icon: Phone, permission: 'canManageSettings' },
          { name: 'Manage Social Media', href: '/admin/settings/social-media', icon: Share2, permission: 'canManageSettings' },
        ],
      },
      {
        label: 'Legal',
        items: [
          { name: 'Manage Policies', href: '/admin/settings/policies', icon: FileText, permission: 'canManageSettings' },
          { name: 'Manage Cookie Banner', href: '/admin/settings/cookie-banner', icon: Cookie, permission: 'canManageSettings' },
        ],
      },
    ],
  },
  {
    id: 'swms',
    label: 'Sales & Workshop',
    icon: Wrench,
    subgroups: [
      {
        label: 'Sales',
        items: [
          { name: 'Manage Test Drives', href: '/admin/test-drives', icon: Calendar, permission: 'canManageTestDrives' },
          { name: 'Manage Quotations', href: '/admin/quotations', icon: FileText, permission: 'canViewQuotations' },
          { name: 'Manage Orders', href: '/admin/orders', icon: ShoppingCart, permission: 'canManageOrders' },
          { name: 'Manage Parts Requests', href: '/admin/parts-requests', icon: FileText, permission: 'canManageSpareParts' },
          { name: 'Manage Messages', href: '/admin/messages', icon: MessageSquare, permission: 'canViewMessages' },
        ],
      },
      {
        label: 'Workshop',
        items: [
          { name: 'Workshop BI', href: '/admin/workshop/bi-dashboard', icon: BarChart3, permission: 'canViewReports' },
          { name: 'Manage Job Cards', href: '/admin/workshop/job-cards', icon: ClipboardList, permission: 'canViewJobCards' },
          { name: 'Manage Customers', href: '/admin/customers', icon: Users, permission: 'canViewCustomers' },
          { name: 'Manage Warranty Claims', href: '/admin/workshop/warranty-claims', icon: ShieldCheck, permission: 'canManageWarrantyClaims' },
          { name: 'Manage Service Bookings', href: '/admin/service-bookings', icon: Wrench, permission: 'canManageService' },
          { name: 'Manage Bay Schedule', href: '/admin/workshop/bays', icon: LayoutGrid, permission: 'canManageBays' },
          { name: 'Manage Technicians', href: '/admin/workshop/technicians', icon: UserCog, permission: 'canManageTechnicians' },
          { name: 'Manage Bays', href: '/admin/workshop/bays/manage', icon: Settings, permission: 'canManageBays' },
          { name: 'Service Check-In', href: '/admin/service-check-in', icon: Wrench, permission: 'canManageServiceBookings' },
        ],
      },
      {
        label: 'Parts & Inventory',
        items: [
          { name: 'Manage Spare Parts', href: '/admin/parts', icon: Package, permission: 'canManageSpareParts' },
        ],
      },
      {
        label: 'CRM & Post-Sales',
        items: [
          { name: 'CRM Dashboard', href: '/admin/crm-dashboard', icon: BarChart3, permission: 'canViewReports' },
          { name: 'Manage Workflow', href: '/admin/workflow', icon: GitBranch, permission: 'canViewReports' },
          { name: 'Manage Commissions', href: '/admin/commissions', icon: BadgeDollarSign, permission: 'canManageOrders' },
          { name: 'Manage Warranty Register', href: '/admin/warranty', icon: ShieldCheck, permission: 'canManageWarrantyClaims' },
          { name: 'Manage Loyalty', href: '/admin/loyalty', icon: Award, permission: 'canManageCustomers' },
          { name: 'Manage Satisfaction', href: '/admin/satisfaction', icon: Smile, permission: 'canManageCustomers' },
          { name: 'Manage Complaints', href: '/admin/complaints', icon: AlertCircle, permission: 'canManageCustomers' },
          { name: 'Manage Repeat Purchase', href: '/admin/repeat-purchase', icon: Repeat, permission: 'canManageCustomers' },
          { name: 'SLA Monitor', href: '/admin/sla', icon: Timer, permission: 'canManageOrders' },
          { name: 'Audit Log', href: '/admin/audit', icon: ScrollText, permission: 'canViewReports' },
        ],
      },
    ],
  },
];

function AdminLayout({ children, initialUser }: AdminLayoutProps) {
  // The context is already seeded server-side (see app/admin/layout.tsx),
  // so this is available on the very first render — no hydration flash.
  const session = useAdminSessionContext();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  // Desktop-only collapse to an icon rail — independent of the mobile
  // open/close overlay above. Persisted so it survives a reload.
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Nav badges keyed by href — proactive alerts (e.g. low-stock parts) that
  // should be visible from anywhere in the admin, not just when someone
  // happens to open that section's own page.
  const [navBadges, setNavBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch('/api/parts/admin/parts/low-stock-count')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.count > 0) setNavBadges((prev) => ({ ...prev, '/admin/parts': data.count }));
      })
      .catch(() => {});
  }, []);

  // "/" focuses the sidebar search, like most professional admin panels —
  // ignored while the user is already typing in a text field.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== '/') return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    const stored = window.localStorage.getItem('admin-sidebar-collapsed');
    if (stored === '1') setCollapsed(true);
  }, []);
  const toggleCollapsed = () => {
    setCollapsed((c) => {
      window.localStorage.setItem('admin-sidebar-collapsed', c ? '0' : '1');
      return !c;
    });
  };

  // Use the hydrated session when available, fall back to server-provided data
  const user = session?.user ?? initialUser;
  const permissions = session?.user?.permissions ?? initialUser?.permissions;

  const matchesItem = (item: MenuItem, q: string) => {
    if (item.permission && permissions) {
      if (!permissions[item.permission as keyof AdminPermissions]) return false;
    }
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.href.toLowerCase().includes(q)
    );
  };

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();

    return navSections
      .map((section) => ({
        ...section,
        subgroups: section.subgroups
          .map((subgroup) => ({
            ...subgroup,
            items: subgroup.items
              .filter((item) => matchesItem(item, q))
              .map((item) => (navBadges[item.href] ? { ...item, badge: navBadges[item.href] } : item)),
          }))
          .filter((subgroup) => subgroup.items.length > 0),
      }))
      .filter((section) => section.subgroups.length > 0);
  }, [query, permissions, navBadges]);

  const activeSectionId = useMemo(() => {
    for (const section of navSections) {
      for (const subgroup of section.subgroups) {
        for (const item of subgroup.items) {
          if (pathname === item.href || pathname.startsWith(item.href + '/')) {
            return section.id;
          }
        }
      }
    }
    return null;
  }, [pathname]);

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  // A section is open if explicitly set, otherwise open only when it's the active section
  const isSectionOpen = (sectionId: string) => {
    if (openSections[sectionId] !== undefined) return openSections[sectionId];
    return sectionId === activeSectionId;
  };

  const isItemActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  // Header breadcrumb: section > subgroup > page, derived from the active nav item.
  const breadcrumb = useMemo(() => {
    for (const section of navSections) {
      for (const subgroup of section.subgroups) {
        for (const item of subgroup.items) {
          if (isItemActive(item.href)) {
            const parts: string[] = [];
            if (section.label !== item.name) parts.push(section.label);
            if (subgroup.label) parts.push(subgroup.label);
            parts.push(item.name);
            return parts;
          }
        }
      }
    }
    return ['Admin'];
  }, [pathname]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !isSectionOpen(sectionId) }));
  };

  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
    setIsNavigating(true);
    const timer = setTimeout(() => setIsNavigating(false), 300);
    return () => clearTimeout(timer);
  }, [pathname]);

  // No user data at all — should not happen since layout.tsx gates on token
  if (!user) return null;

  const handleSignOut = () => {
    signOut({ callbackUrl: '/admin/login' });
  };

  const userRole =
    (user.role as string | undefined)
      ?.replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Administrator';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 ${collapsed ? 'lg:w-20' : 'lg:w-72'} bg-midnight transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-midnight-line/70 bg-midnight/90 shrink-0 backdrop-blur-sm">
          <Link href="/admin/analytics" className="flex items-center gap-3 group min-w-0">
            <div className="w-10 h-10 shrink-0 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-lg shadow-black/20 group-hover:shadow-black/30 transition-all duration-300 group-hover:scale-105">
              <img src="/assets/logos/geely-vertical-logo.svg" alt="Geely" className="w-full h-full object-contain" />
            </div>
            <div className={collapsed ? 'lg:hidden' : ''}>
              <span className="text-white font-bold text-xl leading-none tracking-tight">Geely</span>
              <span className="text-[10px] text-gray-400 block mt-1 tracking-wider uppercase font-semibold">Admin Panel</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-midnight-surface rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-midnight-surface rounded-lg shrink-0"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Search */}
        <div className={`px-4 pt-4 shrink-0 ${collapsed ? 'lg:hidden' : ''}`}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-bright transition-colors" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search menu..."
              className="w-full bg-midnight-surface/70 border border-midnight-line/70 text-sm text-gray-200 placeholder-gray-500 rounded-xl pl-10 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-geely-blue/50 focus:border-geely-blue/50 focus:bg-midnight-surface transition-all"
            />
            {!query && !searchFocused && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-500 border border-midnight-line rounded px-1.5 py-0.5 pointer-events-none">
                /
              </kbd>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="relative flex-1 min-h-0">
          <div className="pointer-events-none absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-midnight to-transparent z-10" />
          <nav className="h-full px-3 py-4 overflow-y-auto scrollbar-thin">
          {query.trim() ? (
            <>
              {filteredSections.map((section) => (
                <div key={section.id} className="mb-1">
                  <div className="px-3 pb-2 pt-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    {section.label}
                  </div>
                  {section.subgroups.flatMap((subgroup) => subgroup.items).map((item) => {
                    const ItemIcon = item.icon;
                    const active = isItemActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-all duration-200 group ${
                          active
                            ? 'bg-geely-blue text-white shadow-lg shadow-geely-blue/20'
                            : 'text-gray-400 hover:bg-midnight-surface hover:text-white'
                        }`}
                      >
                        <ItemIcon className="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        <span className="font-medium truncate text-sm">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}

              {filteredSections.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-gray-500">
                  No menu items match your search.
                </div>
              )}
            </>
          ) : (
            <>
              {/* Pinned links — Dashboard, User Management: always visible, no accordion chrome */}
              <div className="mb-3 space-y-0.5">
                {filteredSections
                  .filter((section) => section.pinned)
                  .flatMap((section) => section.subgroups.flatMap((subgroup) => subgroup.items))
                  .map((item) => {
                    const ItemIcon = item.icon;
                    const active = isItemActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        title={collapsed ? item.name : undefined}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${collapsed ? 'lg:justify-center' : ''} ${
                          active
                            ? 'bg-geely-blue text-white shadow-lg shadow-geely-blue/20'
                            : 'text-gray-300 hover:bg-midnight-surface hover:text-white'
                        }`}
                      >
                        <ItemIcon className="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        <span className={`font-semibold truncate text-sm ${collapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                      </Link>
                    );
                  })}
              </div>
              <div className="h-px bg-midnight-line/70 mx-2 mb-3" />

              {/* Accordion groups — Content Management, SWMS */}
              {filteredSections
                .filter((section) => !section.pinned)
                .map((section) => {
                  const SectionIcon = section.icon;
                  const open = isSectionOpen(section.id);

                  return (
                    <div key={section.id} className="mb-2">
                      <button
                        title={collapsed ? section.label : undefined}
                        onClick={() => {
                          if (collapsed) setCollapsed(false);
                          toggleSection(section.id);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${collapsed ? 'lg:justify-center' : ''} ${
                          open
                            ? 'bg-midnight-surface/80 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-midnight-surface/50'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider">
                          <span className="relative">
                            <SectionIcon className="w-[18px] h-[18px]" />
                            {section.id === activeSectionId && (
                              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-blue-bright shadow-[0_0_4px_rgba(102,163,255,0.8)]" />
                            )}
                          </span>
                          <span className={collapsed ? 'lg:hidden' : ''}>{section.label}</span>
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform duration-200 ${open ? 'rotate-90' : ''} ${collapsed ? 'lg:hidden' : ''}`}
                        />
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ${collapsed ? 'lg:hidden' : ''} ${
                          open ? 'max-h-[2000px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                        }`}
                      >
                        {section.subgroups.map((subgroup, sgIdx) => (
                          <div key={subgroup.label ?? sgIdx}>
                            {subgroup.label && (
                              <div className="px-8 pt-3 pb-1 text-[10px] font-bold text-gray-600 uppercase tracking-widest">
                                {subgroup.label}
                              </div>
                            )}
                            {subgroup.items.map((item) => {
                              const ItemIcon = item.icon;
                              const active = isItemActive(item.href);
                              return (
                                <Link
                                  key={item.href}
                                  href={item.href}
                                  onClick={() => setSidebarOpen(false)}
                                  className={`flex items-center gap-3 pl-8 pr-3 py-2.5 rounded-lg mb-0.5 transition-all duration-200 group relative ${
                                    active
                                      ? 'bg-geely-blue text-white shadow-lg shadow-geely-blue/20'
                                      : 'text-gray-400 hover:bg-midnight-surface/60 hover:text-white'
                                  }`}
                                >
                                  {active && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-bright rounded-r-full shadow-lg shadow-blue-bright/50" />
                                  )}
                                  <ItemIcon className="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                  <span className="font-medium truncate text-sm">{item.name}</span>
                                  {item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto bg-geely-blue text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 shadow-sm">
                                      {item.badge}
                                    </span>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </>
          )}
          </nav>
          <div className="pointer-events-none absolute bottom-0 inset-x-0 h-6 bg-gradient-to-t from-midnight to-transparent z-10" />
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Persistent header — page breadcrumb, theme toggle, site link, user menu */}
        <div className="h-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-3 px-4 sm:px-6 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden -ml-1.5 p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors shrink-0"
            >
              <Menu className="w-5 h-5" />
            </button>
            <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-sm min-w-0 truncate">
              {breadcrumb.map((part, i) => (
                <span key={part} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600 shrink-0" />}
                  <span
                    className={`truncate ${
                      i === breadcrumb.length - 1
                        ? 'text-gray-900 dark:text-gray-100 font-semibold'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {part}
                  </span>
                </span>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <BellNotification />
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              title="View Website"
              className="hidden sm:inline-flex p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <Globe className="w-[18px] h-[18px]" />
            </Link>
            <div className="hidden sm:block w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1" />

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((v) => !v)}
                className="flex items-center gap-2 p-1 pr-1.5 sm:pr-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="w-8 h-8 bg-geely-blue rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden md:block text-left min-w-0">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate max-w-[9rem]">{user.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[9rem]">{userRole}</div>
                </div>
                <ChevronDown className={`hidden md:block w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden">
                    <div className="px-3.5 py-2.5 border-b border-gray-100 dark:border-gray-800">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</div>
                      <div className="mt-1.5 inline-flex items-center px-1.5 py-0.5 rounded-md bg-geely-blue/10 dark:bg-geely-blue/15 text-geely-blue dark:text-blue-bright text-[11px] font-medium">
                        {userRole}
                      </div>
                    </div>
                    <Link
                      href="/"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setUserMenuOpen(false)}
                      className="sm:hidden flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Globe className="w-4 h-4" /> View Website
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {isNavigating && (
            <div className="fixed top-16 left-0 right-0 z-40 h-1 bg-geely-blue animate-pulse" />
          )}
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export { AdminLayout };
export default AdminLayout;
