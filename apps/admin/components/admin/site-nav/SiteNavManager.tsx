'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TableCard, THead, TBody, Tr, Th, Td, Badge, Button, Modal, ModalActions, EmptyTableRow } from '@/components/admin/ui';

interface SiteNavItem {
  id: string;
  // Prisma's generated type is the full SiteNavPlacement enum even though
  // this page only ever queries/renders 'TOP_NAV' rows.
  placement: string;
  label: string;
  subtitle: string | null;
  icon: string | null;
  href: string;
  openInNewTab: boolean;
  isHighlighted: boolean;
  isActive: boolean;
  displayOrder: number;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduledAt: string | null;
}

type FormState = {
  label: string;
  href: string;
  displayOrder: string;
  isActive: boolean;
  openInNewTab: boolean;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  scheduledAt: string;
};

const EMPTY_FORM: FormState = {
  label: '',
  href: '',
  displayOrder: '0',
  isActive: true,
  openInNewTab: false,
  status: 'PUBLISHED',
  scheduledAt: '',
};

// Only manages TOP_NAV — the header's main nav bar and the mobile drawer both
// read from it. The site previously also had a MODELS_QUICK_ACTIONS
// placement (a panel in the Models dropdown), but that panel was removed
// when the dropdown was redesigned to match Geely's regional distributor
// sites' flat model gallery, so it's no longer editable here.
export default function SiteNavManager({ topNav }: { topNav: SiteNavItem[] }) {
  const router = useRouter();
  const [modal, setModal] = useState<{ editing: SiteNavItem | null } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setModal({ editing: null });
    setError('');
  };

  const openEdit = (item: SiteNavItem) => {
    setForm({
      label: item.label,
      href: item.href,
      displayOrder: String(item.displayOrder),
      isActive: item.isActive,
      openInNewTab: item.openInNewTab,
      status: item.status || 'PUBLISHED',
      scheduledAt: item.scheduledAt ? new Date(item.scheduledAt).toISOString().slice(0, 16) : '',
    });
    setModal({ editing: item });
    setError('');
  };

  const save = async () => {
    if (!modal) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        placement: 'TOP_NAV',
        label: form.label,
        subtitle: null,
        icon: null,
        href: form.href,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
        isHighlighted: false,
        openInNewTab: form.openInNewTab,
        status: form.status,
        scheduledAt: form.scheduledAt || null,
      };
      const url = modal.editing ? `/api/admin/site-nav/${modal.editing.id}` : '/api/admin/site-nav';
      const res = await fetch(url, {
        method: modal.editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setModal(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: SiteNavItem) => {
    if (!confirm(`Delete "${item.label}"?`)) return;
    const res = await fetch(`/api/admin/site-nav/${item.id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Top Navigation</h2>
          <p className="text-xs text-gray-500">
            Shown left-to-right in the header, in Display Order. Currently matches the pattern used on
            Geely&apos;s regional distributor sites — 5 items, kept deliberately short.
          </p>
        </div>
        <Button size="sm" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>
      <TableCard>
        <THead>
          <tr>
            <Th>Order</Th>
            <Th>Label (as shown in the header)</Th>
            <Th>Links to</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </THead>
        <TBody>
          {topNav.length === 0 && <EmptyTableRow colSpan={5} message="No items yet." />}
          {topNav.map((item) => (
            <Tr key={item.id}>
              <Td className="text-gray-500">{item.displayOrder}</Td>
              <Td className="font-medium text-gray-900">{item.label}</Td>
              <Td className="text-gray-500">{item.href}</Td>
              <Td>
                <div className="flex flex-col items-start gap-1">
                  <Badge tone={item.isActive ? 'green' : 'red'}>{item.isActive ? 'Active' : 'Hidden'}</Badge>
                  <Badge tone={item.status === 'PUBLISHED' ? 'green' : item.status === 'SCHEDULED' ? 'orange' : 'gray'}>
                    {item.status === 'PUBLISHED' ? 'Published' : item.status === 'SCHEDULED' ? 'Scheduled' : 'Draft'}
                  </Badge>
                </div>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-3">
                  <button onClick={() => openEdit(item)} className="text-geely-blue hover:text-navy">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => remove(item)} className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
        </TBody>
      </TableCard>

      {modal && (
        <Modal
          title={modal.editing ? `Edit ${modal.editing.label}` : 'Add Item'}
          onClose={() => setModal(null)}
          maxWidth="max-w-md"
        >
          <div className="space-y-3">
            <Field label="Label *" hint="Shown exactly as typed in the header, e.g. &quot;After-Sales Services&quot;">
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="input"
              />
            </Field>
            <Field label="Link (href) *" hint="A path on the public site, e.g. /service">
              <input
                value={form.href}
                onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                placeholder="/models"
                className="input"
              />
            </Field>
            <Field label="Display Order" hint="Lower numbers appear first, left to right">
              <input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                className="input"
              />
            </Field>
            <div className="flex flex-wrap gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Active (visible on site)
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.openInNewTab}
                  onChange={(e) => setForm((f) => ({ ...f, openInNewTab: e.target.checked }))}
                />
                Open in new tab
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <ModalActions>
              <Button variant="ghost" onClick={() => setModal(null)}>Cancel</Button>
              <Button onClick={save} disabled={saving || !form.label || !form.href}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </ModalActions>
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
        </Modal>
      )}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-gray-400">{hint}</p>}
    </div>
  );
}
