'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Car, Zap, Settings } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { VehicleRecord } from '@/lib/vehicleData';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ServiceItem {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  url: string | null;
  isFeatured: boolean;
}

export interface MenuSection {
  id: string;
  title: string;
  slug: string;
  items: ServiceItem[];
}

interface MegaMenuProps {
  category: string;
  /** Pre-loaded services menu data passed from Header */
  servicesMenu?: MenuSection[];
  /** Pre-loaded vehicles data passed from Header (for dynamic models menu) */
  vehicles?: VehicleRecord[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getIcon(iconName: string | null, className = 'text-geely-blue') {
  if (!iconName) return <Car size={20} className={className} />;
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ size?: number; className?: string }>>)[iconName];
  if (IconComponent) return <IconComponent size={20} className={className} />;
  return <Car size={20} className={className} />;
}

// ─── Dynamic section renderer (for Services / Electric) ──────────────────────

function DynamicMenuSections({ sections, iconClass = 'text-geely-blue' }: { sections: MenuSection[]; iconClass?: string }) {
  if (sections.length === 0) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 py-8">
        <div className="text-center text-gray-400 text-sm">No content available</div>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-7rem)] overflow-y-auto px-3 py-5 sm:px-4 sm:py-8">
      <div className="max-w-[1280px] mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {sections.map((section) => (
          <div key={section.id} className="space-y-4">
            <div className="flex items-center gap-2 border-b border-line dark:border-midnight-line pb-2">
              {getIcon(section.items[0]?.icon ?? null, iconClass)}
              <h3 className="font-bold text-navy dark:text-ice">{section.title}</h3>
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.url || '#'}
                  className="block group hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight dark:hover:bg-midnight p-2 rounded transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-navy dark:text-ice group-hover:text-geely-blue transition-colors flex items-center gap-2">
                        {item.icon && getIcon(item.icon)}
                        {item.title}
                        {item.isFeatured && (
                          <span className="text-xs bg-gold text-navy dark:text-ice px-2 py-0.5 rounded-full font-bold">
                            Featured
                          </span>
                        )}
                      </div>
                      {item.description && (
                        <div className="text-sm text-steel dark:text-steel-light mt-1">{item.description}</div>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-steel dark:text-steel-light group-hover:text-geely-blue transition-colors flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
}

// ─── Dynamic Models Menu ──────────────────────────────────────────────────────

function DynamicModelsMenu({ vehicles }: { vehicles: VehicleRecord[] }) {
  // Group vehicles by category
  const grouped = vehicles.reduce<Record<string, VehicleRecord[]>>((acc, v) => {
    const cat = v.vehicleCategory?.name || v.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {});

  const categories = Object.entries(grouped);
  const hasVehicles = vehicles.length > 0;

  return (
    <div className="max-h-[calc(100vh-7rem)] overflow-y-auto px-3 py-5 sm:px-4 sm:py-8">
    <div className="max-w-[1280px] mx-auto">
      {!hasVehicles ? (
        <div className="text-center text-gray-400 text-sm py-4">Loading models…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {/* Category columns */}
          {categories.map(([catName, catVehicles]) => {
            const isElectric = catName.toLowerCase().includes('electric') || catName.toLowerCase().includes('ev');
            return (
              <div key={catName} className="space-y-3">
                <div className="flex items-center gap-2 border-b border-line dark:border-midnight-line pb-2">
                  {isElectric
                    ? <Zap size={18} className="text-green-600" />
                    : <Car size={18} className="text-geely-blue" />
                  }
                  <h3 className="font-bold text-navy dark:text-ice text-sm">{catName}</h3>
                </div>
                <div className="space-y-2">
                  {catVehicles.slice(0, 6).map((vehicle) => (
                    <Link
                      key={vehicle.id}
                      href={`/models/${vehicle.slug}`}
                      className="block group hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight dark:hover:bg-midnight p-2 rounded transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Thumbnail */}
                        {(vehicle.heroImageUrl || (Array.isArray(vehicle.images) && vehicle.images[0])) ? (
                          <div className="w-12 h-9 rounded overflow-hidden flex-shrink-0 bg-ice dark:bg-midnight">
                            <img
                              src={(vehicle.heroImageUrl || (Array.isArray(vehicle.images) && vehicle.images[0]) || '')}
                              alt={vehicle.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-12 h-9 rounded bg-ice dark:bg-midnight flex-shrink-0 flex items-center justify-center">
                            <Car size={14} className="text-steel dark:text-steel-light" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-navy dark:text-ice group-hover:text-geely-blue transition-colors text-sm truncate">
                            {vehicle.name}
                          </div>
                          <div className="text-xs text-geely-blue font-medium">
                            Price on request
                          </div>
                        </div>
                        <ArrowRight size={14} className="text-steel dark:text-steel-light group-hover:text-geely-blue transition-colors flex-shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Quick actions column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-line dark:border-midnight-line pb-2">
              <Settings size={18} className="text-gold" />
              <h3 className="font-bold text-navy dark:text-ice text-sm">Quick Actions</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: 'Compare Models',      href: '/compare',       desc: 'Side-by-side comparison' },
                { label: 'Build & Configure',    href: '/configure',  desc: 'Customize your vehicle' },
                { label: 'Request a Quote',      href: '/quote',         desc: 'Get personalized pricing' },
                { label: 'Book Test Drive',      href: '/test-drive',    desc: 'Drive before you buy' },
                { label: 'Purchase Your Geely',  href: '/financing',     desc: 'Choose a vehicle and pay by bank' },
                { label: 'View All Models',      href: '/models',        desc: `${vehicles.length} models available` },
              ].map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="block group hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight dark:hover:bg-midnight p-2 rounded transition-colors"
                >
                  <div className="font-semibold text-navy dark:text-ice group-hover:text-geely-blue transition-colors text-sm">
                    {action.label}
                  </div>
                  <div className="text-xs text-steel dark:text-steel-light">{action.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MegaMenu({
  category,
  servicesMenu = [],
  vehicles = [],
}: MegaMenuProps) {
  if (category === 'services') {
    return <DynamicMenuSections sections={servicesMenu} iconClass="text-geely-blue" />;
  }

  // Dynamic models content (replaces static MODELS_CONTENT)
  return <DynamicModelsMenu vehicles={vehicles} />;
}
