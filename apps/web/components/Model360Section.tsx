'use client';

import React, { useState } from 'react';
import { ModelSpotlightSimple } from './ModelSpotlightSimple';
import { ModelSpotlight360 } from './ModelSpotlight360';
import { RotateCw, Camera } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

interface ViewEntry {
  angle: string;
  image: string;
  label: string;
}

interface ShowcaseView {
  angle: string;
  imageUrl: string;
  label: string;
}

interface VehicleColorOption {
  id: string;
  name: string;
  colorCode: string;
  imageUrl: string | null;
  isDefault?: boolean;
}

interface Model360SectionProps {
  modelName: string;
  modelId: string;
  /** Gallery images from the database (preferred over static fallbacks) */
  images?: string[];
  /** Hero image for the primary view */
  heroImageUrl?: string | null;
  /** Uploaded in Admin → Vehicle Settings → 360° View for this model. */
  showcaseViews?: ShowcaseView[];
  /** Optional uploaded showcase video managed from the admin panel. */
  showcaseVideoUrl?: string | null;
  /** Managed in Admin → Vehicles → Colors. Selecting one swaps the front
   * view's image, mirroring geely.com.eg's color-switchable 360° viewer. */
  colors?: VehicleColorOption[];
}

const ANGLE_LABELS = [
  'Front 3/4 View',
  'Side View',
  'Rear 3/4 View',
  'Rear View',
  'Interior',
  'Dashboard',
  'Detail Shot',
  'Engine Bay',
];

export function Model360Section({
  modelName,
  modelId,
  images = [],
  heroImageUrl,
  showcaseViews = [],
  showcaseVideoUrl = null,
  colors = [],
}: Model360SectionProps) {
  const [activeTab, setActiveTab] = useState<'video' | '360' | 'angles'>(showcaseVideoUrl ? 'video' : '360');
  const colorsWithImages = colors.filter((c) => c.imageUrl);
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    colorsWithImages.find((c) => c.isDefault)?.id ?? colorsWithImages[0]?.id ?? null
  );
  const selectedColor = colorsWithImages.find((c) => c.id === selectedColorId) ?? null;

  // ── Build views from DB images ──────────────────────────────────────────────
  const buildViewsFromImages = (): ViewEntry[] => {
    if (showcaseViews.length > 0) {
      return showcaseViews
        .filter((view) => view.imageUrl)
        .map((view, index) => ({
          angle: view.angle || String(index * (360 / showcaseViews.length)),
          image: view.imageUrl,
          label: view.label || `View ${index + 1}`,
        }));
    }

    const allImages: string[] = [];

    if (heroImageUrl) allImages.push(heroImageUrl);

    for (const img of images) {
      if (img && !allImages.includes(img)) {
        allImages.push(img);
      }
    }

    if (allImages.length > 0) {
      return allImages.slice(0, 8).map((image, idx) => ({
        angle: String(idx * (360 / Math.min(allImages.length, 8))),
        image,
        label: ANGLE_LABELS[idx] || `View ${idx + 1}`,
      }));
    }

    const FALLBACK_VIEWS: Record<string, ViewEntry[]> = {
      coolray: [
        { angle: '0',   image: 'https://images.unsplash.com/photo-1617654112368-307921291f42?w=1200&auto=format&fit=crop', label: 'Front 3/4 View' },
        { angle: '45',  image: 'https://images.unsplash.com/photo-1617654112371-19db41682d31?w=1200&auto=format&fit=crop', label: 'Side View' },
        { angle: '90',  image: 'https://images.unsplash.com/photo-1617654112368-f0db409d65e0?w=1200&auto=format&fit=crop', label: 'Rear 3/4 View' },
        { angle: 'int', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&auto=format&fit=crop', label: 'Interior' },
      ],
      emgrand: [
        { angle: '0',   image: 'https://images.unsplash.com/photo-1619405399517-d7fce0f13302?w=1200&auto=format&fit=crop', label: 'Front 3/4 View' },
        { angle: '45',  image: 'https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=1200&auto=format&fit=crop', label: 'Side View' },
        { angle: '90',  image: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=1200&auto=format&fit=crop', label: 'Rear 3/4 View' },
        { angle: 'int', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&auto=format&fit=crop', label: 'Interior' },
      ],
    };

    return FALLBACK_VIEWS[modelId] ?? [
      { angle: '0',   image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop', label: 'Front 3/4 View' },
      { angle: '90',  image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop', label: 'Side View' },
      { angle: '180', image: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=1200&auto=format&fit=crop', label: 'Rear View' },
      { angle: 'int', image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&auto=format&fit=crop', label: 'Interior' },
    ];
  };

  const baseViews = buildViewsFromImages();
  const views = selectedColor
    ? [{ ...baseViews[0], image: selectedColor.imageUrl as string, label: selectedColor.name }, ...baseViews.slice(1)]
    : baseViews;
  const rawImageUrls = views.map(v => v.image);

  return (
    <section id="section-360" className="py-16 bg-white dark:bg-midnight-surface scroll-mt-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-6">
          <div>
            <div className="inline-block bg-active-blue/10 text-active-blue px-4 py-2 rounded-full text-sm font-bold mb-4 tracking-wider">
              360° INTERACTIVE VIEW
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy dark:text-ice mb-3">
              Discover Every Angle
            </h2>
            <p className="text-steel dark:text-steel-light text-lg">
              Navigate through multiple angles and discover the {modelName} from every perspective.
            </p>
          </div>

          {/* Color Swatches — managed in Admin → Vehicles → Colors */}
          {colorsWithImages.length > 0 && (
            <div className="flex items-start gap-3 self-start md:self-auto overflow-x-auto pb-1">
              {colorsWithImages.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setSelectedColorId(color.id)}
                  className="flex flex-col items-center gap-1.5 shrink-0 group"
                >
                  <span
                    className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedColorId === color.id
                        ? 'border-active-blue'
                        : 'border-transparent group-hover:border-line dark:group-hover:border-midnight-line'
                    }`}
                  >
                    <ImageWithFallback src={color.imageUrl as string} alt={color.name} className="w-full h-full object-cover" iconClassName="h-4 w-4" />
                  </span>
                  <span className="text-[11px] text-steel dark:text-steel-light font-semibold whitespace-nowrap">{color.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end mb-8">
          {/* Mode Switcher */}
          <div className="flex gap-2 bg-ice dark:bg-midnight p-1.5 rounded-xl border border-line dark:border-midnight-line self-start md:self-auto">
            {showcaseVideoUrl && <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-navy text-white shadow-md'
                  : 'text-steel dark:text-steel-light hover:text-navy dark:hover:text-ice'
              }`}
            >
              <Camera size={16} />
              Showcase Video
            </button>}
            <button
              onClick={() => setActiveTab('360')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === '360'
                  ? 'bg-navy text-white shadow-md'
                  : 'text-steel dark:text-steel-light hover:text-navy dark:hover:text-ice'
              }`}
            >
              <RotateCw size={16} />
              360° Drag Rotate
            </button>
            <button
              onClick={() => setActiveTab('angles')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'angles'
                  ? 'bg-navy text-white shadow-md'
                  : 'text-steel dark:text-steel-light hover:text-navy dark:hover:text-ice'
              }`}
            >
              <Camera size={16} />
              Angle Gallery
            </button>
          </div>
        </div>

        {activeTab === 'video' && showcaseVideoUrl ? (
          <div className="overflow-hidden rounded-xl bg-slate-950 shadow-2xl">
            <video
              className="mx-auto aspect-video max-h-[680px] w-full object-contain"
              src={showcaseVideoUrl}
              controls
              playsInline
              preload="metadata"
              aria-label={`${modelName} showcase video`}
            >
              <track kind="captions" src="/captions/no-dialogue.vtt" srcLang="en" label="English" default />
            </video>
          </div>
        ) : activeTab === '360' ? (
          <ModelSpotlight360
            modelName={modelName}
            images={rawImageUrls}
            totalFrames={rawImageUrls.length}
            className="shadow-2xl"
          />
        ) : (
          <ModelSpotlightSimple
            modelName={modelName}
            views={views}
            className="shadow-2xl"
          />
        )}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-ice dark:bg-midnight p-6 rounded-lg border border-line dark:border-midnight-line">
            <h3 className="font-bold text-navy dark:text-ice mb-2">Exterior Design</h3>
            <p className="text-steel dark:text-steel-light text-sm leading-relaxed">
              Premium styling with attention to aerodynamics and modern aesthetics that turns heads.
            </p>
          </div>
          <div className="bg-ice dark:bg-midnight p-6 rounded-lg border border-line dark:border-midnight-line">
            <h3 className="font-bold text-navy dark:text-ice mb-2">Interior Comfort</h3>
            <p className="text-steel dark:text-steel-light text-sm leading-relaxed">
              Spacious cabin with premium materials and thoughtful ergonomics for every journey.
            </p>
          </div>
          <div className="bg-ice dark:bg-midnight p-6 rounded-lg border border-line dark:border-midnight-line">
            <h3 className="font-bold text-navy dark:text-ice mb-2">Technology</h3>
            <p className="text-steel dark:text-steel-light text-sm leading-relaxed">
              Advanced connectivity and safety features designed for the modern Ethiopian driver.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
