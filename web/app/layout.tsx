import type { Metadata, Viewport } from "next";
// @ts-ignore: CSS module declarations may be missing in this project setup
import "./globals.css";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { WebVitals } from "@/components/WebVitals";
import CookieBanner from "@/components/CookieBanner";
import { SiteChrome } from "@/components/SiteChrome";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Script from "next/script";
import { inter, manrope, notoSansEthiopic } from "@/lib/fonts";
import { env } from "@/lib/env";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0057B8" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1526" },
  ],
};

const BASE_URL = env.app.url;
const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/+$/, "");

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
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${notoSansEthiopic.variable}`}>
      <head>
        {/* Next's basePath does NOT rewrite hand-written fetch('/api/...') calls
            (only routing/Link/asset URLs) — this app has ~47 client components
            with such calls, all assuming they're served from the site root.
            Under the /geely basePath those would hit the domain root instead,
            which Apache already routes to a different app. Patch fetch here,
            before hydration, to prepend the basePath for root-relative
            requests, rather than editing every call site. No-op when
            NEXT_PUBLIC_BASE_PATH is unset (local dev). */}
        {BASE_PATH && (
          <Script
            id="fetch-basepath-patch"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(){var b=${JSON.stringify(BASE_PATH)};var f=window.fetch;window.fetch=function(input,init){try{if(typeof input==='string'&&input.charAt(0)==='/'&&input.charAt(1)!=='/'&&input.indexOf(b+'/')!==0&&input!==b){input=b+input;}}catch(e){}return f.call(this,input,init);};})();`,
            }}
          />
        )}
        {/* Same problem, different call sites: at least 13 components render
            plain <img src={dbField}> (dealer galleries, parts catalog, offers
            banners, financing cards, the electric page, etc.) with a
            root-relative DB-stored path and no basePath awareness — none of
            those go through next/image's loader (already fixed separately)
            or fetch (already patched above). Patching setAttribute + the
            HTMLImageElement.src property setter here catches every current
            AND future <img src="/..."> use app-wide, however React ends up
            writing it, rather than chasing individual call sites one by one. */}
        {BASE_PATH && (
          <Script
            id="img-src-basepath-patch"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `(function(){var b=${JSON.stringify(BASE_PATH)};function fix(v){if(typeof v==='string'&&v.charAt(0)==='/'&&v.charAt(1)!=='/'&&v.indexOf(b+'/')!==0&&v!==b){return b+v;}return v;}var origSetAttr=Element.prototype.setAttribute;Element.prototype.setAttribute=function(name,value){if((name==='src'||name==='srcset')&&(this.tagName==='IMG'||this.tagName==='SOURCE')){value=fix(value);}return origSetAttr.call(this,name,value);};var d=Object.getOwnPropertyDescriptor(HTMLImageElement.prototype,'src');if(d&&d.set){Object.defineProperty(HTMLImageElement.prototype,'src',{get:d.get,set:function(v){d.set.call(this,fix(v));},configurable:true});}})();`,
            }}
          />
        )}
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

        {/* Sets the dark/light class on <html> before hydration so the page
            never flashes the wrong theme — ThemeProvider re-derives the same
            value on mount and takes over from there. */}
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <SiteChrome>{children}</SiteChrome>
        </ThemeProvider>
        <PWAInstallPrompt />
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
