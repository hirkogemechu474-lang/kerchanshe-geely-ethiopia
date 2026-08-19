'use client';

import React from 'react';
import { Phone, MapPin, Clock, Globe } from 'lucide-react';
import { useLanguage, useTranslation } from '@/lib/i18n';

export function UtilityBar() {
  const { language } = useTranslation();
  const setLanguage = useLanguage((state) => state.setLanguage);
  const isEnglish = language === 'en';

  return (
    <div className="bg-navy text-white py-2 text-xs">
      <div className="max-w-[1280px] mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="text-gold">★</span>
            <span>A Kerchanshe Group Company</span>
          </div>
          <span className="hidden md:block">•</span>
          <div className="hidden md:flex items-center gap-1">
            <Phone size={12} />
            <span>24/7 Customer Support</span>
          </div>
          <span className="hidden md:block">•</span>
          <div className="hidden lg:flex items-center gap-1">
            <Clock size={12} />
            <span>Mon-Sat: 8:00 AM - 6:00 PM</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <MapPin size={12} />
            <span>🇪🇹 Ethiopia</span>
          </div>
          <button
            onClick={() => setLanguage(isEnglish ? 'am' : 'en')}
            className="flex items-center gap-1 hover:text-gold transition-colors"
          >
            <Globe size={12} />
            <span>{isEnglish ? 'English' : 'አማርኛ'} | {isEnglish ? 'አማርኛ' : 'English'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
