# Admin IA / Dashboard / User Management Backlog

Tracks the sidebar/dashboard/user-management overhaul against what actually shipped, mirroring
`docs/SWMS-INTEGRATION-BACKLOG.md`'s discipline so nothing is silently dropped.

## Delivered

| Ask | What shipped | Where |
|---|---|---|
| Sidebar = exactly Content Management + SWMS | `navSections` restructured: `Dashboard` and `User Management` pinned above the accordion, everything else collapsed into the two groups. Content Management subgroups later refined per the user's own proposed taxonomy: **Website** (All Pages, Homepage, Header & Navigation, Website Settings), **Vehicles** (All Vehicles, Categories, Vehicle Settings), **Electric**, **Services**, **Marketing**, **Dealers & Parts**, **Sales & Financing**, **Company**, **Legal** — each populated only with pages that actually exist today (see "Aspirational taxonomy" below for the rest of the proposal). SWMS subgroups: Sales/Service-Workshop/Parts & Inventory | `admin/components/admin/AdminLayout.tsx` |
| One dashboard, clearly shows everything | Existing `/admin/analytics` extended in place (same URL) with Needs Attention, Business Overview, Workshop Operations, Warranty Claims by status, Quick Actions — each section permission-gated server-side | `admin/app/api/admin/analytics/route.ts`, `admin/app/admin/analytics/page.tsx` |
| One user management, clear about permissions | Roles & Permissions matrix viewer added (read-only, driven by the existing `ROLE_PERMISSIONS` — no per-user override model introduced, see decision below), linked from the Users list; live role-permission preview added to the create/edit user forms | `admin/app/admin/users/roles/page.tsx`, `admin/components/admin/users/RolePermissionPreview.tsx`, `admin/lib/auth/permissionGroups.ts` |
| Content edited in admin shows on the website | Audited all ~28 CMS content types against `web/app/api/public/**` + the page/component that renders each — ~25 were already fully wired via the shared Postgres database (no sync step, per ADR-002). Fixed real gaps found: Business Settings hours were hardcoded in the footer instead of reading the admin value; `/warranty` page showed three fabricated tiers (5/7/10yr) instead of the admin Warranty tab's actual values; vehicle detail page's phone/WhatsApp was a hardcoded placeholder instead of Contact Information | `web/components/Footer.tsx`, `web/app/warranty/page.tsx`, `web/app/models/[id]/page.tsx`, `web/app/api/public/vehicle-settings/route.ts` |
| Vehicle Settings: removed redundant Categories tab | It duplicated the real, already-wired `VehicleCategory` model + `/admin/categories` with a never-read JSON array | `admin/app/admin/vehicles/settings/page.tsx`, `admin/app/api/settings/vehicle-settings/route.ts` |
| Admin shell: dark mode, collapsible sidebar, Bootstrap breakpoints, seeded demo users | See `project_admin_shell_and_vehicle_settings` memory for detail | `admin/components/admin/ThemeProvider.tsx`, `admin/tailwind.config.ts`, `admin/prisma/seed-users.ts` |
| Added 3 new vehicle categories | `Geometry EV EX`, `Luxury EV`, `Starwish EV` — created via `VehicleCategory` (the real, already-wired model), live on the site's category filters/mega-menu immediately | added directly via Prisma, editable at `/admin/categories` |
| User Management: enforce edit/add/update/delete permissions | `/api/admin/users` and `/api/admin/users/[id]` previously only checked `getServerSession` (any authenticated session, including public CUSTOMER/DEALER portal logins) — no admin-role check and no `canManageUsers` check at all. Any logged-in user could call these routes directly to create, edit, or delete admin accounts regardless of role/permissions. Fixed to use `requireAdminApiSession()` + `canManageUsers` for create/update/delete and `canViewUsers`/`canManageUsers` for read, matching ADR-001. The Add/Edit/Delete UI itself already existed (`/admin/users/new`, `/admin/users/[id]`) — this was purely a missing server-side enforcement gap | `admin/app/api/admin/users/route.ts`, `admin/app/api/admin/users/[id]/route.ts` |

## Scope decision: permissions stay role-based

No per-user permission override was added — the `User` Prisma model has no column for it, and the
BRD's own §17.2 model is role-based. "Clearly do all things with permission" was delivered by
making the existing fixed `ROLE_PERMISSIONS` model visible and understandable (the matrix viewer +
inline preview), not by building a new authorization model. Revisit only if a real business need
for user-specific exceptions comes up.

## Explicitly deferred (not built yet)

| Gap | What's missing | Why deferred |
|---|---|---|
| `MegaMenuSection`/`MenuCategory`/`MenuItem` | Fully orphaned: admin API exists (`admin/app/api/admin/mega-menu/**`) but no admin UI page was ever built, and the live site's real navigation renders from the separate `ServiceSection`/`ElectricSection` models instead | Looks like an abandoned earlier attempt superseded before a UI existed; recommend removing the dead models/API in a dedicated pass rather than building UI for a system nothing uses, or bolting cleanup onto this already-large change |
| Features/Specifications tabs in Vehicle Settings | Still pure dead data entry (global pick-lists nothing reads, not even the admin's own vehicle edit form) | A real fix wires them as autocomplete suggestions in `VehicleForm`; not done in this pass |
| `Financing Settings` public route unused | `/api/public/financing-settings` (`getFinancingSettings()`) defined, never called by any page | Needs a decision on whether these are meant to be publicly displayed or are internal-only config |
| Orphaned duplicate route `/api/public/social-media` | Footer actually uses `/api/settings/social-media`; the `/api/public/social-media` route has zero consumers | Low-risk dead-code cleanup, not a content gap (social links already display correctly via the other route) |

## Aspirational taxonomy (from the user's own proposed Content Management tree — not built)

The user proposed a much larger 9-group taxonomy with sub-items that don't have any backing
admin feature today. The sidebar was reorganized to match the group *names* using only what's
real (see "Delivered" above); the items below were intentionally **left out of the nav** rather
than linked to pages that don't exist. Listed here so nothing from that proposal is silently
dropped — each needs its own real Prisma model + admin UI + public route before it can be a nav
item, not just a rename:

- **Website**: Footer editor (footer's 4 link columns + legal links are still hardcoded arrays in
  `web/components/Footer.tsx`), a dedicated SEO settings page, Publishing workflow (Drafts/
  Published/Scheduled/Revision History — no draft/publish state exists on any content model today,
  everything is immediately live on save)
- **Vehicles**: Models & Variants / Specifications / Features / Colors / Gallery & Videos /
  Vehicle Sections as *distinct* admin screens — today these are either folded into the single
  vehicle edit form (`VehicleForm`) as a freeform `specifications` JSON field, or (for
  `VehicleColor`/`VehicleAccessory`/`VehiclePackage`/`VehicleInterior`) have real Prisma models
  with zero admin UI, only consumed by the public configurator
- **Electric**: EV Technology, Charging (as distinct from the existing `electric/pages` charging-map
  pageType), EV Settings. EV Benefits partially exists already (`admin/app/admin/electric/benefits/*`)
- **Services**: Service Categories, Maintenance, Service Packages, Service FAQs (as distinct from
  the general FAQ page) — Services Menu/Pages already exist and cover most of this today
- **Marketing**: Campaigns (as a distinct concept from Promotions)
- **Sales & Financing**: Payment Banks and Purchase Settings as screens distinct from the
  existing combined Financing page
- **Company**: Careers page
- **Legal**: Terms & Conditions and Privacy Policy as separately editable pages (currently part of
  the combined Policies & Legal settings)

Also delivered outside this taxonomy: 3 new `VehicleCategory` rows (Geometry EV EX, Luxury EV,
Starwish EV) added directly via the existing, already-wired category system — see Delivered above.
