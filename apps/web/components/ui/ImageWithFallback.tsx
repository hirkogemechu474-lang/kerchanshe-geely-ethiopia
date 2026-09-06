'use client';

import { useState, type ImgHTMLAttributes } from 'react';
import { Car } from 'lucide-react';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
  alt: string;
  /**
   * Tailwind size classes for the fallback car icon. Defaults to a size
   * that suits full-size photos (hero/gallery/card images) — pass a
   * smaller one (e.g. "h-4 w-4") for compact thumbnails such as color
   * swatches or wheel/interior/accessory chips so the icon doesn't
   * overwhelm the box.
   */
  iconClassName?: string;
}

/**
 * Drop-in replacement for a plain <img> for vehicle/gallery/color/wheel/
 * interior/accessory photos. A missing upload, a deleted file, or a bad
 * admin-entered URL otherwise surfaces the browser's native broken-image
 * icon with the raw alt text next to it — this catches that load failure
 * and swaps in the same bg-mesh-blue treatment already used site-wide for
 * "no image at all" placeholders (see e.g. the vehicle hero on
 * /models/[id]), with a car icon standing in for the missing photo.
 *
 * The same className is applied in both the <img> and the fallback <div>,
 * so swapping to the fallback never changes the box's size/position —
 * only the content inside it changes.
 */
export function ImageWithFallback({
  className = '',
  alt,
  iconClassName = 'h-8 w-8',
  onError,
  ...props
}: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} flex items-center justify-center bg-mesh-blue text-white/40`}
      >
        <Car className={iconClassName} strokeWidth={1.5} aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      {...props}
      alt={alt}
      className={className}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
