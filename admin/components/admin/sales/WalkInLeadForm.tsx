'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';

// FR-101 / UC-01: capture a walk-in lead with source tagging. Deliberately
// only requires name + phone ("at minimum" per the BRD) — vehicle model is
// optional (a bare browse still gets saved as a general enquiry).
export default function WalkInLeadForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deduped, setDeduped] = useState(false);
  const [form, setForm] = useState({
    customerName: '',
    phoneNumber: '',
    email: '',
    vehicleModel: '',
    source: 'walk-in',
    message: '',
  });

  const update = (field: keyof typeof form, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setDeduped(false);
    try {
      const res = await fetch('/api/admin/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save lead');
      if (data.deduped) {
        setDeduped(true);
        setTimeout(() => router.push(`/admin/quotations/${data.quotation.id}`), 1200);
        return;
      }
      router.push(`/admin/quotations/${data.quotation.id}`);
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Card>
      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Customer name *">
            <input required value={form.customerName} onChange={(e) => update('customerName', e.target.value)} className="input" />
          </Field>
          <Field label="Phone number *">
            <input required value={form.phoneNumber} onChange={(e) => update('phoneNumber', e.target.value)} className="input" />
          </Field>
          <Field label="Email (optional)">
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input" />
          </Field>
          <Field label="Lead source">
            <select value={form.source} onChange={(e) => update('source', e.target.value)} className="input">
              <option value="walk-in">Walk-in</option>
              <option value="phone">Phone enquiry</option>
              <option value="referral">Referral</option>
              <option value="website">Website</option>
              <option value="other">Other</option>
            </select>
          </Field>
        </div>

        <Field label="Vehicle of interest (leave blank for a general enquiry)">
          <input value={form.vehicleModel} onChange={(e) => update('vehicleModel', e.target.value)} className="input" placeholder="e.g. Model X SUV" />
        </Field>

        <Field label="Notes">
          <textarea rows={3} value={form.message} onChange={(e) => update('message', e.target.value)} className="input" placeholder="What are they interested in? Any follow-up context." />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {deduped && (
          <p className="text-sm text-blue-600">
            This phone number already has an open inquiry — opening the existing lead instead of creating a duplicate.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button disabled={saving} type="submit">
            {saving ? 'Saving…' : 'Save Lead'}
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
