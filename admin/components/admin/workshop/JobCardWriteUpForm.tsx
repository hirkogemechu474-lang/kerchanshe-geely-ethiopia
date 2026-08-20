'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';
import { JOB_CARD_STATUS_LABELS } from '@/lib/workshop/jobCardStateMachine';

interface Technician { id: string; name: string }
interface Bay { id: string; name: string; bayType: string }

interface LookupVehicle {
  id: string;
  vin: string | null;
  plateNo: string;
  model: string | null;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
}
interface LookupCustomer { fullName: string; phone: string; email: string | null }
interface LookupHistoryEntry {
  id: string;
  jobCardNo: string;
  status: string;
  complaintText: string | null;
  openTs: string;
  closeTs: string | null;
}

type LookupState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'found'; vehicle: LookupVehicle; customer: LookupCustomer; history: LookupHistoryEntry[] };

function warrantyBadge(endDate: string | null) {
  if (!endDate) return { label: 'No warranty on file', className: 'bg-gray-100 text-gray-600' };
  const active = new Date(endDate) >= new Date();
  return active
    ? { label: `Warranty active until ${new Date(endDate).toLocaleDateString()}`, className: 'bg-green-100 text-green-700' }
    : { label: `Warranty expired ${new Date(endDate).toLocaleDateString()}`, className: 'bg-red-100 text-red-700' };
}

export default function JobCardWriteUpForm({ technicians, bays }: { technicians: Technician[]; bays: Bay[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lookup, setLookup] = useState<LookupState>({ status: 'idle' });
  const [saveAsNewVehicleRecord, setSaveAsNewVehicleRecord] = useState(true);
  const [form, setForm] = useState({
    plateNo: '',
    vin: '',
    vehicleModel: '',
    vehicleYear: '',
    mileage: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    complaintText: '',
    technicianId: '',
    bayId: '',
    warrantyStartDate: '',
    warrantyEndDate: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  // FR-201 / UC-04: look up a vehicle by plate or VIN and surface its full
  // service history instead of asking the customer to repeat known
  // information. Explicit button, not an auto-lookup-on-blur, so a
  // half-typed plate never fires a spurious request.
  const runLookup = async () => {
    if (!form.vin.trim() && !form.plateNo.trim()) return;
    setLookup({ status: 'loading' });
    const qs = form.vin.trim()
      ? `vin=${encodeURIComponent(form.vin.trim())}`
      : `plate=${encodeURIComponent(form.plateNo.trim())}`;
    try {
      const res = await fetch(`/api/admin/workshop/vehicle-lookup?${qs}`);
      const data = await res.json();
      if (!res.ok || !data.found) {
        setLookup({ status: 'not_found' });
        return;
      }
      setLookup({ status: 'found', vehicle: data.customerVehicle, customer: data.customer, history: data.history });
      setForm((prev) => ({
        ...prev,
        customerName: data.customer.fullName,
        customerPhone: data.customer.phone,
        customerEmail: data.customer.email || '',
        vehicleModel: data.customerVehicle.model || prev.vehicleModel,
        vin: data.customerVehicle.vin || prev.vin,
        warrantyStartDate: data.customerVehicle.warrantyStartDate?.slice(0, 10) || '',
        warrantyEndDate: data.customerVehicle.warrantyEndDate?.slice(0, 10) || '',
      }));
    } catch {
      setLookup({ status: 'not_found' });
    }
  };

  const clearMatch = () => setLookup({ status: 'idle' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const matched = lookup.status === 'found' ? lookup : null;
    try {
      const res = await fetch('/api/admin/workshop/job-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          technicianId: form.technicianId || null,
          bayId: form.bayId || null,
          customerVehicleId: matched ? matched.vehicle.id : null,
          saveAsNewVehicleRecord: matched ? false : saveAsNewVehicleRecord,
          warrantyStartDate: form.warrantyStartDate || null,
          warrantyEndDate: form.warrantyEndDate || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create job card');
      router.push(`/admin/workshop/job-cards/${data.jobCard.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Card>
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Plate number *">
          <div className="flex gap-2">
            <input
              required
              value={form.plateNo}
              onChange={(e) => { update('plateNo', e.target.value); if (lookup.status !== 'idle') clearMatch(); }}
              className="input"
            />
          </div>
        </Field>
        <Field label="VIN (optional)">
          <input
            value={form.vin}
            onChange={(e) => { update('vin', e.target.value); if (lookup.status !== 'idle') clearMatch(); }}
            className="input"
          />
        </Field>
      </div>

      <div>
        <button
          type="button"
          onClick={runLookup}
          disabled={lookup.status === 'loading' || (!form.plateNo.trim() && !form.vin.trim())}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {lookup.status === 'loading' ? 'Looking up…' : '🔍 Look up vehicle by plate / VIN'}
        </button>
      </div>

      {lookup.status === 'found' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-gray-900">
                {lookup.customer.fullName} <span className="text-gray-500 font-normal">· {lookup.customer.phone}</span>
              </p>
              <p className="text-sm text-gray-600">
                {lookup.vehicle.model || 'Vehicle'} {lookup.vehicle.vin ? `· VIN ${lookup.vehicle.vin}` : ''}
              </p>
            </div>
            <button type="button" onClick={clearMatch} className="text-xs text-gray-500 hover:text-gray-700 underline shrink-0">
              Not this vehicle
            </button>
          </div>
          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${warrantyBadge(lookup.vehicle.warrantyEndDate).className}`}>
            {warrantyBadge(lookup.vehicle.warrantyEndDate).label}
          </span>

          {lookup.history.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Service history</p>
              <ul className="space-y-1">
                {lookup.history.map((h) => (
                  <li key={h.id} className="text-sm text-gray-700 flex items-center gap-2">
                    <span className="text-gray-400 w-24 shrink-0">{new Date(h.openTs).toLocaleDateString()}</span>
                    <span className="font-medium">{h.jobCardNo}</span>
                    <span className="text-gray-500 truncate">— {h.complaintText || 'No complaint captured yet'}</span>
                    <span className="text-xs text-gray-400 shrink-0">
                      ({JOB_CARD_STATUS_LABELS[h.status as keyof typeof JOB_CARD_STATUS_LABELS] || h.status})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No prior visits on file.</p>
          )}
        </div>
      )}

      {lookup.status === 'not_found' && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
          <p className="text-sm text-gray-600">No record on file for this plate/VIN — treating this as a new vehicle.</p>
          <label className="flex items-center gap-2 mt-2 text-sm text-gray-700">
            <input type="checkbox" checked={saveAsNewVehicleRecord} onChange={(e) => setSaveAsNewVehicleRecord(e.target.checked)} />
            Save as a new vehicle record so future visits show this history
          </label>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Vehicle model">
          <input value={form.vehicleModel} onChange={(e) => update('vehicleModel', e.target.value)} className="input" />
        </Field>
        <Field label="Year">
          <input type="number" value={form.vehicleYear} onChange={(e) => update('vehicleYear', e.target.value)} className="input" />
        </Field>
        <Field label="Mileage (km)">
          <input type="number" value={form.mileage} onChange={(e) => update('mileage', e.target.value)} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Customer name *">
          <input required value={form.customerName} onChange={(e) => update('customerName', e.target.value)} className="input" />
        </Field>
        <Field label="Customer phone *">
          <input required value={form.customerPhone} onChange={(e) => update('customerPhone', e.target.value)} className="input" />
        </Field>
        <Field label="Customer email">
          <input type="email" value={form.customerEmail} onChange={(e) => update('customerEmail', e.target.value)} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label={`Warranty start${lookup.status === 'found' ? ' (on file)' : ''}`}>
          <input
            type="date"
            value={form.warrantyStartDate}
            onChange={(e) => update('warrantyStartDate', e.target.value)}
            readOnly={lookup.status === 'found'}
            className={`input ${lookup.status === 'found' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </Field>
        <Field label={`Warranty end${lookup.status === 'found' ? ' (on file)' : ''}`}>
          <input
            type="date"
            value={form.warrantyEndDate}
            onChange={(e) => update('warrantyEndDate', e.target.value)}
            readOnly={lookup.status === 'found'}
            className={`input ${lookup.status === 'found' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        </Field>
      </div>

      <Field label="Customer complaint *">
        <textarea required rows={3} value={form.complaintText} onChange={(e) => update('complaintText', e.target.value)} className="input" />
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Assign technician">
          <select value={form.technicianId} onChange={(e) => update('technicianId', e.target.value)} className="input">
            <option value="">— Unassigned —</option>
            {technicians.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Assign bay">
          <select value={form.bayId} onChange={(e) => update('bayId', e.target.value)} className="input">
            <option value="">— Awaiting bay —</option>
            {bays.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.bayType.replace('_', ' ')})</option>
            ))}
          </select>
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button disabled={saving} type="submit">
          {saving ? 'Creating…' : 'Create Job Card'}
        </Button>
      </div>

      <style jsx>{`
        .input {
          width: 100%;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </form>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
