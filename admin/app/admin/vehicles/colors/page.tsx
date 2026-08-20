'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { PageHeader, Card, Button, TableCard, THead, TBody, Tr, Th, Td, Badge, EmptyTableRow, Modal, ModalActions } from '@/components/admin/ui';
import VehiclePickerList from '@/components/admin/vehicles/VehiclePickerList';
import MediaBrowser from '@/components/admin/vehicles/MediaBrowser';

interface VehicleColor {
  id: string;
  vehicleId: string;
  name: string;
  colorCode: string;
  imageUrl: string | null;
  price: number;
  inStock: boolean;
  isDefault: boolean;
  sortOrder: number;
}

const EMPTY_FORM = { name: '', colorCode: '#FFFFFF', imageUrl: '', price: 0, inStock: true, isDefault: false, sortOrder: 0 };

export default function VehicleColorsPage() {
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<VehicleColor | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) { setColors([]); return; }
    void fetchColors(vehicleId);
  }, [vehicleId]);

  async function fetchColors(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicle-colors?vehicleId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setColors(data.colors || []);
      }
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(color: VehicleColor) {
    setEditing(color);
    setForm({
      name: color.name,
      colorCode: color.colorCode,
      imageUrl: color.imageUrl || '',
      price: color.price,
      inStock: color.inStock,
      isDefault: color.isDefault,
      sortOrder: color.sortOrder,
    });
    setShowForm(true);
  }

  async function save() {
    if (!vehicleId) return;
    setSaving(true);
    setError(null);
    try {
      const url = editing ? `/api/admin/vehicle-colors/${editing.id}` : '/api/admin/vehicle-colors';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, vehicleId }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || 'Save failed');
      }
      setShowForm(false);
      await fetchColors(vehicleId);
    } catch (e: any) {
      setError(e.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  }

  async function remove(color: VehicleColor) {
    if (!vehicleId) return;
    if (!confirm(`Delete color "${color.name}"?`)) return;
    await fetch(`/api/admin/vehicle-colors/${color.id}`, { method: 'DELETE' });
    await fetchColors(vehicleId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colors"
        description="Manage per-vehicle color options — shown live in the public configurator's color picker"
      />

      {!vehicleId ? (
        <VehiclePickerList onSelect={setVehicleId} />
      ) : (
        <div className="space-y-4">
          <Button variant="secondary" onClick={() => setVehicleId(null)}>Change vehicle</Button>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">{error}</div>
          )}

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Colors</h3>
              <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Color</Button>
            </div>
            <TableCard>
              <THead>
                <tr>
                  <Th>Swatch</Th>
                  <Th>Name</Th>
                  <Th>Hex</Th>
                  <Th>Price</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <TBody>
                {loading ? (
                  <EmptyTableRow colSpan={6} message="Loading colors..." />
                ) : colors.length === 0 ? (
                  <EmptyTableRow colSpan={6} message="No colors yet for this vehicle" />
                ) : (
                  colors.map((color) => (
                    <Tr key={color.id}>
                      <Td>
                        <div className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: color.colorCode }} />
                      </Td>
                      <Td className="font-medium text-gray-900 dark:text-gray-100">
                        {color.name}
                        {color.isDefault && <span className="ml-2"><Badge tone="blue">Default</Badge></span>}
                      </Td>
                      <Td className="text-gray-500 dark:text-gray-400">{color.colorCode}</Td>
                      <Td className="text-gray-500 dark:text-gray-400">{color.price ? `+${color.price}` : '—'}</Td>
                      <Td><Badge tone={color.inStock ? 'green' : 'red'}>{color.inStock ? 'In Stock' : 'Out of Stock'}</Badge></Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(color)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => remove(color)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </Td>
                    </Tr>
                  ))
                )}
              </TBody>
            </TableCard>
          </Card>
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit Color' : 'Add Color'} onClose={() => setShowForm(false)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Pearl White"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(form.colorCode) ? form.colorCode : '#ffffff'}
                  onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                  className="h-10 w-14 rounded border border-gray-300 dark:border-gray-700" />
                <input value={form.colorCode} onChange={(e) => setForm({ ...form, colorCode: e.target.value })}
                  placeholder="#FFFFFF"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
              <div className="flex items-center gap-3">
                {form.imageUrl && <img src={form.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />}
                <Button variant="secondary" onClick={() => setShowMediaBrowser(true)} type="button">
                  <ImageIcon className="w-4 h-4" />{form.imageUrl ? 'Change' : 'Choose'} Image
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extra Price</label>
                <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} />
                In stock
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
                Default color
              </label>
            </div>
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name || !form.colorCode}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalActions>
        </Modal>
      )}

      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onSelect={(url) => { setForm((f) => ({ ...f, imageUrl: url })); setShowMediaBrowser(false); }}
        fileType="image"
        title="Select Color Image"
      />
    </div>
  );
}
