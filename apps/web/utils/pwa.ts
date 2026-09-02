/**
 * PWA / Service-Worker utilities.
 * Moved from lib/pwa.ts — import from @/utils/pwa
 */
export {
  registerServiceWorker,
  isPWA,
  requestNotificationPermission,
  showNotification,
  getInstallPrompt,
  clearAllCaches,
  getCacheSize,
  formatCacheSize,
  checkForUpdates,
  unregisterServiceWorker,
} from '@/lib/pwa';
