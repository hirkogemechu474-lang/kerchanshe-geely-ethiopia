export interface QuotationLineItem {
  id?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  total?: number;
}

export interface QuotationTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
}

export function computeQuotationTotals(
  itemsOrUnitPrice: QuotationLineItem[] | number,
  optionsOrQuantity?: { taxRate?: number; currency?: string } | number,
  discountAmount?: number
): QuotationTotals & { totalPayable?: number } {
  const taxRate = (typeof optionsOrQuantity === 'object' ? optionsOrQuantity?.taxRate : undefined) ?? 0.15;
  const currency = (typeof optionsOrQuantity === 'object' ? optionsOrQuantity?.currency : undefined) ?? 'ETB';

  if (typeof itemsOrUnitPrice === 'number') {
    const unitPrice = itemsOrUnitPrice;
    const quantity = typeof optionsOrQuantity === 'number' ? optionsOrQuantity : 1;
    const discount = discountAmount ?? 0;
    const subtotal = unitPrice * quantity;
    const totalDiscount = discount;
    const taxable = subtotal - totalDiscount;
    const tax = taxable * taxRate;
    const total = taxable + tax;
    return { subtotal, discount: totalDiscount, tax, total, currency, totalPayable: total };
  }

  const items = itemsOrUnitPrice;

  const subtotal = items.reduce((sum, item) => {
    const lineTotal = item.quantity * item.unitPrice;
    const discount = item.discount || 0;
    return sum + (lineTotal - discount);
  }, 0);

  const totalDiscount = items.reduce((sum, item) => sum + (item.discount || 0), 0);
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    subtotal,
    discount: totalDiscount,
    tax,
    total,
    currency,
  };
}

export function formatCurrency(amount: number, currency: string = 'ETB'): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
