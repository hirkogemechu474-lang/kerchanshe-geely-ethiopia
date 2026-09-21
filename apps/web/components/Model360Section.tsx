'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ModelSpotlightSimple } from './ModelSpotlightSimple';
import { ModelSpotlight360 } from './ModelSpotlight360';
import { Model3DViewer } from './Model3DViewer';
import { RotateCw, Camera, Box, Maximize2 } from 'lucide-react';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { ImageLightbox } from '@/components/ui/ImageLightbox';
// basePath.ts's withBasePath (not publicPath.ts's) — idempotent, so it's
// safe to use even on values that may already be basePath-prefixed.
import { withBasePath } from '@/lib/basePath';

interface ViewEntry {
  angle: string;
  image: string;
  label: string;
  /** Which VehicleColor this frame belongs to, when the showcase has a full spin sequence per color rather than one shared sequence. */
  colorId?: string;
}

interface ShowcaseView {
  angle: string;
  imageUrl: string;
  label: string;
  /** Optional — tags this frame as belonging to one VehicleColor's spin sequence (set from Admin → Vehicle Settings → 360° View). Vehicles without any tagged view keep today's single-shared-sequence behavior. */
  colorId?: string;
}

interface VehicleColorOption {
  id: string;
  name: string;
  colorCode: string;
  imageUrl: string | null;
  isDefault?: boolean;
  /** Additional photos from other angles/sides — null/empty for most colors today. */
  images?: string[] | null;
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
  /** Optional real .glb/.gltf 3D model managed from the admin panel — when
   * set, adds a drag-to-rotate 3D Model tab alongside Video/360/Angles. */
  showcaseModelUrl?: string | null;
  /** Managed in Admin → Vehicles → Colors. Selecting one swaps the front
   * view's image, mirroring geely.com.eg's color-switchable 360° viewer. */
  colors?: VehicleColorOption[];
  /** Admin-authored heading/copy for this section (VehicleShowcase.title/subtitle) — falls back to the default copy below when not set. */
  showcaseTitle?: string | null;
  showcaseSubtitle?: string | null;
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
  showcaseModelUrl = null,
  colors = [],
  showcaseTitle = null,
  showcaseSubtitle = null,
}: Model360SectionProps) {
  const [activeTab, setActiveTab] = useState<'video' | '3d' | '360' | 'angles'>(
    showcaseVideoUrl ? 'video' : showcaseModelUrl ? '3d' : '360'
  );
  const [lightbox, setLightbox] = useState<{ title: string; images: string[] } | null>(null);
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
          colorId: view.colorId,
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

    // No showcase views, hero image, or gallery images for this vehicle —
    // a real, database-driven empty state (below) rather than stock photos
    // of an unrelated car (this used to key off `modelId` for two long-gone
    // models, "coolray"/"emgrand", falling back to a third generic stock
    // photo set for every other model — always the wrong vehicle).
    return [];
  };

  const baseViews = buildViewsFromImages();
  // A vehicle with a full 360° spin sequence per color (each view tagged with
  // colorId in Admin → Vehicle Settings → 360° View) gets the whole sequence
  // swapped on color selection, not just the first frame. Vehicles without
  // any tagged view (the common case today) keep the old single-shared-
  // sequence behavior of swapping just the front frame's image below.
  const hasPerColorViews = baseViews.some((v) => v.colorId);
  const colorScopedViews = hasPerColorViews && selectedColorId
    ? baseViews.filter((v) => v.colorId === selectedColorId)
    : null;
  const views = colorScopedViews && colorScopedViews.length > 0
    ? colorScopedViews
    : selectedColor
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
              {showcaseTitle || 'Discover Every Angle'}
            </h2>
            <p className="text-steel dark:text-steel-light text-lg">
              {showcaseSubtitle || `Navigate through multiple angles and discover the ${modelName} from every perspective.`}
            </p>
          </div>

          {/* Color Swatches — managed in Admin → Vehicles → Colors */}
          {colorsWithImages.length > 0 && (
            <div className="flex items-start gap-3 self-start md:self-auto overflow-x-auto pb-1">
              {colorsWithImages.map((color) => (
                <div key={color.id} className="relative shrink-0">
                  <button
                    onClick={() => setSelectedColorId(color.id)}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <span
                      className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedColorId === color.id
                          ? 'border-active-blue'
                          : 'border-transparent group-hover:border-line dark:group-hover:border-midnight-line'
                      }`}
                    >
                      {/* color.imageUrl is already basePath-resolved by the
                          parent page (models/[id]/page.tsx's publicOptionColors,
                          via publicMediaUrl) — re-wrapping it here doubled the
                          prefix to "/geely/geely/uploads/...", which 404s. */}
                      <ImageWithFallback src={color.imageUrl as string} alt={color.name} className="w-full h-full object-cover" iconClassName="h-4 w-4" />
                    </span>
                    <span className="text-[11px] text-steel dark:text-steel-light font-semibold whitespace-nowrap">{color.name}</span>
                  </button>
                  {Array.isArray(color.images) && color.images.length > 0 && (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        // Also already basePath-resolved by the parent — see the
                        // swatch <ImageWithFallback> above for why not to re-wrap.
                        setLightbox({
                          title: color.name,
                          images: [color.imageUrl, ...color.images!].filter(Boolean) as string[],
                        });
                      }}
                      aria-label={`View more photos of ${color.name}`}
                      className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <Camera size={10} />
                    </button>
                  )}
                </div>
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
            {showcaseModelUrl && <button
              onClick={() => setActiveTab('3d')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === '3d'
                  ? 'bg-navy text-white shadow-md'
                  : 'text-steel dark:text-steel-light hover:text-navy dark:hover:text-ice'
              }`}
            >
              <Box size={16} />
              3D Model
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

        {views.length === 0 && !showcaseVideoUrl && !showcaseModelUrl ? (
          <div className="flex aspect-video items-center justify-center rounded-xl bg-mesh-blue shadow-2xl">
            <div className="text-center text-white/90 px-6">
              <div className="text-xs uppercase tracking-wide text-active-blue-80 mb-2">360° Showcase</div>
              <div className="font-bold text-lg">Photos for {modelName} are coming soon</div>
            </div>
          </div>
        ) : activeTab === 'video' && showcaseVideoUrl ? (
          <div className="overflow-hidden rounded-xl bg-slate-950 shadow-2xl">
            <video
              className="mx-auto aspect-video max-h-[680px] w-full object-contain"
              src={showcaseVideoUrl}
              autoPlay
              controls
              muted
              loop
              playsInline
              preload="auto"
              aria-label={`${modelName} showcase video`}
            >
              <track kind="captions" src={withBasePath('/captions/no-dialogue.vtt')} srcLang="en" label="English" default />
            </video>
          </div>
        ) : activeTab === '3d' && showcaseModelUrl ? (
          <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-2xl aspect-video">
            <Model3DViewer src={showcaseModelUrl} alt={`${modelName} 3D model`} className="h-full w-full" />
            <Link
              href={`/models/${modelId}/3d-view`}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-full bg-navy/90 px-4 py-2.5 text-sm font-bold text-white shadow-lg backdrop-blur-sm transition-colors hover:bg-navy"
            >
              <Maximize2 size={16} />
              Open Full 3D Viewer
            </Link>
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
      {lightbox && (
        <ImageLightbox images={lightbox.images} title={lightbox.title} onClose={() => setLightbox(null)} />
      )}
    </section>
  );
}
