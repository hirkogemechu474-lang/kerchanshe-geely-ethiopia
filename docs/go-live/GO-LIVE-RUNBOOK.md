# Go-Live Runbook — 1 October 2026

For the delivery lead / system administrator. Covers the six actions in the
go-live email: accounts, credentials, data clean-up, password confirmation,
UAT sign-off, and ongoing support.

| When | Action | Owner |
|---|---|---|
| Before accounts are created | **Deploy this release and update the production database schema** (section 0a) | Delivery lead / developer |
| Today | Back up DB · create accounts · send credentials + manual + process flow | Delivery lead |
| 30 Sep morning → evening | Team tests (see UAT script) · defects logged and fixed | Testers + developer |
| 30 Sep night | Final backup · clear test data · password check · deactivate demo accounts | Delivery lead |
| 30 Sep night / 1 Oct early | Obtain signed UAT acceptance | Delivery lead → Geely |
| 1 Oct | Launch · hyper-care support | All |

---

## 0a. Deploy the release and update the database (required, once)

This release adds three database fields (`User.mustChangePassword`,
`User.passwordChangedAt`, `WalkInRegistration.quotationId`), a new **Customer
Attendant** role, and a change-password page. Production must run the new code
**and** have the new columns, or logins will fail.

1. Deploy backend + admin + web from the new commit and restart them.
2. On the production server, in `backend/`: `npx cross-env NODE_ENV=production tsx scripts/prisma-cli.ts db push`
   (this project applies schema changes with `db push`, not `migrate dev`). It only **adds**
   columns; it will warn and stop if anything would be dropped — don't accept a drop.
3. Sanity check: sign in; open *Manage Users* and confirm "Customer Attendant" appears in the role list.

## 0. Before anything else: back up

```bash
pg_dump -Fc -h <host> -U <user> <dbname> > geely-before-<step>-YYYYMMDD-HHMM.dump
```
Take one before creating accounts and one **immediately before the clean-up**.
Test restore of the first one if you have never done it.

All scripts below run from the `backend/` folder on the **server that holds the
production database**. They read `.env.production` only when `NODE_ENV=production`
is set — otherwise they use `.env` (the local/dev database), so **prefix every
command with it** (`npx cross-env NODE_ENV=production tsx scripts/…`; on Linux
`NODE_ENV=production npx tsx scripts/…`). Each script prints the database it is
pointed at: check it before `--execute`. Every script that writes is a **dry run
by default**.

---

## 1. Create the user accounts

1. List the people in `users.json` (copy, fill, save — keep it out of git):
   ```json
   [
     { "name": "Full Name", "email": "name@kerchanshe.net", "team": "sales" },
     { "name": "Full Name", "email": "name@kerchanshe.net", "team": "attendance" },
     { "name": "Full Name", "email": "name@kerchanshe.net", "team": "gm" }
   ]
   ```
   Optional `"title"` overrides the job title printed on signed documents
   (defaults: *Sales Executive*, *Customer Attendant*, *General Manager*).

2. Team → system role (these are the real permission sets in the code):

   | Team | Role | Can do | Cannot do |
   |---|---|---|---|
   | `sales` | Sales | Quotations, orders, agreements, payment confirm, allocation, PDI, Sales Dashboard | Approve/countersign, verify payment, executive dashboards, users, settings |
   | `attendance` | Customer Attendant | Walk-in registration (opens a sales lead automatically), customers, showroom visits, test drives, Sales Dashboard | See or edit quotations, orders, prices, approvals, settings |
   | `gm` | GM Geely | Approve quotations, countersign agreements, verify payment, delivery hold, all dashboards incl. CRM and Workshop BI | Users, site settings |

   *Attendance note:* attendants have their own least-privilege role. Because it
   includes customer management, the menu also shows the customer-related pages
   (Loyalty, Satisfaction, Complaints, Repeat Purchase). They cannot see quotations,
   orders or prices.

3. Dry run, then create:
   ```bash
   npx cross-env NODE_ENV=production tsx scripts/provision-uat-users.ts users.json            # shows what would be created
   npx cross-env NODE_ENV=production tsx scripts/provision-uat-users.ts users.json --execute  # creates them
   ```
   - Existing emails are skipped, never overwritten — safe to re-run.
   - Each account gets a random 14-character password, written **only** to
     `credentials-<timestamp>.csv` next to `users.json`.
   - Each account is flagged to **choose its own password at first sign-in**: the
     portal blocks everything else until they do (minimum 10 characters, a letter and a number).

4. The GM and each Sales Agent should set up their **signature** (*Manage Users → Staff Signatures* →
   send the signature link) so documents carry a real signature.

5. (Optional) Give each Sales Agent a monthly target under *Dashboard → Sales Targets*
   so the Sales Dashboard's target-pace tiles show something real.

## 2. Send URL and credentials

- **Never put passwords in a group email or chat.** Send each person only their
  own row, by a private channel, and ask them to change it on first login.
- Delete `credentials-*.csv` from the server once sent.
- Message template (one per person):

  > **Subject:** Geely Ethiopia portal — UAT testing starts 30 Sep
  >
  > Dear <name>,
  >
  > Please start testing tomorrow morning.
  > **Admin portal:** https://portal.kerchanshe.co/geely/admin/login
  > **Customer website:** https://portal.kerchanshe.co/geely
  > **Your login:** <email>  ·  **Temporary password:** <password>
  >
  > 1. Sign in and change your password straight away (*Forgot password* on the login page).
  > 2. Read the attached User Manual (your role's section) and the Process Flow.
  > 3. Test using **fake customers only** — all test data is deleted on the night of 30 Sep.
  > 4. Follow the UAT script and log anything wrong (page, order number, what you did, screenshot) to <support contact>.
  >
  > Regards, <name>

- Attach: `USER-MANUAL.md`, `PROCESS-FLOW.md`, `UAT-TEST-SCRIPT-AND-SIGN-OFF.md`
  (export to PDF/Word if the team prefers).
- Check the URLs above match the real deployment before sending.

## 3. Clear the test data (30 Sep, night)

Keeps: users, vehicles/models/trims/colours/galleries, website content and
settings, news, FAQ, reviews, financing banks/programs, dealers, spare-parts
catalogue, technicians/bays, targets, chatbot knowledge.
Removes: customers, leads, walk-ins, showroom visits, test drives, quotations,
orders (+PDI, signatures, allocations, history), payments/commissions,
warranties, service bookings, job cards, claims, complaints, loyalty, surveys,
requests, chatbot conversations, newsletter sign-ups, notifications, audit log,
and the reference counters (first real order starts from 1). **Vehicle and
spare-part stock consumed by the tests is put back automatically.**

1. **Stop testers first** (tell them testing is over) and take the pre-clean-up backup.
2. Dry run — check the database name and row counts look like test data:
   ```bash
   npx cross-env NODE_ENV=production tsx scripts/clear-test-data.ts
   ```
   It stops by itself if a wipe would reach any real-data table.
3. Execute, typing the exact database name it printed:
   ```bash
   npx cross-env NODE_ENV=production tsx scripts/clear-test-data.ts --execute --confirm-db=<database name>
   ```
4. Run the dry run again — every count should be 0 (Counter rows appear again only after real use).
5. **Uploaded files are not deleted** (signed PDFs, payment proofs, PDI photos, quotation/agreement PDFs sit on disk with the website's other uploads). They are no longer referenced; clear out the test ones by hand, keeping vehicle/content media, or leave them — they are not visible to customers.
6. **Check by hand:** *Reviews* (testers may have submitted test reviews — unpublish/delete), *Messages*/contact forms, homepage content edited during testing, and the Sales Targets set for tests.
7. Sanity run: open the public site, the model pages and the admin dashboards — all figures should read zero, models should show stock.

## 4. Confirm passwords are changed

The portal now forces a change at first sign-in; this script is the proof:

```bash
npx cross-env NODE_ENV=production tsx scripts/verify-staff-passwords.ts credentials-<timestamp>.csv
```
- Lists every **active** staff account still on a handed-out temporary password,
  on the demo passwords from the seed (`ChangeMe123!`, `TestUser123!`), or flagged
  as not having chosen their own password yet.
  Prints nothing secret. **Exit code 1 = not all changed.**
- Also lists accounts that have never signed in.
- Fix by: asking the person to use *Forgot password*, or deactivating the account.
- **Do this before you delete the credentials CSV**, then delete it.

### Demo accounts — deal with them before launch
The database seed creates sample staff (`admin@geelyethiopia.com`,
`sales.manager@geelyethiopia.com`, `marketing@geelyethiopia.com` … and several
`hirkogemechu…@gmail.com` accounts) with **published default passwords**. If the
seed was ever run on production these are live logins, including Super Admin.
On the local dev database the check found 16 of 21 active staff accounts on one.

- The seed **no longer creates them when `NODE_ENV=production`** (set `SEED_DEMO_USERS=1` to override on purpose).
- Deactivate any that already exist — accounts are kept (records point at them) but can no longer sign in, and open sessions are ended:
  ```bash
  npx cross-env NODE_ENV=production tsx scripts/deactivate-demo-accounts.ts            # dry run: lists who
  npx cross-env NODE_ENV=production tsx scripts/deactivate-demo-accounts.ts --execute  # apply
  # keep specific real people who are still on a demo password:  --keep=a@x.com,b@y.com
  ```
  It refuses to run if it would leave no active Super Admin/Admin, and re-enabling is one click in *Manage Users*.
- Then re-run the password check until it passes.

## 5. UAT sign-off

- Send `UAT-TEST-SCRIPT-AND-SIGN-OFF.md` (as PDF/Word) with the completed results and defect log.
- Get it **signed by the Geely approver** — that signature is theirs to give; nothing in the system can substitute for it.
- If your standard solution-delivery procedure has its own form, use it and attach the results.
- Don't clear data until testing is finished; do get the sign-off **after** defects are closed. Keep the signed copy with the project records.

## 6. Post-launch support and enhancement

- **Hyper-care (1–7 Oct):** one named contact + one phone/WhatsApp; check the dashboards and the *SLA Monitor* each morning; review the **Audit Log** and notification failures daily.
- **Defect handling:** collect in one list (page, order number, steps, screenshot), triage Blocker/Major/Minor daily, fix Blockers same day.
- **Backlog already identified:**
  1. Live payment-gateway (Chapa/Telebirr) — needs a vendor decision.
  2. ERP/OEM stock feed for real per-VIN inventory.
  3. Lock down the file-upload endpoint to signed-in users only (it is currently open; public forms such as trade-in photos also use it, so this needs care).
  4. Enforce the first-login password change on the server as well (today the portal screens enforce it; the API itself does not block a flagged account).
  5. Trim the Customer Attendant menu (hide Loyalty/Satisfaction/Complaints/Repeat Purchase) with a finer permission.
- Daily database backup for the first month; keep the last 7.

## Risk checklist (tick before launch)

- [ ] Release deployed **and** production schema updated (section 0a)
- [ ] Pre-clean-up backup taken and restore-tested
- [ ] `verify-staff-passwords` passes (exit code 0)
- [ ] Demo accounts deactivated/deleted; at least one real Super Admin
- [ ] Test data cleared; dry run shows zeros; stock restored
- [ ] Emails arrive (SMTP configured on the production server) and links use the production URL
- [ ] Signed UAT acceptance received
- [ ] Support contact and hours published to the team
