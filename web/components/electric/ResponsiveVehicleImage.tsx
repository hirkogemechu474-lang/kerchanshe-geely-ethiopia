'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ResponsiveVehicleImageProps {
  src?: string | null;
  alt: string;
  title?: string;
  priority?: boolean;
}

export default function ResponsiveVehicleImage({
  src,
  alt,
  title = 'Vehicle',
  priority = false,
}: ResponsiveVehicleImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!src) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] flex items-center justify-center text-steel text-center p-6 rounded-lg">
        <div>
          <div className="text-lg font-semibold text-navy mb-1">{title}</div>
          <div className="text-sm">Product Photography</div>
          <div className="text-xs text-steel mt-2">(Image will appear here)</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec]">
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse rounded-lg" />
      )}

      {/* Image Container - Responsive */}
      {!hasError ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          loading={priority ? 'eager' : 'lazy'}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-steel text-center p-6">
          <div>
            <div className="text-lg font-semibold text-navy mb-1">{title}</div>
            <div className="text-sm">Image not available</div>
          </div>
        </div>
      )}

      {/* Accessibility Info */}
      <div className="sr-only">{alt}</div>
    </div>
  );
}
