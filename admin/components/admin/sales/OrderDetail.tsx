'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAllowedOrderTransitions,
  ORDER_STATUS_COLORS,
  ORDER_STATUS_LABELS,
  FINANCING_STATUS_LABELS,
} from '@/lib/sales/orderStateMachine';
import { AdminRole, type AdminPermissions } from '@/lib/auth/types';
import { Card, Button, Badge, type Tone } from '@/components/admin/ui';
import { ConfigurationSummary } from '@/components/admin/sales/ConfigurationSummary';
import OrderApprovalPanel from '@/components/admin/sales/OrderApprovalPanel';
import OrderFulfillmentPanel from '@/components/admin/sales/OrderFulfillmentPanel';
import OrderCommissionPanel from '@/components/admin/sales/OrderCommissionPanel';
import OrderHandoverPanel from '@/components/admin/sales/OrderHandoverPanel';
import OrderTestDrivePanel from '@/components/admin/sales/OrderTestDrivePanel';
import { isPdfUrl, resolveDocumentUrl } from '@/lib/fileType';
import { FileText } from 'lucide-react';

interface PdiItem {
  id: string;
  label: string;
  isChecked: boolean;
  checkedAt: string | null;
}

interface StatusHistoryEntry {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
}

interface OrderTestDrive {
  id: string;
  status: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  reference: string | null;
}

interface OrderData {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  vehicleModel: string;
  configurationJson: unknown;
  totalPrice: number | null;
  financingStatus: string;
  status: string;
  orderDate: string;
  deliveredAt: string | null;
  handoverNotifiedAt: string | null;
  approvedAt: string | null;
  agreementSentAt: string | null;
  signedDocumentUrl: string | null;
  signedAt: string | null;
  countersignedAt: string | null;
  paymentStatus: string;
  paymentProofUrl: string | null;
  paymentSubmittedAt: string | null;
  paymentConfirmedAt: string | null;
  registrationNumber: string | null;
  registeredAt: string | null;
  invoiceNo: string | null;
  invoiceAmount: number | null;
  invoicedAt: string | null;
  salesAgentId: string | null;
  commissionRate: number | null;
  commissionAmount: number | null;
  commissionStatus: string;
  pdiItems: PdiItem[];
  statusHistory: StatusHistoryEntry[];
  quotation: { id: string } | null;
  testDrives: OrderTestDrive[];
  handoverSignedDocumentUrl: string | null;
  handoverSignedAt: string | null;
  handoverCountersignedAt: string | null;
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Not Paid',
  PENDING_REVIEW: 'Pending Review',
  PAID: 'Paid',
};

const PAYMENT_STATUS_TONE: Record<string, Tone> = {
  UNPAID: 'gray',
  PENDING_REVIEW: 'orange',
  PAID: 'green',
};

export default function OrderDetail({
  order,
  permissions,
  role,
  webAppUrl,
}: {
  order: OrderData;
  permissions: AdminPermissions;
  role: AdminRole;
  webAppUrl: string;
}) {
  const router = useRouter();
  const [state, setState] = useState(order);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [totalPrice, setTotalPrice] = useState(state.totalPrice?.toString() || '');
  const canCountersign = permissions.canManageQuotations && permissions.canCountersignAgreements;

  const refresh = async () => {
    const res = await fetch(`/api/admin/orders/${state.id}`);
    if (res.ok) setState((await res.json()).order);
    router.refresh();
  };

  const patchFields = async (body: Record<string, unknown>) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${state.id}`, {
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

  const transition = async (toStatus: string) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${state.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toStatus }),
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

  const togglePdi = async (itemId: string, isChecked: boolean) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${state.id}/pdi`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, isChecked }),
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

  const confirmPayment = async (action: 'confirm' | 'reject') => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/orders/${state.id}/payment/confirm`, {
        method: 'POST',
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

  const pdiComplete = state.pdiItems.length > 0 && state.pdiItems.every((p) => p.isChecked);
  const agreementComplete = Boolean(state.approvedAt) && Boolean(state.signedDocumentUrl);
  const paymentComplete = state.paymentStatus === 'PAID';
  const registrationComplete = Boolean(state.registeredAt);
  const invoiceComplete = Boolean(state.invoicedAt);
  const allowedTransitions = getAllowedOrderTransitions(state.status as any, {
    pdiComplete,
    agreementComplete,
    paymentComplete,
    registrationComplete,
    invoiceComplete,
  });

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{state.orderNo}</h1>
            <p className="text-sm text-gray-500 mt-1">{state.vehicleModel}</p>
            <p className="text-sm text-gray-500">
              {state.customerName} · {state.customerPhone}
              {state.customerEmail ? ` · ${state.customerEmail}` : ''}
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${ORDER_STATUS_COLORS[state.status as keyof typeof ORDER_STATUS_COLORS]}`}>
            {ORDER_STATUS_LABELS[state.status as keyof typeof ORDER_STATUS_LABELS]}
          </span>
        </div>
      </Card>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <ConfigurationSummary configuration={state.configurationJson} />

      <Card className="space-y-4">
        <h2 className="font-semibold text-gray-900">Financing &amp; Price</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Financing status</label>
            <select
              value={state.financingStatus}
              onChange={(e) => patchFields({ financingStatus: e.target.value })}
              disabled={!permissions.canManageQuotations || busy}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {Object.entries(FINANCING_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Total price</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                disabled={!permissions.canManageQuotations || Boolean(state.approvedAt)}
              />
              {permissions.canManageQuotations && !state.approvedAt && totalPrice !== (state.totalPrice?.toString() || '') && (
                <Button variant="secondary" onClick={() => patchFields({ totalPrice: totalPrice || null })} disabled={busy}>
                  Save
                </Button>
              )}
            </div>
            {state.approvedAt && (
              <p className="mt-1 text-xs text-gray-500">Price locked — order approved.</p>
            )}
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="font-semibold text-gray-900">Pre-Delivery Inspection (PDI)</h2>
        <p className="text-xs text-gray-500">
          Every item must be checked before this order can move to Ready for Delivery.
        </p>
        <ul className="divide-y divide-gray-100">
          {state.pdiItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={item.isChecked}
                onChange={(e) => togglePdi(item.id, e.target.checked)}
                disabled={!permissions.canManageQuotations || busy}
                className="w-4 h-4"
              />
              <span className={`text-sm ${item.isChecked ? 'text-gray-500 line-through' : 'text-gray-800'}`}>{item.label}</span>
            </li>
          ))}
        </ul>
        <p className="text-xs font-medium">
          {pdiComplete ? (
            <span className="text-green-600">All items complete</span>
          ) : (
            <span className="text-orange-600">
              {state.pdiItems.filter((p) => p.isChecked).length} / {state.pdiItems.length} complete
            </span>
          )}
        </p>
      </Card>

      <OrderApprovalPanel
        order={{ id: state.id, customerEmail: state.customerEmail, approvedAt: state.approvedAt, agreementSentAt: state.agreementSentAt, signedDocumentUrl: state.signedDocumentUrl, signedAt: state.signedAt, countersignedAt: state.countersignedAt }}
        canManage={permissions.canManageQuotations}
        canCountersign={canCountersign}
        webAppUrl={webAppUrl}
        onUpdated={refresh}
      />

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Payment</h2>
          <Badge tone={PAYMENT_STATUS_TONE[state.paymentStatus] ?? 'gray'}>
            {PAYMENT_STATUS_LABELS[state.paymentStatus] ?? state.paymentStatus}
          </Badge>
        </div>

        {state.paymentProofUrl && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-1">Submitted proof</p>
            {isPdfUrl(state.paymentProofUrl) ? (
              <a
                href={resolveDocumentUrl(state.paymentProofUrl, webAppUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-geely-blue hover:underline"
              >
                <FileText className="w-4 h-4" />
                View submitted PDF
              </a>
            ) : (
              <img
                src={resolveDocumentUrl(state.paymentProofUrl, webAppUrl)}
                alt="Payment proof"
                className="w-32 h-20 object-cover rounded-lg border border-gray-200"
              />
            )}
            {state.paymentSubmittedAt && (
              <p className="text-xs text-gray-400 mt-1">Submitted {new Date(state.paymentSubmittedAt).toLocaleString()}</p>
            )}
          </div>
        )}

        {state.paymentStatus === 'PAID' && state.paymentConfirmedAt && (
          <p className="text-xs text-green-600">Confirmed {new Date(state.paymentConfirmedAt).toLocaleString()}</p>
        )}

        {permissions.canManageQuotations && state.paymentStatus === 'PENDING_REVIEW' && (
          <div className="flex gap-2">
            <Button onClick={() => confirmPayment('confirm')} disabled={busy}>
              Confirm Payment
            </Button>
            <Button variant="ghost" onClick={() => confirmPayment('reject')} disabled={busy}>
              Reject
            </Button>
          </div>
        )}
      </Card>

      <OrderTestDrivePanel
        order={{ id: state.id, vehicleModel: state.vehicleModel, customerEmail: state.customerEmail }}
        testDrives={state.testDrives}
        canManage={permissions.canManageQuotations}
        onUpdated={refresh}
      />

      <OrderFulfillmentPanel
        order={{
          id: state.id,
          registrationNumber: state.registrationNumber,
          registeredAt: state.registeredAt,
          totalPrice: state.totalPrice,
          invoiceNo: state.invoiceNo,
          invoiceAmount: state.invoiceAmount,
          invoicedAt: state.invoicedAt,
        }}
        canManage={permissions.canManageQuotations}
        onUpdated={refresh}
      />

      <OrderCommissionPanel
        order={{
          id: state.id,
          salesAgentId: state.salesAgentId,
          commissionRate: state.commissionRate,
          commissionAmount: state.commissionAmount,
          commissionStatus: state.commissionStatus,
        }}
        canManage={permissions.canManageQuotations}
        onUpdated={refresh}
      />

      <OrderHandoverPanel
        order={{
          id: state.id,
          status: state.status,
          deliveredAt: state.deliveredAt,
          handoverNotifiedAt: state.handoverNotifiedAt,
          customerEmail: state.customerEmail,
          handoverSignedDocumentUrl: state.handoverSignedDocumentUrl,
          handoverSignedAt: state.handoverSignedAt,
          handoverCountersignedAt: state.handoverCountersignedAt,
        }}
        canManage={permissions.canManageQuotations}
        canCountersign={canCountersign}
        onUpdated={refresh}
      />

      {permissions.canManageQuotations && allowedTransitions.filter((s) => s !== 'DELIVERED').length > 0 && (
        <Card>
          <h2 className="font-semibold text-gray-900 mb-3">Move Order</h2>
          <div className="flex flex-wrap gap-2">
            {allowedTransitions.filter((s) => s !== 'DELIVERED').map((s) => (
              <Button key={s} variant={s === 'CANCELLED' ? 'ghost' : 'secondary'} onClick={() => transition(s)} disabled={busy}>
                {ORDER_STATUS_LABELS[s as keyof typeof ORDER_STATUS_LABELS]}
              </Button>
            ))}
          </div>
          {state.status === 'BOOKED' && !pdiComplete && (
            <p className="text-xs text-orange-600 mt-2">
              Complete the PDI checklist above to unlock &quot;Ready for Delivery&quot;.
            </p>
          )}
          {state.status === 'BOOKED' && pdiComplete && !agreementComplete && (
            <p className="text-xs text-orange-600 mt-2">
              Approve the order and attach the signed agreement above to unlock &quot;Ready for Delivery&quot;.
            </p>
          )}
          {state.status === 'BOOKED' && pdiComplete && agreementComplete && !paymentComplete && (
            <p className="text-xs text-orange-600 mt-2">
              Confirm payment above to unlock &quot;Ready for Delivery&quot;.
            </p>
          )}
          {state.status === 'READY_FOR_DELIVERY' && (!registrationComplete || !invoiceComplete) && (
            <p className="text-xs text-orange-600 mt-2">
              {!registrationComplete && !invoiceComplete
                ? 'Record vehicle registration and generate the invoice above to unlock "Delivered".'
                : !registrationComplete
                ? 'Record the vehicle registration number above to unlock "Delivered".'
                : 'Generate the sales invoice above to unlock "Delivered".'}
            </p>
          )}
        </Card>
      )}

      <Card>
        <h2 className="font-semibold text-gray-900 mb-3">Status History</h2>
        <ol className="space-y-2">
          {state.statusHistory.map((h) => (
            <li key={h.id} className="text-sm flex flex-col sm:flex-row sm:items-center gap-x-3 gap-y-0.5">
              <span className="text-gray-400 sm:w-40 sm:shrink-0">{new Date(h.changedAt).toLocaleString()}</span>
              <span>
                {h.fromStatus ? `${ORDER_STATUS_LABELS[h.fromStatus as keyof typeof ORDER_STATUS_LABELS]} → ` : ''}
                <strong>{ORDER_STATUS_LABELS[h.toStatus as keyof typeof ORDER_STATUS_LABELS]}</strong>
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
