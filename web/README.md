# Geely Ethiopia — Web (Public Frontend)

**Port:** 7501 (dev) / 7502 (local prod build)  
**Type:** Next.js 15 (App Router)  
**Database:** None (API client only)

---

## Architecture

```
                    ┌──────────────────┐
                    │     DATABASE     │
                    │ PostgreSQL/MySQL │
                    └────────▲─────────┘
                             │
                             │ Prisma
                             │
                    ┌────────┴────────┐
                    │      ADMIN      │
                    │    :7500        │
                    │ Prisma + API    │
                    └────────▲────────┘
                             │
                             │ HTTP/API
                             │
                    ┌────────┴────────┐
                    │       WEB       │  ← YOU ARE HERE
                    │     :7501       │
                    │   Next.js       │
                    └─────────────────┘
```

**Web is completely independent** — it connects to Admin's HTTP API, never touches the database directly.

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

```
web/
├── app/                    # Next.js 15 App Router
│   ├── page.tsx            # Homepage
│   ├── models/             # Vehicle browsing
│   ├── dealers/            # Dealer locator
│   ├── test-drive/         # Test drive booking
│   └── ...
├── components/             # Shared UI components
│   ├── Header.tsx          # Main navigation
│   ├── Footer.tsx
│   ├── ErrorBoundary.tsx   # Error handling
│   ├── LoadingSkeleton.tsx # Loading states
│   └── Toast.tsx           # Notifications
├── features/               # Domain-specific modules
│   ├── vehicles/
│   ├── dealers/
│   ├── electric/
│   ├── test-drive/
│   ├── quote/
│   └── ...
├── services/               # API clients
│   └── adminApiClient.ts   # Admin backend API
├── hooks/                  # React hooks
│   ├── useVehicles.ts
│   ├── useToast.ts
│   └── ...
├── types/                  # TypeScript types
│   ├── vehicle.ts
│   ├── dealer.ts
│   └── ...
├── utils/                  # Utilities
│   ├── formatting.ts
│   ├── seoHelpers.ts
│   └── ...
├── config/                 # Configuration
│   ├── env.ts
│   ├── fonts.ts
│   └── site.ts
├── constants/              # Magic-string-free constants
│   ├── routes.ts
│   ├── vehicles.ts
│   └── ...
├── providers/              # React context providers
│   ├── ThemeProvider.tsx   # Dark mode
│   └── ...
└── middleware.ts           # Edge middleware
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

All data comes from **Admin backend** via `adminApiClient`:

```tsx
import { adminApi } from '@/services/adminApiClient';

// Vehicles
const { vehicles } = await adminApi.vehicles.list({ category: 'suv' });
const vehicle = await adminApi.vehicles.getBySlug('coolray');

// Dealers
const dealers = await adminApi.dealers.list({ city: 'Addis Ababa' });

// Test Drive Submission
await adminApi.testDrive.submit({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  vehicleInterest: 'coolray',
  // ...
});
```

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
