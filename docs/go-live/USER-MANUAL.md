# Geely Ethiopia Admin Portal — User Manual

Kerchanshe Trading PLC · Version 1.0 (29 Sep 2026)
For: Sales Agents · Customer Attendants · General Manager

How the whole journey fits together is in the [Process Flow](PROCESS-FLOW.md).
This manual is the click-by-click guide for your part of it.

---

## 1. Getting in

1. Open the **admin login** page your manager sent you (production:
   `https://portal.kerchanshe.co/geely/admin/login`).
2. Sign in with your **work email** and the **temporary password** you were given.
3. **Choose your own password.** The first time you sign in, the portal takes
   you straight to *Choose your own password* and won't let you use anything else
   until you do. Enter the temporary password, then a new one: **10+ characters
   with at least one letter and one number**. Never share it or write it on the desk.
   Later, change it any time from your name (top-right) → **Change password**.
   Forgotten it? **Forgot password** on the login page emails you a code.
4. You land on **Executive Overview**. The left menu shows only what your role
   can use — if a page isn't in your menu, your role doesn't include it.

**Tips:** press `/` to jump to the menu search · the moon/sun icon switches dark mode ·
the arrow collapses the menu · the bell shows your notifications · your name (top-right) →
**Your profile** lets you set the **job title** printed beside your signature on documents.

**Signing out:** your name (top-right) → Sign out. Always do this on a shared computer.

---

## 2. Customer Attendant (attendance team)

Your job: register every visitor and know who came in today.

### 2.1 Register a walk-in customer
1. Menu **Sales & Workshop → Walk-in Registrations → New Registration**.
2. Fill **Customer Name** and **Phone Number** (required), then **Email**,
   **Vehicle Interest** (e.g. *Geely EX5*) and **Notes** if known.
3. Save. The customer appears in the walk-in list and in the day's showroom
   traffic, and **a sales lead is opened automatically**: the least-loaded Sales
   Agent is assigned and notified (with the managers). The confirmation names the
   lead reference and the agent — tell the customer who will look after them.
   Check the phone number twice: it is how the system recognises the same
   customer. If that number already has an open lead, the walk-in is linked to it
   instead of creating a duplicate.
4. If a row in the list shows **Open lead** instead of a reference (an older
   registration, or the automatic step failed), click it to open the lead.

### 2.2 Daily customer check
- **Walk-in Registrations** — search by name, phone or email; review today's list.
- **Showroom Visits** — visitors who scanned the showroom QR code and registered
  themselves, and what their visit led to (menu **Sales & Workshop → Showroom Visits**).
- **Manage Customers** — find an existing customer and their history before
  registering them again (avoid duplicates).
- **Manage Test Drives** — book and track test drives.
- **Sales Dashboard → Showroom traffic** shows today's visitor count.

End of day: compare your walk-in list + showroom visits to the day's real
footfall; tell your manager about any gap.

> A registration made by mistake can be deleted from the walk-in list (bin icon).
> Don't delete real customers.

---

## 3. Sales Agent

Your job: take a lead to a delivered car. Work the steps in this order; the
order screen tells you what is still missing.

### 3.1 Your leads and quotations
- Enquiries from the **website quote form** and from **showroom walk-ins**
  (registered by the attendant) are **assigned to you automatically** and you get a
  notification + email.
- **Phone enquiries:** open **Manage Quotations → Log a Lead**, fill in the customer
  and choose the lead source. If the customer already has an open enquiry (same
  phone number) the system reuses it instead of duplicating. Leads you log yourself
  are not auto-assigned — use the **Assigned to** panel on the quotation if it should
  belong to someone else.
- Menu **Sales & Workshop → Manage Quotations** lists everything. Open one to see
  the customer, vehicle, colour and options.

### 3.2 Price and generate the quotation
1. On the quotation, fill in the **Sales Quotation format details** (sales type, variant/battery,
   colour, delivery, payment terms, validity date, sales executive…).
2. Set the price and generate the **Sales Quotation PDF**.
3. **Submit for manager approval** — the GM is notified.
4. If the GM **returns** it, read the reason, fix, and resubmit.

### 3.3 Send to the customer
Once **approved** (the GM's signature is stamped on the PDF), send the quotation
to the customer. They get an email with **Review & Sign**; you get a
confirmation. When the customer signs, the quotation is **locked** and the
**Sales Order is created automatically**.

### 3.4 Order: agreement
Open **Manage Orders → the order**.
1. Complete/check the **Sales Agreement format details** (purchaser TIN, address,
   authorised rep, deposit, payment dates, delivery date/location, accessories…).
2. **Approve** the order, then **send the Sales Agreement**. The customer signs
   from their email link; the GM then countersigns. After countersign the
   agreement fields are locked.

### 3.5 Payment
- The customer pays by the online link or uploads a bank-transfer proof.
- When the money is in: **Confirm Payment**. The GM then does **Verify Payment**.
  Both are needed before delivery.

### 3.6 Vehicle
In the **Vehicle allocation** panel: **Reserve** a vehicle (takes one from stock),
then — once payment is verified — **Allocate** and enter the **VIN** to lock that
exact car to this order. **Release** returns it to stock if the deal falls through.

### 3.7 Pre-Delivery Inspection (PDI)
The checklist appears once a vehicle is allocated. **Every item must be Pass or
N/A** before the order can move to *Ready for Delivery*.
- **Fail**: add notes and photo evidence, save. A Failed item **blocks delivery**.
- After the repair, mark it **Pass** again (reinspection) — the fix is logged.
- **Email PDI report** (under the list): send progress/failures to yourself, the
  workshop managers, or the customer.

### 3.8 Delivery
When every gate is green the order moves to **Ready for Delivery**; the customer
gets a link to pick their handover time. Record **registration** and **invoice**,
then complete the **handover** (customer signs, GM countersigns) and mark
**Delivered**. Warranty, loyalty points and the customer's vehicle profile are
created automatically.

### 3.9 Check your day
**Dashboard → Sales Dashboard**: target pace (units and revenue, month-to-date),
quoted / ordered / paid **today**, quote-to-paid conversion, marketing activity and
showroom traffic. Open it first thing and again before you leave.

---

## 4. General Manager

Your job: approve, sign, verify, and watch the numbers.

### 4.1 Approvals waiting for you
Notifications (bell + email) arrive when something needs you. You can do:
- **Approve / return a quotation** — *Manager Approval* panel on the quotation.
  Approving stamps your signature on the PDF. A return needs a reason.
- **Countersign the Sales Agreement** — on the order, after the customer has signed.
- **Verify Payment** — on the order, after the agent confirms payment.
- **Delivery Approval** — *Hold Delivery* (with a reason) or *Release Hold* before
  Ready for Delivery.
- **Countersign the handover** at delivery.

Your **signature** is captured once through a one-time link sent to your email;
after that it is applied automatically every time you sign. Check your **job
title** under your name (top-right) → **Your profile** — it prints under your name.

### 4.2 Dashboards
| Dashboard | What it tells you |
|---|---|
| **Executive Overview** | Company-level performance |
| **Sales Dashboard** | Target pace, today's quotes/orders/payments, showroom traffic |
| **CRM Dashboard** | Customer pipeline, complaints, satisfaction, repeat purchase |
| **Workshop BI** | After-sales / maintenance: job cards, bays, technicians, turnaround |
| **Sales Targets** | Set and track monthly unit/revenue targets |

Also: **Manage Workflow** (where every order stands), **SLA Monitor** (overdue
steps), **Audit Log** (who did what, when).

---

## 5. What the customer sees
- **Quote request / test drive / service booking** forms on the public website.
- Emails with **Review & Sign** (quotation, agreement), a **pay** link, **Schedule /
  Confirm Handover**, and **Check Status** in every message.
- **Check Status** page: enter the reference (quotation) or order number
  (`SO-…`) to see progress.
- Customer account: loyalty points and service history.

---

## 6. If something goes wrong
| You see | Do this |
|---|---|
| A button is missing/greyed out | Read the message on the order — it names the step still needed |
| "Forbidden" / redirected to *Unauthorized* | That page isn't part of your role; ask your manager |
| Can't sign in | **Forgot password** on the login page (emails a code); still stuck → contact support |
| Customer didn't get an email | Check the address on the record; ask support to check the notification history |
| A number looks wrong | Note the order/quotation number and screenshot it before reporting |

**Reporting a problem** — send support: your name, the page, the order/quotation
number, what you clicked, what you expected, and a screenshot.
**Support contact:** ____________________ (fill in before distribution)

---

## 7. Data you must not enter during testing
Use **test customers** with obviously fake names (e.g. *Test Customer 01*) and
phone numbers you control. Do not use real customers' details — all test data is
erased on 30 Sep (night) before the 1 Oct launch.
