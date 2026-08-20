import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminApiSession } from '@/lib/auth/api';

const SETTING_KEY = 'vehicle_settings';
const SETTING_TYPE = 'cms';

// Real vehicle categories (shown in public catalog filters) are managed via
// the VehicleCategory model at /admin/categories, not here — this Setting
// blob previously duplicated that with an unused, never-read JSON array.
const DEFAULT_VEHICLE_SETTINGS = {
  features: {
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
  },
  specifications: {
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
  },
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
