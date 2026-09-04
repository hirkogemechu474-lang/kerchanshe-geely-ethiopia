"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MainLayout } from "@/components/MainLayout";
import Link from "next/link";
import { ArrowUpRight, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  type VehicleBrand,
  type VehicleCategory,
  type VehicleRecord,
} from "@/lib/vehicleData";
import { withBasePath } from "@/lib/publicPath";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

function publicMediaUrl(url: string | null | undefined) {
  return withBasePath(url);
}

function categorySlugOf(vehicle: VehicleRecord): string {
  if (vehicle.vehicleCategory?.slug) return vehicle.vehicleCategory.slug;
  if (vehicle.categoryId) return vehicle.categoryId;
  return (vehicle.category || "").toLowerCase();
}

export default function ModelsPage() {
  const searchParams = useSearchParams();
  const visitId = searchParams.get("visitId") || "";
  const visitParam = visitId ? `&visitId=${encodeURIComponent(visitId)}` : "";
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"featured" | "name">("featured");

  useEffect(() => {
    void fetchInitialLookups();
  }, []);

  useEffect(() => {
    setSelectedCategory("all");
  }, [selectedBrand]);

  useEffect(() => {
    void fetchVehicles();
  }, [selectedBrand, selectedCategory]);

  async function fetchInitialLookups() {
    try {
      const [brandsResponse, categoriesResponse] = await Promise.all([
        fetch("/api/public/brands"),
        fetch("/api/public/categories"),
      ]);

      if (brandsResponse.ok) {
        setBrands(await brandsResponse.json());
      }

      if (categoriesResponse.ok) {
        const data = await categoriesResponse.json();
        setCategories(Array.isArray(data) ? data : data?.categories || []);
      }
    } catch (error) {
      console.error("Error loading model lookups:", error);
    }
  }

  async function fetchVehicles() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (selectedBrand !== "all") {
        params.set("brand", selectedBrand);
      }

      if (selectedCategory !== "all") {
        params.set("category", selectedCategory);
      }

      const response = await fetch(`/api/public/vehicles${params.toString() ? `?${params.toString()}` : ""}`);

      if (response.ok) {
        const data = await response.json();
        setVehicles(Array.isArray(data) ? data : data?.vehicles || []);
      }
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  }

  const categoryOptions = useMemo(() => {
    return categories.filter((category) => {
      if (selectedBrand === "all") {
        return true;
      }

      return (
        category.brand?.slug === selectedBrand ||
        category.brand?.name === selectedBrand ||
        category.brandId === selectedBrand
      );
    });
  }, [categories, selectedBrand]);

  const sortedVehicles = useMemo(() => {
    return [...vehicles].sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "featured":
        default:
          return (Number(b.isFeatured) - Number(a.isFeatured)) || a.name.localeCompare(b.name);
      }
    });
  }, [vehicles, sortBy]);

  const vehicleCountByCategory = useMemo(() => {
    return vehicles.reduce<Record<string, number>>((acc, vehicle) => {
      const key = categorySlugOf(vehicle);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [vehicles]);

  return (
    <MainLayout>
      {/* Page hero */}
      <div className="bg-navy text-white relative overflow-hidden">
        <div className="pointer-events-none absolute right-[-80px] top-[-80px] w-72 h-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute right-[40px] bottom-[-120px] w-80 h-80 rounded-full border border-white/10" />
        <div className="relative page-container py-16 md:py-20">
          <div className="text-[13px] tracking-[0.2em] text-active-blue font-bold mb-4 uppercase">
            Explore Our Range
          </div>
          <h1 className="disp text-4xl sm:text-5xl md:text-[52px] font-extrabold leading-tight mb-4 max-w-3xl">
            Geely Models
          </h1>
          <p className="text-[#c3d2ea] text-base max-w-2xl leading-relaxed">
            Discover the complete Geely lineup — from urban SUVs to refined sedans and electric
            vehicles. Every model is loaded live from the database and managed in the admin panel.
          </p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="border-b border-line dark:border-midnight-line bg-white dark:bg-midnight-surface sticky top-[65px] z-30 transition-colors">
        <div className="page-container py-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Brand filter */}
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-[12px] font-bold uppercase tracking-wider text-steel dark:text-steel-light">
                Brand
              </label>
              <select
                value={selectedBrand}
                onChange={(event) => setSelectedBrand(event.target.value)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white dark:bg-midnight text-navy dark:text-ice border border-line dark:border-midnight-line focus:outline-none focus:border-active-blue focus:ring-2 focus:ring-active-blue/20"
              >
                <option value="all">All Brands</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.slug}>
                    {brand.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-steel dark:text-steel-light">
                <SlidersHorizontal size={16} />
                Sort
              </label>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-white dark:bg-midnight text-navy dark:text-ice border border-line dark:border-midnight-line focus:outline-none focus:border-active-blue focus:ring-2 focus:ring-active-blue/20"
              >
                <option value="featured">Featured First</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center gap-2.5 flex-wrap mt-5">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-5 py-2.5 rounded-full text-[13px] font-semibold border transition-all ${
                selectedCategory === "all"
                  ? "bg-navy text-white border-navy shadow-md shadow-navy/15"
                  : "bg-white dark:bg-midnight text-navy dark:text-ice border-line dark:border-midnight-line hover:border-active-blue hover:text-active-blue"
              }`}
            >
              All Models
              <span className={`ml-2 text-[11px] ${selectedCategory === "all" ? "text-white/70" : "text-steel dark:text-steel-light"}`}>
                {vehicles.length}
              </span>
            </button>
            {categoryOptions.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.slug)}
                className={`px-5 py-2.5 rounded-full text-[13px] font-semibold border transition-all ${
                  selectedCategory === category.slug
                    ? "bg-navy text-white border-navy shadow-md shadow-navy/15"
                    : "bg-white dark:bg-midnight text-navy dark:text-ice border-line dark:border-midnight-line hover:border-active-blue hover:text-active-blue"
                }`}
              >
                {category.name}
                <span className={`ml-2 text-[11px] ${selectedCategory === category.slug ? "text-white/70" : "text-steel dark:text-steel-light"}`}>
                  {vehicleCountByCategory[category.slug] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Vehicle grid */}
      <section className="py-14 md:py-16">
        <div className="page-container">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-[320px] rounded-2xl" />
              ))}
            </div>
          ) : sortedVehicles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-steel dark:text-steel-light text-lg mb-6">No models available in this category yet.</p>
              <Button
                onClick={() => {
                  setSelectedBrand("all");
                  setSelectedCategory("all");
                }}
                variant="solid"
                size="md"
              >
                View All Models
              </Button>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedBrand}-${selectedCategory}-${sortBy}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8"
              >
                {sortedVehicles.map((vehicle) => {
                  const imageUrl =
                    publicMediaUrl(vehicle.heroImageUrl) ||
                    publicMediaUrl(Array.isArray(vehicle.images) ? vehicle.images[0] : null) ||
                    null;
                  const specs = (vehicle.specifications || {}) as any;
                  const badge = vehicle.badge || (vehicle.isFeatured ? "Featured" : "");
                  const label = vehicle.vehicleCategory?.name || vehicle.category;
                  const detailsHref = `/models/${vehicle.slug}${visitId ? `?visitId=${encodeURIComponent(visitId)}` : ""}`;

                  return (
                    <Card key={vehicle.id} variant="boxed" className="group flex flex-col">
                      <Link
                        href={detailsHref}
                        aria-label={`${vehicle.name} details`}
                        className="relative aspect-[4/3] bg-[#eef2f7] overflow-hidden block"
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt=""
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[11px] text-navy/70 dark:text-ice/70 px-6 text-center">
                            {vehicle.name}
                          </div>
                        )}
                        {badge && (
                          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur text-navy text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                            {badge}
                          </span>
                        )}
                      </Link>

                      <div className="p-5 flex flex-col flex-1">
                        <div className="text-[11px] uppercase tracking-[0.14em] text-steel dark:text-steel-light font-semibold">
                          {label}
                        </div>
                        <h3 className="disp text-[19px] text-navy dark:text-ice font-bold mt-1.5 group-hover:text-active-blue transition-colors">
                          {vehicle.name}
                        </h3>

                        {specs?.dimensions && (
                          <div className="flex gap-4 mt-3 text-[11px] text-steel dark:text-steel-light">
                            {specs.dimensions.seatingCapacity && (
                              <div>
                                <span className="font-semibold text-navy dark:text-ice">{specs.dimensions.seatingCapacity}</span> Seats
                              </div>
                            )}
                            {specs.engine?.transmission && (
                              <div>
                                <span className="font-semibold text-navy dark:text-ice">{specs.engine.transmission}</span>
                              </div>
                            )}
                            {specs.engine?.fuelType && (
                              <div>
                                <span className="font-semibold text-navy dark:text-ice">{specs.engine.fuelType}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-3 mt-auto pt-5 border-t border-line dark:border-midnight-line">
                          <Button
                            href={`/quote?model=${vehicle.slug}${visitParam}`}
                            aria-label={`Get a quote for ${vehicle.name}`}
                            variant="solid"
                            size="sm"
                            className="flex-1"
                          >
                            Get a Quote
                          </Button>
                          <Button
                            href={detailsHref}
                            aria-label={`View details for ${vehicle.name}`}
                            variant="outline"
                            tone="light"
                            size="sm"
                            className="flex-1"
                          >
                            Details
                            <ArrowUpRight size={14} />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>

      {/* Compare CTA */}
      <div className="bg-mesh-blue text-white py-14">
        <div className="page-container text-center">
          <h3 className="disp text-2xl md:text-3xl font-extrabold mb-3">Can't decide?</h3>
          <p className="text-[#c3d2ea] text-sm md:text-[15px] mb-7 max-w-xl mx-auto">
            Compare up to 3 vehicles side-by-side to find the perfect match for your needs.
          </p>
          <Button href="/compare" variant="solid" size="lg">
            Compare Models
            <span aria-hidden>&rarr;</span>
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
