'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { AdminPermissions } from '@/types';
import { Card, Button, Modal, ModalActions } from '@/components/admin/ui';
import { Plus } from 'lucide-react';

interface JobCardRow {
  id: string;
  jobCardNo: string;
  status: string;
  complaintText: string | null;
  openTs: string;
  closeTs: string | null;
}

interface VehicleData {
  id: string;
  vin: string | null;
  plateNo: string;
  model: string | null;
  trim: string | null;
  color: string | null;
  isNev: boolean;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  mileageLastKnown: number | null;
  jobCards: JobCardRow[];
}

interface CustomerData {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  address: string | null;
  vehicles: VehicleData[];
}

interface CustomerHistory {
  quotations: { id: string; quotationNo: string | null; vehicleModel: string | null; status: string; createdAt: string }[];
  salesOrders: { id: string; orderNo: string; vehicleModel: string; status: string; totalPrice: number | null; orderDate: string }[];
  warrantyClaims: { id: string; claimNo: string; status: string; defectCode: string; createdAt: string }[];
  complaints: { id: string; caseNo: string; subject: string; status: string; priority: string; createdAt: string }[];
  warranties: { id: string; vehicleModel: string; status: string; warrantyStartDate: string; warrantyEndDate: string; orderId: string }[];
  loyaltyAccount: {
    points: number;
    tier: string;
    transactions: { id: string; points: number; reason: string; createdAt: string }[];
  } | null;
}

function dateInputValue(iso: string | null) {
  return iso ? iso.slice(0, 10) : '';
}

function VehicleCard({ vehicle, canEdit }: { vehicle: VehicleData; canEdit: boolean }) {
  const router = useRouter();
  const [state, setState] = useState(vehicle);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    plateNo: vehicle.plateNo,
    model: vehicle.model ?? '',
    trim: vehicle.trim ?? '',
    color: vehicle.color ?? '',
    warrantyStartDate: dateInputValue(vehicle.warrantyStartDate),
    warrantyEndDate: dateInputValue(vehicle.warrantyEndDate),
    mileageLastKnown: vehicle.mileageLastKnown?.toString() ?? '',
  });

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/customers/customer-vehicles/${vehicle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plateNo: form.plateNo,
          model: form.model || null,
          trim: form.trim || null,
          color: form.color || null,
          warrantyStartDate: form.warrantyStartDate || null,
          warrantyEndDate: form.warrantyEndDate || null,
          mileageLastKnown: form.mileageLastKnown === '' ? null : Number(form.mileageLastKnown),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setState(data.vehicle);
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const warrantyActive = state.warrantyEndDate !== null && new Date(state.warrantyEndDate) >= new Date();

  return (
    <Card className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {state.plateNo} {state.model && <span className="text-gray-500 font-normal">· {state.model}{state.trim ? ` ${state.trim}` : ''}</span>}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {state.vin ? `VIN ${state.vin}` : 'No VIN on file'}
            {state.color ? ` · ${state.color}` : ''}
            {state.mileageLastKnown != null ? ` · ${state.mileageLastKnown.toLocaleString()} km last known` : ''}
          </p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${warrantyActive ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
          {warrantyActive ? 'Under warranty' : 'Warranty expired / not set'}
        </span>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

      {editing ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Plate No.</label>
            <input value={form.plateNo} onChange={(e) => setForm({ ...form, plateNo: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Model</label>
            <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Trim</label>
            <input value={form.trim} onChange={(e) => setForm({ ...form, trim: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
            <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Warranty start</label>
            <input type="date" value={form.warrantyStartDate} onChange={(e) => setForm({ ...form, warrantyStartDate: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Warranty end</label>
            <input type="date" value={form.warrantyEndDate} onChange={(e) => setForm({ ...form, warrantyEndDate: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Mileage last known (km)</label>
            <input type="number" value={form.mileageLastKnown} onChange={(e) => setForm({ ...form, mileageLastKnown: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="md:col-span-2 flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
            <Button onClick={save} disabled={busy}>Save</Button>
          </div>
        </div>
      ) : (
        canEdit && (
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit vehicle record</Button>
        )
      )}

      <div>
        <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Service history</h4>
        {state.jobCards.length === 0 ? (
          <p className="text-sm text-gray-400">No job cards on file for this vehicle.</p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {state.jobCards.map((jc) => (
              <li key={jc.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <Link href={`/admin/workshop/job-cards/${jc.id}`} className="text-geely-blue dark:text-blue-400 font-medium hover:underline">
                    {jc.jobCardNo}
                  </Link>
                  <p className="text-xs text-gray-400 truncate">{jc.complaintText || 'No complaint on file'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">{new Date(jc.openTs).toLocaleDateString()}</p>
                  <p className="text-xs text-gray-400">{jc.status.replace(/_/g, ' ')}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function AddVehicleModal({ customerId, onClose, onAdded }: { customerId: string; onClose: () => void; onAdded: (vehicle: VehicleData) => void }) {
  const [form, setForm] = useState({ plateNo: '', vin: '', model: '', color: '', warrantyEndDate: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/customers/${customerId}/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plateNo: form.plateNo,
          vin: form.vin || null,
          model: form.model || null,
          color: form.color || null,
          warrantyEndDate: form.warrantyEndDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add vehicle');
      onAdded({ ...data.vehicle, jobCards: [] });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add Vehicle" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Plate No. *</label>
          <input required value={form.plateNo} onChange={(e) => setForm({ ...form, plateNo: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">VIN (optional)</label>
          <input value={form.vin} onChange={(e) => setForm({ ...form, vin: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Model</label>
          <input value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Color</label>
          <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Warranty end</label>
          <input type="date" value={form.warrantyEndDate} onChange={(e) => setForm({ ...form, warrantyEndDate: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
        </div>
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Vehicle'}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

export default function CustomerDetail({ customer, history, permissions }: { customer: CustomerData; history: CustomerHistory | null; permissions: AdminPermissions }) {
  const router = useRouter();
  const [state, setState] = useState(customer);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: customer.fullName,
    phone: customer.phone,
    email: customer.email ?? '',
    address: customer.address ?? '',
  });
  const [addingVehicle, setAddingVehicle] = useState(false);

  const canEdit = permissions.canManageJobCards;

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/customers/${state.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email || null,
          address: form.address || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setState({ ...state, ...data.customer });
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{state.fullName}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {state.phone}
              {state.email ? ` · ${state.email}` : ''}
              {state.address ? ` · ${state.address}` : ''}
            </p>
          </div>
          {canEdit && !editing && (
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit contact info</Button>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}

        {editing && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full name</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Address</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setEditing(false)} disabled={busy}>Cancel</Button>
              <Button onClick={save} disabled={busy}>Save</Button>
            </div>
          </div>
        )}
      </Card>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">
            Vehicles ({state.vehicles.length})
          </h2>
          {canEdit && (
            <Button size="sm" variant="secondary" onClick={() => setAddingVehicle(true)}>
              <Plus className="w-4 h-4" /> Add vehicle
            </Button>
          )}
        </div>
        {state.vehicles.length === 0 ? (
          <Card>
            <p className="text-sm text-gray-400">No vehicle on file for this customer yet.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {state.vehicles.map((v) => (
              <VehicleCard key={v.id} vehicle={v} canEdit={canEdit} />
            ))}
          </div>
        )}
      </div>

      {addingVehicle && (
        <AddVehicleModal
          customerId={state.id}
          onClose={() => setAddingVehicle(false)}
          onAdded={(vehicle) => {
            setState({ ...state, vehicles: [vehicle, ...state.vehicles] });
            setAddingVehicle(false);
            router.refresh();
          }}
        />
      )}

      {history && <CustomerHistorySections history={history} />}
    </div>
  );
}

// Unified customer + vehicle ownership view: sales, warranty and complaint
// records are matched by phone/VIN (see GET /customers/:id/history) since
// none of those models carry a real customerId FK. Sits alongside the
// existing workshop-only "Vehicles" service-history section above.
const TIER_COLORS: Record<string, string> = {
  BRONZE: 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400',
  SILVER: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  GOLD: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  VIP: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400',
};

function LoyaltyCard({ loyaltyAccount }: { loyaltyAccount: CustomerHistory['loyaltyAccount'] }) {
  if (!loyaltyAccount) {
    return (
      <Card>
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Loyalty</h3>
        <p className="text-sm text-gray-400">No loyalty points earned yet — points are awarded automatically on vehicle delivery and paid service visits.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Loyalty</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TIER_COLORS[loyaltyAccount.tier] ?? TIER_COLORS.BRONZE}`}>
          {loyaltyAccount.tier}
        </span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{loyaltyAccount.points.toLocaleString()} pts</p>
      {loyaltyAccount.transactions.length > 0 && (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
          {loyaltyAccount.transactions.map((t) => (
            <li key={t.id} className="py-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-gray-600 dark:text-gray-300 truncate">{t.reason}</span>
              <span className="text-gray-400 shrink-0">+{t.points} · {new Date(t.createdAt).toLocaleDateString()}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function CustomerHistorySections({ history }: { history: CustomerHistory }) {
  const sections: { title: string; empty: string; rows: React.ReactNode[] }[] = [
    {
      title: `Quotations (${history.quotations.length})`,
      empty: 'No quotations on file for this phone number.',
      rows: history.quotations.map((q) => (
        <li key={q.id} className="py-2 flex items-center justify-between gap-3 text-sm">
          <Link href={`/admin/quotations/${q.id}`} className="text-geely-blue dark:text-blue-400 font-medium hover:underline truncate">
            {q.quotationNo || q.vehicleModel || 'General enquiry'}
          </Link>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-gray-400 capitalize">{q.status.replace(/_/g, ' ')}</p>
          </div>
        </li>
      )),
    },
    {
      title: `Sales Orders (${history.salesOrders.length})`,
      empty: 'No sales orders on file.',
      rows: history.salesOrders.map((o) => (
        <li key={o.id} className="py-2 flex items-center justify-between gap-3 text-sm">
          <Link href={`/admin/orders/${o.id}`} className="text-geely-blue dark:text-blue-400 font-medium hover:underline truncate">
            {o.orderNo} · {o.vehicleModel}
          </Link>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500">{new Date(o.orderDate).toLocaleDateString()}</p>
            <p className="text-xs text-gray-400 capitalize">{o.status.replace(/_/g, ' ')}</p>
          </div>
        </li>
      )),
    },
    {
      title: `Warranty (${history.warranties.length})`,
      empty: 'No warranty registered.',
      rows: history.warranties.map((w) => (
        <li key={w.id} className="py-2 flex items-center justify-between gap-3 text-sm">
          <Link href={`/admin/orders/${w.orderId}`} className="text-geely-blue dark:text-blue-400 font-medium hover:underline truncate">
            {w.vehicleModel}
          </Link>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500">
              {new Date(w.warrantyStartDate).toLocaleDateString()} – {new Date(w.warrantyEndDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 capitalize">{w.status.toLowerCase()}</p>
          </div>
        </li>
      )),
    },
    {
      title: `Warranty Claims (${history.warrantyClaims.length})`,
      empty: 'No warranty claims on file.',
      rows: history.warrantyClaims.map((c) => (
        <li key={c.id} className="py-2 flex items-center justify-between gap-3 text-sm">
          <Link href={`/admin/workshop/warranty-claims/${c.id}`} className="text-geely-blue dark:text-blue-400 font-medium hover:underline truncate">
            {c.claimNo} · {c.defectCode}
          </Link>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-gray-400 capitalize">{c.status.replace(/_/g, ' ').toLowerCase()}</p>
          </div>
        </li>
      )),
    },
    {
      title: `Complaints (${history.complaints.length})`,
      empty: 'No complaints on file.',
      rows: history.complaints.map((c) => (
        <li key={c.id} className="py-2 flex items-center justify-between gap-3 text-sm">
          <Link href={`/admin/complaints/${c.id}`} className="text-geely-blue dark:text-blue-400 font-medium hover:underline truncate">
            {c.caseNo} · {c.subject}
          </Link>
          <div className="text-right shrink-0">
            <p className="text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</p>
            <p className="text-xs text-gray-400 capitalize">{c.status.replace(/_/g, ' ').toLowerCase()}</p>
          </div>
        </li>
      )),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <LoyaltyCard loyaltyAccount={history.loyaltyAccount} />
      {sections.map((s) => (
        <Card key={s.title}>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">{s.title}</h3>
          {s.rows.length === 0 ? (
            <p className="text-sm text-gray-400">{s.empty}</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">{s.rows}</ul>
          )}
        </Card>
      ))}
    </div>
  );
}
