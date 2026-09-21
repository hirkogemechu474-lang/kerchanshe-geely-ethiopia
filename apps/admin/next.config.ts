import type { NextConfig } from "next";

const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const basePath = rawBasePath ? rawBasePath.replace(/\/+$/, "") : undefined;

// Admin and web share the same basePath ("/geely" — admin's own pages are
// already nested under /admin internally, e.g. /geely/admin/login, so its
// basePath can't also be "/geely/admin" without doubling that segment).
// That means both apps' _next/static asset URLs collide at
// "/geely/_next/static/...", and the reverse proxy in front of them (Apache)
// can only route that shared prefix to ONE of the two backends — it sends it
// to web, so admin's entire JS/CSS bundle 404s in production. assetPrefix
// gives admin's OWN build assets a distinct, admin-only path (reusing
// "/geely/admin", which Apache already routes to this app) without touching
// basePath/page routing at all. See the matching Apache rule in
// httpd-ssl.conf that strips the extra "/admin" back off before it reaches
// this server.
const rawAssetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || "";
const assetPrefix = rawAssetPrefix ? rawAssetPrefix.replace(/\/+$/, "") : undefined;

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  ...(assetPrefix ? { assetPrefix } : {}),

  distDir: process.env.NODE_ENV === 'production' ? '.next-prod' : '.next',

  eslint: {
    ignoreDuringBuilds: true,
  },
  devIndicators: false,

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
    minimumCacheTTL: 60 * 60 * 24 * 365,
  },

  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  experimental: {
    optimizePackageImports: ['lucide-react'],
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

    return {
      // Everything under /api/* is normally proxied straight to the backend.
      // Uploads are the one exception — they're handled locally by this
      // app's own app/api/upload* route handlers (see lib/localUpload.ts for
      // why: Next's rewrite proxy fails on large multipart bodies). Using
      // `afterFiles` (checked after the filesystem) rather than `beforeFiles`
      // lets those local routes win for their exact paths while every other
      // /api/* request still falls through to this same backend proxy.
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${backendUrl}/api/:path*`,
        },
      ],
      beforeFiles: [],
      fallback: [],
    };
  },

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
