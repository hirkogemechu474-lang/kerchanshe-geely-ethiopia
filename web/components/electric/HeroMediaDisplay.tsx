'use client';

import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

interface HeroMediaDisplayProps {
  imageUrl?: string | null;
  videoUrl?: string | null;
  altText?: string;
  title?: string;
  isResponsive?: boolean;
}

export default function HeroMediaDisplay({
  imageUrl,
  videoUrl,
  altText = 'Hero media',
  title = 'Geometry EX5',
  isResponsive = true,
}: HeroMediaDisplayProps) {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use video if available, otherwise use image
  const primaryMedia = videoUrl || imageUrl;
  const shouldShowVideo = !!videoUrl;

  if (!primaryMedia) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] flex items-center justify-center text-steel text-center p-6 rounded-lg">
        <div>
          <div className="text-lg font-semibold text-navy mb-1">{title}</div>
          <div className="text-sm">Hero Media</div>
          <div className="text-xs text-steel mt-2">(Image or video will appear here)</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden bg-black group">
      {/* Responsive Container */}
      <div className="relative w-full pt-[66.67%]">
        {/* Image Display */}
        {!shouldShowVideo && imageUrl && (
          <img
            src={imageUrl}
            alt={altText}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setIsLoading(false)}
            loading="lazy"
          />
        )}

        {/* Video Display */}
        {shouldShowVideo && videoUrl && (
          <>
            {!isVideoPlaying ? (
              <>
                {/* Video Thumbnail/Poster */}
                <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={altText}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center group-hover:bg-opacity-50 transition-all duration-300">
                    <button
                      onClick={() => setIsVideoPlaying(true)}
                      className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-4 transition-all duration-300 transform group-hover:scale-110"
                      aria-label="Play video"
                    >
                      <Play className="w-6 h-6 text-black fill-black" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <video
                src={videoUrl}
                className="absolute inset-0 w-full h-full object-cover"
                controls
                autoPlay
                onLoadedMetadata={() => setIsLoading(false)}
              />
            )}
          </>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-pulse" />
        )}

        {/* Responsive Gradient Overlay for Desktop */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden lg:block" />
      </div>

      {/* Video Badge */}
      {shouldShowVideo && !isVideoPlaying && (
        <div className="absolute bottom-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-white rounded-full animate-pulse" />
          FEATURED VIDEO
        </div>
      )}

      {/* Accessibility Information */}
      <div className="sr-only">{altText}</div>
    </div>
  );
}
