'use client';

import { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { ImageWithFallback } from './ImageWithFallback';

// Matches apps/web/app/models/[id]/page.tsx's own isVideoUrl helper (and the
// admin ImageUpload component's convention) so a walkthrough video added to
// a color/interior/wheel/accessory gallery renders as a video here too,
// instead of a broken image.
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.m4v'];
function isVideoUrl(url: string): boolean {
  const path = url.split('?')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => path.endsWith(ext));
}

interface ImageLightboxProps {
  /** Photo/video URLs in display order, already resolved (basePath applied) by the caller. */
  images: string[];
  /** Label used for alt text and the on-screen title, e.g. the color/wheel/interior/accessory name. */
  title: string;
  /** Index to open on. Defaults to the first photo (the primary imageUrl). */
  initialIndex?: number;
  onClose: () => void;
}

/**
 * Full-screen photo/video viewer for an option's extra gallery (color,
 * interior, wheel, accessory `images` field). Reused across
 * VehicleOptionsShowcase, /configurator, and Model360Section wherever an
 * option has more than just its primary imageUrl to show.
 */
export function ImageLightbox({ images, title, initialIndex = 0, onClose }: ImageLightboxProps) {
  const [index, setIndex] = useState(initialIndex);
  const count = images.length;

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setIndex((i) => (i + 1) % count);
      if (event.key === 'ArrowLeft') setIndex((i) => (i - 1 + count) % count);
    }
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [count, onClose]);

  if (count === 0) return null;
  const current = images[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((i) => (i - 1 + count) % count);
            }}
            aria-label="Previous photo"
            className="absolute left-2 sm:left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((i) => (i + 1) % count);
            }}
            aria-label="Next photo"
            className="absolute right-2 sm:right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div className="relative flex max-h-[85vh] max-w-[90vw] flex-col items-center" onClick={(event) => event.stopPropagation()}>
        {isVideoUrl(current) ? (
          <video
            src={current}
            className="max-h-[85vh] max-w-[90vw] rounded-lg"
            controls
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          <ImageWithFallback
            src={current}
            alt={`${title} photo ${index + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain"
            iconClassName="h-14 w-14"
          />
        )}
        <div className="mt-3 flex items-center gap-3 text-xs font-semibold text-white/70">
          <span>{title}</span>
          {count > 1 && <span>{index + 1} / {count}</span>}
        </div>
      </div>
    </div>
  );
}
