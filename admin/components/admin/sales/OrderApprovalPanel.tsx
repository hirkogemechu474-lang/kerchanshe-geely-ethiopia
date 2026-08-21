'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';
import { FileCheck2, Upload, FileText } from 'lucide-react';

// "Sales Quotation -> Approval by sales agent -> Generate Agreement ->
// e-sign/attach" — approving unlocks the printable agreement (rendered on
// demand, not stored); attaching a signed copy reuses the same
// upload-then-PATCH convention as TestDriveIdCapture.tsx.
interface OrderApprovalData {
  id: string;
  approvedAt: string | null;
  signedDocumentUrl: string | null;
  signedAt: string | null;
}

export default function OrderApprovalPanel({
  order,
  canManage,
  onUpdated,
}: {
  order: OrderApprovalData;
  canManage: boolean;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const approve = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'sales-agreement');
      const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signedDocumentUrl: uploadData.url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <FileCheck2 className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Approval &amp; Agreement</h2>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!order.approvedAt ? (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Approve this order to unlock the printable sales agreement.
          </p>
          {canManage && (
            <Button onClick={approve} disabled={busy}>
              Approve Order
            </Button>
          )}
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            Approved {new Date(order.approvedAt).toLocaleString()}
          </p>
          <a
            href={`/api/admin/orders/${order.id}/agreement`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
          >
            <FileText className="w-4 h-4" />
            View / Print Agreement
          </a>

          <div className="flex items-start gap-4 pt-2 border-t border-gray-100">
            {order.signedDocumentUrl ? (
              <img
                src={order.signedDocumentUrl}
                alt="Signed agreement"
                className="w-32 h-20 object-cover rounded-lg border border-gray-200"
              />
            ) : (
              <div className="w-32 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
                Not attached
              </div>
            )}
            {canManage && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="signed-agreement-input"
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading…' : order.signedDocumentUrl ? 'Replace Signed Copy' : 'Attach Signed Copy'}
                </Button>
                {order.signedAt && (
                  <p className="text-xs text-gray-400 mt-2">Attached {new Date(order.signedAt).toLocaleString()}</p>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
