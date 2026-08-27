import type { NextConfig } from "next";

// Set only in production (portal.kerchanshe.co/geely, behind Apache) — absent
// in local dev so `next dev` keeps serving from the site root.
const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const basePath = rawBasePath ? rawBasePath.replace(/\/+$/, "") : undefined;

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),

  // `next dev` and `next build`/`next start` default to the SAME .next
  // output directory. Running a dev server and a production instance of
  // this app at the same time (e.g. local production-mode verification
  // alongside the day-to-day dev server) means dev's live compilation
  // keeps mutating the exact files `next start` just read, corrupting the
  // production build mid-flight — surfaces as `[TypeError:
  // routesManifest.dataRoutes is not iterable]` on `next start`. Next's
  // CLI always sets NODE_ENV itself (development for `dev`, production for
  // `build`/`start`) before this file loads, so splitting on it here gives
  // production its own isolated build directory with no script changes
  // needed anywhere else.
  distDir: process.env.NODE_ENV === 'production' ? '.next-prod' : '.next',

  // Skip ESLint during builds (stricter rules than codebase currently satisfies).
  // TypeScript type-checking still runs and fails builds on type errors.
  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,

  // Image optimization configuration.
  // Remote hosts are allowlisted to prevent the image optimizer from fetching
  // arbitrary hosts (SSRF). Add any new trusted image CDN here.
  //
  // Custom loader: Next's built-in /_next/image optimizer cannot resolve
  // local image paths correctly once `basePath` is set (a known Next.js
  // limitation — it returns 400 "not a valid image" for every next/image use
  // of a local /public file). `unoptimized: true` alone isn't enough either:
  // it skips the optimizer but ALSO skips the basePath-prefixing that only
  // happens inside the optimizer-URL-construction step, so raw <img src>
  // ends up missing the /geely prefix too. lib/imageLoader.ts sidesteps both
  // by returning the raw file URL with basePath prepended explicitly.
  // Trade-off: no on-the-fly resize/avif/webp conversion; static
  // Cache-Control headers below still apply.
  images: {
    loader: "custom",
    loaderFile: "./lib/imageLoader.ts",
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "geelyethiopia.com" },
      { protocol: "https", hostname: "www.geelyethiopia.com" },
      { protocol: "https", hostname: "www.geely-ethiopia.com" },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85, 100],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  // Suppress Next.js 15 dynamic API warnings for NextAuth compatibility
  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  // Production optimizations
  reactStrictMode: true,
  poweredByHeader: false,

  // Compression
  compress: true,

  // Media uploads are stored by the admin app (http://localhost:3001, see
  // NEXT_PUBLIC_ADMIN_API_URL). Serve them from the same origin so <Image "/uploads/...">
  // URLs resolve without a hardcoded cross-origin dependency.
  async rewrites() {
    const adminUrl =
      process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:7500";

    return [
      {
        source: "/uploads/:path*",
        destination: `${adminUrl}/uploads/:path*`,
      },
      // Same-origin proxy for the two admin-only endpoints adminApiClient.ts
      // calls from the browser — keeps NEXT_PUBLIC_ADMIN_API_URL (which points
      // at this server's own localhost) out of client-bundled code, since a
      // NEXT_PUBLIC_* var is inlined into every visitor's browser bundle.
      {
        source: "/api/public/quote",
        destination: `${adminUrl}/api/public/quote`,
      },
      {
        source: "/api/public/test-drive",
        destination: `${adminUrl}/api/public/test-drive`,
      },
    ];
  },

  // Headers for performance and security
  async headers() {
    const adminUrl =
      process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:7500";

    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, must-revalidate',
          },
        ],
      },
      {
        // Security headers on every route (Lighthouse Best Practices).
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(self)',
          },
          {
            // Static (no nonce) so it doesn't force pages into per-request dynamic
            // rendering — App Router's own RSC hydration scripts are inline and
            // need 'unsafe-inline' unless every page opts into headers()-based
            // nonces, which would kill static generation site-wide.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              `img-src 'self' data: blob: ${adminUrl} https:`,
              "font-src 'self' data:",
              `connect-src 'self' ${adminUrl} https:`,
              "frame-src 'self' https://www.google.com https://www.youtube.com https://youtube.com",
              `media-src 'self' ${adminUrl} https:`,
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
