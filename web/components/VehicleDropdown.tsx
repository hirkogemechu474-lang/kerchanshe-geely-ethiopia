'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { ArrowRight, Car } from 'lucide-react';
import type { VehicleRecord } from '@/lib/vehicleData';
import { withBasePath } from '@/lib/publicPath';

// /uploads/* is same-origin (proxied to admin via next.config.ts rewrites),
// so local paths just need the basePath, not an absolute admin origin.
function publicMediaUrl(url: string | null | undefined) {
  return withBasePath(url);
}

interface VehicleDropdownProps {
  onClose: () => void;
  /** Pre-loaded vehicles passed from Header — no fetch needed here */
  vehicles?: VehicleRecord[];
  loading?: boolean;
}

// A flat gallery of model name + image, no grouping/badges/description — the
// pattern used on Geely's regional distributor sites' Models dropdown (e.g.
// geely.com.eg) rather than a dense grouped-list-with-sidebar panel.
export function VehicleDropdown({ onClose, vehicles = [], loading = false }: VehicleDropdownProps) {
  const sortedVehicles = useMemo(
    () =>
      vehicles.slice().sort((a, b) => {
        const orderA = a.displayOrder ?? 0;
        const orderB = b.displayOrder ?? 0;
        return orderA - orderB || a.name.localeCompare(b.name);
      }),
    [vehicles]
  );

  return (
    <div className="max-h-[calc(100vh-7rem)] overflow-y-auto overflow-x-hidden">
      <div className="max-w-[1280px] mx-auto px-4 py-8 sm:px-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="space-y-4 animate-pulse">
                <div className="h-5 w-20 bg-line rounded" />
                <div className="h-24 bg-line rounded" />
              </div>
            ))}
          </div>
        ) : sortedVehicles.length === 0 ? (
          <div className="py-6 text-center text-sm text-steel">
            No active models are available right now.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-10">
            {sortedVehicles.map((vehicle) => {
              const image =
                publicMediaUrl(vehicle.heroImageUrl) ||
                publicMediaUrl(Array.isArray(vehicle.images) ? vehicle.images[0] : null);

              return (
                <Link
                  key={vehicle.id}
                  href={`/models/${vehicle.slug}`}
                  onClick={onClose}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="font-display font-extrabold text-lg text-ink group-hover:text-geely-blue transition-colors">
                    {vehicle.name}
                  </div>
                  <div className="mt-4 h-24 sm:h-28 w-full flex items-center justify-center">
                    {image ? (
                      <img
                        src={image}
                        alt={vehicle.name}
                        className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <Car size={40} className="text-line" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-line flex justify-center">
          <Link
            href="/models"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 text-sm font-display font-semibold uppercase tracking-[0.06em] text-navy hover:text-geely-blue transition-colors"
          >
            View All Models
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
