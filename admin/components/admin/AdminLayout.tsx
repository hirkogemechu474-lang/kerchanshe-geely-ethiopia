'use client';

import { useMemo, useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
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
  Zap,
  FolderTree,
  UtensilsCrossed,
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
  UserCog,
  ShieldCheck,
  Shield,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import type { AdminPermissions } from '@/lib/auth/types';
import { useTheme } from './ThemeProvider';

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
      { items: [{ name: 'Dashboard', href: '/admin/analytics', icon: LayoutDashboard, permission: 'canViewReports' }] },
    ],
  },
  {
    id: 'users',
    label: 'User Management',
    icon: Users,
    pinned: true,
    subgroups: [
      {
        items: [
          { name: 'User Management', href: '/admin/users', icon: Users, permission: 'canManageUsers' },
          { name: 'Roles & Permissions', href: '/admin/users/roles', icon: Shield, permission: 'canManageUsers' },
        ],
      },
    ],
  },
  {
    id: 'content',
    label: 'Content Management',
    icon: Globe,
    subgroups: [
      {
        label: 'Website',
        items: [
          { name: 'All Pages', href: '/admin/pages', icon: Globe, permission: 'canManageContent' },
          { name: 'Homepage', href: '/admin/content/hero', icon: Image, permission: 'canManageContent' },
          { name: 'Header & Navigation', href: '/admin/site-navigation', icon: Menu, permission: 'canManageContent' },
          { name: 'Website Settings', href: '/admin/settings', icon: Settings, permission: 'canManageSettings' },
        ],
      },
      {
        label: 'Vehicles',
        items: [
          { name: 'All Vehicles', href: '/admin/vehicles', icon: Car, permission: 'canManageVehicles' },
          { name: 'Categories', href: '/admin/categories', icon: FolderTree, permission: 'canManageVehicles' },
          { name: 'Vehicle Settings', href: '/admin/vehicles/settings', icon: Settings, permission: 'canManageVehicles' },
        ],
      },
      {
        label: 'Electric',
        items: [
          { name: 'Electric Pages', href: '/admin/electric', icon: Zap, permission: 'canManageContent' },
        ],
      },
      {
        label: 'Services',
        items: [
          { name: 'Services Menu', href: '/admin/services-menu', icon: UtensilsCrossed, permission: 'canManageContent' },
        ],
      },
      {
        label: 'Marketing',
        items: [
          { name: 'Promotions', href: '/admin/promotions', icon: Megaphone, permission: 'canManagePromotions' },
          { name: 'News & Updates', href: '/admin/news', icon: Newspaper, permission: 'canManageContent' },
          { name: 'Customer Reviews', href: '/admin/reviews', icon: Star, permission: 'canModerateReviews' },
          { name: 'FAQ Management', href: '/admin/faq', icon: MessageSquare, permission: 'canManageContent' },
        ],
      },
      {
        label: 'Dealers & Parts',
        items: [
          { name: 'Dealer Locations', href: '/admin/dealers', icon: MapPin, permission: 'canViewDealers' },
          { name: 'Parts Page Content', href: '/admin/parts/content', icon: Edit3, permission: 'canManageSpareParts' },
          { name: 'Parts Categories', href: '/admin/parts/categories', icon: FolderTree, permission: 'canManageSpareParts' },
        ],
      },
      {
        label: 'Sales & Financing',
        items: [
          { name: 'Financing & Payment Banks', href: '/admin/financing', icon: CreditCard, permission: 'canManageSettings' },
          { name: 'Vehicle Purchases', href: '/admin/purchases', icon: FileText, permission: 'canManageContent' },
        ],
      },
      {
        label: 'Company',
        items: [
          { name: 'About Page Content', href: '/admin/settings/about', icon: UserCircle2, permission: 'canManageContent' },
          { name: 'Business Info', href: '/admin/settings/business-settings', icon: Building, permission: 'canManageSettings' },
          { name: 'Contact Information', href: '/admin/settings/contact-information', icon: Phone, permission: 'canManageSettings' },
          { name: 'Social Media', href: '/admin/settings/social-media', icon: Share2, permission: 'canManageSettings' },
        ],
      },
      {
        label: 'Legal',
        items: [
          { name: 'Policies & Legal', href: '/admin/settings/policies', icon: FileText, permission: 'canManageSettings' },
          { name: 'Cookie Banner', href: '/admin/settings/cookie-banner', icon: Cookie, permission: 'canManageSettings' },
        ],
      },
    ],
  },
  {
    id: 'swms',
    label: 'SWMS',
    icon: Wrench,
    subgroups: [
      {
        label: 'Sales',
        items: [
          { name: 'Test Drives', href: '/admin/test-drives', icon: Calendar, permission: 'canManageTestDrives' },
          { name: 'Quote Requests', href: '/admin/quotations', icon: FileText, permission: 'canViewQuotations' },
          { name: 'Parts Requests', href: '/admin/parts-requests', icon: FileText, permission: 'canManageSpareParts' },
          { name: 'Messages', href: '/admin/messages', icon: MessageSquare, permission: 'canViewMessages' },
        ],
      },
      {
        label: 'Service / Workshop',
        items: [
          { name: 'Live Dashboard', href: '/admin/workshop/dashboard', icon: Gauge, permission: 'canViewJobCards' },
          { name: 'Job Cards', href: '/admin/workshop/job-cards', icon: ClipboardList, permission: 'canViewJobCards' },
          { name: 'Warranty Claims', href: '/admin/workshop/warranty-claims', icon: ShieldCheck, permission: 'canViewJobCards' },
          { name: 'Service Bookings', href: '/admin/service-bookings', icon: Wrench, permission: 'canManageService' },
          { name: 'Bay Scheduling Board', href: '/admin/workshop/bays', icon: LayoutGrid, permission: 'canViewJobCards' },
          { name: 'Technicians', href: '/admin/workshop/technicians', icon: UserCog, permission: 'canManageTechnicians' },
          { name: 'Manage Bays', href: '/admin/workshop/bays/manage', icon: Settings, permission: 'canManageBays' },
        ],
      },
      {
        label: 'Parts & Inventory',
        items: [
          { name: 'Spare Parts', href: '/admin/parts', icon: Package, permission: 'canManageSpareParts' },
        ],
      },
    ],
  },
];

function AdminLayout({ children, initialUser }: AdminLayoutProps) {
  // useSession() for client-side reactivity (sign-out, token refresh, etc.)
  // but we fall back to initialUser for the first render so the sidebar is
  // visible immediately — before useSession() finishes hydrating.
  const { data: session } = useSession();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);
  // Desktop-only collapse to an icon rail — independent of the mobile
  // open/close overlay above. Persisted so it survives a reload.
  const [collapsed, setCollapsed] = useState(false);
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
    // When permissions are not yet available, show all items
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
          .map((subgroup) => ({ ...subgroup, items: subgroup.items.filter((item) => matchesItem(item, q)) }))
          .filter((subgroup) => subgroup.items.length > 0),
      }))
      .filter((section) => section.subgroups.length > 0);
  }, [query, permissions]);

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

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({ ...prev, [sectionId]: !isSectionOpen(sectionId) }));
  };

  useEffect(() => {
    setSidebarOpen(false);
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
        className={`fixed inset-y-0 left-0 z-50 w-72 ${collapsed ? 'lg:w-20' : 'lg:w-72'} bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 transform transition-all duration-300 ease-in-out flex flex-col shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/70 bg-slate-950/90 shrink-0 backdrop-blur-sm">
          <Link href="/admin/analytics" className="flex items-center gap-3 group min-w-0">
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div className={collapsed ? 'lg:hidden' : ''}>
              <span className="text-white font-bold text-xl leading-none tracking-tight">Geely</span>
              <span className="text-[10px] text-gray-400 block mt-1 tracking-wider uppercase font-semibold">Admin Panel</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            onClick={toggleCollapsed}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex text-gray-400 hover:text-white transition-colors p-1.5 hover:bg-slate-800 rounded-lg shrink-0"
          >
            {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Search */}
        <div className={`px-4 pt-4 shrink-0 ${collapsed ? 'lg:hidden' : ''}`}>
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu..."
              className="w-full bg-slate-800/70 border border-slate-700/70 text-sm text-gray-200 placeholder-gray-500 rounded-xl pl-10 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 focus:bg-slate-800 transition-all"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
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
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'text-gray-400 hover:bg-slate-800 hover:text-white'
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
                            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                            : 'text-gray-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <ItemIcon className="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        <span className={`font-semibold truncate text-sm ${collapsed ? 'lg:hidden' : ''}`}>{item.name}</span>
                      </Link>
                    );
                  })}
              </div>
              <div className="h-px bg-slate-800/70 mx-2 mb-3" />

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
                            ? 'bg-slate-800/80 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-slate-800/50'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider">
                          <SectionIcon className="w-[18px] h-[18px]" />
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
                                      ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/20'
                                      : 'text-gray-400 hover:bg-slate-800/60 hover:text-white'
                                  }`}
                                >
                                  {active && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-r-full shadow-lg shadow-blue-400/50" />
                                  )}
                                  <ItemIcon className="w-[18px] h-[18px] flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />
                                  <span className="font-medium truncate text-sm">{item.name}</span>
                                  {item.badge !== undefined && item.badge > 0 && (
                                    <span className="ml-auto bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 shadow-sm">
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

        {/* Sidebar Footer */}
        <div className="px-3 pb-4 shrink-0 border-t border-slate-800/70 pt-4 bg-slate-950/50">
          <div className={`flex items-center gap-3 px-2 py-2 rounded-lg ${collapsed ? 'lg:justify-center' : ''}`}>
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shrink-0">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className={`min-w-0 flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
              <div className="text-sm font-semibold text-gray-100 truncate">{user.name}</div>
              <div className="text-xs text-gray-500 truncate">{userRole}</div>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className={`p-2 text-gray-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors ${collapsed ? 'lg:hidden' : ''}`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className={`mt-1 w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-slate-800 hover:text-white transition-colors ${collapsed ? 'lg:justify-center' : ''}`}
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px] flex-shrink-0" /> : <Moon className="w-[18px] h-[18px] flex-shrink-0" />}
            <span className={`font-medium text-sm ${collapsed ? 'lg:hidden' : ''}`}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            title={collapsed ? 'View Website' : undefined}
            className={`mt-1 flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:bg-slate-800 hover:text-white transition-colors group ${collapsed ? 'lg:justify-center' : ''}`}
          >
            <Globe className="w-[18px] h-[18px] flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span className={`font-medium text-sm ${collapsed ? 'lg:hidden' : ''}`}>View Website</span>
            <span className={`ml-auto text-xs text-gray-600 ${collapsed ? 'lg:hidden' : ''}`}>↗</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
        {/* Mobile-only menu control; desktop pages use the persistent sidebar. */}
        <div className="lg:hidden h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-5 sticky top-0 z-30 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="inline-flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Menu className="w-6 h-6" />
            <span className="text-sm font-semibold">Admin menu</span>
          </button>
        </div>

        {/* Page Content */}
        <main className="p-6">
          {isNavigating && (
            <div className="fixed top-16 left-0 right-0 z-40 h-1 bg-blue-600 animate-pulse" />
          )}
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export { AdminLayout };
export default AdminLayout;
