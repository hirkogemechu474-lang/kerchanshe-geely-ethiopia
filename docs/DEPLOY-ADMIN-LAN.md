# Deploying the Admin Panel (192.168.1.20 LAN Server)

This folder is a **self-contained** Next.js application + the Prisma schema owner. It was
produced by `scripts/package-deploy.ps1` from the `admin/` directory.

| Item | Value |
|---|---|
| App | Admin panel + admin/public APIs (`admin/`) |
| Port | `3001` |
| Node | v20 or v24 LTS |
| Shared DB | PostgreSQL (this server hosts it, or points to managed DB) |
| Target | `http://192.168.1.20:3001` |

## Files you received

- `app/`, `components/`, `lib/`, etc. — application source
- `prisma/schema.prisma` + `prisma/migrations/` — **the source of truth** for the shared DB
- `scripts/` — admin bootstrap and seed scripts
- `package.json`, `package-lock.json`, `next.config.ts` — build config
- `.env.example` — copy to `.env` and fill in real values
- `DEPLOY.md` — this file

## 1. Prerequisites

- Node.js LTS (v20 or v24) and npm
- PostgreSQL (if the DB lives on this server)

## 2. Place the app

Extract to a fixed path, e.g. `D:\geely-ethiopia\admin-deploy`. Work from that folder.

## 3. Environment variables

Copy `.env.example` to `.env` and set real values:

- `NODE_ENV=production`
- `NEXT_PUBLIC_ADMIN_URL=http://192.168.1.20:3001`
- `NEXT_PUBLIC_SITE_URL=https://geelyethiopia.com`
- `DATABASE_URL` — the shared PostgreSQL URL.
- `NEXTAUTH_URL=http://192.168.1.20:3001`
- `NEXTAUTH_SECRET` / `JWT_SECRET` — **must be identical to the web app's values**.
- `SECURE_COOKIES=false` for LAN HTTP (set `true` only behind HTTPS).
- Zoho, SMTP, upload, cron values as needed.

## 4. Install, migrate, build, start

```powershell
npm.cmd ci
npx.cmd prisma migrate deploy   # apply migrations to the shared DB
npm.cmd run db:seed             # optional initial content
npm.cmd run build
npm.cmd run start:lan           # listens on 0.0.0.0:3001
```

Do NOT run `prisma migrate dev` against production. Use `migrate deploy`.

## 5. Windows Firewall

- Allow inbound TCP `3001` only from required clients (web server, admin users).
- Keep TCP `5432` private. If GoDaddy's web app must reach this DB directly, you MUST expose
  `5432` securely (firewall allowlist for GoDaddy's outbound IP + SSL). A managed PostgreSQL
  service is the safer alternative.

## 6. Run as a service

Use a process manager / Windows service so the app restarts after reboot. Record the service
name, working directory, node path, start command, logs, and restart policy.

## 7. Notes

- This app owns Prisma migrations. After changing `admin/prisma/schema.prisma`, run
  `npm run db:migrate` locally, then `npx prisma migrate deploy` here, and tell the web owner
  to refresh their schema mirror (`npm run sync:schema` at the monorepo root).
- For internet-facing admin/API access, put an HTTPS reverse proxy in front. Do not expose a
  plain HTTP admin login to the public internet.
