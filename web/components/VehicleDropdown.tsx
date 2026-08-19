'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Car, Zap, Award, Settings, BarChart3 } from 'lucide-react';
import { env } from '@/lib/env';
import { formatVehiclePrice, type VehicleRecord } from '@/lib/vehicleData';

function publicMediaUrl(url: string | null | undefined) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');
  return `${adminUrl}${url}`;
}

interface VehicleDropdownProps {
  onClose: () => void;
  /** Pre-loaded vehicles passed from Header — no fetch needed here */
  vehicles?: VehicleRecord[];
  loading?: boolean;
}

export function VehicleDropdown({ onClose, vehicles = [], loading = false }: VehicleDropdownProps) {
  const [hoveredVehicle, setHoveredVehicle] = useState<VehicleRecord | null>(null);
  const groupedVehicles = useMemo(() => {
    const groups = new Map<string, { label: string; items: VehicleRecord[]; icon: 'car' | 'electric' }>();

    vehicles.forEach((vehicle) => {
      const key = vehicle.vehicleCategory?.slug || vehicle.categoryId || vehicle.category;
      const label = vehicle.vehicleCategory?.name || vehicle.category || 'Models';
      const icon: 'car' | 'electric' =
        /electric/i.test(label) || /electric/i.test(vehicle.badge || '') || /electric/i.test(vehicle.category)
          ? 'electric'
          : 'car';

      if (!groups.has(key)) {
        groups.set(key, { label, items: [], icon });
      }

      groups.get(key)!.items.push(vehicle);
    });

    return Array.from(groups.values()).map((group) => ({
      ...group,
      items: group.items.slice().sort((a, b) => {
        const orderA = a.displayOrder ?? 0;
        const orderB = b.displayOrder ?? 0;
        return orderA - orderB || a.name.localeCompare(b.name);
      }),
    }));
  }, [vehicles]);

  return (
    <div className="max-h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden">
      <div className="max-w-[1280px] mx-auto px-3 py-5 sm:px-4 sm:py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 lg:gap-8">

        {/* Vehicles grid */}
        <div className="space-y-4 lg:col-span-3 min-w-0">
          <div className="flex items-center gap-2 border-b border-line pb-2">
            <Car className="text-geely-blue" size={20} />
            <h3 className="font-bold text-navy">Models</h3>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 animate-pulse">
                  <div className="h-5 bg-gray-100 rounded w-24" />
                  {[1, 2].map((j) => (
                    <div key={j} className="h-16 bg-gray-50 rounded" />
                  ))}
                </div>
              ))}
            </div>
          ) : groupedVehicles.length === 0 ? (
            <div className="rounded border border-dashed border-line p-6 text-sm text-steel">
              No active models are available right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {groupedVehicles.map((group) => (
                <div key={group.label} className="space-y-3">
                  <div className="flex items-center gap-2 border-b border-line pb-2">
                    {group.icon === 'electric' ? (
                      <Zap className="text-green-600" size={20} />
                    ) : (
                      <Car className="text-geely-blue" size={20} />
                    )}
                    <h4 className="font-bold text-navy">{group.label}</h4>
                  </div>

                  <div className="space-y-3">
                    {group.items.map((vehicle) => {
                      const displayPrice = vehicle.finalPrice || vehicle.basePrice;
                      const badge = vehicle.badge || (vehicle.isFeatured ? 'Featured' : '');

                      return (
                        <Link
                          key={vehicle.id}
                          href={`/models/${vehicle.slug}`}
                          onClick={onClose}
                          onMouseEnter={() => setHoveredVehicle(vehicle)}
                          className="block group hover:bg-ice p-3 rounded transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-navy group-hover:text-geely-blue transition-colors">
                                {vehicle.name}
                              </div>
                              <div className="text-sm text-steel line-clamp-2">
                                {vehicle.description || 'View full specifications and pricing.'}
                              </div>
                              <div className="text-sm font-semibold text-geely-blue mt-1">
                                {vehicle.hidePrice
                                  ? "Price on request"
                                  : formatVehiclePrice(displayPrice)}
                              </div>
                              {badge && (
                                <div className="inline-flex items-center gap-1 bg-gold text-navy px-2 py-1 rounded-full text-xs font-bold mt-2">
                                  <Award size={12} />
                                  {badge}
                                </div>
                              )}
                            </div>
                            <ArrowRight size={16} className="text-steel group-hover:text-geely-blue transition-colors flex-shrink-0 ml-2" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hovered vehicle preview and quick actions */}
        <div className="space-y-4 min-w-0">
          <div className="overflow-hidden rounded-xl border border-line bg-ice shadow-sm">
            <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec]">
              {hoveredVehicle && (publicMediaUrl(hoveredVehicle.heroImageUrl) || publicMediaUrl(Array.isArray(hoveredVehicle.images) ? hoveredVehicle.images[0] : null)) ? (
                <img
                  src={publicMediaUrl(hoveredVehicle.heroImageUrl) || publicMediaUrl(Array.isArray(hoveredVehicle.images) ? hoveredVehicle.images[0] : null)}
                  alt={hoveredVehicle.name}
                  className="h-full w-full object-cover transition duration-500"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-steel"><Car size={56} /></div>
              )}
              {hoveredVehicle && <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/85 to-transparent p-4 pt-12"><div className="text-lg font-bold text-white">{hoveredVehicle.name}</div><div className="text-xs text-blue-100">{hoveredVehicle.vehicleCategory?.name || hoveredVehicle.category || 'Geely vehicle'}</div></div>}
            </div>
            {hoveredVehicle ? (
              <div className="bg-white p-3">
                <p className="line-clamp-2 text-xs leading-5 text-steel">{hoveredVehicle.description || 'Explore the design, features, and specifications.'}</p>
                <Link href={`/models/${hoveredVehicle.slug}`} onClick={onClose} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-geely-blue hover:underline">View details <ArrowRight size={14} /></Link>
              </div>
            ) : <div className="bg-white p-4 text-xs text-steel">Hover over a model to preview it.</div>}
          </div>

          <div className="flex items-center gap-2 border-b border-line pb-2">
            <Settings className="text-navy" size={20} />
            <h3 className="font-bold text-navy">Quick Actions</h3>
          </div>
          <div className="space-y-3">
            {env.features.testDrive && (
              <Link
                href="/compare"
                onClick={onClose}
                className="block group hover:bg-ice p-3 rounded transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-navy group-hover:text-geely-blue transition-colors">Compare Models</div>
                    <div className="text-sm text-steel">Side-by-side comparison</div>
                  </div>
                  <BarChart3 size={16} className="text-geely-blue" />
                </div>
              </Link>
            )}

            <Link
              href="/configure"
              onClick={onClose}
              className="block group hover:bg-ice p-3 rounded transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-navy group-hover:text-geely-blue transition-colors">Build & Price</div>
                  <div className="text-sm text-steel">Configure your vehicle</div>
                </div>
                <Settings size={16} className="text-geely-blue" />
              </div>
            </Link>

            <Link
              href="/models"
              onClick={onClose}
              className="block group hover:bg-geely-blue hover:text-white p-3 rounded transition-colors bg-navy text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">View All Models</div>
                  <div className="text-sm opacity-90">Complete vehicle lineup</div>
                </div>
                <ArrowRight size={16} />
              </div>
            </Link>

            <Link
              href="/financing"
              onClick={onClose}
              className="block group hover:bg-ice p-3 rounded transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-navy group-hover:text-geely-blue transition-colors">Finance Calculator</div>
                  <div className="text-sm text-steel">Calculate monthly payments</div>
                </div>
                <BarChart3 size={16} className="text-geely-blue" />
              </div>
            </Link>
          </div>
        </div>
      </div>
      </div>

      {/* Featured Banner */}
      <div className="mt-8 bg-gradient-to-r from-navy to-geely-blue text-white p-6 rounded-lg">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-xl font-bold mb-2">New Year Special Offer</h3>
            <p className="text-blue-100">Get up to ETB 200,000 off select models. Limited time offer.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/offers"
              onClick={onClose}
              className="bg-gold text-navy px-6 py-3 rounded font-bold hover:bg-opacity-90 transition-colors text-center"
            >
              View Offers
            </Link>
            <Link
              href="/test-drive"
              onClick={onClose}
              className="border-2 border-white text-white px-6 py-3 rounded font-bold hover:bg-white hover:text-navy transition-colors text-center"
            >
              Schedule Test Drive
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
