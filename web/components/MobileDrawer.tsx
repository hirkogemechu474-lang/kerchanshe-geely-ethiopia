'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, ChevronDown, Car, Wrench, Phone, Info, MapPin, Search, Globe, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage, useTranslation } from '@/lib/i18n';
import { useTheme } from '@/providers/ThemeProvider';
import { withBasePath } from '@/lib/publicPath';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSearchClick?: () => void;
}

export function MobileDrawer({ isOpen, onClose, onSearchClick = () => {} }: MobileDrawerProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const { t, language } = useTranslation();
  const setLanguage = useLanguage((state) => state.setLanguage);
  const isEnglish = language === 'en';
  const { resolvedTheme, setTheme } = useTheme();

  // Mirrors Header.tsx's trimmed top nav (Models, Company, After-Sales
  // Services, Dealers, Contact Us) so desktop and mobile agree — the
  // deeper submenus stay, since mobile still benefits from that nesting
  // even where the desktop bar itself is flat.
  const navigationItems = [
    {
      title: t('common.models'),
      icon: <Car size={20} />,
      href: '/models',
      hasSubmenu: true,
      submenu: [
        { name: 'All Models', href: '/models' },
        { name: 'Coolray', href: '/models/coolray' },
        { name: 'Emgrand', href: '/models/emgrand' },
        { name: 'Monjaro', href: '/models/monjaro' },
        { name: 'Azkarra', href: '/models/azkarra' },
        { name: 'Okavango', href: '/models/okavango' },
      ]
    },
    { title: 'Company', icon: <Info size={20} />, href: '/about' },
    {
      title: 'After-Sales Services',
      icon: <Wrench size={20} />,
      href: '/service',
      hasSubmenu: true,
      submenu: [
        { name: 'Test Drive', href: '/test-drive' },
        { name: 'Service Booking', href: '/service' },
        { name: 'Spare Parts', href: '/parts' },
        { name: 'Purchase', href: '/financing' }
      ]
    },
    { title: t('common.dealers'), icon: <MapPin size={20} />, href: '/dealers' },
    { title: 'Contact Us', icon: <Phone size={20} />, href: '/contact' },
  ];

  const toggleSection = (title: string) => {
    setExpandedSection(expandedSection === title ? null : title);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 bottom-0 w-[min(20rem,100vw)] bg-white dark:bg-midnight-surface shadow-xl z-[51] overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-line dark:border-midnight-line">
                <Link href="/" onClick={onClose} className="flex items-center gap-2.5 group">
                  <img
                    src={withBasePath('/assets/logos/geely-logo.png')}
                    alt="Geely Ethiopia"
                    className="h-8 w-auto max-w-[110px] object-contain transition-opacity group-hover:opacity-70"
                  />
                  <span className="sr-only">Geely Ethiopia</span>
                </Link>
                <button
                  onClick={onClose}
                  aria-label="Close menu"
                  className="p-2 text-steel dark:text-steel-light hover:text-navy dark:hover:text-ice"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Quick Actions: Search + Language + Theme */}
              <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-line dark:border-midnight-line">
                <button
                  onClick={() => {
                    onClose();
                    onSearchClick();
                  }}
                  className="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-navy dark:text-ice border border-line dark:border-midnight-line rounded-lg py-2.5 hover:bg-ice dark:hover:bg-midnight transition-colors"
                >
                  <Search size={16} />
                  {t('common.search')}
                </button>
                <button
                  onClick={() => setLanguage(isEnglish ? 'am' : 'en')}
                  className="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-navy dark:text-ice border border-line dark:border-midnight-line rounded-lg py-2.5 hover:bg-ice dark:hover:bg-midnight transition-colors"
                >
                  <Globe size={16} />
                  {isEnglish ? 'አማርኛ' : 'English'}
                </button>
                <button
                  onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                  className="flex flex-col items-center justify-center gap-1 text-xs font-semibold text-navy dark:text-ice border border-line dark:border-midnight-line rounded-lg py-2.5 hover:bg-ice dark:hover:bg-midnight transition-colors"
                >
                  {resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                  {resolvedTheme === 'dark' ? 'Light' : 'Dark'}
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 py-4">
                {navigationItems.map((item) => (
                  <div key={item.title}>
                    <div className="px-4">
                      {item.hasSubmenu ? (
                        <button
                          onClick={() => toggleSection(item.title)}
                          className="flex items-center justify-between w-full py-3 text-left text-navy dark:text-ice hover:text-geely-blue dark:hover:text-blue-bright transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span className="font-display font-semibold uppercase tracking-[0.04em] text-[15px]">{item.title}</span>
                          </div>
                          <ChevronDown
                            size={20}
                            className={`transform transition-transform ${
                              expandedSection === item.title ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className="flex items-center gap-3 py-3 text-navy dark:text-ice hover:text-geely-blue dark:hover:text-blue-bright transition-colors"
                        >
                          {item.icon}
                          <span className="font-display font-semibold uppercase tracking-[0.04em] text-[15px]">{item.title}</span>
                        </Link>
                      )}
                    </div>

                    {/* Submenu */}
                    {item.hasSubmenu && expandedSection === item.title && (
                      <div className="bg-ice dark:bg-midnight border-t border-line dark:border-midnight-line">
                        {item.submenu?.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={onClose}
                            className="block px-8 py-2 text-steel dark:text-steel-light hover:text-navy dark:hover:text-ice hover:bg-white dark:hover:bg-midnight-surface transition-colors"
                          >
                            {subItem.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              {/* Bottom Actions */}
              <div className="border-t border-line dark:border-midnight-line p-4 space-y-3">
                <Link
                  href="/test-drive"
                  onClick={onClose}
                  className="block w-full bg-gold text-navy text-center py-3 rounded font-bold hover:bg-opacity-90 transition-colors"
                >
                  {t('common.bookTestDrive')}
                </Link>
                <Link
                  href="/quote"
                  onClick={onClose}
                  className="block w-full bg-navy text-white text-center py-3 rounded font-bold hover:bg-opacity-90 transition-colors"
                >
                  {t('common.getQuote')}
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
