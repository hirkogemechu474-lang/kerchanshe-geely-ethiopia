import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listBenefits, createBenefit } from '@/lib/services/parts/partsContentService';

// GET – Fetch all part benefits
export async function GET() {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const benefits = await listBenefits();

    return NextResponse.json({ benefits });
  } catch (error) {
    console.error('Error fetching benefits:', error);
    return NextResponse.json({ error: 'Failed to fetch benefits' }, { status: 500 });
  }
}

// POST – Create a benefit
export async function POST(request: NextRequest) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const result = await createBenefit(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ benefit: result.benefit }, { status: 201 });
  } catch (error) {
    console.error('Error creating benefit:', error);
    return NextResponse.json({ error: 'Failed to create benefit' }, { status: 500 });
  }
}
