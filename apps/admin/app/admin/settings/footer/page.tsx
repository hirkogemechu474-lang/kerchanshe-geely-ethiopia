'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowDown, ArrowUp, Info, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

type FooterLink = { label: string; href: string };
type FooterColumn = { heading: string; links: FooterLink[] };
type FooterContent = { columns: FooterColumn[]; legalLinks: FooterLink[] };

// Column indexes that carry live/other-settings-driven content alongside
// (or instead of) admin-typed links — see the matching comment in
// backend/src/routes/admin-content.routes.ts.
const MODELS_COLUMN_INDEX = 1; // links always come from the live vehicle list
const SUPPORT_COLUMN_INDEX = 3; // phone/email/address come from Contact Information

function emptyLink(): FooterLink {
  return { label: '', href: '' };
}

function LinkListEditor({ links, onChange }: { links: FooterLink[]; onChange: (links: FooterLink[]) => void }) {
  const update = (index: number, changes: Partial<FooterLink>) =>
    onChange(links.map((link, i) => (i === index ? { ...link, ...changes } : link)));
  const remove = (index: number) => onChange(links.filter((_, i) => i !== index));
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= links.length) return;
    const next = [...links];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {links.map((link, index) => (
        <div key={index} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={link.label}
            onChange={(e) => update(index, { label: e.target.value })}
            placeholder="Label (e.g. Home)"
            className="w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            value={link.href}
            onChange={(e) => update(index, { href: e.target.value })}
            placeholder="/path"
            className="w-full flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <div className="flex items-center gap-1 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => move(index, -1)}
              disabled={index === 0}
              title="Move up"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30"
            >
              <ArrowUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => move(index, 1)}
              disabled={index === links.length - 1}
              title="Move down"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-30"
            >
              <ArrowDown className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => remove(index)}
              title="Remove link"
              className="rounded-lg p-2 text-red-600 hover:bg-red-50 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...links, emptyLink()])}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-geely-blue px-3 py-1.5 text-sm font-semibold text-geely-blue hover:bg-blue-50"
      >
        <Plus className="h-4 w-4" />
        Add link
      </button>
    </div>
  );
}

export default function FooterContentPage() {
  const [content, setContent] = useState<FooterContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/content/footer')
      .then((res) => res.json())
      .then((data) => setContent({ columns: data.columns || [], legalLinks: data.legalLinks || [] }))
      .finally(() => setLoading(false));
  }, []);

  const updateColumnHeading = (colIndex: number, heading: string) =>
    setContent((current) =>
      current ? { ...current, columns: current.columns.map((col, i) => (i === colIndex ? { ...col, heading } : col)) } : current
    );

  const updateColumnLinks = (colIndex: number, links: FooterLink[]) =>
    setContent((current) =>
      current ? { ...current, columns: current.columns.map((col, i) => (i === colIndex ? { ...col, links } : col)) } : current
    );

  const updateLegalLinks = (legalLinks: FooterLink[]) =>
    setContent((current) => (current ? { ...current, legalLinks } : current));

  const save = async () => {
    if (!content) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/content/footer', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setContent({ columns: data.columns || [], legalLinks: data.legalLinks || [] });
      setMessage('Footer content saved successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !content) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-gray-500">
        <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
        Loading Footer Content…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link href="/admin/settings" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Footer Content</h1>
          <p className="mt-1 text-sm text-gray-500">Edit the 4 footer link columns and the legal links row shown on every public page.</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-geely-blue px-5 py-2.5 font-semibold text-white hover:bg-navy disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Footer'}
        </button>
      </div>

      {message && <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">{message}</div>}

      <div className="grid gap-5 md:grid-cols-2">
        {content.columns.map((column, colIndex) => (
          <div key={colIndex} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <label className="text-sm font-semibold text-gray-700">
              Column heading
              <input
                value={column.heading}
                onChange={(e) => updateColumnHeading(colIndex, e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal"
              />
            </label>

            {colIndex === MODELS_COLUMN_INDEX ? (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  This column&apos;s links are populated automatically from your active vehicle models (Vehicles list) and can&apos;t be
                  edited here — only the heading above is used.
                </span>
              </div>
            ) : (
              <div className="mt-4">
                <LinkListEditor links={column.links} onChange={(links) => updateColumnLinks(colIndex, links)} />
              </div>
            )}

            {colIndex === SUPPORT_COLUMN_INDEX && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Phone, email, and address in this column come from Settings &gt; Contact Information and aren&apos;t editable here —
                  only the link(s) above (e.g. &quot;Contact Us&quot;) are.
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 font-semibold text-gray-900">Legal links</h2>
        <p className="mb-4 text-sm text-gray-500">The row of links at the very bottom of the footer (Privacy Policy, Terms of Service, etc.).</p>
        <LinkListEditor links={content.legalLinks} onChange={updateLegalLinks} />
      </div>
    </div>
  );
}
