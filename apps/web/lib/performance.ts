export interface WebVitalsMetric {
  id: string;
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType?: string;
}

export function reportWebVitals(metric: WebVitalsMetric) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('[WebVitals]', metric.name, metric.value, metric.rating);
  }
}

export function getCLS(callback: (metric: WebVitalsMetric) => void) {
  if (typeof window === 'undefined') return;

  let clsValue = 0;
  let clsEntries: PerformanceEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        clsEntries.push(entry);
      }
    }
  });

  observer.observe({ type: 'layout-shift', buffered: true });

  return () => {
    observer.disconnect();
    callback({
      id: 'cls',
      name: 'CLS',
      value: clsValue,
      rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
      delta: clsValue,
    });
  };
}

export function getFID(callback: (metric: WebVitalsMetric) => void) {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      callback({
        id: 'fid',
        name: 'FID',
        value: (entry as any).processingStart - entry.startTime,
        rating: (entry as any).processingStart - entry.startTime < 100 ? 'good' : 'poor',
        delta: (entry as any).processingStart - entry.startTime,
      });
    }
  });

  observer.observe({ type: 'first-input', buffered: true });

  return () => observer.disconnect();
}

export function getLCP(callback: (metric: WebVitalsMetric) => void) {
  if (typeof window === 'undefined') return;

  let lcpValue = 0;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if ((entry as any).startTime > lcpValue) {
        lcpValue = (entry as any).startTime;
      }
    }
  });

  observer.observe({ type: 'largest-contentful-paint', buffered: true });

  return () => {
    observer.disconnect();
    callback({
      id: 'lcp',
      name: 'LCP',
      value: lcpValue,
      rating: lcpValue < 2500 ? 'good' : lcpValue < 4000 ? 'needs-improvement' : 'poor',
      delta: lcpValue,
    });
  };
}

export function getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  if (name === 'LCP') return value < 2500 ? 'good' : value < 4000 ? 'needs-improvement' : 'poor';
  if (name === 'FID') return value < 100 ? 'good' : value < 300 ? 'needs-improvement' : 'poor';
  if (name === 'CLS') return value < 0.1 ? 'good' : value < 0.25 ? 'needs-improvement' : 'poor';
  if (name === 'FCP') return value < 1800 ? 'good' : value < 3000 ? 'needs-improvement' : 'poor';
  return 'needs-improvement';
}

export function measurePerformance(name: string, fn: () => void) {
  if (typeof performance !== 'undefined') {
    performance.mark(`${name}-start`);
    fn();
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
  } else {
    fn();
  }
}

export async function getNavigationTiming() {
  if (typeof window === 'undefined') return null;
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  if (!nav) return null;
  return {
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    connection: nav.connectEnd - nav.connectStart,
    ttfb: nav.responseStart - nav.requestStart,
    download: nav.responseEnd - nav.responseStart,
    domInteractive: nav.domInteractive - nav.fetchStart,
    domComplete: nav.domComplete - nav.fetchStart,
    loadEvent: nav.loadEventEnd - nav.fetchStart,
  };
}

export function getResourceTiming() {
  if (typeof window === 'undefined') return [];
  return performance.getEntriesByType('resource').map((entry) => ({
    name: entry.name,
    duration: entry.duration,
    transferSize: (entry as any).transferSize || 0,
  }));
}

export function monitorLongTasks(callback?: (task: any) => void) {
  if (typeof window === 'undefined') return;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback?.(entry);
      }
    });
    observer.observe({ type: 'longtask', buffered: true });
    return () => observer.disconnect();
  } catch {}
}

export function preloadResource(url: string, as?: string) {
  if (typeof document === 'undefined') return;
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;
  if (as) link.as = as;
  document.head.appendChild(link);
}

export function prefetchPage(url: string) {
  if (typeof document === 'undefined') return;
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

export function getDeviceMemory(): number | null {
  if (typeof navigator === 'undefined') return null;
  return (navigator as any).deviceMemory || null;
}

export function getNetworkInfo(): { effectiveType?: string; downlink?: number } | null {
  if (typeof navigator === 'undefined') return null;
  const conn = (navigator as any).connection;
  if (!conn) return null;
  return { effectiveType: conn.effectiveType, downlink: conn.downlink };
}

export function shouldLoadHeavyResources(): boolean {
  const memory = getDeviceMemory();
  const network = getNetworkInfo();
  if (memory !== null && memory < 4) return false;
  if (network?.effectiveType === 'slow-2g' || network?.effectiveType === '2g') return false;
  return true;
}

export function observeLayoutShift(callback: (value: number) => void) {
  if (typeof window === 'undefined') return;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          callback((entry as any).value);
        }
      }
    });
    observer.observe({ type: 'layout-shift', buffered: true });
    return () => observer.disconnect();
  } catch {}
}

export function generatePerformanceReport(): Record<string, any> {
  return {
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    memory: getDeviceMemory(),
    network: getNetworkInfo(),
  };
}

export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  const onCLS = getCLS(reportWebVitals);
  const onFID = getFID(reportWebVitals);
  const onLCP = getLCP(reportWebVitals);
  const onFCP = getFCP(reportWebVitals);

  return () => {
    onCLS?.();
    onFID?.();
    onLCP?.();
    onFCP?.();
  };
}

export function getFCP(callback: (metric: WebVitalsMetric) => void) {
  if (typeof window === 'undefined') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') {
        callback({
          id: 'fcp',
          name: 'FCP',
          value: entry.startTime,
          rating: entry.startTime < 1800 ? 'good' : entry.startTime < 3000 ? 'needs-improvement' : 'poor',
          delta: entry.startTime,
        });
      }
    }
  });

  observer.observe({ type: 'paint', buffered: true });

  return () => observer.disconnect();
}
