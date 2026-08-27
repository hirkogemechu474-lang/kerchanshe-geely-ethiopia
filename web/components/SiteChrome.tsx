'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { MobileDrawer } from './MobileDrawer';
import { SearchModal } from './SearchModal';

// Lives in the root layout so Header/Footer/MobileDrawer persist across
// navigations instead of unmounting and remounting (and re-fetching nav data)
// on every page change.
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-ice dark:bg-midnight transition-colors">
      <Header onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />
      <MobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onSearchClick={() => setSearchOpen(true)}
      />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
