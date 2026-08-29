import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { settingRepository } from '@/repositories/settingRepository';

const SETTING_KEY = 'warranty_page';
const SETTING_TYPE = 'cms';

export const DEFAULT_WARRANTY_PAGE = {
  hero: {
    eyebrow: 'VEHICLE WARRANTY',
    title: 'Comprehensive Warranty Coverage',
    subtitle:
      'Drive with confidence knowing your Geely is protected by our comprehensive warranty program. Quality, reliability, and peace of mind guaranteed.',
  },
  whatsCovered: [
    { title: 'Powertrain Components', description: 'Engine, transmission, drive axle, and all internal parts' },
    { title: 'Electrical Systems', description: 'All factory-installed electrical and electronic components' },
    { title: 'Safety Systems', description: 'Airbags, ABS, stability control, and all safety features' },
    { title: 'Climate Control', description: 'Air conditioning and heating systems' },
    { title: 'Steering & Suspension', description: 'Steering mechanism and suspension components' },
    { title: 'Body & Paint', description: '3-year coverage against manufacturing defects and corrosion perforation' },
  ],
  whatsNotCovered: [
    { title: 'Normal Wear & Tear', description: 'Brake pads, wiper blades, tires, filters, and bulbs' },
    { title: 'Misuse & Neglect', description: 'Damage from accidents, abuse, or lack of maintenance' },
    { title: 'Unauthorized Modifications', description: 'Aftermarket parts or modifications not approved by Geely' },
    { title: 'Environmental Damage', description: 'Damage from natural disasters, fire, or vandalism' },
    { title: 'Commercial Use', description: 'Vehicles used for taxi, rental, or commercial purposes' },
    { title: 'Cosmetic Issues', description: 'Minor scratches, dents, or stone chips not affecting function' },
  ],
  cta: {
    title: 'Need to File a Warranty Claim?',
    description:
      "If you're experiencing issues with your Geely vehicle covered under warranty, submit a claim online or contact our service team.",
  },
  documents: [] as Array<{
    id: string;
    title: string;
    description: string;
    url: string;
    fileName: string;
    fileSize: number | null;
    uploadedAt: string | null;
  }>,
};

export async function GET() {
  const { response } = await requireAdminApiSession();
  if (response) return response;

  try {
    const setting = await settingRepository.findByKey(SETTING_KEY);

    if (!setting) {
      return NextResponse.json(DEFAULT_WARRANTY_PAGE);
    }

    const raw = JSON.parse(setting.value);
    const settings = {
      ...DEFAULT_WARRANTY_PAGE,
      ...raw,
      hero: { ...DEFAULT_WARRANTY_PAGE.hero, ...(raw.hero ?? {}) },
      cta: { ...DEFAULT_WARRANTY_PAGE.cta, ...(raw.cta ?? {}) },
      whatsCovered: Array.isArray(raw.whatsCovered) ? raw.whatsCovered : DEFAULT_WARRANTY_PAGE.whatsCovered,
      whatsNotCovered: Array.isArray(raw.whatsNotCovered) ? raw.whatsNotCovered : DEFAULT_WARRANTY_PAGE.whatsNotCovered,
      documents: Array.isArray(raw.documents) ? raw.documents : DEFAULT_WARRANTY_PAGE.documents,
    };
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching warranty page settings:', error);
    return NextResponse.json(DEFAULT_WARRANTY_PAGE);
  }
}

export async function POST(request: NextRequest) {
  const { session, response } = await requireAdminApiSession();
  if (response) return response;

  if (!session!.user.permissions.canManageSettings) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    const value = typeof body === 'string' ? body : JSON.stringify(body);

    await settingRepository.upsert(SETTING_KEY, value, SETTING_TYPE);

    const saved = JSON.parse(value);
    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    console.error('Error saving warranty page settings:', error);
    return NextResponse.json(
      { error: 'Failed to save warranty page settings', details: (error as Error).message },
      { status: 500 }
    );
  }
}
