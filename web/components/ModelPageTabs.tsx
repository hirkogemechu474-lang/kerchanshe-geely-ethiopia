'use client';

import { useState, useEffect } from 'react';
import { Camera, Settings, RotateCw, Star, Sliders } from 'lucide-react';

const TABS = [
  { id: 'overview',     label: 'Overview',       icon: Star,     href: '#section-overview' },
  { id: 'gallery',      label: 'Gallery',        icon: Camera,   href: '#section-gallery' },
  { id: 'configurator', label: 'Build & Price',  icon: Sliders,  href: '#section-configurator' },
  { id: 'specs',        label: 'Specifications', icon: Settings, href: '#section-specs' },
  { id: '360',          label: '360° View',      icon: RotateCw, href: '#section-360' },
];

export function ModelPageTabs() {
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
    <div className="sticky top-16 z-40 bg-white border-b border-line shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id || activeTab === tab.href.replace('#section-', '');
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`
                  flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap
                  border-b-2 transition-all duration-200
                  ${isActive
                    ? 'border-geely-blue text-geely-blue'
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
      </div>
    </div>
  );
}
