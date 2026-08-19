'use client';

import { useState } from 'react';
import { Check, Sparkles, Sliders, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { formatVehiclePrice } from '@/lib/vehicleData';

interface ColorOption {
  name: string;
  hex: string;
  image?: string;
}

interface WheelOption {
  name: string;
  size: string;
  priceExtra: number;
}

interface TrimOption {
  name: string;
  tagline: string;
  priceExtra: number;
  features: string[];
}

interface TrimColorWheelPickerProps {
  vehicleSlug: string;
  vehicleName: string;
  basePrice: number;
  heroImage?: string;
  galleryImages?: string[];
}

// Default fallback options if vehicle metadata doesn't specify custom ones
const DEFAULT_COLORS: ColorOption[] = [
  { name: 'Crystal White', hex: '#F0F4F8' },
  { name: 'Storm Grey',    hex: '#4A5568' },
  { name: 'Onyx Black',    hex: '#1A202C' },
  { name: 'Sport Red',     hex: '#C53030' },
  { name: 'Pacific Blue',  hex: '#2B6CB0' },
];

const DEFAULT_TRIMS: TrimOption[] = [
  {
    name: 'Comfort',
    tagline: 'Essential modern luxury & efficiency',
    priceExtra: 0,
    features: ['10.25" Touchscreen', 'Rear Camera & Sensors', 'Cruise Control', 'LED Headlights'],
  },
  {
    name: 'Executive',
    tagline: 'Enhanced tech, safety & comfort',
    priceExtra: 350000,
    features: ['Panoramic Sunroof', 'Leatherette Seats', '360° Camera System', 'Wireless Charging'],
  },
  {
    name: 'Flagship Sport',
    tagline: 'Ultimate performance & premium finish',
    priceExtra: 700000,
    features: ['ADAS Level 2 Safety', '12.3" Dual Screens', 'Ventilated Sport Seats', 'Power Tailgate'],
  },
];

const DEFAULT_WHEELS: WheelOption[] = [
  { name: 'Standard Alloy', size: '17-inch', priceExtra: 0 },
  { name: 'Sport Diamond Cut', size: '18-inch', priceExtra: 85000 },
  { name: 'Performance Matte', size: '19-inch', priceExtra: 150000 },
];

export function TrimColorWheelPicker({
  vehicleSlug,
  vehicleName,
  basePrice,
  heroImage,
  galleryImages = [],
}: TrimColorWheelPickerProps) {
  const [selectedTrim, setSelectedTrim]   = useState(0);
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedWheel, setSelectedWheel] = useState(0);

  const trim = DEFAULT_TRIMS[selectedTrim];
  const color = DEFAULT_COLORS[selectedColor];
  const wheel = DEFAULT_WHEELS[selectedWheel];

  const totalPrice = basePrice + trim.priceExtra + wheel.priceExtra;

  // Pick an image based on color index (cycles through available gallery images)
  const currentDisplayImage =
    color.image ||
    (galleryImages.length > 0
      ? galleryImages[selectedColor % galleryImages.length]
      : heroImage) ||
    '';

  return (
    <section id="section-configurator" className="py-16 bg-white border-t border-b border-line scroll-mt-16">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        {/* Title */}
        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-gold/10 text-gold px-4 py-1.5 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
            <Sparkles size={14} />
            INTERACTIVE BUILDER
          </div>
          <h2 className="disp text-3xl md:text-4xl font-bold text-navy mb-2">
            Configure Your {vehicleName}
          </h2>
          <p className="text-steel text-base">
            Select your preferred trim, exterior color, and wheels to estimate pricing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* ── Left 7 Cols: Image Preview + Selected summary ────────── */}
          <div className="lg:col-span-7 space-y-6">
            {/* Main Preview Box */}
            <div className="relative h-[360px] md:h-[420px] bg-gradient-to-br from-slate-900 via-navy to-slate-800 rounded-2xl overflow-hidden shadow-2xl border border-line">
              {currentDisplayImage ? (
                <img
                  src={currentDisplayImage}
                  alt={`${vehicleName} in ${color.name}`}
                  className="w-full h-full object-cover transition-all duration-500"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/50 text-sm">
                  {vehicleName} Image Preview
                </div>
              )}

              {/* Overlaid Badges */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full border border-white/40"
                  style={{ backgroundColor: color.hex }}
                />
                {color.name}
              </div>

              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-lg border border-white/10">
                {wheel.name} ({wheel.size})
              </div>

              {/* Price Banner */}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 flex flex-wrap justify-between items-end">
                <div>
                  <div className="text-xs text-gold font-bold uppercase tracking-wider mb-1">
                    {trim.name} Edition
                  </div>
                  <div className="text-2xl md:text-3xl font-bold text-white">
                    {formatVehiclePrice(totalPrice)}
                  </div>
                </div>
                <Link
                  href={`/quote?model=${vehicleSlug}&trim=${encodeURIComponent(trim.name)}&color=${encodeURIComponent(color.name)}`}
                  className="bg-gold text-[#2c2308] font-bold text-xs px-5 py-3 rounded-lg hover:bg-opacity-90 transition-all flex items-center gap-2"
                >
                  Request Quote for this Build
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>

            {/* Included Features Grid */}
            <div className="bg-ice p-6 rounded-xl border border-line">
              <div className="text-xs font-bold text-steel uppercase tracking-wider mb-3">
                {trim.name} Package Highlights
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-navy">
                {trim.features.map((feat) => (
                  <div key={feat} className="flex items-center gap-2">
                    <Check size={14} className="text-geely-blue flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right 5 Cols: Selectors ─────────────────────────────── */}
          <div className="lg:col-span-5 space-y-8">
            {/* 1. Trim Selection */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-3">
                1. Select Trim Level
              </label>
              <div className="space-y-3">
                {DEFAULT_TRIMS.map((t, idx) => {
                  const isSelected = selectedTrim === idx;
                  return (
                    <button
                      key={t.name}
                      onClick={() => setSelectedTrim(idx)}
                      className={`
                        w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between
                        ${isSelected
                          ? 'border-geely-blue bg-blue-50/50 shadow-sm'
                          : 'border-line hover:border-steel bg-white'
                        }
                      `}
                    >
                      <div>
                        <div className="font-bold text-navy text-sm flex items-center gap-2">
                          {t.name}
                          {t.priceExtra === 0 && (
                            <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">
                              Standard
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-steel mt-0.5">{t.tagline}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-navy">
                          {t.priceExtra > 0 ? `+${formatVehiclePrice(t.priceExtra)}` : 'Included'}
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 mt-1 ml-auto flex items-center justify-center ${
                            isSelected ? 'border-geely-blue bg-geely-blue' : 'border-gray-300'
                          }`}
                        >
                          {isSelected && <Check size={12} className="text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Color Selection */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-3">
                2. Exterior Color: <span className="text-geely-blue">{color.name}</span>
              </label>
              <div className="flex gap-3 flex-wrap">
                {DEFAULT_COLORS.map((c, idx) => {
                  const isSelected = selectedColor === idx;
                  return (
                    <button
                      key={c.name}
                      onClick={() => setSelectedColor(idx)}
                      title={c.name}
                      className={`
                        w-10 h-10 rounded-full border-2 transition-all flex items-center justify-center shadow-sm relative group
                        ${isSelected ? 'border-geely-blue scale-110 ring-2 ring-geely-blue/20' : 'border-gray-300 hover:scale-105'}
                      `}
                      style={{ backgroundColor: c.hex }}
                    >
                      {isSelected && (
                        <Check
                          size={16}
                          className={c.hex === '#F0F4F8' ? 'text-navy' : 'text-white'}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Wheel Selection */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-3">
                3. Wheels & Rims
              </label>
              <div className="grid grid-cols-3 gap-2">
                {DEFAULT_WHEELS.map((w, idx) => {
                  const isSelected = selectedWheel === idx;
                  return (
                    <button
                      key={w.name}
                      onClick={() => setSelectedWheel(idx)}
                      className={`
                        p-3 rounded-xl border text-center transition-all
                        ${isSelected
                          ? 'border-geely-blue bg-blue-50/50 font-bold'
                          : 'border-line bg-white hover:border-steel'
                        }
                      `}
                    >
                      <div className="text-xs text-navy font-semibold">{w.size}</div>
                      <div className="text-[10px] text-steel mt-0.5">{w.name}</div>
                      <div className="text-[10px] text-geely-blue font-bold mt-1">
                        {w.priceExtra > 0 ? `+${formatVehiclePrice(w.priceExtra)}` : 'Included'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="pt-4 border-t border-line flex gap-3">
              <Link
                href={`/quote?model=${vehicleSlug}&trim=${encodeURIComponent(trim.name)}&color=${encodeURIComponent(color.name)}`}
                className="flex-1 bg-gold text-[#2c2308] font-bold text-sm py-3.5 rounded-xl hover:bg-opacity-90 transition-all text-center"
              >
                Get Custom Quote
              </Link>
              <Link
                href={`/test-drive?model=${vehicleSlug}`}
                className="flex-1 bg-navy text-white font-bold text-sm py-3.5 rounded-xl hover:bg-opacity-90 transition-all text-center"
              >
                Book Test Drive
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
