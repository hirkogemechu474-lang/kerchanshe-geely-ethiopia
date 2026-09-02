/**
 * Web performance monitoring utilities.
 * Moved from lib/performance.ts — import from @/utils/performance
 */
export {
  getRating,
  reportWebVitals,
  measurePerformance,
  getNavigationTiming,
  getResourceTiming,
  monitorLongTasks,
  preloadResource,
  prefetchPage,
  getDeviceMemory,
  getNetworkInfo,
  shouldLoadHeavyResources,
  observeLayoutShift,
  generatePerformanceReport,
  initPerformanceMonitoring,
} from '@/lib/performance';

export type { WebVitalsMetric } from '@/lib/performance';
