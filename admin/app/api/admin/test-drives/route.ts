import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { testDriveRepository } from '@/repositories/testDriveRepository';

// GET - Fetch all test drives
export async function GET(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const testDrives = await testDriveRepository.findAll();

    return NextResponse.json({ testDrives });
  } catch (error) {
    console.error('Error fetching test drives:', error);
    return NextResponse.json({ error: 'Failed to fetch test drives' }, { status: 500 });
  }
}

// POST - Create new test drive
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      vehicleId,
      preferredDate,
      preferredTime,
      alternativeDate,
      alternativeTime,
      location,
      assignedTo,
      specialRequests,
      notes,
      status,
    } = body;

    if (!customerName || !customerEmail || !customerPhone || !vehicleId || !preferredDate || !preferredTime || !location) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Combine date and time for preferredDate
    const preferredDateTime = new Date(`${preferredDate}T${convertTo24Hour(preferredTime)}`);
    let alternativeDateTime = null;
    if (alternativeDate && alternativeTime) {
      alternativeDateTime = new Date(`${alternativeDate}T${convertTo24Hour(alternativeTime)}`);
    }

    const testDrive = await testDriveRepository.create({
      customerName,
      customerEmail,
      customerPhone,
      vehicle: { connect: { id: vehicleId } },
      preferredDate: preferredDateTime,
      preferredTime,
      alternativeDate: alternativeDateTime,
      location,
      salesRepId: assignedTo || null,
      specialRequests,
      status: status || 'pending',
    });

    return NextResponse.json({ testDrive }, { status: 201 });
  } catch (error) {
    console.error('Error creating test drive:', error);
    return NextResponse.json({ error: 'Failed to create test drive' }, { status: 500 });
  }
}

// Helper function to convert 12-hour time to 24-hour format
function convertTo24Hour(time: string): string {
  const [timePart, period] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);

  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}
