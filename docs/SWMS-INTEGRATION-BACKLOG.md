# SWMS Integration Backlog

Tracks what the "Automotive Showroom & Workshop Management System" BRD/SDD asked for against what
Phase 1 actually delivered, so nothing from the proposal is silently dropped. Phase 1 scope was
chosen deliberately (see `docs/adr` or the implementing session's plan) as: **core job-card
lifecycle + bay/technician scheduling** — the BRD's #1 and #2 stated business problems.

## Delivered in Phase 1

| BRD reference | What shipped | Where |
|---|---|---|
| UC-04 Create Job Card, FR-201/202 | Write-up form, `JobCard` model | `admin/app/admin/workshop/job-cards/new` |
| §14.1 Job card state machine, BR-004/005/007 | `JobCardStatus` enum + transition rules | `admin/lib/workshop/jobCardStateMachine.ts` |
| UC-06 Assign Technician & Bay, BR-008/009/010 | Assign endpoint with overlap check | `admin/app/api/admin/workshop/job-cards/[id]/assign` |
| UC-08 Perform QC | Pass/fail sign-off gated on `canPerformQC` | `JobCardDetail.tsx` |
| Screen 1 Workshop Live Dashboard, FR-701 | KPI strip, bay tiles, job list (30s poll) | `admin/app/admin/workshop/dashboard` |
| Screen 6 Bay Scheduling Board, FR-301/302 | Click-to-assign board (not drag-and-drop) | `admin/app/admin/workshop/bays` |
| BR-006 audit trail | `JobCardStatusHistory` on every transition | schema + `/status` route |
| §17.2 permission matrix (partial) | `service_advisor` / `service_manager` roles | `admin/lib/auth/types.ts` |

## Delivered in Phase 2

| BRD reference | What shipped | Where |
|---|---|---|
| FR-401/402, UC-07 Request/Issue Parts | `JobCardPart` line (request → issue/backorder/cancel), `SparePart.reservedQty`, real `stock` decrement on issue | `admin/lib/workshop/partsIssue.ts`, `admin/app/api/admin/workshop/job-cards/[id]/parts*` |
| FR-403 Reorder alerts | Live-computed (stock ≤ reorderPoint) list + dashboard tile — not push/SMS/email, see note below | `admin/app/api/admin/workshop/parts/reorder-alerts`, `WorkshopDashboard.tsx` |
| FR-404 Warranty-flagged part issue | `JobCardPart.isWarranty`, surfaces a "Submit Warranty Claim" link on the job card | `JobCardDetail.tsx` |
| FR-501/502, UC-09 Submit Warranty Claim | `WarrantyClaim` + `WarrantyClaimStatusHistory` models, mandatory defect-code/photo/eligibility check before submit | `admin/lib/workshop/warrantyClaimStateMachine.ts`, `admin/app/api/admin/workshop/warranty-claims/**` |
| FR-503 Claim status tracker | Status timeline UI, rejection→resubmission preserves history (no duplicate record) | `WarrantyClaimDetail.tsx` |
| §17.2 permission matrix (extended) | `canManagePartsIssue`, `canApproveWarrantyClaims` added, wired per role | `admin/lib/auth/types.ts` |

**Scope decisions made in Phase 2** (see the PR/commit introducing this section for full rationale):
warranty eligibility uses two manually-entered `JobCard.warrantyStartDate/warrantyEndDate` fields
rather than a full Customer↔Vehicle ownership model (still not built — see below); no new
"Warranty Clerk"/"Parts Clerk" roles were added, reusing `service_advisor`/`service_manager` with
new permission flags instead; reorder alerts are pull (live-computed), not push — no
SMS/email-to-manager channel exists for internal alerts.

## Delivered in Phase 3

| BRD reference | What shipped | Where |
|---|---|---|
| Screen 8 Management BI Dashboard, FR-702/703 | Monthly KPI pack: jobs closed, first-time-fix rate, avg turnaround, avg warranty turnaround, warranty approved/rejected counts, revenue mix — selectable by calendar month | `admin/lib/workshop/biSummary.ts`, `admin/app/api/admin/workshop/bi-dashboard/route.ts`, `admin/app/admin/workshop/bi-dashboard/page.tsx`, `admin/components/admin/workshop/WorkshopBiDashboard.tsx` |
| FR-704 one-click export | `?format=csv` on the same route streams a CSV of the monthly pack, gated on `canExportReports` | `admin/app/api/admin/workshop/bi-dashboard/route.ts` |

**Scope decisions made in Phase 3:**
- **First-time-fix rate** is inferred from the existing QC-fail rework loop (a `QUALITY_CONTROL → IN_PROGRESS` transition in `JobCardStatusHistory`) rather than a dedicated "repeat repair" flag, since none exists on `JobCard`.
- **Revenue mix** is bucketed by `JobCard.isWarrantyOrGoodwill` (Standard/Chargeable vs. Warranty/Goodwill), not by a service-type category (Scheduled Maintenance / Bodywork / etc. from the BRD's illustrative example) — no such field exists on `JobCard` today. Adding one is a schema decision for a future phase, not inferred here.
- **CSI trend is explicitly reported as unavailable**, not fabricated or omitted silently — the API returns `csi.available: false` with a reason, and the UI shows "No data — [reason]" rather than a fake number. This mirrors the BRD's own UC-11 alternate flow ("flag the affected KPI as partial data rather than silently showing an inaccurate number").
- **No new permission flag was added.** `canViewReports` (page access) and `canExportReports` (export button) already existed in `AdminPermissions` and were already wired per-role in `ROLE_PERMISSIONS` — Phase 3 just wired them into a new screen instead of adding new flags.
- The export is a generic structured CSV of the monthly pack, not an OEM-specific template — no OEM regional reporting template exists in this codebase to format against (§18 dependency, still open).
- No schema migration was needed for this phase — every KPI is computed from fields Phases 1–2 already added.

## Delivered in Phase 4

| BRD reference | What shipped | Where |
|---|---|---|
| FR-601 milestone notifications, UC-10 | Job-card status transitions into `AWAITING_APPROVAL`, `AWAITING_APPROVAL → IN_PROGRESS`, and `INVOICED_CLOSED` each fire a customer notification attempt across all three BRD channels (email, SMS, WhatsApp) | `admin/lib/workshop/customerNotifications.ts`, wired into `admin/app/api/admin/workshop/job-cards/[id]/status/route.ts` |
| FR-601 business rule ("failures logged and flagged to the advisor, not silently dropped") | Email sends for real over the existing SMTP channel (`admin/lib/status-email.ts`); SMS/WhatsApp are explicit placeholders gated on `SMS_PROVIDER_ENABLED`/`WHATSAPP_PROVIDER_ENABLED` env flags — until set, each attempt returns a specific "not configured" reason rather than throwing or silently no-op'ing. The status-change API response includes a `notification` object per attempt, and the advisor sees a live per-channel result banner (sent / not sent + why) immediately after changing a job card's status | `admin/lib/workshop/customerNotifications.ts`, `admin/components/admin/workshop/JobCardDetail.tsx` |

**Scope decisions made in Phase 4:**
- **No new Prisma model/migration.** Notification attempts are reported inline in the status-change API response and shown to the advisor who triggered the change, rather than persisted to a new log table — every job-card status change in this codebase is already advisor/manager-driven through this one endpoint, so there's no case today where the person who needs to see the result isn't the one already looking at the screen. Revisit once a real SMS/WhatsApp provider exists and delivery failures start mattering after the fact (e.g. a bounced SMS hours later) — at that point a persisted `JobCardNotification` log (mirroring the existing `JobCardStatusHistory`/`WarrantyClaimStatusHistory` pattern) becomes worth the schema cost.
- **SMS/WhatsApp are placeholders, not fakes.** They're structured exactly like a real provider call (same `NotificationAttemptResult` shape as email) so wiring in a real provider later is a config change (`SMS_PROVIDER_ENABLED=true` + credentials) plus replacing one function body (`sendPlaceholderChannel` in `admin/lib/workshop/customerNotifications.ts`) — not a redesign.
- **Only three transitions notify the customer** (awaiting approval, job started, ready for pick-up) — matching the BRD's FR-601 wording exactly. Every other status change (bay reassignment, parts waiting, QC rework) stays workshop-internal.
- **CSI Survey (FR-602, UC-16) was deliberately NOT built in this pass** — see the deferred row below. It needs its own scoping decision (where a public, no-login survey page lives — the customer-facing `web` app or a tokenized route in `admin` — and whether `web`/`admin` share a database) that goes beyond "pick a channel", so it wasn't bundled into this notification-channel decision.

## Delivered in Phase 5

| BRD reference | What shipped | Where |
|---|---|---|
| FR-602, UC-16 CSI Survey | New `CSISurveyResponse` model (1 response per job card, unique on `jobCardId`); survey invite email sent automatically when a job card reaches `INVOICED_CLOSED` (never manually by staff, per the FR-602 business rule); public, no-login survey page + API in the `web` app | Schema: `admin/prisma/schema.prisma` (mirrored to `web/prisma/schema.prisma` via `scripts/sync-web-prisma-schema.mjs`), migration `20260820020000_add_csi_survey_response` (applied once, present in both apps' `prisma/migrations/`); invite: `admin/lib/workshop/csiSurvey.ts`, wired into `admin/app/api/admin/workshop/job-cards/[id]/status/route.ts`; public page: `web/app/csi-survey/[jobCardId]/page.tsx`, `web/app/api/csi-survey/[jobCardId]/route.ts` |
| Screen 8 CSI trend, FR-702 | `admin/lib/workshop/biSummary.ts` now computes a real monthly average rating + response count from `CSISurveyResponse` once any responses exist; the BI Dashboard shows a star rating instead of "channel not built" | `admin/lib/workshop/biSummary.ts`, `admin/components/admin/workshop/WorkshopBiDashboard.tsx`, `admin/app/api/admin/workshop/bi-dashboard/route.ts` |

**Scope decisions made in Phase 5:**
- **The survey token is the job card's own `id`** (a random UUID, generated by Prisma, never shown to any customer other than in their own emailed link) — no separate token field/column was added. This avoids extra schema surface for the same security property a dedicated token would give.
- **Public page lives in `web`, not a tokenized `admin` route.** `web/prisma/schema.prisma` already mirrors `JobCard` (and now `CSISurveyResponse`) from `admin/prisma/schema.prisma` — both apps point at the same physical Postgres database (`geely_ethiopia`, confirmed via each app's `DATABASE_URL`) and share one `_prisma_migrations` history table. So `web` already had direct Prisma access to job-card data; no cross-app API bridge was needed.
- **Schema changes go through `admin/prisma/schema.prisma` only**, then `node scripts/sync-web-prisma-schema.mjs` to mirror into `web` — never hand-edit `web/prisma/schema.prisma` directly, per [[feedback_security_conventions]]. The migration SQL is generated once (`prisma migrate diff --from-url ... --to-schema-datamodel ...`, since `prisma migrate dev` still needs an interactive TTY this environment doesn't have) and copied identically into both apps' `prisma/migrations/` folders with the same timestamped name — mirroring the existing `20260819160000_vehicle_child_relations` precedent. Applied once via `prisma db execute`, then `prisma migrate resolve --applied` in both apps (the second resolve is a no-op against the DB since the shared `_prisma_migrations` table already has the row, but keeps each app's local migration-status check clean).
- **SMS/WhatsApp survey delivery isn't built** — same placeholder situation as Phase 4's milestone notifications; only email carries the survey link today.
- **No rating trend/history view yet** — the BI Dashboard shows the current month's average only, not a multi-month trend line. Revisit once a few months of real response data exist.

## Delivered in Phase 6

| BRD reference | What shipped | Where |
|---|---|---|
| FR-501 full vehicle warranty record | New `Customer` + `CustomerVehicle` models (VIN-level, one customer can own several vehicles); `JobCard.customerVehicleId` optionally links a visit to a persistent record | Schema: `admin/prisma/schema.prisma` (mirrored to `web`), migration `20260820060000_add_customer_vehicle_ownership` |
| FR-201, UC-04 "look up a vehicle by plate or VIN and see its full service history" | First real implementation — previously every job card started from a fully blank form with zero lookup. Write-up form now has a "Look up vehicle" action that shows the matched customer, warranty status, and up to 10 past visits, and prefills customer/vehicle fields | `admin/app/api/admin/workshop/vehicle-lookup/route.ts`, `admin/components/admin/workshop/JobCardWriteUpForm.tsx` |
| UC-01 dedupe rule ("if the phone number matches an existing customer, link instead of creating a duplicate") | Applied at job-card creation time when the advisor chooses to save a new vehicle record: `Customer` is found-by-phone before being created | `admin/app/api/admin/workshop/job-cards/route.ts` (POST) |
| FR-501 warranty derivation | When a job card is linked to a matched `CustomerVehicle`, its warranty dates are copied server-side from that record (not trusted from client input) rather than re-typed; the write-up form shows them read-only in that case | `admin/app/api/admin/workshop/job-cards/route.ts`, `admin/components/admin/workshop/JobCardWriteUpForm.tsx` |

**Scope decisions made in Phase 6:**
- **Purely additive — no backfill, no breaking change.** `JobCard` keeps every existing field (`customerName`, `customerPhone`, `plateNo`, `vin`, `warrantyStartDate/EndDate`, etc.) exactly as-is; `customerVehicleId` is a new nullable FK. A walk-in that's never matched or saved works identically to before this phase — nothing about existing job cards or the creation route's required fields changed.
- **Named `CustomerVehicle`, not `Vehicle`** — deliberately avoids colliding with the existing `Vehicle` model, which means a sales-catalog listing (e.g. "Model X SUV" trim/config), not an individual customer's VIN-level car. Confirmed no field overlap before naming it.
- **No hard uniqueness on `Customer.phone`.** It's the UC-01 dedupe lookup key (find-or-create), but not a DB constraint — enforcing uniqueness risked write failures on legitimate shared/reused numbers. `CustomerVehicle.plateNo` is likewise not unique (plates get reassigned to new owners in the real world); only `vin` is unique, since that's genuinely a global 1:1 identifier.
- **Explicit lookup button, not an eager auto-lookup on blur** — matches this codebase's existing preference for explicit staff-driven actions (e.g. the Bay Scheduling Board is click-to-assign, not drag-and-drop) and avoids firing a request on a half-typed plate.
- **Two link paths only, never a silent implicit match:** either the advisor confirms a looked-up match (`customerVehicleId` sent from the UI) or explicitly opts into saving a new record (`saveAsNewVehicleRecord`). The server never auto-links a job card to a vehicle record the advisor didn't see and confirm.
- **Screen 3 (Customer Self Check-in Kiosk) was deliberately NOT built in this pass** — see the deferred row below. It depends on this data model but is its own substantial slice (a public kiosk flow, plus loosening `JobCard.complaintText` from required to optional so a kiosk-only check-in can create a bare `DRAFT_CHECKIN` job card before an advisor captures the complaint).
- **No standalone Customer/CustomerVehicle admin management screen was built.** The value ships through the write-up flow; a dedicated list/edit screen for browsing all customers is a possible future nice-to-have, not something the BRD calls for directly.

## Delivered in Phase 7

| BRD reference | What shipped | Where |
|---|---|---|
| Screen 3 Customer Self Check-in Kiosk, UC-04 alt flow | Public, no-login kiosk page: customer enters plate/VIN + name/phone, gets a queue position and a `JC-####` reference. Looks the vehicle up against `CustomerVehicle` first (same matching rule as the advisor-side lookup) so a returning customer's known details are used instead of what they typed | `web/app/service-check-in/page.tsx`, `web/app/api/service-check-in/route.ts` |
| `JobCard.complaintText` now optional | Schema change: nullable instead of required, so a kiosk check-in can create a bare `DRAFT_CHECKIN` job card before an advisor captures the complaint | `admin/prisma/schema.prisma` (mirrored to `web`), migration `20260820090000_job_card_complaint_optional` |
| State-machine guard for the new gap | A job card cannot leave `DRAFT_CHECKIN` (except to `CANCELLED`) until `complaintText` is captured — enforced in the same place as every other business rule, not just in the UI | `admin/lib/workshop/jobCardStateMachine.ts`, wired into the status route and the client-side transition-button logic |
| Advisor-side completion | The job card detail screen shows a visible "no complaint on file yet" flag and an inline editable complaint field (reusing the existing general-purpose PATCH endpoint — no new API needed) so completing a kiosk check-in is a normal edit, not a special case | `admin/components/admin/workshop/JobCardDetail.tsx` |

**Scope decisions made in Phase 7:**
- **Walk-in only — no appointment matching.** The kiosk does not check against `ServiceBooking` records; it always creates a fresh `DRAFT_CHECKIN` job card. Matching an existing appointment at kiosk check-in is a reasonable future enhancement but adds a second lookup dimension (by phone/booking reference, not just plate/VIN) that felt like its own decision rather than an assumption to bake in silently.
- **Queue position is a live count, not a persisted ticket number.** It's `COUNT(*) WHERE status = DRAFT_CHECKIN AND openTs = today` computed at submission time — simple and always accurate, but it can shift if an earlier check-in gets picked up before this one (the number shown was accurate at that moment, not a fixed slot). No separate queue/ticket model was introduced.
- **The kiosk actor is a sentinel string (`'kiosk-self-checkin'`) in `JobCardStatusHistory.changedById`**, not a real admin user id — that field has never been a foreign key (it's a loose reference used for display), so this doesn't need a schema change or a synthetic system user account.
- **`web`'s creation logic is a separate, parallel implementation** of vehicle matching + job-card creation (not a call into `admin`'s API), consistent with the CSI survey precedent — `web` already has direct Prisma access to the same database, and there's no cross-app API between the two deployments today.
- **No admin-side visibility into "cars waiting at the kiosk" beyond the existing job card list/dashboard.** A job card in `DRAFT_CHECKIN` with no bay already shows up in the Workshop Live Dashboard's open-job-cards list; no separate "kiosk queue" view was added since the existing list already covers it.

## Delivered in Phase 8 — CRM & Showroom (Sales)

**First phase outside the workshop/SWMS module.** Everything through Phase 7 was workshop-side;
this is the start of the BRD's §6.1 CRM & Showroom section. Investigated before building: the
vehicle configurator (`web/app/configurator/page.tsx`) exists and lets a customer pick
trim/color/accessories/interior, but persists nothing server-side (it hands off to `/quote` via a
`?config=` query string) — deliberately not touched in this phase, see scope decisions. `Quotation`
and `TestDrive` models already existed and stand in for lead capture (no dedicated `Lead` model,
no source-tagging field) — also not touched here.

| BRD reference | What shipped | Where |
|---|---|---|
| FR-105 financing/insurance status on an order, UC-12 Book Order & PDI | New `SalesOrder` model with an `OrderStatus` lifecycle (Quoted → Booked → Financing Pending → Ready for Delivery → Delivered, plus Cancelled) and a `FinancingStatus` field (Not Applicable / Pending / Approved / Declined) that staff set manually | Schema: `admin/prisma/schema.prisma` (mirrored to `web`), migration `20260820120000_add_sales_order_pdi`; state machine `admin/lib/sales/orderStateMachine.ts` |
| FR-106 PDI checklist gate ("cannot be marked ready for delivery until the PDI checklist is 100% complete") | A default 5-item PDI checklist is seeded on every order; the state machine blocks the `READY_FOR_DELIVERY` transition until every item is checked — enforced server-side, not just hidden in the UI | `admin/lib/sales/{orderStateMachine,pdiChecklistTemplate}.ts`, `admin/app/api/admin/orders/[id]/{status,pdi}/route.ts` |
| "Convert a saved configuration/quotation into a formal order" | A "Convert to Order" action on the quotations list creates a `SalesOrder` linked to the source `Quotation` (one order per quotation — `quotationId` is unique) and marks the quotation `converted` | `admin/app/api/admin/quotations/[id]/convert-to-order/route.ts`, `admin/components/admin/QuotationsList.tsx` |
| Admin visibility | New "Sales Orders" list + detail screens (financing status editor, PDI checklist, status actions, status history) — same patterns as the workshop `JobCardDetail`/`JobCardStateMachine` | `admin/app/admin/orders/**`, `admin/components/admin/sales/{OrdersList,OrderDetail}.tsx` |

**Scope decisions made in Phase 8:**
- **No real VIN-level stock allocation.** The BRD's business rule ("Vehicle stock allocation must
  be checked in real time against the ERP/OEM allocation system") has no system to check against
  in this codebase — same reasoning as every other ERP-dependent item already in this backlog.
  `SalesOrder.vehicleModel` is a plain string copied from the quotation, not a VIN or even an FK to
  the `Vehicle` catalog — matching the existing (pre-Phase-8) `Quotation.vehicleModel` convention
  exactly, deliberately not "upgraded" to a stricter relation in this pass.
- **Financing status is a recorded flag, not underwritten** — explicitly matches the BRD's own
  out-of-scope note ("the system records financing status; it does not underwrite financing").
- **No new permission flag.** Reused `canViewQuotations`/`canManageQuotations` (already assigned
  to the `SALES`/`MANAGER`/`ADMIN`/`SUPER_ADMIN` roles) rather than inventing `canManageOrders` —
  orders are a direct continuation of the quotation pipeline, not a separate concern.
- **The vehicle configurator was NOT wired to quotations/orders in this pass.** It currently
  persists nothing server-side; connecting it (so a quotation/order captures the exact
  color/accessory/package selection, not just a model name) is a separate, real integration
  decision — and the configurator page has been under active parallel development this session, so
  it was deliberately left untouched to avoid colliding with in-flight work.
- **No `Lead` model or FR-101 source tagging was added.** `Quotation`/`TestDrive` continue to stand
  in for lead capture exactly as before Phase 8 — introducing a proper lead pipeline is its own
  scoping decision, not a natural extension of "orders."
- **No digital ID capture for test drives (FR-104)** — `TestDrive` was not touched in this phase.

## Delivered in Phase 9 — Configurator → Quotation/Order Linkage

The vehicle catalog/configurator work that was in flight during Phase 8 has since been committed
and stabilized (`361bebd "Seed Colors, add real Wheels support, remove remaining configurator
hardcode"` and earlier), so this was safe to build without the collision risk Phase 8 flagged.
Re-investigated the actual handoff before changing anything: the configurator already sends its
full selection (`{ vehicle, trim, color, wheels, interior, accessories[], price }`) to `/quote` via
a `?config=` query string, and `/quote` was already embedding it as a JSON-stringified blob inside
`Quotation.message` — so the data was never fully lost, just unstructured and unqueryable.

| BRD reference | What shipped | Where |
|---|---|---|
| FR-102/103 configuration → quotation/order | New `configurationJson` field on both `Quotation` and `SalesOrder` (structured, not a text blob). `/quote` now sends the configurator's selection as its own field instead of stuffing it into `message`; `convert-to-order` carries it over automatically | Schema: `admin/prisma/schema.prisma` (mirrored to `web`), migration `20260820140000_add_configuration_json`; `web/app/api/quotations/route.ts`, `web/app/quote/page.tsx`, `admin/app/api/admin/quotations/[id]/convert-to-order/route.ts` |
| Admin visibility | A shared `ConfigurationSummary` component renders the structured trim/color/wheels/interior/accessories/price on both the quotation detail page and the order detail page | `admin/components/admin/sales/ConfigurationSummary.tsx`, wired into `admin/app/admin/quotations/[id]/page.tsx` and `admin/components/admin/sales/OrderDetail.tsx` |
| Notification email | The quotation-request confirmation email now lists trim/color/wheels/interior/accessories individually instead of only the vehicle name | `web/app/api/quotations/route.ts` |

**Scope decisions made in Phase 9:**
- **`configurationJson` is untyped `Json?`, not a normalized set of columns/relations** — the
  configurator's option lists (colors, wheels, accessories, etc.) already live in their own
  `Vehicle*` catalog tables with their own admin CRUD; duplicating that as a rigid schema on
  `Quotation`/`SalesOrder` would fight the catalog's own evolution. A JSON snapshot of "what the
  customer picked, as strings, at that moment" is deliberately loose — it's a record of intent,
  not a live-linked configuration.
- **Removed the old JSON-stuffed-into-`message` behavior rather than keeping both.** Being
  decisive here avoids duplicate/inconsistent representations of the same data; existing
  quotations created before this phase keep their old `message`-embedded JSON as-is (nothing was
  backfilled), while new ones get the structured field.
- **Did not touch `TestDrive` or add a `Lead` model** — see the deferred rows below, unchanged from
  Phase 8's assessment.

## Delivered in Phase 10 — Lead Capture &amp; Source Tagging (FR-101)

Decided not to introduce a separate `Lead` model — `Quotation` already carries almost everything
FR-101 asks for (status pipeline, `assignedTo`, follow-up notes), and the BRD's own screen design
(Part C) never gave lead capture a dedicated screen either, folding it into the
configurator/quotation flow. The gap was specifically: no source tag, and no way to log a walk-in
lead with just a name and phone (the public form requires a full quote request).

| BRD reference | What shipped | Where |
|---|---|---|
| FR-101 source tagging, "mandatory field, appears on every lead" | New `Quotation.source` field (`walk-in` / `website` / `referral` / `phone` / `other`), defaulted to `website` for the public channel and shown as a column on the quotations list and on the detail page | Schema: `admin/prisma/schema.prisma` (mirrored to `web`), migration `20260820160000_add_quotation_lead_source`; `web/app/api/quotations/route.ts`, `admin/components/admin/QuotationsList.tsx` |
| UC-01 "capture a walk-in... lead", "at minimum" name + phone | `Quotation.email` and `.vehicleModel` are now optional (were required) — a walk-in can be logged with just a name and phone, or as a general enquiry with no vehicle picked yet, matching UC-01's own alt flow ("if no vehicle model is selected, the lead is still saved as a general enquiry") | Same migration; new `POST /api/admin/quotations` handler |
| A real "Log a Lead" screen | `admin/app/admin/quotations/new/page.tsx` was a **non-functional stub** before this phase — a static form with no state, no submit handler, buttons that did nothing. Replaced with a working form wired to the new endpoint | `admin/components/admin/sales/WalkInLeadForm.tsx`, `admin/app/admin/quotations/new/page.tsx` |
| UC-01 dedupe rule, "link the new lead to that customer instead of creating a duplicate" | The walk-in creation endpoint reuses an existing *open* (not converted/closed) quotation for the same phone number instead of creating a second one; the quotation detail page also surfaces every other inquiry from the same phone number, closed or not, so nothing is silently hidden | `admin/app/api/admin/quotations/route.ts` (POST), `admin/app/admin/quotations/[id]/page.tsx` |

**Scope decisions made in Phase 10:**
- **Dedupe is phone-based reuse of an open `Quotation`, not a `Customer` record.** There's no
  shared customer identity model between the sales/CRM side and the workshop's Phase 6
  `Customer`/`CustomerVehicle` model — deliberately kept separate; a sales lead and a workshop
  customer are different concepts here and merging them wasn't asked for.
- **Also fixed, as a side effect: `admin/app/admin/quotations/new/page.tsx` had no
  `requirePermission` call at all** — the original stub was reachable without checking
  `canManageQuotations` (harmless in practice since its buttons didn't do anything, but still a
  gap). The rebuilt page has the permission check every other admin page uses.

## Delivered in Phase 11 — Digital ID Capture on Test Drives (FR-104)

`admin/app/admin/test-drives/[id]/page.tsx` was previously **fully read-only** — no client
component, no status actions, no upload UI at all (unlike every other detail page in this
codebase). Investigated the existing upload convention first (`WarrantyClaimDetail.tsx`'s
photo-attach flow: `POST /api/upload/image` with a `category`, then PATCH the parent record with
the returned URL) and reused it exactly rather than inventing a new upload path.

| BRD reference | What shipped | Where |
|---|---|---|
| FR-104 "book a test drive with digital ID capture" | New `TestDrive` fields: `idDocumentType`, `idDocumentNumber`, `idPhotoUrl`, `idVerifiedAt`, `idVerifiedById`. A new interactive panel on the test drive detail page lets a Sales Executive record the document type/number and capture a photo of the ID, reusing the existing `/api/upload/image` route | Schema: `admin/prisma/schema.prisma` (mirrored to `web`), migration `20260820180000_add_test_drive_id_capture`; `admin/components/admin/test-drives/TestDriveIdCapture.tsx`, wired into `admin/app/admin/test-drives/[id]/page.tsx` |
| "so that test drives are tracked and accountable" | A test drive cannot be marked **completed** until `idPhotoUrl` is set — enforced server-side in the status PATCH route (not just a UI restriction), the same pattern as every other lifecycle gate in this codebase (PDI → Ready for Delivery, complaint → past Draft/Check-in) | `admin/app/api/admin/test-drives/[id]/route.ts` |
| Admin visibility | Added the `GET` handler this route was missing entirely (detail page previously only worked via a direct server-side Prisma call, with no way for a client component to re-fetch); the list page's status buttons now surface the new gate's error message instead of failing silently | `admin/app/api/admin/test-drives/[id]/route.ts`, `admin/components/admin/test-drives/TestDriveList.tsx` |

**Scope decisions made in Phase 11:**
- **ID capture is admin-only, not part of the public booking flow.** The BRD's own persona is "a
  Sales Executive" capturing ID when the customer physically arrives — and per ADR-002, `admin`
  and `web` are separate deployments with separate local-disk upload storage (a file written via
  `admin`'s upload route is not reachable from `web`'s GoDaddy deployment), so this could not have
  worked as a public-facing upload even if the BRD had asked for one.
- **The completion gate checks the request's OWN incoming ID fields, not just the pre-existing
  record** — capturing the ID and marking the drive complete can happen in a single action once
  wired up client-side, though the current UI does them as two separate button clicks.
- **No signature capture** — the BRD wording ("digital ID capture") is about identity
  verification, not a liability waiver signature; a photo of the ID document plus a manually
  entered document number was judged sufficient without inventing an unrequested e-signature flow.

## Delivered in Phase 12 — Kiosk ↔ Appointment Matching

The one remaining deferred item that was fully buildable with no external dependency (everything
else left was blocked on a business decision or nonexistent infrastructure). `ServiceBooking`
already had a `jobCard JobCard?` back-relation and an admin-side manual conversion route
(`admin/app/api/admin/service-bookings/[id]/convert-to-job-card/route.ts`) — this phase gives the
kiosk the same capability automatically, using the identical field mapping so the two paths never
drift.

| BRD reference | What shipped | Where |
|---|---|---|
| Kiosk ↔ appointment matching | Kiosk check-in now looks up an unconverted `ServiceBooking` (`jobCard: null`) for the entered phone number, scheduled for today, before falling back to a fresh walk-in. When matched, the job card is linked (`serviceBookingId`) and its complaint is pre-filled from the booking's `notes`/`serviceType` — mirroring the admin conversion route's exact field mapping — and the kiosk confirmation screen greets the customer by their appointment instead of a generic walk-in message | `web/app/api/service-check-in/route.ts`, `web/app/service-check-in/page.tsx` |

**Scope decisions made in Phase 12:**
- **Matched on phone + today's date, not a booking reference/confirmation code.** The kiosk form
  never collected a booking reference (BRD's own kiosk field set is just plate/VIN + name/phone),
  so phone number is the only identifier available at check-in — same key the `CustomerVehicle`
  lookup already uses.
- **No changes to the admin conversion route.** Its existing `if (booking.jobCard)` 409 guard
  already prevents double-linking if the kiosk got there first — verified this directly (see
  below), so nothing there needed to change.
- **A second kiosk check-in for an already-converted booking falls back to a fresh walk-in rather
  than erroring**, unlike the admin route's 409. Different UX for different contexts: an advisor
  deliberately picking a booking to convert should be told it's already done; a customer at a
  self-service kiosk should never see an error screen — a fresh walk-in card is the safe default,
  and an advisor merging duplicate cards is a rare, cheap manual fix.
- **Verified against the live database, not just typechecked** (see the memory file /
  `[[project_swms_status]]` for the exact steps): created a real `ServiceBooking` for today, kiosk
  check-in correctly matched it, pre-filled the complaint from `serviceType`, and linked
  `serviceBookingId`; a second check-in with the same phone correctly fell back to a walk-in
  instead of double-linking. All test records deleted afterward.

## Delivered in Phase 13 — VIN Barcode Check-in at the Kiosk

A direct user request, not a BRD line item: "when customer come it checkin by barcode." Clarified
to mean scanning the vehicle's own VIN barcode (present on most vehicles' dash/doorjamb) rather
than a booking-confirmation QR code or a loyalty card — the lower-effort option since it needs no
new code generated/delivered at booking time and reuses the `CustomerVehicle` matching already
built in Phase 6/7.

| What shipped | Where |
|---|---|
| VIN-first kiosk flow | The VIN field is now the lead field, auto-focused on page load, sized and styled for a barcode scanner's output. A physical keyboard-wedge scanner (the common, cheap kind that emulates a keyboard) needs zero special handling — it just types into the focused field and sends Enter, which the field now explicitly listens for. Reaching 17 characters (a VIN's fixed length) also auto-triggers the lookup, so fast manual typing works the same way | `web/app/service-check-in/page.tsx` |
| Live "do we know this vehicle" lookup | New read-only endpoint, matches `CustomerVehicle` by VIN (case-insensitive, same rule as the existing kiosk/advisor lookups) and returns the customer's name/phone/email/plate if found. On a match, the kiosk shows a "Welcome back" banner and auto-fills the rest of the form — the customer never retypes what's already on file | `web/app/api/service-check-in/lookup/route.ts` |
| Camera-based scanning fallback | For kiosks without a dedicated hardware scanner (e.g. a plain tablet), a "Scan with camera" button appears only when the browser supports the native `BarcodeDetector` API (Chrome/Edge) — no new npm dependency. Decodes Code 39/128/QR from the device camera and fills the VIN field exactly as a hardware scan would | `web/app/service-check-in/page.tsx` |

**Scope decisions made in Phase 13:**
- **No schema or backend check-in logic changed.** `POST /api/service-check-in` already accepted
  a VIN and already matched it against `CustomerVehicle` (Phase 7) — this phase is entirely a
  front-of-kiosk UX change (a live lookup + reordered/scanner-friendly form) plus one new read-only
  lookup endpoint. Verified end-to-end against the live database: created a real `CustomerVehicle`,
  confirmed the lookup matched it (including case-insensitively), submitted a check-in with the
  scanned VIN, and confirmed the resulting `JobCard` correctly linked `customerVehicleId`. All test
  records deleted afterward.
- **No native mobile app or scanner SDK.** Both scanning paths (hardware keyboard-wedge, in-browser
  camera via `BarcodeDetector`) work inside the existing web kiosk page — no new deployment
  artifact.
- **A VIN that doesn't match any record on file is not an error** — the kiosk just says so plainly
  and lets the customer fill in their details manually, exactly as before this phase for a new
  customer.

## Delivered in Phase 14 — Standalone Customer/Vehicle Admin Screen

Revisits a scope cut explicitly logged back in Phase 6: "No standalone Customer/CustomerVehicle
admin management screen was built. The value ships through the write-up flow; a dedicated
list/edit screen for browsing all customers is a possible future nice-to-have." Picked over the
other two shipped-phase scope cuts on the table (an OEM-template CSV export, a multi-month CSI
trend) because both of those are blocked on something this codebase doesn't have yet — an OEM
format spec, and a few months of real survey data — while this one was buildable outright.

| What shipped | Where |
|---|---|
| Customers list — search by name, phone, plate, or VIN; stat tiles for total customers, vehicles on file, and vehicles currently under warranty | `admin/app/api/admin/customers/route.ts`, `admin/components/admin/customers/CustomersList.tsx`, `admin/app/admin/customers/page.tsx` |
| Customer detail — editable contact info (name/phone/email/address), every linked vehicle shown with its own editable record (plate, model/trim/color, warranty dates, last known mileage) and up to 10 most recent job cards per vehicle, linking through to the existing job card detail page | `admin/app/api/admin/customers/[id]/route.ts`, `admin/app/api/admin/customer-vehicles/[id]/route.ts`, `admin/components/admin/customers/CustomerDetail.tsx`, `admin/app/admin/customers/[id]/page.tsx` |
| Nav entry | Added "Customers" under SWMS → Service / Workshop, next to Job Cards | `admin/components/admin/AdminLayout.tsx` |

**Scope decisions made in Phase 14:**
- **No schema change, no new permission flag.** Every field already existed on `Customer`/`CustomerVehicle` since Phase 6; this phase only adds a browse/edit surface for data that previously could only be seen or changed mid-visit through the job-card write-up flow. Reused `canViewJobCards` (page access) and `canManageJobCards` (edit gate) — the same roles that already touch this data (`service_advisor`, `service_manager`, `service`, `manager`, `admin`, `super_admin`); `sales`/`marketing` correctly stay locked out, since this is workshop customer data, not a sales lead.
- **Browse and correct, not create.** No "add customer" action was added — job-card write-up (find-or-create by phone) and the kiosk check-in are still the only two ways a `Customer`/`CustomerVehicle` record comes into existence. This screen is for fixing what's already there (a mistyped plate, a corrected warranty date), matching exactly the gap Phase 6 flagged rather than expanding it into a new intake path.
- **The list API itself only requires an authenticated admin session, not `canViewJobCards`** — consistent with every other list GET in this codebase (e.g. `vehicle-lookup`, `orders`); the permission check lives at the page level (`requirePermission('canViewJobCards')`) and again explicitly on both PATCH routes. Verified directly: a `sales`-role session could still read `/api/admin/customers` (matching the existing convention) but got a 403 attempting to PATCH a customer or vehicle record.
- **Verified against the live database, not just typechecked**: created a real `Customer` + `CustomerVehicle` + `JobCard`, confirmed the list search matched by plate and by VIN fragment, confirmed the detail endpoint returned the linked service history, PATCHed both the customer's phone and the vehicle's plate/mileage and confirmed the changes persisted, and confirmed empty-string validation and 403-on-forbidden-role behaved correctly. All test records deleted afterward.

## Cross-cutting: SWMS Design/Responsive/Performance Hardening Pass

Not tied to a BRD FR — a direct user request ("make UI design ... best style, forms and tables
work in all screen, and ... make performance") scoped, on request, to the SWMS pages only (not the
rest of the admin panel). An Explore-agent audit across all ~24 SWMS pages found the newest pages
(Orders, Job Cards, Warranty Claims, Bays, Technicians, the Phase 14 Customers screen) already
consistently used the shared `admin/components/admin/ui` kit and were responsive; the oldest pages
(Quotations, Parts Requests, Test Drives — largely pre-dating that kit) had the real gaps.

| What shipped | Where |
|---|---|
| New shared `Pagination` component | `admin/components/admin/ui/Pagination.tsx` |
| Quotations — full rewrite onto the shared kit (`TableCard`/`Badge`/`StatTile`), server-side pagination + status filter, status counts computed table-wide (not just the current page), dark-mode support (previously light-only) | `admin/app/api/admin/quotations/route.ts`, `admin/components/admin/QuotationsList.tsx` |
| Parts Requests — same treatment: kit-based table/stats, server-side pagination, dark mode | `admin/app/api/admin/parts-requests/route.ts`, `admin/app/admin/parts-requests/page.tsx` |
| Orders — server-side pagination (was a single unbounded fetch), status-tile counts moved server-side so they stay correct once paginated | `admin/app/api/admin/orders/route.ts`, `admin/components/admin/sales/OrdersList.tsx` |
| Test Drives — capped the server query (`take: 300`) and added client-side pagination + kit components (`Card`/`Badge`/`EmptyState`) to a list that already imported the kit but never used it, plus dark mode | `admin/app/admin/test-drives/page.tsx`, `admin/components/admin/test-drives/TestDriveList.tsx` |
| Mobile-overflow fixes: parts line-items table on a job card, and the status-history row (fixed `w-40` label that couldn't wrap) on both Orders and Warranty Claims | `admin/components/admin/workshop/JobCardDetail.tsx`, `admin/components/admin/sales/OrderDetail.tsx`, `admin/components/admin/workshop/WarrantyClaimDetail.tsx` |
| Workshop Live Dashboard no longer polls every 30s while the browser tab is backgrounded (resumes instantly on refocus) | `admin/components/admin/workshop/WorkshopDashboard.tsx` |
| Safety cap (`take: 200`) added to the Job Cards GET route — currently unused by any list UI, but was genuinely unbounded | `admin/app/api/admin/workshop/job-cards/route.ts` |
| Fixed a redundant double-fetch on first load in the Phase 14 Customers list | `admin/components/admin/customers/CustomersList.tsx` |

**Scope decisions:**
- **SWMS pages only, per explicit user choice** — the rest of the admin panel (CMS/content, vehicle catalog, settings, dealers, promotions, etc.) was out of scope for this pass and was not touched.
- **Test Drives got client-side pagination over a capped fetch, not full server-side pagination** — it's a server component feeding both a list view and a calendar view from one query; slicing a capped, already-fetched array for the list avoids restructuring that data flow (which the calendar also depends on) while still fixing the "renders hundreds of DOM rows" cost. Quotations/Parts Requests/Orders are simple client-fetched lists with no such constraint, so they got real server-side pagination instead.
- **Status/stat counts are computed server-side across the whole table, not the current page**, wherever pagination was added — otherwise a stat tile would silently start lying ("New: 3") the moment a list had more than one page.
- **Detail pages (quotation/parts-request/test-drive/order/job-card detail) were left alone** except for the two specific overflow fixes above — the audit found no responsive or perf issues on them; rewriting working detail pages onto the kit for style-consistency alone wasn't asked for and wasn't done speculatively.
- **Verified against the live database and the running dev server** (not just typechecked): hit all six touched admin pages authenticated and confirmed 200s with no error markers in the rendered HTML; exercised the new paginated/status-filtered API responses directly (correct `total`/`page`/`stats` math, empty page 2 behaves correctly); ran a full create → status-change → filtered-lookup → delete round trip against a disposable quotation to confirm the rewritten list's mutation flows still work end-to-end. All test records deleted afterward.

## Cross-cutting: Editable Roles & Permissions + Web Login Role Routing

Not tied to a BRD FR — a direct user request ("update the web login page based on role access,
make Roles & Permissions editable, and let it assign whatever user it finds"). Scoped via
AskUserQuestion: the permission matrix itself becomes editable (previously read-only), and a
find-a-user-and-assign-role widget was added to the same page. Investigated first: per-user role
*assignment* already existed and worked (`/admin/users/[id]`'s role picker) — what didn't exist was
editing what a role itself grants, since `ROLE_PERMISSIONS` was a hardcoded TS object with nothing
reading or writing it from the database.

| What shipped | Where |
|---|---|
| `web` login redirects by the role the server actually authenticated, not the customer/dealer toggle the user had selected before submitting (previously a customer who mis-clicked "Dealer" would be routed to a 404, since no dealer portal exists yet) | `web/app/login/page.tsx` |
| `web`'s public login endpoint now rejects every staff role via an allowlist (`isPublicRole`), not a 3-role hardcoded blocklist that had silently missed `sales`/`service`/`marketing`/`service_advisor`/`service_manager` — those accounts could previously obtain a customer-portal session | `web/app/api/auth/login/route.ts` |
| New `RolePermissionOverride` model — one row per (role, permissionKey) an admin has explicitly changed from the hardcoded default; absence of a row means "use the default" | Schema: `admin/prisma/schema.prisma` (mirrored to `web`), migration `20260821080000_add_role_permission_override` |
| Effective-permissions resolver: hardcoded defaults + DB overrides merged, 30s in-memory cache invalidated on every write so a change is visible immediately, not just after the TTL | `admin/lib/auth/rolePermissions.ts` |
| The NextAuth `session` callback now computes permissions this way on every session check — an already-logged-in user sees a permission change on their very next request, no re-login needed | `admin/lib/auth/config.ts` |
| `GET/PATCH/DELETE /api/admin/role-permissions` — read the full matrix, toggle one cell, or reset one cell / a whole role back to defaults | `admin/app/api/admin/role-permissions/route.ts` |
| `/admin/users/roles` is now interactive: click a cell to grant/revoke, blue vs. green checkmarks distinguish an override from a default, hover an override to reset just that cell, "Reset all" per role column | `admin/components/admin/users/RolesPermissionsManager.tsx`, `admin/app/admin/users/roles/page.tsx` |
| Find-a-user-and-assign-role widget on the same page (search by name/email, pick a role, saves via the existing `PUT /api/admin/users/[id]`) | `admin/components/admin/users/RolesPermissionsManager.tsx` |
| The role-preview shown on the user create/edit forms now fetches *effective* permissions instead of always showing hardcoded defaults, so it can't drift from what a role actually grants once overrides exist | `admin/components/admin/users/RolePermissionPreview.tsx` |

**Scope decisions:**
- **`super_admin` is permanently locked, not just defaulted** — the API rejects any attempt to override it, and the UI shows a lock icon instead of a checkbox on that column. This guarantees there's always one role with full access that can undo any permissions mistake, rather than a scenario where every role gets misconfigured and nothing can fix it back.
- **Editing is gated on the same `canManageUsers` permission that already gates this whole page** — no new permission flag, matching this session's established reuse-before-inventing convention.
- **Only the permission keys already shown in the existing read-only matrix are editable** (`admin/lib/auth/permissionGroups.ts`'s curated `PERMISSION_GROUPS` list, not the full ~30-flag `AdminPermissions` interface) — kept the surface area identical to what was already being displayed rather than exposing every flag.
- **A found user's role is only reassignable to one of the 7 staff roles** (matching `/admin/users/new`'s own dropdown), even though the underlying search can surface any user including existing customer/dealer portal accounts — this widget is for staff role assignment, not for converting portal semantics.
- **Two pre-existing gaps were found but deliberately NOT fixed in this pass**, to keep this batch scoped to what was asked: `/admin/users/new` and `/admin/users/[id]` have no `requirePermission` gate at all (same class of gap Phase 10 found and fixed on the old quotations/new stub) — the mutation endpoints are still properly gated server-side, so this is an unauthorized-page-*view* gap, not a privilege-escalation one, but it's a real gap worth a future pass.
- **Verified against the live database and the running dev servers, not just typechecked**: proved an already-authenticated session (same cookie, no re-login) sees a permission toggle take effect on its very next request; confirmed the `super_admin` lock and unknown-permission-key rejection; confirmed reset-one-cell and reset-a-whole-role both work; confirmed the previously-unblocked `sales`/`service_advisor` staff accounts are now correctly rejected by the public login endpoint while real customer/dealer accounts still succeed and return the correct role; ran the full find-user → assign-role → verify round trip against a disposable account. All test overrides and accounts removed afterward.

## Delivered in Phase 15 — Connect the Showroom QR Flow into the SalesOrder Pipeline

A direct user request following on from the showroom QR walk-in flow (visitor scans a QR →
self-registers → browses `/models` → gets a quote / books a test drive / continues to payment,
built in a prior session pass). The gap: a quotation from `/quote` just sat there until a staff
member manually clicked "Convert to Order" (Phase 8), and a customer who chose "Continue to
Payment" directly bypassed the CRM pipeline entirely — that path only ever created a `Message`
record, invisible to the Orders/PDI pipeline Phase 8 built. The diagram the user provided
(`CRM/Leads → QR Self-Register → Vehicle Selection → Quotation → Reservation/Booking → ...`) maps
almost entirely onto what Phases 1–14 already shipped; this phase closes the one real missing
link between the new public entry point and the existing sales pipeline.

| What shipped | Where |
|---|---|
| New `ShowroomVisit.quotationId` / `.salesOrderId` fields — loose links (no FK, matching this model's existing decoupled convention) so a showroom visit is traceable to whatever CRM records it produced | Schema: `admin/prisma/schema.prisma` (mirrored to `web`), migration `20260821110000_add_showroom_visit_crm_links` |
| `/quote` submissions arriving with a `visitId` are now tagged `Quotation.source: 'qr-showroom'` (was always `'website'` before) and the source `ShowroomVisit` is updated with the new quotation's id | `web/app/quote/page.tsx`, `web/app/api/quotations/route.ts` |
| Direct "Continue to Payment" purchases (`/financing/apply` → `/api/public/purchases`) now ALSO create a `Quotation` + immediately convert it into a `SalesOrder` (status `BOOKED`, `financingStatus: 'PENDING'`, PDI checklist seeded) — mirroring `admin/app/api/admin/quotations/[id]/convert-to-order/route.ts`'s exact fields/logic as a parallel `web`-side implementation (same precedent as the service-check-in kiosk) — instead of only creating a disconnected `Message` | `web/app/api/public/purchases/route.ts` (`linkPurchaseToSalesPipeline`), `web/lib/sales/pdiChecklistTemplate.ts` (mirrors `admin/lib/sales/pdiChecklistTemplate.ts`) |
| Reuses an existing `Quotation` instead of creating a duplicate when the purchase followed a real prior "Get a Quote" request — `financing/apply`'s `quote` param now carries either a real `Quotation` id or the `qr-visit-<id>` UI-gate sentinel, and the purchases route distinguishes the two | `web/app/financing/apply/page.tsx`, `web/app/api/public/purchases/route.ts` |
| Applies to every direct purchase, not just QR-sourced ones (`source` is `'qr-showroom'` when a `visitId` is present, `'website'` otherwise) — kept consistent rather than only fixing this for one traffic source | Same route |

**Scope decisions made in Phase 15:**
- **The existing `Message`-based purchase record and its mock-payment flow were left completely untouched** — the new `Quotation`/`SalesOrder` creation is purely additive, wrapped in its own try/catch so a failure there can never break the existing purchase/payment/email flow that was already working. The `Message` is payment-processing bookkeeping (what the mock payment step keys off); the `SalesOrder` is the CRM/sales pipeline record — different concerns, not two representations of the same data, so keeping both was a deliberate choice (unlike Phase 9's message-JSON duplication, which really was the same data twice).
- **No new email is sent for the auto-created `Quotation`/`SalesOrder`.** The purchase already triggers its own customer/admin email via the existing `Message` flow; adding a second notification for the same event would be redundant.
- **The sales-order state machine gates were not touched.** A `SalesOrder` created this way starts at `BOOKED` exactly like a staff-converted one and goes through the same PDI-gated `orderStateMachine.ts` from Phase 8 — no new lifecycle branch was introduced for QR-originated orders.
- **A `Quotation` from a plain "Get a Quote" request is NOT auto-converted to a `SalesOrder`.** Only a purchase (explicit "I want to buy now" intent, with a vehicle/bank/quantity already chosen) triggers the automatic conversion — a quote request alone still requires a staff member's deliberate "Convert to Order" action, preserving Phase 8's original intent that becoming an "order" is a judgment call, not automatic on every lead.
- **Verified against the live database, not just typechecked**: ran three real end-to-end cases through a disposable test instance — (1) a `/quote` submission carrying a `visitId` correctly tagged `source: 'qr-showroom'` and linked back to the `ShowroomVisit`; (2) a direct purchase with no prior quote correctly created a new `Quotation` (`status: converted`) + `SalesOrder` (`SO-1002`, `BOOKED`, `PENDING` financing, 5 PDI items, status history) and linked both ids onto the `ShowroomVisit`; (3) a purchase referencing an already-existing `Quotation` id correctly reused it (confirmed via a phone-number count that no duplicate was created) and created a new `SalesOrder` (`SO-1003`) against that same quotation. All test records (quotations, sales orders + their PDI items/status history, showroom visits, messages) deleted afterward. Note: real confirmation emails were sent to the configured `ADMIN_EMAIL`/SMTP account during this verification (pre-existing `sendFormEmail`/purchase-email behavior on these routes, not something this phase added) — worth knowing if that inbox is monitored.

## Delivered in Phase 16 — Sales Agreement Approval & E-Sign/Attach

Picked from the four items Phase 15 left on the table for the user to choose from — the biggest
structural gap in the CRM pipeline diagram: `Sales Quotation → Approval by sales agent → Generate
Agreement → send to Customer → esign or attach`. None of it existed in any form (confirmed via an
Explore-agent survey first: no PDF library in either app, no signature-capture UI/library/field
anywhere, and Phase 11 had already deliberately decided against inventing e-signature for test
drives — "a photo of the ID document... was judged sufficient").

| What shipped | Where |
|---|---|
| `SalesOrder` gained `approvedAt`/`approvedById` (loose actor reference, no FK — same convention as every other `changedById`-style field) and `signedDocumentUrl`/`signedAt` | Schema: `admin/prisma/schema.prisma` (synced to `web` via `scripts/sync-web-prisma-schema.mjs`), migration `20260821120000_add_sales_order_approval_agreement` |
| `POST /api/admin/orders/[id]/approve` — a sales agent approves a booked order (one-way; rejects with 409 if already approved) | `admin/app/api/admin/orders/[id]/approve/route.ts` |
| `GET /api/admin/orders/[id]/agreement` — a print-ready HTML sales agreement (customer/vehicle/config/price/financing, signature lines), rendered fresh from live order data on every request rather than generated once and stored. Mirrors `web/app/api/vehicles/[id]/brochure`'s "pure HTML + print CSS, `window.print()` on load, zero external dependencies" pattern exactly, since no PDF-generation library exists anywhere in this codebase. Returns 409 until the order is approved | `admin/app/api/admin/orders/[id]/agreement/route.ts` |
| "Attach signed copy" — staff photograph/scan the physically-signed agreement and upload it, reusing the exact upload-then-PATCH convention already established by `TestDriveIdCapture.tsx` (`POST /api/upload/image` → `PATCH` the parent record with the returned URL) | `admin/app/api/admin/orders/[id]/route.ts` (PATCH now also accepts `signedDocumentUrl`, stamping `signedAt`), new `admin/components/admin/sales/OrderApprovalPanel.tsx` (mirrors `TestDriveIdCapture.tsx`'s structure), wired into `OrderDetail.tsx` between the PDI card and "Move Order" |
| New lifecycle gate: an order cannot move to `READY_FOR_DELIVERY` until it's both approved AND has a signed document attached — enforced in the same single source of truth as the existing PDI gate, not just hidden in the UI | `admin/lib/sales/orderStateMachine.ts` (new `agreementComplete` context flag), `admin/app/api/admin/orders/[id]/status/route.ts` |

**Scope decisions made in Phase 16:**
- **No new `OrderStatus` enum value.** Approval/agreement is modeled as scalar fields + a transition guard on `READY_FOR_DELIVERY`, exactly mirroring how PDI already works (a checklist gate, not a status) — this was the more consistent option given the existing state machine's demonstrated pattern of independent readiness checks converging on one gate, rather than inserting a new intermediate status for a 5-status enum that has no room reserved for it.
- **No new permission flag.** Reuses `canManageQuotations` (approve, attach) and `canViewQuotations` (view the agreement) — the diagram itself names the approver as "a sales agent," the same actor who already manages every other part of this order. `canApproveWarrantyClaims` exists in this codebase as a precedent for splitting "approve" from "manage" when a business rule wants a distinct sign-off role, but nothing in this ask calls for restricting approval more tightly than existing order-management access.
- **"E-sign" means "staff attaches a photo/scan of the physically-signed agreement," not a canvas-drawn or typed digital signature.** Directly follows Phase 11's precedent decision for test-drive ID capture ("a photo... was judged sufficient without inventing an unrequested e-signature flow") — the diagram's own wording ("esign **or** attach") explicitly offers this as a valid alternative, not a fallback.
- **Attaching the signed copy is staff-mediated, not a public customer-facing upload.** Same ADR-002 reasoning as Phase 11: `admin` and `web` are separate deployments with separate local-disk upload storage, so a customer-side upload from `web` couldn't reach `admin`'s `/api/upload/image` storage. The customer signs a printed/downloaded copy; staff scan and attach it when it's returned — consistent with how ID capture already works ("captured when the customer physically arrives").
- **The agreement document itself is never stored** — `GET .../agreement` always renders current order data live. Only the *signed* copy (a photo/scan) gets a stored URL. This avoids a stale-document problem (an order's price/configuration could still change after approval) and matches the brochure route's existing "generate on demand" precedent.
- **Approving does not touch `SalesOrderStatusHistory`** — it isn't a status change, so it doesn't appear in the status timeline; `approvedAt`/`approvedById` on the order itself is the record of it, matching how `financingStatus` changes also don't touch status history.
- **Verified against the live database and the live admin dev server, not just typechecked** (authenticated via the seeded `super.admin@geelyethiopia.com` demo account): created a real quotation → converted to an order → confirmed `GET .../agreement` correctly 409s before approval → approved it → confirmed the agreement now renders as HTML → confirmed a second approve attempt correctly 409s → confirmed `READY_FOR_DELIVERY` is blocked by the PDI gate first (order had unchecked PDI items) → attached a signed-document URL → checked off every PDI item → confirmed `READY_FOR_DELIVERY` now succeeds with both gates satisfied. All test records (order, its PDI items and status history, the quotation) deleted afterward.

## Explicitly deferred (not built yet)

| BRD reference | What's missing | Why deferred |
|---|---|---|
| VIN-level stock allocation on `SalesOrder` | Real-time check against an OEM/ERP allocation system | No such system exists in this codebase (§18) |
| Real SMS/WhatsApp delivery, FR-601/602 | Actual provider integration behind the Phase 4/5 placeholder functions | Blocked on choosing and provisioning a provider (Twilio / Africa's Talking / Meta Cloud API / etc.) — business decision, not yet made |
| Multi-month CSI trend | Historical trend line beyond the current month's average | Needs a few months of real response data to be meaningful |
| §18 ERP/OEM integration | Real-time parts/invoice posting to an ERP; OEM Warranty/Parts/Allocation portals | No ERP exists in this codebase — this repo *is* the operational system, there's no separate ERP to integrate with today |
| §36 Data migration | N/A — no legacy paper data to migrate for this codebase | Not applicable |
| Offline-tolerant technician tablets, NFR-02 | Local queue + sync on reconnect | No dedicated technician-tablet client exists; the admin panel assumes connectivity |
| Multi-branch, §4.3 | `branchId` on workshop entities | Single-branch for now, consistent with the rest of this codebase |
| Full invoicing (UC-10 Generate Invoice) | Job cards have an `invoiceAmount` field but no line-item invoice, AR posting, or ERP voucher reference | No ERP/AR system exists to post to |

## Suggested next phase

Phase 15 connected the showroom QR flow into the `SalesOrder` pipeline; Phase 16 added sales
approval + agreement + e-sign/attach. Comparing what's left against the full CRM pipeline diagram
the user provided (`CRM/Leads → QR Self-Register → Vehicle Selection → Quotation → Reservation/
Booking → Credit/Financing → Sales Quotation Approval → Generate Agreement → e-sign/attach →
Vehicle Allocation → PDI → Registration → Invoice → Payment → Delivery → Commission →
Warranty/Service`), three stages genuinely don't exist in any form yet:
- **Sales Invoice** — `JobCard.invoiceAmount` exists for workshop repairs; `SalesOrder` has no
  line-item invoice at all.
- **Commission tracking** — doesn't exist in any form.
- **Vehicle Registration tracking** — no stage between PDI and Invoice records government
  registration/plate info on an order.

Two diagram stages remain permanently blocked, same reasoning as everything else in "Explicitly
deferred" below: **Vehicle Allocation** (needs a real ERP/OEM system that doesn't exist here) and a
**real payment gateway** (Chapa/Telebirr/etc. — still mock-only, no vendor chosen).

Every named Functional Requirement in the BRD's §6.1 CRM & Showroom section (FR-101 through
FR-106) has baseline coverage, Phase 12 closed the last deferred item that was actually buildable
without an external dependency, and Phase 14 closed the one shipped-phase scope cut that had no
external blocker. **Everything remaining in "Explicitly deferred" above is now either blocked on a
business decision or on infrastructure this codebase doesn't have** — there is no more
self-contained, no-dependency slice left to pick by default:

- **Real SMS/WhatsApp delivery** — confirmed pending per the user; don't re-ask, it stays pending
  until a provider choice is brought.
- **Multi-month CSI trend** — needs a few months of real survey response data to be meaningful;
  revisit once that data exists, not before.
- Everything else (VIN-level allocation, §18 ERP/OEM integration, offline-tolerant tablets,
  multi-branch, full invoicing) needs infrastructure — an OEM API, a tablet client, a second
  branch, an ERP — that doesn't exist in this codebase and isn't something to build speculatively.

**When picking this up again: ask the user.** There's no remaining item where building it
unprompted is clearly the right call the way Phase 12 was.

**When picking up this document again:** there is no more low-hanging, clearly-scoped FR left
unbuilt in the SWMS/CRM proposal — the reasonable next steps are either (a) revisiting an already
"delivered" phase's documented scope cuts if real usage has shown one matters more than assumed
(e.g. multi-month CSI trend, once a few months of data exist), or (b) a genuinely new ask outside
this document's scope entirely. Ask the user rather than picking one. Also: re-check whether any
other part of the codebase is under active parallel development before touching adjacent files —
`git status`/`git log` first, as the configurator was mid-flight during Phase 8.
