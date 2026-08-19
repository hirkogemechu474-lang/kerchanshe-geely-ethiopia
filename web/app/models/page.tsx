"use client";

import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/MainLayout";
import Link from "next/link";
import { ArrowUpRight, Filter, SlidersHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import {
  formatVehiclePrice,
  type VehicleBrand,
  type VehicleCategory,
  type VehicleRecord,
} from "@/lib/vehicleData";

function publicMediaUrl(url: string | null | undefined) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : '');
  return `${adminUrl}${url}`;
}

export default function ModelsPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [brands, setBrands] = useState<VehicleBrand[]>([]);
  const [categories, setCategories] = useState<VehicleCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "name">("price-asc");

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
        setCategories(data.categories);
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

  const sortedVehicles = [...vehicles].sort((a, b) => {
    const priceA = a.finalPrice || a.basePrice;
    const priceB = b.finalPrice || b.basePrice;

    switch (sortBy) {
      case "price-asc":
        return priceA - priceB;
      case "price-desc":
        return priceB - priceA;
      case "name":
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const vehicleCountByCategory = useMemo(() => {
    return vehicles.reduce<Record<string, number>>((acc, vehicle) => {
      const key = vehicle.vehicleCategory?.slug || vehicle.categoryId || vehicle.category;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
  }, [vehicles]);

  return (
    <MainLayout>
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
            EXPLORE OUR RANGE
          </div>
          <h1 className="disp text-4xl sm:text-5xl font-bold mb-4">Geely Models</h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            Discover the complete Geely lineup. Every model, badge, image, and price is loaded from the database and managed in the admin panel.
          </p>
        </div>
      </div>

      <div className="border-b border-line bg-ice">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-steel text-sm font-semibold">
                  <Filter size={18} />
                  Brand:
                </div>
                <select
                  value={selectedBrand}
                  onChange={(event) => setSelectedBrand(event.target.value)}
                  className="px-4 py-2 rounded text-sm font-semibold bg-white text-navy border border-line focus:outline-none focus:border-geely-blue"
                >
                  <option value="all">All Brands</option>
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.slug}>
                      {brand.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-steel text-sm font-semibold">
                  <SlidersHorizontal size={18} />
                  Sort:
                </div>
                <select
                  value={sortBy}
                  onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
                  className="px-4 py-2 rounded text-sm font-semibold bg-white text-navy border border-line focus:outline-none focus:border-geely-blue"
                >
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name">Name: A to Z</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-4 py-2 rounded text-sm font-semibold transition-all ${
                  selectedCategory === "all"
                    ? "bg-navy text-white"
                    : "bg-white text-navy border border-line hover:bg-navy hover:text-white"
                }`}
              >
                All Models ({vehicles.length})
              </button>
              {categoryOptions.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.slug)}
                  className={`px-4 py-2 rounded text-sm font-semibold transition-all ${
                    selectedCategory === category.slug
                      ? "bg-navy text-white"
                      : "bg-white text-navy border border-line hover:bg-navy hover:text-white"
                  }`}
                >
                  {category.name} ({vehicleCountByCategory[category.slug] || 0})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-geely-blue border-t-transparent mb-4"></div>
                <p className="text-steel">Loading vehicles...</p>
              </div>
            </div>
          ) : sortedVehicles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-steel text-lg">No vehicles found matching your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
              {sortedVehicles.map((vehicle, index) => {
                const imageUrl = publicMediaUrl(vehicle.heroImageUrl) || publicMediaUrl(Array.isArray(vehicle.images) ? vehicle.images[0] : null) || null;
                const specs = (vehicle.specifications || {}) as any;
                const badge = vehicle.badge || (vehicle.isFeatured ? "Featured" : "");

                return (
                  <motion.div
                    key={vehicle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="border border-line rounded-lg overflow-hidden hover:border-geely-blue hover:shadow-[0_10px_24px_rgba(11,37,69,0.08)] transition-all group"
                  >
                    <div className="relative h-[200px] bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] flex items-center justify-center text-[11px] text-steel text-center px-4 overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={vehicle.name} className="w-full h-full object-cover transition duration-700 ease-out group-hover:scale-110" />
                      ) : (
                        <span>{vehicle.name} - exterior 3/4 studio shot</span>
                      )}
                      <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-navy/75 via-transparent to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                        <span className="flex items-center gap-2 text-sm font-bold text-white">Explore {vehicle.name} <ArrowUpRight size={17} /></span>
                      </div>
                      {badge && (
                        <div className="absolute top-3 right-3 bg-gold text-white text-[10px] font-bold px-3 py-1 rounded-full">
                          {badge}
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <div className="text-[11px] text-gold font-bold tracking-wider mb-2 uppercase">
                        {vehicle.vehicleCategory?.name || vehicle.category}
                      </div>
                      <h3 className="text-[19px] text-navy font-bold mb-1 group-hover:text-geely-blue transition-colors">
                        {vehicle.name}
                      </h3>
                      <div className="text-[12px] text-steel mb-3">
                        {vehicle.brand?.name || "Geely"}
                      </div>
                      {vehicle.description && (
                        <p className="text-[12px] text-steel mb-3 line-clamp-2">{vehicle.description}</p>
                      )}

                      {specs?.dimensions && (
                        <div className="flex gap-4 mb-4 text-[11px] text-steel">
                          {specs.dimensions.seatingCapacity && (
                            <div>
                              <span className="font-semibold">{specs.dimensions.seatingCapacity}</span> Seats
                            </div>
                          )}
                          {specs.engine?.transmission && (
                            <div>
                              <span className="font-semibold">{specs.engine.transmission}</span>
                            </div>
                          )}
                          {specs.engine?.fuelType && (
                            <div>
                              <span className="font-semibold">{specs.engine.fuelType}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="text-[13px] text-steel mb-4 border-t border-line pt-4">
                        {vehicle.hidePrice ? (
                          <Link
                            href={`/quote?model=${vehicle.slug}`}
                            className="text-ink font-bold text-lg hover:text-geely-blue transition-colors"
                          >
                            Price on request
                          </Link>
                        ) : (
                          <>
                            Starting from{" "}
                            <span className="text-ink font-bold text-lg">
                              {formatVehiclePrice(vehicle.finalPrice || vehicle.basePrice)}
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex gap-3">
                        <Link
                          href={`/quote?model=${vehicle.slug}`}
                          className="flex-1 text-center text-[12px] font-bold py-[10px] rounded bg-navy text-white hover:bg-opacity-90 transition-all"
                        >
                          Get a Quote
                        </Link>
                        <Link
                          href={`/models/${vehicle.slug}`}
                          className="flex-1 text-center text-[12px] font-bold py-[10px] rounded border border-line text-navy hover:bg-ice transition-all"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="bg-ice border-t border-line py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <h3 className="disp text-2xl text-navy font-bold mb-3">Can't decide?</h3>
          <p className="text-steel text-sm mb-6">
            Compare up to 3 vehicles side-by-side to find the perfect match for your needs.
          </p>
          <Link
            href="/compare"
            className="inline-block bg-geely-blue text-white font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all"
          >
            Compare Models
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
