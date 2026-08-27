import { NextRequest, NextResponse } from 'next/server';
import { vehicleRepository } from '@/repositories/vehicleRepository';
import { buildBrochureHtml } from '@/lib/services/vehicles/brochureService';

/**
 * GET /api/vehicles/[id]/brochure
 *
 * Generates a print-ready HTML brochure for the vehicle that the browser
 * can print to PDF. Served with Content-Disposition: attachment so clicking
 * "Download Brochure" opens the browser print dialog automatically.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const vehicle = await vehicleRepository.findForBrochure(id);

  if (!vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 });
  }

  const html = buildBrochureHtml(vehicle);

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': `inline; filename="${vehicle.slug}-brochure.html"`,
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
