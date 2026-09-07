'use client';

import { useState } from 'react';
import { Check, Camera } from 'lucide-react';
import Button from '@/components/ui/Button';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { ImageLightbox } from '@/components/ui/ImageLightbox';

interface ColorOption {
  id: string;
  name: string;
  colorCode: string;
  imageUrl: string;
  isDefault: boolean;
  /** Additional photos from other angles/sides — null/empty for most colors today. */
  images?: string[] | null;
}

interface InteriorOption {
  id: string;
  name: string;
  description: string | null;
  materialType: string;
  imageUrl: string;
  isDefault: boolean;
}

interface WheelOption {
  id: string;
  name: string;
  size: string;
  imageUrl: string;
  isDefault: boolean;
}

interface PackageOption {
  id: string;
  name: string;
  description: string | null;
  features: string[];
  isDefault: boolean;
}

interface AccessoryOption {
  id: string;
  name: string;
  description: string | null;
  category: string;
  imageUrl: string;
}

interface VehicleOptionsShowcaseProps {
  vehicleSlug: string;
  vehicleName: string;
  heroImage?: string;
  colors: ColorOption[];
  interiors: InteriorOption[];
  wheels: WheelOption[];
  packages: PackageOption[];
  accessories: AccessoryOption[];
  visitId?: string;
}

/**
 * Purely informational — no price is fetched or displayed anywhere in this
 * component, matching the site's browsing-page price-hiding convention.
 * The interactive priced "Build & Price" experience lives at /configurator.
 */
export function VehicleOptionsShowcase({
  vehicleSlug,
  vehicleName,
  heroImage,
  colors,
  interiors,
  wheels,
  packages,
  accessories,
  visitId,
}: VehicleOptionsShowcaseProps) {
  const [selectedColor, setSelectedColor] = useState(
    colors.findIndex((c) => c.isDefault) >= 0 ? colors.findIndex((c) => c.isDefault) : 0
  );
  const [lightbox, setLightbox] = useState<{ title: string; images: string[] } | null>(null);
  const visitParam = visitId ? `&visitId=${encodeURIComponent(visitId)}` : '';

  const hasAnything =
    colors.length > 0 ||
    interiors.length > 0 ||
    wheels.length > 0 ||
    packages.length > 0 ||
    accessories.length > 0;

  if (!hasAnything) return null;

  const activeColor = colors[selectedColor];
  const previewImage = activeColor?.imageUrl || heroImage || '';

  return (
    <>
    <section id="section-options" className="py-16 bg-white dark:bg-midnight-surface border-t border-b border-line dark:border-midnight-line scroll-mt-[108px] sm:scroll-mt-[116px] lg:scroll-mt-[84px]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-active-blue/10 text-active-blue px-4 py-1.5 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
            Explore Options
          </div>
          <h2 className="disp text-3xl md:text-4xl font-bold text-navy dark:text-ice mb-2">
            Colors, Trims &amp; Accessories
          </h2>
          <p className="text-steel dark:text-steel-light text-base">
            Available options for the {vehicleName}. Contact us for a personalized quote.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* ── Left: preview + colors ─────────────────────────────── */}
          <div className="lg:col-span-5 space-y-6">
            <div className="relative h-[300px] md:h-[360px] bg-mesh-blue rounded-2xl overflow-hidden shadow-2xl border border-line">
              {previewImage ? (
                <ImageWithFallback
                  src={previewImage}
                  alt={activeColor ? `${vehicleName} in ${activeColor.name}` : vehicleName}
                  className="w-full h-full object-cover transition-all duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
                  {vehicleName} Image Preview
                </div>
              )}
              {activeColor && (
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full border border-white/40"
                    style={{ backgroundColor: activeColor.colorCode }}
                  />
                  {activeColor.name}
                </div>
              )}
              {activeColor && Array.isArray(activeColor.images) && activeColor.images.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setLightbox({
                      title: `${vehicleName} in ${activeColor.name}`,
                      images: [activeColor.imageUrl, ...activeColor.images!].filter(Boolean) as string[],
                    })
                  }
                  aria-label={`View more photos of ${activeColor.name}`}
                  className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-black/80 transition-colors"
                >
                  <Camera size={13} /> View Photos
                </button>
              )}
            </div>

            {colors.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-3">
                  Exterior Colors
                </label>
                <div className="flex gap-3 flex-wrap">
                  {colors.map((c, idx) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(idx)}
                      title={c.name}
                      className={`w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center shadow-sm ${
                        selectedColor === idx
                          ? 'border-active-blue scale-110 ring-2 ring-active-blue/20'
                          : 'border-gray-300 hover:scale-105'
                      }`}
                      style={{ backgroundColor: c.colorCode }}
                    >
                      {selectedColor === idx && (
                        <Check size={16} className="text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {wheels.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-navy dark:text-ice uppercase tracking-wider mb-3">
                  Wheels &amp; Rims
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {wheels.map((w) => (
                    <div
                      key={w.id}
                      className="p-3 rounded-xl border border-line dark:border-midnight-line bg-white dark:bg-midnight-surface text-center"
                    >
                      <div className="text-xs text-navy font-semibold">{w.size}</div>
                      <div className="text-[10px] text-steel dark:text-steel-light mt-0.5">{w.name}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: trims, interiors, accessories ───────────────── */}
          <div className="lg:col-span-7 space-y-8">
            {packages.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-3">
                  Trim Levels
                </label>
                <div className="space-y-3">
                  {packages.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl border border-line bg-white">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-navy text-sm">{p.name}</span>
                        {p.isDefault && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">
                            Standard
                          </span>
                        )}
                      </div>
                      {p.description && (
                        <div className="text-xs text-steel mb-2">{p.description}</div>
                      )}
                      {p.features.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-navy">
                          {p.features.map((feat) => (
                            <div key={feat} className="flex items-center gap-2">
                              <Check size={13} className="text-active-blue flex-shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {interiors.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-3">
                  Interior Options
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {interiors.map((i) => (
                    <div key={i.id} className="p-4 rounded-xl border border-line bg-white">
                      <div className="font-bold text-navy text-sm">{i.name}</div>
                      <div className="text-xs text-steel mt-0.5">{i.materialType}</div>
                      {i.description && (
                        <div className="text-xs text-steel mt-1">{i.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {accessories.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-3">
                  Accessories
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {accessories.map((a) => (
                    <div key={a.id} className="p-4 rounded-xl border border-line bg-white">
                      <div className="text-[10px] text-active-blue font-bold mb-1 uppercase tracking-wide">
                        {a.category}
                      </div>
                      <div className="font-bold text-navy text-sm">{a.name}</div>
                      {a.description && (
                        <div className="text-xs text-steel mt-1">{a.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-3 flex-wrap">
              <Button href={`/quote?model=${vehicleSlug}${visitParam}`} variant="solid" size="md">
                Get a Quote for This Build
              </Button>
              <Button href={`/test-drive?model=${vehicleSlug}${visitParam}`} variant="outline" tone="light" size="md">
                Book Test Drive
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
    {lightbox && (
      <ImageLightbox images={lightbox.images} title={lightbox.title} onClose={() => setLightbox(null)} />
    )}
    </>
  );
}
