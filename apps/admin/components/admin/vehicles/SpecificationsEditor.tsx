'use client';

import { useEffect, useId, useState } from 'react';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import {
  normalizeToSections,
  toSpecificationsPayload,
  type CanonicalSpecSections,
  type SpecHighlight,
} from '@/lib/vehicle-specifications';
import type { VehicleSpecificationLists } from '@/lib/vehicle-settings-types';
import ImageUpload from './ImageUpload';
import MediaBrowser from './MediaBrowser';

/** Sections with a dedicated photo/video gallery, shown on the public model page beyond the generic text fields. */
const IMAGE_GALLERY_TABS = new Set(['interior', 'exterior', 'safety', 'technology']);
type GalleryTab = 'interior' | 'exterior' | 'safety' | 'technology';

/** Where each tab's photo/video gallery actually renders on the public model page — see apps/web/app/models/[id]/page.tsx. */
const GALLERY_SECTION_NAME: Record<GalleryTab, string> = {
  interior: 'Interior Gallery',
  exterior: 'Exteriors',
  safety: 'Safety Media',
  technology: 'Technology Media',
};

/** Where each tab's feature-story highlights actually render on the public model page. */
const HIGHLIGHTS_SECTION_NAME: Record<GalleryTab, string> = {
  interior: 'Comfort & Experience',
  exterior: 'Exteriors',
  safety: 'Safety Engineering',
  technology: 'Technology Deep Dive',
};

interface SpecificationsEditorProps {
  specifications: any;
  onChange: (specifications: any) => void;
}

// "Vehicle Sections" taxonomy: Performance / Safety / Technology / Interior /
// Exterior (the user-requested structured panels), plus Warranty carried
// through unchanged. Renamed/reorganized from the old Engine/Dimensions/
// Features/Safety/Warranty tabs — see admin/lib/vehicle-specifications.ts
// for the field-mapping and the legacy dual-write this relies on.
const SECTION_TABS = [
  { id: 'performance', name: 'Performance', icon: '⚙️' },
  { id: 'safety', name: 'Safety', icon: '🛡️' },
  { id: 'technology', name: 'Technology', icon: '💡' },
  { id: 'interior', name: 'Interior', icon: '🪑' },
  { id: 'exterior', name: 'Exterior', icon: '🚗' },
  { id: 'warranty', name: 'Warranty & Service', icon: '📋' },
] as const;

// Only fields with a precise, curated reference list (Specifications page)
// get autocomplete suggestions — the Features reference lists are curated
// feature *names* (a chip-list concept), which don't map 1:1 onto any single
// scalar field here, so they're intentionally not force-fit as suggestions.
const PERFORMANCE_SUGGESTION_FIELDS: Record<string, keyof VehicleSpecificationLists> = {
  type: 'engine',
  transmission: 'transmission',
  fuelType: 'fuelType',
  drivetrain: 'driveType',
};

/**
 * Shared image thumbnail with a neutral fallback: shows a plain "IMG" placeholder
 * both when there's no URL at all and when the given URL fails to load
 * (broken/expired link) — tracked via local state so each instance recovers
 * independently. Mirrors the same convention in app/admin/vehicles/colors/page.tsx.
 */
function ImageThumb({ src, alt, sizeClass }: { src: string | null; alt: string; sizeClass: string }) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !src || imgError;

  return (
    <div className={`${sizeClass} rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex-shrink-0 overflow-hidden flex items-center justify-center`}>
      {showFallback ? (
        <span className="text-gray-400 dark:text-gray-500 text-[10px] font-medium">IMG</span>
      ) : (
        <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      )}
    </div>
  );
}

export default function SpecificationsEditor({ specifications, onChange }: SpecificationsEditorProps) {
  const [selectedTab, setSelectedTab] = useState<string>('performance');
  const [sections, setSections] = useState<CanonicalSpecSections>(() => normalizeToSections(specifications));
  const [suggestions, setSuggestions] = useState<VehicleSpecificationLists | null>(null);
  const datalistBaseId = useId();
  // Which highlight card's image picker is open — there can be many highlight
  // cards across the two tabs, all sharing this one MediaBrowser modal instance.
  const [activeHighlightImageIndex, setActiveHighlightImageIndex] = useState<{ tab: GalleryTab; index: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/vehicle-specifications');
        if (res.ok) setSuggestions(await res.json());
      } catch {
        /* suggestions are a nice-to-have, ignore failures */
      }
    })();
  }, []);

  const updateField = (tab: keyof CanonicalSpecSections, field: string, value: string) => {
    const next = { ...sections, [tab]: { ...(sections[tab] as Record<string, string>), [field]: value } };
    setSections(next);
    onChange(toSpecificationsPayload(next));
  };

  const updateImages = (tab: GalleryTab, images: string[]) => {
    const next = { ...sections, [tab]: { ...sections[tab], images } };
    setSections(next);
    onChange(toSpecificationsPayload(next));
  };

  const updateHighlights = (tab: GalleryTab, highlights: SpecHighlight[]) => {
    const next = { ...sections, [tab]: { ...sections[tab], highlights } };
    setSections(next);
    onChange(toSpecificationsPayload(next));
  };

  const addHighlight = (tab: GalleryTab) => {
    updateHighlights(tab, [...sections[tab].highlights, { title: '', description: '', imageUrl: '' }]);
  };

  const updateHighlightField = (tab: GalleryTab, index: number, field: 'title' | 'description', value: string) => {
    updateHighlights(tab, sections[tab].highlights.map((h, i) => (i === index ? { ...h, [field]: value } : h)));
  };

  const removeHighlight = (tab: GalleryTab, index: number) => {
    updateHighlights(tab, sections[tab].highlights.filter((_, i) => i !== index));
  };

  const applyTemplate = (raw: Record<string, any>) => {
    const next = normalizeToSections(raw);
    setSections(next);
    onChange(toSpecificationsPayload(next));
  };

  const renderFields = (tabId: string) => {
    const values = (sections as Record<string, any>)[tabId] as Record<string, string>;
    const suggestionFields = tabId === 'performance' ? PERFORMANCE_SUGGESTION_FIELDS : {};
    // `images` (string[] gallery) and `highlights` (SpecHighlight[]) are rendered separately below — not plain text fields.
    return Object.entries(values).filter(([key]) => key !== 'images' && key !== 'highlights').map(([key, value]) => {
      const label = key.replace(/([A-Z])/g, ' $1').trim();
      const suggestionKey = suggestionFields[key as keyof typeof suggestionFields];
      const options = suggestionKey ? suggestions?.[suggestionKey] : undefined;
      const datalistId = `${datalistBaseId}-${tabId}-${key}`;
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">{label}</label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => updateField(tabId as keyof CanonicalSpecSections, key, e.target.value)}
            list={options?.length ? datalistId : undefined}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            placeholder={`Enter ${label.toLowerCase()}`}
          />
          {options?.length ? (
            <datalist id={datalistId}>
              {options.map((o) => <option key={o} value={o} />)}
            </datalist>
          ) : null}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Vehicle Sections</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Structured specifications shown on the vehicle detail page. Performance fields suggest
          curated values from Vehicles → Specifications as you type.
        </p>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4 overflow-x-auto">
          {SECTION_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                selectedTab === tab.id
                  ? 'border-geely-blue text-geely-blue dark:text-blue-bright'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderFields(selectedTab)}
      </div>

      {IMAGE_GALLERY_TABS.has(selectedTab) && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 capitalize">
            {selectedTab} Photos & Videos
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Dedicated {selectedTab} media shown in the {GALLERY_SECTION_NAME[selectedTab as GalleryTab]} section
            on the vehicle detail page — add photos from multiple angles/sides, or a walkthrough video.
          </p>
          <ImageUpload
            images={(sections[selectedTab as GalleryTab].images as string[]) || []}
            onChange={(images) => updateImages(selectedTab as GalleryTab, images)}
          />
        </div>
      )}

      {IMAGE_GALLERY_TABS.has(selectedTab) && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1 capitalize">
            {selectedTab} Feature Highlights
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Real, per-vehicle feature stories — each becomes an alternating photo + headline + description
            block on the public model page&apos;s {HIGHLIGHTS_SECTION_NAME[selectedTab as GalleryTab]} section.
          </p>
          <div className="space-y-4">
            {(sections[selectedTab as GalleryTab].highlights as SpecHighlight[]).map((highlight, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-4 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <ImageThumb src={highlight.imageUrl || null} alt={highlight.title || 'Highlight'} sizeClass="w-16 h-16" />
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input
                      type="text"
                      value={highlight.title}
                      onChange={(e) => updateHighlightField(selectedTab as GalleryTab, index, 'title', e.target.value)}
                      placeholder="e.g. Bold Front Grille"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                      value={highlight.description}
                      onChange={(e) => updateHighlightField(selectedTab as GalleryTab, index, 'description', e.target.value)}
                      rows={2}
                      placeholder="e.g. A striking front fascia with chrome accents and signature LED lighting."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveHighlightImageIndex({ tab: selectedTab as GalleryTab, index })}
                      className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <ImageIcon className="w-4 h-4" />{highlight.imageUrl ? 'Change' : 'Choose'} Image
                    </button>
                    <button
                      type="button"
                      onClick={() => removeHighlight(selectedTab as GalleryTab, index)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
                      aria-label="Remove highlight"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addHighlight(selectedTab as GalleryTab)}
            className="mt-4 px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-geely-blue/10 dark:hover:bg-geely-blue/20 hover:border-geely-blue transition-colors"
          >
            + Add Highlight
          </button>
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Quick Fill Templates</h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          Click a template to auto-fill all sections with typical values
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(QUICK_FILL_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => applyTemplate(template)}
              type="button"
              className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 dark:text-gray-200 rounded-lg text-sm hover:bg-geely-blue/10 dark:hover:bg-geely-blue/20 hover:border-geely-blue transition-colors"
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      <MediaBrowser
        isOpen={activeHighlightImageIndex !== null}
        onClose={() => setActiveHighlightImageIndex(null)}
        onSelect={(url) => {
          if (!activeHighlightImageIndex) return;
          const { tab, index } = activeHighlightImageIndex;
          updateHighlights(tab, sections[tab].highlights.map((h, i) => (i === index ? { ...h, imageUrl: url } : h)));
          setActiveHighlightImageIndex(null);
        }}
        fileType="image"
        title="Select Highlight Image"
      />
    </div>
  );
}

/** Legacy-shaped templates — run through `normalizeToSections` on apply, same as any old vehicle's saved data. */
const QUICK_FILL_TEMPLATES: Record<string, { label: string } & Record<string, any>> = {
  'compact-suv': {
    label: 'Compact SUV',
    engine: { type: '1.5L Turbocharged Inline-4', displacement: '1,498 cc', power: '177 HP @ 5,500 RPM', torque: '255 Nm @ 1,500-4,000 RPM', transmission: '7-Speed DCT', drivetrain: 'Front-Wheel Drive', fuelType: 'Petrol', fuelEconomy: '6.5 L/100km (Combined)' },
    dimensions: { length: '4,330 mm', width: '1,800 mm', height: '1,609 mm', wheelbase: '2,600 mm', groundClearance: '180 mm', curbWeight: '1,380 kg', seatingCapacity: '5', cargoVolume: '420 L' },
    features: { infotainment: '10.25" Touchscreen, Apple CarPlay, Android Auto', connectivity: 'Bluetooth 5.0, USB, Wi-Fi', climate: 'Automatic Climate Control', seats: 'Fabric, Driver 6-way Manual Adjust', lighting: 'LED Headlights, LED DRLs', wheels: '17" Alloy Wheels' },
    safety: { airbags: '6 Airbags', abs: 'ABS with EBD', esc: 'Electronic Stability Control', tpms: 'Tire Pressure Monitoring System', cameras: 'Rear View Camera', sensors: 'Front & Rear Parking Sensors', adas: 'N/A' },
    warranty: { basic: '5 Years / 150,000 km', powertrain: '5 Years / 150,000 km', corrosion: '6 Years', roadside: '5 Years', maintenance: 'First Service Free' },
  },
  'midsize-suv': {
    label: 'Mid-Size SUV',
    engine: { type: '2.0L Turbocharged Inline-4', displacement: '1,998 cc', power: '238 HP @ 5,500 RPM', torque: '350 Nm @ 1,800-4,800 RPM', transmission: '8-Speed Automatic', drivetrain: 'All-Wheel Drive (AWD)', fuelType: 'Petrol', fuelEconomy: '8.2 L/100km (Combined)' },
    dimensions: { length: '4,770 mm', width: '1,895 mm', height: '1,689 mm', wheelbase: '2,845 mm', groundClearance: '200 mm', curbWeight: '1,720 kg', seatingCapacity: '7', cargoVolume: '560 L (3rd row up), 1,560 L (3rd row folded)' },
    features: { infotainment: '12.3" Touchscreen, Navigation, Premium Sound', connectivity: 'Bluetooth 5.1, USB-C, Wireless Charging', climate: 'Dual-Zone Automatic Climate Control', seats: 'Leather, Power Adjustable Driver & Passenger', lighting: 'Full LED Headlights, Adaptive Lighting', wheels: '19" Alloy Wheels' },
    safety: { airbags: '8 Airbags', abs: 'ABS with EBD & Brake Assist', esc: 'Electronic Stability Control with Traction Control', tpms: 'Tire Pressure Monitoring System', cameras: '360° Surround View Camera', sensors: 'Front, Rear & Side Parking Sensors', adas: 'Adaptive Cruise Control, Lane Keep Assist, Blind Spot Monitor' },
    warranty: { basic: '6 Years / 200,000 km', powertrain: '6 Years / 200,000 km', corrosion: '8 Years', roadside: '6 Years', maintenance: 'First 3 Services Free' },
  },
  'fullsize-suv': {
    label: 'Full-Size SUV',
    engine: { type: '3.0L V6 Turbocharged', displacement: '2,998 cc', power: '340 HP @ 6,000 RPM', torque: '450 Nm @ 2,000-5,000 RPM', transmission: '9-Speed Automatic', drivetrain: 'All-Wheel Drive (AWD)', fuelType: 'Petrol', fuelEconomy: '10.5 L/100km (Combined)' },
    dimensions: { length: '5,005 mm', width: '1,960 mm', height: '1,780 mm', wheelbase: '2,950 mm', groundClearance: '220 mm', curbWeight: '2,100 kg', seatingCapacity: '7', cargoVolume: '750 L (3rd row up), 2,100 L (all rows folded)' },
    features: { infotainment: '14.6" Touchscreen, Premium Navigation, 12-Speaker Bose', connectivity: 'Bluetooth 5.2, Multiple USB-C, Wi-Fi Hotspot', climate: 'Tri-Zone Automatic Climate Control', seats: 'Premium Leather, Ventilated Front Seats, Memory Function', lighting: 'Matrix LED Headlights, Ambient Interior Lighting', wheels: '21" Alloy Wheels' },
    safety: { airbags: '10 Airbags', abs: 'ABS with EBD, Brake Assist, Hill Descent Control', esc: 'Electronic Stability Control, Traction Control, Off-Road Modes', tpms: 'Tire Pressure Monitoring System', cameras: '360° Surround View with 3D View', sensors: 'Ultrasonic Sensors All Around', adas: 'Full ADAS Suite: ACC, LKA, BSM, AEB, Traffic Sign Recognition' },
    warranty: { basic: '7 Years / 250,000 km', powertrain: '7 Years / 250,000 km', corrosion: '10 Years', roadside: '7 Years', maintenance: 'First 5 Services Free' },
  },
  sedan: {
    label: 'Sedan',
    engine: { type: '1.4L Turbocharged Inline-4', displacement: '1,395 cc', power: '141 HP @ 5,200 RPM', torque: '235 Nm @ 1,600-4,000 RPM', transmission: 'CVT Automatic', drivetrain: 'Front-Wheel Drive', fuelType: 'Petrol', fuelEconomy: '5.8 L/100km (Combined)' },
    dimensions: { length: '4,638 mm', width: '1,820 mm', height: '1,460 mm', wheelbase: '2,650 mm', groundClearance: '150 mm', curbWeight: '1,280 kg', seatingCapacity: '5', cargoVolume: '450 L' },
    features: { infotainment: '10.25" Touchscreen, Apple CarPlay, Android Auto', connectivity: 'Bluetooth 5.0, USB', climate: 'Automatic Climate Control', seats: 'Fabric/Leather Combo, Manual Adjust', lighting: 'LED Headlights, LED Tail Lights', wheels: '17" Alloy Wheels' },
    safety: { airbags: '6 Airbags', abs: 'ABS with EBD', esc: 'Electronic Stability Control', tpms: 'Tire Pressure Monitoring System', cameras: 'Rear View Camera', sensors: 'Rear Parking Sensors', adas: 'Forward Collision Warning' },
    warranty: { basic: '5 Years / 150,000 km', powertrain: '5 Years / 150,000 km', corrosion: '6 Years', roadside: '5 Years', maintenance: 'First Service Free' },
  },
  electric: {
    label: 'Electric Vehicle',
    engine: { type: 'Permanent Magnet Synchronous Motor', displacement: 'N/A', power: '204 HP (150 kW)', torque: '310 Nm', transmission: 'Single-Speed Reduction Gear', drivetrain: 'Front-Wheel Drive', fuelType: 'Electric (BEV)', fuelEconomy: '16 kWh/100km' },
    dimensions: { length: '4,432 mm', width: '1,833 mm', height: '1,560 mm', wheelbase: '2,700 mm', groundClearance: '160 mm', curbWeight: '1,650 kg (with battery)', seatingCapacity: '5', cargoVolume: '380 L' },
    features: { infotainment: '12.3" Touchscreen, OTA Updates, Voice Control', connectivity: 'Bluetooth 5.1, 4G LTE, Wi-Fi, Multiple USB-C', climate: 'Automatic Climate Control with Pre-conditioning', seats: 'Eco-Leather, Heated Front Seats', lighting: 'Full LED Lighting, LED Light Bar', wheels: '18" Aerodynamic Alloy Wheels' },
    safety: { airbags: '7 Airbags', abs: 'ABS with EBD & Regenerative Braking', esc: 'Electronic Stability Control', tpms: 'Tire Pressure Monitoring System', cameras: '360° Surround View Camera', sensors: 'Front & Rear Parking Sensors', adas: 'Adaptive Cruise Control, Lane Keep Assist, Auto Emergency Braking' },
    warranty: { basic: '6 Years / 150,000 km', powertrain: '8 Years / 200,000 km (Battery: 8 years or 150,000 km, 70% capacity)', corrosion: '8 Years', roadside: '6 Years', maintenance: 'Reduced Maintenance (No Oil Changes)' },
  },
};
