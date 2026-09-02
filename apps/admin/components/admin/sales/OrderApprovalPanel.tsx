'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';
import { FileCheck2, Upload, FileText } from 'lucide-react';
import { isPdfUrl, resolveDocumentUrl } from '@/lib/fileType';

// "Sales Quotation -> Approval by sales agent -> Generate Agreement ->
// e-sign/attach" — approving unlocks a preview of the printable agreement
// (rendered on demand, not stored) without emailing it yet, so staff can
// review/adjust the price (see the Financing & Price panel) before an
// explicit "Send Agreement to Customer" action fires the email. Attaching a
// signed copy reuses the same upload-then-PATCH convention as
// TestDriveIdCapture.tsx.
interface OrderApprovalData {
  id: string;
  customerEmail: string | null;
  approvedAt: string | null;
  agreementSentAt: string | null;
  signedDocumentUrl: string | null;
  signedAt: string | null;
  countersignedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
}

export default function OrderApprovalPanel({
  order,
  canManage,
  canCountersign,
  webAppUrl,
  onUpdated,
}: {
  order: OrderApprovalData;
  canManage: boolean;
  canCountersign: boolean;
  webAppUrl: string;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [approveNotice, setApproveNotice] = useState('');
  const [sendNotice, setSendNotice] = useState('');
  const [countersignNotice, setCountersignNotice] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Configurable signature matrix (admin/settings/document-signatures) —
  // 'sales_agent' has no capture flow of its own, so this panel surfaces a
  // plain acknowledgement button for it, only when an admin has actually
  // required it for this document type.
  const [salesAgentRequired, setSalesAgentRequired] = useState(false);
  const [salesAgentSigned, setSalesAgentSigned] = useState(false);
  const [signingAsSalesAgent, setSigningAsSalesAgent] = useState(false);
  const [managerSignature, setManagerSignature] = useState<{ signedByName: string | null; signatureUrl: string | null } | null>(null);

  useEffect(() => {
    if (!order.approvedAt) return;
    (async () => {
      try {
        const [reqRes, sigRes] = await Promise.all([
          fetch('/api/settings/document-signatures'),
          fetch(`/api/admin/documents/sign?documentType=SALES_AGREEMENT&entityId=${order.id}`),
        ]);
        if (reqRes.ok) {
          const requirements = await reqRes.json();
          setSalesAgentRequired((requirements.SALES_AGREEMENT || []).includes('sales_agent'));
        }
        if (sigRes.ok) {
          const { signatures } = await sigRes.json();
          setSalesAgentSigned((signatures || []).some((s: { role: string }) => s.role === 'sales_agent'));
          setManagerSignature((signatures || []).find((s: { role: string }) => s.role === 'manager') || null);
        }
      } catch {
        // Non-fatal — the button simply won't appear.
      }
    })();
  }, [order.id, order.approvedAt, order.countersignedAt]);

  const signAsSalesAgent = async () => {
    setSigningAsSalesAgent(true);
    setError('');
    try {
      const res = await fetch('/api/admin/documents/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType: 'SALES_AGREEMENT', entityId: order.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to record sales agent signature');
      setSalesAgentSigned(true);
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSigningAsSalesAgent(false);
    }
  };

  const approve = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Approval failed');
      setApproveNotice('Approved. Review the agreement below, then send it to the customer when ready.');
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sendAgreement = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/send-agreement`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sending failed');
      setSendNotice(
        order.customerEmail
          ? data.notificationSent
            ? `Agreement emailed to ${order.customerEmail}.`
            : 'The agreement could not be emailed — check SMTP settings.'
          : 'No customer email is on file, so the agreement was not emailed.'
      );
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const countersign = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/countersign`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Countersign failed');
      setCountersignNotice(
        order.customerEmail
          ? data.notificationSent
            ? `Countersigned. A payment link was emailed to ${order.customerEmail}.`
            : 'Countersigned, but the payment-link email could not be sent — check SMTP settings.'
          : 'Countersigned. No customer email is on file, so the payment link was not emailed.'
      );
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const rejectAgreement = async () => {
    if (!rejectReason.trim()) {
      setError('A rejection reason is required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/reject-agreement`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Rejection failed');
      setShowRejectForm(false);
      setRejectReason('');
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
        <FileCheck2 className="w-5 h-5 text-geely-blue" />
        <h2 className="text-lg font-semibold text-gray-900">Approval &amp; Agreement</h2>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {approveNotice && <p className="text-sm text-blue-700">{approveNotice}</p>}
      {sendNotice && <p className="text-sm text-blue-700">{sendNotice}</p>}
      {countersignNotice && <p className="text-sm text-blue-700">{countersignNotice}</p>}

      {!order.approvedAt ? (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Approving unlocks a preview of the sales agreement to review — it is not emailed yet.
            {!order.customerEmail && ' No customer email is on file, so it can never be emailed for this order.'}
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

          {salesAgentRequired && (
            <div className="flex items-center gap-3">
              {salesAgentSigned ? (
                <p className="text-xs text-green-600 font-medium">Sales agent signature recorded</p>
              ) : (
                canManage && (
                  <Button variant="secondary" onClick={signAsSalesAgent} disabled={signingAsSalesAgent}>
                    {signingAsSalesAgent ? 'Recording…' : 'Sign as Sales Agent'}
                  </Button>
                )
              )}
            </div>
          )}

          <a
            href={`/api/admin/orders/${order.id}/agreement`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-geely-blue hover:underline"
          >
            <FileText className="w-4 h-4" />
            View / Print Agreement
          </a>

          <div className="pt-2 border-t border-gray-100">
            {order.agreementSentAt && (
              <p className="text-xs text-gray-500 mb-2">
                Sent {order.customerEmail ? `to ${order.customerEmail} ` : ''}
                {new Date(order.agreementSentAt).toLocaleString()}
              </p>
            )}
            {canManage && !order.signedDocumentUrl && (
              <Button onClick={sendAgreement} disabled={busy}>
                {busy ? 'Sending…' : order.agreementSentAt ? 'Resend Agreement' : 'Send Agreement to Customer'}
              </Button>
            )}
          </div>

          <div className="flex items-start gap-4 pt-2 border-t border-gray-100">
            {order.signedDocumentUrl ? (
              isPdfUrl(order.signedDocumentUrl) ? (
                <a
                  href={resolveDocumentUrl(order.signedDocumentUrl, webAppUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-32 h-20 rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-1 text-xs font-medium text-geely-blue hover:bg-gray-50"
                >
                  <FileText className="w-5 h-5" />
                  View signed PDF
                </a>
              ) : (
                <img
                  src={resolveDocumentUrl(order.signedDocumentUrl, webAppUrl)}
                  alt="Signed agreement"
                  className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                />
              )
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

          {order.signedDocumentUrl && (
            <div className="pt-2 border-t border-gray-100">
              {order.countersignedAt ? (
                <div className="text-xs text-green-600 font-medium">
                  <p>Countersigned {new Date(order.countersignedAt).toLocaleString()}</p>
                  {managerSignature?.signedByName && <p className="mt-1">Signed by manager: {managerSignature.signedByName}</p>}
                  {managerSignature?.signatureUrl && <p className="mt-1 text-green-700">Manager signature is on file.</p>}
                </div>
              ) : order.rejectedAt ? (
                <p className="text-xs text-red-700">
                  Returned for correction {new Date(order.rejectedAt).toLocaleString()}
                  {order.rejectionReason ? ` — ${order.rejectionReason}` : ''}. Attach a corrected signed copy above.
                </p>
              ) : canCountersign ? (
                <div className="space-y-2">
                  {!showRejectForm ? (
                    <>
                      <p className="text-xs text-gray-500 mb-2">
                        Countersigning emails the customer a payment link.
                      </p>
                      <div className="flex gap-3">
                        <Button onClick={countersign} disabled={busy}>
                          {busy ? 'Countersigning…' : 'Countersign & Approve'}
                        </Button>
                        <Button variant="secondary" onClick={() => setShowRejectForm(true)} disabled={busy}>
                          Reject / Return for Correction
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-gray-600">Reason for return</label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={3}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        placeholder="What needs to change before this can be countersigned?"
                      />
                      <div className="flex gap-3">
                        <Button variant="secondary" onClick={rejectAgreement} disabled={busy}>
                          {busy ? 'Submitting…' : 'Confirm Return for Correction'}
                        </Button>
                        <Button variant="secondary" onClick={() => { setShowRejectForm(false); setRejectReason(''); }} disabled={busy}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-orange-600">
                  Awaiting sales manager countersignature before the payment link is sent.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}
