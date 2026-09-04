'use client';

import { useState } from 'react';
import { Card, Button, Badge, type Tone } from '@/components/admin/ui';
import { Car } from 'lucide-react';

interface OrderTestDrive {
  id: string;
  status: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  reference: string | null;
}

const STATUS_TONE: Record<string, Tone> = {
  pending: 'orange',
  confirmed: 'blue',
  completed: 'green',
  cancelled: 'gray',
};

async function parseJsonResponse(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Server error (${res.status}). Please try again.` };
  }
}

// Lets a sales agent send a test-drive invite tied to this specific order —
// distinct from the standalone public /test-drive booking page — at any
// point in the pipeline (before or after payment). Creates a real TestDrive
// row the customer can track via /status?ref=... (see
// admin/app/api/orders/[id]/send-test-drive/route.ts).
export default function OrderTestDrivePanel({
  order,
  testDrives,
  canManage,
  onUpdated,
}: {
  order: { id: string; vehicleModel: string; customerEmail: string | null };
  testDrives: OrderTestDrive[];
  canManage: boolean;
  onUpdated: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [location, setLocation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const send = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/orders/${order.id}/send-test-drive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferredDate, preferredTime, location }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Unable to send the test-drive invite.');
      setNotice(
        data.notificationSent
          ? `Test-drive invite emailed to ${order.customerEmail}.`
          : 'Test drive created, but the notification email could not be sent — check SMTP settings.'
      );
      setShowForm(false);
      setPreferredDate('');
      setPreferredTime('');
      setLocation('');
      onUpdated();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <Car className="w-5 h-5 text-geely-blue" />
        <h2 className="text-lg font-semibold text-gray-900">Test Drive</h2>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-blue-700">{notice}</p>}

      {testDrives.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {testDrives.map((td) => (
            <li key={td.id} className="py-2 flex items-center justify-between gap-3 text-sm">
              <div>
                <span className="text-gray-800">
                  {new Date(td.preferredDate).toLocaleDateString()} · {td.preferredTime} · {td.location}
                </span>
                {td.reference && <span className="text-xs text-gray-400 block">Ref: {td.reference}</span>}
              </div>
              <Badge tone={STATUS_TONE[td.status] ?? 'gray'}>{td.status}</Badge>
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        showForm ? (
          <div className="space-y-3 border-t border-gray-100 pt-3">
            {!order.customerEmail && (
              <p className="text-xs text-red-600">This order has no customer email on file — add one before sending an invite.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
                <input
                  type="date"
                  value={preferredDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setPreferredDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Time</label>
                <input
                  type="text"
                  value={preferredTime}
                  onChange={(e) => setPreferredTime(e.target.value)}
                  placeholder="e.g. 10:00 AM"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Showroom / dealer"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={send}
                disabled={busy || !order.customerEmail || !preferredDate || !preferredTime || !location}
              >
                {busy ? 'Sending…' : 'Send Invite'}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)} disabled={busy}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => setShowForm(true)}>
            Send Test Drive Invite
          </Button>
        )
      )}
    </Card>
  );
}
