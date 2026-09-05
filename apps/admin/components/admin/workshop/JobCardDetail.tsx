'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getAllowedTransitions,
  JOB_CARD_STATUS_COLORS,
  JOB_CARD_STATUS_LABELS,
} from '@/lib/services/workshop/jobCardStateMachine';
import {
  WARRANTY_CLAIM_STATUS_COLORS,
  WARRANTY_CLAIM_STATUS_LABELS,
} from '@/lib/services/workshop/warrantyClaimStateMachine';
import type { AdminPermissions } from '@geely/types';
import { Card, Button, LinkButton } from '@/components/admin/ui';

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedById: string;
  reasonCode: string | null;
  changedAt: string;
}

interface JobCardPartLine {
  id: string;
  quantity: number;
  unitPrice: number;
  status: string;
  isWarranty: boolean;
  sparePart: { id: string; name: string; sku: string };
}

interface WarrantyClaimSummary {
  id: string;
  claimNo: string;
  status: string;
}

interface SparePartOption {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  reservedQty: number;
}

interface JobCardData {
  id: string;
  jobCardNo: string;
  plateNo: string;
  vin: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  mileage: number | null;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  complaintText: string | null;
  diagnosisNotes: string | null;
  estimateAmount: number | null;
  isWarrantyOrGoodwill: boolean;
  customerApprovedAt: string | null;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  status: string;
  qcPassed: boolean | null;
  qcNotes: string | null;
  invoiceAmount: number | null;
  technician: { id: string; name: string } | null;
  bay: { id: string; name: string; bayType: string } | null;
  statusHistory: StatusHistoryEntry[];
  jobCardParts: JobCardPartLine[];
  warrantyClaims: WarrantyClaimSummary[];
  customerVehicle: {
    id: string;
    customer: { fullName: string; phone: string };
    jobCards: { id: string }[];
  } | null;
}

export default function JobCardDetail({
  jobCard,
  technicians,
  bays,
  spareParts,
  permissions,
}: {
  jobCard: JobCardData;
  technicians: { id: string; name: string }[];
  bays: { id: string; name: string; bayType: string }[];
  spareParts: SparePartOption[];
  permissions: AdminPermissions;
}) {
  const router = useRouter();
  const [state, setState] = useState(jobCard);
  const [diagnosisNotes, setDiagnosisNotes] = useState(state.diagnosisNotes || '');
  const [complaintDraft, setComplaintDraft] = useState(state.complaintText || '');
  const [estimateAmount, setEstimateAmount] = useState(state.estimateAmount?.toString() || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notificationFeedback, setNotificationFeedback] = useState<{
    milestone: string;
    results: { channel: string; success: boolean; reason?: string }[];
  } | null>(null);
  const [qcNotes, setQcNotes] = useState('');
  const [partSparePartId, setPartSparePartId] = useState('');
  const [partQuantity, setPartQuantity] = useState('1');
  const [partIsWarranty, setPartIsWarranty] = useState(false);
  const [warrantyStartDate, setWarrantyStartDate] = useState(state.warrantyStartDate?.slice(0, 10) || '');
  const [warrantyEndDate, setWarrantyEndDate] = useState(state.warrantyEndDate?.slice(0, 10) || '');

  const refresh = async () => {
    const res = await fetch(`/api/admin/workshop/job-cards/${state.id}`);
    if (res.ok) {
      const data = await res.json();
      setState(data.jobCard);
    }
    router.refresh();
  };

  const patchFields = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/workshop/job-cards/${state.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
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

  const transition = async (toStatus: string, extra: Record<string, unknown> = {}) => {
    setBusy(true);
    setError('');
    setNotificationFeedback(null);
    try {
      const res = await fetch(`/api/admin/workshop/job-cards/${state.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Transition failed');
      if (data.notification) {
        const results = [...data.notification.results];
        if (data.csiSurveyInvite) {
          results.push({
            channel: 'CSI Survey',
            success: data.csiSurveyInvite.success,
            reason: data.csiSurveyInvite.reason,
          });
        }
        setNotificationFeedback({ milestone: data.notification.milestone, results });
      }
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reassign = async (field: 'technicianId' | 'bayId', value: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/workshop/job-cards/${state.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reassign failed');
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const requestPart = async () => {
    if (!partSparePartId || !partQuantity) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/workshop/job-cards/${state.id}/parts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sparePartId: partSparePartId, quantity: Number(partQuantity), isWarranty: partIsWarranty }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setPartSparePartId('');
      setPartQuantity('1');
      setPartIsWarranty(false);
      await refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updatePartLine = async (lineId: string, action: 'issue' | 'backorder' | 'cancel') => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/workshop/job-cards/${state.id}/parts/${lineId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
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

  const hasWarrantyPart = state.jobCardParts.some((p) => p.isWarranty);
  const canSubmitClaim = state.isWarrantyOrGoodwill || hasWarrantyPart;

  const allowedTransitions = getAllowedTransitions(state.status as any);

  const isQcStage = state.status === 'QUALITY_CONTROL';
  const canAct = isQcStage ? permissions.canPerformQC : permissions.canManageJobCards;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{state.jobCardNo}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {state.vehicleModel || 'Vehicle'} · {state.plateNo} {state.vin && `· VIN ${state.vin}`}
              {state.mileage ? ` · ${state.mileage.toLocaleString()} km` : ''}
            </p>
            <p className="text-sm text-gray-500">{state.customerName} · {state.customerPhone}{state.customerEmail ? ` · ${state.customerEmail}` : ''}</p>
            {state.customerVehicle && (
              <p className="text-xs text-geely-blue mt-1">
                Linked vehicle record
                {state.customerVehicle.jobCards.length > 1
                  ? ` · ${state.customerVehicle.jobCards.length - 1} other visit${state.customerVehicle.jobCards.length - 1 === 1 ? '' : 's'} on file`
                  : ' · first visit on file'}
              </p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${JOB_CARD_STATUS_COLORS[state.status as keyof typeof JOB_CARD_STATUS_COLORS]}`}>
            {JOB_CARD_STATUS_LABELS[state.status as keyof typeof JOB_CARD_STATUS_LABELS]}
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="text-xs font-medium text-gray-500 uppercase mb-1">Customer complaint</div>
          {!state.complaintText && (
            <p className="text-xs text-orange-600 mb-2">
              No complaint on file yet — this job card was created via self check-in. Capture it before proceeding.
            </p>
          )}
          {permissions.canManageJobCards ? (
            <div className="space-y-2">
              <textarea
                rows={2}
                value={complaintDraft}
                onChange={(e) => setComplaintDraft(e.target.value)}
                placeholder="What did the customer report?"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
              {complaintDraft !== (state.complaintText || '') && (
                <Button
                  variant="secondary"
                  onClick={() => patchFields({ complaintText: complaintDraft })}
                  disabled={busy || !complaintDraft.trim()}
                >
                  Save Complaint
                </Button>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-800">{state.complaintText || '—'}</p>
          )}
        </div>
      </Card>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      {notificationFeedback && (
        <div className="bg-blue-50 border border-blue-200 text-blue-900 text-sm rounded-lg px-4 py-3 space-y-1.5">
          <p className="font-medium">Customer notification — {notificationFeedback.milestone.replace(/_/g, ' ')}</p>
          <ul className="space-y-1">
            {notificationFeedback.results.map((r) => (
              <li key={r.channel} className="flex items-start gap-2">
                <span className={`mt-1.5 inline-block w-1.5 h-1.5 rounded-full shrink-0 ${r.success ? 'bg-green-500' : 'bg-orange-400'}`} />
                <span>
                  <span className="capitalize font-medium">{r.channel}:</span>{' '}
                  {r.success ? 'Sent' : r.reason || 'Not sent'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Assignment */}
      <Card className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Technician</label>
          <select
            disabled={busy || !permissions.canManageJobCards}
            defaultValue={state.technician?.id || ''}
            onChange={(e) => reassign('technicianId', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— Unassigned —</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Bay</label>
          <select
            disabled={busy || !permissions.canManageJobCards}
            defaultValue={state.bay?.id || ''}
            onChange={(e) => reassign('bayId', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">— Awaiting bay —</option>
            {bays.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.bayType.replace('_', ' ')})</option>
            ))}
          </select>
          <p className="text-xs text-gray-400 mt-1">Set exact time slots from the Bay Scheduling Board.</p>
        </div>
      </Card>

      {/* Diagnosis & estimate */}
      <Card className="space-y-4">
        <h2 className="font-semibold text-gray-900">Diagnosis & Estimate</h2>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Diagnosis notes</label>
          <textarea
            rows={3}
            value={diagnosisNotes}
            onChange={(e) => setDiagnosisNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            disabled={!permissions.canManageJobCards}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Estimate amount (ETB)</label>
            <input
              type="number"
              value={estimateAmount}
              onChange={(e) => setEstimateAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              disabled={!permissions.canManageJobCards}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={state.isWarrantyOrGoodwill}
              onChange={(e) => patchFields({ isWarrantyOrGoodwill: e.target.checked })}
              disabled={!permissions.canManageJobCards}
            />
            Warranty / goodwill (no customer approval required)
          </label>
        </div>
        {permissions.canManageJobCards && (
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => patchFields({ diagnosisNotes, estimateAmount: estimateAmount || null })}
              disabled={busy}
            >
              Save Diagnosis & Estimate
            </Button>
            {!state.customerApprovedAt && !state.isWarrantyOrGoodwill && (
              <Button onClick={() => patchFields({ approve: true })} disabled={busy}>
                Record Customer Approval
              </Button>
            )}
            {state.customerApprovedAt && (
              <span className="text-xs text-green-700">Approved {new Date(state.customerApprovedAt).toLocaleString()}</span>
            )}
          </div>
        )}
      </Card>

      {/* Parts requested/issued against this job card (FR-401-404, UC-07) */}
      <Card className="space-y-4">
        <h2 className="font-semibold text-gray-900">Parts</h2>
        {state.jobCardParts.length > 0 && (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-medium text-gray-500 uppercase border-b border-gray-100">
                <th className="pb-2">Part</th>
                <th className="pb-2">Qty</th>
                <th className="pb-2">Unit Price</th>
                <th className="pb-2">Status</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {state.jobCardParts.map((line) => (
                <tr key={line.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-2">
                    {line.sparePart.name} <span className="text-gray-400">({line.sparePart.sku})</span>
                    {line.isWarranty && <span className="ml-2 text-xs text-purple-600">Warranty</span>}
                  </td>
                  <td className="py-2">{line.quantity}</td>
                  <td className="py-2">ETB {line.unitPrice.toLocaleString()}</td>
                  <td className="py-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {line.status}
                    </span>
                  </td>
                  <td className="py-2">
                    {permissions.canManagePartsIssue && (line.status === 'REQUESTED' || line.status === 'BACKORDERED') && (
                      <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => updatePartLine(line.id, 'issue')} disabled={busy}>
                          Issue
                        </Button>
                        {line.status === 'REQUESTED' && (
                          <Button variant="secondary" onClick={() => updatePartLine(line.id, 'backorder')} disabled={busy}>
                            Backorder
                          </Button>
                        )}
                        <Button variant="danger" onClick={() => updatePartLine(line.id, 'cancel')} disabled={busy}>
                          Cancel
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
        {permissions.canManageJobCards && (
          <div className="flex flex-wrap items-end gap-3 pt-2 border-t border-gray-100">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-gray-600 mb-1">Part</label>
              <select
                value={partSparePartId}
                onChange={(e) => setPartSparePartId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">— Select a part —</option>
                {spareParts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — {p.stock - p.reservedQty} available
                  </option>
                ))}
              </select>
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
              <input
                type="number"
                min={1}
                value={partQuantity}
                onChange={(e) => setPartQuantity(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pb-2">
              <input type="checkbox" checked={partIsWarranty} onChange={(e) => setPartIsWarranty(e.target.checked)} />
              Warranty
            </label>
            <Button onClick={requestPart} disabled={busy || !partSparePartId}>
              Request Part
            </Button>
          </div>
        )}
      </Card>

      {/* Warranty eligibility + claims (FR-501-504, UC-09) */}
      <Card className="space-y-4">
        <h2 className="font-semibold text-gray-900">Warranty</h2>
        {permissions.canManageJobCards && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Warranty start date</label>
              <input
                type="date"
                value={warrantyStartDate}
                onChange={(e) => setWarrantyStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Warranty end date</label>
              <input
                type="date"
                value={warrantyEndDate}
                onChange={(e) => setWarrantyEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <Button
                variant="secondary"
                onClick={() => patchFields({ warrantyStartDate: warrantyStartDate || null, warrantyEndDate: warrantyEndDate || null })}
                disabled={busy}
              >
                Save Warranty Dates
              </Button>
            </div>
          </div>
        )}

        {state.warrantyClaims.length > 0 && (
          <ul className="space-y-2">
            {state.warrantyClaims.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <Link href={`/admin/workshop/warranty-claims/${c.id}`} className="text-geely-blue hover:underline">
                  {c.claimNo}
                </Link>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${WARRANTY_CLAIM_STATUS_COLORS[c.status as keyof typeof WARRANTY_CLAIM_STATUS_COLORS]}`}>
                  {WARRANTY_CLAIM_STATUS_LABELS[c.status as keyof typeof WARRANTY_CLAIM_STATUS_LABELS]}
                </span>
              </li>
            ))}
          </ul>
        )}

        {permissions.canManageJobCards && canSubmitClaim && (
          <LinkButton href={`/admin/workshop/warranty-claims/new?jobCardId=${state.id}`} variant="secondary">
            Submit Warranty Claim
          </LinkButton>
        )}
        {permissions.canManageJobCards && !canSubmitClaim && (
          <p className="text-xs text-gray-400">
            Flag a part as warranty, or mark the job card as warranty/goodwill, to submit a claim.
          </p>
        )}
      </Card>

      {/* QC (only shown once the job is in the QC stage) */}
      {isQcStage && (
        <Card className="space-y-3 border-purple-200">
          <h2 className="font-semibold text-gray-900">Quality Control Sign-off</h2>
          <textarea
            rows={2}
            placeholder="QC notes (required if failing)"
            value={qcNotes}
            onChange={(e) => setQcNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            disabled={!permissions.canPerformQC}
          />
          {permissions.canPerformQC ? (
            <div className="flex gap-3">
              <Button
                onClick={() => transition('INVOICED_CLOSED', { qcPassed: true, qcNotes })}
                disabled={busy}
                className="bg-green-600 hover:bg-green-700"
              >
                Pass QC → Invoice/Close
              </Button>
              <Button variant="danger" onClick={() => transition('IN_PROGRESS', { qcPassed: false, qcNotes })} disabled={busy}>
                Fail QC → Rework
              </Button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Only a Service Manager (or above) can record a QC outcome.</p>
          )}
        </Card>
      )}

      {/* Status transitions */}
      {!isQcStage && allowedTransitions.length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Move Status</h2>
          <div className="flex flex-wrap gap-2">
            {allowedTransitions.map((next) => (
              <Button key={next} variant="secondary" onClick={() => transition(next)} disabled={busy || !canAct}>
                {JOB_CARD_STATUS_LABELS[next as keyof typeof JOB_CARD_STATUS_LABELS]}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Status history timeline */}
      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Status Timeline</h2>
        <ol className="space-y-2">
          {state.statusHistory.map((h) => (
            <li key={h.id} className="text-sm flex items-center gap-3">
              <span className="text-gray-400 w-40 shrink-0">{new Date(h.changedAt).toLocaleString()}</span>
              <span>
                {h.fromStatus ? `${JOB_CARD_STATUS_LABELS[h.fromStatus as keyof typeof JOB_CARD_STATUS_LABELS]} → ` : ''}
                <strong>{JOB_CARD_STATUS_LABELS[h.toStatus as keyof typeof JOB_CARD_STATUS_LABELS]}</strong>
              </span>
              {h.reasonCode && <span className="text-xs text-gray-400">({h.reasonCode})</span>}
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
