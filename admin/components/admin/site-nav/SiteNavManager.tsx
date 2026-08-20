'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { TableCard, THead, TBody, Tr, Th, Td, Badge, Button, Modal, ModalActions, EmptyTableRow } from '@/components/admin/ui';
import { SITE_NAV_ICON_OPTIONS } from '@/lib/siteNavIcons';

interface SiteNavItem {
  id: string;
  placement: 'TOP_NAV' | 'MODELS_QUICK_ACTIONS';
  label: string;
  subtitle: string | null;
  icon: string | null;
  href: string;
  openInNewTab: boolean;
  isHighlighted: boolean;
  isActive: boolean;
  displayOrder: number;
}

type FormState = {
  label: string;
  subtitle: string;
  icon: string;
  href: string;
  displayOrder: string;
  isActive: boolean;
  isHighlighted: boolean;
  openInNewTab: boolean;
};

const EMPTY_FORM: FormState = {
  label: '',
  subtitle: '',
  icon: '',
  href: '',
  displayOrder: '0',
  isActive: true,
  isHighlighted: false,
  openInNewTab: false,
};

export default function SiteNavManager({
  topNav,
  quickActions,
}: {
  topNav: SiteNavItem[];
  quickActions: SiteNavItem[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<{ placement: SiteNavItem['placement']; editing: SiteNavItem | null } | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const openCreate = (placement: SiteNavItem['placement']) => {
    setForm(EMPTY_FORM);
    setModal({ placement, editing: null });
    setError('');
  };

  const openEdit = (item: SiteNavItem) => {
    setForm({
      label: item.label,
      subtitle: item.subtitle || '',
      icon: item.icon || '',
      href: item.href,
      displayOrder: String(item.displayOrder),
      isActive: item.isActive,
      isHighlighted: item.isHighlighted,
      openInNewTab: item.openInNewTab,
    });
    setModal({ placement: item.placement, editing: item });
    setError('');
  };

  const save = async () => {
    if (!modal) return;
    setSaving(true);
    setError('');
    try {
      const body = {
        placement: modal.placement,
        label: form.label,
        subtitle: form.subtitle || null,
        icon: form.icon || null,
        href: form.href,
        displayOrder: Number(form.displayOrder) || 0,
        isActive: form.isActive,
        isHighlighted: form.isHighlighted,
        openInNewTab: form.openInNewTab,
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

  const renderSection = (title: string, description: string, placement: SiteNavItem['placement'], items: SiteNavItem[]) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <Button size="sm" onClick={() => openCreate(placement)}>
          <Plus className="w-4 h-4" /> Add Item
        </Button>
      </div>
      <TableCard>
        <THead>
          <tr>
            <Th>Order</Th>
            <Th>Label</Th>
            {placement === 'MODELS_QUICK_ACTIONS' && <Th>Subtitle</Th>}
            <Th>Href</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </THead>
        <TBody>
          {items.length === 0 && <EmptyTableRow colSpan={placement === 'MODELS_QUICK_ACTIONS' ? 6 : 5} message="No items yet." />}
          {items.map((item) => (
            <Tr key={item.id}>
              <Td className="text-gray-500">{item.displayOrder}</Td>
              <Td className="font-medium text-gray-900">
                {item.label}
                {item.isHighlighted && <span className="ml-2"><Badge tone="blue">Highlighted</Badge></span>}
              </Td>
              {placement === 'MODELS_QUICK_ACTIONS' && <Td className="text-gray-500">{item.subtitle || '—'}</Td>}
              <Td className="text-gray-500">{item.href}</Td>
              <Td>
                <Badge tone={item.isActive ? 'green' : 'red'}>{item.isActive ? 'Active' : 'Hidden'}</Badge>
              </Td>
              <Td className="text-right">
                <div className="flex justify-end gap-3">
                  <button onClick={() => openEdit(item)} className="text-blue-600 hover:text-blue-700">
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
    </div>
  );

  return (
    <div className="space-y-8">
      {renderSection('Top Navigation', 'The main header nav bar shown on every page', 'TOP_NAV', topNav)}
      {renderSection(
        'Models Quick Actions',
        'The panel shown alongside the vehicle list in the Models dropdown',
        'MODELS_QUICK_ACTIONS',
        quickActions
      )}

      {modal && (
        <Modal
          title={modal.editing ? `Edit ${modal.editing.label}` : 'Add Item'}
          onClose={() => setModal(null)}
          maxWidth="max-w-md"
        >
          <div className="space-y-3">
            <Field label="Label *">
              <input
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className="input"
              />
            </Field>
            {modal.placement === 'MODELS_QUICK_ACTIONS' && (
              <Field label="Subtitle">
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                  className="input"
                />
              </Field>
            )}
            <Field label="Link (href) *">
              <input
                value={form.href}
                onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))}
                placeholder="/models"
                className="input"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Icon">
                <select value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} className="input">
                  <option value="">— None —</option>
                  {SITE_NAV_ICON_OPTIONS.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Display Order">
                <input
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                  className="input"
                />
              </Field>
            </div>
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
              {modal.placement === 'MODELS_QUICK_ACTIONS' && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={form.isHighlighted}
                    onChange={(e) => setForm((f) => ({ ...f, isHighlighted: e.target.checked }))}
                  />
                  Highlighted (dark CTA tile)
                </label>
              )}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}
