'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';
import { ShieldCheck } from 'lucide-react';

interface QuotationApprovalData {
  id: string;
  quotationNo: string | null;
  customerName: string;
  vehicleModel: string | null;
  unitPrice: number | null;
  quantity: number | null;
  discountAmount: number | null;
  vatAmount: number | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
  managerApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  managerApprovedAt: string | null;
  managerApprovedByName?: string | null;
  managerSignatureUrl?: string | null;
  managerRejectedAt: string | null;
  managerRejectionReason: string | null;
}

function formatETB(value: number): string {
  return `ETB ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

// Manager sign-off gate on a generated Sales Quotation, mirroring
// OrderApprovalPanel's layout — a quotation cannot be sent to the customer
// (see QuotationPdfPanel's "Send Quotation to Customer") until approved
// here. Rejecting returns it to the sales agent for correction.
export default function QuotationApprovalPanel({
  quotation,
  canApprove,
}: {
  quotation: QuotationApprovalData;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [reason, setReason] = useState('');

  if (!quotation.quotationNo || !canApprove) return null;

  const totalPayable =
    quotation.unitPrice != null
      ? quotation.unitPrice * (quotation.quantity ?? 1) - (quotation.discountAmount ?? 0) + (quotation.vatAmount ?? 0)
      : null;

  const approve = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/quotations/${quotation.id}/approve-quotation`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    if (!reason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/quotations/${quotation.id}/reject-quotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');
      setShowRejectForm(false);
      setReason('');
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
        <h2 className="text-lg font-semibold text-gray-900">Manager Approval</h2>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700 space-y-1">
        <p><span className="text-gray-500">Customer:</span> {quotation.customerName}</p>
        <p><span className="text-gray-500">Vehicle:</span> {quotation.vehicleModel || 'General enquiry'}</p>
        {totalPayable != null && <p><span className="text-gray-500">Total price:</span> {formatETB(totalPayable)}</p>}
        {quotation.paymentTerms && <p><span className="text-gray-500">Payment terms:</span> {quotation.paymentTerms}</p>}
        {quotation.deliveryTerms && <p><span className="text-gray-500">Delivery:</span> {quotation.deliveryTerms}</p>}
      </div>

      {quotation.managerApprovalStatus === 'APPROVED' && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          <p className="font-medium">
            Approved and signed{quotation.managerApprovedAt ? ` ${new Date(quotation.managerApprovedAt).toLocaleString()}` : ''}
          </p>
          {quotation.managerApprovedByName && <p className="mt-1">Signed by manager: {quotation.managerApprovedByName}</p>}
          {quotation.managerSignatureUrl && <p className="mt-1 text-xs text-green-700">Manager signature is on file.</p>}
        </div>
      )}

      {quotation.managerApprovalStatus === 'REJECTED' && (
        <p className="text-sm text-red-700">
          Returned for correction {quotation.managerRejectedAt ? new Date(quotation.managerRejectedAt).toLocaleString() : ''}
          {quotation.managerRejectionReason ? ` — ${quotation.managerRejectionReason}` : ''}
        </p>
      )}

      {quotation.managerApprovalStatus === 'PENDING' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Approving this quotation records your manager signature and immediately updates the quotation form.
          </p>
          {!showRejectForm ? (
            <div className="flex gap-3">
              <Button onClick={approve} disabled={busy}>
                {busy ? 'Approving…' : 'Approve & Sign'}
              </Button>
              <Button variant="secondary" onClick={() => setShowRejectForm(true)} disabled={busy}>
                Reject / Return for Correction
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-gray-600">Reason for return</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                placeholder="What needs to change before this can be sent?"
              />
              <div className="flex gap-3">
                <Button variant="secondary" onClick={reject} disabled={busy}>
                  {busy ? 'Submitting…' : 'Confirm Return for Correction'}
                </Button>
                <Button variant="secondary" onClick={() => { setShowRejectForm(false); setReason(''); }} disabled={busy}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
