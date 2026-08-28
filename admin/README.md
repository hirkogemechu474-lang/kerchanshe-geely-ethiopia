# Geely Ethiopia — Admin (Backend + Admin Panel)

**Port:** 7500 (dev) / 7600 (local prod build)  
**Type:** Next.js 15 (App Router) + Prisma ORM  
**Database:** PostgreSQL (or MySQL)

---

## Architecture

```
                    ┌──────────────────┐
                    │     DATABASE     │  ← Prisma owns this
                    │ PostgreSQL/MySQL │
                    └────────▲─────────┘
                             │
                             │ Prisma ORM
                             │
                    ┌────────┴────────┐
                    │      ADMIN      │  ← YOU ARE HERE
                    │    :7500        │
                    │ DB + API + UI   │
                    └────────▲────────┘
                             │
                             │ HTTP/API (/api/public/*)
                             │
                    ┌────────┴────────┐
                    │       WEB       │
                    │     :7501       │
                    │   Next.js       │
                    └─────────────────┘
```

**Admin owns the database and provides a read-only HTTP API for Web's catalog/marketing
content** (vehicles, dealers, news, etc. — see `app/api/public/*`). Web also runs its own
Prisma client against the same database for self-service flows it owns end-to-end
(quotation e-sign, sales-agreement/handover countersigning, test-drive confirm,
customer accounts) — see `web/README.md`. Both apps stay independently deployable:
neither has a build-time dependency on the other (ADR-002).

---

## Getting Started

### Prerequisites
- Node.js 18+
- npm or pnpm
- PostgreSQL or MySQL database

### Installation

```bash
cd admin
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/geely_ethiopia"

# NextAuth
NEXTAUTH_URL=http://localhost:7500
NEXTAUTH_SECRET=your-secret-key-here

# Optional: Email (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Database Setup

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Seed database with sample data
npm run seed

# Create an admin user
npm run create:admin
```

### Development

```bash
npm run dev
```

Opens on http://localhost:7500

### Build & Deploy

```bash
npm run build
npm start
```

---

## Folder Structure

Three tiers, each with a clear job: **frontend** (pages + the thin API-client
`services/` layer consumed by `features/*` hooks), **backend**
(`app/api/**/route.ts` handlers + the `lib/services/` business-logic layer
they call), and **database** (`repositories/` — the only place `prisma.*`
calls are allowed — plus `lib/prisma.ts` and `prisma/`).

```
admin/
├── app/                         # FRONTEND — pages/layouts
│   ├── admin/                   # Admin dashboard routes (dashboard, vehicles,
│   │                            # dealers, users, workshop, sales, parts, ...)
│   └── api/
│       ├── admin/               # BACKEND — admin-only API routes (thin handlers)
│       ├── public/              # BACKEND — public API (consumed by Web)
│       ├── auth/                # BACKEND — login, password reset
│       ├── financing/, media/, content/   # BACKEND — a few routes that
│       │                        # predate the app/api/{admin,public} split
│       └── ...
├── components/admin/            # FRONTEND — admin UI components
├── features/                    # FRONTEND — domain modules (vehicles,
│                                 # dealers, users, analytics, content,
│                                 # marketing, customers, parts, settings, ...)
├── services/                    # FRONTEND — typed API-client wrappers
│                                 # consumed by features/*/use*.ts hooks
├── hooks/ providers/ utils/ config/ constants/ models/ schemas/ types/
│                                 # FRONTEND — supporting layers
│
├── repositories/                # DATABASE tier — every prisma.* call lives
│   │                            # here, nowhere else (~28 files, one per
│   │                            # domain/model cluster: vehicleRepository,
│   │                            # salesOrderRepository, jobCardRepository,
│   │                            # warrantyClaimRepository, ...)
│   └── index.ts
│
├── lib/
│   ├── prisma.ts                # DATABASE tier — Prisma client singleton
│   ├── services/                # BACKEND tier — business logic/orchestration,
│   │   ├── sales/                # organized by domain (orders, quotations,
│   │   ├── workshop/             # job cards, warranty claims, PDI, ...)
│   │   ├── financing/, content/, media/, dealers/, vehicles/,
│   │   └── ...                   # services/, auth/, users/, reviews/, ...
│   ├── auth/                    # NextAuth config + session/permission
│   │   ├── config.ts             # helpers — requireAuth/requirePermission
│   │   ├── middleware.ts         # (page-level), requireAdminApiSession
│   │   ├── api.ts                # (API-route-level)
│   │   ├── types.ts              # AdminRole/AdminPermissions/ROLE_PERMISSIONS
│   │   └── permissionGroups.ts, rolePermissions.ts, roleDescriptions.ts
│   └── cors.ts, env.ts, rate-limit.ts, upload-utils.ts, status-email.ts, ...
│                                 # cross-cutting infra, not business logic
├── middleware.ts                 # Next.js edge middleware (route protection)
│
├── prisma/
│   ├── schema.prisma             # DATABASE tier — schema
│   ├── seed-*.ts                 # Seed scripts
│   └── migrations/
└── scripts/
    └── create-admin.ts           # CLI admin user creator
```

---

## Key Features

### 🔐 Authentication & Authorization
```tsx
// Page-level (Server Components)
import { requireAuth, requirePermission } from '@/lib/auth/middleware';

export default async function Page() {
  const session = await requireAuth();
  await requirePermission('canManageVehicles');
  // ...
}

// API-route-level
import { requireAdminApiSession } from '@/lib/auth/api';

export async function GET() {
  const { session, response } = await requireAdminApiSession();
  if (response) return response; // 401, already shaped
  // session!.user.permissions.canManageVehicles, etc.
}
```

### 📊 Dashboard Stats
```tsx
import { useDashboardStats } from '@/features/analytics';

const { stats, loading } = useDashboardStats();
console.log(stats.totalVehicles, stats.pendingTestDrives);
```

### 🔔 Toast Notifications
```tsx
import { useToast } from '@/hooks';

const { success, error } = useToast();
success('Vehicle saved!');
error('Failed to update');
```

### 📝 Form Validation
```tsx
import { validateVehicleForm } from '@/schemas/vehicleSchemas';

const errors = validateVehicleForm(formData);
if (errors.length > 0) {
  // Show errors
}
```

---

## API Routes

### Public API (for Web frontend)
```
GET  /api/public/vehicles          # List vehicles
GET  /api/public/vehicles/:slug    # Get vehicle by slug
GET  /api/public/dealers           # List dealers
GET  /api/public/news              # List news articles
GET  /api/public/services/menu     # Services menu
GET  /api/public/electric/menu     # Electric menu
POST /api/public/test-drive        # Submit test drive request
POST /api/public/quote             # Submit quote request
POST /api/public/contact           # Submit contact form
```

### Admin API (requires authentication)
```
GET    /api/admin/vehicles          # List all vehicles
POST   /api/admin/vehicles          # Create vehicle
PATCH  /api/admin/vehicles/:id      # Update vehicle
DELETE /api/admin/vehicles/:id      # Delete vehicle

GET    /api/admin/dealers           # List dealers
GET    /api/admin/test-drives       # List test drive requests
PATCH  /api/admin/test-drives/:id/status  # Update status

GET    /api/admin/users             # List users
POST   /api/admin/users             # Create user
PATCH  /api/admin/users/:id/role    # Update user role
```

---

## Database Schema

Key models in `prisma/schema.prisma` (vendored, kept in sync with `web/prisma/schema.prisma`
via `scripts/sync-web-prisma-schema.mjs` — both apps share one PostgreSQL database):

- **User** — Admin users with roles & permissions
- **Vehicle**, **VehicleBrand**, **VehicleCategory** — Catalog (plus VehicleAccessory/Color/Interior/Package/Wheel)
- **Dealer** — Dealer locations
- **TestDrive** — Test drive bookings
- **Quotation**, **SalesOrder** — The sales/quoting pipeline (PdiChecklistItem, SalesOrderStatusHistory)
- **ServiceBooking** — Service appointments
- **JobCard**, **Technician**, **ServiceBay**, **WarrantyClaim** — Workshop/SWMS domain
- **NewsArticle** — News & press releases
- **Promotion** — Marketing promotions
- **SparePart**, **PartRequest**, **PartCategory**, **PartBrand**, **PartBenefit** — Parts domain
- **Review** — Customer reviews
- **FinancingBank**, **FinancingProgram** — Financing partners/programs
- **Setting** — Generic key/value store for CMS content, policies, social links, business/contact settings

---

## Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npm run db:generate

# Create a migration
npm run db:migrate

# Push schema directly (dev only)
npm run db:push

# Seed database
npm run seed

# Seed specific data
npm run seed:services
npm run seed:electric
npm run seed:faq
npm run seed:parts

# Create admin user
npm run create:admin

# Verify seed data
npm run verify
```

---

## Feature Modules

Each feature in `features/` is self-contained:

- **vehicles** — CRUD operations, categories, brands
- **dealers** — Location management
- **users** — User management, roles, permissions
- **analytics** — Dashboard metrics, reports
- **content** — CMS (hero, pages, showcase)
- **marketing** — Promotions, news, reviews, FAQ
- **customers** — Test drives, quotes, service bookings, messages
- **parts** — Spare parts inventory
- **settings** — Business settings, integrations

---

## Permissions System

Defined in `constants/permissions.ts`:

```ts
const PERMISSIONS = {
  MANAGE_VEHICLES: 'canManageVehicles',
  MANAGE_USERS: 'canManageUsers',
  VIEW_ANALYTICS: 'canViewAnalytics',
  // ...
};
```

Usage:
```tsx
import { requirePermission } from '@/middleware/auth';

await requirePermission('canManageVehicles');
```

---

## Scripts

```bash
npm run dev              # Development server (port 7500)
npm run build            # Production build
npm start                # Start production server
npm run lint             # Run ESLint
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Create migration
npm run seed             # Seed database
npm run create:admin     # Create admin user (CLI)
npm run verify           # Verify seed data
```

---

## Deployment (GoDaddy Shared Hosting)

### Requirements
- Node.js support (18+)
- PostgreSQL or MySQL database

### Steps

1. **Upload files:**
   - Upload entire `admin/` folder
   - Include `.next/`, `prisma/`, `node_modules/`

2. **Set environment variables:**
   - Configure `DATABASE_URL` to production database
   - Set `NEXTAUTH_URL` to production URL
   - Generate secure `NEXTAUTH_SECRET`

3. **Initialize database:**
   ```bash
   npm run db:push
   npm run seed
   npm run create:admin
   ```

4. **Start server:**
   ```bash
   npm start
   ```

5. **Configure reverse proxy:**
   - Point `admin.geelyethiopia.com` to port 7500
   - Or use subfolder: `geelyethiopia.com/admin`

---

## Security Checklist

- [ ] Change default `NEXTAUTH_SECRET`
- [ ] Use strong database password
- [ ] Enable HTTPS in production
- [ ] Configure CORS for Web domain
- [ ] Set rate limiting on public API routes
- [ ] Disable Prisma Studio in production
- [ ] Review user permissions regularly
- [ ] Enable database backups

---

## Troubleshooting

### Prisma Client not found
```bash
npm run db:generate
```

### Database connection failed
- Check `DATABASE_URL` in `.env`
- Ensure database server is running
- Verify credentials and network access

### Admin login not working
- Create admin user: `npm run create:admin`
- Check `NEXTAUTH_SECRET` is set
- Verify password hash in database

### Web can't connect to Admin API
- Ensure Admin is running on port 7500
- Check CORS configuration for Web domain
- Verify `/api/public/*` routes are accessible without auth

---

## Support

For issues or questions, contact the development team.
