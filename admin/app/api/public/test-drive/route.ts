import { NextResponse } from 'next/server';
import { withCorsHandler, corsPreflight } from '@/lib/cors';
import { submitPublicTestDrive } from '@/lib/services/testDrives/publicTestDriveService';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

/**
 * POST /api/public/test-drive
 * Submit test drive request from Web frontend
 */
export const POST = withCorsHandler(async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await submitPublicTestDrive(body);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.testDrive,
      notificationSent: result.notificationSent,
      message: 'Test drive request submitted successfully',
    });
  } catch (error) {
    console.error('Error creating test drive request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit test drive request' },
      { status: 500 }
    );
  }
});
