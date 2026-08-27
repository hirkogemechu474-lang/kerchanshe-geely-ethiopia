'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Upload, Loader2 } from 'lucide-react';
import {
  getAllowedClaimTransitions,
  assertSubmittable,
  WarrantyClaimTransitionError,
  WARRANTY_CLAIM_STATUS_COLORS,
  WARRANTY_CLAIM_STATUS_LABELS,
} from '@/lib/workshop/warrantyClaimStateMachine';
import type { AdminPermissions } from '@/lib/auth/types';
import { Card, Button } from '@/components/admin/ui';

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedById: string;
  reasonCode: string | null;
  changedAt: string;
}

interface ClaimData {
  id: string;
  claimNo: string;
  defectCode: string;
  component: string | null;
  diagnosticCodes: string | null;
  description: string | null;
  photoUrls: string[];
  status: string;
  oemPortalRef: string | null;
  approvedAmount: number | null;
  rejectionReason: string | null;
  jobCard: {
    id: string;
    jobCardNo: string;
    plateNo: string;
    customerName: string;
    warrantyEndDate: string | null;
  };
  statusHistory: StatusHistoryEntry[];
}

export default function WarrantyClaimDetail({ claim, permissions }: { claim: ClaimData; permissions: AdminPermissions }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, setState] = useState(claim);
  const [defectCode, setDefectCode] = useState(state.defectCode);
  const [component, setComponent] = useState(state.component || '');
  const [diagnosticCodes, setDiagnosticCodes] = useState(state.diagnosticCodes || '');
  const [description, setDescription] = useState(state.description || '');
  const [oemPortalRef, setOemPortalRef] = useState(state.oemPortalRef || '');
  const [approvedAmount, setApprovedAmount] = useState(state.approvedAmount?.toString() || '');
  const [rejectionReason, setRejectionReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const isEditable = state.status === 'DRAFTED' || state.status === 'REJECTED';

  const refresh = async () => {
    const res = await fetch(`/api/admin/workshop/warranty-claims/${state.id}`);
    if (res.ok) {
      const data = await res.json();
      setState(data.claim);
    }
    router.refresh();
  };

  const saveFields = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/workshop/warranty-claims/${state.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ defectCode, component, diagnosticCodes, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const onPickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', 'warranty-claims');
      const res = await fetch('/api/upload/image', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const nextUrls = [...state.photoUrls, data.url];
      const patchRes = await fetch(`/api/admin/workshop/warranty-claims/${state.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrls: nextUrls }),
      });
      const patchData = await patchRes.json();
      if (!patchRes.ok) throw new Error(patchData.error || 'Failed to attach photo');
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async (url: string) => {
    setBusy(true);
    setError('');
    try {
      const nextUrls = state.photoUrls.filter((p) => p !== url);
      const res = await fetch(`/api/admin/workshop/warranty-claims/${state.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoUrls: nextUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const transition = async (toStatus: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/workshop/warranty-claims/${state.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toStatus,
          oemPortalRef: oemPortalRef || undefined,
          approvedAmount: toStatus === 'APPROVED' ? Number(approvedAmount) : undefined,
          rejectionReason: toStatus === 'REJECTED' ? rejectionReason : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transition failed');
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const warrantyEndDate = state.jobCard.warrantyEndDate ? new Date(state.jobCard.warrantyEndDate) : null;
  const allowedTransitions = getAllowedClaimTransitions(state.status as any, {
    defectCode: state.defectCode,
    photoUrls: state.photoUrls,
    warrantyEndDate,
  });

  let submitBlockedReason: string | null = null;
  if (isEditable) {
    try {
      assertSubmittable({ defectCode: state.defectCode, photoUrls: state.photoUrls, warrantyEndDate });
    } catch (err) {
      if (err instanceof WarrantyClaimTransitionError) submitBlockedReason = err.message;
    }
  }

  const isReviewStage = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(state.status);
  const canAct = isEditable ? permissions.canManageJobCards : permissions.canApproveWarrantyClaims;

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{state.claimNo}</h1>
            <p className="text-sm text-gray-500 mt-1">
              <Link href={`/admin/workshop/job-cards/${state.jobCard.id}`} className="text-geely-blue hover:underline">
                {state.jobCard.jobCardNo}
              </Link>{' '}
              · {state.jobCard.plateNo} · {state.jobCard.customerName}
            </p>
            {warrantyEndDate && (
              <p className={`text-xs mt-1 ${warrantyEndDate.getTime() < Date.now() ? 'text-red-600' : 'text-gray-400'}`}>
                Warranty {warrantyEndDate.getTime() < Date.now() ? 'expired' : 'valid until'} {warrantyEndDate.toLocaleDateString()}
              </p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${WARRANTY_CLAIM_STATUS_COLORS[state.status as keyof typeof WARRANTY_CLAIM_STATUS_COLORS]}`}>
            {WARRANTY_CLAIM_STATUS_LABELS[state.status as keyof typeof WARRANTY_CLAIM_STATUS_LABELS]}
          </span>
        </div>
      </Card>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <Card className="space-y-4">
        <h2 className="font-semibold text-gray-900">Claim Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Defect code</label>
            <input
              value={defectCode}
              onChange={(e) => setDefectCode(e.target.value)}
              disabled={!isEditable || !permissions.canManageJobCards}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Component</label>
            <input
              value={component}
              onChange={(e) => setComponent(e.target.value)}
              disabled={!isEditable || !permissions.canManageJobCards}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Diagnostic trouble codes</label>
          <input
            value={diagnosticCodes}
            onChange={(e) => setDiagnosticCodes(e.target.value)}
            disabled={!isEditable || !permissions.canManageJobCards}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!isEditable || !permissions.canManageJobCards}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Photo evidence</label>
          <div className="flex flex-wrap gap-3">
            {state.photoUrls.map((url) => (
              <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                <img src={url} alt="evidence" className="w-full h-full object-cover" />
                {isEditable && permissions.canManageJobCards && (
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
            {isEditable && permissions.canManageJobCards && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || busy}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center text-gray-400"
              >
                {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onPickPhoto} className="hidden" />
          </div>
        </div>

        {isEditable && permissions.canManageJobCards && (
          <Button variant="secondary" onClick={saveFields} disabled={busy}>
            Save Changes
          </Button>
        )}
      </Card>

      {isReviewStage && (
        <Card className="space-y-3">
          <h2 className="font-semibold text-gray-900">OEM Portal</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">OEM portal reference</label>
            <input
              value={oemPortalRef}
              onChange={(e) => setOemPortalRef(e.target.value)}
              disabled={!permissions.canApproveWarrantyClaims}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {state.status === 'UNDER_REVIEW' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Approved amount (ETB)</label>
              <input
                type="number"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
                disabled={!permissions.canApproveWarrantyClaims}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          )}
        </Card>
      )}

      {state.status === 'UNDER_REVIEW' && (
        <Card className="space-y-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">Rejection reason (required if rejecting)</label>
          <textarea
            rows={2}
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            disabled={!permissions.canApproveWarrantyClaims}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </Card>
      )}

      {state.status === 'REJECTED' && state.rejectionReason && (
        <Card className="border-red-200">
          <h2 className="font-semibold text-gray-900 mb-2">Rejection Reason</h2>
          <p className="text-sm text-gray-700">{state.rejectionReason}</p>
        </Card>
      )}

      {isEditable && submitBlockedReason && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 text-sm rounded-lg px-4 py-3">
          Cannot submit yet: {submitBlockedReason}
        </div>
      )}

      {allowedTransitions.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Actions</h2>
          <div className="flex flex-wrap gap-2">
            {allowedTransitions.map((next) => (
              <Button key={next} variant="secondary" onClick={() => transition(next)} disabled={busy || !canAct}>
                {next === 'SUBMITTED'
                  ? state.status === 'REJECTED'
                    ? 'Resubmit'
                    : 'Submit Claim'
                  : WARRANTY_CLAIM_STATUS_LABELS[next as keyof typeof WARRANTY_CLAIM_STATUS_LABELS]}
              </Button>
            ))}
          </div>
          {!canAct && (
            <p className="text-xs text-gray-400 mt-2">
              {isEditable
                ? 'Only a Service Advisor (or above) can submit this claim.'
                : 'Only a Service Manager (or above) can move this claim through review.'}
            </p>
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Status Timeline</h2>
        <ol className="space-y-2">
          {state.statusHistory.map((h) => (
            <li key={h.id} className="text-sm flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5">
              <span className="text-gray-400 sm:w-40 sm:shrink-0">{new Date(h.changedAt).toLocaleString()}</span>
              <span>
                {h.fromStatus ? `${WARRANTY_CLAIM_STATUS_LABELS[h.fromStatus as keyof typeof WARRANTY_CLAIM_STATUS_LABELS]} → ` : ''}
                <strong>{WARRANTY_CLAIM_STATUS_LABELS[h.toStatus as keyof typeof WARRANTY_CLAIM_STATUS_LABELS]}</strong>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
