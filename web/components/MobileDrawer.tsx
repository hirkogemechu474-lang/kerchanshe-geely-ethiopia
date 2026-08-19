'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { X, ChevronDown, Car, Zap, Wrench, Phone, MessageCircle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const navigationItems = [
    {
      title: 'Models',
      icon: <Car size={20} />,
      href: '/models',
      hasSubmenu: true,
      submenu: [
        { name: 'All Models', href: '/models' },
        { name: 'Coolray', href: '/models/coolray' },
        { name: 'Emgrand', href: '/models/emgrand' },
        { name: 'Monjaro', href: '/models/monjaro' },
        { name: 'Azkarra', href: '/models/azkarra' },
        { name: 'Okavango', href: '/models/okavango' }
      ]
    },
    {
      title: 'Electric',
      icon: <Zap size={20} />,
      href: '/electric',
      hasSubmenu: true,
      submenu: [
        { name: 'Geometry EX5', href: '/models/geometry-ex5' },
        { name: 'Charging Map', href: '/electric/charging' },
        { name: 'EV Benefits', href: '/electric' }
      ]
    },
    {
      title: 'Services',
      icon: <Wrench size={20} />,
      href: '/services',
      hasSubmenu: true,
      submenu: [
        { name: 'Test Drive', href: '/test-drive' },
        { name: 'Service Booking', href: '/service' },
        { name: 'Spare Parts', href: '/parts' },
        { name: 'Purchase', href: '/financing' }
      ]
    },
    { title: 'Dealers', icon: <Phone size={20} />, href: '/dealers' },
    { title: 'News', icon: <MessageCircle size={20} />, href: '/news' },
    { title: 'About', icon: <Info size={20} />, href: '/about' },
    { title: 'Offers', icon: <Car size={20} />, href: '/offers' }
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
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed left-0 top-0 bottom-0 w-[min(20rem,100vw)] bg-white shadow-xl z-51 lg:hidden overflow-y-auto"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-line">
                <div className="text-2xl font-bold text-navy">GEELY</div>
                <button
                  onClick={onClose}
                  className="p-2 text-steel hover:text-navy"
                >
                  <X size={24} />
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
                          className="flex items-center justify-between w-full py-3 text-left text-navy hover:text-geely-blue transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {item.icon}
                            <span className="font-semibold">{item.title}</span>
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
                          className="flex items-center gap-3 py-3 text-navy hover:text-geely-blue transition-colors"
                        >
                          {item.icon}
                          <span className="font-semibold">{item.title}</span>
                        </Link>
                      )}
                    </div>

                    {/* Submenu */}
                    {item.hasSubmenu && expandedSection === item.title && (
                      <div className="bg-ice border-t border-line">
                        {item.submenu?.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.href}
                            onClick={onClose}
                            className="block px-8 py-2 text-steel hover:text-navy hover:bg-white transition-colors"
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
              <div className="border-t border-line p-4 space-y-3">
                <Link
                  href="/test-drive"
                  onClick={onClose}
                  className="block w-full bg-gold text-navy text-center py-3 rounded font-bold hover:bg-opacity-90 transition-colors"
                >
                  Book Test Drive
                </Link>
                <Link
                  href="/quote"
                  onClick={onClose}
                  className="block w-full bg-navy text-white text-center py-3 rounded font-bold hover:bg-opacity-90 transition-colors"
                >
                  Get Quote
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
