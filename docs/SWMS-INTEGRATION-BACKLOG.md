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

## Explicitly deferred (not built yet)

| BRD reference | What's missing | Why deferred |
|---|---|---|
| FR-501 full vehicle warranty record | A `Customer`↔`Vehicle` ownership/warranty-record model; today's `warrantyStartDate/EndDate` are manually entered per job card, not derived from a vehicle record | Same architectural decision as the kiosk item below — needs its own scoping pass |
| UC-09 OEM portal integration | `WarrantyClaim.oemPortalRef` is a free-text field; no live API/EDI submission to an OEM warranty portal | No OEM portal integration exists in this codebase (§18) |
| Screen 3 Customer Self Check-in Kiosk, UC-04 trigger | Plate/VIN lookup kiosk flow; no vehicle-ownership table exists yet | Needs a `Customer`↔vehicle model decision first |
| FR-601–603, UC-10/12 Customer notifications | SMS/WhatsApp channel — only SMTP email exists today (`admin/lib/status-email.ts`) | No SMS/WhatsApp provider wired up anywhere in the repo |
| FR-602, UC-16 CSI Survey | Post-visit satisfaction survey + `CSISurveyResponse` model | Depends on notification channel above |
| Screen 8 Management BI Dashboard, FR-702–704 | Monthly KPIs (first-time-fix, revenue mix, CSI trend), OEM export | Only the live operational dashboard was built |
| §18 ERP/OEM integration | Real-time parts/invoice posting to an ERP; OEM Warranty/Parts/Allocation portals | No ERP exists in this codebase — this repo *is* the operational system, there's no separate ERP to integrate with today |
| §36 Data migration | N/A — no legacy paper data to migrate for this codebase | Not applicable |
| Offline-tolerant technician tablets, NFR-02 | Local queue + sync on reconnect | No dedicated technician-tablet client exists; the admin panel assumes connectivity |
| Multi-branch, §4.3 | `branchId` on workshop entities | Single-branch for now, consistent with the rest of this codebase |
| Full invoicing (UC-10 Generate Invoice) | Job cards have an `invoiceAmount` field but no line-item invoice, AR posting, or ERP voucher reference | No ERP/AR system exists to post to |

## Suggested next phase

With job cards, bays, parts issue, and warranty claims now built, the strongest remaining
candidates are: (1) **Customer notifications + CSI survey** (FR-601–603, UC-16) — needs an
SMS/WhatsApp provider decision first; or (2) **Management BI Dashboard** (Screen 8, FR-702–704) —
pure read-side work over data this codebase already has (job cards, parts, claims), no new
integration decision required. (2) is the lower-risk next slice since it has no external
dependency; (1) is the higher business-value one per the BRD's own executive summary but is
blocked on choosing an SMS/WhatsApp channel (see Dependencies in the BRD, §8.3).
