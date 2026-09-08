"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import imageLoader from "@/lib/imageLoader";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { vehicles?: number };
}

interface Vehicle {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryId: string | null;
  vehicleCategory?: { name: string; slug: string } | null;
  heroImageUrl: string | null;
  images: unknown;
  badge?: string | null;
  isFeatured?: boolean;
  tagline?: string | null;
  enginePower?: string | null;
  acceleration?: string | null;
  fuelTankCapacity?: string | null;
}

function publicMediaUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return url;
}

function vehicleCategorySlug(vehicle: Vehicle): string {
  if (vehicle.vehicleCategory?.slug) return vehicle.vehicleCategory.slug;
  if (vehicle.categoryId) return vehicle.categoryId;
  return (vehicle.category || "").toLowerCase();
}

function categoryMatches(categorySlug: string, vehicle: Vehicle): boolean {
  const v = vehicleCategorySlug(vehicle).replace(/s$/, "");
  const c = categorySlug.replace(/s$/, "");
  return v === c;
}

const FALLBACK_CATEGORIES: Category[] = [
  { id: "suvs", name: "SUVs", slug: "suvs", description: null },
  { id: "sedans", name: "Sedans", slug: "sedans", description: null },
  { id: "electric", name: "Electric", slug: "electric", description: null },
];

interface ModelsShowcaseProps {
  initialCategories?: Category[];
  initialVehicles?: Vehicle[];
}

function VehicleCard({ vehicle, size }: { vehicle: Vehicle; size: "hero" | "large" | "medium" | "small" }) {
  const specs: { label: string; value: string }[] = [];
  if (vehicle.enginePower) specs.push({ label: "Max Power", value: vehicle.enginePower });
  if (vehicle.acceleration) specs.push({ label: "0-100km/h Acceleration", value: vehicle.acceleration });
  if (vehicle.fuelTankCapacity) specs.push({ label: "Fuel Tank Capacity", value: vehicle.fuelTankCapacity });

  const sizeClasses = {
    hero: "col-span-full",
    large: "col-span-full md:col-span-1",
    medium: "col-span-full sm:col-span-1",
    small: "col-span-1",
  };

  const imageHeightClasses = {
    hero: "h-[300px] sm:h-[400px] md:h-[480px] lg:h-[540px]",
    large: "h-[280px] sm:h-[340px] md:h-[400px]",
    medium: "h-[220px] sm:h-[260px] md:h-[300px]",
    small: "h-[180px] sm:h-[220px] md:h-[260px]",
  };

  const nameSizeClasses = {
    hero: "text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px]",
    large: "text-[24px] sm:text-[30px] md:text-[36px]",
    medium: "text-[20px] sm:text-[24px] md:text-[28px]",
    small: "text-[18px] sm:text-[20px] md:text-[24px]",
  };

  const specSizeClasses = {
    hero: "text-[24px] md:text-[32px] lg:text-[36px]",
    large: "text-[20px] md:text-[28px]",
    medium: "text-[18px] md:text-[22px]",
    small: "text-[16px] md:text-[18px]",
  };

  return (
    <div className={`${sizeClasses[size]} group`}>
      <Link href={`/models/${vehicle.slug}`} className="block">
        <div className="relative w-full bg-gradient-to-b from-[#f0f2f5] to-[#e8eaed] dark:from-midnight-card dark:to-midnight-surface rounded-2xl overflow-hidden">
          {/* Vehicle image */}
          <div className={`relative w-full ${imageHeightClasses[size]} flex items-center justify-center p-4 md:p-8`}>
            {vehicle.heroImageUrl ? (
              <Image
                src={publicMediaUrl(vehicle.heroImageUrl)}
                alt={vehicle.name}
                loader={imageLoader}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain group-hover:scale-105 transition-transform duration-500"
                priority={size === "hero"}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-steel dark:text-steel-light text-sm">
                {vehicle.name}
              </div>
            )}
          </div>

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 md:p-6">
            <h3 className={`disp ${nameSizeClasses[size]} text-white font-extrabold leading-tight uppercase`}>
              {vehicle.name}
            </h3>
            {vehicle.tagline && (
              <p className="text-[14px] md:text-[16px] text-white/80 font-semibold uppercase mt-1 tracking-wide">
                {vehicle.tagline}
              </p>
            )}

            {/* Specs row */}
            {specs.length > 0 && size !== "small" && (
              <div className="flex flex-wrap gap-4 md:gap-6 mt-3">
                {specs.map((spec) => (
                  <div key={spec.label} className="text-left">
                    <div className={`${specSizeClasses[size]} font-extrabold text-white leading-none`}>
                      {spec.value}
                    </div>
                    <div className="text-[10px] md:text-[11px] text-white/60 mt-0.5">
                      {spec.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-3 inline-block bg-white dark:bg-ice text-navy dark:text-navy text-[12px] md:text-[13px] font-bold px-5 py-2 rounded group-hover:bg-gray-100 transition-colors">
              Discover More
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default function ModelsShowcase({ initialCategories, initialVehicles }: ModelsShowcaseProps) {
  const [categories] = useState<Category[]>(
    initialCategories?.length ? initialCategories : FALLBACK_CATEGORIES
  );
  const [vehicles] = useState<Vehicle[]>(initialVehicles ?? []);
  const [activeTab, setActiveTab] = useState<string>("all");

  const tabs = useMemo(() => categories, [categories]);

  const filteredVehicles = useMemo(() => {
    if (activeTab === "all") return vehicles;
    return vehicles.filter((v) => categoryMatches(activeTab, v));
  }, [vehicles, activeTab]);

  const count = filteredVehicles.length;

  const gridConfig = useMemo(() => {
    if (count === 0) return { cols: "", gap: "" };
    if (count === 1) return { cols: "grid-cols-1", gap: "gap-0" };
    if (count === 2) return { cols: "grid-cols-1 md:grid-cols-2", gap: "gap-4 md:gap-6" };
    if (count === 3) return { cols: "grid-cols-1 md:grid-cols-3", gap: "gap-4 md:gap-6" };
    return { cols: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4", gap: "gap-4 md:gap-6" };
  }, [count]);

  return (
    <section className="bg-white dark:bg-midnight-surface py-12 md:py-16 lg:py-20 transition-colors">
      <div className="page-container">
        <h2 className="text-2xl md:text-3xl font-bold text-navy dark:text-ice text-center mb-8 md:mb-10">
          Explore Our Models
        </h2>
        {/* Category tabs */}
        <div className="flex justify-center mb-10 md:mb-14">
          <div className="inline-flex flex-wrap justify-center gap-2 bg-[#f5f5f5] dark:bg-midnight-card rounded-full p-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.slug;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.slug)}
                  className={`px-5 md:px-6 py-2 rounded-full text-[13px] md:text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-white dark:bg-midnight-surface text-navy dark:text-ice shadow-sm"
                      : "text-steel dark:text-steel-light hover:text-navy dark:hover:text-ice"
                  }`}
                >
                  {tab.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vehicle grid */}
        {count === 0 ? (
          <div className="text-center py-20">
            <p className="text-steel dark:text-steel-light text-sm">No models available in this category yet.</p>
          </div>
        ) : (
          <div className={`grid ${gridConfig.cols} ${gridConfig.gap}`}>
            {filteredVehicles.map((vehicle, idx) => {
              let size: "hero" | "large" | "medium" | "small";
              if (count === 1) size = "hero";
              else if (count === 2) size = "large";
              else if (count === 3) size = "medium";
              else size = idx < 2 ? "large" : "small";

              return <VehicleCard key={vehicle.id} vehicle={vehicle} size={size} />;
            })}
          </div>
        )}
      </div>
    </section>
  );
}
