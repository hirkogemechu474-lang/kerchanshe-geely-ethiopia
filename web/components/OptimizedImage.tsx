import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  className?: string;
  sizes?: string;
  onLoad?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill,
  priority = false,
  quality = 85,
  className = '',
  sizes,
  onLoad,
  objectFit = 'cover',
  placeholder = 'empty',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Default blur placeholder (tiny base64 image)
  const defaultBlurDataURL = 
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2YwZjBmMCIvPjwvc3ZnPg==';

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-400 text-sm">Image unavailable</span>
      </div>
    );
  }

  const imageProps = {
    src,
    alt,
    quality,
    priority,
    className: `${className} ${isLoading ? 'blur-sm' : 'blur-0'} transition-all duration-300`,
    onLoad: handleLoad,
    onError: handleError,
    ...(placeholder === 'blur' && {
      placeholder: 'blur' as const,
      blurDataURL: blurDataURL || defaultBlurDataURL,
    }),
    ...(sizes && { sizes }),
    style: objectFit ? { objectFit } : undefined,
  };

  if (fill) {
    return <Image {...imageProps} fill />;
  }

  if (width && height) {
    return <Image {...imageProps} width={width} height={height} />;
  }

  // Fallback to regular img tag if dimensions not provided
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

// Preset configurations for common use cases
export const ImagePresets = {
  hero: {
    sizes: '100vw',
    quality: 90,
    priority: true,
  },
  card: {
    sizes: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    quality: 85,
    priority: false,
  },
  thumbnail: {
    sizes: '(max-width: 768px) 20vw, 10vw',
    quality: 75,
    priority: false,
  },
  gallery: {
    sizes: '(max-width: 768px) 100vw, 50vw',
    quality: 85,
    priority: false,
  },
  icon: {
    sizes: '48px',
    quality: 90,
    priority: false,
  },
};
