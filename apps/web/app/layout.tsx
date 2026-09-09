import type { Metadata, Viewport } from "next";
// @ts-ignore: CSS module declarations may be missing in this project setup
import "./globals.css";
import dynamic from "next/dynamic";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { WebVitals } from "@/components/WebVitals";
import CookieBanner from "@/components/CookieBanner";
import { SiteChrome } from "@/components/SiteChrome";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Script from "next/script";
import { inter, manrope, notoSansEthiopic } from "@/lib/fonts";
import { env } from "@/lib/env";
import { BASE_PATH, withBasePath, withBasePathUrl } from "@/lib/basePath";
import apiClient from "@/lib/apiClient";
import { unstable_cache } from "next/cache";

// Code-split into its own chunk instead of the shared bundle every route
// pays for — it self-gates on a client fetch anyway (renders null until
// /admin/settings has a chatbot configured), so it doesn't need to be part
// of the initial JS every page ships.
const ChatbotWidget = dynamic(() => import("@/components/ChatbotWidget"));

// Site-wide SEO defaults (default meta title/description, OG image, Twitter
// handle, keywords, GA4 ID, Search Console verification, Facebook/Meta Pixel
// ID, extra robots.txt rules) — admin-managed at /admin/settings/seo, backed
// by Setting['seo_settings']. Read here both for generateMetadata()'s
// site-wide fallback (individual pages that set their own metadata still
// take precedence — Next.js merges child metadata over these parent
// defaults) and for the conditional GA4/Pixel script injection below.
// Fetched with a bare object fallback so a down backend never breaks page
// rendering, just falls back to the previous hardcoded copy.
type SeoSettings = {
  defaultMetaTitle?: string;
  defaultMetaTitleTemplate?: string;
  defaultMetaDescription?: string;
  ogImageUrl?: string;
  twitterHandle?: string;
  defaultKeywords?: string;
  googleAnalyticsId?: string;
  googleSiteVerification?: string;
  facebookPixelId?: string;
  robotsExtra?: string;
};

// Cached across requests (5 min) so every page's <head> doesn't pay a
// backend round trip on every SSR — previously uncached with a 30s axios
// timeout, which stalled the whole document response (and its <head>/meta
// tags) whenever the backend was slow or unreachable.
const getSeoSettings = unstable_cache(
  async (): Promise<SeoSettings> => {
    try {
      const { data } = await apiClient.get("/public/seo-settings", { timeout: 3000 });
      return data && typeof data === "object" ? data : {};
    } catch {
      return {};
    }
  },
  ["seo-settings"],
  { revalidate: 300 }
);

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0057B8" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1526" },
  ],
};

const BASE_URL = withBasePathUrl(env.app.url);

const FALLBACK_TITLE = "Geely Ethiopia | Official Distributor by Kerchanshe Group Geely";
const FALLBACK_OG_TITLE = "Geely Ethiopia | Official Distributor";
const FALLBACK_DESCRIPTION = "Explore Geely vehicles in Ethiopia. From efficient SUVs to electric vehicles, discover global engineering built for Ethiopian roads.";
const FALLBACK_OG_DESCRIPTION = "Explore the full Geely range in Ethiopia backed by nationwide dealer support and genuine parts.";
const FALLBACK_KEYWORDS = "Geely Ethiopia, Geely cars, SUV Ethiopia, Electric vehicles Ethiopia, Kerchanshe Group Geely, Coolray, Emgrand, Monjaro";

// Was a static `export const metadata` — now computed per-request from
// admin-managed Setting['seo_settings'] (see getSeoSettings above), with the
// previous hardcoded copy as the fallback when nothing's configured yet or
// the backend is unreachable. Everything else here (manifest, icons,
// alternates, appleWebApp) is unchanged. Per-page metadata exports/
// generateMetadata calls elsewhere in the app (e.g. models/[id], services/
// [slug]) still take precedence over this root layout for the fields they
// set themselves — that's standard Next.js parent/child metadata merging,
// unaffected by switching this from an object to a function.
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();

  const title = seo.defaultMetaTitle || FALLBACK_TITLE;
  const description = seo.defaultMetaDescription || FALLBACK_DESCRIPTION;

  return {
    title: seo.defaultMetaTitleTemplate
      ? { default: title, template: seo.defaultMetaTitleTemplate }
      : title,
    description,
    keywords: seo.defaultKeywords || FALLBACK_KEYWORDS,
    manifest: withBasePath("/manifest.json"),
    metadataBase: new URL(BASE_URL),
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Geely Ethiopia",
    },
    openGraph: {
      title: seo.defaultMetaTitle || FALLBACK_OG_TITLE,
      description: seo.defaultMetaDescription || FALLBACK_OG_DESCRIPTION,
      type: "website",
      locale: "en_ET",
      url: BASE_URL,
      siteName: "Geely Ethiopia",
      ...(seo.ogImageUrl ? { images: [{ url: seo.ogImageUrl }] } : {}),
    },
    ...(seo.twitterHandle
      ? { twitter: { card: "summary_large_image" as const, site: seo.twitterHandle, creator: seo.twitterHandle } }
      : {}),
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
        { url: withBasePath('/icons/icon-192x192.png'), sizes: '192x192', type: 'image/png' },
        { url: withBasePath('/icons/icon-512x512.png'), sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: withBasePath('/icons/icon-152x152.png'), sizes: '152x152', type: 'image/png' },
        { url: withBasePath('/icons/icon-192x192.png'), sizes: '192x192', type: 'image/png' },
      ],
    },
    // Google Search Console's "HTML tag" ownership verification method —
    // admin enters just the token (Setting['seo_settings'].googleSiteVerification),
    // Next renders it as <meta name="google-site-verification" content="...">.
    ...(seo.googleSiteVerification ? { verification: { google: seo.googleSiteVerification } } : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seo = await getSeoSettings();
  const gaId = seo.googleAnalyticsId?.trim();
  const pixelId = seo.facebookPixelId?.trim();

  return (
    <html
      lang="en"
      className={`${inter.variable} ${manrope.variable} ${notoSansEthiopic.variable}`}
      suppressHydrationWarning
    >
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
        <link rel="apple-touch-icon" sizes="152x152" href={withBasePath('/icons/icon-152x152.png')} />
        <link rel="apple-touch-icon" sizes="180x180" href={withBasePath('/icons/icon-192x192.png')} />
        <link rel="apple-touch-icon" sizes="192x192" href={withBasePath('/icons/icon-192x192.png')} />

        {/* Warm up the connection for the afterInteractive 3rd-party scripts
            below, so they don't pay full DNS+TLS setup cost once triggered. */}
        {gaId && <link rel="preconnect" href="https://www.googletagmanager.com" />}
        {pixelId && <link rel="preconnect" href="https://connect.facebook.net" />}

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
        <ChatbotWidget />
        <WebVitals />

        {/* Google Analytics 4 — only loaded when an ID is configured at
            /admin/settings/seo (Setting['seo_settings'].googleAnalyticsId).
            Standard gtag.js snippet, loaded after the page is interactive so
            it never blocks first render. */}
        {gaId && (
          <>
            <Script
              id="ga4-lib"
              strategy="afterInteractive"
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`}
            />
            <Script
              id="ga4-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(gaId)});`,
              }}
            />
          </>
        )}

        {/* Facebook / Meta Pixel — only loaded when an ID is configured at
            /admin/settings/seo (Setting['seo_settings'].facebookPixelId).
            Standard fbevents.js snippet plus the no-JS fallback pixel. */}
        {pixelId && (
          <>
            <Script
              id="meta-pixel-init"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(pixelId)});fbq('track','PageView');`,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${encodeURIComponent(pixelId)}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}

        {/* Service Worker Registration */}
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if (${JSON.stringify(process.env.NODE_ENV === 'production')} && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register(${JSON.stringify(withBasePath('/sw.js'))}).then(
                    function(registration) {
                      console.log('Service Worker registered:', registration.scope);
                    },
                    function(error) {
                      console.log('Service Worker registration failed:', error);
                    }
                  );
                });
              } else if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  registrations.forEach(function(registration) { registration.unregister(); });
                });
                if ('caches' in window) {
                  caches.keys().then(function(keys) {
                    keys.forEach(function(key) { caches.delete(key); });
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
