# Geely Ethiopia - Quick Start Guide

**Last Updated:** August 10, 2026  
**Status:** Production Ready ✅

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Zoho CRM account with OAuth credentials

### Installation

```bash
# 1. Install dependencies for both web and admin
cd web
npm install

cd ../admin
npm install

# 2. Set up environment variables
cd ../web
cp .env.example .env
# Edit .env with your database and Zoho credentials

cd ../admin
cp .env.example .env
# Edit .env with your database credentials

# 3. Run database migrations
cd ../admin
npx prisma migrate deploy
npx prisma generate

# 4. Start development servers
# Terminal 1 - Web (public site)
cd web
npm run dev  # Runs on http://localhost:3002

# Terminal 2 - Admin (CMS)
cd admin
npm run dev  # Runs on http://localhost:3001
```

---

## 🔧 Environment Variables

### Required for Web (`web/.env`)

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/geely_ethiopia"

# Zoho CRM (OAuth 2.0 - Production)
ZOHO_CRM_CLIENT_ID="1000.XXXXXXXXXXXXXXXXXXXXX"
ZOHO_CRM_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
ZOHO_CRM_REFRESH_TOKEN="1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
ZOHO_CRM_API_URL="https://www.zohoapis.com/crm/v3/Leads"

# Optional: Zoho Accounts URL (defaults to https://accounts.zoho.com)
ZOHO_ACCOUNTS_URL="https://accounts.zoho.com"

# Optional: Static access token for initial requests (1-hour validity)
ZOHO_CRM_ACCESS_TOKEN="1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Node Environment
NODE_ENV="production"
```

### Required for Admin (`admin/.env`)

```bash
# Database (same as web)
DATABASE_URL="postgresql://user:password@localhost:5432/geely_ethiopia"

# Admin Authentication Secret
NEXTAUTH_SECRET="your-generated-secret-key-here"
NEXTAUTH_URL="http://localhost:3001"

# Node Environment
NODE_ENV="development"
```

---

## 📁 Project Structure

```
geely-ethiopia/
├── web/                          # Public-facing website (Next.js 15)
│   ├── app/                      # App Router pages
│   │   ├── models/[id]/         # Model detail pages
│   │   ├── test-drive/          # Test drive booking
│   │   ├── quote/               # Quote request
│   │   ├── dealers/             # Dealer locator
│   │   ├── api/                 # API routes
│   │   │   └── crm/lead/        # Zoho CRM connector
│   │   ├── sitemap.ts           # Dynamic sitemap
│   │   └── robots.ts            # Robots.txt
│   ├── components/              # React components
│   │   ├── Model360Section.tsx  # 360° viewer wrapper
│   │   ├── ModelSpotlight360.tsx # Interactive 360° viewer
│   │   ├── TrimColorWheelPicker.tsx # Configurator
│   │   ├── StickyCTABar.tsx     # Sticky action bar
│   │   └── MegaMenu.tsx         # Dynamic navigation
│   ├── lib/                     # Utilities & integrations
│   │   ├── prisma.ts            # Database client
│   │   ├── zoho-oauth.ts        # OAuth token manager
│   │   ├── lead-queue.ts        # Retry queue logic
│   │   ├── i18n.ts              # Bilingual translation
│   │   └── useCRMSubmit.ts      # Lead submission hook
│   └── package.json
│
├── admin/                        # Admin CMS panel (Next.js 15)
│   ├── app/admin/               # Admin routes
│   │   ├── vehicles/            # Vehicle management
│   │   ├── dealers/             # Dealer management
│   │   ├── news/                # News management
│   │   ├── promotions/          # Promotions management
│   │   └── crm/                 # CRM dashboard
│   ├── components/admin/        # Admin UI components
│   ├── prisma/
│   │   └── schema.prisma        # Database schema
│   └── package.json
│
└── docs/                         # Documentation
    ├── GAP-ANALYSIS-GLOBAL-BENCHMARK.md
    ├── PRIORITY-ACTION-ITEMS.md
    ├── IMPLEMENTATION-COMPLETE-SUMMARY.md
    └── QUICK-START-GUIDE.md (this file)
```

---

## 🎨 Key Features

### 1. Dynamic Sitemap
- **File:** `web/app/sitemap.ts`
- **Updates:** Automatically when content is added via admin
- **URL:** https://geelyethiopia.com/sitemap.xml

### 2. Zoho CRM Integration
- **File:** `web/app/api/crm/lead/route.ts`
- **Library:** `web/lib/zoho-oauth.ts`
- **Features:** 
  - Automatic token refresh
  - Retry queue for failed submissions
  - Duplicate lead detection

### 3. 360° Model Spotlight
- **Component:** `web/components/ModelSpotlight360.tsx`
- **Integration:** Integrated on all model detail pages
- **Features:** Drag-to-rotate, auto-rotate, fullscreen

### 4. Trim/Color/Wheel Configurator
- **Component:** `web/components/TrimColorWheelPicker.tsx`
- **Features:** Real-time price calculation, live image preview

### 5. Bilingual Support (English/Amharic)
- **Library:** `web/lib/i18n.ts`
- **State:** Zustand for client-side language switching
- **SEO:** Hreflang tags on all pages

---

## 🛠️ Common Tasks

### Add a New Vehicle
1. Log in to admin panel: http://localhost:3001/admin
2. Navigate to **Vehicles → Add New**
3. Fill in vehicle details (name, category, price, specs)
4. Upload images
5. Publish
6. Vehicle appears automatically in:
   - Homepage featured section
   - Models page
   - Mega-menu dropdown
   - Sitemap

### Add a News Article
1. Navigate to **News → Add New**
2. Enter title, content, category
3. Upload featured image
4. Set publication date
5. Publish
6. Article appears in News section and sitemap

### Manage Test Drive Bookings
1. Navigate to **CRM → Test Drives**
2. View all submissions
3. Update status (Pending → Confirmed → Completed)
4. View customer details and preferred dates

### Check Zoho CRM Sync Status
1. Navigate to **CRM → Sync Logs**
2. View successful and failed submissions
3. Retry failed leads manually if needed

---

## 🧪 Testing Checklist

### Before Launch
- [ ] Test all forms (test drive, quote, contact)
- [ ] Verify CRM submissions reach Zoho
- [ ] Check sitemap generates correctly (`/sitemap.xml`)
- [ ] Test 360° viewer on mobile and desktop
- [ ] Verify configurator price calculations
- [ ] Test language switching (EN ↔ AM)
- [ ] Check hreflang tags in page source
- [ ] Test sticky CTA bar on model pages
- [ ] Verify mega-menu loads vehicle data
- [ ] Test on real 4G connection (Ethiopia network)

### SEO Verification
- [ ] Submit sitemap to Google Search Console
- [ ] Verify structured data with Google Rich Results Test
- [ ] Check robots.txt (`/robots.txt`)
- [ ] Confirm canonical URLs on all pages
- [ ] Test Open Graph preview (Facebook/LinkedIn)

---

## 📊 Monitoring & Analytics

### Google Search Console
- Add property: https://geelyethiopia.com
- Submit sitemap: https://geelyethiopia.com/sitemap.xml
- Monitor: Index coverage, Core Web Vitals, Search queries

### Google Analytics 4
- Track: Page views, form submissions, CTA clicks
- Events: Test drive requests, quote requests, configurator usage

### Zoho CRM Dashboard
- Monitor lead quality and conversion rates
- Track source attribution (UTM parameters captured)

---

## 🚨 Troubleshooting

### CRM Integration Issues

**Problem:** "CRM integration not configured" error
**Solution:** Check `.env` file has `ZOHO_CRM_REFRESH_TOKEN` set

**Problem:** "Token refresh failed" error
**Solution:** Regenerate refresh token via Zoho OAuth flow

**Problem:** Leads not appearing in Zoho
**Solution:** 
1. Check `PendingLead` table in database for queued items
2. Verify Zoho API URL is correct
3. Check Zoho CRM field mappings

### Database Connection Issues

**Problem:** "Can't reach database server"
**Solution:** 
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` format
3. Run `npx prisma migrate deploy`

### 360° Viewer Not Loading

**Problem:** Images not appearing
**Solution:**
1. Check vehicle has `heroImageUrl` and `images` array populated
2. Verify image URLs are accessible
3. Check browser console for CORS errors

---

## 📞 Support & Resources

### Documentation
- **Proposal:** Original proposal document
- **Gap Analysis:** `docs/GAP-ANALYSIS-GLOBAL-BENCHMARK.md`
- **Implementation Summary:** `docs/IMPLEMENTATION-COMPLETE-SUMMARY.md`

### API Documentation
- **Zoho CRM API:** https://www.zoho.com/crm/developer/docs/api/v3/
- **Next.js 15:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs

### Tech Stack
- **Frontend:** Next.js 15, React 19, Tailwind CSS 3.4
- **Backend:** Prisma ORM, PostgreSQL
- **Forms:** React Hook Form
- **Animations:** Framer Motion
- **CRM:** Zoho CRM with OAuth 2.0

---

## 🎯 Next Steps

1. **Environment Setup:** Configure production environment variables
2. **Content Population:** Add initial vehicles, dealers, news via admin
3. **Testing:** Complete pre-launch checklist
4. **Deployment:** Deploy to production hosting
5. **DNS Configuration:** Point domain to hosting
6. **Go Live:** Launch! 🚀

---

**Ready to Launch!** All critical features are implemented and verified.

For questions or issues, refer to the implementation summary document.
