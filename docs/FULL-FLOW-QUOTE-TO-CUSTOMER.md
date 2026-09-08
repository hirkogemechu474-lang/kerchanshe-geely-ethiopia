# Full Flow: Quote → Customer Page

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CUSTOMER JOURNEY FLOW                            │
└─────────────────────────────────────────────────────────────────────────┘

 ① PUBLIC QUOTE FORM                    ② BACKEND PROCESSING
 ┌──────────────────────┐               ┌──────────────────────────────┐
 │ /quote (web app)     │  POST         │ /api/quotations/submit       │
 │                      │ ──────────►   │                              │
 │ - Customer fills:    │               │ quotationService.create()    │
 │   name, phone, email │               │                              │
 │   vehicle, message   │               │ 1. Generate reference        │
 │   ID document        │               │ 2. Create Quotation row      │
 │                      │               │ 3. Auto-assign sales rep     │
 │ Submit → gets ref#   │  ◄──────────  │ 4. Send confirmation email   │
 └──────────────────────┘   reference   └──────────────────────────────┘
                                            │
                                            ▼
③ ADMIN QUOTATIONS PAGE                 ④ MANAGER APPROVAL
 ┌──────────────────────────┐            ┌──────────────────────────────┐
 │ /admin/quotations        │            │ /admin/quotations/:id        │
 │                          │            │                              │
 │ Sales rep sees:          │   approve  │ Manager reviews pricing      │
 │ - Customer info          │ ────────►  │ Sets unitPrice, discount,    │
 │ - Vehicle interest       │            │ VAT, payment terms           │
 │ - Can set pricing        │            │ Clicks "Approve"             │
 │ - Generate PDF           │            │ status → 'approved'          │
 │ - Send to customer       │            └──────────────────────────────┘
 └──────────────────────────┘                      │
                                                   ▼
⑤ CUSTOMER SIGNS QUOTATION              ⑥ CONVERT TO ORDER
 ┌──────────────────────────┐            ┌──────────────────────────────┐
 │ /quotations/sign/:token  │            │ /api/quotations/:id          │
 │                          │   convert  │    /convert-to-order         │
 │ Customer receives email  │ ────────►  │                              │
 │ with signing link        │            │ convertQuotationToOrder      │
 │ Reviews PDF, e-signs it  │            │ Service:                     │
 │                          │            │                              │
 │ status → 'accepted'      │            │ 1. Validate: approved +      │
 │ signedDocumentUrl saved  │            │    signed + has vehicle      │
 └──────────────────────────┘            │ 2. Create SalesOrder         │
                                         │ 3. Generate orderNo          │
                                         │ 4. Allocate vehicle (if in   │
                                         │    stock)                    │
                                         │ 5. Mark quotation converted  │
                                         │ 6. Seed PDI checklist        │
                                         │ status → 'BOOKED'            │
                                         └──────────────────────────────┘
                                                   │
                                                   ▼
⑦ ORDER LIFECYCLE                       ⑧ VEHICLE DELIVERY
 ┌──────────────────────────┐            ┌──────────────────────────────┐
 │ /admin/orders/:id        │            │ /api/sync/delivered-vehicle  │
 │                          │   deliver  │    /:orderId                 │
 │ Order Status Flow:       │ ────────►  │                              │
 │                          │            │ crmWorkshopSync              │
 │ QUOTED → BOOKED          │            │ .syncDeliveredVehicle()      │
 │   → FINANCING_PENDING    │            │                              │
 │   → READY_FOR_DELIVERY   │            │ 1. Find/create Customer      │
 │   → DELIVERED            │            │    (by phone lookup)         │
 │                          │            │ 2. Find/create CustomerVehicle│
 │ Prerequisites:           │            │    (by VIN/plate or model)   │
 │ - PDI 100% complete      │            │                              │
 │ - Agreement signed       │            │ Customer appears in:         │
 │ - Payment confirmed      │            │ /admin/customers             │
 │ - Vehicle registered     │            └──────────────────────────────┘
 │ - Invoice generated      │
 └──────────────────────────┘

⑨ CUSTOMERS PAGE (admin)
 ┌──────────────────────────────────────────────────────────────────┐
 │ /admin/customers                                                 │
 │                                                                  │
 │ CustomersList component:                                         │
 │ - fetch('/api/customers')  →  backend GET /api/customers         │
 │ - Prisma query: Customer + CustomerVehicle                       │
 │ - Search by: name, phone, plate, VIN                             │
 │                                                                  │
 │ Stats:                                                           │
 │ - Total customers                                                │
 │ - Total vehicles on file                                         │
 │ - Under warranty (green badge)                                   │
 │                                                                  │
 │ Each row links to → /admin/customers/:id                         │
 │   Shows: vehicles, job cards, warranty, editable fields          │
 └──────────────────────────────────────────────────────────────────┘
```

## Database Tables Involved

```
┌─────────────────┐      ┌────────────────────┐      ┌─────────────────┐
│   Quotation     │      │    SalesOrder       │      │    Customer     │
├─────────────────┤      ├────────────────────┤      ├─────────────────┤
│ id              │      │ id                 │      │ id              │
│ customerName    │─────►│ customerName       │─────►│ fullName        │
│ phoneNumber     │      │ customerPhone      │      │ phone           │
│ email           │      │ customerEmail      │      │ email           │
│ vehicleModel    │      │ vehicleModel       │      │ address         │
│ status          │      │ orderNo            │      └─────────────────┘
│ unitPrice       │      │ totalPrice         │              │
│ signedDocumentUrl│     │ status             │              │
│ assignedTo      │      │ paymentStatus      │              ▼
└─────────────────┘      │ registrationNumber │      ┌─────────────────┐
        │                 │ salesAgentId       │      │ CustomerVehicle │
        │ convert         └────────────────────┘      ├─────────────────┤
        └────────────────────────────────────────────►│ customerId      │
                                                      │ plateNo         │
                                                      │ vin             │
                                                      │ model           │
                                                      │ warrantyEndDate │
                                                      └─────────────────┘
```

## How Customers Get Created (3 Entry Points)

| Entry Point | When | Code Location |
|-------------|------|---------------|
| **1. Vehicle Delivery** | SalesOrder status → `DELIVERED` | `crmWorkshopSync.syncDeliveredVehicle()` |
| **2. Service Check-in** | Customer brings car for service | `service-check-in.routes.ts:122` |
| **3. Workshop Sync** | Job card completed, updates CRM | `crmWorkshopSync.syncServiceCompletion()` |

## Key Files

| File | Role |
|------|------|
| `apps/web/app/quote/page.tsx` | Public quote form |
| `backend/src/routes/quotations.routes.ts` | Quote CRUD + public submit |
| `backend/src/services/sales/quotation.service.ts` | Quote creation logic |
| `backend/src/services/sales/convertQuotationToOrder.service.ts` | Quote → Order conversion |
| `backend/src/services/sales/order.service.ts` | Order state machine |
| `backend/src/services/sync/crmWorkshopSync.ts` | Creates Customer on delivery |
| `backend/src/routes/customers.routes.ts` | Customer API (list, detail, update) |
| `apps/admin/components/admin/customers/CustomersList.tsx` | Admin customer list UI |
| `apps/admin/components/admin/customers/CustomerDetail.tsx` | Admin customer detail UI |
