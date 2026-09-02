# Admin Deployment — LAN Windows Server (192.168.1.20)

This folder is the packaged `admin/` app, produced by `scripts/package-deploy.ps1`.
It excludes `node_modules/`, `.next/`, and any real `.env` — you build those on
the server itself. This server owns the shared PostgreSQL database used by
both the admin app and the public web app.

## Prerequisites

- Windows Server reachable at `192.168.1.20`, Node.js 18+ installed.
- PostgreSQL installed and running on this machine. Confirm `idle_session_timeout`
  is disabled (Prisma's connection pool holds connections open between requests
  and does not proactively recycle them, so a nonzero value here causes
  intermittent `FATAL: terminating connection due to idle-session timeout`
  errors once the app has been idle a while):
  ```sql
  SHOW idle_session_timeout;  -- should be 0
  -- if not:
  ALTER SYSTEM SET idle_session_timeout = 0;
  SELECT pg_reload_conf();
  ```
- A process manager so the app survives reboots/crashes. PM2 is the simplest
  Node-native option:
  ```bash
  npm install -g pm2 pm2-windows-startup
  pm2-startup install
  ```
  (NSSM is a reasonable alternative if you'd rather run it as a native Windows
  service instead.)

## 1. Copy files

Place this folder anywhere on the server, e.g. `C:\apps\geely-admin\`.

## 2. Configure environment

Copy `.env.example` to `.env` and fill in real values. The important ones:

- `NEXT_PUBLIC_ADMIN_URL` / `NEXT_PUBLIC_ADMIN_API_URL` — `http://192.168.1.20:7500`.
- `DATABASE_URL` — the local Postgres instance on this machine.
- `NEXTAUTH_URL` / `NEXTAUTH_URL_INTERNAL` — `http://192.168.1.20:7500`.
- `NEXTAUTH_SECRET` / `JWT_SECRET` — **must be byte-for-byte identical** to the
  web app's values.
- `SECURE_COOKIES=false` — this app is served over plain HTTP on the LAN.
- `CORS_ORIGINS` — must list every origin allowed to load `/uploads/*`
  cross-origin (the web app's 360° viewer needs this). Include the web app's
  production domain(s) and any dev origins you test from — this is already
  set up correctly in the current `.env`.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — used once to bootstrap the first admin
  user; change the password immediately after first login.
- `SMTP_*` — only needed here if the admin app itself sends email.

## 3. Install, generate, migrate, build

```bash
npm install
npm run db:generate
npm run db:push
npm run seed            # first deploy only — seeds reference data
npm run create:admin    # first deploy only, or after changing ADMIN_EMAIL/PASSWORD
npm run build
```

Prefer `npm run db:migrate` over `db:push` once you have tracked migrations
you want applied in order rather than a schema diff push.

## 4. Run persistently

```bash
pm2 start npm --name geely-admin -- start
pm2 save
```

`pm2 restart geely-admin` after any future deploy (new build output).

## 5. Firewall / network

- Open port 7500 for LAN clients (staff on-site, and the web app's server-side
  `/uploads` rewrite).
- If the GoDaddy-hosted web app needs to reach this server directly (for the
  rewrite proxy or the shared database), it must be reachable from the public
  internet somehow — a VPN, an SSH tunnel, or a firewall port-forward with
  TLS. Do not expose Postgres directly to the public internet.

## 6. Verify

- `http://192.168.1.20:7500/admin/login` loads and you can sign in.
- From the web app, vehicle images and the 360° viewer load without CORS
  errors (confirms `CORS_ORIGINS` includes the web app's real origin).

## Troubleshooting

**Prisma Client not found** — `npm run db:generate`.

**Database connection failed** — check `DATABASE_URL`, confirm Postgres is
running and accepting connections, verify credentials.

**Recurring `prisma:error ... terminating connection due to idle-session timeout`
(SqlState E57P05)** — `idle_session_timeout` is set on the Postgres server and
is killing pooled connections during quiet periods; see the Prerequisites
section above to disable it.

**Web app gets CORS errors loading `/uploads`** — the web app's origin isn't
in this app's `CORS_ORIGINS`; add it and restart (`pm2 restart geely-admin`).

**Cross-app login doesn't work** — `NEXTAUTH_SECRET`/`JWT_SECRET` mismatch
between admin and web.
