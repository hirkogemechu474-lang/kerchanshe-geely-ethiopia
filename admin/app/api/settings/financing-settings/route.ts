import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const SETTING_KEY = 'financing_settings';
const SETTING_TYPE = 'cms';

const DEFAULT_FINANCING_SETTINGS = {
  enabled: true,
  calculator: {
    enabled: true,
    defaultDownPayment: 20,
    minDownPayment: 10,
    maxDownPayment: 80,
    defaultTenure: 5,
    minTenure: 1,
    maxTenure: 7,
    tenureOptions: [1, 2, 3, 4, 5, 6, 7],
    defaultInterestRate: 13.5,
    interestRateRange: { min: 12.5, max: 15.5 },
  },
  requirements: {
    ethiopianCitizenship: true,
    minAge: 21,
    maxAge: 65,
    minMonthlyIncome: 15000,
    employmentRequired: true,
    minEmploymentYears: 1,
    documents: [
      'Valid Ethiopian ID or Passport',
      'Proof of Income (Salary slip or Bank statement for 3-6 months)',
      'Employment Letter / Contract',
      'Proof of Residence (Utility bill, Lease agreement)',
      'Completed Application Form',
      'Down Payment Receipt',
      'TIN (Tax Identification Number)',
      'Two Recent Passport Photos',
      'Bank account statement (latest 6 months)',
      'Credit Bureau report (if applicable)',
    ],
  },
  process: {
    steps: [
      {
        step: 1,
        title: 'Calculate & Estimate',
        description: 'Use our online calculator to estimate monthly payments based on vehicle price, down payment, and preferred loan term.',
        duration: '5 minutes',
      },
      {
        step: 2,
        title: 'Submit Application',
        description: 'Complete the financing application form online or at any showroom. Submit all required documentation for initial review.',
        duration: '1-2 hours',
      },
      {
        step: 3,
        title: 'Document Verification',
        description: 'The bank verifies your employment, income, and submitted documents. A credit check may also be performed.',
        duration: '1-2 business days',
      },
      {
        step: 4,
        title: 'Loan Approval',
        description: 'Upon successful verification, the bank approves your loan and issues a sanction letter with approved terms and conditions.',
        duration: '2-3 business days',
      },
      {
        step: 5,
        title: 'Sign Agreement & Pay Down Payment',
        description: 'Review and sign the loan agreement. Pay the down payment amount and any processing fees to complete the purchase.',
        duration: '1 day',
      },
      {
        step: 6,
        title: 'Vehicle Delivery',
        description: 'Once all paperwork is complete and payment is confirmed, you can take delivery of your new Geely vehicle!',
        duration: 'Same day',
      },
    ],
    totalDuration: '3-5 business days',
    fastTrackAvailable: true,
    fastTrackDuration: '2 business days',
  },
  fees: {
    processingFee: {
      percentage: 2.5,
      min: 5000,
      max: 30000,
    },
    insurance: {
      comprehensive: {
        percentage: 5,
        description: 'Full comprehensive insurance covering theft, accident, fire, and third-party liability.',
      },
      thirdParty: {
        fixed: 3500,
        description: 'Basic third-party liability insurance as required by Ethiopian law.',
      },
    },
    registration: {
      plates: 1800,
      license: 600,
      inspection: 1200,
    },
  },
  additionalInfo: {
    latePaymentPenalty: 2,
    earlyRepaymentAllowed: true,
    earlyRepaymentPenalty: 1,
    gracePeriod: 7,
    maxMissedPayments: 3,
    balloonPaymentAvailable: false,
  },
  support: {
    phone: '+251 11 000 0000',
    email: 'financing@geely-ethiopia.com',
    whatsapp: '+251 911 000 000',
    consultationAvailable: true,
    consultationFree: true,
  },
};

export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: SETTING_KEY },
    });

    if (!setting) {
      return NextResponse.json(DEFAULT_FINANCING_SETTINGS);
    }

    const settings = JSON.parse(setting.value);
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching financing settings:', error);
    return NextResponse.json(DEFAULT_FINANCING_SETTINGS);
  }
}

export async function POST(request: NextRequest) {
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
    console.error('Error saving financing settings:', error);
    return NextResponse.json(
      { error: 'Failed to save financing settings', details: (error as Error).message },
      { status: 500 }
    );
  }
}
