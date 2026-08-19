# Geely Ethiopia deployment handoff

## Target deployment

| Component | Location | Port | Responsibility |
|---|---|---:|---|
| Admin panel and API | Windows server `192.168.1.20` | `3001` | Admin UI, admin APIs, public lead APIs, Prisma/database owner |
| PostgreSQL | Preferably the same LAN server or managed database | `5432` | Shared application data |
| Public web | GoDaddy hosting | `80/443` | Public website and customer-facing pages |

## Important architecture decision

The current project has Prisma/API code in both `admin` and `web`. A GoDaddy server cannot use `localhost` to reach PostgreSQL on `192.168.1.20`.

Use one of these approaches before production:

### Recommended: shared managed PostgreSQL

Put PostgreSQL on a managed private/secure service reachable by both servers. Configure the same `DATABASE_URL` in admin and web, restricted by firewall/IP allowlist and SSL.

Advantages: no home-router port forwarding, easier backups, safer failover, and both applications can use their existing Prisma routes.

### Alternative: admin API gateway

Keep PostgreSQL private on `192.168.1.20`, expose only the admin/public API through HTTPS, and change web server-side data calls to use the admin API. Do not expose PostgreSQL directly to the internet.

This requires checking every web route that imports Prisma and converting it to an authenticated/server-to-server admin API request where necessary.

### Avoid

Do not expose PostgreSQL port `5432` openly to the internet. Do not use `DATABASE_URL=localhost` on GoDaddy. Do not put database, Zoho, SMTP, payment, or NextAuth secrets in browser-exposed `NEXT_PUBLIC_*` variables.

## Before deployment

The deployment owner needs:

- GoDaddy Node.js application access and the Node version required by the project.
- Windows administrator access on `192.168.1.20`.
- PostgreSQL credentials and a backup of the database.
- Approved domain names, for example `geelyethiopia.com` and an admin/API hostname.
- Zoho CRM production credentials.
- SMTP/Zoho Mail credentials.
- Payment provider credentials and callback URLs.
- Approved Google Maps/Analytics/Search Console accounts.
- Final vehicle, dealer, financing, offer, legal, English, and Amharic content.

Never send real secrets in this document or commit them to Git. Send them through a secure password/secret-sharing channel.

## Admin server deployment — `192.168.1.20`

### 1. Install prerequisites

- Node.js LTS
- npm
- PostgreSQL client/server if PostgreSQL is hosted locally
- Git or a secure project-copy method

### 2. Copy the project

Copy the project to a fixed path, for example:

```text
D:\geely-ethiopia\geely-ethiopia
```

The admin working directory is:

```text
D:\geely-ethiopia\geely-ethiopia\admin
```

### 3. Configure `admin/.env`

Use production values, not the local development defaults:

```env
NODE_ENV=production
NEXT_PUBLIC_ADMIN_URL=https://admin-or-api.example.com
NEXT_PUBLIC_SITE_URL=https://geelyethiopia.com
NEXT_PUBLIC_ADMIN_API_URL=https://admin-or-api.example.com

DATABASE_URL=your-secure-database-url
NEXTAUTH_URL=https://admin-or-api.example.com
NEXTAUTH_URL_INTERNAL=https://admin-or-api.example.com
NEXTAUTH_SECRET=generate-a-long-random-secret
JWT_SECRET=generate-a-long-random-secret
SECURE_COOKIES=true

CORS_ORIGINS=https://geelyethiopia.com,https://www.geelyethiopia.com
```

Add the approved SMTP, Zoho, upload, payment, and cron values separately.

### 4. Install, generate, migrate, and build

Run from `admin`:

```powershell
npm.cmd ci
npx.cmd prisma generate
npx.cmd prisma migrate deploy
npm.cmd run build
```

Do not run `prisma migrate dev` against production.

### 5. Start admin

For a basic test:

```powershell
npm.cmd run start:lan
```

The admin should listen on `0.0.0.0:3001` and be reachable inside the LAN at:

```text
http://192.168.1.20:3001
```

For internet-facing API access, put HTTPS reverse proxy/WAF in front of it. Do not expose a plain HTTP admin login to the public internet.

### 6. Windows firewall

Allow TCP `3001` only from the required network/reverse-proxy source. Keep TCP `5432` private; if using managed PostgreSQL, allow only the application server IPs.

### 7. Run as a service

Use a process manager or Windows service so the app restarts after reboot. Record:

- Service name
- Working directory
- Node executable path
- Start command
- Log location
- Restart policy
- Backup/rollback procedure

## Web deployment — GoDaddy

### 1. Copy only the web application

The web working directory is:

```text
D:\geely-ethiopia\geely-ethiopia\web
```

The web folder is **fully self-contained** — it vendors its own Prisma schema at
`web/prisma/schema.prisma` (kept in sync from admin via `npm run sync:schema`), so GoDaddy
does not need the sibling `admin/prisma` path. The cleanest way to hand it over is to run
`npm run package:deploy` at the monorepo root, which produces `deploy/web-deploy/` (and
`deploy/admin-deploy/`) with `node_modules`, `.next`, and real `.env` already removed and a
per-target `DEPLOY.md` included.

### 2. Configure GoDaddy environment variables

Minimum URL configuration:

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://geelyethiopia.com
NEXT_PUBLIC_ADMIN_API_URL=https://admin-or-api.example.com
NEXTAUTH_URL=https://geelyethiopia.com
NEXTAUTH_URL_INTERNAL=https://geelyethiopia.com
NEXTAUTH_SECRET=the-approved-shared-secret-if-web-auth-requires-it
JWT_SECRET=the-approved-secret
SECURE_COOKIES=true
CORS_ORIGINS=https://geelyethiopia.com,https://www.geelyethiopia.com
```

If web still uses Prisma-backed server routes, it also needs a secure reachable `DATABASE_URL`. `localhost` will not work on GoDaddy for the LAN database.

### 3. Install and build

Run from `web`:

```bash
npm ci
npm run db:generate   # uses the vendored web/prisma/schema.prisma
npm run build
```

`postinstall` also runs `prisma generate`, so `npm ci` alone is usually sufficient. No
sibling `admin/prisma` path is required on GoDaddy.

### 4. Start web

```bash
npm run start
```

Configure the GoDaddy Node application to forward HTTPS traffic to the Next.js process on port `3002` or the port GoDaddy assigns.

## DNS and HTTPS

Recommended arrangement:

| Hostname | Destination |
|---|---|
| `geelyethiopia.com` | GoDaddy web application |
| `www.geelyethiopia.com` | GoDaddy web application/redirect |
| `admin-api.geelyethiopia.com` | HTTPS reverse proxy to `192.168.1.20:3001`, VPN, or secure tunnel |

Use HTTPS for all public and admin/API traffic. Update `NEXTAUTH_URL`, CORS, callback URLs, CRM webhook URLs, payment callback URLs, and email links after DNS is active.

## Smoke-test checklist

### Admin

- Open admin login.
- Create/update a vehicle.
- Update financing settings and verify invalid values are rejected.
- Create/update a financing bank and program.
- Open purchases, quotations, test drives, dealers, news, offers, and uploads.
- Confirm database writes.

### Web

- Open home, `/configure`, models, model detail, compare, offers, financing, quote, test drive, contact, dealers, news, service, and parts.
- Confirm `/configure` model cards open the correct preselected vehicle.
- Submit quote/contact/test-drive forms.
- Confirm local record and Zoho record behavior.
- Test phone/WhatsApp/dealer links.
- Test financing purchase and payment success/failure/cancel flows.
- Check mobile layout and browser console for hydration/API errors.

### Operations

- Restart both applications and confirm automatic recovery.
- Confirm logs and error alerts.
- Confirm database backup and restore test.
- Confirm TLS certificate renewal.
- Confirm firewall rules and that PostgreSQL is not publicly exposed.
- Record rollback steps and the previous working build.

## Handoff summary

The admin folder is the database/API owner and should be deployed on the controlled LAN server. The web folder is the public frontend and should be deployed on GoDaddy. The deployment owner must resolve the shared-data connection using either managed PostgreSQL or a secure admin API gateway before production. The current local setup is suitable for development at admin `:3001` and web `:3002`, but production credentials, HTTPS, routing, backups, payment/CRM testing, content, and UAT are still required.
