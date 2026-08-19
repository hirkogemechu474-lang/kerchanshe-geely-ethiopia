'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Calendar, Eye, Image as ImageIcon, Save, Tag } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface PromotionForm {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  bannerImage: string;
  ctaButtonText: string;
  ctaButtonLink: string;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
}

const EMPTY_FORM: PromotionForm = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  bannerImage: '',
  ctaButtonText: '',
  ctaButtonLink: '',
  isFeatured: false,
  isActive: true,
  displayOrder: 0,
};

function dateInputValue(value: string) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

export default function EditPromotionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<PromotionForm>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/admin/promotions/${params.id}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Failed to load promotion');
        const promotion = result.promotion;
        setForm({
          title: promotion.title || '',
          description: promotion.description || '',
          startDate: dateInputValue(promotion.startDate),
          endDate: dateInputValue(promotion.endDate),
          bannerImage: promotion.bannerImage || '',
          ctaButtonText: promotion.ctaButtonText || '',
          ctaButtonLink: promotion.ctaButtonLink || '',
          isFeatured: Boolean(promotion.isFeatured),
          isActive: Boolean(promotion.isActive),
          displayOrder: promotion.displayOrder || 0,
        });
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Failed to load promotion'))
      .finally(() => setLoading(false));
  }, [params.id]);

  function update<K extends keyof PromotionForm>(key: K, value: PromotionForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function uploadBanner(file: File) {
    setUploading(true);
    setError('');
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/admin/upload', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok || !result.url) throw new Error(result.error || 'Image upload failed');
      update('bannerImage', result.url);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Image upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const response = await fetch(`/api/admin/promotions/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to update promotion');
      setSuccess(true);
      setTimeout(() => router.push('/admin/promotions'), 900);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update promotion');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-12 text-center text-gray-500">Loading promotion...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/promotions" className="rounded-lg p-2 transition hover:bg-gray-100"><ArrowLeft className="h-5 w-5" /></Link>
        <div><h1 className="text-3xl font-bold text-gray-900">Edit Promotion</h1><p className="mt-1 text-sm text-gray-500">Update the campaign details and publishing settings.</p></div>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">Promotion updated successfully.</div>}

      <form onSubmit={save} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="grid gap-6 p-6 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700"><Tag className="mr-2 inline h-4 w-4" />Title *</label>
            <input required value={form.title} onChange={(e) => update('title', e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">Description *</label>
            <textarea required rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500" />
          </div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700"><Calendar className="mr-2 inline h-4 w-4" />Start date *</label><input required type="date" value={form.startDate} onChange={(e) => update('startDate', e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700"><Calendar className="mr-2 inline h-4 w-4" />End date *</label><input required type="date" value={form.endDate} onChange={(e) => update('endDate', e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2" /></div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">Banner image</label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"><input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadBanner(file); e.currentTarget.value = ''; }} /><ImageIcon className="h-4 w-4" />{uploading ? 'Uploading...' : 'Upload image'}</label>
              {form.bannerImage && <a href={form.bannerImage} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-blue-600"><Eye className="h-4 w-4" />Preview</a>}
            </div>
            <input value={form.bannerImage} onChange={(e) => update('bannerImage', e.target.value)} placeholder="Or paste an image URL" className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2" />
          </div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">CTA button text</label><input value={form.ctaButtonText} onChange={(e) => update('ctaButtonText', e.target.value)} className="w-full rounded-lg border border-gray-300 px-4 py-2" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">CTA button link</label><input value={form.ctaButtonLink} onChange={(e) => update('ctaButtonLink', e.target.value)} placeholder="/offers or https://..." className="w-full rounded-lg border border-gray-300 px-4 py-2" /></div>
          <div><label className="mb-2 block text-sm font-medium text-gray-700">Display order</label><input type="number" value={form.displayOrder} onChange={(e) => update('displayOrder', Number(e.target.value))} className="w-full rounded-lg border border-gray-300 px-4 py-2" /></div>
          <div className="flex items-center gap-6 pt-7"><label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.isFeatured} onChange={(e) => update('isFeatured', e.target.checked)} /> Featured</label><label className="flex items-center gap-2 text-sm font-medium text-gray-700"><input type="checkbox" checked={form.isActive} onChange={(e) => update('isActive', e.target.checked)} /> Active</label></div>
        </div>
        <div className="flex items-center justify-between border-t bg-gray-50 px-6 py-4"><Link href="/admin/promotions" className="rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-200">Cancel</Link><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Changes'}</button></div>
      </form>
    </div>
  );
}
