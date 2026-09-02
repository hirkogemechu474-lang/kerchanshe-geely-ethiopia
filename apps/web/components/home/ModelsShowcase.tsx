"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import imageLoader from "@/lib/imageLoader";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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

interface ModelsShowcaseProps {
  // Fetched server-side (see app/page.tsx) so the grid renders on first paint
  // instead of showing an empty/loading state until the client fetch resolves.
  initialCategories?: Category[];
  initialVehicles?: Vehicle[];
}

export default function ModelsShowcase({ initialCategories, initialVehicles }: ModelsShowcaseProps) {
  const [categories] = useState<Category[]>(
    initialCategories?.length ? initialCategories : FALLBACK_CATEGORIES
  );
  const [vehicles] = useState<Vehicle[]>(initialVehicles ?? []);
  const [active, setActive] = useState<string>("all");

  const tabs = useMemo(() => {
    return [{ id: "all", name: "All Models", slug: "all", description: null }, ...categories];
  }, [categories]);

  const visibleVehicles = useMemo(() => {
    if (active === "all") return vehicles;
    return vehicles.filter((v) => categoryMatches(active, v));
  }, [vehicles, active]);

  return (
    <section className="bg-white dark:bg-midnight-surface py-16 md:py-20 transition-colors">
      <div className="page-container">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div>
            <div className="text-[12px] tracking-[0.2em] text-active-blue font-bold mb-3 uppercase">
              Models
            </div>
            <h2 className="disp text-[30px] md:text-[40px] text-navy dark:text-ice font-extrabold leading-tight">
              Find Your Geely
            </h2>
            <p className="text-steel dark:text-steel-light text-sm md:text-[15px] mt-2 max-w-xl">
              From urban SUVs to refined sedans and zero-emission electric vehicles — explore the
              range built for every Ethiopian road.
            </p>
          </div>
          <Link
            href="/models"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-active-blue border-b border-active-blue pb-0.5 hover:opacity-75 transition-opacity whitespace-nowrap"
          >
            Discover More
            <span aria-hidden>&rarr;</span>
          </Link>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 md:gap-3 mb-10">
          {tabs.map((tab) => {
            const count = tab.id === "all" ? vehicles.length : categories.find((c) => c.id === tab.id)?._count?.vehicles ?? undefined;
            const isActive = active === tab.slug;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.slug)}
                className={`px-5 md:px-6 py-2.5 rounded-full text-[13px] md:text-sm font-semibold border transition-all ${
                  isActive
                    ? "bg-navy text-white border-navy shadow-md shadow-navy/15"
                    : "bg-white dark:bg-midnight-surface text-navy dark:text-ice border-line dark:border-midnight-line hover:border-active-blue hover:text-active-blue"
                }`}
              >
                {tab.name}
                {typeof count === "number" && (
                  <span className={`ml-2 text-[11px] ${isActive ? "text-white/70" : "text-steel dark:text-steel-light"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Vehicle grid */}
        {visibleVehicles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-steel dark:text-steel-light text-sm mb-4">No models available in this category yet.</p>
            <Button href="/models" variant="solid" size="md">
              View All Models
            </Button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.09 } },
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
            >
              {visibleVehicles.map((vehicle) => {
                const imageUrl = publicMediaUrl(vehicle.heroImageUrl) || (Array.isArray(vehicle.images) ? publicMediaUrl(vehicle.images[0]) : null);
                const label = vehicle.vehicleCategory?.name || vehicle.category;
                return (
                  <motion.div
                    key={vehicle.id}
                    className="group"
                    variants={{
                      hidden: { opacity: 0, x: -48 },
                      visible: { opacity: 1, x: 0 },
                    }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  >
                    <Link href={`/models/${vehicle.slug}`} className="block">
                      <Card variant="media" className="relative aspect-[4/3] bg-[#eef2f7]">
                        {imageUrl ? (
                          <Image
                            src={imageUrl}
                            alt=""
                            loader={imageLoader}
                            fill
                            sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] text-steel dark:text-steel-light px-6 text-center">
                            {vehicle.name}
                          </div>
                        )}
                        {vehicle.isFeatured && (
                          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-navy text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                            Featured
                          </span>
                        )}
                      </Card>
                      <div className="pt-4">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-steel dark:text-steel-light font-semibold">
                          {label}
                        </div>
                        <h3 className="disp text-[18px] text-navy dark:text-ice font-bold mt-1 group-hover:text-active-blue transition-colors">
                          {vehicle.name}
                        </h3>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2.5 mt-4">
                      <Button href={`/models/${vehicle.slug}`} variant="solid" size="sm" className="flex-1">
                        Explore
                      </Button>
                      <Button href={`/compare?add=${vehicle.id}`} variant="outline" tone="light" size="sm" className="flex-1">
                        Compare
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </section>
  );
}
