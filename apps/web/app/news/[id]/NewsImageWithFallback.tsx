'use client';

import { useState } from 'react';

interface NewsImageProps {
  src: string;
  alt: string;
  className: string;
}

export default function NewsImageWithFallback({ src, alt, className }: NewsImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={`${className} flex items-center justify-center bg-gradient-to-br from-[#dfe8f5] to-[#c7d6ec] text-center p-6 text-sm text-steel`}>
        {alt}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}