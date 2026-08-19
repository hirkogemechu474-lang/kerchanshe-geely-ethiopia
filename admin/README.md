# Geely Ethiopia — Admin (Backend + Admin Panel)

**Port:** 3001  
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
                    │    :3001        │
                    │ DB + API + UI   │
                    └────────▲────────┘
                             │
                             │ HTTP/API (/api/public/*)
                             │
                    ┌────────┴────────┐
                    │       WEB       │
                    │     :3000       │
                    │   Next.js       │
                    └─────────────────┘
```

**Admin owns the database** — provides HTTP API for Web and serves the admin dashboard.

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
NEXTAUTH_URL=http://localhost:3001
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

Opens on http://localhost:3001

### Build & Deploy

```bash
npm run build
npm start
```

---

## Folder Structure

```
admin/
├── app/
│   ├── admin/                  # Admin dashboard routes
│   │   ├── dashboard/
│   │   ├── vehicles/
│   │   ├── dealers/
│   │   ├── users/
│   │   └── ...
│   ├── api/
│   │   ├── admin/              # Admin-only API routes
│   │   └── public/             # Public API (for Web)
│   └── layout.tsx
├── components/
│   ├── admin/                  # Admin UI components
│   │   ├── AdminLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── LoadingSpinner.tsx
│   └── ErrorAlert.tsx
├── features/                   # Domain modules
│   ├── vehicles/
│   ├── dealers/
│   ├── users/
│   ├── analytics/
│   ├── content/
│   ├── marketing/
│   ├── customers/
│   ├── parts/
│   └── settings/
├── services/                   # Service layer
│   └── vehicleAdminService.ts
├── repositories/               # Data access layer (Prisma)
│   ├── vehicleRepository.ts
│   ├── dealerRepository.ts
│   └── userRepository.ts
├── models/                     # Domain models
│   └── VehicleAdminModel.ts
├── schemas/                    # Validation schemas
│   └── vehicleSchemas.ts
├── types/                      # TypeScript types
│   └── admin.ts
├── hooks/                      # React hooks
│   ├── useAdminAuth.ts
│   ├── useToast.ts
│   └── useConfirm.ts
├── utils/                      # Utilities
│   └── formatting.ts
├── config/                     # Configuration
│   ├── env.ts
│   └── site.ts
├── constants/                  # Constants
│   ├── permissions.ts
│   └── status.ts
├── middleware/                 # Middleware helpers
│   ├── auth.ts
│   └── rateLimit.ts
├── lib/                        # Infrastructure
│   ├── auth/                   # NextAuth config
│   ├── prisma.ts               # Prisma client
│   └── db.ts                   # Database utilities
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed-*.ts               # Seed scripts
│   └── migrations/
└── scripts/
    └── create-admin.ts         # CLI admin user creator
```

---

## Key Features

### 🔐 Authentication & Authorization
```tsx
import { requireAuth, requirePermission } from '@/middleware/auth';

export default async function Page() {
  const session = await requireAuth();
  await requirePermission('canManageVehicles');
  // ...
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

Key models in `prisma/schema.prisma`:

- **User** — Admin users with roles & permissions
- **Vehicle** — Vehicle inventory
- **VehicleBrand** — Brands (Geely, Geometry)
- **VehicleCategory** — Categories (SUV, Sedan, EV)
- **Dealer** — Dealer locations
- **TestDriveRequest** — Test drive bookings
- **QuotationRequest** — Quote requests
- **ServiceBooking** — Service appointments
- **NewsArticle** — News & press releases
- **Promotion** — Marketing promotions
- **SparePart** — Parts inventory
- **Review** — Customer reviews

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
npm run dev              # Development server (port 3001)
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
   - Point `admin.geelyethiopia.com` to port 3001
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
- Ensure Admin is running on port 3001
- Check CORS configuration for Web domain
- Verify `/api/public/*` routes are accessible without auth

---

## Support

For issues or questions, contact the development team.
