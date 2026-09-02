import React from 'react';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Header/Footer/MobileDrawer now live in the root layout (see SiteChrome) so
// they persist across navigations instead of remounting on every page change.
// This wrapper is kept so existing page.tsx call sites don't need to change.
export function MainLayout({ children }: MainLayoutProps) {
  return <>{children}</>;
}
