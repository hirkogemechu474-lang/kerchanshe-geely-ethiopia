# Production Deployment Checklist
## Geely Ethiopia Website

---

## 🔐 Critical Credentials Needed

### 1. Zoho CRM OAuth Credentials
- [ ] **Client ID** - Get from https://api-console.zoho.com/
- [ ] **Client Secret** - Get from https://api-console.zoho.com/
- [ ] **Refresh Token** - Generate using OAuth flow (see ZOHO-CRM-SETUP-GUIDE.md)
- [ ] Update `web/.env` with Zoho credentials
- [ ] Update root `.env` with Zoho credentials

### 2. Database Credentials
- [ ] **PostgreSQL Host** - Production database server
- [ ] **Database Name** - `geely_ethiopia`
- [ ] **Username & Password** - Production database credentials
- [ ] Update `DATABASE_URL` in all `.env` files
- [ ] Enable SSL: Add `?sslmode=require` to connection string

### 3. Email (SMTP) Credentials
- [ ] Already configured: `systems@kerchanshe.com`
- [ ] SMTP password already set
- [ ] Test email sending in production

### 4. Google Services
- [ ] **Google Maps API Key** - Get from https://console.cloud.google.com/
- [ ] **Google Analytics ID** - Get from https://analytics.google.com/
- [ ] **Google Tag Manager ID** (optional) - Get from https://tagmanager.google.com/

### 5. Security Secrets
- [ ] Generate strong `NEXTAUTH_SECRET` (64+ characters)
- [ ] Generate strong `JWT_SECRET` (64+ characters)
- [ ] Generate strong `CRON_SECRET` (32+ characters)
- [ ] Update admin password from default

---

## 📂 Environment Files Setup

### ✅ Completed Files:
- [x] `admin/.env` - Admin panel configuration
- [x] `web/.env` - Web application configuration
- [x] Root `.env` - Legacy/compatibility configuration

### 🔧 Variables to Update:

#### In `web/.env`:
```env
# Update these with real values:
ZOHO_CRM_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXX
ZOHO_CRM_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_CRM_REFRESH_TOKEN=1000.xxxxxx.xxxxxx
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXX
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
DATABASE_URL="postgresql://user:pass@host:5432/geely_ethiopia?sslmode=require"
NEXTAUTH_SECRET=<generate-64-char-random-string>
JWT_SECRET=<generate-64-char-random-string>
```

#### In `admin/.env`:
```env
# Update these with real values:
DATABASE_URL="postgresql://user:pass@host:5432/geely_ethiopia?sslmode=require"
NEXTAUTH_SECRET=<generate-64-char-random-string>
JWT_SECRET=<generate-64-char-random-string>
ADMIN_PASSWORD=<strong-secure-password>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXX
```

---

## 🚀 Pre-Deployment Tasks

### Database Setup
- [ ] Create production PostgreSQL database
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Seed initial data if needed: `npx prisma db seed`
- [ ] Test database connection from application

### Application Build
- [ ] Run `npm install` in root directory
- [ ] Run `npm install` in `web/` directory
- [ ] Run `npm install` in `admin/` directory
- [ ] Build web app: `cd web && npm run build`
- [ ] Build admin app: `cd admin && npm run build`
- [ ] Test builds locally before deploying

### Security Hardening
- [ ] Set `NODE_ENV=production` in all `.env` files
- [ ] Enable HTTPS in production (SSL certificates)
- [ ] Set `SECURE_COOKIES=true` in `.env` files
- [ ] Update `CORS_ORIGINS` to production domains only
- [ ] Review and remove any development/debug flags

### Testing
- [ ] Test all forms (test drive, quotation, contact)
- [ ] Verify leads are created in Zoho CRM
- [ ] Test lead retry queue functionality
- [ ] Check 360° vehicle viewer works
- [ ] Verify configurator (trim/color/wheel) works
- [ ] Test mobile responsiveness
- [ ] Check sitemap generation: `/sitemap.xml`
- [ ] Verify hreflang tags in page source
- [ ] Test email notifications
- [ ] Check Google Analytics tracking

---

## 🌐 DNS & Hosting

### Domain Configuration
- [ ] Point `geelyethiopia.com` to web server IP
- [ ] Point `admin.geelyethiopia.com` to admin server IP (if separate)
- [ ] Configure SSL certificates (Let's Encrypt recommended)
- [ ] Test HTTPS redirects

### Server Setup
- [ ] Install Node.js 18+ on production server
- [ ] Install PostgreSQL or use managed database
- [ ] Configure firewall rules (ports 80, 443, 5432)
- [ ] Set up process manager (PM2 recommended)
- [ ] Configure nginx/Apache as reverse proxy

---

## 📊 Monitoring & Logging

### Optional but Recommended
- [ ] Set up Sentry for error tracking
- [ ] Configure database backups (daily recommended)
- [ ] Set up uptime monitoring (UptimeRobot, Pingdom)
- [ ] Enable application logging
- [ ] Set up Redis for caching (optional but recommended)

---

## 🔄 Cron Jobs

### Lead Retry Queue
Set up a cron job to retry failed Zoho submissions:

```bash
# Run every 30 minutes
*/30 * * * * curl -X POST https://geelyethiopia.com/api/crm/retry-queue -H "X-Cron-Secret: YOUR_CRON_SECRET"
```

Or use Windows Task Scheduler:
```powershell
# PowerShell script for Windows
Invoke-RestMethod -Uri "https://geelyethiopia.com/api/crm/retry-queue" `
  -Method Post `
  -Headers @{"X-Cron-Secret"="YOUR_CRON_SECRET"}
```

---

## 📱 Post-Deployment Verification

### Functional Tests
- [ ] Visit https://geelyethiopia.com
- [ ] Browse vehicle models
- [ ] Submit test drive request
- [ ] Check lead in Zoho CRM
- [ ] Request quotation
- [ ] Test service booking
- [ ] Submit contact form
- [ ] Check email notifications received
- [ ] Test admin login at /admin
- [ ] Create/edit content in admin panel

### Performance Tests
- [ ] Run Lighthouse audit (target: 90+ score)
- [ ] Check page load times (<3 seconds)
- [ ] Test on mobile devices
- [ ] Verify images are optimized
- [ ] Check CDN/caching working

### SEO Verification
- [ ] Submit sitemap to Google Search Console
- [ ] Verify meta tags on all pages
- [ ] Check hreflang implementation
- [ ] Test social media sharing (Open Graph)
- [ ] Verify robots.txt configuration

---

## 🆘 Emergency Contacts

**Technical Support:**
- Developer: [Your Contact]
- Zoho Support: https://help.zoho.com/portal/en/home
- Hosting Provider: [Your Hosting Support]

**Account Access:**
- Zoho CRM: https://crm.zoho.com/
- Google Cloud Console: https://console.cloud.google.com/
- Database Admin: [Your DB Admin Panel]

---

## 📝 Quick Command Reference

### Generate Secure Secrets
```powershell
# PowerShell - Generate 64-character random string
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

### Start Production Servers
```bash
# Web application (port 3000)
cd web
npm run build
npm run start

# Admin panel (port 3001)
cd admin
npm run build
npm run start
```

### Database Commands
```bash
# Run migrations
npx prisma migrate deploy

# Check database status
npx prisma migrate status

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

---

## ✅ Final Checklist

Before going live:
- [ ] All credentials configured and tested
- [ ] Database migrated and seeded
- [ ] Applications built successfully
- [ ] HTTPS/SSL enabled and tested
- [ ] Email sending tested
- [ ] Zoho CRM integration tested end-to-end
- [ ] All forms tested in production
- [ ] Analytics tracking verified
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Cron jobs scheduled
- [ ] Team trained on admin panel
- [ ] Emergency procedures documented

---

**Deployment Date:** __________  
**Deployed By:** __________  
**Version:** 1.0  
**Project:** Geely Ethiopia Website

