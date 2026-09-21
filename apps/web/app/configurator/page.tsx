'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '@/components/MainLayout';
import { type VehicleRecord } from '@/services/vehicleService';
import { Check, Share2, Download, Mail, ArrowLeft, CarFront, FileText, Camera } from 'lucide-react';
import { withBasePath } from '@/lib/basePath';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

interface TrimOption {
  id: string;
  name: string;
  price: number;
  features: string[];
}

interface ColorOption {
  id: string;
  name: string;
  hex: string;
  price: number;
  image?: string;
  /** Additional photos from other angles/sides — null/empty for most colors today. */
  images?: string[] | null;
}

interface WheelOption {
  id: string;
  name: string;
  size: string;
  price: number;
  image?: string;
  /** Additional photos from other angles/sides — null/empty for most wheels today. */
  images?: string[] | null;
}

interface InteriorOption {
  id: string;
  name: string;
  description: string | null;
  materialType: string;
  imageUrl: string | null;
  price: number;
  inStock: boolean;
  /** Additional photos from other angles/sides — null/empty for most interiors today. */
  images?: string[] | null;
}

interface AccessoryOption {
  id: string;
  name: string;
  description: string | null;
  category: string;
  price: number;
  imageUrl: string | null;
  inStock: boolean;
  /** Additional photos from other angles/sides — null/empty for most accessories today. */
  images?: string[] | null;
}

/** Opens the shared lightbox for an option's primary photo + its extra `images`, resolving each URL the same way every other image on this page already is. Returns the setter call, or does nothing if there's nothing extra to show. */
function buildGalleryImages(primary: string | null | undefined, extra: string[] | null | undefined): string[] {
  return [primary, ...(extra || [])]
    .filter((url): url is string => Boolean(url))
    .map((url) => withBasePath(url));
}

// Prefers the admin-managed hero image, falling back to the first gallery
// image — same resolution order as /configure's model cards and the model
// detail page, so a vehicle's configurator picture always matches what's
// shown everywhere else on the site.
function vehicleImage(vehicle: VehicleRecord | null | undefined): string | null {
  if (!vehicle) return null;
  if (vehicle.heroImageUrl) return withBasePath(vehicle.heroImageUrl);
  if (Array.isArray(vehicle.images) && typeof vehicle.images[0] === 'string') {
    return withBasePath(vehicle.images[0] as string);
  }
  return null;
}

function StepHeading({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-geely-blue text-white text-sm font-bold">
        {step}
      </span>
      <h2 className="font-display font-bold text-2xl text-navy dark:text-ice">{title}</h2>
    </div>
  );
}

export default function ConfiguratorPage() {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleRecord | null>(null);
  const [selectedTrim, setSelectedTrim] = useState<TrimOption | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorOption | null>(null);
  const [selectedWheels, setSelectedWheels] = useState<WheelOption | null>(null);
  const [selectedInterior, setSelectedInterior] = useState<InteriorOption | null>(null);
  const [selectedAccessories, setSelectedAccessories] = useState<AccessoryOption[]>([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [apiOptions, setApiOptions] = useState<{ trims: TrimOption[]; colors: ColorOption[]; wheels: WheelOption[]; interiors: InteriorOption[]; accessories: AccessoryOption[] } | null>(null);
  const [vehiclesLoaded, setVehiclesLoaded] = useState(false);
  const [lightbox, setLightbox] = useState<{ title: string; images: string[] } | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchVehicles() {
      try {
        const response = await fetch('/api/public/vehicles');
        if (!response.ok) return;

        const data = await response.json();
        const list = Array.isArray(data) ? data : data?.vehicles || [];

        if (active) {
          setVehicles(list);
          const requestedVehicle = new URLSearchParams(window.location.search).get('vehicle');
          setSelectedVehicle(list.find((vehicle: VehicleRecord) => vehicle.id === requestedVehicle || vehicle.slug === requestedVehicle) || list[0] || null);
        }
      } catch (error) {
        console.error('Failed to load configuration vehicles:', error);
      } finally {
        if (active) setVehiclesLoaded(true);
      }
    }

    void fetchVehicles();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedVehicle) return;
    let active = true;
    fetch(`/api/public/vehicles/${encodeURIComponent(selectedVehicle.slug)}/configuration`)
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!active) return;
        setApiOptions(data ? {
          trims: Array.isArray(data.packages) ? data.packages.map((item: { id: string; name: string; price: number; features?: unknown }) => ({ id: item.id, name: item.name, price: item.price, features: Array.isArray(item.features) ? item.features.filter((feature): feature is string => typeof feature === 'string') : [] })) : [],
          colors: Array.isArray(data.colors) ? data.colors.map((item: { id: string; name: string; colorCode?: string; price: number; imageUrl?: string | null; images?: unknown }) => ({
            id: item.id,
            name: item.name,
            hex: item.colorCode || '#E5E7EB',
            price: item.price,
            image: item.imageUrl || undefined,
            images: Array.isArray(item.images) ? item.images.filter((url: unknown): url is string => typeof url === 'string') : null,
          })) : [],
          wheels: Array.isArray(data.wheels) ? data.wheels.map((item: { id: string; name: string; size: string; price: number; imageUrl?: string | null; images?: unknown }) => ({
            id: item.id,
            name: item.name,
            size: item.size,
            price: item.price,
            image: item.imageUrl || undefined,
            images: Array.isArray(item.images) ? item.images.filter((url: unknown): url is string => typeof url === 'string') : null,
          })) : [],
          interiors: Array.isArray(data.interiors) ? data.interiors.filter((item: InteriorOption) => item.inStock) : [],
          accessories: Array.isArray(data.accessories) ? data.accessories.filter((item: AccessoryOption) => item.inStock) : [],
        } : null);
      })
      .catch(() => active && setApiOptions(null));
    return () => { active = false; };
  }, [selectedVehicle]);

  // Initialize defaults
  useEffect(() => {
    if (!selectedVehicle) return;
    if (!selectedTrim && apiOptions?.trims.length) {
      setSelectedTrim(apiOptions.trims[0]);
    }
    if (!selectedColor && apiOptions?.colors.length) {
      setSelectedColor(apiOptions.colors[0]);
    }
    if (!selectedWheels && apiOptions?.wheels.length) {
      setSelectedWheels(apiOptions.wheels[0]);
    }
    if (!selectedInterior && apiOptions?.interiors.length) {
      setSelectedInterior(apiOptions.interiors[0]);
    }
  }, [selectedVehicle, apiOptions]);

  // Interiors/accessories are vehicle-specific — clear stale selections on model change.
  useEffect(() => {
    setSelectedInterior(null);
    setSelectedAccessories([]);
  }, [selectedVehicle?.id]);

  const toggleAccessory = (accessory: AccessoryOption) => {
    setSelectedAccessories((current) =>
      current.find((a) => a.id === accessory.id)
        ? current.filter((a) => a.id !== accessory.id)
        : [...current, accessory]
    );
  };

  // Calculate total price
  useEffect(() => {
    if (!selectedVehicle) return;
    const basePrice = selectedVehicle.finalPrice || selectedVehicle.basePrice;
    const trimPrice = selectedTrim?.price || 0;
    const colorPrice = selectedColor?.price || 0;
    const wheelsPrice = selectedWheels?.price || 0;
    const interiorPrice = selectedInterior?.price || 0;
    const accessoriesPrice = selectedAccessories.reduce((sum, a) => sum + a.price, 0);

    setTotalPrice(basePrice + trimPrice + colorPrice + wheelsPrice + interiorPrice + accessoriesPrice);
  }, [selectedVehicle, selectedTrim, selectedColor, selectedWheels, selectedInterior, selectedAccessories]);

  const handleShare = () => {
    if (!selectedVehicle) return;
    const config = {
      vehicle: selectedVehicle.name,
      trim: selectedTrim?.name,
      color: selectedColor?.name,
      wheels: selectedWheels?.name,
      interior: selectedInterior?.name,
      accessories: selectedAccessories.map((a) => a.name),
      price: totalPrice
    };

    const shareUrl = `${window.location.origin}/configurator?config=${encodeURIComponent(JSON.stringify(config))}`;

    if (navigator.share) {
      navigator.share({
        title: `My ${selectedVehicle.name} Configuration`,
        text: `Check out my custom ${selectedVehicle.name}`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Configuration link copied to clipboard!');
    }
  };

  const handleSendConfiguration = () => {
    if (!selectedVehicle) return;
    const config = {
      vehicle: selectedVehicle.name,
      trim: selectedTrim?.name,
      color: selectedColor?.name,
      wheels: selectedWheels?.name,
      interior: selectedInterior?.name,
      accessories: selectedAccessories.map((a) => a.name),
      price: totalPrice
    };

    window.location.href = withBasePath(`/quote?config=${encodeURIComponent(JSON.stringify(config))}`);
  };

  const currentTrimOptions = apiOptions?.trims || [];
  const activeColorOptions = apiOptions?.colors || [];
  const activeInteriorOptions = apiOptions?.interiors || [];
  const activeAccessoryOptions = apiOptions?.accessories || [];
  const activeWheelOptions = apiOptions?.wheels || [];

  // The selected color's own swatch photo (when admin has uploaded one) beats
  // the generic vehicle hero shot — same "color click swaps the image"
  // behavior already used on the model detail page.
  const previewImage = (selectedColor?.image && withBasePath(selectedColor.image)) || vehicleImage(selectedVehicle);

  if (vehiclesLoaded && !selectedVehicle) {
    return (
      <MainLayout>
        <div className="max-w-[1280px] mx-auto px-4 py-24 text-center">
          <CarFront size={48} className="mx-auto mb-4 text-steel dark:text-steel-light" />
          <p className="text-steel dark:text-steel-light">No vehicles are available to configure right now.</p>
          <Link href="/configure" className="inline-block mt-4 text-geely-blue font-semibold hover:underline">
            Browse models
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy to-geely-blue dark:from-midnight dark:to-navy text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,.12),transparent_45%)]" />
        <div className="relative max-w-[1280px] mx-auto px-4 py-14 lg:py-20 grid gap-10 lg:grid-cols-[1.1fr_1fr] items-center">
          <div>
            <Link href="/configure" className="inline-flex items-center gap-2 text-sm font-bold text-gold hover:underline mb-6">
              <ArrowLeft size={16} /> Back to Models
            </Link>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70 mb-3">Build Your Geely</p>
            <h1 className="font-display font-bold text-3xl lg:text-5xl mb-4">
              Configure Your {selectedVehicle ? selectedVehicle.name.replace('Geely ', '') : 'Geely'}
            </h1>
            <p className="text-white/80 max-w-xl text-base lg:text-lg">
              Customize your vehicle with your preferred trim, color, wheels, and more, and see your configuration update in real time.
            </p>
            {selectedVehicle && (
              <Link
                href={`/models/${selectedVehicle.slug}`}
                className="inline-flex items-center gap-1.5 mt-5 text-sm font-bold text-white/90 hover:text-white hover:underline"
              >
                View full specifications &amp; gallery →
              </Link>
            )}
          </div>
          <div className="relative flex min-h-[220px] items-center justify-center rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm lg:min-h-[280px]">
            {previewImage ? (
              <ImageWithFallback src={previewImage} alt={selectedVehicle?.name || 'Geely'} className="max-h-[260px] w-full object-contain" iconClassName="h-14 w-14" />
            ) : (
              <CarFront size={110} className="text-white/30" />
            )}
          </div>
        </div>
      </section>

      <div className="max-w-[1280px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Vehicle Selector */}
            <section>
              <StepHeading step={1} title="Select Model" />
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vehicles.slice(0, 6).map((vehicle) => {
                  const image = vehicleImage(vehicle);
                  const isSelected = selectedVehicle?.id === vehicle.id;
                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => setSelectedVehicle(vehicle)}
                      className={`group relative overflow-hidden rounded-2xl border-2 bg-white dark:bg-midnight-surface transition-all text-left ${
                        isSelected
                          ? 'border-geely-blue shadow-lg'
                          : 'border-line dark:border-midnight-line hover:border-geely-blue'
                      }`}
                    >
                      <div className="h-24 bg-gradient-to-br from-[#edf4fb] to-white dark:from-midnight dark:to-midnight-surface flex items-center justify-center p-2">
                        {image ? (
                          <ImageWithFallback src={image} alt={vehicle.name} className="h-full w-full object-contain transition duration-300 group-hover:scale-105" iconClassName="h-6 w-6" />
                        ) : (
                          <CarFront size={32} className="text-geely-blue/30" />
                        )}
                      </div>
                      <div className="p-3">
                        <div className="font-bold text-navy dark:text-ice text-sm mb-0.5 truncate">
                          {vehicle.name.replace('Geely ', '')}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-geely-blue rounded-full flex items-center justify-center">
                          <Check size={12} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Trim Selector */}
            {currentTrimOptions.length > 0 && (
              <section>
                <StepHeading step={2} title="Choose Trim Level" />
                <div className="space-y-3">
                  {currentTrimOptions.map((trim) => (
                    <button
                      key={trim.id}
                      onClick={() => setSelectedTrim(trim)}
                      className={`w-full p-6 rounded-2xl border-2 transition-all text-left ${
                        selectedTrim?.id === trim.id
                          ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                          : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-navy dark:text-ice text-lg mb-1">{trim.name}</h3>
                        </div>
                        {selectedTrim?.id === trim.id && (
                          <div className="w-6 h-6 bg-geely-blue rounded-full flex items-center justify-center">
                            <Check size={16} className="text-white" />
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {trim.features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm text-steel dark:text-steel-light">
                            <Check size={14} className="text-green-600 flex-shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {/* Color Selector */}
            {activeColorOptions.length > 0 && (
              <section>
                <StepHeading step={3} title="Select Exterior Color" />
                <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                  {activeColorOptions.map((color) => (
                    <div key={color.id} className="relative">
                      <button
                        onClick={() => setSelectedColor(color)}
                        className={`w-full p-4 rounded-2xl border-2 transition-all ${
                          selectedColor?.id === color.id
                            ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                            : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                        }`}
                      >
                        <div
                          className="relative w-full h-16 rounded-lg mb-2 border border-line dark:border-midnight-line overflow-hidden"
                          style={{ backgroundColor: color.hex }}
                        >
                          {color.image && (
                            <ImageWithFallback src={withBasePath(color.image)} alt={color.name} className="absolute inset-0 w-full h-full object-cover" iconClassName="h-5 w-5" />
                          )}
                        </div>
                        <div className="text-xs font-semibold text-navy dark:text-ice mb-1 text-center">
                          {color.name}
                        </div>
                        {selectedColor?.id === color.id && (
                          <div className="mt-2 flex justify-center">
                            <div className="w-5 h-5 bg-geely-blue rounded-full flex items-center justify-center">
                              <Check size={12} className="text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                      {color.images && color.images.length > 0 && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setLightbox({ title: color.name, images: buildGalleryImages(color.image, color.images) });
                          }}
                          aria-label={`View ${color.name} photos`}
                          className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                          <Camera size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Wheel Selector */}
            {activeWheelOptions.length > 0 && (
              <section>
                <StepHeading step={4} title="Choose Wheels" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeWheelOptions.map((wheel) => (
                    <div key={wheel.id} className="relative">
                      <button
                        onClick={() => setSelectedWheels(wheel)}
                        className={`w-full p-6 rounded-2xl border-2 transition-all ${
                          selectedWheels?.id === wheel.id
                            ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                            : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                        }`}
                      >
                        <div className="h-24 w-24 mx-auto rounded-full mb-3 flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec]">
                          {wheel.image ? (
                            <ImageWithFallback src={withBasePath(wheel.image)} alt={wheel.name} className="h-full w-full object-cover" iconClassName="h-7 w-7" />
                          ) : (
                            <span className="text-2xl font-bold text-navy dark:text-ice">{wheel.size}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-navy dark:text-ice mb-1 text-center">{wheel.name}</h3>
                        <p className="text-sm text-steel dark:text-steel-light mb-2 text-center">{wheel.size} Wheels</p>
                        {selectedWheels?.id === wheel.id && (
                          <div className="mt-3 flex justify-center">
                            <div className="w-6 h-6 bg-geely-blue rounded-full flex items-center justify-center">
                              <Check size={14} className="text-white" />
                            </div>
                          </div>
                        )}
                      </button>
                      {wheel.images && wheel.images.length > 0 && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setLightbox({ title: wheel.name, images: buildGalleryImages(wheel.image, wheel.images) });
                          }}
                          aria-label={`View ${wheel.name} photos`}
                          className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                          <Camera size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Interior Selector */}
            {activeInteriorOptions.length > 0 && (
              <section>
                <StepHeading step={5} title="Choose Interior" />
                <div className="space-y-3">
                  {activeInteriorOptions.map((interior) => (
                    <div key={interior.id} className="relative">
                      <button
                        onClick={() => setSelectedInterior(interior)}
                        className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                          selectedInterior?.id === interior.id
                            ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                            : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {interior.imageUrl && (
                            <ImageWithFallback
                              src={withBasePath(interior.imageUrl)}
                              alt={interior.name}
                              className="w-20 h-20 rounded-lg object-cover shrink-0 border border-line dark:border-midnight-line"
                              iconClassName="h-6 w-6"
                            />
                          )}
                          <div className="flex flex-1 items-start justify-between">
                            <div>
                              <h3 className="font-bold text-navy dark:text-ice mb-1">{interior.name}</h3>
                              <p className="text-sm text-steel dark:text-steel-light">{interior.materialType}</p>
                              {interior.description && (
                                <p className="text-xs text-steel dark:text-steel-light mt-1">{interior.description}</p>
                              )}
                            </div>
                            {selectedInterior?.id === interior.id && (
                              <div className="w-6 h-6 bg-geely-blue rounded-full flex items-center justify-center shrink-0">
                                <Check size={14} className="text-white" />
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                      {interior.imageUrl && interior.images && interior.images.length > 0 && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setLightbox({ title: interior.name, images: buildGalleryImages(interior.imageUrl, interior.images) });
                          }}
                          aria-label={`View ${interior.name} photos`}
                          className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                        >
                          <Camera size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Accessories Selector */}
            {activeAccessoryOptions.length > 0 && (
              <section>
                <StepHeading step={6} title="Add Accessories" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAccessoryOptions.map((accessory) => {
                    const isSelected = selectedAccessories.some((a) => a.id === accessory.id);
                    return (
                      <div key={accessory.id} className="relative">
                        <button
                          onClick={() => toggleAccessory(accessory)}
                          className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                            isSelected
                              ? 'border-geely-blue bg-ice dark:bg-midnight shadow-lg'
                              : 'border-line dark:border-midnight-line bg-white dark:bg-midnight-surface hover:border-geely-blue'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {accessory.imageUrl && (
                              <ImageWithFallback
                                src={withBasePath(accessory.imageUrl)}
                                alt={accessory.name}
                                className="w-14 h-14 rounded-lg object-cover shrink-0 border border-line dark:border-midnight-line"
                                iconClassName="h-5 w-5"
                              />
                            )}
                            <div className="flex flex-1 items-start justify-between">
                              <div>
                                <div className="text-xs text-gold font-bold mb-1">{accessory.category}</div>
                                <h3 className="font-bold text-navy dark:text-ice">{accessory.name}</h3>
                                {accessory.description && (
                                  <p className="text-xs text-steel dark:text-steel-light mt-1">{accessory.description}</p>
                                )}
                              </div>
                              {isSelected && (
                                <div className="w-6 h-6 bg-geely-blue rounded-full flex items-center justify-center shrink-0">
                                  <Check size={14} className="text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                        {accessory.imageUrl && accessory.images && accessory.images.length > 0 && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setLightbox({ title: accessory.name, images: buildGalleryImages(accessory.imageUrl, accessory.images) });
                            }}
                            aria-label={`View ${accessory.name} photos`}
                            className="absolute top-1.5 right-1.5 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                          >
                            <Camera size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Vehicle Preview */}
              <div className="bg-white dark:bg-midnight-surface rounded-2xl shadow-lg p-6 border border-line dark:border-midnight-line">
                <h3 className="font-display font-bold text-navy dark:text-ice text-lg mb-4">Your Configuration</h3>

                {/* Vehicle Image */}
                <div
                  className="h-48 rounded-xl mb-4 flex items-center justify-center overflow-hidden border border-line dark:border-midnight-line"
                  style={!previewImage ? { backgroundColor: selectedColor?.hex || '#F8F9FA' } : { backgroundColor: '#F8F9FA' }}
                >
                  {previewImage ? (
                    <ImageWithFallback src={previewImage} alt={selectedVehicle?.name || ''} className="w-full h-full object-contain p-2" iconClassName="h-8 w-8" />
                  ) : (
                    <div className="text-center">
                      <CarFront size={40} className="mx-auto mb-2 text-navy/40 dark:text-ice/40" />
                      <div className="text-sm text-navy dark:text-ice font-semibold">
                        {selectedVehicle?.name}
                      </div>
                      <div className="text-xs text-steel dark:text-steel-light mt-1">
                        {selectedColor?.name}
                      </div>
                    </div>
                  )}
                </div>

                {/* Configuration Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-line dark:border-midnight-line">
                    <span className="text-sm text-steel dark:text-steel-light">Model</span>
                    <span className="text-sm font-semibold text-navy dark:text-ice">{selectedVehicle?.name}</span>
                  </div>

                  {selectedTrim && (
                    <div className="flex justify-between items-center py-2 border-b border-line dark:border-midnight-line">
                      <span className="text-sm text-steel dark:text-steel-light">Trim</span>
                      <span className="text-sm font-semibold text-navy dark:text-ice">{selectedTrim.name}</span>
                    </div>
                  )}

                  {selectedColor && (
                    <div className="flex justify-between items-center py-2 border-b border-line dark:border-midnight-line">
                      <span className="text-sm text-steel dark:text-steel-light">Color</span>
                      <span className="text-sm font-semibold text-navy dark:text-ice">{selectedColor.name}</span>
                    </div>
                  )}

                  {selectedWheels && (
                    <div className="flex justify-between items-center py-2 border-b border-line dark:border-midnight-line">
                      <span className="text-sm text-steel dark:text-steel-light">Wheels</span>
                      <span className="text-sm font-semibold text-navy dark:text-ice">{selectedWheels.name}</span>
                    </div>
                  )}

                  {selectedInterior && (
                    <div className="flex justify-between items-center py-2 border-b border-line dark:border-midnight-line">
                      <span className="text-sm text-steel dark:text-steel-light">Interior</span>
                      <span className="text-sm font-semibold text-navy dark:text-ice">{selectedInterior.name}</span>
                    </div>
                  )}

                  {selectedAccessories.length > 0 && (
                    <div className="py-2 border-b border-line dark:border-midnight-line">
                      <span className="text-sm text-steel dark:text-steel-light">Accessories</span>
                      {selectedAccessories.map((acc) => (
                        <div key={acc.id} className="flex justify-between items-center mt-1">
                          <span className="text-sm font-semibold text-navy dark:text-ice">{acc.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <button
                    onClick={handleSendConfiguration}
                    className="w-full bg-gold text-navy dark:text-ice font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Mail size={18} />
                    Send My Configuration
                  </button>

                  <button
                    onClick={handleShare}
                    className="w-full bg-white dark:bg-midnight-surface text-navy dark:text-ice font-bold py-3 rounded-lg border-2 border-navy hover:bg-ice dark:hover:bg-midnight transition-all flex items-center justify-center gap-2"
                  >
                    <Share2 size={18} />
                    Share Configuration
                  </button>

                  {selectedVehicle && (
                    <a
                      href={withBasePath(`/api/vehicles/${encodeURIComponent(selectedVehicle.slug)}/brochure`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full bg-white dark:bg-midnight-surface text-navy dark:text-ice font-bold py-3 rounded-lg border-2 border-line dark:border-midnight-line hover:border-geely-blue transition-all flex items-center justify-center gap-2"
                    >
                      <Download size={18} />
                      Download Brochure
                    </a>
                  )}

                  {selectedVehicle && (
                    <Link
                      href={`/models/${selectedVehicle.slug}`}
                      className="w-full text-navy dark:text-ice font-semibold py-2 flex items-center justify-center gap-2 text-sm hover:text-geely-blue"
                    >
                      <FileText size={15} />
                      View Full Details &amp; Specs
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {lightbox && (
        <ImageLightbox images={lightbox.images} title={lightbox.title} onClose={() => setLightbox(null)} />
      )}
    </MainLayout>
  );
}
