'use client';

import { useState, useEffect } from 'react';
import { Camera, Settings, RotateCw, Star, ShieldCheck } from 'lucide-react';
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
    const el = document.querySelector(tab.href);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={`sticky z-40 border-b border-black/[0.08] bg-white shadow-sm transition-[top] duration-300 dark:border-midnight-line dark:bg-midnight-surface ${headerHidden ? 'top-0' : 'top-[108px] sm:top-[116px] lg:top-[84px]'}`}>
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-3 sm:gap-6 sm:px-4 md:px-8 lg:gap-10">
        <a href="#section-overview" className="disp shrink-0 truncate py-5 text-base font-extrabold uppercase tracking-[0.04em] text-black dark:text-white max-[380px]:max-w-[80px] sm:max-w-none sm:text-xl lg:text-2xl">
          {vehicleName}
        </a>
        <div className="flex min-w-0 flex-1 items-center justify-between overflow-x-auto scrollbar-hide sm:justify-start sm:gap-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || activeTab === tab.href.replace('#section-', '');
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                title={tab.label}
                className={`
                  flex items-center justify-center gap-2 px-1.5 py-5 text-sm font-semibold whitespace-nowrap
                  border-b-2 transition-all duration-200
                  sm:px-4
                  ${isActive
                    ? 'border-active-blue text-active-blue'
                    : 'border-transparent text-steel hover:text-navy hover:border-line'
                  }
                `}
              >
                <Icon size={15} className="shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
        <Button href={testDriveHref} variant="solid" size="md" className="hidden shrink-0 uppercase lg:inline-flex">
          Schedule Test Drive
        </Button>
      </div>
    </div>
  );
}
