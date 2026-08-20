import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SETTING_KEY = 'vehicle_settings';

// Mirrors admin/app/api/settings/vehicle-settings/route.ts's shape (minus
// admin-only fields), read-only, no auth — this is what powers the public
// /warranty page so admin's Warranty tab and the website never diverge again.
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
};

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
    if (!setting) {
      return NextResponse.json(DEFAULT_VEHICLE_SETTINGS);
    }
    const raw = JSON.parse(setting.value);
    return NextResponse.json({
      warranty: { ...DEFAULT_VEHICLE_SETTINGS.warranty, ...(raw.warranty ?? {}) },
      serviceIntervals: { ...DEFAULT_VEHICLE_SETTINGS.serviceIntervals, ...(raw.serviceIntervals ?? {}) },
    });
  } catch (error) {
    console.error('Error fetching public vehicle settings:', error);
    return NextResponse.json(DEFAULT_VEHICLE_SETTINGS);
  }
}
