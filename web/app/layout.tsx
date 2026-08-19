import type { Metadata, Viewport } from "next";
// @ts-ignore: CSS module declarations may be missing in this project setup
import "./globals.css";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { WebVitals } from "@/components/WebVitals";
import { WhatsAppWidget } from "@/components/WhatsAppWidget";
import CookieBanner from "@/components/CookieBanner";
import Script from "next/script";

export const viewport: Viewport = {
  themeColor: "#0057B8",
};

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://geelyethiopia.com";

export const metadata: Metadata = {
  title: "Geely Ethiopia | Official Distributor by Kerchanshe Auto",
  description: "Explore Geely vehicles in Ethiopia. From efficient SUVs to electric vehicles, discover global engineering built for Ethiopian roads.",
  keywords: "Geely Ethiopia, Geely cars, SUV Ethiopia, Electric vehicles Ethiopia, Kerchanshe Auto, Coolray, Emgrand, Monjaro",
  manifest: "/manifest.json",
  metadataBase: new URL(BASE_URL),
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Geely Ethiopia",
  },
  openGraph: {
    title: "Geely Ethiopia | Official Distributor",
    description: "Explore the full Geely range in Ethiopia backed by nationwide dealer support and genuine parts.",
    type: "website",
    locale: "en_ET",
    url: BASE_URL,
    siteName: "Geely Ethiopia",
  },
  alternates: {
    canonical: BASE_URL,
    languages: {
      "en-ET": BASE_URL,
      "am-ET": `${BASE_URL}?lang=am`,
      "x-default": BASE_URL,
    },
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Geely Ethiopia" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Geely Ethiopia" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#0057B8" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192x192.png" />
      </head>
      <body>
        {children}
        <PWAInstallPrompt />
        <WhatsAppWidget showStatus={true} delay={8000} />
        <CookieBanner />
        <WebVitals />
        
        {/* Service Worker Registration */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('Service Worker registered:', registration.scope);
                    },
                    function(error) {
                      console.log('Service Worker registration failed:', error);
                    }
                  );
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
