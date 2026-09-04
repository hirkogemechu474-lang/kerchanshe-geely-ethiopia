'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';
import { ShieldCheck, Upload } from 'lucide-react';

// FR-104: digital ID capture at the point the customer arrives for their
// test drive. Mirrors the upload pattern already established in
// WarrantyClaimDetail.tsx — POST /api/upload/image, then PATCH the parent
// record with the resulting URL.
interface TestDriveIdData {
  id: string;
  status: string;
  idDocumentType: string | null;
  idDocumentNumber: string | null;
  idPhotoUrl: string | null;
  idVerifiedAt: string | null;
}

export default function TestDriveIdCapture({ testDrive, canManage }: { testDrive: TestDriveIdData; canManage: boolean }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState(testDrive);
  const [documentType, setDocumentType] = useState(state.idDocumentType || 'drivers_license');
  const [documentNumber, setDocumentNumber] = useState(state.idDocumentNumber || '');
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const patch = async (body: Record<string, unknown>) => {
    const res = await fetch(`/api/test-drives/${state.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Update failed');
    return data.testDrive as TestDriveIdData;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'test-drive-id');
      const uploadRes = await fetch('/api/upload/image', { method: 'POST', body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.error || 'Upload failed');

      const updated = await patch({
        idDocumentType: documentType,
        idDocumentNumber: documentNumber || null,
        idPhotoUrl: uploadData.url,
      });
      setState(updated);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const saveDetails = async () => {
    setBusy(true);
    setError('');
    try {
      const updated = await patch({ idDocumentType: documentType, idDocumentNumber: documentNumber || null });
      setState(updated);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const markCompleted = async () => {
    setBusy(true);
    setError('');
    try {
      const updated = await patch({ status: 'completed' });
      setState(updated);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-5 h-5 text-geely-blue" />
        <h2 className="text-lg font-semibold text-gray-900">Digital ID Capture</h2>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Document type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value)}
            disabled={!canManage}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="drivers_license">Driver&apos;s License</option>
            <option value="national_id">National ID</option>
            <option value="passport">Passport</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Document number</label>
          <input
            value={documentNumber}
            onChange={(e) => setDocumentNumber(e.target.value)}
            disabled={!canManage}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
      </div>

      {canManage && (documentType !== (state.idDocumentType || 'drivers_license') || documentNumber !== (state.idDocumentNumber || '')) && (
        <Button variant="secondary" onClick={saveDetails} disabled={busy}>
          Save Details
        </Button>
      )}

      <div className="flex items-start gap-4">
        {state.idPhotoUrl ? (
          <img src={state.idPhotoUrl} alt="Captured ID" className="w-32 h-20 object-cover rounded-lg border border-gray-200" />
        ) : (
          <div className="w-32 h-20 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-xs text-gray-400">
            No ID captured
          </div>
        )}
        {canManage && (
          <div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" id="id-photo-input" />
            <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading…' : state.idPhotoUrl ? 'Replace Photo' : 'Capture Photo'}
            </Button>
            {state.idVerifiedAt && (
              <p className="text-xs text-gray-400 mt-2">Verified {new Date(state.idVerifiedAt).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>

      {canManage && state.status === 'confirmed' && (
        <div className="pt-3 border-t border-gray-100">
          <Button onClick={markCompleted} disabled={busy || !state.idPhotoUrl}>
            Mark Test Drive Completed
          </Button>
          {!state.idPhotoUrl && (
            <p className="text-xs text-orange-600 mt-2">Capture the customer&apos;s ID above before completing the drive.</p>
          )}
        </div>
      )}
    </Card>
  );
}
