# Architecture Overview

## Project Structure

```
Kerchanshe-Geely-Ethiopia/
├── backend/                    # Express.js API server (port 4000)
│   ├── src/
│   │   ├── config/             # env, database, cors
│   │   ├── middleware/          # auth, validate, errorHandler, rolePermissions
│   │   ├── routes/             # 31 route files, ~364 endpoints
│   │   ├── services/           # Business logic (to be expanded)
│   │   ├── repositories/       # Data access layer (to be expanded)
│   │   ├── types/              # TypeScript types (auth, etc.)
│   │   └── utils/              # reference, secureLink, rateLimit, fileType, formatting
│   ├── prisma/                 # SINGLE Prisma schema (60 models)
│   │   ├── schema.prisma       # Source of truth
│   │   └── seed/               # Seed files
│   └── uploads/                # File uploads
│
├── apps/
│   ├── web/                    # Public website (Next.js, port 7501)
│   │   ├── app/                # Pages only (NO api/ directory)
│   │   ├── components/         # React UI components
│   │   ├── features/           # Feature modules
│   │   ├── hooks/              # React hooks
│   │   ├── lib/                # Frontend utilities + apiClient
│   │   └── services/           # API client services (call Express backend)
│   │
│   └── admin/                  # Admin panel (Next.js, port 7500)
│       ├── app/                # Pages only (NO api/ directory)
│       ├── components/         # React UI components
│       ├── features/           # Feature modules
│       ├── hooks/              # React hooks
│       ├── lib/                # Frontend utilities + apiClient
│       └── services/           # API client services (call Express backend)
│
├── packages/
│   └── types/                  # Shared TypeScript types
│
├── docker/                     # Docker configs
│   ├── docker-compose.yml      # Local dev stack
│   ├── Dockerfile.backend
│   ├── Dockerfile.web
│   └── Dockerfile.admin
│
└── scripts/                    # Setup & migration scripts
```

## Architecture Pattern

**Before:** Two independent Next.js apps with duplicated API routes, repositories, and services sharing one PostgreSQL database via copied Prisma schemas.

**After:** Express.js backend (single API server) + two Next.js frontend apps (frontend-only) + shared packages.

### Request Flow

```
Browser → Next.js App (SSR/CSR) → Express.js API → Prisma → PostgreSQL
                ↓
         apiClient (Axios)
                ↓
         http://localhost:4000/api/*
```

### Auth Flow

```
Admin Login:  Browser → NextAuth (admin app) → Session JWT cookie → Backend verifies JWT
Customer Login: Browser → POST /api/auth/login → JWT cookie → Backend verifies JWT
```

## Key Decisions

1. **Single Prisma Schema**: `backend/prisma/schema.prisma` is the ONLY source of truth. No more sync scripts.

2. **Single Auth System**: Backend owns all authentication. Frontend apps call `/api/auth/admin/session` to verify admin sessions.

3. **Single Repository Layer**: All Prisma queries live in `backend/src/repositories/`. No more duplicated queries.

4. **Single Service Layer**: All business logic lives in `backend/src/services/`. No more duplicated logic.

5. **Frontend as BFF**: Next.js apps are purely frontend — they render pages and call the Express backend via `apiClient`.

6. **CORS**: Backend allows requests from both frontend apps (configurable via env vars).

## Running Locally

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Web
cd apps/web && npm run dev

# Terminal 3: Admin
cd apps/admin && npm run dev

# Or with Docker Compose:
cd docker && docker-compose up
```

## API Endpoints Summary

| Domain | Endpoints | Auth |
|--------|-----------|------|
| Auth | 8 | Public + Customer |
| Vehicles | 39 | Admin + Public |
| Orders/Sales | 22 | Admin |
| Quotations | 13 | Admin + Public |
| Workshop | 27 | Admin |
| Parts | 18 | Admin + Public |
| Financing | 10 | Admin + Public |
| Customers | 4 | Admin |
| Dealers | 5 | Admin + Public |
| Settings | 6 | Admin + Public |
| Content/CMS | 31 | Admin + Public |
| Users | 8 | Admin |
| Promotions | 5 | Admin + Public |
| Reviews | 5 | Admin + Public |
| Messages | 3 | Admin + Public |
| Test Drives | 4 | Admin + Public |
| Service Bookings | 4 | Admin + Public |
| Showroom Visits | 4 | Public |
| Handover | 4 | Public |
| Agreement | 4 | Public |
| Staff Signature | 2 | Public |
| CSI Survey | 2 | Public |
| Newsletter | 1 | Public |
| Redirects | 2 | Internal |
| Search | 1 | Public |
| CRM | 1 | Public |
| Payments | 3 | Admin + Public |
| Public | 43 | Public |
| **Total** | **~364** | |
