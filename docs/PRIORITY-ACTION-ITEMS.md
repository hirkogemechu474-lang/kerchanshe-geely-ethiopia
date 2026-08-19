# Geely Ethiopia — priority action items

Updated: 2026-08-14

This is the short execution list. The complete proposal mapping is in [PROPOSAL-IMPLEMENTATION-STATUS.md](./PROPOSAL-IMPLEMENTATION-STATUS.md).

## Current readiness

**Development:** Complete for the current repository scope.

**Type safety:** Admin and web checks pass.

**Local database:** Reachable and Prisma schema is up to date.

**Production launch:** Not ready yet. External credentials, approved content, hosting, payment/CRM verification, and UAT remain.

## P0 — launch blockers

### 1. Approve business content and brand assets

- Final Geely and Kerchanshe logos and brand guidelines.
- Approved model line-up, trims, prices, specifications, images, videos, brochures, colors, packages, and accessories.
- Exact dealer addresses, coordinates, contacts, hours, services, and galleries.
- Approved financing rates, fees, requirements, support contacts, legal copy, and warranty terms.
- Final English and Amharic copy.

### 2. Provision external services and secrets

- Zoho CRM client credentials and valid refresh token.
- SMTP/Zoho Mail credentials and approved notification recipients.
- Payment provider sandbox/production credentials and callback URLs.
- Google Maps, Analytics, Search Console, and Bing Webmaster access.
- Production database, storage, hosting, CDN, and DNS credentials.

Never commit these values to the repository. Rotate any credentials that have been exposed during development.

### 3. Complete payment and CRM verification

- Submit quote, test-drive, contact, service, and financing leads.
- Confirm local database records and Zoho records are both created.
- Verify duplicate handling, dealer routing, UTM/referrer capture, consent, and retry behavior.
- Test payment success, failure, cancellation, retry, callback, reconciliation, and refund behavior.

### 4. Provision production operations

- Confirm domain and DNS.
- Deploy web and admin with HTTPS and secure cookies.
- Configure production CORS, database migrations, backups, storage, WAF, monitoring, and alerts.
- Confirm rollback and recovery procedures.

## P1 — sign-off work

### 5. Complete content entry in admin

- Load and approve all vehicles, offers, news, dealers, banks, financing programs, FAQs, services, electric pages, homepage content, and legal pages.
- Verify all content is editable by the intended Admin, Editor, Marketing, and Viewer roles.
- Train the marketing team and deliver a content playbook.

### 6. Run full QA/UAT

- Test desktop, tablet, and 360–428px mobile layouts.
- Test Chrome, Edge, Safari, and Firefox.
- Test clean-browser hydration and language switching.
- Test every public form and admin status workflow.
- Test map, phone, WhatsApp, payment, brochure, and download actions.
- Complete keyboard, screen-reader, contrast, focus, and alt-text review.

### 7. Measure performance and SEO

- Run Lighthouse and PageSpeed on homepage, model page, configure, quote, financing, dealer, and news pages.
- Verify LCP under 2.5 seconds, INP under 200ms, and CLS under 0.1 on target mobile profiles.
- Verify robots, canonical URLs, sitemap, redirects, schema, breadcrumbs, and hreflang.
- Connect Search Console/Bing and record a baseline report.

## P2 — post-launch improvements

- Dedicated financing loan-application entity and workflow, if required by partner banks.
- Two-way Zoho status webhooks and automated SMS/email events.
- CAPTCHA/hCaptcha if spam appears after monitoring.
- Lighthouse CI and performance budgets.
- Complete WebGL/360 assets for every priority model.
- Brochure PDF generation from approved structured content.
- Full locale routing such as `/en/...` and `/am/...` if required.
- Staging/preview workflow and formal admin audit history.
- AI-assisted FAQ/chat integration beyond the current WhatsApp/contact foundation.

## Verified completed code foundations

- Public model, offer, configure, configurator, compare, quote, test-drive, contact, dealer, financing, service, parts, news, FAQ, legal, and electric routes.
- Admin content, vehicle, dealer, financing, purchase, quotation, service, electric, news, offer, FAQ, upload, user, settings, and dashboard areas.
- Dynamic sitemap and public data APIs.
- API-backed vehicle configuration options.
- Hydration-safe persisted language initialization.
- Local PostgreSQL and Prisma schema alignment.
- Admin TypeScript validation: PASS.
- Web TypeScript validation: PASS.

## Known local-machine issues

- Prisma client regeneration can fail on Windows while an active Node/Next process locks the query engine file.
- Local seed execution previously stopped with Node `uv_os_get_passwd` / `ENOMEM`; free memory and stop unnecessary Node processes before retrying.
