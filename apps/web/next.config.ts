import type { NextConfig } from "next";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const basePath = rawBasePath ? rawBasePath.replace(/\/+$/, "") : undefined;

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),

  distDir: process.env.NODE_ENV === 'production' ? '.next-prod' : '.next',

  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,

  images: {
    // The custom loader only exists to work around Next's built-in optimizer
    // 400ing on local /public files once basePath is set (see lib/imageLoader.ts).
    // That bug doesn't exist without a basePath (e.g. local dev, or any
    // deployment at the domain root), so only opt out of real AVIF/WebP
    // conversion + resizing when a basePath actually forces it.
    ...(basePath ? { loader: "custom" as const, loaderFile: "./lib/imageLoader.ts" } : {}),
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "img.youtube.com" },
      { protocol: "https", hostname: "geelyethiopia.com" },
      { protocol: "https", hostname: "www.geelyethiopia.com" },
      { protocol: "https", hostname: "www.geely-ethiopia.com" },
      // Admin-managed CMS fields (hero/about/promotions/offers banners, etc.)
      // accept arbitrary external image URLs, not just the domains above —
      // widen to any https host so those go through the optimizer too.
      { protocol: "https", hostname: "**" },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 85, 100],
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },

  logging: {
    fetches: {
      fullUrl: false,
    },
  },

  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  async rewrites() {
    const backendUrl = process.env.BACKEND_API_URL || "http://localhost:4000";
    // Uploaded media (hero images, vehicle galleries, news/team photos, etc.)
    // is physically stored in the admin app's public/uploads and served at the
    // admin origin. The web app stores only relative "/uploads/..." URLs, so we
    // proxy them here to keep every page's <img src> working.
    const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:7500";

    return {
      beforeFiles: [],
      // /api/upload* is handled locally by this app's own app/api/upload*
      // route handlers (see lib/localUpload.ts): Next's rewrite proxy fails
      // on large multipart bodies, so those routes must win over this catch-
      // all backend proxy. Using `afterFiles` (checked after the filesystem)
      // rather than `beforeFiles` lets them do that while every other
      // /api/* request still falls through to the backend here.
      afterFiles: [
        // Serve uploads from the local public/uploads first.  Only proxy to
        // the admin origin when the file is NOT found locally (fallback).
        {
          source: "/uploads/:path*",
          destination: `${adminUrl.replace(/\/$/, "")}/uploads/:path*`,
        },
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
      fallback: [],
    };
  },

  async headers() {
    const isHttps = (process.env.NEXT_PUBLIC_SITE_URL || "").startsWith("https://");

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
        source: '/:all*(mp4|webm|vtt)',
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
        source: '/:path*',
        headers: [
          ...(isHttps ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          }] : []),
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
        ],
      },
    ];
  },
};

export default nextConfig;
