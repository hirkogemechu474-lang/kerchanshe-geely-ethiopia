'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Shield,
  CheckCircle,
  XCircle,
  Megaphone,
  FileText,
  Plus,
  Trash2,
  Eye,
  GripVertical,
} from 'lucide-react';

/* ---------- TYPES ---------- */
interface CoverageItem {
  title: string;
  description: string;
}

interface WarrantyDocument {
  id: string;
  title: string;
  description: string;
  url: string;
  fileName: string;
  fileSize: number | null;
  uploadedAt: string | null;
}

interface WarrantyPageData {
  hero: { eyebrow: string; title: string; subtitle: string };
  whatsCovered: CoverageItem[];
  whatsNotCovered: CoverageItem[];
  cta: { title: string; description: string };
  documents: WarrantyDocument[];
}

const DEFAULT_DATA: WarrantyPageData = {
  hero: {
    eyebrow: 'VEHICLE WARRANTY',
    title: 'Comprehensive Warranty Coverage',
    subtitle:
      'Drive with confidence knowing your Geely is protected by our comprehensive warranty program. Quality, reliability, and peace of mind guaranteed.',
  },
  whatsCovered: [
    { title: 'Powertrain Components', description: 'Engine, transmission, drive axle, and all internal parts' },
    { title: 'Electrical Systems', description: 'All factory-installed electrical and electronic components' },
    { title: 'Safety Systems', description: 'Airbags, ABS, stability control, and all safety features' },
    { title: 'Climate Control', description: 'Air conditioning and heating systems' },
    { title: 'Steering & Suspension', description: 'Steering mechanism and suspension components' },
    { title: 'Body & Paint', description: '3-year coverage against manufacturing defects and corrosion perforation' },
  ],
  whatsNotCovered: [
    { title: 'Normal Wear & Tear', description: 'Brake pads, wiper blades, tires, filters, and bulbs' },
    { title: 'Misuse & Neglect', description: 'Damage from accidents, abuse, or lack of maintenance' },
    { title: 'Unauthorized Modifications', description: 'Aftermarket parts or modifications not approved by Geely' },
    { title: 'Environmental Damage', description: 'Damage from natural disasters, fire, or vandalism' },
    { title: 'Commercial Use', description: 'Vehicles used for taxi, rental, or commercial purposes' },
    { title: 'Cosmetic Issues', description: 'Minor scratches, dents, or stone chips not affecting function' },
  ],
  cta: {
    title: 'Need to File a Warranty Claim?',
    description:
      "If you're experiencing issues with your Geely vehicle covered under warranty, submit a claim online or contact our service team.",
  },
  documents: [],
};

function newDocId() {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/* ---------- PAGE ---------- */
export default function WarrantyPageSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WarrantyPageData>(DEFAULT_DATA);
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/warranty-page');
        if (res.ok) {
          const raw = await res.json();
          setData({
            hero: { ...DEFAULT_DATA.hero, ...(raw.hero ?? {}) },
            whatsCovered: Array.isArray(raw.whatsCovered) ? raw.whatsCovered : DEFAULT_DATA.whatsCovered,
            whatsNotCovered: Array.isArray(raw.whatsNotCovered) ? raw.whatsNotCovered : DEFAULT_DATA.whatsNotCovered,
            cta: { ...DEFAULT_DATA.cta, ...(raw.cta ?? {}) },
            documents: Array.isArray(raw.documents) ? raw.documents : DEFAULT_DATA.documents,
          });
        }
      } catch {
        /* keep defaults */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/settings/warranty-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
      } else {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.details || j.error || 'Save failed');
      }
    } catch (e: any) {
      setError(e.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  };

  function updateCoverageItem(list: 'whatsCovered' | 'whatsNotCovered', index: number, field: keyof CoverageItem, value: string) {
    setData((d) => {
      const items = [...d[list]];
      items[index] = { ...items[index], [field]: value };
      return { ...d, [list]: items };
    });
  }

  function addCoverageItem(list: 'whatsCovered' | 'whatsNotCovered') {
    setData((d) => ({ ...d, [list]: [...d[list], { title: '', description: '' }] }));
  }

  function removeCoverageItem(list: 'whatsCovered' | 'whatsNotCovered', index: number) {
    setData((d) => ({ ...d, [list]: d[list].filter((_, i) => i !== index) }));
  }

  function addDocument() {
    setData((d) => ({
      ...d,
      documents: [
        ...d.documents,
        { id: newDocId(), title: '', description: '', url: '', fileName: '', fileSize: null, uploadedAt: null },
      ],
    }));
  }

  function updateDocument(id: string, field: 'title' | 'description', value: string) {
    setData((d) => ({
      ...d,
      documents: d.documents.map((doc) => (doc.id === id ? { ...doc, [field]: value } : doc)),
    }));
  }

  function removeDocument(id: string) {
    setData((d) => ({ ...d, documents: d.documents.filter((doc) => doc.id !== id) }));
  }

  async function uploadDocumentFile(id: string, file: File) {
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF document.');
      return;
    }
    setUploadingDocId(id);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const result = await res.json().catch(() => ({}));
      if (!res.ok || !result.url) throw new Error(result.error || 'Failed to upload document');

      setData((d) => ({
        ...d,
        documents: d.documents.map((doc) =>
          doc.id === id
            ? {
                ...doc,
                url: result.url,
                fileName: file.name,
                fileSize: file.size,
                uploadedAt: new Date().toISOString(),
              }
            : doc
        ),
      }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Failed to upload document');
    } finally {
      setUploadingDocId(null);
    }
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600">
          <RefreshCw className="w-5 h-5 animate-spin text-geely-blue" />
          Loading warranty page content...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link href="/admin/settings" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Warranty Page Content</h1>
          <p className="mt-1 text-sm text-gray-500">
            Hero copy, coverage lists, claim CTA, and downloadable warranty documents shown on the public{' '}
            <code className="px-1 py-0.5 bg-gray-100 rounded text-xs">/warranty</code> page. Warranty periods and
            service intervals are managed under Vehicles → Settings.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {savedAt && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved {savedAt}
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/25 hover:from-emerald-700 hover:to-teal-700 transition-all hover:shadow-xl hover:shadow-emerald-500/30 disabled:opacity-60 font-medium whitespace-nowrap"
          >
            {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">Could not save</div>
            <div className="text-sm">{error}</div>
          </div>
        </div>
      )}

      {/* HERO */}
      <SectionCard title="Page Header" subtitle="The banner at the top of /warranty" icon={Shield} gradient="from-geely-blue to-indigo-600">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Eyebrow">
            <input
              type="text"
              value={data.hero.eyebrow}
              onChange={(e) => setData((d) => ({ ...d, hero: { ...d.hero, eyebrow: e.target.value } }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
          </Field>
          <Field label="Title">
            <input
              type="text"
              value={data.hero.title}
              onChange={(e) => setData((d) => ({ ...d, hero: { ...d.hero, title: e.target.value } }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
          </Field>
          <Field label="Subtitle">
            <textarea
              rows={2}
              value={data.hero.subtitle}
              onChange={(e) => setData((d) => ({ ...d, hero: { ...d.hero, subtitle: e.target.value } }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
          </Field>
        </div>
      </SectionCard>

      {/* WHAT'S COVERED */}
      <CoverageSection
        title="What's Covered"
        subtitle="Green checklist shown in the coverage comparison"
        icon={CheckCircle}
        gradient="from-emerald-500 to-emerald-600"
        accent="emerald"
        items={data.whatsCovered}
        onChange={(i, field, v) => updateCoverageItem('whatsCovered', i, field, v)}
        onAdd={() => addCoverageItem('whatsCovered')}
        onRemove={(i) => removeCoverageItem('whatsCovered', i)}
      />

      {/* WHAT'S NOT COVERED */}
      <CoverageSection
        title="What's Not Covered"
        subtitle="Red exclusion list shown in the coverage comparison"
        icon={XCircle}
        gradient="from-red-500 to-rose-600"
        accent="red"
        items={data.whatsNotCovered}
        onChange={(i, field, v) => updateCoverageItem('whatsNotCovered', i, field, v)}
        onAdd={() => addCoverageItem('whatsNotCovered')}
        onRemove={(i) => removeCoverageItem('whatsNotCovered', i)}
      />

      {/* CTA */}
      <SectionCard title="Claim Call-to-Action" subtitle="Banner inviting visitors to file a claim" icon={Megaphone} gradient="from-geely-blue to-blue-600">
        <div className="grid grid-cols-1 gap-4">
          <Field label="Title">
            <input
              type="text"
              value={data.cta.title}
              onChange={(e) => setData((d) => ({ ...d, cta: { ...d.cta, title: e.target.value } }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
          </Field>
          <Field label="Description">
            <textarea
              rows={2}
              value={data.cta.description}
              onChange={(e) => setData((d) => ({ ...d, cta: { ...d.cta, description: e.target.value } }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
            />
          </Field>
        </div>
      </SectionCard>

      {/* DOCUMENTS */}
      <SectionCard
        title="Warranty Documents"
        subtitle="PDF terms, conditions, and claim guides visitors can download from the page"
        icon={FileText}
        gradient="from-fuchsia-500 to-pink-600"
      >
        <div className="space-y-4">
          {data.documents.length === 0 && (
            <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <FileText className="mx-auto text-gray-400 mb-2" size={40} />
              <p className="text-gray-500 text-sm">No documents added yet</p>
            </div>
          )}

          {data.documents.map((doc) => (
            <div key={doc.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50/60">
              <div className="flex items-start gap-3">
                <GripVertical size={18} className="text-gray-300 mt-2 shrink-0" />
                <div className="flex-1 min-w-0 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Document Title</label>
                      <input
                        type="text"
                        value={doc.title}
                        onChange={(e) => updateDocument(doc.id, 'title', e.target.value)}
                        placeholder="Warranty Terms & Conditions"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Short Description</label>
                      <input
                        type="text"
                        value={doc.description}
                        onChange={(e) => updateDocument(doc.id, 'description', e.target.value)}
                        placeholder="Full coverage details and exclusions"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-fuchsia-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-fuchsia-700">
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        disabled={uploadingDocId === doc.id}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) uploadDocumentFile(doc.id, file);
                          event.currentTarget.value = '';
                        }}
                      />
                      <FileText className="h-4 w-4" />
                      {uploadingDocId === doc.id ? 'Uploading...' : doc.url ? 'Replace PDF' : 'Upload PDF'}
                    </label>

                    {doc.url ? (
                      <div className="flex items-center gap-3 text-sm text-gray-600 min-w-0">
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 font-semibold text-fuchsia-700 hover:text-fuchsia-800 shrink-0">
                          <Eye className="h-4 w-4" />
                          Preview
                        </a>
                        <span className="truncate">{doc.fileName || 'document.pdf'}</span>
                        {doc.fileSize && <span className="text-gray-400 shrink-0">({(doc.fileSize / 1024 / 1024).toFixed(1)} MB)</span>}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500">PDF only, up to 15 MB</p>
                    )}

                    <button
                      type="button"
                      onClick={() => removeDocument(doc.id)}
                      className="sm:ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addDocument}
            className="flex items-center gap-2 px-4 py-2.5 bg-fuchsia-50 text-fuchsia-700 text-sm font-semibold rounded-lg border border-fuchsia-200 hover:bg-fuchsia-100 transition-colors"
          >
            <Plus size={16} />
            Add Document
          </button>
        </div>
      </SectionCard>

      {/* STICKY SAVE BAR (mobile) */}
      <div className="sm:hidden sticky bottom-4 -mx-2">
        <div className="mx-2 bg-white border border-gray-200 shadow-2xl rounded-2xl p-3 flex items-center gap-2">
          {savedAt && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold bg-green-50 text-green-700 border border-green-200">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </span>
          )}
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg shadow-emerald-500/25 disabled:opacity-60 font-medium"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   SHARED UI SUBCOMPONENTS
   ============================================================ */

function SectionCard({
  title, subtitle, icon: Icon, gradient, children,
}: {
  title: string;
  subtitle: string;
  icon: any;
  gradient: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} shadow-md flex items-center justify-center shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function CoverageSection({
  title, subtitle, icon: Icon, gradient, accent, items, onChange, onAdd, onRemove,
}: {
  title: string;
  subtitle: string;
  icon: any;
  gradient: string;
  accent: 'emerald' | 'red';
  items: CoverageItem[];
  onChange: (index: number, field: keyof CoverageItem, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const ring = accent === 'emerald' ? 'focus:ring-emerald-500' : 'focus:ring-red-500';
  const addBg = accent === 'emerald' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';

  return (
    <SectionCard title={title} subtitle={subtitle} icon={Icon} gradient={gradient}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-start gap-3 border border-gray-200 rounded-xl p-3 bg-gray-50/60">
            <GripVertical size={18} className="text-gray-300 mt-2.5 shrink-0" />
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={item.title}
                onChange={(e) => onChange(index, 'title', e.target.value)}
                placeholder="Item title"
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 ${ring} focus:border-transparent`}
              />
              <input
                type="text"
                value={item.description}
                onChange={(e) => onChange(index, 'description', e.target.value)}
                placeholder="Short description"
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 ${ring} focus:border-transparent`}
              />
            </div>
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="mt-1.5 text-red-500 hover:text-red-600 shrink-0"
              title="Remove"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={onAdd}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-colors ${addBg}`}
        >
          <Plus size={16} />
          Add Item
        </button>
      </div>
    </SectionCard>
  );
}
