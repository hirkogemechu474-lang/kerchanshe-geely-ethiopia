import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty means the host root. Set NEXT_PUBLIC_BASE_PATH only when a reverse
  // proxy mounts the admin app below a path.
  ...(process.env.NEXT_PUBLIC_BASE_PATH ? {
    basePath: process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/+$/, ""),
  } : {}),

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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'geelyethiopia.com' },
      { protocol: 'https', hostname: 'www.geelyethiopia.com' },
      { protocol: 'https', hostname: 'www.geely-ethiopia.com' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
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
    optimizePackageImports: ['lucide-react'],
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

  // Headers for performance and security
  async headers() {
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
    ];
  },
};

export default nextConfig;
