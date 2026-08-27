import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, rateLimitConfigs } from '@/lib/rate-limit';
import { submitFinancingApplication } from '@/lib/services/financing/financingApplicationService';

// POST /api/public/financing-applications
// Public financing application lead submission from the /financing/apply page.
export async function POST(request: NextRequest) {
  const rateLimitResult = await rateLimit(request, rateLimitConfigs.contactForm);
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await request.json();

    const firstName = String(body.firstName || '').trim();
    const lastName = String(body.lastName || '').trim();
    const email = String(body.email || '').trim();
    const phone = String(body.phone || '').trim();
    const programId = String(body.programId || '').trim();
    const bankName = String(body.bankName || '').trim();
    const programName = String(body.programName || '').trim();
    const vehicleId = String(body.vehicleId || '').trim();
    const vehicleName = String(body.vehicleName || '').trim();
    const city = String(body.city || '').trim();
    const employmentStatus = String(body.employmentStatus || '').trim();
    const monthlyIncome = Number(body.monthlyIncome) || 0;
    const downPaymentPercent = Number(body.downPaymentPercent) || 0;
    const desiredTenureMonths = Number(body.desiredTenureMonths) || 0;
    const message = String(body.message || '').trim();
    const consent = body.consent === true;

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'Full name is required' }, { status: 400 });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    if (!programId) {
      return NextResponse.json({ error: 'Program selection is required' }, { status: 400 });
    }
    if (!consent) {
      return NextResponse.json({ error: 'Consent is required' }, { status: 400 });
    }

    const { applicationId, reference } = await submitFinancingApplication({
      firstName,
      lastName,
      email,
      phone,
      programId,
      bankName,
      programName,
      vehicleId,
      vehicleName,
      city,
      employmentStatus,
      monthlyIncome,
      downPaymentPercent,
      desiredTenureMonths,
      message,
    });

    return NextResponse.json({ success: true, applicationId, reference }, { status: 201 });
  } catch (error) {
    console.error('[public:financing-applications:post]', error);
    return NextResponse.json({ error: 'Failed to submit financing application' }, { status: 500 });
  }
}
