import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { dealerRepository } from '@/repositories/dealerRepository';
import { createDealer } from '@/lib/services/dealers/dealerService';

// GET - List all dealers (supports search + filter)
export async function GET(request: NextRequest) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';
    const city = searchParams.get('city') || '';
    const region = searchParams.get('region') || '';
    const type = searchParams.get('type') || '';

    const dealers = await dealerRepository.findMany({ q, city, region, type });

    return NextResponse.json({ success: true, dealers });
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dealers' }, { status: 500 });
  }
}

// POST - Create new dealer
export async function POST(request: NextRequest) {
  try {
    const { response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    if (!body.name || !body.city || !body.region) {
      return NextResponse.json({ success: false, error: 'Name, city and region are required' }, { status: 400 });
    }

    const dealer = await createDealer(body);

    return NextResponse.json({ success: true, dealer });
  } catch (error) {
    console.error('Error creating dealer:', error);
    return NextResponse.json({ success: false, error: 'Failed to create dealer' }, { status: 500 });
  }
}
