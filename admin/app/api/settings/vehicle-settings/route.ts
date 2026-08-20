import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

const SETTING_KEY = 'vehicle_settings';
const SETTING_TYPE = 'cms';

// Real vehicle categories (shown in public catalog filters) are managed via
// the VehicleCategory model at /admin/categories, not here. Features and
// Specifications reference lists (previously part of this blob) now live in
// their own Setting keys — see /api/settings/vehicle-features and
// /api/settings/vehicle-specifications — with their own admin pages under
// Vehicles → Features / Specifications.
const DEFAULT_VEHICLE_SETTINGS = {
  warranty: {
    vehicle: '5 Years or 150,000 km (whichever comes first)',
    battery: '8 Years or 160,000 km (for EV battery packs)',
    paintwork: '3 Years or 100,000 km against perforation',
    corrosion: '12 Years Against Perforation Corrosion',
  },
  serviceIntervals: {
    standard: 'Every 10,000 km or 6 months',
    electric: 'Every 20,000 km or 12 months',
  },
  brochure: {
    url: '',
    fileName: '',
    fileSize: null,
    uploadedAt: null,
  },
};

export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting) {
      return NextResponse.json(DEFAULT_VEHICLE_SETTINGS);
    }

    const raw = JSON.parse(setting.value);
    const settings = {
      ...raw,
      brochure: {
        ...DEFAULT_VEHICLE_SETTINGS.brochure,
        ...(raw.brochure ?? {}),
      },
    };
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching vehicle settings:', error);
    return NextResponse.json(DEFAULT_VEHICLE_SETTINGS);
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageVehicles) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const value = typeof body === 'string' ? body : JSON.stringify(body);

    await prisma.setting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value,
        type: SETTING_TYPE,
        updatedAt: new Date(),
      },
      create: {
        key: SETTING_KEY,
        value,
        type: SETTING_TYPE,
      },
    });

    const saved = JSON.parse(value);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error('Error saving vehicle settings:', error);
    return NextResponse.json(
      { error: 'Failed to save vehicle settings', details: (error as Error).message },
      { status: 500 }
    );
  }
}
