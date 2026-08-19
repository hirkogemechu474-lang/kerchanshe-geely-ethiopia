import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

function parseJson(v: any, fallback: any) {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    try { return JSON.parse(v); } catch { return fallback; }
  }
  return v;
}

// GET - Get single dealer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const dealer = await prisma.dealer.findUnique({ where: { id: id } });
    if (!dealer) {
      return NextResponse.json({ success: false, error: 'Dealer not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, dealer });
  } catch (error) {
    console.error('Error fetching dealer:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dealer' }, { status: 500 });
  }
}

// PUT - Update dealer
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const existing = await prisma.dealer.findUnique({ where: { id: id } });
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Dealer not found' }, { status: 404 });
    }

    const dealer = await prisma.dealer.update({
      where: { id: id },
      data: {
        name: body.name ?? existing.name,
        type: body.type ?? existing.type,
        description: body.description !== undefined ? body.description : existing.description,
        city: body.city ?? existing.city,
        region: body.region ?? existing.region,
        country: body.country ?? existing.country,
        address: body.address !== undefined ? parseJson(body.address, existing.address) : existing.address,
        latitude: body.latitude !== undefined ? parseFloat(body.latitude) || 0 : existing.latitude,
        longitude: body.longitude !== undefined ? parseFloat(body.longitude) || 0 : existing.longitude,
        contact: body.contact !== undefined ? parseJson(body.contact, existing.contact) : existing.contact,
        website: body.website !== undefined ? body.website : existing.website,
        services: body.services !== undefined ? parseJson(body.services, existing.services) : existing.services,
        workingHours: body.workingHours !== undefined ? parseJson(body.workingHours, existing.workingHours) : existing.workingHours,
        facilities: body.facilities !== undefined ? parseJson(body.facilities, existing.facilities) : existing.facilities,
        logo: body.logo !== undefined ? body.logo : existing.logo,
        gallery: body.gallery !== undefined ? parseJson(body.gallery, existing.gallery) : existing.gallery,
        active: body.active !== undefined ? body.active !== false : existing.active,
        featured: body.featured !== undefined ? body.featured === true : existing.featured,
        salesCount: body.salesCount !== undefined ? parseInt(body.salesCount) || 0 : existing.salesCount,
        staffCount: body.staffCount !== undefined ? parseInt(body.staffCount) || 0 : existing.staffCount,
        rating: body.rating !== undefined ? parseFloat(body.rating) || 0 : existing.rating,
      },
    });

    return NextResponse.json({ success: true, dealer });
  } catch (error) {
    console.error('Error updating dealer:', error);
    return NextResponse.json({ success: false, error: 'Failed to update dealer' }, { status: 500 });
  }
}

// DELETE - Delete dealer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.dealer.delete({ where: { id: id } });
    return NextResponse.json({ success: true, message: 'Dealer deleted successfully' });
  } catch (error) {
    console.error('Error deleting dealer:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete dealer' }, { status: 500 });
  }
}