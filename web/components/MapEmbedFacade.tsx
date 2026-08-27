'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

interface MapEmbedFacadeProps {
  src: string;
  title: string;
  className?: string;
}

// Google Maps embeds set third-party cookies as soon as the iframe loads.
// This facade defers that until the user actually asks for the map, so
// visitors who never interact with it never pick up those cookies.
export function MapEmbedFacade({ src, title, className }: MapEmbedFacadeProps) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return <iframe title={title} className={className} loading="lazy" src={src} />;
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={`Load map: ${title}`}
      className={`${className || ''} flex flex-col items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-700 transition-colors`}
    >
      <MapPin size={28} />
      <span className="text-sm font-semibold">Click to load map</span>
      <span className="text-xs font-normal text-white/70">Loads content from Google Maps</span>
    </button>
  );
}
