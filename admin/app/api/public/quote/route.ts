import { NextResponse } from 'next/server';
import { withCorsHandler, corsPreflight } from '@/lib/cors';
import { submitPublicQuoteRequest } from '@/lib/services/quotations/publicQuoteService';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

/**
 * POST /api/public/quote
 * Submit quote request from Web frontend
 */
export const POST = withCorsHandler(async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitPublicQuoteRequest(body);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: result.httpStatus });
    }

    return NextResponse.json({
      success: true,
      data: result.quote,
      message: 'Quote request submitted successfully',
    });
  } catch (error) {
    console.error('Error creating quote request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit quote request' },
      { status: 500 }
    );
  }
});
