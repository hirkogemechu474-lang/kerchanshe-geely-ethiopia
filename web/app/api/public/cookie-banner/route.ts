import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/cookie-banner
 * Returns public cookie banner configuration (safe values only)
 */
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'cookie_banner' }
    });

    if (!setting) {
      // Return default configuration
      return NextResponse.json({
        enabled: true,
        title: 'We Value Your Privacy',
        description: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.',
        acceptText: 'Accept All',
        declineText: 'Decline',
        policyLink: '/cookies'
      });
    }

    // Parse the JSON value
    const config = JSON.parse(setting.value);

    // Return only safe public values (no internal admin fields)
    return NextResponse.json({
      enabled: config.enabled ?? true,
      title: config.title || 'We Value Your Privacy',
      description: config.description || 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.',
      acceptText: config.acceptText || 'Accept All',
      declineText: config.declineText || 'Decline',
      policyLink: config.policyLink || '/cookies'
    });

  } catch (error) {
    console.error('Error fetching cookie banner config:', error);
    
    // Return default config on error
    return NextResponse.json({
      enabled: true,
      title: 'We Value Your Privacy',
      description: 'We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.',
      acceptText: 'Accept All',
      declineText: 'Decline',
      policyLink: '/cookies'
    });
  }
}
