'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Menu, User, ChevronDown, Car } from 'lucide-react';
import { MegaMenu, type MenuSection } from './MegaMenu';
import { VehicleDropdown } from './VehicleDropdown';
import type { VehicleRecord } from '@/lib/vehicleData';
import { resolveNavIcon, type SiteNavItem } from '@/lib/navIcons';
import { withBasePath } from '@/lib/publicPath';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

// href -> special mega-menu/dropdown behavior. Kept as a fixed convention
// rather than admin-editable data — an admin can add/reorder/hide/relabel any
// nav item via /admin/site-navigation, but only these three hrefs ever get a
// dropdown attached, matching what the site actually has content systems for.
const SPECIAL_NAV_HREFS: Record<string, { hasDropdown?: boolean; hasSubmenu?: boolean; category?: 'models' | 'electric' | 'services' }> = {
  '/models': { hasDropdown: true, category: 'models' },
  '/electric': { hasSubmenu: true, category: 'electric' },
  '/service': { hasSubmenu: true, category: 'services' },
};

// Matches the seed data in admin/prisma/seed-site-nav.ts — used only as the
// pre-fetch fallback so the header never renders empty before the first load.
const DEFAULT_NAV_ITEMS: SiteNavItem[] = [
  { id: 'models', label: 'Models', href: '/models', icon: null, openInNewTab: false, displayOrder: 1 },
  { id: 'electric', label: 'Electric', href: '/electric', icon: 'Zap', openInNewTab: false, displayOrder: 2 },
  { id: 'technology', label: 'Technology', href: '/technology', icon: null, openInNewTab: false, displayOrder: 3 },
  { id: 'services', label: 'Services', href: '/service', icon: null, openInNewTab: false, displayOrder: 4 },
  { id: 'dealers', label: 'Dealers', href: '/dealers', icon: null, openInNewTab: false, displayOrder: 5 },
  { id: 'showroom', label: 'Showroom', href: '/visit/start', icon: 'MapPin', openInNewTab: false, displayOrder: 6 },
  { id: 'financing', label: 'Financing', href: '/financing', icon: null, openInNewTab: false, displayOrder: 7 },
  { id: 'news', label: 'News', href: '/news', icon: null, openInNewTab: false, displayOrder: 8 },
  { id: 'about', label: 'About', href: '/about', icon: null, openInNewTab: false, displayOrder: 9 },
];

// ─── Pre-fetch helper ─────────────────────────────────────────────────────────
// Fetch once at Header mount so every dropdown opens instantly.

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Header({ onMobileMenuToggle = () => {} }: HeaderProps) {
  const [megaMenuOpen, setMegaMenuOpen]     = useState<string | null>(null);
  const [modelsDropdownOpen, setModelsDropdownOpen] = useState(false);

  // Pre-loaded menu data — fetched once, reused on every hover
  const [vehicles, setVehicles]           = useState<VehicleRecord[]>([]);
  const [servicesMenu, setServicesMenu]   = useState<MenuSection[]>([]);
  const [electricMenu, setElectricMenu]   = useState<MenuSection[]>([]);
  const [quickActions, setQuickActions]   = useState<SiteNavItem[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const prefetched = useRef(false);

  const loadMenuData = () => {
    if (prefetched.current) return;
    prefetched.current = true;

    // Fire all requests in parallel
    Promise.all([
      fetchJSON<{ vehicles: VehicleRecord[] } | VehicleRecord[]>('/api/public/vehicles'),
      fetchJSON<{ sections: MenuSection[] }>('/api/public/services/menu'),
      fetchJSON<{ sections: MenuSection[] }>('/api/public/electric/menu'),
      fetchJSON<{ items: SiteNavItem[] }>('/api/public/site-nav?placement=MODELS_QUICK_ACTIONS'),
    ]).then(([vehiclesData, servicesData, electricData, quickActionsData]) => {
      if (vehiclesData) {
        const list = Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.vehicles ?? [];
        setVehicles(list);
      }
      if (servicesData?.sections) setServicesMenu(servicesData.sections);
      if (electricData?.sections)  setElectricMenu(electricData.sections);
      if (quickActionsData?.items) setQuickActions(quickActionsData.items);
      setVehiclesLoading(false);
    });
  };

  // Admin-editable via /admin/site-navigation — starts from the fallback so
  // the header never renders empty before the first fetch resolves.
  const [siteNavItems, setSiteNavItems] = useState<SiteNavItem[]>(DEFAULT_NAV_ITEMS);

  useEffect(() => {
    fetchJSON<{ items: SiteNavItem[] }>('/api/public/site-nav?placement=TOP_NAV')
      .then((data) => { if (data?.items?.length) setSiteNavItems(data.items); });
  }, []);

  const mainNavItems = React.useMemo(
    () =>
      siteNavItems.map((item) => {
        const special = SPECIAL_NAV_HREFS[item.href];
        const IconComponent = resolveNavIcon(item.icon);
        return {
          label: item.label,
          href: item.href,
          openInNewTab: item.openInNewTab,
          hasDropdown: special?.hasDropdown,
          hasSubmenu: special?.hasSubmenu,
          category: special?.category,
          icon: IconComponent ? <IconComponent size={16} className="shrink-0" /> : null,
        };
      }),
    [siteNavItems]
  );

  const closeAllMenus = () => {
    setMegaMenuOpen(null);
    setModelsDropdownOpen(false);
  };

  // Keep dropdown open while mouse moves between nav item and panel
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => {
    leaveTimer.current = setTimeout(closeAllMenus, 120);
  };

  const cancelClose = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
  };

  return (
    <header className="bg-white border-b border-line sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-4">
        <div className="flex items-center justify-between gap-3 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" onClick={closeAllMenus}>
            <img
              src={withBasePath('/assets/logos/geely-vertical-logo.svg')}
              alt="Geely"
              className="w-9 h-9 rounded-lg object-contain shadow-sm group-hover:shadow-md transition-shadow"
            />
            <div className="leading-none">
              <div className="text-[19px] font-display font-extrabold tracking-tight text-navy">GEELY</div>
              <div className="text-[9px] font-display font-bold tracking-[0.3em] text-geely-blue mt-1">
                ETHIOPIA
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1 whitespace-nowrap">
            {mainNavItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => {
                  cancelClose();
                  if (item.hasDropdown) {
                    loadMenuData();
                    setModelsDropdownOpen(true);
                    setMegaMenuOpen(null);
                  } else if (item.hasSubmenu) {
                    loadMenuData();
                    setMegaMenuOpen(item.category!);
                    setModelsDropdownOpen(false);
                  } else {
                    closeAllMenus();
                  }
                }}
                onMouseLeave={scheduleClose}
              >
                {item.hasDropdown ? (
                  <button
                    className="nav-link flex items-center gap-1.5 text-ink hover:text-geely-blue font-display font-semibold text-[13px] uppercase tracking-[0.06em] px-3 py-2 transition-colors whitespace-nowrap"
                    onClick={() => {
                      loadMenuData();
                      setModelsDropdownOpen(!modelsDropdownOpen);
                      setMegaMenuOpen(null);
                    }}
                  >
                    <Car size={15} />
                    {item.label}
                    <ChevronDown
                      size={15}
                      className={`transform transition-transform ${modelsDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    target={item.openInNewTab ? '_blank' : undefined}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="nav-link flex items-center gap-1.5 text-ink hover:text-geely-blue font-display font-semibold text-[13px] uppercase tracking-[0.06em] px-3 py-2 transition-colors whitespace-nowrap"
                    onClick={closeAllMenus}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <Link href="/login" aria-label="Log in" className="hidden md:flex items-center gap-2 text-steel hover:text-navy p-2 -m-2">
              <User size={18} />
            </Link>

            {/* Search, language, Get Quote, and Book Test Drive live in the
                drawer behind this button (see MobileDrawer) — kept off the
                persistent header bar at every screen size. */}
            <button onClick={onMobileMenuToggle} aria-label="Open menu" className="text-navy p-2">
              <Menu size={24} />
            </button>
          </div>
        </div>

        {/* Vehicle Dropdown — data already loaded, no spinner */}
        {modelsDropdownOpen && (
          <div
            className="absolute left-0 right-0 bg-white shadow-lg border-t border-line z-40"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <VehicleDropdown
              onClose={() => setModelsDropdownOpen(false)}
              vehicles={vehicles}
              loading={vehiclesLoading}
              quickActions={quickActions}
            />
          </div>
        )}

        {/* Mega Menu — data already loaded, no spinner */}
        {megaMenuOpen && (
          <div
            className="absolute left-0 right-0 bg-white shadow-lg border-t border-line z-40"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
          <MegaMenu
              category={megaMenuOpen}
              servicesMenu={servicesMenu}
              electricMenu={electricMenu}
              vehicles={vehicles}
            />
          </div>
        )}
      </div>
    </header>
  );
}
