'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Menu, Search, User, ChevronDown, Car, Zap } from 'lucide-react';
import { MegaMenu, type MenuSection } from './MegaMenu';
import { VehicleDropdown } from './VehicleDropdown';
import { SearchModal } from './SearchModal';
import { useTranslation } from '@/lib/i18n';
import type { VehicleRecord } from '@/lib/vehicleData';

interface HeaderProps {
  onMobileMenuToggle?: () => void;
}

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
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const { t } = useTranslation();

  // Pre-loaded menu data — fetched once, reused on every hover
  const [vehicles, setVehicles]           = useState<VehicleRecord[]>([]);
  const [servicesMenu, setServicesMenu]   = useState<MenuSection[]>([]);
  const [electricMenu, setElectricMenu]   = useState<MenuSection[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const prefetched = useRef(false);

  const loadMenuData = () => {
    if (prefetched.current) return;
    prefetched.current = true;

    // Fire all three requests in parallel
    Promise.all([
      fetchJSON<{ vehicles: VehicleRecord[] } | VehicleRecord[]>('/api/public/vehicles'),
      fetchJSON<{ sections: MenuSection[] }>('/api/public/services/menu'),
      fetchJSON<{ sections: MenuSection[] }>('/api/public/electric/menu'),
    ]).then(([vehiclesData, servicesData, electricData]) => {
      if (vehiclesData) {
        const list = Array.isArray(vehiclesData) ? vehiclesData : vehiclesData.vehicles ?? [];
        setVehicles(list);
      }
      if (servicesData?.sections) setServicesMenu(servicesData.sections);
      if (electricData?.sections)  setElectricMenu(electricData.sections);
      setVehiclesLoading(false);
    });
  };

  // Define nav items in useMemo to prevent recreation and hydration issues
  const mainNavItems = React.useMemo(() => [
    {
      label: t('common.models'),
      href: '/models',
      hasDropdown: true,
      category: 'models' as const,
    },
    {
      label: t('common.electric'),
      href: '/electric',
      hasSubmenu: true,
      category: 'electric' as const,
      icon: <Zap size={16} className="text-green-600" />,
    },
    {
      label: 'Technology',
      href: '/technology',
    },
    {
      label: 'Services',
      href: '/service',
      hasSubmenu: true,
      category: 'services' as const,
    },
    { label: t('common.dealers'),   href: '/dealers' },
    { label: t('common.financing'), href: '/financing' },
    { label: t('common.news'),      href: '/news' },
    { label: 'About',               href: '/about' },
  ], [t]);

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
        <div className="flex flex-wrap items-center justify-between gap-4 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={closeAllMenus}>
            <div className="text-2xl font-bold text-navy">GEELY</div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex flex-1 items-center gap-3 text-sm min-w-0 overflow-x-auto whitespace-nowrap py-1">
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
                    className="flex items-center gap-1 text-navy hover:text-geely-blue font-semibold px-3 py-2 transition-colors whitespace-nowrap"
                    onClick={() => {
                      loadMenuData();
                      setModelsDropdownOpen(!modelsDropdownOpen);
                      setMegaMenuOpen(null);
                    }}
                  >
                    <Car size={16} />
                    {item.label}
                    <ChevronDown
                      size={16}
                      className={`transform transition-transform ${modelsDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className="flex items-center gap-1 text-navy hover:text-geely-blue font-semibold px-3 py-2 transition-colors whitespace-nowrap"
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
            <button
              onClick={() => setSearchModalOpen(true)}
              className="hidden md:flex items-center gap-2 text-steel hover:text-navy"
            >
              <Search size={18} />
            </button>

            <Link href="/login" className="hidden md:flex items-center gap-2 text-steel hover:text-navy">
              <User size={18} />
            </Link>

            <Link
              href="/quote"
              className="inline-flex h-10 sm:min-w-[150px] items-center justify-center bg-gold text-navy px-3 sm:px-5 rounded-lg font-semibold text-xs sm:text-sm hover:bg-opacity-90 transition-colors"
              onClick={closeAllMenus}
            >
              {t('common.getQuote')}
            </Link>

            <Link
              href="/test-drive"
              className="inline-flex h-10 sm:min-w-[150px] items-center justify-center bg-navy text-white px-3 sm:px-5 rounded-lg font-semibold text-xs sm:text-sm hover:bg-opacity-90 transition-colors"
              onClick={closeAllMenus}
            >
              {t('common.bookTestDrive')}
            </Link>

            <button onClick={onMobileMenuToggle} className="lg:hidden text-navy p-2">
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

      <SearchModal isOpen={searchModalOpen} onClose={() => setSearchModalOpen(false)} />
    </header>
  );
}
