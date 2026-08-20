import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  const purchases = await prisma.message.findMany({
    where: { category: 'Vehicle Purchase' },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ purchases });
}
