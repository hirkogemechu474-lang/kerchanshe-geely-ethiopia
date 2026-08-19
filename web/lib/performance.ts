// Core Web Vitals monitoring and performance utilities

export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FID' | 'FCP' | 'LCP' | 'TTFB' | 'INP';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: string;
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
};

// Get rating based on thresholds
export function getRating(name: WebVitalsMetric['name'], value: number): WebVitalsMetric['rating'] {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';
  
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

// Report Web Vitals to analytics
export function reportWebVitals(metric: WebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
    });
  }

  // Send to analytics in production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Google Analytics 4
    if ('gtag' in window) {
      (window as any).gtag('event', metric.name, {
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        metric_id: metric.id,
        metric_value: metric.value,
        metric_delta: metric.delta,
        metric_rating: metric.rating,
      });
    }

    // Custom analytics endpoint
    sendToAnalytics(metric);
  }
}

// Send metrics to custom analytics endpoint
async function sendToAnalytics(metric: WebVitalsMetric) {
  try {
    const body = JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      delta: metric.delta,
      id: metric.id,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
    });

    // Use sendBeacon if available (doesn't block page unload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', body);
    } else {
      // Fallback to fetch
      fetch('/api/analytics/vitals', {
        body,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(console.error);
    }
  } catch (error) {
    console.error('Failed to send analytics:', error);
  }
}

// Measure custom performance metrics
export function measurePerformance(name: string, startTime?: number) {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return;
  }

  try {
    const endTime = performance.now();
    const duration = startTime ? endTime - startTime : 0;

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

    // Mark the measurement
    performance.mark(name);

    // Send to analytics
    if (process.env.NODE_ENV === 'production' && 'gtag' in window) {
      (window as any).gtag('event', 'timing_complete', {
        name,
        value: Math.round(duration),
        event_category: 'Performance',
      });
    }
  } catch (error) {
    console.error('Performance measurement failed:', error);
  }
}

// Get navigation timing metrics
export function getNavigationTiming() {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return null;
  }

  const perfData = window.performance.timing;
  const navigationStart = perfData.navigationStart;

  return {
    dns: perfData.domainLookupEnd - perfData.domainLookupStart,
    tcp: perfData.connectEnd - perfData.connectStart,
    request: perfData.responseStart - perfData.requestStart,
    response: perfData.responseEnd - perfData.responseStart,
    domProcessing: perfData.domComplete - perfData.domLoading,
    domContentLoaded: perfData.domContentLoadedEventEnd - navigationStart,
    loadComplete: perfData.loadEventEnd - navigationStart,
  };
}

// Get resource timing metrics
export function getResourceTiming() {
  if (typeof window === 'undefined' || !('performance' in window)) {
    return [];
  }

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  return resources.map((resource) => ({
    name: resource.name,
    type: resource.initiatorType,
    duration: resource.duration,
    size: resource.transferSize,
    cached: resource.transferSize === 0,
  }));
}

// Monitor long tasks (blocking the main thread)
export function monitorLongTasks(callback: (duration: number) => void) {
  if (typeof window === 'undefined') return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Long task is anything over 50ms
        if (entry.duration > 50) {
          console.warn(`[Long Task] ${entry.duration.toFixed(2)}ms`);
          callback(entry.duration);
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });
    
    return () => observer.disconnect();
  } catch (error) {
    console.error('Long task monitoring not supported:', error);
  }
}

// Preload critical resources
export function preloadResource(href: string, as: string) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = as;
  
  if (as === 'font') {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
}

// Prefetch next page resources
export function prefetchPage(href: string) {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  
  document.head.appendChild(link);
}

// Get device memory (if available)
export function getDeviceMemory(): number | null {
  if (typeof navigator === 'undefined') return null;
  
  return (navigator as any).deviceMemory || null;
}

// Get network information
export function getNetworkInfo() {
  if (typeof navigator === 'undefined') return null;

  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;

  if (!connection) return null;

  return {
    effectiveType: connection.effectiveType, // '4g', '3g', '2g', 'slow-2g'
    downlink: connection.downlink, // Mbps
    rtt: connection.rtt, // ms
    saveData: connection.saveData, // boolean
  };
}

// Check if we should load heavy resources
export function shouldLoadHeavyResources(): boolean {
  const network = getNetworkInfo();
  const memory = getDeviceMemory();

  // Don't load if data saver is on
  if (network?.saveData) return false;

  // Don't load on slow connections
  if (network?.effectiveType === 'slow-2g' || network?.effectiveType === '2g') {
    return false;
  }

  // Don't load on low memory devices
  if (memory !== null && memory < 4) return false;

  return true;
}

// Calculate cumulative layout shift
export function observeLayoutShift(callback: (shift: number) => void) {
  if (typeof window === 'undefined') return;

  try {
    let cumulativeShift = 0;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) {
        if (!entry.hadRecentInput) {
          cumulativeShift += entry.value;
          callback(cumulativeShift);
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
    
    return () => observer.disconnect();
  } catch (error) {
    console.error('Layout shift monitoring not supported:', error);
  }
}

// Generate performance report
export function generatePerformanceReport() {
  const navigation = getNavigationTiming();
  const resources = getResourceTiming();
  const network = getNetworkInfo();
  const memory = getDeviceMemory();

  return {
    navigation,
    resources: {
      total: resources.length,
      cached: resources.filter(r => r.cached).length,
      totalSize: resources.reduce((sum, r) => sum + r.size, 0),
      slowest: resources.sort((a, b) => b.duration - a.duration).slice(0, 10),
    },
    network,
    memory,
    timestamp: new Date().toISOString(),
  };
}

// Export for use in _app.tsx or pages
export function initPerformanceMonitoring() {
  if (typeof window === 'undefined') return;

  // Monitor long tasks
  monitorLongTasks((duration) => {
    if ('gtag' in window && process.env.NODE_ENV === 'production') {
      (window as any).gtag('event', 'long_task', {
        duration: Math.round(duration),
        event_category: 'Performance',
      });
    }
  });

  // Monitor layout shifts
  observeLayoutShift((shift) => {
    if (shift > 0.25) {
      console.warn(`[CLS Warning] Cumulative Layout Shift: ${shift.toFixed(3)}`);
    }
  });

  // Log performance report after load
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const report = generatePerformanceReport();
        console.log('[Performance Report]', report);
      }, 1000);
    });
  }
}
