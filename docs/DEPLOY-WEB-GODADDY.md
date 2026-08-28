# Web Deployment — GoDaddy

This folder is the packaged `web/` app, produced by `scripts/package-deploy.ps1`.
It excludes `node_modules/`, `.next/`, and any real `.env` — you build those on
the server itself.

## Prerequisites

- GoDaddy hosting plan with **Node.js support** (cPanel → "Setup Node.js App"),
  Node 18+. This app has API routes, NextAuth, and Prisma — it cannot run as a
  static export.
- Network access from this server to the shared PostgreSQL database (see step 2).

## 1. Upload

Upload this entire folder to the server (e.g. via cPanel File Manager, FTP, or
git).

## 2. Configure environment

Copy `.env.example` to `.env` and fill in real values. The important ones:

- `NEXT_PUBLIC_SITE_URL` — `https://geelyethiopia.com`
- `NEXT_PUBLIC_ADMIN_API_URL` — the admin app's real address (see
  `DEPLOY-ADMIN-LAN.md`). Used server-side by the `/uploads/:path*` rewrite in
  `next.config.ts` so vehicle images load same-origin, no CORS involved.
- `DATABASE_URL` — the **same** Postgres database the admin app owns, at
  192.168.1.20. GoDaddy shared hosting cannot reach a private LAN IP directly;
  either front the DB with a managed Postgres instance, or expose 192.168.1.20
  to GoDaddy over a VPN/SSH tunnel with TLS. Do not open Postgres to the public
  internet unauthenticated.
- `NEXTAUTH_URL` — `https://geelyethiopia.com`
- `NEXTAUTH_SECRET` / `JWT_SECRET` — **must be byte-for-byte identical** to the
  admin app's values, or cross-app session/JWT verification breaks.
- `SECURE_COOKIES=true` — this app is served over HTTPS.
- `CORS_ORIGINS` — include `https://geelyethiopia.com,https://www.geelyethiopia.com`.
- `SMTP_*` — for lead-form/quote emails.

## 3. Install, build, start

```bash
npm install
npm run build
npm start
```

`npm start` runs `next start -p 7502` (see `package.json`). If cPanel's Node.js
Selector manages the process for you, point its startup file at the app root
and let it invoke `npm start` — do not set a different entry file.

## 4. Domain binding

Point `geelyethiopia.com` and `www.geelyethiopia.com` at the Node app (cPanel's
Node.js Selector wires its own reverse proxy when you assign the domain to the
app — no manual nginx/Apache config needed on standard GoDaddy Node hosting).

## 5. Verify

- `https://geelyethiopia.com` loads the homepage, `/models`, and the header's
  Models mega-menu.
- Vehicle thumbnails and the 360° viewer load without CORS errors in the
  browser console (confirms `NEXT_PUBLIC_ADMIN_API_URL` and the admin's
  `CORS_ORIGINS` are both correct).
- Submitting a lead form (quote/test-drive) sends an email and appears in the
  admin panel.

## Troubleshooting

**Web can't reach the database** — check `DATABASE_URL`; confirm GoDaddy can
actually route to wherever Postgres lives (see step 2).

**Images don't load / CORS error in console** — `NEXT_PUBLIC_ADMIN_API_URL`
must point at the admin app's real, reachable address, and that address must
be in the admin's `CORS_ORIGINS`.

**Login redirects loop, or session doesn't persist** — `NEXTAUTH_SECRET` /
`JWT_SECRET` mismatch with the admin app, or `SECURE_COOKIES` set wrong for
the protocol actually in use.
