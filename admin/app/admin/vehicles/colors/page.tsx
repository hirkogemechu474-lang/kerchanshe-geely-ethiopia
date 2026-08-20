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

interface VehicleInterior {
  id: string;
  vehicleId: string;
  name: string;
  description: string | null;
  materialType: string;
  imageUrl: string | null;
  price: number;
  isDefault: boolean;
  inStock: boolean;
  sortOrder: number;
}

const EMPTY_COLOR_FORM = { name: '', colorCode: '#FFFFFF', imageUrl: '', price: 0, inStock: true, isDefault: false, sortOrder: 0 };
const EMPTY_INTERIOR_FORM = { name: '', description: '', materialType: '', imageUrl: '', price: 0, inStock: true, isDefault: false, sortOrder: 0 };

type Resource = 'colors' | 'interiors';

export default function VehicleColorsPage() {
  const [resource, setResource] = useState<Resource>('colors');
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [interiors, setInteriors] = useState<VehicleInterior[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingColor, setEditingColor] = useState<VehicleColor | null>(null);
  const [editingInterior, setEditingInterior] = useState<VehicleInterior | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [colorForm, setColorForm] = useState(EMPTY_COLOR_FORM);
  const [interiorForm, setInteriorForm] = useState(EMPTY_INTERIOR_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) { setColors([]); setInteriors([]); return; }
    void fetchColors(vehicleId);
    void fetchInteriors(vehicleId);
  }, [vehicleId]);

  async function fetchColors(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicle-colors?vehicleId=${id}`);
      if (res.ok) setColors((await res.json()).colors || []);
    } finally {
      setLoading(false);
    }
  }

  async function fetchInteriors(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicle-interiors?vehicleId=${id}`);
      if (res.ok) setInteriors((await res.json()).interiors || []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingColor(null);
    setEditingInterior(null);
    setColorForm(EMPTY_COLOR_FORM);
    setInteriorForm(EMPTY_INTERIOR_FORM);
    setShowForm(true);
  }

  function openEditColor(color: VehicleColor) {
    setEditingColor(color);
    setColorForm({
      name: color.name, colorCode: color.colorCode, imageUrl: color.imageUrl || '',
      price: color.price, inStock: color.inStock, isDefault: color.isDefault, sortOrder: color.sortOrder,
    });
    setShowForm(true);
  }

  function openEditInterior(interior: VehicleInterior) {
    setEditingInterior(interior);
    setInteriorForm({
      name: interior.name, description: interior.description || '', materialType: interior.materialType,
      imageUrl: interior.imageUrl || '', price: interior.price, inStock: interior.inStock,
      isDefault: interior.isDefault, sortOrder: interior.sortOrder,
    });
    setShowForm(true);
  }

  async function saveColor() {
    if (!vehicleId) return;
    setSaving(true);
    setError(null);
    try {
      const url = editingColor ? `/api/admin/vehicle-colors/${editingColor.id}` : '/api/admin/vehicle-colors';
      const method = editingColor ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...colorForm, vehicleId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed');
      setShowForm(false);
      await fetchColors(vehicleId);
    } catch (e: any) {
      setError(e.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  }

  async function saveInterior() {
    if (!vehicleId) return;
    setSaving(true);
    setError(null);
    try {
      const url = editingInterior ? `/api/admin/vehicle-interiors/${editingInterior.id}` : '/api/admin/vehicle-interiors';
      const method = editingInterior ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...interiorForm, vehicleId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed');
      setShowForm(false);
      await fetchInteriors(vehicleId);
    } catch (e: any) {
      setError(e.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  }

  async function removeColor(color: VehicleColor) {
    if (!vehicleId) return;
    if (!confirm(`Delete color "${color.name}"?`)) return;
    await fetch(`/api/admin/vehicle-colors/${color.id}`, { method: 'DELETE' });
    await fetchColors(vehicleId);
  }

  async function removeInterior(interior: VehicleInterior) {
    if (!vehicleId) return;
    if (!confirm(`Delete interior option "${interior.name}"?`)) return;
    await fetch(`/api/admin/vehicle-interiors/${interior.id}`, { method: 'DELETE' });
    await fetchInteriors(vehicleId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colors"
        description="Manage per-vehicle color and interior options — shown live in the public configurator"
      />

      {!vehicleId ? (
        <VehiclePickerList onSelect={setVehicleId} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="secondary" onClick={() => setVehicleId(null)}>Change vehicle</Button>
            <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setResource('colors')}
                className={`px-4 py-2 text-sm font-medium ${resource === 'colors' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >Colors</button>
              <button
                onClick={() => setResource('interiors')}
                className={`px-4 py-2 text-sm font-medium ${resource === 'interiors' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >Interior Options</button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">{error}</div>
          )}

          {resource === 'colors' ? (
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
                        <Td><div className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600" style={{ backgroundColor: color.colorCode }} /></Td>
                        <Td className="font-medium text-gray-900 dark:text-gray-100">
                          {color.name}
                          {color.isDefault && <span className="ml-2"><Badge tone="blue">Default</Badge></span>}
                        </Td>
                        <Td className="text-gray-500 dark:text-gray-400">{color.colorCode}</Td>
                        <Td className="text-gray-500 dark:text-gray-400">{color.price ? `+${color.price}` : '—'}</Td>
                        <Td><Badge tone={color.inStock ? 'green' : 'red'}>{color.inStock ? 'In Stock' : 'Out of Stock'}</Badge></Td>
                        <Td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEditColor(color)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => removeColor(color)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </TableCard>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Interior Options</h3>
                <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Interior Option</Button>
              </div>
              <TableCard>
                <THead>
                  <tr>
                    <Th>Name</Th>
                    <Th>Material</Th>
                    <Th>Price</Th>
                    <Th>Status</Th>
                    <Th className="text-right">Actions</Th>
                  </tr>
                </THead>
                <TBody>
                  {loading ? (
                    <EmptyTableRow colSpan={5} message="Loading interior options..." />
                  ) : interiors.length === 0 ? (
                    <EmptyTableRow colSpan={5} message="No interior options yet for this vehicle" />
                  ) : (
                    interiors.map((interior) => (
                      <Tr key={interior.id}>
                        <Td className="font-medium text-gray-900 dark:text-gray-100">
                          {interior.name}
                          {interior.isDefault && <span className="ml-2"><Badge tone="blue">Default</Badge></span>}
                        </Td>
                        <Td className="text-gray-500 dark:text-gray-400">{interior.materialType}</Td>
                        <Td className="text-gray-500 dark:text-gray-400">{interior.price ? `+${interior.price}` : '—'}</Td>
                        <Td><Badge tone={interior.inStock ? 'green' : 'red'}>{interior.inStock ? 'In Stock' : 'Out of Stock'}</Badge></Td>
                        <Td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => openEditInterior(interior)} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => removeInterior(interior)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </Td>
                      </Tr>
                    ))
                  )}
                </TBody>
              </TableCard>
            </Card>
          )}
        </div>
      )}

      {showForm && resource === 'colors' && (
        <Modal title={editingColor ? 'Edit Color' : 'Add Color'} onClose={() => setShowForm(false)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input value={colorForm.name} onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                placeholder="e.g. Pearl White"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Color</label>
              <div className="flex items-center gap-2">
                <input type="color" value={/^#[0-9A-Fa-f]{6}$/.test(colorForm.colorCode) ? colorForm.colorCode : '#ffffff'}
                  onChange={(e) => setColorForm({ ...colorForm, colorCode: e.target.value })}
                  className="h-10 w-14 rounded border border-gray-300 dark:border-gray-700" />
                <input value={colorForm.colorCode} onChange={(e) => setColorForm({ ...colorForm, colorCode: e.target.value })}
                  placeholder="#FFFFFF"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
              <div className="flex items-center gap-3">
                {colorForm.imageUrl && <img src={colorForm.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />}
                <Button variant="secondary" onClick={() => setShowMediaBrowser(true)} type="button">
                  <ImageIcon className="w-4 h-4" />{colorForm.imageUrl ? 'Change' : 'Choose'} Image
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extra Price</label>
                <input type="number" value={colorForm.price} onChange={(e) => setColorForm({ ...colorForm, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                <input type="number" value={colorForm.sortOrder} onChange={(e) => setColorForm({ ...colorForm, sortOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={colorForm.inStock} onChange={(e) => setColorForm({ ...colorForm, inStock: e.target.checked })} />
                In stock
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={colorForm.isDefault} onChange={(e) => setColorForm({ ...colorForm, isDefault: e.target.checked })} />
                Default color
              </label>
            </div>
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveColor} disabled={saving || !colorForm.name || !colorForm.colorCode}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalActions>
        </Modal>
      )}

      {showForm && resource === 'interiors' && (
        <Modal title={editingInterior ? 'Edit Interior Option' : 'Add Interior Option'} onClose={() => setShowForm(false)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input value={interiorForm.name} onChange={(e) => setInteriorForm({ ...interiorForm, name: e.target.value })}
                placeholder="e.g. Black Leather"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Material Type</label>
              <input value={interiorForm.materialType} onChange={(e) => setInteriorForm({ ...interiorForm, materialType: e.target.value })}
                placeholder="e.g. Leather, Fabric, Synthetic"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={interiorForm.description} onChange={(e) => setInteriorForm({ ...interiorForm, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
              <div className="flex items-center gap-3">
                {interiorForm.imageUrl && <img src={interiorForm.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />}
                <Button variant="secondary" onClick={() => setShowMediaBrowser(true)} type="button">
                  <ImageIcon className="w-4 h-4" />{interiorForm.imageUrl ? 'Change' : 'Choose'} Image
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extra Price</label>
                <input type="number" value={interiorForm.price} onChange={(e) => setInteriorForm({ ...interiorForm, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                <input type="number" value={interiorForm.sortOrder} onChange={(e) => setInteriorForm({ ...interiorForm, sortOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={interiorForm.inStock} onChange={(e) => setInteriorForm({ ...interiorForm, inStock: e.target.checked })} />
                In stock
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={interiorForm.isDefault} onChange={(e) => setInteriorForm({ ...interiorForm, isDefault: e.target.checked })} />
                Default option
              </label>
            </div>
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveInterior} disabled={saving || !interiorForm.name || !interiorForm.materialType}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalActions>
        </Modal>
      )}

      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onSelect={(url) => {
          if (resource === 'colors') setColorForm((f) => ({ ...f, imageUrl: url }));
          else setInteriorForm((f) => ({ ...f, imageUrl: url }));
          setShowMediaBrowser(false);
        }}
        fileType="image"
        title={resource === 'colors' ? 'Select Color Image' : 'Select Interior Image'}
      />
    </div>
  );
}
