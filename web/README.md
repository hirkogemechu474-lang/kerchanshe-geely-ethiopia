# Geely Ethiopia — Web (Public Frontend)

**Port:** 7501 (dev) / 7502 (local prod build)  
**Type:** Next.js 15 (App Router)  
**Database:** Own Prisma client against the shared PostgreSQL database, **plus**
an HTTP client for Admin's read-only catalog/marketing API — see below.

---

## Architecture

```
                    ┌──────────────────┐
                    │     DATABASE     │
                    │    PostgreSQL    │
                    └────▲────────▲────┘
                         │        │
                  Prisma │        │ Prisma
                         │        │
              ┌──────────┴──┐  ┌──┴──────────────┐
              │    ADMIN    │  │       WEB        │  ← YOU ARE HERE
              │    :7500    │  │      :7501       │
              │ Prisma+API  │◄─┤ Prisma + Next.js │
              │ (owns DB,   │  │ (own transactional│
              │  CMS authr) │  │  backend + admin  │
              └─────────────┘  │  API client)      │
                    ▲          └──────────────────┘
                    │ HTTP GET /api/public/*
                    └── (catalog/marketing content Web doesn't own)
```

**Web is not database-free.** It runs its own Prisma client (`lib/prisma.ts`, same
database as Admin) for self-service flows it owns end-to-end and that need
web-hosted uploads/tokens — sales-agreement e-sign, vehicle handover sign-off,
quotation e-sign, test-drive confirm, staff-signature upload, payments, customer
accounts, and more (~30 route domains, see `repositories/` below). Web *also*
calls Admin's public API (`services/adminApiClient.ts`) for read-only catalog and
marketing content that Admin's CMS authors — vehicles, dealers, news. Both are
intentional: the two apps stay independently deployable (ADR-002), each owning
the domains it's the system of record for.

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- Admin backend running on port 7500

### Installation

```bash
cd web
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Admin API URL (backend)
NEXT_PUBLIC_ADMIN_API_URL=http://localhost:7500

# NextAuth
NEXTAUTH_URL=http://localhost:7501
NEXTAUTH_SECRET=your-secret-key-here

# Optional: Analytics
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GTM_ID=
```

### Development

```bash
npm run dev
```

Opens on http://localhost:7501

### Build & Deploy

```bash
npm run build
npm start
```

---

## Folder Structure

Same three-tier pattern as `admin/`: **frontend** (pages + `services/` API-client
wrappers), **backend** (`app/api/**/route.ts` handlers + `lib/services/` business
logic), **database** (`repositories/` — the only place `prisma.*` calls are
allowed — plus `lib/prisma.ts` and `prisma/`).

```
web/
├── app/                         # FRONTEND — pages/layouts
│   ├── page.tsx                 # Homepage
│   ├── models/, dealers/, test-drive/, quote/, parts/, service/, ...
│   └── api/
│       ├── public/              # BACKEND — public self-service + read APIs
│       ├── auth/                # BACKEND — customer login/register/reset
│       ├── agreement/, handover/  # BACKEND — e-sign + countersign-stamp
│       │                        # (the countersign-stamp endpoints Admin
│       │                        # calls server-to-server are frozen — see
│       │                        # docs/adr/ADR-001-hardening.md)
│       ├── settings/, content/  # BACKEND — CMS content this app owns
│       └── ...
├── components/                  # FRONTEND — shared UI (Header, Footer,
│                                 # ErrorBoundary, LoadingSkeleton, Toast, ...)
├── features/                    # FRONTEND — domain modules (vehicles,
│                                 # dealers, electric, test-drive, quote,
│                                 # account, faq, service, ...)
├── services/                    # FRONTEND — typed API-client wrappers
│   └── adminApiClient.ts        # → Admin's read-only public API (catalog only)
├── hooks/ providers/ utils/ config/ constants/ types/
│                                 # FRONTEND — supporting layers
│
├── repositories/                # DATABASE tier — every prisma.* call lives
│   │                            # here, nowhere else (~28 files: vehicleRepository,
│   │                            # quotationRepository, salesOrderRepository,
│   │                            # testDriveRepository, staffSignatureRepository, ...)
│   └── index.ts
│
├── lib/
│   ├── prisma.ts                # DATABASE tier — Prisma client singleton
│   ├── services/                # BACKEND tier — business logic, organized by
│   │                            # domain (orders, quotations, agreements,
│   │                            # handovers, purchases, payments, leads,
│   │                            # csiSurvey, staffSignature, settings, ...)
│   ├── auth/                    # customer session (config.ts, middleware.ts,
│   │                            # customer.ts, types.ts)
│   └── cors.ts, env.ts, rate-limit.ts, upload-utils.ts, form-email.ts,
│       reference.ts, i18n.ts, fonts.ts, payments/, ...
│                                 # cross-cutting infra, not business logic
├── middleware.ts                 # Edge middleware
│
└── prisma/
    ├── schema.prisma             # DATABASE tier — vendored copy of admin's
    │                            # schema, kept in sync via
    │                            # scripts/sync-web-prisma-schema.mjs
    └── migrations/
```

---

## Key Features

### 🎨 Dark Mode
```tsx
import { useTheme } from '@/providers';

const { theme, setTheme, resolvedTheme } = useTheme();
setTheme('dark'); // 'light' | 'dark' | 'system'
```

### 🔔 Toast Notifications
```tsx
import { useToast } from '@/hooks';

const toast = useToast();
toast.success('Vehicle saved!');
toast.error('Failed to load data');
```

### 🛡️ Error Boundaries
```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary fallback={<CustomError />}>
  <YourComponent />
</ErrorBoundary>
```

### ⏳ Loading Skeletons
```tsx
import { VehicleCardSkeleton, TableSkeleton } from '@/components/LoadingSkeleton';

{loading ? <VehicleCardSkeleton /> : <VehicleCard />}
```

### 📊 SEO Helpers
```tsx
import { generateSEOMeta, generateProductSchema } from '@/utils/seoHelpers';

export const metadata = generateSEOMeta({
  title: 'Geely Coolray',
  description: 'Compact urban SUV',
  image: '/images/coolray.jpg',
  type: 'product',
});
```

---

## API Integration

Two data paths, by design (see Architecture above):

**Read-only catalog/marketing content Admin's CMS authors** goes through
`adminApiClient`, an HTTP client hitting Admin's `/api/public/*`:

```tsx
import { adminApi } from '@/services/adminApiClient';

const { vehicles } = await adminApi.vehicles.list({ category: 'suv' });
const vehicle = await adminApi.vehicles.getBySlug('coolray');
const dealers = await adminApi.dealers.list({ city: 'Addis Ababa' });
```

**Everything web owns end-to-end** — test-drive booking, quotations, sales
agreements, handovers, parts requests, customer accounts, and more — is served
by this app's own `app/api/**/route.ts` handlers, backed by its own
`repositories/` + `lib/services/` (this app's own Prisma client, same
database as Admin). Frontend code calls these the normal Next.js way (relative
`fetch('/api/public/...')`), not through `adminApiClient`.

---

## Feature Modules

Each feature is self-contained in `features/`:

- **vehicles** — browsing, filtering, details
- **dealers** — locator, contact info
- **electric** — EV content, range calculator
- **test-drive** — booking form
- **quote** — price request
- **compare** — side-by-side vehicle comparison
- **configurator** — build & price
- **parts** — spare parts catalog
- **news** — company news & updates
- **reviews** — customer testimonials
- **account** — customer profile
- **faq** — frequently asked questions
- **service** — after-sales services

---

## Scripts

```bash
npm run dev          # Development server (port 7501)
npm run build        # Production build
npm start            # Start production server
npm run lint         # Run ESLint
```

---

## Deployment (GoDaddy Shared Hosting)

### Option 1: Node.js App (if supported)
1. Build: `npm run build`
2. Upload `.next/`, `public/`, `package.json`, `node_modules/`
3. Start: `npm start`

### Option 2: Static Export (if Node.js not supported)
1. Update `next.config.ts`:
   ```ts
   const nextConfig = {
     output: 'export',
     images: { unoptimized: true },
   };
   ```
2. Build: `npm run build`
3. Upload `out/` folder to `public_html/`

---

## Troubleshooting

### Web can't connect to Admin
- Ensure Admin is running on port 7500
- Check `NEXT_PUBLIC_ADMIN_API_URL` in `.env`
- In production, use full URL: `https://admin.geelyethiopia.com`

### Dark mode not persisting
- Check browser localStorage
- Ensure `ThemeProvider` wraps your app in `layout.tsx`

### Toast not showing
- Import `ToastContainer` and render at root level
- Use `useToast()` hook in client components

---

## Support

For issues or questions, contact the development team.
