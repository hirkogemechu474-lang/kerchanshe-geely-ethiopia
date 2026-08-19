// PWA utilities and service worker registration

export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        console.log('[PWA] Service Worker registered:', registration.scope);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

        // Handle updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                console.log('[PWA] New version available');
                
                // Show update notification
                showUpdateNotification(registration);
              }
            });
          }
        });
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    });
  }
}

function showUpdateNotification(registration: ServiceWorkerRegistration) {
  // Create update banner
  const banner = document.createElement('div');
  banner.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-geely-blue text-white px-6 py-4 rounded-lg shadow-2xl z-50 flex items-center gap-4';
  banner.innerHTML = `
    <div>
      <div class="font-bold mb-1">Update Available</div>
      <div class="text-sm text-blue-100">A new version of Geely Ethiopia is available</div>
    </div>
    <button id="pwa-update-btn" class="bg-white text-geely-blue px-4 py-2 rounded font-bold hover:bg-opacity-90 transition-all">
      Update Now
    </button>
    <button id="pwa-dismiss-btn" class="text-white hover:text-blue-200 p-2">
      <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  `;

  document.body.appendChild(banner);

  // Update button handler
  document.getElementById('pwa-update-btn')?.addEventListener('click', () => {
    registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  });

  // Dismiss button handler
  document.getElementById('pwa-dismiss-btn')?.addEventListener('click', () => {
    banner.remove();
  });
}

// Check if running as PWA
export function isPWA(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Show notification
export function showNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      ...options,
    });
  }
}

// Get install prompt event
export function getInstallPrompt(): Promise<Event | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      window.removeEventListener('beforeinstallprompt', handler);
      resolve(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Timeout after 5 seconds
    setTimeout(() => {
      window.removeEventListener('beforeinstallprompt', handler);
      resolve(null);
    }, 5000);
  });
}

// Clear all caches (for debugging)
export async function clearAllCaches() {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map(name => caches.delete(name)));
  console.log('[PWA] All caches cleared');
}

// Get cache size
export async function getCacheSize(): Promise<number> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return 0;
  }

  let totalSize = 0;
  const cacheNames = await caches.keys();

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

// Format cache size
export function formatCacheSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

// Check for updates manually
export async function checkForUpdates() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.update();
    console.log('[PWA] Checked for updates');
  }
}

// Unregister service worker (for debugging)
export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    await registration.unregister();
    console.log('[PWA] Service Worker unregistered');
  }
}
