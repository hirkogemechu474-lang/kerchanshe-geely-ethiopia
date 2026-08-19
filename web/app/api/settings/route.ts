import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/prisma';

// GET all settings or specific setting by key
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const type = searchParams.get('type');

    if (key) {
      // Get specific setting by key
      const setting = await prisma.setting.findUnique({
        where: { key }
      });

      if (!setting) {
        return NextResponse.json(
          { error: 'Setting not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(setting);
    }

    // Get all settings or filter by type
    const where = type ? { type } : {};
    const settings = await prisma.setting.findMany({
      where,
      orderBy: { key: 'asc' }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// POST - Create or update a setting
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permissions?.canManageSettings) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value, type } = body;

    if (!key || !value || !type) {
      return NextResponse.json(
        { error: 'Key, value, and type are required' },
        { status: 400 }
      );
    }

    // Upsert (create or update)
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value, type, updatedAt: new Date() },
      create: { key, value, type }
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error saving setting:', error);
    return NextResponse.json(
      { error: 'Failed to save setting' },
      { status: 500 }
    );
  }
}

// PUT - Update a setting
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permissions?.canManageSettings) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { key, value, type } = body;

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }

    const setting = await prisma.setting.update({
      where: { key },
      data: { value, type, updatedAt: new Date() }
    });

    return NextResponse.json(setting);
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a setting
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.permissions?.canManageSettings) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      );
    }

    await prisma.setting.delete({
      where: { key }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting setting:', error);
    return NextResponse.json(
      { error: 'Failed to delete setting' },
      { status: 500 }
    );
  }
}
