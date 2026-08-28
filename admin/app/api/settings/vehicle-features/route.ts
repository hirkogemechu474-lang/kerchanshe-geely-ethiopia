import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { settingRepository } from '@/repositories/settingRepository';
import type { VehicleFeatureLists } from '@/lib/vehicle-settings-types';

const SETTING_KEY = 'vehicle_features';
const LEGACY_SETTING_KEY = 'vehicle_settings'; // one-time fallback source, see GET
const SETTING_TYPE = 'cms';

const DEFAULT_VEHICLE_FEATURES: VehicleFeatureLists = {
  safety: [
    'ABS (Anti-lock Braking System)',
    'EBD (Electronic Brakeforce Distribution)',
    'ESP (Electronic Stability Program)',
    'TCS (Traction Control System)',
    'Dual Front Airbags',
    'Side & Curtain Airbags',
    'Tire Pressure Monitoring System (TPMS)',
    'Reverse Camera with Parking Sensors',
    'Hill Start Assist (HSA)',
    'Hill Descent Control (HDC)',
    'Blind Spot Detection (BSD)',
    'Lane Departure Warning (LDW)',
    'Forward Collision Warning (FCW)',
    'Automatic Emergency Braking (AEB)',
    'ISOFIX Child Seat Anchors',
    'High-Strength Steel Safety Cage',
  ],
  comfort: [
    'Automatic Climate Control / Dual-Zone AC',
    'Leather Upholstery',
    'Heated Front Seats',
    'Ventilated Front Seats',
    'Power-Adjustable Driver Seat with Memory',
    '60/40 Split-Folding Rear Seats',
    'Ambient Interior Lighting',
    'Panoramic Sunroof',
    'Push-Button Start / Stop',
    'Smart Key Entry',
    'Cruise Control / Adaptive Cruise Control',
    'Tilt & Telescopic Steering Adjustment',
    'Steering Wheel-Mounted Controls',
    'Front & Rear Power Windows',
    'Power-Folding Side Mirrors',
    'Auto-Dimming Rearview Mirror',
    'Wireless Charging Pad',
    'Center Armrest with Storage',
  ],
  technology: [
    '10.25" / 12.3" Touchscreen Infotainment Display',
    'Apple CarPlay & Android Auto Integration',
    'Bluetooth Hands-Free Calling & Audio Streaming',
    'Voice Command Recognition',
    'GPS Navigation System',
    'USB / Type-C Charging Ports',
    'Premium Sound System (8-12 Speakers)',
    'Subwoofer & Amplifier (Premium)',
    'Digital Instrument Cluster',
    'Head-Up Display (HUD)',
    '360° Surround View Camera',
    'Remote Engine Start',
    'App-Based Vehicle Controls',
    'OTA Software Updates',
    'Drive Mode Selector (Eco / Normal / Sport)',
    'Electronic Parking Brake with Auto Hold',
  ],
  performance: [
    'Turbocharged Engine Options',
    '7-Speed DCT Automatic Transmission',
    'CVT Transmission (for efficiency)',
    'Front-Wheel Drive (FWD)',
    'All-Wheel Drive (AWD) - Select Models',
    'Front Suspension: MacPherson Strut',
    'Rear Suspension: Multi-Link / Torsion Beam',
    'Electric Power Steering (EPS)',
    'Disc Brakes on All Wheels',
    'Regenerative Braking (EV models)',
    'Selectable Drive Modes',
    'High Energy-Density Battery (EV models)',
    'Fast Charging Capability (EV models)',
  ],
  exterior: [
    'LED Headlights & Daytime Running Lights',
    'LED Tail Lights',
    'Alloy Wheels',
    'Roof Rails',
    'Power-Folding Side Mirrors with Turn Signals',
    'Front & Rear Skid Plates',
    'Shark Fin Antenna',
    'Rain-Sensing Wipers',
  ],
};

export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const setting = await settingRepository.findByKey(SETTING_KEY);
    if (setting) {
      const parsed = JSON.parse(setting.value);
      return NextResponse.json({ ...DEFAULT_VEHICLE_FEATURES, ...parsed });
    }

    // One-time fallback: the old combined `vehicle_settings` blob used to carry
    // this data under its own `features` key before this split.
    const legacy = await settingRepository.findByKey(LEGACY_SETTING_KEY);
    if (legacy) {
      const raw = JSON.parse(legacy.value);
      if (raw.features) {
        return NextResponse.json({ ...DEFAULT_VEHICLE_FEATURES, ...raw.features });
      }
    }

    return NextResponse.json(DEFAULT_VEHICLE_FEATURES);
  } catch (error) {
    console.error('Error fetching vehicle features:', error);
    return NextResponse.json(DEFAULT_VEHICLE_FEATURES);
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
    console.error('Error saving vehicle features:', error);
    return NextResponse.json(
      { error: 'Failed to save vehicle features', details: (error as Error).message },
      { status: 500 }
    );
  }
}
