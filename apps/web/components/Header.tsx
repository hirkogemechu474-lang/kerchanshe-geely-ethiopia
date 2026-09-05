'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Car } from 'lucide-react';
import { MegaMenu, type MenuSection } from './MegaMenu';
import { VehicleDropdown } from './VehicleDropdown';
import type { VehicleRecord } from '@/services/vehicleService';
import { resolveNavIcon, type SiteNavItem } from '@/lib/navIcons';
import { withBasePath } from '@/lib/publicPath';
import { useTranslation } from '@/lib/i18n';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

// A simple, static list of links shown in a compact dropdown card — for nav
// items that are a category label rather than a page of their own (unlike
// Models/After-Sales Services, which have real mega-menus backed by CMS
// data). Href is a non-navigable sentinel (see SPECIAL_NAV_HREFS below).
interface LinkGroup {
  title: string;
  links: { label: string; href: string }[];
}

const LINK_GROUPS: Record<string, LinkGroup> = {
  'shopping-tools': {
    title: 'Shopping Tools',
    links: [
      { label: 'Configurator', href: '/configure' },
      { label: 'Download Brochure', href: '/models' },
      { label: 'Electric vs. Fuel', href: '/ev-vs-fuel' },
      { label: 'Find a Dealer', href: '/dealers' },
      { label: 'Request a Quote', href: '/quote' },
    ],
  },
  owners: {
    title: 'Owners',
    links: [
      { label: 'Manuals & Warranties', href: '/warranty' },
      { label: 'After-Sales Services', href: '/service' },
    ],
  },
};

// href -> special mega-menu/dropdown behavior. Kept as a fixed convention
// rather than admin-editable data — an admin can add/reorder/hide/relabel any
// nav item via /admin/site-navigation, but only these hrefs ever get a
// dropdown attached, matching what the site actually has content systems for.
// '/shopping-tools' and '/owners' are sentinel hrefs (not real pages) that
// only ever trigger the static LINK_GROUPS panel above — see hasLinkGroup.
const SPECIAL_NAV_HREFS: Record<string, { hasDropdown?: boolean; hasSubmenu?: boolean; hasLinkGroup?: keyof typeof LINK_GROUPS; category?: 'models' | 'services' }> = {
  '/models': { hasDropdown: true, category: 'models' },
  '/service': { hasSubmenu: true, category: 'services' },
  '/shopping-tools': { hasLinkGroup: 'shopping-tools' },
  '/owners': { hasLinkGroup: 'owners' },
};

// Matches the seed data in admin/prisma/seed-site-nav.ts — used only as the
// pre-fetch fallback so the header never renders empty before the first load.
const DEFAULT_NAV_ITEMS: SiteNavItem[] = [
  { id: 'models', label: 'Models', href: '/models', icon: null, openInNewTab: false, displayOrder: 1 },
  { id: 'about', label: 'About Geely', href: '/about', icon: null, openInNewTab: false, displayOrder: 2 },
  { id: 'shopping-tools', label: 'Shopping Tools', href: '/shopping-tools', icon: null, openInNewTab: false, displayOrder: 3 },
  { id: 'owners', label: 'Owners', href: '/owners', icon: null, openInNewTab: false, displayOrder: 4 },
  { id: 'media', label: 'Media Center', href: '/news', icon: null, openInNewTab: false, displayOrder: 5 },
  { id: 'test-drive', label: 'Test Drive', href: '/test-drive', icon: null, openInNewTab: false, displayOrder: 6 },
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
  const { t } = useTranslation();
  const [hiddenOnScroll, setHiddenOnScroll] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen]     = useState<string | null>(null);
  const [modelsDropdownOpen, setModelsDropdownOpen] = useState(false);
  const [linkGroupOpen, setLinkGroupOpen]   = useState<keyof typeof LINK_GROUPS | null>(null);

  // Pre-loaded menu data — fetched once, reused on every hover
  const [vehicles, setVehicles]           = useState<VehicleRecord[]>([]);
  const [servicesMenu, setServicesMenu]   = useState<MenuSection[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const prefetched = useRef(false);

  const loadMenuData = () => {
    if (prefetched.current) return;
    prefetched.current = true;

    // Fire all requests in parallel
    Promise.all([
      fetchJSON<{ vehicles: VehicleRecord[] } | VehicleRecord[]>('/api/public/vehicles'),
      fetchJSON<{ sections: MenuSection[] }>('/api/public/services/menu'),
    ]).then(([vehiclesData, servicesData]) => {
      if (vehiclesData) {
        const list = Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.vehicles ?? [];
        setVehicles(list);
      }
      if (servicesData?.sections) setServicesMenu(servicesData.sections);
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

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 24) {
        setHiddenOnScroll(false);
      } else if (currentScrollY > lastScrollY + 4) {
        setHiddenOnScroll(true);
      } else if (currentScrollY < lastScrollY - 4) {
        setHiddenOnScroll(false);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
          hasLinkGroup: special?.hasLinkGroup,
          category: special?.category,
          icon: IconComponent ? <IconComponent size={16} className="shrink-0" /> : null,
        };
      }),
    [siteNavItems]
  );

  const closeAllMenus = () => {
    setMegaMenuOpen(null);
    setModelsDropdownOpen(false);
    setLinkGroupOpen(null);
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
    <header className={`sticky top-0 z-50 border-b border-black/[0.08] bg-white/95 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md transition-transform duration-300 dark:border-midnight-line dark:bg-midnight-surface/95 dark:shadow-none ${hiddenOnScroll ? '-translate-y-full' : 'translate-y-0'}`}>
      <div className="page-container">
        <div className="flex min-h-[64px] flex-wrap items-center justify-between gap-2 py-2 sm:min-h-[84px] sm:gap-4 sm:py-3 lg:flex-nowrap lg:gap-8">
          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center gap-3" onClick={closeAllMenus}>
            <span className="relative h-7 w-14 overflow-hidden sm:h-8 sm:w-[4.5rem]" aria-hidden="true">
              <img
                src={withBasePath('/assets/logos/geely-logo.png')}
                alt=""
                className="absolute inset-0 h-full w-full scale-[4] object-contain transition-opacity group-hover:opacity-70 dark:brightness-0 dark:invert"
              />
            </span>
            <span className="font-display text-[1.25rem] font-bold leading-none tracking-[0.08em] text-black transition-opacity group-hover:opacity-70 dark:text-white sm:text-[1.7rem]">
              GEELY
            </span>
            <span className="sr-only">Geely Ethiopia</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="order-last flex basis-full flex-1 items-center justify-start gap-1 overflow-x-auto whitespace-nowrap pb-1 sm:gap-2 sm:pb-0 lg:order-none lg:basis-auto lg:justify-center lg:overflow-visible">
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
                    setLinkGroupOpen(null);
                  } else if (item.hasSubmenu) {
                    loadMenuData();
                    setMegaMenuOpen(item.category!);
                    setModelsDropdownOpen(false);
                    setLinkGroupOpen(null);
                  } else if (item.hasLinkGroup) {
                    setLinkGroupOpen(item.hasLinkGroup);
                    setModelsDropdownOpen(false);
                    setMegaMenuOpen(null);
                  } else {
                    closeAllMenus();
                  }
                }}
                onMouseLeave={scheduleClose}
              >
                {item.hasDropdown ? (
                  <button
                    className="nav-link flex items-center gap-1.5 px-3 py-3 font-display text-[12.5px] font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:text-active-blue dark:text-ice whitespace-nowrap"
                    onClick={() => {
                      loadMenuData();
                      setModelsDropdownOpen(!modelsDropdownOpen);
                      setMegaMenuOpen(null);
                      setLinkGroupOpen(null);
                    }}
                  >
                    <Car size={15} />
                    {item.label}
                    <ChevronDown
                      size={15}
                      className={`transform transition-transform ${modelsDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : item.hasLinkGroup ? (
                  <button
                    className="nav-link flex items-center gap-1.5 px-3 py-3 font-display text-[12.5px] font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:text-active-blue dark:text-ice whitespace-nowrap"
                    onClick={() => {
                      setLinkGroupOpen(linkGroupOpen === item.hasLinkGroup ? null : item.hasLinkGroup!);
                      setModelsDropdownOpen(false);
                      setMegaMenuOpen(null);
                    }}
                  >
                    {item.label}
                    <ChevronDown
                      size={15}
                      className={`transform transition-transform ${linkGroupOpen === item.hasLinkGroup ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    target={item.openInNewTab ? '_blank' : undefined}
                    rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                    className="nav-link flex items-center gap-1.5 px-3 py-3 font-display text-[12.5px] font-medium uppercase tracking-[0.1em] text-ink transition-colors hover:text-active-blue dark:text-ice whitespace-nowrap"
                    onClick={closeAllMenus}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                )}

                {/* Compact static link-group dropdown (Shopping Tools / Owners) */}
                {item.hasLinkGroup && linkGroupOpen === item.hasLinkGroup && (
                  <div
                    className="absolute left-0 top-full mt-0 min-w-[220px] bg-white dark:bg-midnight-surface shadow-lg border border-line dark:border-midnight-line rounded-lg py-2 z-40"
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  >
                    {LINK_GROUPS[item.hasLinkGroup].links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2.5 text-sm font-medium text-ink dark:text-ice hover:bg-cloud dark:hover:bg-midnight hover:text-active-blue transition-colors"
                        onClick={closeAllMenus}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

        </div>

        {/* Vehicle Dropdown — data already loaded, no spinner */}
        {modelsDropdownOpen && (
          <div
            className="absolute left-0 right-0 bg-white dark:bg-midnight-surface shadow-lg border-t border-line dark:border-midnight-line z-40"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
            <VehicleDropdown
              onClose={() => setModelsDropdownOpen(false)}
              vehicles={vehicles}
              loading={vehiclesLoading}
            />
          </div>
        )}

        {/* Mega Menu — data already loaded, no spinner */}
        {megaMenuOpen && (
          <div
            className="absolute left-0 right-0 bg-white dark:bg-midnight-surface shadow-lg border-t border-line dark:border-midnight-line z-40"
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          >
          <MegaMenu
              category={megaMenuOpen}
              servicesMenu={servicesMenu}
              vehicles={vehicles}
            />
          </div>
        )}
      </div>
    </header>
  );
}
