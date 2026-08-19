import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET - Fetch all quotations
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const quotations = await prisma.quotation.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ quotations });
  } catch (error) {
    console.error('Error fetching quotations:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  } 
}
