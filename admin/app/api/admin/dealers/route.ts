import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

function parseJson(v: any, fallback: any) {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return fallback; }
  }
  return v;
}

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

    const where: any = {};
    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { region: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (city) where.city = city;
    if (region) where.region = region;
    if (type) where.type = type;

    const dealers = await prisma.dealer.findMany({
      where,
      orderBy: { name: 'asc' },
    });

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

    const dealer = await prisma.dealer.create({
      data: {
        name: body.name,
        type: body.type || 'both',
        description: body.description || null,
        city: body.city,
        region: body.region,
        country: body.country || 'Ethiopia',
        address: parseJson(body.address, {}),
        latitude: parseFloat(body.latitude) || 0,
        longitude: parseFloat(body.longitude) || 0,
        contact: parseJson(body.contact, {}),
        website: body.website || null,
        services: parseJson(body.services, []),
        workingHours: parseJson(body.workingHours, {}),
        facilities: parseJson(body.facilities, {}),
        logo: body.logo || null,
        gallery: parseJson(body.gallery, []),
        active: body.active !== false,
        featured: body.featured === true,
        salesCount: parseInt(body.salesCount) || 0,
        staffCount: parseInt(body.staffCount) || 0,
        rating: parseFloat(body.rating) || 0,
      },
    });

    return NextResponse.json({ success: true, dealer });
  } catch (error) {
    console.error('Error creating dealer:', error);
    return NextResponse.json({ success: false, error: 'Failed to create dealer' }, { status: 500 });
  }
}