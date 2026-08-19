'use client';

import React from 'react';
import { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { UtilityBar } from './UtilityBar';
import { MobileDrawer } from './MobileDrawer';

interface MainLayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function MainLayout({ children, showFooter = true }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-ice">
      <UtilityBar />
      <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
    </div>
  );
}
