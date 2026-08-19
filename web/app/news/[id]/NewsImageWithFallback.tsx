'use client';

interface NewsImageProps {
  src: string;
  alt: string;
  className: string;
}

export default function NewsImageWithFallback({ src, alt, className }: NewsImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}