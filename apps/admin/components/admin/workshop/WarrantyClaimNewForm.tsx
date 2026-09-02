'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Upload, Loader2 } from 'lucide-react';
import { Card, Button } from '@/components/admin/ui';

interface JobCardSummary {
  id: string;
  jobCardNo: string;
  plateNo: string;
  customerName: string;
  warrantyEndDate: string | null;
}

export default function WarrantyClaimNewForm({ jobCard }: { jobCard: JobCardSummary }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [form, setForm] = useState({
    defectCode: '',
    component: '',
    diagnosticCodes: '',
    description: '',
  });

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const isExpired = jobCard.warrantyEndDate ? new Date(jobCard.warrantyEndDate).getTime() < Date.now() : false;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (!data?.url) throw new Error('No URL returned from upload');
      setPhotoUrls((prev) => [...prev, data.url]);
    } catch (err: any) {
      setError(err.message || 'Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (url: string) => setPhotoUrls((prev) => prev.filter((p) => p !== url));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/workshop/warranty-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobCardId: jobCard.id, ...form, photoUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create claim');
      router.push(`/admin/workshop/warranty-claims/${data.claim.id}`);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setSaving(false);
    }
  };

  return (
    <Card>
      <div className="mb-4 pb-4 border-b border-gray-100">
        <p className="text-sm text-gray-500">Job card</p>
        <p className="font-medium text-gray-900">{jobCard.jobCardNo} · {jobCard.plateNo} · {jobCard.customerName}</p>
        {jobCard.warrantyEndDate && (
          <p className={`text-xs mt-1 ${isExpired ? 'text-red-600' : 'text-gray-400'}`}>
            Warranty {isExpired ? 'expired' : 'valid until'} {new Date(jobCard.warrantyEndDate).toLocaleDateString()}
          </p>
        )}
        {!jobCard.warrantyEndDate && (
          <p className="text-xs text-gray-400 mt-1">No warranty end date recorded on this job card yet.</p>
        )}
      </div>

      <form onSubmit={submit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Defect code *">
            <input required value={form.defectCode} onChange={(e) => update('defectCode', e.target.value)} className="input" />
          </Field>
          <Field label="Component">
            <input value={form.component} onChange={(e) => update('component', e.target.value)} className="input" />
          </Field>
        </div>

        <Field label="Diagnostic trouble codes">
          <input value={form.diagnosticCodes} onChange={(e) => update('diagnosticCodes', e.target.value)} className="input" />
        </Field>

        <Field label="Description">
          <textarea rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} className="input" />
        </Field>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Photo evidence *</label>
          <div className="flex flex-wrap gap-3">
            {photoUrls.map((url) => (
              <div key={url} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                <img src={url} alt="evidence" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-20 h-20 rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center text-gray-400"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={onPick} className="hidden" />
          </div>
          <p className="text-xs text-gray-400 mt-1">At least one photo is required to submit (can be added now or on the claim page).</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button disabled={saving} type="submit">
            {saving ? 'Saving…' : 'Save Draft'}
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
