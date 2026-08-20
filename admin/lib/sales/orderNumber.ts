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
