import { prisma } from '@/lib/prisma';

/** Generates the next human-readable job card number, e.g. "JC-1042" (BRD §15.2). */
export async function nextJobCardNo(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: 'jobCard' },
    create: { name: 'jobCard', value: 1001 },
    update: { value: { increment: 1 } },
  });
  return `JC-${counter.value}`;
}

/** Generates the next human-readable warranty claim number, e.g. "WC-1001" (BRD §15.2). */
export async function nextClaimNo(): Promise<string> {
  const counter = await prisma.counter.upsert({
    where: { name: 'warrantyClaim' },
    create: { name: 'warrantyClaim', value: 1001 },
    update: { value: { increment: 1 } },
  });
  return `WC-${counter.value}`;
}
