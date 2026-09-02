'use client';

import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    
    if (isInstalled) {
      return;
    }

    // Check if user already dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissal = dismissedDate 
      ? (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    // Show again after 7 days
    if (daysSinceDismissal < 7) {
      return;
    }

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      
      // Show prompt after 3 seconds
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show install prompt
    deferredPrompt.prompt();

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log(`User ${outcome} the install prompt`);
    
    // Clear deferred prompt
    setDeferredPrompt(null);
    setShowPrompt(false);

    // Track install
    if (outcome === 'accepted') {
      localStorage.setItem('pwa-installed', 'true');
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-midnight-surface rounded-lg shadow-2xl border-2 border-geely-blue z-50 animate-slide-up">
      <div className="p-6">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-geely-blue rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-3xl">🚗</span>
          </div>
          <div>
            <h3 className="font-bold text-navy dark:text-ice text-lg">Install Geely Ethiopia</h3>
            <p className="text-sm text-steel dark:text-steel-light">Quick access from your home screen</p>
          </div>
        </div>

        {/* Benefits */}
        <ul className="space-y-2 mb-6 text-sm text-steel dark:text-steel-light">
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Browse vehicles offline</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Faster loading times</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Quick access to test drives & quotes</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-600 mt-0.5">✓</span>
            <span>Get instant notifications on new offers</span>
          </li>
        </ul>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleInstall}
            className="flex-1 bg-geely-blue text-white font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-3 text-steel dark:text-steel-light hover:text-navy dark:hover:text-ice dark:hover:text-ice dark:hover:text-ice font-semibold transition-colors"
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
}
