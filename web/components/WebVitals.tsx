'use client';

import { useEffect } from 'react';
import { useReportWebVitals } from 'next/web-vitals';
import { reportWebVitals, initPerformanceMonitoring } from '@/lib/performance';

export function WebVitals() {
  // Report Core Web Vitals
  useReportWebVitals((metric) => {
    reportWebVitals({
      id: metric.id,
      name: metric.name as any,
      value: metric.value,
      rating: metric.rating as any,
      delta: metric.delta,
      navigationType: metric.navigationType,
    });
  });

  // Initialize performance monitoring
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  return null;
}
