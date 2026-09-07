'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { PageHeader, Card, Button, TableCard, THead, TBody, Tr, Th, Td, Badge, EmptyState, EmptyTableRow, Modal, ModalActions } from '@/components/admin/ui';
import VehiclePickerList from '@/components/admin/vehicles/VehiclePickerList';
import MediaBrowser from '@/components/admin/vehicles/MediaBrowser';
import FeatureTagList from '@/components/admin/vehicles/FeatureTagList';
import ImageUpload from '@/components/admin/vehicles/ImageUpload';

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

interface VehicleAccessory {
  id: string;
  vehicleId: string | null;
  name: string;
  description: string | null;
  category: string;
  price: number;
  imageUrl: string | null;
  images: string[] | null;
  inStock: boolean;
  sortOrder: number;
}

const EMPTY_TRIM_FORM = { name: '', description: '', features: [] as string[], price: 0, imageUrl: '', isDefault: false, sortOrder: 0 };
const EMPTY_ACCESSORY_FORM = { name: '', description: '', category: '', price: 0, imageUrl: '', images: [] as string[], inStock: true, global: false, sortOrder: 0 };

type Resource = 'trims' | 'accessories';

/**
 * Image preview with a shared fallback (matches the "IMG" placeholder pattern
 * used for vehicle thumbnails in VehicleManagementClient.tsx): shows a neutral
 * placeholder box when the URL fails to load instead of a broken-image icon.
 */
function ImagePreview({ src, alt, sizeClass }: { src: string; alt: string; sizeClass: string }) {
  const [imgError, setImgError] = useState(false);
  useEffect(() => setImgError(false), [src]);

  return (
    <div className={`${sizeClass} rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-hidden flex items-center justify-center`}>
      {imgError ? (
        <span className="text-gray-400 dark:text-gray-500 text-xs">IMG</span>
      ) : (
        <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      )}
    </div>
  );
}

export default function ModelsAndVariantsPage() {
  const [resource, setResource] = useState<Resource>('trims');
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  const [packages, setPackages] = useState<VehiclePackage[]>([]);
  const [accessories, setAccessories] = useState<VehicleAccessory[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingPackage, setEditingPackage] = useState<VehiclePackage | null>(null);
  const [editingAccessory, setEditingAccessory] = useState<VehicleAccessory | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [trimForm, setTrimForm] = useState(EMPTY_TRIM_FORM);
  const [accessoryForm, setAccessoryForm] = useState(EMPTY_ACCESSORY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) { setPackages([]); setAccessories([]); return; }
    void fetchPackages(vehicleId);
    void fetchAccessories(vehicleId);
  }, [vehicleId]);

  async function fetchPackages(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicle-packages?vehicleId=${id}`);
      if (res.ok) setPackages((await res.json()).packages || []);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAccessories(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicle-accessories?vehicleId=${id}`);
      if (res.ok) setAccessories((await res.json()).accessories || []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingPackage(null);
    setEditingAccessory(null);
    setTrimForm(EMPTY_TRIM_FORM);
    setAccessoryForm(EMPTY_ACCESSORY_FORM);
    setShowForm(true);
  }

  function openEditPackage(pkg: VehiclePackage) {
    setEditingPackage(pkg);
    setTrimForm({
      name: pkg.name, description: pkg.description || '',
      features: Array.isArray(pkg.features) ? pkg.features : [],
      price: pkg.price, imageUrl: pkg.imageUrl || '', isDefault: pkg.isDefault, sortOrder: pkg.sortOrder,
    });
    setShowForm(true);
  }

  function openEditAccessory(acc: VehicleAccessory) {
    setEditingAccessory(acc);
    setAccessoryForm({
      name: acc.name, description: acc.description || '', category: acc.category,
      price: acc.price, imageUrl: acc.imageUrl || '', images: Array.isArray(acc.images) ? acc.images : [],
      inStock: acc.inStock, global: acc.vehicleId === null, sortOrder: acc.sortOrder,
    });
    setShowForm(true);
  }

  async function saveTrim() {
    if (!vehicleId) return;
    setSaving(true);
    setError(null);
    try {
      const url = editingPackage ? `/api/admin/vehicle-packages/${editingPackage.id}` : '/api/admin/vehicle-packages';
      const method = editingPackage ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...trimForm, vehicleId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed');
      setShowForm(false);
      await fetchPackages(vehicleId);
    } catch (e: any) {
      setError(e.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  }

  async function saveAccessory() {
    if (!vehicleId) return;
    setSaving(true);
    setError(null);
    try {
      const url = editingAccessory ? `/api/admin/vehicle-accessories/${editingAccessory.id}` : '/api/admin/vehicle-accessories';
      const method = editingAccessory ? 'PUT' : 'POST';
      const { global, ...rest } = accessoryForm;
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rest, vehicleId: global ? null : vehicleId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed');
      setShowForm(false);
      await fetchAccessories(vehicleId);
    } catch (e: any) {
      setError(e.message || 'Unable to save');
    } finally {
      setSaving(false);
    }
  }

  async function removeTrim(pkg: VehiclePackage) {
    if (!vehicleId) return;
    if (!confirm(`Delete trim "${pkg.name}"?`)) return;
    await fetch(`/api/admin/vehicle-packages/${pkg.id}`, { method: 'DELETE' });
    await fetchPackages(vehicleId);
  }

  async function removeAccessory(acc: VehicleAccessory) {
    if (!vehicleId) return;
    if (!confirm(`Delete accessory "${acc.name}"?`)) return;
    await fetch(`/api/admin/vehicle-accessories/${acc.id}`, { method: 'DELETE' });
    await fetchAccessories(vehicleId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Models & Variants"
        description="Manage per-vehicle trim levels and accessories — shown live in the public configurator"
      />

      {!vehicleId ? (
        <VehiclePickerList onSelect={setVehicleId} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setVehicleId(null)}>Change vehicle</Button>
            {/* min-w-0 lets this shrink inside the flex-wrap row; overflow-x-auto + the
                scrollbar-hiding utilities below scroll rather than clip long labels on
                very narrow phones (mirrors the scrollbar-hide convention in
                apps/web/components/ModelPageTabs.tsx, done here via Tailwind arbitrary
                variants since this app's globals.css doesn't define that utility). */}
            <div className="flex min-w-0 max-w-full overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setResource('trims')}
                className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium ${resource === 'trims' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >Trims</button>
              <button
                onClick={() => setResource('accessories')}
                className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium ${resource === 'accessories' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >Accessories</button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">{error}</div>
          )}

          {resource === 'trims' ? (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Trim Levels</h3>
                <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Trim</Button>
              </div>
              {/* Tablet/desktop: dense table */}
              <div className="hidden md:block">
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
                              <button onClick={() => openEditPackage(pkg)} className="p-2 text-geely-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => removeTrim(pkg)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </TBody>
                </TableCard>
              </div>

              {/* Phone: vertical card stack with larger tap targets */}
              <div className="md:hidden space-y-3">
                {loading ? (
                  <EmptyState title="Loading trims..." />
                ) : packages.length === 0 ? (
                  <EmptyState title="No trims yet for this vehicle" />
                ) : (
                  packages.map((pkg) => (
                    <Card key={pkg.id} padding="sm" className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{pkg.name}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge tone="gray">Trim</Badge>
                            {pkg.isDefault && <Badge tone="blue">Default</Badge>}
                          </div>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">{pkg.price ? `+${pkg.price}` : '—'}</p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {Array.isArray(pkg.features) ? pkg.features.length : 0} feature{(pkg.features?.length ?? 0) === 1 ? '' : 's'}
                      </p>
                      <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                        <button
                          onClick={() => openEditPackage(pkg)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-geely-blue hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Edit2 className="w-4 h-4" />Edit
                        </button>
                        <button
                          onClick={() => removeTrim(pkg)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />Delete
                        </button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Accessories</h3>
                <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Accessory</Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Shows this vehicle&apos;s own accessories plus any marked &quot;available for all vehicles&quot;.
              </p>
              {/* Tablet/desktop: dense table */}
              <div className="hidden md:block">
                <TableCard>
                  <THead>
                    <tr>
                      <Th>Name</Th>
                      <Th>Category</Th>
                      <Th>Price</Th>
                      <Th>Scope</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {loading ? (
                      <EmptyTableRow colSpan={6} message="Loading accessories..." />
                    ) : accessories.length === 0 ? (
                      <EmptyTableRow colSpan={6} message="No accessories yet for this vehicle" />
                    ) : (
                      accessories.map((acc) => (
                        <Tr key={acc.id}>
                          <Td className="font-medium text-gray-900 dark:text-gray-100">{acc.name}</Td>
                          <Td className="text-gray-500 dark:text-gray-400">{acc.category}</Td>
                          <Td className="text-gray-500 dark:text-gray-400">{acc.price ? `+${acc.price}` : '—'}</Td>
                          <Td><Badge tone={acc.vehicleId === null ? 'purple' : 'gray'}>{acc.vehicleId === null ? 'All vehicles' : 'This vehicle'}</Badge></Td>
                          <Td><Badge tone={acc.inStock ? 'green' : 'red'}>{acc.inStock ? 'In Stock' : 'Out of Stock'}</Badge></Td>
                          <Td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEditAccessory(acc)} className="p-2 text-geely-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => removeAccessory(acc)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </Td>
                        </Tr>
                      ))
                    )}
                  </TBody>
                </TableCard>
              </div>

              {/* Phone: vertical card stack with larger tap targets */}
              <div className="md:hidden space-y-3">
                {loading ? (
                  <EmptyState title="Loading accessories..." />
                ) : accessories.length === 0 ? (
                  <EmptyState title="No accessories yet for this vehicle" />
                ) : (
                  accessories.map((acc) => (
                    <Card key={acc.id} padding="sm" className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{acc.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{acc.category}</p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">{acc.price ? `+${acc.price}` : '—'}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={acc.vehicleId === null ? 'purple' : 'gray'}>{acc.vehicleId === null ? 'All vehicles' : 'This vehicle'}</Badge>
                        <Badge tone={acc.inStock ? 'green' : 'red'}>{acc.inStock ? 'In Stock' : 'Out of Stock'}</Badge>
                      </div>
                      <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                        <button
                          onClick={() => openEditAccessory(acc)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-geely-blue hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Edit2 className="w-4 h-4" />Edit
                        </button>
                        <button
                          onClick={() => removeAccessory(acc)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                        >
                          <Trash2 className="w-4 h-4" />Delete
                        </button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {showForm && resource === 'trims' && (
        <Modal title={editingPackage ? 'Edit Trim Level' : 'Add Trim Level'} onClose={() => setShowForm(false)} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input value={trimForm.name} onChange={(e) => setTrimForm({ ...trimForm, name: e.target.value })}
                placeholder="e.g. Premium Package"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={trimForm.description} onChange={(e) => setTrimForm({ ...trimForm, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <FeatureTagList
              title="Included Features"
              icon={Plus}
              items={trimForm.features}
              accent="violet"
              placeholder="e.g. Sunroof"
              onChange={(next) => setTrimForm({ ...trimForm, features: next })}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
              <div className="flex items-center gap-3">
                {trimForm.imageUrl && <ImagePreview src={trimForm.imageUrl} alt="" sizeClass="w-12 h-12" />}
                <Button variant="secondary" onClick={() => setShowMediaBrowser(true)} type="button">
                  <ImageIcon className="w-4 h-4" />{trimForm.imageUrl ? 'Change' : 'Choose'} Image
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extra Price</label>
                <input type="number" value={trimForm.price} onChange={(e) => setTrimForm({ ...trimForm, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                <input type="number" value={trimForm.sortOrder} onChange={(e) => setTrimForm({ ...trimForm, sortOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={trimForm.isDefault} onChange={(e) => setTrimForm({ ...trimForm, isDefault: e.target.checked })} />
              Default trim
            </label>
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveTrim} disabled={saving || !trimForm.name}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalActions>
        </Modal>
      )}

      {showForm && resource === 'accessories' && (
        <Modal title={editingAccessory ? 'Edit Accessory' : 'Add Accessory'} onClose={() => setShowForm(false)} maxWidth="max-w-lg">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input value={accessoryForm.name} onChange={(e) => setAccessoryForm({ ...accessoryForm, name: e.target.value })}
                placeholder="e.g. Roof Rack"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <input value={accessoryForm.category} onChange={(e) => setAccessoryForm({ ...accessoryForm, category: e.target.value })}
                placeholder="e.g. Exterior, Interior, Technology, Safety"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea value={accessoryForm.description} onChange={(e) => setAccessoryForm({ ...accessoryForm, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
              <div className="flex items-center gap-3">
                {accessoryForm.imageUrl && <ImagePreview src={accessoryForm.imageUrl} alt="" sizeClass="w-12 h-12" />}
                <Button variant="secondary" onClick={() => setShowMediaBrowser(true)} type="button">
                  <ImageIcon className="w-4 h-4" />{accessoryForm.imageUrl ? 'Change' : 'Choose'} Image
                </Button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Additional Photos</label>
              <ImageUpload images={accessoryForm.images} onChange={(images) => setAccessoryForm({ ...accessoryForm, images })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                <input type="number" value={accessoryForm.price} onChange={(e) => setAccessoryForm({ ...accessoryForm, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                <input type="number" value={accessoryForm.sortOrder} onChange={(e) => setAccessoryForm({ ...accessoryForm, sortOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={accessoryForm.inStock} onChange={(e) => setAccessoryForm({ ...accessoryForm, inStock: e.target.checked })} />
                In stock
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={accessoryForm.global} onChange={(e) => setAccessoryForm({ ...accessoryForm, global: e.target.checked })} />
                Available for all vehicles
              </label>
            </div>
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveAccessory} disabled={saving || !accessoryForm.name || !accessoryForm.category}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalActions>
        </Modal>
      )}

      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onSelect={(url) => {
          if (resource === 'trims') setTrimForm((f) => ({ ...f, imageUrl: url }));
          else setAccessoryForm((f) => ({ ...f, imageUrl: url }));
          setShowMediaBrowser(false);
        }}
        fileType="image"
        title={resource === 'trims' ? 'Select Trim Image' : 'Select Accessory Image'}
      />
    </div>
  );
}
