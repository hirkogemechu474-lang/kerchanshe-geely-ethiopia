'use client';

import React, { useState } from 'react';
import { ModelSpotlightSimple } from './ModelSpotlightSimple';
import { ModelSpotlight360 } from './ModelSpotlight360';
import { RotateCw, Camera } from 'lucide-react';

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
}: Model360SectionProps) {
  const [activeTab, setActiveTab] = useState<'video' | '360' | 'angles'>(showcaseVideoUrl ? 'video' : '360');

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

  const views = buildViewsFromImages();
  const rawImageUrls = views.map(v => v.image);

  return (
    <section id="section-360" className="py-16 bg-white scroll-mt-20">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <div className="inline-block bg-gold/10 text-gold px-4 py-2 rounded-full text-sm font-bold mb-4 tracking-wider">
              360° INTERACTIVE VIEW
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-3">
              Explore Every Detail
            </h2>
            <p className="text-steel text-lg">
              Navigate through multiple angles and discover the {modelName} from every perspective.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex gap-2 bg-ice p-1.5 rounded-xl border border-line self-start md:self-auto">
            {showcaseVideoUrl && <button
              onClick={() => setActiveTab('video')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'video'
                  ? 'bg-navy text-white shadow-md'
                  : 'text-steel hover:text-navy'
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
                  : 'text-steel hover:text-navy'
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
                  : 'text-steel hover:text-navy'
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
            />
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
          <div className="bg-ice p-6 rounded-lg border border-line">
            <h3 className="font-bold text-navy mb-2">Exterior Design</h3>
            <p className="text-steel text-sm leading-relaxed">
              Premium styling with attention to aerodynamics and modern aesthetics that turns heads.
            </p>
          </div>
          <div className="bg-ice p-6 rounded-lg border border-line">
            <h3 className="font-bold text-navy mb-2">Interior Comfort</h3>
            <p className="text-steel text-sm leading-relaxed">
              Spacious cabin with premium materials and thoughtful ergonomics for every journey.
            </p>
          </div>
          <div className="bg-ice p-6 rounded-lg border border-line">
            <h3 className="font-bold text-navy mb-2">Technology</h3>
            <p className="text-steel text-sm leading-relaxed">
              Advanced connectivity and safety features designed for the modern Ethiopian driver.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
