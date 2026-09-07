'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDown, Menu } from 'lucide-react';
import { MegaMenu, type MenuSection } from './MegaMenu';
import { VehicleDropdown } from './VehicleDropdown';
import type { VehicleRecord } from '@/services/vehicleService';
import { resolveNavIcon, type SiteNavItem } from '@/lib/navIcons';
import { withBasePath } from '@/lib/publicPath';
import { useTranslation } from '@/lib/i18n';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  // True only on the home page, where a full-bleed hero sits directly under
  // the header (see HeroSection). The header floats transparent/white over
  // it and turns solid on scroll or once a menu opens, matching
  // geelyauto.co.za. Every other page keeps the plain sticky solid header.
  overlay?: boolean;
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

export function Header({ onMobileMenuToggle = () => {}, overlay = false }: HeaderProps) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
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
    const handleScroll = () => setScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Transparent-over-hero only while the overlay page is at rest, unscrolled
  // and with no menu open — a solid bar reads better under an open dropdown.
  const transparent = overlay && !scrolled && !modelsDropdownOpen && !megaMenuOpen && !linkGroupOpen;
  const tone = transparent ? 'text-white' : 'text-ink dark:text-ice';

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

  // Split evenly so the logo sits as the true center column on desktop —
  // matches geelyauto.co.za's centered-logo, split-nav header.
  const half = Math.ceil(mainNavItems.length / 2);
  const leftNavItems = mainNavItems.slice(0, half);
  const rightNavItems = mainNavItems.slice(half);

  const renderNavItem = (item: (typeof mainNavItems)[number]) => (
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
          className={`nav-link flex items-center gap-1.5 px-3 py-3 font-display text-[16px] font-medium transition-colors whitespace-nowrap ${tone}`}
          onClick={() => {
            loadMenuData();
            setModelsDropdownOpen(!modelsDropdownOpen);
            setMegaMenuOpen(null);
            setLinkGroupOpen(null);
          }}
        >
          {item.label}
          <ChevronDown
            size={15}
            className={`transform transition-transform ${modelsDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>
      ) : item.hasLinkGroup ? (
        <button
          className={`nav-link flex items-center gap-1.5 px-3 py-3 font-display text-[16px] font-medium transition-colors whitespace-nowrap ${tone}`}
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
          className={`nav-link flex items-center gap-1.5 px-3 py-3 font-display text-[16px] font-medium transition-colors whitespace-nowrap ${tone}`}
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
  );

  return (
    <header
      className={`${overlay ? 'fixed' : 'sticky'} top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300 ${
        transparent
          ? 'border-transparent bg-transparent shadow-none'
          : 'border-black/[0.08] bg-white/95 shadow-[0_4px_20px_rgba(0,0,0,0.05)] backdrop-blur-md dark:border-midnight-line dark:bg-midnight-surface/95 dark:shadow-none'
      }`}
    >
      <div className="page-container">
        <div className="flex min-h-[64px] flex-wrap items-center justify-between gap-2 py-2 sm:min-h-[84px] sm:gap-4 sm:py-3 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:flex-nowrap lg:items-center lg:gap-8">
          {/* Left nav — desktop only; centers the logo as the middle column,
              matching geelyauto.co.za's split-nav layout. */}
          <nav className="hidden items-center gap-1 lg:flex lg:gap-2 lg:justify-self-start">
            {leftNavItems.map(renderNavItem)}
          </nav>

          {/* Logo — centered column on desktop, left-aligned on mobile */}
          <Link href="/" className="group flex shrink-0 items-center gap-3 lg:justify-self-center" onClick={closeAllMenus}>
            <span className="relative h-8 w-16 overflow-hidden sm:h-9 sm:w-[5rem]" aria-hidden="true">
              <img
                src={withBasePath('/assets/logos/geely-logo.png')}
                alt=""
                className={`absolute inset-0 h-full w-full scale-[4] object-contain transition-opacity group-hover:opacity-70 ${transparent ? 'brightness-0 invert' : 'dark:brightness-0 dark:invert'}`}
              />
            </span>
            <span className={`font-display text-[1.4rem] font-bold leading-none tracking-[0.08em] transition-opacity group-hover:opacity-70 sm:text-[1.9rem] ${transparent ? 'text-white' : 'text-black dark:text-white'}`}>
              GEELY
            </span>
            <span className="sr-only">Geely Ethiopia</span>
          </Link>

          {/* Right nav + hamburger — hamburger opens MobileDrawer below lg,
              where the desktop nav is hidden so nothing scrolls horizontally. */}
          <div className="flex items-center gap-2 lg:justify-self-end lg:gap-8">
            <nav className="hidden items-center gap-1 lg:flex lg:gap-2">
              {rightNavItems.map(renderNavItem)}
            </nav>
            <button
              type="button"
              onClick={onMobileMenuToggle}
              aria-label="Open menu"
              className={`flex shrink-0 items-center justify-center p-2 lg:hidden ${tone}`}
            >
              <Menu size={26} />
            </button>
          </div>
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
