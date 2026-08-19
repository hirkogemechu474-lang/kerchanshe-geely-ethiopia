import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - List all dealers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || '';

    const where: any = { isActive: true };
    
    if (city && city !== 'all') {
      where.city = city;
    }

    const dealers = await prisma.dealer.findMany({
      where,
      orderBy: { salesCount: 'desc' },
    });

    // Parse JSON strings back to objects
    const dealersData = dealers.map((dealer: any) => ({
      ...dealer,
      services: JSON.parse(dealer.services as string),
      hours: JSON.parse(dealer.hours as string),
    }));

    return NextResponse.json(dealersData);
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create new dealer
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user.permissions.canManageDealers) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    const dealer = await prisma.dealer.create({
      data: {
        name: data.name,
        city: data.city,
        address: data.address,
        phone: data.phone,
        email: data.email,
        services: JSON.stringify(data.services || []),
        hours: JSON.stringify(data.hours || {}),
        salesCount: 0,
        staffCount: parseInt(data.staffCount || 0),
        rating: 0,
        isActive: true,
      },
    });

    return NextResponse.json(dealer, { status: 201 });
  } catch (error) {
    console.error('Error creating dealer:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
