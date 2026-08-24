import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type StatusResult = {
  type: 'quotation' | 'service' | 'test-drive' | 'parts' | 'purchase' | 'financing' | 'enquiry';
  label: string;
  reference: string;
  status: string;
  createdAt: string;
  quotationNo?: string | null;
};

// GET /api/public/status?ref=KER-GLY-DD-MM-YYYY-XXXX
// Looks up a customer-facing reference across every flow that issues one,
// so a single "check your status" page can serve quotes, purchases,
// service bookings, financing applications, parts requests, and test drives.
export async function GET(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get('ref')?.trim();
  if (!ref) {
    return NextResponse.json({ found: false, error: 'A reference number is required.' }, { status: 400 });
  }

  const [quotation, serviceBooking, testDrive, partRequest, message] = await Promise.all([
    prisma.quotation.findUnique({ where: { reference: ref }, select: { status: true, createdAt: true, vehicleModel: true, quotationNo: true } }),
    prisma.serviceBooking.findUnique({ where: { reference: ref }, select: { status: true, createdAt: true, serviceType: true } }),
    prisma.testDrive.findUnique({ where: { reference: ref }, select: { status: true, createdAt: true } }),
    prisma.partRequest.findUnique({ where: { reference: ref }, select: { status: true, createdAt: true } }),
    prisma.message.findUnique({ where: { reference: ref }, select: { status: true, createdAt: true, category: true } }),
  ]);

  let result: StatusResult | null = null;

  if (quotation) {
    result = {
      type: 'quotation',
      label: quotation.vehicleModel ? `Quote request — ${quotation.vehicleModel}` : 'Quote request',
      reference: ref,
      status: quotation.status,
      createdAt: quotation.createdAt.toISOString(),
      quotationNo: quotation.quotationNo,
    };
  } else if (serviceBooking) {
    result = {
      type: 'service',
      label: serviceBooking.serviceType ? `Service appointment — ${serviceBooking.serviceType}` : 'Service appointment',
      reference: ref,
      status: serviceBooking.status,
      createdAt: serviceBooking.createdAt.toISOString(),
    };
  } else if (testDrive) {
    result = {
      type: 'test-drive',
      label: 'Test drive booking',
      reference: ref,
      status: testDrive.status,
      createdAt: testDrive.createdAt.toISOString(),
    };
  } else if (partRequest) {
    result = {
      type: 'parts',
      label: 'Parts request',
      reference: ref,
      status: partRequest.status,
      createdAt: partRequest.createdAt.toISOString(),
    };
  } else if (message) {
    result = {
      type: message.category === 'Vehicle Purchase' ? 'purchase' : message.category === 'Financing' ? 'financing' : 'enquiry',
      label: message.category || 'Enquiry',
      reference: ref,
      status: message.status,
      createdAt: message.createdAt.toISOString(),
    };
  }

  if (!result) {
    return NextResponse.json({ found: false, error: 'No request found for that reference number.' }, { status: 404 });
  }

  return NextResponse.json({ found: true, result });
}
