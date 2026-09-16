# CRM Workflow Backlog

Source of truth for how the current build maps to the full 96-step quotation
→ delivery → warranty → service → loyalty → repeat-purchase workflow spec.
Replaces the deleted `SWMS-INTEGRATION-BACKLOG.md` / `ADMIN-IA-BACKLOG.md`
(removed in `bc50dfa`) as the project's authoritative backlog doc — read this
before scoping any new CRM/workshop work.

Architecture: `backend/` (Express) holds the sole Prisma schema and all
business logic/routes. `apps/admin` and `apps/web` are pure Next.js
frontends calling it over HTTP via a `/api/*` rewrite.

## Status legend

- **DONE** — built and working
- **FIXED** — this round: found broken/missing, now fixed
- **PARTIAL** — works but with a known gap
- **BLOCKED** — deliberately out of scope, needs a business/infra decision

## §01–04 — Quotation, approval, agreement (DONE)

- Least-loaded sales-agent auto-assignment: real scoring engine
  (`backend/src/services/sales/assignSalesRep.ts`), not a stub.
- Manager approval chain on the Quotation (approve/reject/discount-approval),
  e-signature embedded in the regenerated PDF
  (`backend/src/routes/quotations.routes.ts`).
- Customer e-signs the Quotation PDF itself (`apps/web/app/quotation/
  [reference]`), distinct from the later Sales Agreement signature.
- Auto-conversion to SalesOrder on customer signature
  (`convertQuotationToOrderService`).
- Sales Agreement: customer sign (`apps/web/app/agreement/[orderId]`) then
  manager countersign, gated in that order
  (`backend/src/routes/orders.routes.ts` `/countersign`).

## §05 — Payment (PARTIAL / BLOCKED)

- Mock "pay now" + bank-transfer-proof upload + a distinct staff
  verification step (`POST /orders/:id/payment/confirm`) all exist and are
  gated behind the manager countersignature.
- **FIXED this round**: a successful mock-pay now atomically records
  `paymentMethod`/`paymentReferenceNo`/`amountPaid` at the moment of
  success (`salesOrderRepository.updatePaymentStatusPaid`), instead of
  leaving them to be entered later, disconnected, during invoicing. The
  payment page/API now also shows the real outstanding balance
  (`totalPrice - amountPaid`), not always the full total.
- **FIXED this round**: added a distinct finance **verification** step
  (`SalesOrder.paymentVerifiedAt/paymentVerifiedById`,
  `POST /orders/:id/payment/verify`, gated on `canCountersignAgreements`) —
  the `READY_FOR_DELIVERY` gate now requires this, not just
  `paymentStatus === 'PAID'`, so an unreviewed online "pay now" success can
  no longer unblock delivery on its own.
- **BLOCKED**: no real payment gateway (Chapa/Telebirr/Stripe/etc.) — needs
  a vendor decision from the business. Left as-is.

## §06 — Vehicle inventory & allocation (PARTIAL / BLOCKED)

- `Vehicle` is an aggregate sales-catalog listing (single `stock` counter);
  `VehicleAllocation.vin` is a free-text field, not a real per-unit
  inventory row.
- **FIXED this round**: `VehicleAllocationStatus` (`RESERVED|ALLOCATED|
  RELEASED|DELIVERED`) is now actually enforced end-to-end instead of every
  row sitting at `RESERVED` forever. `vehicleAllocationService.allocate()`
  reserves a stock unit (rebalancing stock correctly on a vehicle swap); a
  new distinct `POST /orders/:id/allocation/allocate` step
  (`RESERVED -> ALLOCATED`, gated on `paymentVerifiedAt`) locks a specific
  VIN to the order; releasing now flips to `RELEASED` (returning the stock
  unit) instead of hard-deleting the row, so allocation history survives.
  The `READY_FOR_DELIVERY` gate now also requires `ALLOCATED`. New
  "Allocate" button in `OrderAllocationPanel.tsx`.
- **BLOCKED**: real VIN-level inventory (intake/goods-receipt against a
  real OEM/ERP feed) still doesn't exist in this codebase — the fix above
  makes the *local* allocation ledger's own state machine correct, it
  doesn't add real per-unit inventory. Left as-is.

## §07 — PDI (FIXED)

- Was a bare checkbox (`isChecked`) with no fail state, no evidence, no
  reinspection loop.
- Now: `PdiChecklistItem.result` (`PENDING|PASS|FAIL|NA`) +
  `photoUrls`/`notes`/`resolvedAt`/`resolvedById`. A FAIL blocks delivery
  until resolved and reinspected back to PASS/NA. `isChecked` kept in sync
  for any other reader. UI: `OrderDetail.tsx`'s `PdiItemRow`.

## §08–11 — Delivery, handover (DONE)

- Delivery readiness gate combines PDI + agreement + countersignature +
  payment + payment-verified + allocation + registration + invoice
  (`order.service.ts` `getTransitionBlockReason`).
- Separate handover signature pair (customer sign + manager countersign),
  distinct from the agreement signature pair.
- Handover document package generator (`orderHandover.service.ts`).
- **FIXED this round — manager delivery approval/hold**: new
  `deliveryHold`/`deliveryHoldReason` fields; a manager can explicitly hold
  a `READY_FOR_DELIVERY`-eligible order back even once every other gate is
  clear (`POST /orders/:id/delivery-hold`, `Delivery Approval` card in
  `OrderDetail.tsx`).
- **FIXED this round — schedule handover**: the previously-missing
  "when is the customer picking up the car" step now exists —
  `SalesOrder.deliveryScheduledAt`, a token-gated customer page
  (`apps/web/app/delivery-schedule/[orderId]`) reachable from a new
  "Schedule / Confirm Handover" link in the ready-for-delivery email, and a
  confirmation fan-out to customer/agent/manager once scheduled.
- **FIXED this round — "ready for delivery" and "delivered" customer
  emails**: neither existed before (only the internal `warranty_registered`
  notification fired on delivery) — added both, each with a
  "Check Order Status" CTA.

## §12 — Warranty registration (FIXED)

- Was a manual admin-button-only action despite its own docstring claiming
  it ran automatically on delivery.
- Now: `warrantyService.registerWarranty()` is called automatically from
  `orderService.transitionWithCommission()` when an order reaches
  `DELIVERED` (non-blocking — a failure here doesn't undo the delivery).
  The manual button remains as a fallback/correction path.
- Added a warranty certificate PDF (`services/pdf/warrantyCertificate.pdf.ts`),
  attached to the registration email.
- **FIXED this round**: `Warranty.vin` was never actually populated (the
  `create()` call omitted it even though the certificate PDF already read
  it) — now looked up from the order's `VehicleAllocation` at registration
  time.
- **FIXED this round**: the spec's "permanent ownership profile" was never
  created from a sales delivery — only from the workshop check-in flow, so
  a car sold but never yet serviced had no `CustomerVehicle` at all. Now
  find-or-created automatically on the `DELIVERED` transition (dedupes by
  phone, same convention as everywhere else in this schema).

## §13 — Customer/vehicle profile, unified history (FIXED)

- No domain model (Quotation/SalesOrder/WarrantyClaim/ComplaintCase/
  Warranty) carries a real `customerId` FK — all match by free-text phone.
- Added `GET /api/customers/:id/history`, aggregating by phone (and VIN for
  the customer's known vehicles) across all five models, plus the new
  loyalty account. Rendered as new sections on the admin Customer detail
  page (`CustomerDetail.tsx`), alongside the pre-existing workshop-only
  service-history tab.
- **FIXED this round**: the aggregation omitted `Lead` and `JobCard` even
  though both are real models tied to the same customer — added to the
  same `Promise.all`.

## §14 — Service reminders (FIXED, still PARTIAL on automation infra)

- Was date-only (`nextServiceDate`); `nextServiceKm` existed but was never
  compared against anything, and reminders only fired on a manual admin
  button click.
- Now: `getUpcomingServices()` also flags a warranty when the vehicle's
  latest known mileage (`CustomerVehicle.mileageLastKnown`, matched by VIN)
  is within 1,000 km of `nextServiceKm`. A daily `node-cron` job
  (`backend/src/jobs/serviceReminders.cron.ts`) now triggers
  `sendServiceReminders()` automatically — no external cron infra needed
  since `backend` is a long-running process.

## §15–19 — Workshop job card lifecycle (FIXED — was more broken than it looked)

Investigating this phase surfaced that the entire job-card status/parts
workflow silently no-op'd through the real admin UI, on top of the features
this round was meant to add:

- **Field-name mismatches, fixed**: the UI sent `toStatus` to
  `PATCH /job-cards/:id/status` (route read `status` → always `undefined` →
  Prisma silently skipped the write, so no job card ever changed status
  through this button); the UI sent `action: 'issue'|'backorder'|'cancel'`
  to the parts-line route (route read `status` → same silent no-op); the UI
  sent `{ approve: true }` to the generic PATCH route (`approve` isn't a
  real column → threw). All three now work.
- **Dead, contradicting code deleted**: `jobCardService.ts` /
  `jobCardStateMachine.ts` (backend) used status names that don't exist in
  the real `JobCardStatus` enum and were never imported by any route.
- **Frontend status vocabulary fixed**: `apps/admin/lib/services/workshop/
  jobCardStateMachine.ts` used a made-up draft/open/assigned/... vocabulary
  sharing no value with the real enum — every status badge rendered blank
  and the generic "next status" buttons always showed nothing for a real
  job card. Rewritten with the real enum values, real transitions, and a
  new `RELEASED` value at the end.
- **Parts stock decrement wired**: issuing a part now actually decrements
  `SparePart.stock` transactionally (via the previously-unwired
  `jobCardPartsService.issuePart`) instead of only flipping a status label.
- **Part-request creation fixed**: the "Request Part" button was missing
  required `unitPrice`/`requestedById` and always threw; now the server
  snapshots the current price and stamps the requester.
- **Quality-check gate added**: `qcPassed`/`qcNotes`/`qcById` existed but
  were never enforced — `INVOICED_CLOSED` now requires a recorded pass.
- **Service invoice + payment added**: `JobCard` gained
  `laborAmount`/`invoiceNo`/`paymentStatus`/`paidAt`; new
  `POST /job-cards/:id/invoice` (parts + labor, PDF via
  `services/pdf/serviceInvoice.pdf.ts`, emailed) and
  `POST /job-cards/:id/payment`.
- **Vehicle release added**: new terminal `RELEASED` status, gated on
  `paymentStatus === 'PAID'`.

## §20–22 — CSI survey, complaints, warranty claims (DONE, pre-existing)

- CSI survey (`CSISurveyResponse`), Complaint case management
  (`ComplaintCase`/`ComplaintNote`), and service-side `WarrantyClaim` all
  already existed with working routes/admin pages — confirmed still
  correct, untouched this round.
- **FIXED this round**: `apps/admin/lib/services/workshop/
  warrantyClaimStateMachine.ts` had the same made-up-status-vocabulary bug
  the job-card one did before (see §15–19) — its lowercase vocabulary
  (`draft/submitted/.../parts_ordered/in_repair/completed`) shared zero
  values with the real `WarrantyClaimStatus` enum
  (`DRAFTED|SUBMITTED|UNDER_REVIEW|APPROVED|REJECTED|REIMBURSED`), so every
  status badge rendered blank and the "advance status" buttons never
  showed any option for a real claim. Rewritten to the real enum values,
  matching the backend's own transition table in
  `warrantyClaim.service.ts` exactly.

## §23 — Loyalty, campaigns (net-new, FIXED — was completely absent)

- No loyalty/points/tier/VIP model existed anywhere.
- Added `LoyaltyAccount` (customerId, points, tier `BRONZE|SILVER|GOLD|VIP`)
  + `LoyaltyTransaction` ledger. Points earned automatically (flat 1 point
  per 1,000 ETB) on a SalesOrder reaching `DELIVERED` and a JobCard reaching
  `RELEASED`, both non-blocking. Rendered on the Customer detail page.
- Connected the existing age/mileage-based `UpgradeOpportunity` detection
  (`repeatPurchaseService.detectOpportunities()`) to the plain-CMS
  `Promotion` model via a new optional `promotionId` — a light link, not a
  new targeting engine. Shown as a "Campaign" column on the admin
  Repeat Purchase list.
- **FIXED this round**: marking an `UpgradeOpportunity` `WON` only stamped
  `wonAt`/`wonById` — it never actually started a new lead/quotation,
  contradicting the spec's "existing customer -> new interest -> new lead
  -> new quotation" step. Now calls the existing `quotationService.create()`
  (same one `POST /quotations/submit` uses) with the opportunity's
  customer/target model, tagged `source: 'repeat-purchase'`.

## §24 — Trade-in / repeat purchase (FIXED — confirmed live bug)

- `POST /api/public/trade-in` spread the raw request body straight into
  `prisma.quotation.create()`; the public form's actual fields
  (`firstName`/`currentMake`/`currentMileage`/etc.) don't match `Quotation`
  columns and `customerName`/`phoneNumber` were never populated — **every
  real submission threw**.
- Fixed: builds a real `Quotation` (name/phone mapped correctly, a proper
  reference number) linked via a new `Quotation.tradeInEvaluationId` to a
  real `TradeInEvaluation` row (condition/mileage/accidents/modifications/
  service-history/photos) instead of discarding that data. `TradeInEvaluation.
  leadId` made optional (existing Lead-linked path untouched).
- Added a photo-upload field to the public form (previously missing) and an
  admin panel rendering/approving the evaluation on the Quotation detail
  page (previously had a full backend CRUD API with zero UI).

## §00 — Cross-cutting: notification links + signature/edit locking (FIXED)

A later round re-checked the whole spec against two things it repeats at
almost every step: every email carrying its expected link, and every
signature step actually being **embedded into the PDF** (not just an
attached photo) and **locking** the document afterward.

- `NotificationPayload` gained an optional `ctas?: {label,url}[]`, rendered
  as styled buttons by `buildNotificationHtml`
  (`backend/src/services/email/notifications.dispatch.ts`) — previously any
  link was just a plain hyperlink line, with no way to show two distinct
  CTAs (e.g. "Check Status" + "Review & Sign"). Added the missing CTA (most
  commonly a "Check Status" link) to: the quotation-submitted confirmation,
  agent-assignment, manager-approval-needed, quotation-approved,
  send-quotation, sales-order-created, send-agreement,
  customer-signed-agreement, and invoice emails.
- **Quotation edit lock**: `PUT /api/quotations/:id` applied `req.body`
  with zero status check — now blocked (423) once a generated quotation is
  pending manager approval, and fully locked once the customer has signed
  (`signedAt` set); regenerating the PDF is likewise blocked post-sign.
  Re-signing an already-signed quotation is now rejected (409).
- **Quotation PDF snapshot**: `Quotation.pdfUrl`'s doc comment claimed it
  "captures the exact PDF the customer saw at signing time" but was never
  actually written anywhere — now persisted as a real file at every
  regeneration/approval/customer-sign point.
- **Agreement "fully executed" lock**: `PATCH /api/orders/:id` let any
  field be edited with no guard on `countersignedAt`, even though the
  agreement PDF renders live from those fields — now blocks edits to the
  agreement-relevant field set once countersigned (a correction needs a new
  version), while unrelated fields (e.g. `registrationNumber`) stay
  editable.
- **Audit trail**: `approve`/`send-agreement`/customer-sign/`countersign`
  never wrote to the audit log — added, so the spec's
  Created→Sent→CustomerSigned→Countersigned→FullyExecuted trail is actually
  queryable, not just inferable from timestamp columns.
- A public `SalesOrder` status lookup by `orderNo` (`SO-<n>`) was added to
  `GET /api/public/status` — `orderService.getStatusByOrderNo` and its
  repository method already existed correctly but had no route calling
  them until now.

Verified via a full disposable quotation→order→delivery run through real
authenticated HTTP calls against the live dev backend (submit → assign →
price → lock-while-pending → manager-approve → send → customer-sign →
lock+snapshot → auto-order → agent/manager approve+send+countersign
agreement → lock → payment record+verify → reserve+allocate vehicle → PDI
→ ready-for-delivery gate → hold/release → invoice → delivered → warranty
VIN + CustomerVehicle → public status lookup → audit trail) — all
mechanical/gate checks passed; the only "failures" were this dev
environment's pre-existing SMTP TLS issue (self-signed certificate,
confirmed present on real, unrelated notifications from before this
session too — not something this round introduced or was asked to fix).

## Explicitly out of scope

- **Real VIN-level vehicle inventory / ERP-OEM allocation** — needs a real
  intake/goods-receipt system and an OEM feed this codebase doesn't have.
- **Real payment gateway** (Chapa/Telebirr/Stripe/etc.) — needs a vendor
  decision from the business.
- **SMTP TLS trust issue** in this dev environment (`self-signed
  certificate in certificate chain` — every outbound email fails this way,
  confirmed pre-existing and unrelated to any code in this repo) — an
  infra/certificate fix, not an application change.

## Known gaps not addressed this round (found, not fixed)

- PDI-checklist creation is still triggered at order creation, not at
  vehicle allocation as the spec's step order implies — functionally
  inert difference (the delivery gate still requires it complete), not
  worth the risk of moving.
- Full campaign/segmentation engine — `Promotion` stays a plain CMS banner;
  only the existing light `promotionId` tag on auto-detected
  `UpgradeOpportunity` rows exists.

## Round 3 — Service booking fix, loyalty program, service history, notification gaps (FIXED)

### §15 (service booking) — FIXES

- **Public API bypassed the service layer**: `POST /api/public/service-bookings`
  did a raw `prisma.serviceBooking.create()` — no reference generated, no
  confirmation email sent, frontend received `{ id }` instead of `{ reference }`.
  Now wired through `serviceBookingService.create()` which generates a
  `GY-SB-DDMMYYYY-NNN` reference, sends confirmation email, and returns
  `{ reference, bookingId }`.
- **Schema mismatch**: frontend sent `timeSlot`, `vehicleYear`, `mileage`,
  `vin`, `location`, `firstName`/`lastName` — none existed on the
  `ServiceBooking` model. Added all missing columns as optional fields.
- **`updateStatus()` was a no-op**: found the booking but never wrote the
  update. Added `serviceBookingRepository.updateStatus()` and wired it.
- **Admin "New Service Booking" form non-functional**: had static inputs with
  no submit handler, no form registration, no API call. Rewritten as a client
  component with react-hook-form, wired to `POST /api/service-bookings`.
- **Stats route case mismatch**: counted lowercase statuses (`'scheduled'`)
  while the model default was uppercase. Fixed to match.
- **Admin list hardcoded `pageSize: 100`**: reduced to 50 and added proper
  pagination support.

### §14 (loyalty) — FIXES

- **Redemption logic missing**: `loyaltyService.redeemPoints()` created —
  deducts points, records negative-point transaction, guards against
  insufficient balance, recomputes tier.
- **Manual adjustment**: `loyaltyService.adjustPoints()` for admin bonus/
  correction with audit trail.
- **Loyalty routes**: new `loyalty.routes.ts` with admin endpoints for
  listing, analytics, tier benefits, adjust, redeem. Public lookup by phone
  at `GET /api/public/loyalty/:phone`.
- **Tier-based benefits**: `TIER_BENEFITS` config maps BRONZE/SILVER/GOLD/VIP
  to tangible perks (free inspections, parts discounts, priority booking,
  loaner vehicles, etc.).
- **Referral bonus**: `awardReferralBonus()` awards 500 points when a
  referred customer completes a purchase.
- **Points expiry**: `POINTS_EXPIRY_MONTHS = 24` constant defined (schema
  comment notes no time-decay was modeled; this adds the config for future
  implementation).
- **Tier-change notifications**: `earnPoints()` now dispatches a notification
  when the customer's tier changes (upgrade or downgrade).
- **Points-earned notification**: customer receives an email when points are
  awarded.
- **Admin loyalty management page**: `/admin/loyalty` with analytics tiles,
  tier benefits display, account listing with search/filter, points
  adjustment modal.
- **Customer loyalty portal**: `/account/loyalty` with points display, tier
  progress bar, benefits list, transaction history, and phone-based lookup
  for non-logged-in users.
- **Loyalty link added to account page**: quick action card for loyalty
  points.

### §14 (service history) — FIXES

- **Customer service history page**: `/account/services` shows past and
  upcoming service appointments with status, date, vehicle, technician,
  and links to status tracking.
- **Public service history API**: `GET /api/public/service-history/:phone`
  returns bookings by phone number.
- **Service history link added to account page**: quick action card.

### §14 (service reminders) — FIXES

- **Booking link in reminder emails**: service reminder notifications now
  include "Book Service" and "Check Status" CTA buttons linking to the
  public service page.

### §00 (notification gaps) — FIXES

- **Agent notification on quotation sent**: when a sales agent sends an
  approved quotation to the customer, the agent now receives a notification
  confirming the send.
- **Agent/manager notification on delivery**: when an order reaches
  `DELIVERED`, both the assigned sales agent and all managers receive
  notifications (previously only the customer was notified).
- **Warranty claim notifications**: `warranty_claim` type was defined but
  never dispatched. Now sends notifications to the customer on `APPROVED`
  and `REJECTED` status changes.

### Dead code cleanup

- Deleted `backend/src/services/handover/handover.service.ts` (61 lines) —
  superseded by `orderHandover.service.ts`, not imported by any route.
  Removed export from `services/index.ts`.

## Explicitly out of scope (unchanged)

- **Real payment gateway** (Chapa/Telebirr/Stripe/etc.) — needs a vendor
  decision from the business.
- **Real VIN-level vehicle inventory / ERP-OEM allocation** — needs a real
  intake/goods-receipt system and an OEM feed this codebase doesn't have.
- **SMTP TLS trust issue** in this dev environment — an infra/certificate
  fix, not an application change.

## Remaining known gaps

- PDI-checklist creation is still triggered at order creation, not at
  vehicle allocation (functionally inert).
- Full campaign/segmentation engine — `Promotion` stays a plain CMS banner.
- Points expiry logic is configured (`POINTS_EXPIRY_MONTHS = 24`) but not
  yet wired to a cron job that actually expires stale points.
