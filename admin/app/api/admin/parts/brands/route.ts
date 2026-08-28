import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { listBrands, createBrand } from '@/lib/services/parts/partsContentService';

// GET – Fetch all part brands
export async function GET() {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const brands = await listBrands();

    return NextResponse.json({ brands });
  } catch (error) {
    console.error('Error fetching brands:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

// POST – Create a brand
export async function POST(request: NextRequest) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const result = await createBrand(body);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ brand: result.brand }, { status: 201 });
  } catch (error) {
    console.error('Error creating brand:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
