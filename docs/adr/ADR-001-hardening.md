# ADR-001: Hardening Geely Ethiopia (web + admin) — Security, Singleton & CI
# ADR-002: Standalone deployment packages (included below)

**Status:** Accepted
**Date:** 2026-08-16
**Decision owners:** Frontend engineering review

## Context

A security/quality review of the two Next.js apps (`web/` on :3002, `admin/` on :3001)
found several critical issues: 21 unauthenticated admin API routes, path traversal in the
image DELETE endpoint, arbitrary uploads, SSRF via `images.remotePatterns: "**"`, a PII
leak in the public vehicle endpoint, unauthenticated settings mutations, duplicated Prisma
client instances, and `$disconnect()` calls on the shared singleton. CI only ran Lighthouse;
lint/typecheck/build/audit were un-gated. `lighthouserc.js` pointed at the wrong port.

## Decisions

### 1. Authenticate all admin API routes
Every handler under `admin/app/api/**` now calls `requireAdminApiSession()` (helper in
`admin/lib/auth/api.ts`, returns `401` JSON when unauthenticated). Rationale: the public web
app only ever calls admin's `/api/public/*` endpoints; `/api/admin/*` is admin-internal.

### 2. Secure and sanitize uploads
- New `admin/lib/upload-utils.ts` / `web/lib/upload-utils.ts`: `UPLOADS_ROOT`,
  `sanitizeCategory()`, `isInsideUploads()`, `resolveUploadUrl()`.
- `admin/app/api/upload` and `admin/app/api/upload/image` now require admin auth, sanitize
  category, constrain paths to the uploads root, and drop SVG from allowed image types.
- `web/app/api/upload/image` stays public (used by review submission), sanitized, and its
  unused DELETE handler (the traversal vector) was removed.

### 3. Allowlist image optimizer hosts
`images.remotePatterns` in both `next.config.ts` files now lists only trusted CDNs
(`images.unsplash.com`, `placehold.co`, `img.youtube.com`, the Geely domains). Previously
`hostname: "**"` allowed the image optimizer to fetch arbitrary hosts (SSRF).

### 4. Remove PII leak + unauthenticated settings writes (web)
- `web/app/api/vehicles/[id]` GET no longer includes `testDrives`/`quotations`; returns a
  `_count` instead.
- `web/app/api/settings` POST/PUT/DELETE require an authenticated session with
  `canManageSettings`; GET stays public.

### 5. Single Prisma client; never disconnect in app code
- All module-level `new PrismaClient()` replaced with `import { prisma } from "@/lib/prisma"`
  (shared `globalThis` singleton, same as `@/lib/db`).
- Removed `prisma.$disconnect()` from 35+ app files (49 admin + 10 web routes). The shared
  singleton must never be disconnected; `$disconnect()` stays only in standalone
  scripts/seeds that create their own client.

### 6. Lint gate: relax `react/no-unescaped-entities` to warning
~128 pre-existing violations across 106 files (marketing copy with `'`/`"` in JSX text).
Promoted to error would block all PRs. Set to `warn` in both apps' `.eslintrc.json`;
other `next/core-web-vitals` rules remain errors.

### 7. Fix Lighthouse port + add CI quality gate
- `lighthouserc.js` URLs moved from `localhost:3000` to `localhost:3002`.
- New `.github/workflows/ci.yml`: typecheck + lint + build + `npm audit` for both apps on
  push/PR to `main`/`master`.
- Root `package.json` gains `typecheck`, `lint`, `build`, `audit`, `check` scripts; each app
  gains a `typecheck` script.

### 8. Dependency upgrade: Next 15.5 + next-auth 4.24.15 + nodemailer 9
`next@15.1.6` bundled vulnerable `postcss`/`sharp`. Upgraded to `next@15.5.23` (latest
non-major), `next-auth@4.24.15` (fixes critical CVEs; pins `uuid@^11.1.1`), and
`nodemailer@^9.0.5` via direct dependency + `overrides`. Audit gate is set to
`--audit-level=critical` because the remaining 3 high-severity advisories (postcss + sharp,
both bundled inside `next@15.5.23`) are only resolved by a major `next@16` upgrade, which is
intentionally deferred.

## Consequences

- All admin data APIs require a session; public web surface is reduced to intended routes.
- Upload paths are validated against traversal; SVG uploads rejected.
- Image optimizer only fetches allowlisted hosts.
- No more pool teardown/duplication from Prisma.
- `npm run check` is the local gate (typecheck + lint) and must pass before merging.
- `npm audit --audit-level=critical` passes in both apps; high postcss/sharp advisories are
  tracked as debt gated behind a next@16 upgrade.

## Follow-ups

- Plan `next@16` upgrade to clear the remaining postcss/sharp high advisories.
- Migrate `next lint` to the ESLint CLI (`@next/codemod next-lint-to-eslint-cli`) before
  Next 16 removes `next lint`.
- Verify any admin-uploaded image hosts beyond the allowlist and add them deliberately.
- Enable `eslint.ignoreDuringBuilds: false` once the codebase is error-free under the new
  lint setup.

## ADR-002: Standalone deployment packages (web -> GoDaddy, admin -> LAN)

The project is hosted as two independent deployments sharing one PostgreSQL database:
`web/` on GoDaddy (port 3002) and `admin/` on the LAN server `192.168.1.20` (port 3001).
Web previously required the sibling `admin/prisma/schema.prisma` path, which breaks when
deploying `web/` alone. Resolved by:

- Vendoring the schema at `web/prisma/schema.prisma` (mirror of `admin/prisma/schema.prisma`,
  kept in sync via `npm run sync:schema`).
- Rewriting web scripts (`build`, `db:generate`, `postinstall`) to use the local schema.
- `scripts/package-deploy.ps1` (`npm run package:deploy`) producing `deploy/web-deploy/` and
  `deploy/admin-deploy/` via robocopy, excluding `node_modules`, `.next`, and real `.env`,
  and embedding per-target `DEPLOY.md` + `.env.example`.
- Both packages verified to `npm ci` + `npm run build` standalone (web build no longer
  touches `../admin`).

Consequence: each recipient (GoDaddy, LAN server) gets a fully self-contained folder.
Schema changes must go through admin first, then `npm run sync:schema`, and packaging
re-run before a new release.
