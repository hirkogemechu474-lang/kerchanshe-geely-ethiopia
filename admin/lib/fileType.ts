// Client-safe (no Node imports) file-extension sniffing for uploaded
// document URLs — a signed agreement or payment proof can be either an
// image or a PDF depending on how the customer submitted it, and the two
// need different preview treatment (<img> vs a "view PDF" link).
export function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}

// A handful of SalesOrder/Quotation fields hold a customer-submitted file
// (signed agreement, signed quotation, payment proof) that is always
// written to the WEB app's disk (web/public/uploads/...), never admin's —
// see web/app/api/agreement/[orderId]/sign/route.ts,
// web/app/api/public/quotations/[reference]/sign/route.ts, and
// web/app/api/public/orders/[orderId]/payment/proof/route.ts. The DB only
// stores the relative `/uploads/...` path (the same convention every other
// upload in this codebase uses), so rendering it directly in the admin app
// resolves against admin's own origin and 404s — the file only exists on
// the web app's server. `sales-agreement` (singular) is the one exception:
// that's admin's own staff "Attach Signed Copy" upload
// (OrderApprovalPanel.tsx), which lives in admin's own public/uploads and
// must stay relative.
const WEB_OWNED_UPLOAD_PREFIXES = ['/uploads/signed-agreements/', '/uploads/signed-quotations/', '/uploads/payment-proofs/'];

export function resolveDocumentUrl(url: string, webAppUrl: string): string {
  if (WEB_OWNED_UPLOAD_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    return `${webAppUrl.replace(/\/$/, '')}${url}`;
  }
  return url;
}
