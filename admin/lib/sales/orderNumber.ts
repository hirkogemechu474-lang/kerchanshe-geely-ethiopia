import { prisma } from '@/lib/prisma';

/** Generates the next human-readable sales order number, e.g. "SO-1001" (mirrors lib/workshop/jobCardNumber.ts). */
export async function nextOrderNo(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: 'salesOrder' },
    create: { name: 'salesOrder', value: 1001 },
    update: { value: { increment: 1 } },
  });
  return `SO-${counter.value}`;
}

/** Generates the next human-readable sales invoice number, e.g. "INV-1001". */
export async function nextInvoiceNo(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: 'salesInvoice' },
    create: { name: 'salesInvoice', value: 1001 },
    update: { value: { increment: 1 } },
  });
  return `INV-${counter.value}`;
}

/** Generates the next formal sales quotation number, e.g. "SQ-2026-00001". */
export async function nextQuotationNo(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: 'salesQuotation' },
    create: { name: 'salesQuotation', value: 1 },
    update: { value: { increment: 1 } },
  });
  return `SQ-${new Date().getFullYear()}-${String(counter.value).padStart(5, '0')}`;
}
