'use client';

import { useEffect, useState } from 'react';
import { X, Cookie } from 'lucide-react';
import Link from 'next/link';

interface CookieBannerConfig {
  enabled: boolean;
  title: string;
  description: string;
  acceptText: string;
  declineText: string;
}

interface ConsentData {
  accepted: boolean;
  timestamp: number;
  categories: {
    necessary: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [config, setConfig] = useState<CookieBannerConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkConsent = async () => {
      try {
        const response = await fetch('/api/public/cookie-banner');
        if (response.ok) {
          const data = await response.json();
          if (data.config?.enabled) {
            const stored = localStorage.getItem('geely_consent');
            if (!stored) {
              setShowBanner(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch cookie banner config:', error);
      } finally {
        setLoading(false);
      }
    };
    checkConsent();
  }, []);

  const handleAccept = (all = true) => {
    const consent: ConsentData = {
      accepted: true,
      timestamp: Date.now(),
      categories: {
        necessary: true,
        analytics: all,
        marketing: all,
      },
    };
    localStorage.setItem('geely_consent', JSON.stringify(consent));
    setShowBanner(false);
  };

  const handleDecline = () => {
    const consent: ConsentData = {
      accepted: false,
      timestamp: Date.now(),
      categories: {
        necessary: true,
        analytics: false,
        marketing: false,
      },
    };
    localStorage.setItem('geely_consent', JSON.stringify(consent));
    setShowBanner(false);
  };

  if (loading || !showBanner || !config) {
    return null;
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-midnight-surface border-t border-gray-200 shadow-xl animate-slide-up"
      role="dialog"
      aria-label="Cookie consent"
    >
      <div className="max-w-[1280px] mx-auto px-4 py-4 sm:px-6 lg:px-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 w-10 h-10 bg-geely-blue/10 rounded-lg flex items-center justify-center">
              <Cookie className="w-5 h-5 text-geely-blue" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{config.title}</h3>
              <p className="text-sm text-gray-600 mt-1">{config.description}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Link
              href="/cookies"
              className="text-sm text-geely-blue hover:underline font-medium text-center sm:text-left"
            >
              Cookie Policy
            </Link>
            <button
              onClick={() => handleDecline()}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors w-full sm:w-auto"
            >
              {config.declineText}
            </button>
            <button
              onClick={() => handleAccept(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-geely-blue rounded-lg hover:bg-geely-blue/90 transition-colors w-full sm:w-auto"
            >
              {config.acceptText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}