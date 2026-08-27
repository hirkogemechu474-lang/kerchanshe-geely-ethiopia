'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { ArrowLeft, Download, QrCode } from 'lucide-react';
import { Card, PageHeader } from '@/components/admin/ui';

// One-time-use utility: the showroom QR is static — the same code is
// printed/displayed indefinitely and reused by every visitor. There is no
// server route generating this image on demand; staff open this page once,
// download the PNG, and print it for the showroom poster/table-tent/kiosk
// screen.
export default function ShowroomQrPage() {
  const router = useRouter();
  const [siteUrl, setSiteUrl] = useState(process.env.NEXT_PUBLIC_SITE_URL || '');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const targetUrl = siteUrl ? `${siteUrl.replace(/\/$/, '')}/visit/start` : '';

  const generate = async () => {
    if (!targetUrl) {
      setError('Enter the public website URL first.');
      return;
    }
    setError(null);
    try {
      const url = await QRCode.toDataURL(targetUrl, { width: 512, margin: 2 });
      setDataUrl(url);
    } catch {
      setError('Unable to generate the QR code.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <button
          onClick={() => router.push('/admin/settings')}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Settings
        </button>
        <PageHeader
          title="Showroom Visitor QR Code"
          description="Generate the static QR code for showroom posters, table-tents, or a reception screen — visitors scan it to register and choose sales, a test drive, or purchase."
        />
      </div>

      <Card>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-geely-blue to-navy flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Generate QR Code</h3>
            <p className="text-sm text-gray-500">Same code works for every visitor — generate once and print it.</p>
          </div>
        </div>

        <div className="space-y-4 max-w-xl">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Public website URL</label>
            <input
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              placeholder="https://www.geelyethiopia.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              {targetUrl ? `The QR code will link to: ${targetUrl}` : 'The QR code will link to <this URL>/visit/start'}
            </p>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={generate}
            className="inline-flex items-center gap-2 bg-geely-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-navy transition-colors"
          >
            <QrCode className="w-4 h-4" />
            Generate QR Code
          </button>

          {dataUrl && (
            <div className="pt-4 border-t border-gray-200 flex flex-col items-center gap-4">
              <img src={dataUrl} alt="Showroom visitor QR code" className="w-64 h-64 rounded-lg border border-gray-200" />
              <a
                href={dataUrl}
                download="geely-showroom-visit-qr.png"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PNG
              </a>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
