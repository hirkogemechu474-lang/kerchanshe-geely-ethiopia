"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/MainLayout";
import {
  X,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
} from "lucide-react";

interface Vehicle {
  id: string;
  name: string;
  slug: string;
  model: string;
  year: number;
  category: string;
  basePrice: number;
  finalPrice: number | null;
  specifications: any;
  heroImageUrl: string | null;
  images: any;
}

type CompareRow = {
  label: string;
  value: (vehicle: Vehicle) => string | number;
  section?: boolean;
  lowerIsBetter?: boolean;
};

export default function ComparePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [highlightDifferences, setHighlightDifferences] = useState(true);
  const [loading, setLoading] = useState(true);
  const maxCompare = 3;

  useEffect(() => {
    void fetchVehicles();
  }, []);

  async function fetchVehicles() {
    try {
      const response = await fetch("/api/public/vehicles");
      if (!response.ok) return;

      const data = await response.json();
      setVehicles(Array.isArray(data) ? data : data.vehicles || []);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  }

  const selectedVehicleData = useMemo(
    () =>
      selectedVehicles
        .map((id) => vehicles.find((vehicle) => vehicle.id === id))
        .filter((vehicle): vehicle is Vehicle => Boolean(vehicle)),
    [selectedVehicles, vehicles]
  );

  const compareRows: CompareRow[] = [
    {
      label: "Vehicle Details",
      value: () => "",
      section: true,
    },
    { label: "Model", value: (vehicle) => vehicle.model },
    { label: "Year", value: (vehicle) => vehicle.year },
    { label: "Category", value: (vehicle) => vehicle.category },
    {
      label: "Performance",
      value: () => "",
      section: true,
    },
    {
      label: "Engine",
      value: (vehicle) => getSpec(vehicle, "engine.type"),
    },
    {
      label: "Power Output",
      value: (vehicle) => getSpec(vehicle, "engine.power"),
    },
    {
      label: "Transmission",
      value: (vehicle) => getSpec(vehicle, "engine.transmission"),
    },
    {
      label: "Drivetrain",
      value: (vehicle) => getSpec(vehicle, "engine.drivetrain"),
    },
    {
      label: "Fuel Type",
      value: (vehicle) => getSpec(vehicle, "engine.fuelType"),
    },
    {
      label: "Fuel Economy / Range",
      value: (vehicle) =>
        getSpec(
          vehicle,
          "engine.fuelEconomy",
          getSpec(vehicle, "engine.range")
        ),
    },
    {
      label: "Capacity",
      value: () => "",
      section: true,
    },
    {
      label: "Seating Capacity",
      value: (vehicle) => getSpec(vehicle, "dimensions.seatingCapacity"),
    },
    {
      label: "Dimensions",
      value: () => "",
      section: true,
    },
    {
      label: "Length",
      value: (vehicle) => getSpec(vehicle, "dimensions.length"),
    },
    {
      label: "Width",
      value: (vehicle) => getSpec(vehicle, "dimensions.width"),
    },
    {
      label: "Height",
      value: (vehicle) => getSpec(vehicle, "dimensions.height"),
    },
    {
      label: "Wheelbase",
      value: (vehicle) => getSpec(vehicle, "dimensions.wheelbase"),
    },
    {
      label: "Warranty",
      value: () => "",
      section: true,
    },
    {
      label: "Warranty Coverage",
      value: (vehicle) =>
        getSpec(
          vehicle,
          "warranty.basic",
          getSpec(vehicle, "warranty.powertrain", "—")
        ),
    },
  ];

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(price);

  const getImageUrl = (vehicle: Vehicle) =>
    vehicle.heroImageUrl ||
    (Array.isArray(vehicle.images) && vehicle.images[0]) ||
    null;

  const getSpec = (vehicle: Vehicle, path: string, defaultValue = "—") => {
    const keys = path.split(".");
    let value: any = vehicle.specifications || {};

    for (const key of keys) {
      value = value?.[key];
      if (value === undefined || value === null || value === "") {
        return defaultValue;
      }
    }

    return value ?? defaultValue;
  };

  const hasDifference = (values: Array<string | number>) => {
    const normalized = values.map((value) => String(value));
    return normalized.some((value, index) => index > 0 && value !== normalized[0]);
  };

  const getValueIndicator = (
    value: number,
    allValues: number[],
    higherIsBetter = true
  ) => {
    if (allValues.length < 2) return null;

    const max = Math.max(...allValues);
    const min = Math.min(...allValues);

    if (higherIsBetter) {
      if (value === max) return <TrendingUp className="inline text-green-600" size={16} />;
      if (value === min) return <TrendingDown className="inline text-red-600" size={16} />;
    } else {
      if (value === min) return <TrendingUp className="inline text-green-600" size={16} />;
      if (value === max) return <TrendingDown className="inline text-red-600" size={16} />;
    }

    return <Minus className="inline text-gray-400" size={16} />;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-geely-blue border-t-transparent mb-4" />
            <p className="text-steel">Loading vehicles...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const selectedPrices = selectedVehicleData.map((vehicle) => vehicle.finalPrice ?? vehicle.basePrice);

  return (
    <MainLayout>
      <div className="bg-navy py-16 text-white">
        <div className="mx-auto max-w-[1280px] px-10">
          <div className="mb-3 text-[13px] font-bold tracking-[0.14em] text-gold">
            COMPARE MODELS
          </div>
          <h1 className="disp mb-4 text-5xl font-bold">Side-by-Side Comparison</h1>
          <p className="max-w-2xl text-base text-[#d8e4f5]">
            Compare up to 3 Geely vehicles to find the perfect match for your needs.
          </p>
        </div>
      </div>

      <section className="bg-ice py-12">
        <div className="mx-auto max-w-[1280px] px-10">
          <h2 className="mb-6 text-2xl font-bold text-navy">
            Select vehicles to compare ({selectedVehicles.length}/{maxCompare})
          </h2>

          {vehicles.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-steel">No vehicles available for comparison</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-3">
              {vehicles.map((vehicle) => {
                const imageUrl = getImageUrl(vehicle);
                const isSelected = selectedVehicles.includes(vehicle.id);

                return (
                  <button
                    key={vehicle.id}
                    onClick={() =>
                      isSelected
                        ? setSelectedVehicles(selectedVehicles.filter((id) => id !== vehicle.id))
                        : selectedVehicles.length < maxCompare &&
                          setSelectedVehicles([...selectedVehicles, vehicle.id])
                    }
                    disabled={!isSelected && selectedVehicles.length >= maxCompare}
                    className={`rounded-lg border-2 p-4 text-left transition-all ${
                      isSelected
                        ? "border-geely-blue bg-white shadow-lg"
                        : "border-line bg-white hover:border-geely-blue"
                    } ${
                      !isSelected && selectedVehicles.length >= maxCompare
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    <div className="mb-2 flex h-32 items-center justify-center overflow-hidden rounded bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec]">
                      {imageUrl ? (
                        <img src={imageUrl} alt={vehicle.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="px-2 text-center text-xs text-steel">{vehicle.name}</span>
                      )}
                    </div>
                    <div className="mb-1 text-center text-sm font-bold text-navy">{vehicle.name}</div>
                    <div className="text-center text-[11px] text-steel">Price on request</div>
                    {isSelected && (
                      <div className="mt-2 flex justify-center">
                        <div className="rounded-full bg-geely-blue p-1 text-white">
                          <X size={12} />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {selectedVehicleData.length > 0 ? (
        <section className="py-12">
          <div className="mx-auto max-w-[1280px] px-10">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-navy">Comparison</h2>

              <div className="flex items-center gap-6">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={highlightDifferences}
                    onChange={(event) => setHighlightDifferences(event.target.checked)}
                    className="h-4 w-4 accent-geely-blue"
                  />
                  <span className="text-sm font-semibold text-navy">
                    Highlight Differences
                  </span>
                </label>

                <button
                  onClick={() => setSelectedVehicles([])}
                  className="flex items-center gap-2 text-sm font-semibold text-steel hover:text-navy"
                >
                  <X size={16} />
                  Clear All
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full overflow-hidden rounded-lg bg-white shadow-lg">
                <thead>
                  <tr className="bg-navy text-white">
                    <th className="w-56 p-4 text-left font-bold">Feature</th>
                    {selectedVehicleData.map((vehicle) => (
                      <th key={vehicle.id} className="min-w-[250px] p-4 text-center font-bold">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded bg-white bg-opacity-10 text-xs">
                            {getImageUrl(vehicle) ? (
                              <img
                                src={getImageUrl(vehicle) || ""}
                                alt={vehicle.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              vehicle.name
                            )}
                          </div>
                          <div className="text-base font-bold">{vehicle.name}</div>
                          <div className="text-sm text-gold">Price on request</div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {compareRows.map((row) =>
                    row.section ? (
                      <tr key={row.label} className="bg-navy text-white">
                        <td colSpan={selectedVehicleData.length + 1} className="p-3 font-bold">
                          {row.label.toUpperCase()}
                        </td>
                      </tr>
                    ) : (
                      <tr
                        key={row.label}
                        className={`border-b border-line ${
                          highlightDifferences &&
                          hasDifference(selectedVehicleData.map((vehicle) => row.value(vehicle)))
                            ? "bg-yellow-50"
                            : "bg-white"
                        }`}
                      >
                        <td className="bg-ice p-4 font-semibold">
                          <div className="flex items-center gap-2">
                            {row.label}
                            {highlightDifferences &&
                              hasDifference(selectedVehicleData.map((vehicle) => row.value(vehicle))) && (
                                <AlertCircle size={14} className="text-yellow-600" />
                              )}
                          </div>
                        </td>
                        {selectedVehicleData.map((vehicle) => {
                          const rawValue = row.value(vehicle);
                          const numericValue =
                            typeof rawValue === "number"
                              ? rawValue
                              : Number(rawValue.toString().replace(/[^0-9.-]/g, ""));
                          const hasNumericValues = selectedPrices.length > 1 && !Number.isNaN(numericValue);

                          return (
                            <td key={vehicle.id} className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2 font-medium text-navy">
                                {row.label === "Starting Price" && typeof rawValue === "number"
                                  ? formatPrice(rawValue)
                                  : rawValue}
                                {row.label === "Starting Price" &&
                                  hasNumericValues &&
                                  getValueIndicator(
                                    typeof rawValue === "number" ? rawValue : selectedPrices[0],
                                    selectedPrices,
                                    !row.lowerIsBetter
                                  )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    )
                  )}

                  <tr className="bg-ice">
                    <td className="p-4 font-semibold">Actions</td>
                    {selectedVehicleData.map((vehicle) => (
                      <td key={vehicle.id} className="p-4">
                        <div className="flex flex-col gap-2">
                          <Link
                            href={`/models/${vehicle.id}`}
                            className="block rounded bg-navy px-4 py-2 text-center text-xs font-bold text-white transition-all hover:bg-opacity-90"
                          >
                            View Details
                          </Link>
                          <Link
                            href={`/quote?model=${vehicle.id}`}
                            className="block rounded bg-gold px-4 py-2 text-center text-xs font-bold text-[#2c2308] transition-all hover:bg-opacity-90"
                          >
                            Get Quote
                          </Link>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : (
        <section className="py-20">
          <div className="mx-auto max-w-[1280px] px-10 text-center">
            <div className="mb-6 text-6xl">CAR</div>
            <h3 className="mb-3 text-2xl font-bold text-navy">
              Select vehicles to start comparing
            </h3>
            <p className="mb-8 text-base text-steel">
              Choose up to 3 vehicles from the selection above to see a detailed comparison.
            </p>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
