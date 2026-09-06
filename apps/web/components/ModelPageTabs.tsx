'use client';

import { useState, useEffect } from 'react';
import { Camera, Settings, RotateCw, Star, ShieldCheck, Menu, X } from 'lucide-react';
import Button from '@/components/ui/Button';

// Ordered to match the anchor-nav pattern on Geely's regional model pages
// (e.g. geely.com.eg/models/gx3-pro): Overview → 360° → Gallery → Specs,
// with our own Build & Price configurator kept at the end as an addition.
const TABS = [
  { id: 'overview', label: 'Overview', icon: Star, href: '#section-overview' },
  { id: '360', label: '360°', icon: RotateCw, href: '#section-360' },
  { id: 'exteriors', label: 'Exteriors', icon: Camera, href: '#section-exteriors' },
  { id: 'interiors', label: 'Interiors', icon: Camera, href: '#section-options' },
  { id: 'safety', label: 'Safety', icon: ShieldCheck, href: '#section-safety' },
  { id: 'specs', label: 'Technical Specs', icon: Settings, href: '#section-specs' },
];

export function ModelPageTabs({ vehicleName, testDriveHref }: { vehicleName: string; testDriveHref: string }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [headerHidden, setHeaderHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Below `lg` the tab row collapses into a toggle that opens a slide-in
  // sidebar drawer (same pattern as the admin panel's mobile nav) — six
  // icon-only buttons crammed into one horizontal scroller reads as
  // cramped/unpolished on tablet and phone widths, so that layout is now
  // `lg`-and-up only.

  // Lock body scroll while the drawer is open, same as a standard mobile nav.
  useEffect(() => {
    if (!menuOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prevOverflow; };
  }, [menuOpen]);

  // Highlight the tab whose section is in the viewport
  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= 24) setHeaderHidden(false);
      else if (currentScrollY > lastScrollY + 4) setHeaderHidden(true);
      else if (currentScrollY < lastScrollY - 4) setHeaderHidden(false);
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const sectionIds = TABS.map((t) => t.href.replace('#', ''));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveTab(entry.target.id.replace('section-', ''));
          }
        }
      },
      { rootMargin: '-30% 0px -60% 0px' }
    );

    sectionIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleTabClick = (tab: typeof TABS[number]) => {
    setActiveTab(tab.id);
    setMenuOpen(false);
    const el = document.querySelector(tab.href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeLabel = TABS.find((t) => t.id === activeTab || activeTab === t.href.replace('#section-', ''))?.label ?? 'Sections';

  return (
    <div
      className={`sticky z-40 border-b border-black/[0.08] bg-white shadow-sm transition-[top] duration-300 dark:border-midnight-line dark:bg-midnight-surface ${headerHidden ? 'top-0' : 'top-[108px] sm:top-[116px] lg:top-[84px]'}`}
    >
      {/* Compact bar: vehicle name + a "Sections" toggle on tablet/phone, full tab row from `lg` up */}
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 sm:gap-4 sm:px-4 md:px-8 lg:gap-10">
        <a href="#section-overview" className="disp shrink-0 truncate py-5 text-base font-extrabold uppercase tracking-[0.04em] text-black dark:text-white max-[380px]:max-w-[110px] sm:max-w-none sm:text-xl lg:text-2xl">
          {vehicleName}
        </a>

        {/* lg+: original horizontal tab row */}
        <div className="hidden min-w-0 flex-1 items-center gap-0 lg:flex">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || activeTab === tab.href.replace('#section-', '');
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                title={tab.label}
                className={`
                  flex items-center justify-center gap-2 px-4 py-5 text-sm font-semibold whitespace-nowrap
                  border-b-2 transition-all duration-200
                  ${isActive
                    ? 'border-active-blue text-active-blue'
                    : 'border-transparent text-steel hover:text-navy hover:border-line'
                  }
                `}
              >
                <Icon size={15} className="shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
        <Button href={testDriveHref} variant="solid" size="md" className="hidden shrink-0 uppercase lg:inline-flex">
          Schedule Test Drive
        </Button>

        {/* Below lg: compact toggle that opens the sidebar drawer */}
        <button
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="model-tabs-mobile-panel"
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border border-line py-2 pl-3 pr-2.5 text-sm font-semibold text-navy transition-colors dark:border-midnight-line dark:text-ice lg:hidden"
        >
          <span className="max-w-[92px] truncate sm:max-w-none">{activeLabel}</span>
          {menuOpen ? <X size={16} className="shrink-0" /> : <Menu size={16} className="shrink-0" />}
        </button>
      </div>

      {/* Below lg: backdrop + slide-in sidebar drawer (mirrors the admin panel's mobile nav) */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />
      <div
        id="model-tabs-mobile-panel"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80vw] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out dark:bg-midnight-surface lg:hidden ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-black/[0.08] px-4 py-4 dark:border-midnight-line">
          <span className="truncate text-sm font-extrabold uppercase tracking-[0.04em] text-navy dark:text-ice">{vehicleName}</span>
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close sections menu"
            className="shrink-0 rounded-lg p-1.5 text-steel transition-colors hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="flex flex-col divide-y divide-black/[0.06] dark:divide-midnight-line">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id || activeTab === tab.href.replace('#section-', '');
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab)}
                  className={`flex items-center gap-3 py-3.5 text-left text-[15px] font-semibold transition-colors ${
                    isActive ? 'text-active-blue' : 'text-navy dark:text-ice'
                  }`}
                >
                  <Icon size={18} className={`shrink-0 ${isActive ? 'text-active-blue' : 'text-steel'}`} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="shrink-0 border-t border-black/[0.08] px-3 py-4 dark:border-midnight-line">
          <Button href={testDriveHref} variant="solid" size="md" className="w-full justify-center uppercase">
            Schedule Test Drive
          </Button>
        </div>
      </div>
    </div>
  );
}
