# Deployment Guide: Admin (192.168.1.20) + Web (GoDaddy)

**Date:** August 12, 2026
**Architecture:**
- **Admin Panel:** Local Windows server at `192.168.1.20` (port 3001) — internal Kerchanshe staff only
- **Public Web:** GoDaddy hosting (production public site) — `geelyethiopia.com` or `geely.et`
- **Shared Database:** PostgreSQL running on 192.168.1.20 (accessible by BOTH admin and web)

---

## Part 1 — Server at 192.168.1.20 (Admin Panel + PostgreSQL)

### 1.1 Prerequisites Installed on 192.168.1.20

```
Install on the Windows Server 2019/2022 (192.168.1.20):

1. Node.js 20.x LTS          https://nodejs.org/    (Check: node -v)
2. PostgreSQL 15+            https://www.postgresql.org/download/windows/
3. Git (optional)            For source code transfer
4. PM2 (process manager)     npm install -g pm2-windows-startup
5. OpenSSL (optional)        For generating secrets
```

Verify after install:
```powershell
node -v          # Should be 20.x+
npm -v           # Should be 9.x+
psql --version   # Should be 15+
```

### 1.2 PostgreSQL Setup (on 192.168.1.20)

This DB is **SHARED** by admin (localhost) and web (GoDaddy over internet).

#### Step A — Create database and user

Open `SQL Shell (psql)` or pgAdmin, run:

```sql
-- Create production database
CREATE DATABASE geely_ethiopia;

-- Create dedicated user (CHANGE the password!)
CREATE USER geely_dbuser WITH PASSWORD 'Str0ngP@ssw0rd!Ch4ngeM3';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE geely_ethiopia TO geely_dbuser;
ALTER USER geely_dbuser WITH SUPERUSER;  -- Needed for Prisma migrations
```

#### Step B — Allow PostgreSQL to listen on all interfaces (CRITICAL for GoDaddy access)

Find and edit these 2 config files (paths differ by install):

**File 1:** `C:\Program Files\PostgreSQL\15\data\postgresql.conf`
```ini
# Around line 59, CHANGE:
# listen_addresses = 'localhost'
listen_addresses = '*'

# Also ensure port is 5432 (default)
port = 5432
```

**File 2:** `C:\Program Files\PostgreSQL\15\data\pg_hba.conf`
Add at the BOTTOM:
```ini
# Allow localhost (admin app)
host    geely_ethiopia   geely_dbuser   127.0.0.1/32       scram-sha-256
host    geely_ethiopia   geely_dbuser   ::1/128            scram-sha-256

# Allow GoDaddy server's PUBLIC IP (find it from GoDaddy cPanel)
# REPLACE 203.0.113.45 with GoDaddy's server IP
host    geely_ethiopia   geely_dbuser   203.0.113.45/32    scram-sha-256

# Optional: Allow Kerchanshe LAN (192.168.x.x) for dev laptops
host    geely_ethiopia   geely_dbuser   192.168.0.0/16     scram-sha-256
```

**Restart PostgreSQL service:**
```
Services → PostgreSQL 15 → Right-click → Restart
```

#### Step C — Open Windows Firewall Port 5432

```powershell
# Run as ADMINISTRATOR:
New-NetFirewallRule -DisplayName "PostgreSQL-Inbound-5432" `
    -Direction Inbound -Protocol TCP -LocalPort 5432 -Action Allow
```

Also, if 192.168.1.20 is behind a router/NAT:
- **Forward public port 5432 → 192.168.1.20:5432** on the router
- Get the server's **public IP** (whatismyip.com) — GoDaddy will connect to this IP

### 1.3 Transfer Admin Code to 192.168.1.20

Copy the entire `admin/` folder from your dev machine to:
```
D:\geely-ethiopia\admin\
```
(e.g., via USB drive, LAN file share, or Git)

### 1.4 Configure Admin .env for Production

On 192.168.1.20, edit `D:\geely-ethiopia\admin\.env`:

```env
# =====================================================
# GEELY ETHIOPIA - ADMIN - PRODUCTION @ 192.168.1.20
# =====================================================

NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# --- URLs ---
# (Users in LAN will access http://192.168.1.20:3001)
NEXT_PUBLIC_ADMIN_URL=http://192.168.1.20:3001
NEXT_PUBLIC_SITE_URL=https://geelyethiopia.com
NEXT_PUBLIC_ADMIN_API_URL=http://192.168.1.20:3001

NEXT_PUBLIC_SITE_NAME=Geely Ethiopia Admin
NEXT_PUBLIC_SITE_DESCRIPTION=Geely Ethiopia Admin Panel - Kerchanshe Auto Group

# --- DATABASE (PostgreSQL on same machine) ---
DATABASE_URL="postgresql://geely_dbuser:Str0ngP@ssw0rd!Ch4ngeM3@127.0.0.1:5432/geely_ethiopia?schema=public&connection_limit=10&pool_timeout=5&connect_timeout=10&statement_timeout=30"

# --- AUTH ---
NEXTAUTH_URL=http://192.168.1.20:3001
NEXTAUTH_URL_INTERNAL=http://192.168.1.20:3001

# GENERATE NEW SECRETS! Run in PowerShell:
#   -join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | % {[char]$_})
NEXTAUTH_SECRET=<paste-64-char-random-string-here>
JWT_SECRET=<paste-different-64-char-random-string-here>
CRON_SECRET=<paste-32-char-random-string-here>

NEXTAUTH_SESSION_MAX_AGE=2592000
NEXTAUTH_SESSION_UPDATE_AGE=86400
SECURE_COOKIES=false   # Admin uses HTTP (internal LAN only)
CORS_ORIGINS=https://geelyethiopia.com,http://192.168.1.20:3001,http://localhost:3002

# --- ADMIN LOGIN ---
ADMIN_EMAIL=admin@geelyethiopia.com
# CHANGE DEFAULT PASSWORD!
ADMIN_PASSWORD=<very-strong-password-here-Min-12-chars>

# --- ZOHO CRM (Get from Kerchanshe IT) ---
ZOHO_CRM_CLIENT_ID=
ZOHO_CRM_CLIENT_SECRET=
ZOHO_CRM_REFRESH_TOKEN=
ZOHO_CRM_API_URL=https://www.zohoapis.com/crm/v3/Leads
# Optional initial static token
ZOHO_CRM_ACCESS_TOKEN=

# --- EMAIL (SMTP via Kerchanshe systems@) ---
SMTP_HOST=smtp.zoho.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=systems@kerchanshe.com
SMTP_PASS=<password-from-kerchanshe-it>
SMTP_FROM="Geely Ethiopia <systems@kerchanshe.com>"

# --- GOOGLE MAPS (Optional, admin map display) ---
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=

# --- UPLOADS ---
MAX_UPLOAD_SIZE_MB=20
UPLOAD_DIR=./public/uploads
```

### 1.5 Install Dependencies + Build + Run Admin

```powershell
cd D:\geely-ethiopia\admin

# Install (use npm.cmd on PowerShell 5)
npm.cmd install --production

# Generate Prisma client
npx.cmd prisma generate

# Run migrations on production DB
npx.cmd prisma migrate deploy

# (Optional) Seed initial data if DB is empty
npx.cmd tsx prisma/seed-comprehensive.ts
npx.cmd tsx prisma/seed-services-menu.ts
npx.cmd tsx prisma/seed-electric-menu.ts
npx.cmd tsx prisma/seed-faq.ts
npx.cmd tsx prisma/seed-parts.ts
npx.cmd tsx scripts/create-admin.ts

# Build admin Next.js app
npm.cmd run build

# === START WITH PM2 (process manager - survives reboots) ===
# Install PM2 + Windows startup
npm.cmd install -g pm2
npm.cmd install -g pm2-windows-startup
pm2-startup install

# Start admin app via PM2 on port 3001
pm2 start "npm.cmd run start" --name geely-admin --time

# Save process list (reboots will reload this)
pm2 save

# Check it works:
pm2 status
pm2 logs geely-admin --lines 50
```

**Verify Admin works:**
- Open browser on LAN PC: `http://192.168.1.20:3001/admin/login`
- Login with ADMIN_EMAIL + ADMIN_PASSWORD from .env
- Check you can see the dashboard (means DB connection works)

### 1.6 Configure Web App to Call Admin APIs (for uploads etc.)

On 192.168.1.20, ensure the Admin app's API routes are reachable from GoDaddy:
- Open Windows Firewall port **3001** (same way as 5432)
- If behind NAT router, **forward public port 3001 → 192.168.1.20:3001**
- Note public IP (e.g. 197.x.x.x) — GoDaddy web .env will use it

---

## Part 2 — GoDaddy Hosting (Public Web Site)

### 2.1 GoDaddy Hosting Type

You have 2 options — pick ONE:

#### Option A (Recommended — easiest for Next.js): GoDaddy VPS / Managed WordPress → cPanel with Node.js support

OR

#### Option B: GoDaddy **Plesk** or **cPanel** hosting with Node.js selector (most common)

This guide assumes **GoDaddy cPanel with Node.js selector** (shared hosting).
If you have a GoDaddy VPS, see Appendix A at the bottom.

### 2.2 Upload Web Code to GoDaddy

**Option 1 — cPanel File Manager:**
1. Zip the entire `web/` folder (EXCEPT `web/node_modules/` and `web/.next/`)
2. GoDaddy cPanel → File Manager → `public_html/` or subfolder `geelyweb/`
3. Upload + Extract the zip

**Option 2 — FTP/SFTP:**
1. Use FileZilla/WinSCP
2. Upload `web/package.json`, `web/prisma/`, `web/app/`, `web/components/`, `web/config/`, `web/constants/`, `web/features/`, `web/hooks/`, `web/lib/`, `web/models/`, `web/providers/`, `web/repositories/`, `web/schemas/`, `web/services/`, `web/types/`, `web/utils/`, `web/public/`, `web/*.ts`, `web/*.json`, `web/*.mjs`, `web/.env`
3. Do NOT upload `node_modules/` or `.next/` (install/build on server)

### 2.3 Configure Web .env for GoDaddy Production

On GoDaddy, edit (or create) `web/.env`:

```env
# =====================================================
# GEELY ETHIOPIA - PUBLIC WEB - PRODUCTION @ GoDaddy
# =====================================================

NODE_ENV=production
NEXT_PUBLIC_APP_ENV=production

# --- PUBLIC URLs ---
NEXT_PUBLIC_SITE_URL=https://geelyethiopia.com
NEXT_PUBLIC_SITE_NAME=Geely Ethiopia
NEXT_PUBLIC_SITE_DESCRIPTION=Official Geely Motors Dealer in Ethiopia - Kerchanshe Group

# Admin API (fallback read from admin public IP/domain)
NEXT_PUBLIC_ADMIN_API_URL=http://<PUBLIC_IP_OF_192.168.1.20_SERVER>:3001
# OR if admin gets a domain: https://admin.geelyethiopia.com

# --- DATABASE (Connects BACK to PostgreSQL on 192.168.1.20!) ---
# Replace PUBLIC_IP with the public/external IP of 192.168.1.20's internet
DATABASE_URL="postgresql://geely_dbuser:Str0ngP@ssw0rd!Ch4ngeM3@PUBLIC_IP_OF_192.168.1.20:5432/geely_ethiopia?schema=public&sslmode=require&connection_limit=15&pool_timeout=5&connect_timeout=15&statement_timeout=30"

# --- AUTH ---
NEXTAUTH_URL=https://geelyethiopia.com
NEXTAUTH_URL_INTERNAL=https://geelyethiopia.com

# MUST BE IDENTICAL TO ADMIN'S NEXTAUTH_SECRET! (Copy exact same string)
NEXTAUTH_SECRET=<same-64-char-secret-from-admin-.env>
JWT_SECRET=<same-jwt-secret-from-admin-.env>

NEXTAUTH_SESSION_MAX_AGE=2592000
NEXTAUTH_SESSION_UPDATE_AGE=86400
SECURE_COOKIES=true   # MUST be true - GoDaddy uses HTTPS!

# --- CREDENTIALS ---
ADMIN_EMAIL=admin@geelyethiopia.com
ADMIN_PASSWORD=<same-admin-password-as-on-LAN>

# --- ZOHO CRM ---
ZOHO_CRM_CLIENT_ID=<from-kerchanshe-it>
ZOHO_CRM_CLIENT_SECRET=<from-kerchanshe-it>
ZOHO_CRM_REFRESH_TOKEN=<from-kerchanshe-it>
ZOHO_CRM_API_URL=https://www.zohoapis.com/crm/v3/Leads
ZOHO_CRM_ACCESS_TOKEN=<optional>

# --- WHATSAPP ---
NEXT_PUBLIC_WHATSAPP_PHONE=+251911234567
WHATSAPP_TOKEN=

# --- GOOGLE ---
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_GTM_ID=

# --- SOCIAL ---
NEXT_PUBLIC_FACEBOOK_URL=https://facebook.com/geelyethiopia
NEXT_PUBLIC_INSTAGRAM_URL=https://instagram.com/geelyethiopia
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/geelyethiopia
NEXT_PUBLIC_TIKTOK_URL=https://tiktok.com/@geelyethiopia
NEXT_PUBLIC_YOUTUBE_URL=https://youtube.com/@geelyethiopia
```

### 2.4 GoDaddy cPanel: Create Node.js App

1. GoDaddy cPanel → **Setup Node.js App**
2. Click **Create Application**
3. Fill in:
   - **Node.js version:** 20.x (or 18.x minimum)
   - **Application mode:** Production
   - **Application root:** `geelyweb` (or whatever folder you uploaded to)
   - **Application URL:** `geelyethiopia.com` (your domain)
   - **Application startup file:** Leave blank — we'll use PM2 or cPanel auto-run
4. Click **Create**
5. On the next page, note the "Enter to the virtual environment" command (copy it)

### 2.5 Run Install + Build in the Node.js Virtual Env

In cPanel → **Terminal** OR SSH into GoDaddy account:

```bash
# Paste the virtualenv activate command from step 2.5 (something like):
source /home/username/nodevenv/geelyweb/20/bin/activate && cd /home/username/geelyweb

# 1. Install dependencies (production only)
npm install --production

# 2. Generate Prisma client (it will use the prisma schema from admin)
# The web build command references: --schema=../admin/prisma/schema.prisma
# Since admin is NOT on GoDaddy, we need a copy of schema.prisma!
# FIRST: copy admin/prisma/schema.prisma to web/prisma/schema.prisma ON YOUR DEV MACHINE then re-upload, OR:
mkdir -p prisma
# Upload schema.prisma file to web/prisma/schema.prisma
npx prisma generate --schema=./prisma/schema.prisma

# 3. Build the Next.js app
npm run build
# (This is the critical step - takes 3-8 minutes)
```

### 2.6 Start the Web App (GoDaddy cPanel)

**If cPanel Node.js selector** — click the app → **RESTART** button.

**If using PM2 on GoDaddy:**
```bash
npm install -g pm2
pm2 start "npm run start" --name geely-web --time
pm2 save
```

The app should be available on port 3002. cPanel's Passenger/Node.js selector proxies it to port 80/443 automatically.

### 2.7 Configure Domain + SSL on GoDaddy

1. **Domain:** If not yet, point your domain to GoDaddy nameservers (from GoDaddy Domain Manager)
2. **SSL Certificate:**
   - GoDaddy cPanel → **SSL/TLS** → Install AutoSSL (free cPanel/Sectigo SSL)
   - Or buy GoDaddy EV SSL for brand trust
3. **HTTPS redirect:** Add to top of `web/.htaccess` (create in web/public/ if not exists):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteCond %{HTTPS} off
     RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   </IfModule>
   ```

### 2.8 Test Public Site

Open in browser:
```
https://geelyethiopia.com
```
Tests to run:
1. Homepage loads → OK
2. Models page loads → DB connection working
3. Dealers page loads → DB + GIS working
4. Submit Test Drive form → Submits, appears in Zoho CRM
5. Submit Quote form → Same
6. Language switch (EN/AM in top-right) → Both work
7. /sitemap.xml → Dynamic sitemap loads
8. /robots.txt → Correct rules

---

## Part 3 — Connectivity Check (Critical)

### Test DB connection from GoDaddy → 192.168.1.20

After web is deployed on GoDaddy, check if PostgreSQL port 5432 is reachable:

```bash
# SSH to GoDaddy, run:
nc -zv PUBLIC_IP_OF_192.168.1.20 5432
# Should say: "Connection to ... 5432 port [tcp/postgresql] succeeded!"
```

**If it fails** — the cause is one of:
1. ❌ Windows Firewall on 192.168.1.20 is blocking 5432 → Add firewall rule
2. ❌ PostgreSQL `listen_addresses` not `'*'` → Edit postgresql.conf, restart service
3. ❌ `pg_hba.conf` missing GoDaddy's public IP → Add it
4. ❌ Router port forwarding not set → Forward 5432 → 192.168.1.20:5432
5. ❌ ISP is blocking port 5432 → Use a VPN tunnel or move DB to Supabase/Neon managed Postgres

### Test Admin API connectivity (GoDaddy → Admin 3001)

From browser: visit `https://geelyethiopia.com/api/public/vehicles`
It should return JSON list of vehicles (empty array if none seeded, not an error).

If it errors with "fetch failed" — Admin port 3001 is not reachable (same checklist above but port **3001**).

---

## Part 4 — Cron Job: Lead Retry Queue

Both apps need this cron running (it retries failed Zoho leads).

### 4.1 On Admin Server 192.168.1.20 (Primary — runs retry)

**Windows Task Scheduler:**

1. Win+R → `taskschd.msc`
2. Create Basic Task → Name: "Geely Lead Retry Queue"
3. Trigger: **Every 30 minutes**
4. Action: **Start a program**
5. Program/script: `powershell.exe`
6. Add arguments:
   ```powershell
   -Command "Invoke-RestMethod -Uri 'http://192.168.1.20:3001/api/crm/retry-queue' -Method Post -Headers @{'X-Cron-Secret'='<YOUR_CRON_SECRET_FROM_ENV>'}"
   ```
7. Finish. **Right-click task → Run** to test once.

### 4.2 On GoDaddy Web (Secondary — can also be configured)

cPanel → **Cron Jobs** → Add:
```
Minute: */30
Hour: *
Day: *
Month: *
Weekday: *
Command:
curl -X POST https://geelyethiopia.com/api/crm/retry-queue -H "X-Cron-Secret: <YOUR_CRON_SECRET>" > /dev/null 2>&1
```

---

## Part 5 — Daily Backups (192.168.1.20)

Since the PostgreSQL DB is on the LAN server, BACKUP DAILY.

Create a PowerShell script `D:\Backup\backup-db.ps1`:

```powershell
# Backup Geely DB to timestamped .sql file
$timestamp = Get-Date -Format "yyyyMMdd_HHmm"
$backupFile = "D:\Backup\geely_ethiopia_$timestamp.sql"
$pgDump = "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
$env:PGPASSWORD = "Str0ngP@ssw0rd!Ch4ngeM3"

& $pgDump -U geely_dbuser -h 127.0.0.1 -d geely_ethiopia -F p -f $backupFile

# Upload to network share / OneDrive / AWS S3 (optional)
# Copy-Item $backupFile "\\kerchanshe-file-server\backups\Geely\"

# Delete backups older than 30 days
Get-ChildItem "D:\Backup\" -Filter "geely_ethiopia_*.sql" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item -Force
```

Task Scheduler → Run **daily at 2 AM**

---

## Part 6 — Go-Live Smoke Test Checklist

- [ ] `https://geelyethiopia.com` loads (not HTTPS error)
- [ ] Click every main nav link → All pages load
- [ ] Language toggle EN → AM → All pages switch
- [ ] `/api/public/vehicles` returns JSON → DB connection OK
- [ ] Submit Test Drive → Success message, lead in Zoho
- [ ] Submit Quote → Success message, lead in Zoho
- [ ] Submit Service Booking → OK
- [ ] Submit Contact → OK
- [ ] Dealer map pins display (if Google Maps API key set)
- [ ] Admin `http://192.168.1.20:3001/admin/login` → Login works
- [ ] Admin → Vehicles → Can create/edit/delete
- [ ] Admin → News → Create an article → Shows on /news of web site
- [ ] Admin → Hero Content → Change title → Reflected on homepage
- [ ] `https://geelyethiopia.com/sitemap.xml` → Valid dynamic sitemap
- [ ] `https://geelyethiopia.com/robots.txt` → Correct rules
- [ ] WhatsApp widget on mobile → Click opens WhatsApp
- [ ] Lighthouse audit → Score >80 on mobile

---

## Appendix A — GoDaddy VPS Instead of cPanel (Alternative)

If using a GoDaddy Linux VPS (Ubuntu 22.04), steps are simpler:

```bash
# On GoDaddy VPS, SSH in as root:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx postgresql-client

# Upload web code to /var/www/geely-web/
cd /var/www/geely-web
npm install --production
# (Copy admin/prisma/schema.prisma to ./prisma/schema.prisma)
npx prisma generate --schema=./prisma/schema.prisma
npm run build

# Install PM2
npm install -g pm2
pm2 startup systemd
pm2 start "npm run start" --name geely-web --time
pm2 save

# Configure Nginx reverse proxy (port 3002 → 80/443)
nano /etc/nginx/sites-available/geelyethiopia.com
# (Use standard Next.js nginx config - find template online)

# SSL via Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d geelyethiopia.com -d www.geelyethiopia.com
```

---

## Support Contacts

- **Admin (192.168.1.20) down:** Kerchanshe IT / Server Admin
- **GoDaddy site down:** GoDaddy Support 24/7
- **Zoho CRM not receiving leads:** Kerchanshe CRM Admin for token refresh
- **DB issues:** Kerchanshe DBA or PostgreSQL restart

---

**Document owner:** Implementation Team  
**Last updated:** August 12, 2026  
**Status:** Ready to execute
