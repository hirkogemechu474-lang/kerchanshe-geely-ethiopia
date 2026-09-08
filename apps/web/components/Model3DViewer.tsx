'use client';

import { useEffect, useState } from 'react';

interface Model3DViewerProps {
  src: string;
  alt?: string;
  className?: string;
  posterSrc?: string;
}

// Wraps Google's <model-viewer> web component (https://modelviewer.dev) for a
// real drag-to-rotate 3D model, as opposed to ModelSpotlightSimple's swap-
// between-a-few-photos gallery. The element itself ships as a custom element
// (registered globally once the JS module loads), so this just lazy-loads
// that module client-side and renders the tag — see types/model-viewer.d.ts
// for the JSX typing.
export function Model3DViewer({ src, alt = '3D vehicle model', className, posterSrc }: Model3DViewerProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    import('@google/model-viewer').then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-brand-neutral-3 to-brand-neutral-4 ${className ?? ''}`}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-active-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <model-viewer
      src={src}
      alt={alt}
      poster={posterSrc}
      camera-controls
      auto-rotate
      auto-rotate-delay={0}
      rotation-per-second="18deg"
      interaction-prompt="none"
      shadow-intensity="1"
      exposure="1"
      environment-image="neutral"
      loading="eager"
      className={className}
      style={{ width: '100%', height: '100%', backgroundColor: 'transparent' }}
    />
  );
}
