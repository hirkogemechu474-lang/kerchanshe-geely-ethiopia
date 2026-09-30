# User Acceptance Test (UAT) — Script and Sign-off

Geely Ethiopia Sales & After-Sales Portal · Kerchanshe Trading PLC
Test window: 30 Sep 2026 (from morning) · Clean-up: 30 Sep (night) · Launch: 1 Oct 2026

> This is a working draft built for this system. If Kerchanshe's standard
> solution-delivery procedure has its own UAT template, copy the test results
> and signatures from here into that template — the test cases stay the same.

**Environment:** ______________________ (URL)  **Build/commit:** ______________
**Testers:** Sales Agent ____________  Attendant ____________  GM ____________

Use *test customers only* (fake names, phone numbers you control). Record the
result of each case: **P** = pass, **F** = fail (write the defect number),
**B** = blocked. Screenshot every fail.

## A. Access & accounts

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| A1 | Each tester signs in with their own email + temporary password | Signed in; lands on Executive Overview | | |
| A2 | First sign-in with the temporary password | Taken straight to *Choose your own password*; other pages redirect back until it is changed | | |
| A2b | Enter a weak new password (short / no number / the old one) | Rejected with a clear message; a valid one (10+ chars, letter + number) is accepted and old one stops working | | |
| A2c | Sign out and use *Forgot password* | Code emailed; password reset works | | |
| A3 | Menu shows only role-appropriate pages (Attendant: no Quotations/Orders; Sales: no Users/Settings) | Matches the role table in the Process Flow | | |
| A4 | Attendant opens a page outside their role (e.g. `/admin/users`) | Sent to *Unauthorized*, no data shown | | |

## B. Customer registration (Attendant)

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| B1 | Register a walk-in with name + phone only | Saved; visible in Walk-in Registrations; a sales lead reference and agent name are shown | | |
| B2 | Register a walk-in with all fields | Saved with email, interest, notes | | |
| B3 | Try to save without a phone number | Blocked with a clear message | | |
| B4 | Search the walk-in list by name, phone, email | Correct row found | | |
| B5 | Customer scans the showroom QR and registers on their phone | Appears under Showroom Visits | | |
| B6 | Today's walk-ins/visits appear in Sales Dashboard showroom traffic | Counts match B1–B5 | | |
| B7 | The assigned Sales Agent checks their notifications | Bell + email for the walk-in lead; quotation visible under Manage Quotations | | |
| B8 | Register the same phone number again | Linked to the already-open lead; no duplicate quotation | | |

## C. Quotation (Sales Agent + GM)

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| C1 | Submit the website quote form as a customer | Customer gets confirmation email; a Sales Agent is assigned and notified | | |
| C2 | Agent logs a phone-enquiry lead (*Log a Lead*) | Quotation created; same phone again reuses the open one | | |
| C3 | Agent fills details, prices, generates the Quotation PDF | PDF shows correct customer, vehicle, price, terms | | |
| C4 | Agent submits for approval | GM is notified (bell + email) | | |
| C5 | GM returns it with a reason | Agent sees the reason; can edit and resubmit | | |
| C6 | GM approves | GM signature + title appear on the PDF | | |
| C7 | Agent tries to edit the quotation while approval is pending | Blocked with a message | | |
| C8 | Agent sends the quotation | Customer email has **Review & Sign** and **Check Status** | | |
| C9 | Customer signs from the email link | Quotation locked; Sales Order created automatically | | |
| C10 | Customer opens **Check Status** with the reference | Correct status shown | | |

## D. Order, agreement, payment, delivery (Sales Agent + GM)

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| D1 | Agent completes agreement details, approves order, sends agreement | Customer email with **Review & Sign** | | |
| D2 | Customer signs the agreement | Agent + GM notified | | |
| D3 | GM countersigns | Agreement fully executed; price/customer fields now locked | | |
| D4 | Customer pays by online link / uploads bank proof | Payment shows *pending review* or *paid* | | |
| D5 | Agent **Confirm Payment**; GM **Verify Payment** | Both recorded with time and person | | |
| D6 | Try to Allocate a vehicle before payment is verified | Blocked with a message | | |
| D7 | Agent Reserves, then Allocates a vehicle with a VIN | Stock reduces by 1 on reserve; VIN shown on the order | | |
| D8 | PDI: mark one item **Fail** with notes + photo | Order cannot go to Ready for Delivery; message names the failed item | | |
| D9 | Reinspect the item back to **Pass**; complete all items | "PDI complete" notification; gate clears | | |
| D10 | *Email PDI report* to sales / workshop / customer | Email received with progress (and failed items for staff) | | |
| D11 | GM puts the order on **Delivery Hold**, then releases it | Ready for Delivery blocked while held, allowed after release | | |
| D12 | Record registration and invoice; order moves to **Ready for Delivery** | Customer gets email with handover scheduling link | | |
| D13 | Customer schedules handover | Customer, agent, GM confirmed | | |
| D14 | Handover signed (customer) and countersigned (GM); mark **Delivered** | Status Delivered; delivered email sent | | |
| D15 | After delivery | Warranty registered with the VIN; customer vehicle profile exists; loyalty points added | | |

## E. Dashboards

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| E1 | Sales Agent opens Sales Dashboard after C–D | Quoted/Ordered/Paid **today** and conversion reflect what was just done | | |
| E2 | Attendant opens Sales Dashboard | Showroom traffic matches B6 | | |
| E3 | GM opens Executive Overview, CRM Dashboard, Sales Targets | Pages load with figures; no errors | | |
| E4 | GM opens **Workshop BI** (after-sales) after F | Job cards / turnaround figures reflect F | | |
| E5 | GM sets a monthly sales target | Target pace on Sales Dashboard updates | | |

## F. After-sales maintenance

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| F1 | Customer books a service on the website | Reference given; confirmation email; booking in admin | | |
| F2 | Vehicle check-in → job card opened | Job card linked to the booking/vehicle | | |
| F3 | Parts requested and issued | Spare-part stock reduces | | |
| F4 | Quality check passed → service invoice → payment → vehicle released | Each step enforced in that order | | |
| F5 | Warranty claim created and moved through review | Status changes are valid and logged | | |

## G. Safety & records

| # | Test | Expected | Result | Notes |
|---|---|---|---|---|
| G1 | GM opens the **Audit Log** | Signatures/approvals from the tests are listed with who/when | | |
| G2 | No unexpected error pages or blank screens during A–F | None | | |
| G3 | Emails arrive within a few minutes and links open the right page | Yes | | |

## Defect log

| Defect # | Case | What happened | Severity (Blocker / Major / Minor) | Owner | Status |
|---|---|---|---|---|---|
| | | | | | |

**Severity:** *Blocker* — cannot complete the business flow · *Major* — workaround exists · *Minor* — cosmetic.
**Acceptance rule (proposed):** no open Blockers; Majors have an agreed date; all of A, B, C, D, E pass.

## Known limits accepted at launch

1. Online payment is simulated plus bank-transfer proof; money is confirmed by staff (Confirm → Verify). No live payment-gateway yet.
2. Vehicle inventory is a per-model stock count; VIN is typed at allocation. No ERP/OEM stock feed yet.

## Sign-off

By signing, the undersigned confirm that the system was tested against the
cases above, the results recorded are accurate, and — subject to the defects
and limits listed — the system is **accepted for go-live on 1 October 2026**.

☐ Accepted   ☐ Accepted with conditions (list): ____________________________________
☐ Not accepted (reason): __________________________________________________

| Role | Name | Signature | Date |
|---|---|---|---|
| Geely — UAT approver | | | |
| Geely — GM | | | |
| Kerchanshe — Delivery lead | | | |
| Kerchanshe — Sales tester | | | |
| Kerchanshe — Attendance tester | | | |
