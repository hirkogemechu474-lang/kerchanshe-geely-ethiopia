'use client';

import { MainLayout } from '@/components/MainLayout';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <MainLayout>
      <div className="min-h-[70vh] flex items-center justify-center py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          {/* Icon */}
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <WifiOff size={48} className="text-gray-400" />
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-navy dark:text-ice mb-4">
            You're Offline
          </h1>

          {/* Description */}
          <p className="text-steel dark:text-steel-light text-lg mb-8 leading-relaxed">
            It looks like you've lost your internet connection. 
            Some features may not be available while you're offline.
          </p>

          {/* What you can do */}
          <div className="bg-ice dark:bg-midnight p-6 rounded-lg mb-8 text-left">
            <h2 className="font-bold text-navy dark:text-ice mb-4">What you can do:</h2>
            <ul className="space-y-3 text-steel dark:text-steel-light">
              <li className="flex items-start gap-3">
                <span className="text-geely-blue mt-1">✓</span>
                <span>Check your internet connection and try again</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-geely-blue mt-1">✓</span>
                <span>Browse previously visited pages from cache</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-geely-blue mt-1">✓</span>
                <span>View saved vehicle information</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-geely-blue mt-1">✓</span>
                <span>Contact us directly at +251 99 338 9874</span>
              </li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="flex items-center justify-center gap-2 bg-geely-blue text-white font-bold px-8 py-4 hover:bg-opacity-90 transition-all"
            >
              <RefreshCw size={20} />
              Try Again
            </button>
            
            <Link
              href="/"
              className="flex items-center justify-center gap-2 border-2 border-navy text-navy dark:text-ice font-bold px-8 py-4 rounded-lg hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight dark:hover:bg-midnight transition-all"
            >
              <Home size={20} />
              Go to Homepage
            </Link>
          </div>

          {/* Contact Info */}
          <div className="mt-12 pt-8 border-t border-line dark:border-midnight-line">
            <p className="text-sm text-steel dark:text-steel-light mb-4">
              Need immediate assistance?
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a
                href="tel:+251110000000"
                className="text-geely-blue hover:underline font-semibold"
              >
                📞 Call Us: +251 99 338 9874
              </a>
              <span className="hidden sm:inline text-gray-300">|</span>
              <a
                href="https://wa.me/251993389874"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:underline font-semibold"
              >
                💬 WhatsApp: +251 99 338 9874
              </a>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
