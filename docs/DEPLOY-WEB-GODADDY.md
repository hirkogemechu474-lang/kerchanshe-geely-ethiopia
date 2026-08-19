# Deploying the Public Web Application (GoDaddy)

This folder is a **self-contained** Next.js application. It does NOT depend on any sibling
folder. It was produced by `scripts/package-deploy.ps1` from the `web/` directory.

| Item | Value |
|---|---|
| App | Public website (`web/`) |
| Port | `3002` (or the port GoDaddy assigns) |
| Node | v20 or v24 LTS |
| Shared DB | PostgreSQL (managed service recommended) |

## Files you received

- `app/`, `components/`, `lib/`, etc. — application source
- `prisma/schema.prisma` — the vendored schema mirror (kept in sync with `admin/`)
- `package.json`, `package-lock.json`, `next.config.ts` — build config
- `.env.example` — copy to `.env` and fill in real values
- `DEPLOY.md` — this file

## 1. Upload

Upload this folder's **contents** to GoDaddy as a Node.js application (do not upload
`node_modules` or `.next` — you will install/build on GoDaddy). Set the Node version to 20
or 24.

## 2. Environment variables

Copy `.env.example` to `.env` and set real values, especially:

- `DATABASE_URL` — must be a PostgreSQL URL **reachable from GoDaddy**. `localhost` will NOT
  reach the LAN database on `192.168.1.20`. Use a managed PostgreSQL (Supabase/Neon/AWS RDS)
  or a publicly reachable host with SSL. This DB is shared with the admin app.
- `NEXTAUTH_URL` / `NEXTAUTH_URL_INTERNAL` — the public site URL.
- `NEXTAUTH_SECRET` / `JWT_SECRET` — **must be identical to the admin app's values** so JWT
  tokens are compatible.
- `SECURE_COOKIES=true` (HTTPS).
- `NEXT_PUBLIC_ADMIN_API_URL` — public endpoint of the admin API if web forms submit there.
- Zoho, SMTP, Google Maps/GA keys as needed.

## 3. Install, generate, build, start

```bash
npm ci
npm run db:generate   # generates Prisma client from prisma/schema.prisma
npm run build
npm run start         # or the start command GoDaddy expects for a Node app
```

`postinstall` also runs `prisma generate` automatically, so `npm ci` is enough in most cases.

## 4. Notes

- Do NOT run `prisma migrate` here. Schema migrations are owned by the `admin` app.
- Do not put database, Zoho, SMTP, or auth secrets in `NEXT_PUBLIC_*` variables.
- `images.remotePatterns` in `next.config.ts` is an allowlist — only add CDN hosts deliberately.
