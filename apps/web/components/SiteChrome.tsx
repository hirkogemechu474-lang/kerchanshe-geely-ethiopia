'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
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
  const pathname = usePathname();
  // Model detail pages (e.g. /models/geely-ex2, not the /models listing) also
  // show their own full-width nav (ModelPageTabs — vehicle name, section jump
  // links, Schedule Test Drive) right below the global header. Showing both
  // sticky bars at once would stack them, so the global header on these pages
  // auto-hides once you scroll past it, leaving ModelPageTabs alone at the
  // top — it reappears once you scroll back near the top of the page.
  const isModelDetailPage = /^\/models\/[^/]+$/.test(pathname ?? '');

  return (
    <div className="min-h-screen flex flex-col bg-ice dark:bg-midnight transition-colors">
      <Header
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        overlay={pathname === '/'}
        autoHide={isModelDetailPage}
      />
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
