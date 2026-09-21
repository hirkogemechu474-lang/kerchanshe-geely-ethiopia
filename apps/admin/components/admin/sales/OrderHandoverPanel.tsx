'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';
import { PackageCheck, FileText } from 'lucide-react';
import { withBasePath } from '@/lib/basePath';

// Fixed-membership checklist rows for the printed Delivery & Handover Note
// (Kerchanshe Trading PLC draft) — mirrors backend/src/services/pdf/handover.pdf.ts's
// DEFAULT_ITEMS_HANDED_OVER / DEFAULT_INSPECTION_CHECKLIST / DEFAULT_EV_GUIDANCE_CHECKLIST.
// Duplicated here (not imported) since this admin app has no shared module
// with the backend — same convention as pdiChecklistTemplate-style seeding
// elsewhere in this codebase.
interface HandoverItemRow { item: string; qty: string; remarks: string; received: boolean }
interface InspectionRow { checkpoint: string; ok: boolean; na: boolean; remarks: string }
interface EvGuidanceRow { topic: string; explained: boolean }

const DEFAULT_ITEMS_HANDED_OVER: HandoverItemRow[] = [
  { item: 'GEELY Vehicle', qty: '1', remarks: 'As specified above', received: false },
  { item: 'Vehicle Keys', qty: '', remarks: '', received: false },
  { item: 'Charging Cable / Equipment', qty: '', remarks: '', received: false },
  { item: "Owner's Manual / User Guide", qty: '', remarks: '', received: false },
  { item: 'Warranty Documents', qty: '', remarks: '', received: false },
  { item: 'Registration / Related Documents', qty: '', remarks: 'If applicable', received: false },
  { item: 'Other Accessories / Documents', qty: '', remarks: '', received: false },
];

const DEFAULT_INSPECTION_CHECKLIST: InspectionRow[] = [
  { checkpoint: 'Exterior body & paint', ok: false, na: false, remarks: '' },
  { checkpoint: 'Windows / mirrors / lights', ok: false, na: false, remarks: '' },
  { checkpoint: 'Tyres & wheels', ok: false, na: false, remarks: '' },
  { checkpoint: 'Interior condition', ok: false, na: false, remarks: '' },
  { checkpoint: 'Dashboard / warning indicators', ok: false, na: false, remarks: '' },
  { checkpoint: 'Charging port & equipment', ok: false, na: false, remarks: '' },
  { checkpoint: 'Keys / remote', ok: false, na: false, remarks: '' },
  { checkpoint: 'VIN / chassis number & odometer', ok: false, na: false, remarks: '' },
];

const DEFAULT_EV_GUIDANCE_CHECKLIST: EvGuidanceRow[] = [
  { topic: 'Vehicle operation', explained: false },
  { topic: 'Charging procedure', explained: false },
  { topic: 'Charging equipment / cable', explained: false },
  { topic: 'Key safety features', explained: false },
  { topic: 'Recommended maintenance', explained: false },
  { topic: 'Warranty / service process', explained: false },
];

// Dedicated handover action — replaces the generic "Move Order" button for
// the READY_FOR_DELIVERY -> DELIVERED transition specifically, so there's
// exactly one way to complete a handover instead of a generic status button
// that sends no customer notification. "Complete Handover" both performs
// the transition (reusing the existing state-machine-gated status route)
// and fires the delivery confirmation email in one action.
interface OrderHandoverData {
  id: string;
  status: string;
  deliveredAt: string | null;
  handoverNotifiedAt: string | null;
  customerEmail: string | null;
  handoverSignedDocumentUrl: string | null;
  handoverSignedAt: string | null;
  handoverCountersignedAt: string | null;
  registrationNumber: string | null;
  registeredAt: string | null;
  invoiceNo: string | null;
  invoicedAt: string | null;
  // Delivery & Handover Note format fields (Kerchanshe Trading PLC draft).
  deliveryNoteNo: string | null;
  odometerAtDelivery: number | null;
  customerTitle: string | null;
  itemsHandedOver: HandoverItemRow[] | null;
  inspectionChecklist: InspectionRow[] | null;
  evGuidanceChecklist: EvGuidanceRow[] | null;
  handoverDamageNotes: string | null;
  handoverOutstandingItems: string | null;
  handoverResponsiblePerson: string | null;
  handoverExpectedCompletionDate: string | null;
}

async function parseJsonResponse(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Server error (${res.status}). Please try again.` };
  }
}

export default function OrderHandoverPanel({
  order,
  canManage,
  canCountersign,
  onUpdated,
}: {
  order: OrderHandoverData;
  canManage: boolean;
  canCountersign: boolean;
  onUpdated: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [signOffBusy, setSignOffBusy] = useState(false);
  const [signOffError, setSignOffError] = useState('');
  const [signOffNotice, setSignOffNotice] = useState('');
  const [managerSignature, setManagerSignature] = useState<{ signedByName: string | null; signatureUrl: string | null } | null>(null);
  const [managerLinkBusy, setManagerLinkBusy] = useState(false);
  const [managerLinkNotice, setManagerLinkNotice] = useState('');
  const [itemsHandedOver, setItemsHandedOver] = useState<HandoverItemRow[]>(order.itemsHandedOver?.length ? order.itemsHandedOver : DEFAULT_ITEMS_HANDED_OVER);
  const [inspectionChecklist, setInspectionChecklist] = useState<InspectionRow[]>(order.inspectionChecklist?.length ? order.inspectionChecklist : DEFAULT_INSPECTION_CHECKLIST);
  const [evGuidanceChecklist, setEvGuidanceChecklist] = useState<EvGuidanceRow[]>(order.evGuidanceChecklist?.length ? order.evGuidanceChecklist : DEFAULT_EV_GUIDANCE_CHECKLIST);
  const [odometerAtDelivery, setOdometerAtDelivery] = useState(order.odometerAtDelivery?.toString() || '');
  const [customerTitle, setCustomerTitle] = useState(order.customerTitle || '');
  const [handoverDamageNotes, setHandoverDamageNotes] = useState(order.handoverDamageNotes || '');
  const [handoverOutstandingItems, setHandoverOutstandingItems] = useState(order.handoverOutstandingItems || '');
  const [handoverResponsiblePerson, setHandoverResponsiblePerson] = useState(order.handoverResponsiblePerson || '');
  const [handoverExpectedCompletionDate, setHandoverExpectedCompletionDate] = useState(order.handoverExpectedCompletionDate?.slice(0, 10) || '');
  const [checklistBusy, setChecklistBusy] = useState(false);
  const [checklistSaved, setChecklistSaved] = useState(false);
  const [deliveryNoteBusy, setDeliveryNoteBusy] = useState(false);

  useEffect(() => {
    if (!order.handoverSignedDocumentUrl) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/documents/sign?documentType=HANDOVER&entityId=${order.id}`);
        if (!res.ok) return;
        const { signatures } = await res.json();
        setManagerSignature((signatures || []).find((s: { role: string }) => s.role === 'manager') || null);
      } catch {
        // Non-fatal — the extra "signature on file" line simply won't appear.
      }
    })();
  }, [order.id, order.handoverSignedDocumentUrl, order.handoverCountersignedAt]);

  if (order.status !== 'READY_FOR_DELIVERY' && order.status !== 'DELIVERED') {
    return null;
  }

  const sendSignOff = async () => {
    setSignOffBusy(true);
    setSignOffError('');
    setSignOffNotice('');
    try {
      const res = await fetch(`/api/orders/${order.id}/send-handover-signoff`, { method: 'POST' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Unable to send the handover sign-off link.');
      setSignOffNotice(
        data.notificationSent
          ? `Sign-off link emailed to ${order.customerEmail}.`
          : `Could not email the sign-off link${data.notificationError ? `: ${data.notificationError}` : ' — check SMTP settings.'}`
      );
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setSignOffError(err.message);
    } finally {
      setSignOffBusy(false);
    }
  };

  const countersign = async () => {
    setSignOffBusy(true);
    setSignOffError('');
    setSignOffNotice('');
    try {
      const res = await fetch(`/api/orders/${order.id}/handover-countersign`, { method: 'POST' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Unable to countersign this handover.');
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setSignOffError(err.message);
    } finally {
      setSignOffBusy(false);
    }
  };

  const sendManagerCountersignLink = async () => {
    setManagerLinkBusy(true);
    setManagerLinkNotice('');
    try {
      const res = await fetch(`/api/orders/${order.id}/send-handover-countersign-link`, { method: 'POST' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Unable to send countersign link.');
      setManagerLinkNotice(
        data.notificationSent
          ? 'Manager countersign link emailed successfully.'
          : `Could not send email${data.notificationError ? `: ${data.notificationError}` : ' — check SMTP settings.'}`
      );
    } catch (err: any) {
      setSignOffError(err.message);
    } finally {
      setManagerLinkBusy(false);
    }
  };

  const saveChecklist = async () => {
    setChecklistBusy(true);
    setError('');
    setChecklistSaved(false);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemsHandedOver,
          inspectionChecklist,
          evGuidanceChecklist,
          odometerAtDelivery: odometerAtDelivery || null,
          customerTitle,
          handoverDamageNotes,
          handoverOutstandingItems,
          handoverResponsiblePerson,
          handoverExpectedCompletionDate: handoverExpectedCompletionDate || null,
        }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to save the handover checklist.');
      setChecklistSaved(true);
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setChecklistBusy(false);
    }
  };

  const generateDeliveryNote = async () => {
    setDeliveryNoteBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/orders/${order.id}/delivery-note`, { method: 'POST' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to generate the delivery note number.');
      onUpdated();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeliveryNoteBusy(false);
    }
  };

  const completeHandover = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      if (order.status !== 'DELIVERED') {
        const statusRes = await fetch(`/api/orders/${order.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ toStatus: 'DELIVERED' }),
        });
        const statusData = await parseJsonResponse(statusRes);
        if (!statusRes.ok) throw new Error(statusData.error || 'Unable to mark this order delivered.');
      }

      const emailRes = await fetch(`/api/orders/${order.id}/handover-email`, { method: 'POST' });
      const emailData = await parseJsonResponse(emailRes);
      if (!emailRes.ok) throw new Error(emailData.error || 'Delivered, but the confirmation email failed to send.');

      setNotice(
        order.customerEmail
          ? emailData.notificationSent
            ? `Delivery confirmation emailed to ${order.customerEmail}.`
            : `Delivered, but the confirmation email could not be sent${emailData.notificationError ? `: ${emailData.notificationError}` : ' — check SMTP settings.'}`
          : 'Delivered. No customer email on file, so no confirmation was sent.'
      );
      onUpdated();
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
        <PackageCheck className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-900">Handover</h2>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-blue-700">{notice}</p>}

      <div className="border-b border-gray-100 pb-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-900">Delivery Note No.</p>
            <p className="text-sm text-gray-700">{order.deliveryNoteNo || 'Not yet generated'}</p>
          </div>
          <div className="flex items-center gap-3">
            {canManage && !order.deliveryNoteNo && (
              <Button variant="secondary" onClick={generateDeliveryNote} disabled={deliveryNoteBusy}>
                {deliveryNoteBusy ? 'Generating…' : 'Generate Delivery Note No.'}
              </Button>
            )}
            <a
              href={withBasePath(`/api/orders/${order.id}/handover-pdf`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-geely-blue hover:underline"
            >
              <FileText className="w-4 h-4" />
              View / Print Handover Note
            </a>
          </div>
        </div>

        {canManage && (
          <div className="space-y-4">
            {checklistSaved && <p className="text-xs text-green-600">Saved.</p>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Odometer at delivery (km)</label>
                <input type="number" min={0} value={odometerAtDelivery} onChange={(e) => setOdometerAtDelivery(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Customer title (if applicable)</label>
                <input value={customerTitle} onChange={(e) => setCustomerTitle(e.target.value)} placeholder="e.g. Owner, Fleet Manager" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Items Handed Over</p>
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {itemsHandedOver.map((row, i) => (
                  <li key={row.item} className="flex items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.received}
                      onChange={(e) => setItemsHandedOver((rows) => rows.map((r, ri) => (ri === i ? { ...r, received: e.target.checked } : r)))}
                      className="w-4 h-4 shrink-0"
                    />
                    <span className="text-sm text-gray-800 flex-1">{row.item}</span>
                    <input
                      value={row.qty}
                      onChange={(e) => setItemsHandedOver((rows) => rows.map((r, ri) => (ri === i ? { ...r, qty: e.target.value } : r)))}
                      placeholder="Qty"
                      className="w-16 border border-gray-300 rounded px-2 py-1 text-xs"
                    />
                    <input
                      value={row.remarks}
                      onChange={(e) => setItemsHandedOver((rows) => rows.map((r, ri) => (ri === i ? { ...r, remarks: e.target.value } : r)))}
                      placeholder="Remarks"
                      className="w-32 border border-gray-300 rounded px-2 py-1 text-xs"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Vehicle Inspection &amp; Condition</p>
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {inspectionChecklist.map((row, i) => (
                  <li key={row.checkpoint} className="flex items-center gap-3 px-3 py-2">
                    <span className="text-sm text-gray-800 flex-1">{row.checkpoint}</span>
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={row.ok}
                        onChange={(e) => setInspectionChecklist((rows) => rows.map((r, ri) => (ri === i ? { ...r, ok: e.target.checked, na: e.target.checked ? false : r.na } : r)))}
                        className="w-4 h-4"
                      />
                      OK
                    </label>
                    <label className="flex items-center gap-1 text-xs text-gray-500">
                      <input
                        type="checkbox"
                        checked={row.na}
                        onChange={(e) => setInspectionChecklist((rows) => rows.map((r, ri) => (ri === i ? { ...r, na: e.target.checked, ok: e.target.checked ? false : r.ok } : r)))}
                        className="w-4 h-4"
                      />
                      N/A
                    </label>
                    <input
                      value={row.remarks}
                      onChange={(e) => setInspectionChecklist((rows) => rows.map((r, ri) => (ri === i ? { ...r, remarks: e.target.value } : r)))}
                      placeholder="Remarks"
                      className="w-32 border border-gray-300 rounded px-2 py-1 text-xs"
                    />
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">EV Handover &amp; Customer Guidance</p>
              <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                {evGuidanceChecklist.map((row, i) => (
                  <li key={row.topic} className="flex items-center gap-3 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={row.explained}
                      onChange={(e) => setEvGuidanceChecklist((rows) => rows.map((r, ri) => (ri === i ? { ...r, explained: e.target.checked } : r)))}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-800">{row.topic}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Visible damage / shortage</label>
                <input value={handoverDamageNotes} onChange={(e) => setHandoverDamageNotes(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Outstanding item(s)</label>
                <input value={handoverOutstandingItems} onChange={(e) => setHandoverOutstandingItems(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Action / responsible person</label>
                <input value={handoverResponsiblePerson} onChange={(e) => setHandoverResponsiblePerson(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Expected completion date</label>
                <input type="date" value={handoverExpectedCompletionDate} onChange={(e) => setHandoverExpectedCompletionDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            <Button variant="secondary" onClick={saveChecklist} disabled={checklistBusy}>
              {checklistBusy ? 'Saving…' : 'Save Handover Checklist'}
            </Button>
          </div>
        )}
      </div>

      {order.status === 'DELIVERED' ? (
        <div className="text-sm text-gray-700 space-y-2">
          <p>
            Delivered {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : ''}
            {order.handoverNotifiedAt && ` · confirmation sent ${new Date(order.handoverNotifiedAt).toLocaleString()}`}
          </p>
          {canManage && (
            <Button variant="secondary" onClick={completeHandover} disabled={busy}>
              {busy ? 'Sending…' : 'Resend Confirmation'}
            </Button>
          )}
        </div>
      ) : (
        canManage && (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              Marks this order Delivered and
              {order.customerEmail ? ` emails ${order.customerEmail} a delivery confirmation with the invoice attached.` : ' — no customer email is on file, so no confirmation will be emailed.'}
            </p>
            <Button onClick={completeHandover} disabled={busy}>
              {busy ? 'Completing…' : 'Complete Handover'}
            </Button>
          </div>
        )
      )}

      {order.status === 'DELIVERED' && (
        <div className="border-t border-gray-100 pt-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Customer Sign-Off</h3>
          {signOffError && <p className="text-sm text-red-600">{signOffError}</p>}
          {signOffNotice && <p className="text-sm text-blue-700">{signOffNotice}</p>}

          {!order.handoverSignedDocumentUrl ? (
            canManage && (
              <div>
                <p className="text-xs text-gray-500 mb-3">
                  Emails the customer a link to confirm receipt of the vehicle (draw a signature or upload a signed printout).
                  {!order.customerEmail && ' No customer email is on file, so no link can be sent.'}
                </p>
                <Button variant="secondary" onClick={sendSignOff} disabled={signOffBusy || !order.customerEmail}>
                  {signOffBusy ? 'Sending…' : 'Send Handover Sign-Off Link'}
                </Button>
              </div>
            )
          ) : (
            <div className="text-sm text-gray-700 space-y-2">
              <p>Customer signed {order.handoverSignedAt ? new Date(order.handoverSignedAt).toLocaleString() : ''}.</p>
              {order.handoverCountersignedAt ? (
                <div className="text-green-600 font-medium">
                  <p>Countersigned {new Date(order.handoverCountersignedAt).toLocaleString()} — handover complete.</p>
                  {managerSignature?.signedByName && <p className="mt-1">Signed by manager: {managerSignature.signedByName}</p>}
                  {managerSignature?.signatureUrl && <p className="mt-1 text-green-700">Manager signature is on file.</p>}
                </div>
              ) : canCountersign ? (
                <div className="space-y-2">
                  <Button onClick={countersign} disabled={signOffBusy}>
                    {signOffBusy ? 'Countersigning…' : 'Countersign Handover'}
                  </Button>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">
                      Or email a countersign link to the manager so they can sign remotely.
                    </p>
                    <Button variant="secondary" onClick={sendManagerCountersignLink} disabled={managerLinkBusy}>
                      {managerLinkBusy ? 'Sending…' : 'Send Manager Countersign Link'}
                    </Button>
                    {managerLinkNotice && <p className="text-xs text-blue-700 mt-1">{managerLinkNotice}</p>}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-orange-600">Awaiting manager countersignature.</p>
                  {canManage && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-2">
                        Email a countersign link to the manager so they can sign remotely.
                      </p>
                      <Button variant="secondary" onClick={sendManagerCountersignLink} disabled={managerLinkBusy}>
                        {managerLinkBusy ? 'Sending…' : 'Send Manager Countersign Link'}
                      </Button>
                      {managerLinkNotice && <p className="text-xs text-blue-700 mt-1">{managerLinkNotice}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
