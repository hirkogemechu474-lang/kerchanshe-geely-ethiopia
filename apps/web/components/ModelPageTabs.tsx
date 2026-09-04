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

  // Highlight the tab whose section is in the viewport
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
    <div className="sticky top-[108px] z-40 border-b border-black/[0.08] bg-white shadow-sm dark:border-midnight-line dark:bg-midnight-surface sm:top-[116px] lg:top-[84px]">
      <div className="mx-auto flex max-w-[1440px] items-center gap-6 px-4 md:px-8 lg:gap-10">
        <a href="#section-overview" className="disp shrink-0 py-5 text-xl font-extrabold uppercase tracking-[0.04em] text-black dark:text-white sm:text-2xl">
          {vehicleName}
        </a>
        <div className="flex min-w-0 flex-1 items-center gap-0 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || activeTab === tab.href.replace('#section-', '');
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`
                  flex items-center gap-2 px-4 py-5 text-sm font-semibold whitespace-nowrap
                  border-b-2 transition-all duration-200
                  ${isActive
                    ? 'border-active-blue text-active-blue'
                    : 'border-transparent text-steel hover:text-navy hover:border-line'
                  }
                `}
              >
                <Icon size={15} />
                {tab.label}
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
