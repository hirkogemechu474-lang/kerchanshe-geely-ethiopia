'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';

interface Technician { id: string; name: string }
interface Bay { id: string; name: string; bayType: string }

export default function JobCardWriteUpForm({ technicians, bays }: { technicians: Technician[]; bays: Bay[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/workshop/job-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          technicianId: form.technicianId || null,
          bayId: form.bayId || null,
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
          <input required value={form.plateNo} onChange={(e) => update('plateNo', e.target.value)} className="input" />
        </Field>
        <Field label="VIN (optional)">
          <input value={form.vin} onChange={(e) => update('vin', e.target.value)} className="input" />
        </Field>
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
