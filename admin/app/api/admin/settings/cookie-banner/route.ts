import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/auth/api';
import { settingRepository } from '@/repositories/settingRepository';

/**
 * GET /api/admin/settings/cookie-banner
 * Get cookie banner configuration
 */
export async function GET() {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    if (!session!.user.permissions.canManageSettings) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const setting = await settingRepository.findByKey('cookie_banner');

    if (!setting) {
      // Return default values
      return NextResponse.json({
        enabled: true,
        title: 'We Value Your Privacy',
        description: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
        acceptText: 'Accept All',
        declineText: 'Decline',
        policyLink: '/cookies'
      });
    }

    const config = JSON.parse(setting.value);
    return NextResponse.json(config);

  } catch (error) {
    console.error('Error fetching cookie banner settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings/cookie-banner
 * Update cookie banner configuration
 */
export async function POST(request: NextRequest) {
  try {
    const { session, response } = await requireAdminApiSession();
    if (response) return response;

    if (!session!.user.permissions.canManageSettings) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enabled, title, description, acceptText, declineText, policyLink } = body;

    // Validate required fields
    if (title === undefined || description === undefined) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const config = {
      enabled: enabled ?? true,
      title,
      description,
      acceptText: acceptText || 'Accept All',
      declineText: declineText || 'Decline',
      policyLink: policyLink || '/cookies'
    };

    // Upsert the setting
    const setting = await settingRepository.upsert('cookie_banner', JSON.stringify(config), 'general');

    return NextResponse.json({
      message: 'Cookie banner settings updated successfully',
      setting
    });

  } catch (error) {
    console.error('Error updating cookie banner settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
