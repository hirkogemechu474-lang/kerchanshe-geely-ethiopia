import { NextResponse } from 'next/server';

// Proxy endpoint to fetch contact info from admin server (server-to-server to avoid CORS)
export async function GET() {
  const adminOrigin = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3001';
  const ADMIN_URL = `${adminOrigin}/admin/settings/contact-information`;

  try {
    const res = await fetch(ADMIN_URL);
    if (!res.ok) return NextResponse.json({ phone: null, whatsapp: null }, { status: 502 });

    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await res.json();
      const phone = data.phone || data.phoneNumber || data.telephone || data.contactPhone || null;
      const whatsapp = data.whatsapp || data.whatsappNumber || data.whatsappLink || data.whatsapp_url || null;
      return NextResponse.json({ phone, whatsapp });
    }

    const text = await res.text();
    // Try to extract an Ethiopian phone number (+251...) and a wa.me link
    const phoneMatch = text.match(/\+251[0-9\s()\-]{7,}/);
    const phone = phoneMatch ? phoneMatch[0].replace(/\s+/g, '') : null;
    const waMatch = text.match(/wa(?:hatsapp)?(?:[:\s"'\/]*)?(?:https?:\/\/)?(?:www\.)?wa\.me\/(\+?[0-9]+)/i);
    const whatsapp = waMatch ? `https://wa.me/${waMatch[1].replace(/\D/g, '')}` : (phone ? `https://wa.me/${phone.replace(/\D/g, '')}` : null);

    return NextResponse.json({ phone, whatsapp });
  } catch (err) {
    console.error('admin proxy error', err);
    return NextResponse.json({ phone: null, whatsapp: null }, { status: 500 });
  }
}
