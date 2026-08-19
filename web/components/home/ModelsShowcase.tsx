"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

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

export default function ModelsShowcase() {
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [active, setActive] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetch("/api/public/categories").then((r) => (r.ok ? r.json() : { categories: [] })),
      fetch("/api/public/vehicles").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([catData, vehData]) => {
        if (cancelled) return;
        const list = Array.isArray(vehData) ? vehData : (vehData as { vehicles?: Vehicle[] })?.vehicles ?? [];
        const cats: Category[] = (catData as { categories?: Category[] })?.categories ?? [];
        if (cats.length) setCategories(cats);
        setVehicles(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const tabs = useMemo(() => {
    return [{ id: "all", name: "All Models", slug: "all", description: null }, ...categories];
  }, [categories]);

  const visibleVehicles = useMemo(() => {
    if (active === "all") return vehicles;
    return vehicles.filter((v) => categoryMatches(active, v));
  }, [vehicles, active]);

  return (
    <section className="bg-white py-16 md:py-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div>
            <div className="text-[12px] tracking-[0.2em] text-geely-blue font-bold mb-3 uppercase">
              Models
            </div>
            <h2 className="disp text-[30px] md:text-[40px] text-navy font-extrabold leading-tight">
              Find Your Geely
            </h2>
            <p className="text-steel text-sm md:text-[15px] mt-2 max-w-xl">
              From urban SUVs to refined sedans and zero-emission electric vehicles — explore the
              range built for every Ethiopian road.
            </p>
          </div>
          <Link
            href="/models"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-geely-blue border-b border-geely-blue pb-0.5 hover:opacity-75 transition-opacity whitespace-nowrap"
          >
            Discover More
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-10">
          {tabs.map((tab) => {
            const count = tab.id === "all" ? vehicles.length : categories.find((c) => c.id === tab.id)?._count?.vehicles ?? undefined;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`px-5 md:px-6 py-2.5 rounded-full text-[13px] md:text-sm font-semibold border transition-all ${
                  isActive
                    ? "bg-navy text-white border-navy shadow-md shadow-navy/15"
                    : "bg-white text-navy border-line hover:border-geely-blue hover:text-geely-blue"
                }`}
              >
                {tab.name}
                {typeof count === "number" && (
                  <span className={`ml-2 text-[11px] ${isActive ? "text-white/70" : "text-steel"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Vehicle grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-[280px] rounded-xl" />
            ))}
          </div>
        ) : visibleVehicles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-steel text-sm mb-4">No models available in this category yet.</p>
            <Link
              href="/models"
              className="inline-block bg-geely-blue text-white text-sm font-bold px-7 py-3 rounded-lg hover:opacity-90 transition-opacity"
            >
              View All Models
            </Link>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
            >
              {visibleVehicles.map((vehicle) => {
                const imageUrl = publicMediaUrl(vehicle.heroImageUrl) || (Array.isArray(vehicle.images) ? publicMediaUrl(vehicle.images[0]) : null);
                const label = vehicle.vehicleCategory?.name || vehicle.category;
                return (
                  <Link
                    key={vehicle.id}
                    href={`/models/${vehicle.slug}`}
                    className="group block"
                  >
                    <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-[#eef2f7]">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={vehicle.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[11px] text-steel px-6 text-center">
                          {vehicle.name}
                        </div>
                      )}
                      {vehicle.isFeatured && (
                        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-navy text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                          Featured
                        </span>
                      )}
                    </div>
                    <div className="pt-4">
                      <div className="text-[11px] uppercase tracking-[0.14em] text-steel font-semibold">
                        {label}
                      </div>
                      <h3 className="disp text-[18px] text-navy font-bold mt-1 group-hover:text-geely-blue transition-colors">
                        {vehicle.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-geely-blue border-b border-transparent group-hover:border-geely-blue transition-colors mt-2">
                        Discover More
                        <span aria-hidden className="group-hover:translate-x-1 transition-transform">→</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
