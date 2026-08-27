// Client-safe (no Node imports) file-extension sniffing for uploaded
// document URLs — a signed quotation/agreement/handover can be either an
// image or a PDF depending on how the customer submitted it (drawn
// signature stamped onto a PDF vs. a photo of a signed printout).
export function isPdfUrl(url: string): boolean {
  return /\.pdf($|\?)/i.test(url);
}
