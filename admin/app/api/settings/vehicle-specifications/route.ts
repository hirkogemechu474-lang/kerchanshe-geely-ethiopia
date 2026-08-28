import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { settingRepository } from '@/repositories/settingRepository';
import type { VehicleSpecificationLists } from '@/lib/vehicle-settings-types';

const SETTING_KEY = 'vehicle_specifications';
const LEGACY_SETTING_KEY = 'vehicle_settings'; // one-time fallback source, see GET
const SETTING_TYPE = 'cms';

const DEFAULT_VEHICLE_SPECIFICATIONS: VehicleSpecificationLists = {
  engine: [
    '1.5T Turbocharged Petrol - 173 HP',
    '1.5L Naturally Aspirated Petrol - 114 HP',
    '2.0T Turbocharged Petrol - 238 HP',
    '1.0T Turbocharged Petrol - 140 HP',
    'Electric Motor - 150 kW (201 HP)',
    'Electric Motor - 200 kW (268 HP)',
  ],
  transmission: [
    '7-Speed Dual-Clutch Transmission (DCT)',
    'Continuously Variable Transmission (CVT)',
    '6-Speed Automatic',
    '6-Speed Manual',
    'Single-Speed Reduction Gear (EV)',
  ],
  fuelType: [
    'Petrol (Gasoline)',
    'Battery Electric Vehicle (BEV)',
    'Plug-In Hybrid (PHEV)',
  ],
  driveType: [
    'Front-Wheel Drive (FWD)',
    'All-Wheel Drive (AWD)',
    'Rear-Wheel Drive (RWD)',
  ],
};

export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const setting = await settingRepository.findByKey(SETTING_KEY);
    if (setting) {
      const parsed = JSON.parse(setting.value);
      return NextResponse.json({ ...DEFAULT_VEHICLE_SPECIFICATIONS, ...parsed });
    }

    // One-time fallback: the old combined `vehicle_settings` blob used to carry
    // this data under its own `specifications` key before this split.
    const legacy = await settingRepository.findByKey(LEGACY_SETTING_KEY);
    if (legacy) {
      const raw = JSON.parse(legacy.value);
      if (raw.specifications) {
        return NextResponse.json({ ...DEFAULT_VEHICLE_SPECIFICATIONS, ...raw.specifications });
      }
    }

    return NextResponse.json(DEFAULT_VEHICLE_SPECIFICATIONS);
  } catch (error) {
    console.error('Error fetching vehicle specifications:', error);
    return NextResponse.json(DEFAULT_VEHICLE_SPECIFICATIONS);
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

    await settingRepository.upsert(SETTING_KEY, value, SETTING_TYPE);

    return NextResponse.json({ success: true, data: JSON.parse(value) });
  } catch (error) {
    console.error('Error saving vehicle specifications:', error);
    return NextResponse.json(
      { error: 'Failed to save vehicle specifications', details: (error as Error).message },
      { status: 500 }
    );
  }
}
