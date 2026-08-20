'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { PageHeader, Card, Button, TableCard, THead, TBody, Tr, Th, Td, Badge, EmptyTableRow, Modal, ModalActions } from '@/components/admin/ui';
import VehiclePickerList from '@/components/admin/vehicles/VehiclePickerList';
import MediaBrowser from '@/components/admin/vehicles/MediaBrowser';
import FeatureTagList from '@/components/admin/vehicles/FeatureTagList';

interface VehiclePackage {
  id: string;
  vehicleId: string;
  name: string;
  description: string | null;
  features: string[];
  price: number;
  imageUrl: string | null;
  isDefault: boolean;
  sortOrder: number;
}

const EMPTY_FORM = { name: '', description: '', features: [] as string[], price: 0, imageUrl: '', isDefault: false, sortOrder: 0 };

export default function ModelsAndVariantsPage() {
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [packages, setPackages] = useState<VehiclePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<VehiclePackage | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) { setPackages([]); return; }
    void fetchPackages(vehicleId);
  }, [vehicleId]);

  async function fetchPackages(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicle-packages?vehicleId=${id}`);
      if (res.ok) {
        const data = await res.json();
        setPackages(data.packages || []);
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

  function openEdit(pkg: VehiclePackage) {
    setEditing(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description || '',
      features: Array.isArray(pkg.features) ? pkg.features : [],
      price: pkg.price,
      imageUrl: pkg.imageUrl || '',
      isDefault: pkg.isDefault,
      sortOrder: pkg.sortOrder,
    });
    setShowForm(true);
  }

  async function save() {
    if (!vehicleId) return;
    setSaving(true);
    setError(null);
    try {
      const url = editing ? `/api/admin/vehicle-packages/${editing.id}` : '/api/admin/vehicle-packages';
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
      await fetchPackages(vehicleId);
    } catch (e: any) {
      setError(e.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  }

  async function remove(pkg: VehiclePackage) {
    if (!vehicleId) return;
    if (!confirm(`Delete trim "${pkg.name}"?`)) return;
    await fetch(`/api/admin/vehicle-packages/${pkg.id}`, { method: 'DELETE' });
    await fetchPackages(vehicleId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Models & Variants"
        description="Manage per-vehicle trim levels — shown live in the public configurator's 'Choose Trim Level' step"
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
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Trim Levels</h3>
              <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Trim</Button>
            </div>
            <TableCard>
              <THead>
                <tr>
                  <Th>Name</Th>
                  <Th>Features</Th>
                  <Th>Price</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </THead>
              <TBody>
                {loading ? (
                  <EmptyTableRow colSpan={5} message="Loading trims..." />
                ) : packages.length === 0 ? (
                  <EmptyTableRow colSpan={5} message="No trims yet for this vehicle" />
                ) : (
                  packages.map((pkg) => (
                    <Tr key={pkg.id}>
                      <Td className="font-medium text-gray-900 dark:text-gray-100">
                        {pkg.name}
                        {pkg.isDefault && <span className="ml-2"><Badge tone="blue">Default</Badge></span>}
                      </Td>
                      <Td className="text-gray-500 dark:text-gray-400">
                        {Array.isArray(pkg.features) ? pkg.features.length : 0} feature{(pkg.features?.length ?? 0) === 1 ? '' : 's'}
                      </Td>
                      <Td className="text-gray-500 dark:text-gray-400">{pkg.price ? `+${pkg.price}` : '—'}</Td>
                      <Td><Badge tone="gray">Trim</Badge></Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => openEdit(pkg)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => remove(pkg)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
        <Modal title={editing ? 'Edit Trim Level' : 'Add Trim Level'} onClose={() => setShowForm(false)} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Premium Package"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <FeatureTagList
              title="Included Features"
              icon={Plus}
              items={form.features}
              accent="violet"
              placeholder="e.g. Sunroof"
              onChange={(next) => setForm({ ...form, features: next })}
            />
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
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
              Default trim
            </label>
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={save} disabled={saving || !form.name}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalActions>
        </Modal>
      )}

      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onSelect={(url) => { setForm((f) => ({ ...f, imageUrl: url })); setShowMediaBrowser(false); }}
        fileType="image"
        title="Select Trim Image"
      />
    </div>
  );
}
