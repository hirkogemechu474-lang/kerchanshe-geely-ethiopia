'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  fallback?: ReactNode;
  onVisible?: () => void;
}

export function LazySection({
  children,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  fallback,
  onVisible,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
          onVisible?.();
          // Disconnect after becoming visible
          if (ref.current) {
            observer.unobserve(ref.current);
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [threshold, rootMargin, isVisible, onVisible]);

  return (
    <div ref={ref} className={className}>
      {isVisible ? children : (fallback || <div style={{ minHeight: '200px' }} />)}
    </div>
  );
}

// Skeleton loader for lazy sections
export function SectionSkeleton({ height = '200px' }: { height?: string }) {
  return (
    <div 
      className="animate-pulse bg-gray-100 rounded-lg"
      style={{ minHeight: height }}
    />
  );
}
