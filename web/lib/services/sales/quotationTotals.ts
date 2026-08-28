// Browser-safe quotation pricing helpers. Keep PDF/file-system code out of
// client components that only need to display the agreed total.
export const QUOTATION_VAT_RATE = 0.15;

export function computeQuotationTotals(unitPrice: number, quantity: number, discountAmount: number) {
  const vehiclePrice = unitPrice * quantity;
  const taxableAmount = Math.max(0, vehiclePrice - discountAmount);
  const vatAmount = taxableAmount * QUOTATION_VAT_RATE;
  const totalPayable = taxableAmount + vatAmount;
  return { vehiclePrice, vatAmount, totalPayable };
}
