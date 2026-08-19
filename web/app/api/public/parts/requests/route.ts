import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { sendFormEmail } from '@/lib/form-email';

/**
 * POST /api/public/parts/requests
 * Submit a parts request / quote from the public parts page cart.
 */
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.partsRequest);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const body = await request.json();

    const { name, company, phone, email, address, notes, items } = body;

    if (!name || !phone || !email) {
      return NextResponse.json(
        { success: false, error: 'Name, phone and email are required' },
        { status: 400 }
      );
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one part is required' },
        { status: 400 }
      );
    }

    // Normalize items
    const normalizedItems = items.map((item: any) => ({
      partId: item.partId || null,
      partName: item.partName || 'Unknown part',
      partSku: item.partSku || null,
      unitPrice: Number(item.unitPrice) || 0,
      quantity: Math.max(1, Number(item.quantity) || 1),
    }));

    const partRequest = await prisma.partRequest.create({
      data: {
        name,
        company: company || null,
        phone,
        email,
        address: address || null,
        notes: notes || null,
        status: 'new',
        items: {
          create: normalizedItems,
        },
      },
      include: { items: true },
    });

    let notificationSent = false;
    try {
      notificationSent = await sendFormEmail({
        type: 'parts request',
        name,
        email,
        phone,
        subject: `New parts request${company ? ` — ${company}` : ''}`,
        reference: partRequest.id,
        details: JSON.stringify({ address, notes, items: normalizedItems }, null, 2),
      });
    } catch (emailError) {
      console.error('[parts-request:email]', emailError);
    }

    return NextResponse.json({ success: true, request: partRequest, notificationSent }, { status: 201 });
  } catch (error) {
    console.error('Error creating part request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit request' },
      { status: 500 }
    );
  }
}
