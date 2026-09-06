'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Image as ImageIcon } from 'lucide-react';
import { PageHeader, Card, Button, TableCard, THead, TBody, Tr, Th, Td, Badge, EmptyTableRow, EmptyState, Modal, ModalActions } from '@/components/admin/ui';
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

interface VehicleWheel {
  id: string;
  vehicleId: string | null;
  name: string;
  size: string;
  imageUrl: string | null;
  price: number;
  isDefault: boolean;
  inStock: boolean;
  sortOrder: number;
}

const EMPTY_COLOR_FORM = { name: '', colorCode: '#FFFFFF', imageUrl: '', price: 0, inStock: true, isDefault: false, sortOrder: 0 };
const EMPTY_INTERIOR_FORM = { name: '', description: '', materialType: '', imageUrl: '', price: 0, inStock: true, isDefault: false, sortOrder: 0 };
const EMPTY_WHEEL_FORM = { name: '', size: '', imageUrl: '', price: 0, inStock: true, isDefault: false, global: false, sortOrder: 0 };

type Resource = 'colors' | 'interiors' | 'wheels';

/**
 * Shared image thumbnail with a neutral fallback: shows a plain "IMG" placeholder
 * both when there's no URL at all and when the given URL fails to load
 * (broken/expired link) — tracked via local state so each instance recovers
 * independently. Mirrors the VehicleThumb convention in
 * components/admin/vehicles/VehicleManagementClient.tsx for consistency across
 * the Vehicles section.
 */
function ImageThumb({ src, alt, sizeClass }: { src: string | null; alt: string; sizeClass: string }) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !src || imgError;

  return (
    <div className={`${sizeClass} rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 flex-shrink-0 overflow-hidden flex items-center justify-center`}>
      {showFallback ? (
        <span className="text-gray-400 dark:text-gray-500 text-[10px] font-medium">IMG</span>
      ) : (
        <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setImgError(true)} />
      )}
    </div>
  );
}

/**
 * Color swatch thumbnail: same broken/missing-image recovery as ImageThumb, but
 * falls back to a plain circle filled with the color's own hex — reusing this
 * page's existing "no image" treatment for colors, which is more informative
 * than a generic placeholder for this one case.
 */
function ColorSwatchThumb({ color }: { color: VehicleColor }) {
  const [imgError, setImgError] = useState(false);
  if (!color.imageUrl || imgError) {
    return <div className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0" style={{ backgroundColor: color.colorCode }} />;
  }
  return (
    <img
      src={color.imageUrl}
      alt={color.name}
      className="w-9 h-9 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
      onError={() => setImgError(true)}
    />
  );
}

export default function VehicleColorsPage() {
  const [resource, setResource] = useState<Resource>('colors');
  const [vehicleId, setVehicleId] = useState<string | null>(null);

  const [colors, setColors] = useState<VehicleColor[]>([]);
  const [interiors, setInteriors] = useState<VehicleInterior[]>([]);
  const [wheels, setWheels] = useState<VehicleWheel[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingColor, setEditingColor] = useState<VehicleColor | null>(null);
  const [editingInterior, setEditingInterior] = useState<VehicleInterior | null>(null);
  const [editingWheel, setEditingWheel] = useState<VehicleWheel | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showMediaBrowser, setShowMediaBrowser] = useState(false);
  const [colorForm, setColorForm] = useState(EMPTY_COLOR_FORM);
  const [interiorForm, setInteriorForm] = useState(EMPTY_INTERIOR_FORM);
  const [wheelForm, setWheelForm] = useState(EMPTY_WHEEL_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleId) { setColors([]); setInteriors([]); setWheels([]); return; }
    void fetchColors(vehicleId);
    void fetchInteriors(vehicleId);
    void fetchWheels(vehicleId);
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

  async function fetchWheels(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/vehicle-wheels?vehicleId=${id}`);
      if (res.ok) setWheels((await res.json()).wheels || []);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingColor(null);
    setEditingInterior(null);
    setEditingWheel(null);
    setColorForm(EMPTY_COLOR_FORM);
    setInteriorForm(EMPTY_INTERIOR_FORM);
    setWheelForm(EMPTY_WHEEL_FORM);
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

  function openEditWheel(wheel: VehicleWheel) {
    setEditingWheel(wheel);
    setWheelForm({
      name: wheel.name, size: wheel.size, imageUrl: wheel.imageUrl || '', price: wheel.price,
      inStock: wheel.inStock, isDefault: wheel.isDefault, global: wheel.vehicleId === null, sortOrder: wheel.sortOrder,
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

  async function saveWheel() {
    if (!vehicleId) return;
    setSaving(true);
    setError(null);
    try {
      const url = editingWheel ? `/api/admin/vehicle-wheels/${editingWheel.id}` : '/api/admin/vehicle-wheels';
      const method = editingWheel ? 'PUT' : 'POST';
      const { global, ...rest } = wheelForm;
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...rest, vehicleId: global ? null : vehicleId }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Save failed');
      setShowForm(false);
      await fetchWheels(vehicleId);
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

  async function removeWheel(wheel: VehicleWheel) {
    if (!vehicleId) return;
    if (!confirm(`Delete wheel option "${wheel.name}"?`)) return;
    await fetch(`/api/admin/vehicle-wheels/${wheel.id}`, { method: 'DELETE' });
    await fetchWheels(vehicleId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Colors"
        description="Manage per-vehicle color, interior, and wheel options — shown live in the public configurator and as swatches on the model page's 360° view"
      />

      {!vehicleId ? (
        <VehiclePickerList onSelect={setVehicleId} />
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => setVehicleId(null)}>Change vehicle</Button>
            {/* min-w-0 lets this shrink inside the flex-wrap row; overflow-x-auto + the
                scrollbar-hiding utilities below scroll rather than clip these 3 labels on
                very narrow phones (mirrors the scrollbar-hide convention in
                apps/web/components/ModelPageTabs.tsx, done here via Tailwind arbitrary
                variants since this app's globals.css doesn't define that utility). */}
            <div className="flex min-w-0 max-w-full overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                onClick={() => setResource('colors')}
                className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium ${resource === 'colors' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >Colors</button>
              <button
                onClick={() => setResource('interiors')}
                className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium ${resource === 'interiors' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >Interior Options</button>
              <button
                onClick={() => setResource('wheels')}
                className={`shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium ${resource === 'wheels' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
              >Wheels</button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-3 text-sm">{error}</div>
          )}

          {resource === 'colors' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Colors</h3>
                <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Color</Button>
              </div>
              {/* Tablet/desktop: dense table */}
              <div className="hidden md:block">
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
                            <ColorSwatchThumb key={color.imageUrl ?? 'none'} color={color} />
                          </Td>
                          <Td className="font-medium text-gray-900 dark:text-gray-100">
                            {color.name}
                            {color.isDefault && <span className="ml-2"><Badge tone="blue">Default</Badge></span>}
                            {!color.imageUrl && (
                              <span className="ml-2"><Badge tone="gray">No image — won&apos;t appear in 360° view</Badge></span>
                            )}
                          </Td>
                          <Td className="text-gray-500 dark:text-gray-400">{color.colorCode}</Td>
                          <Td className="text-gray-500 dark:text-gray-400">{color.price ? `+${color.price}` : '—'}</Td>
                          <Td><Badge tone={color.inStock ? 'green' : 'red'}>{color.inStock ? 'In Stock' : 'Out of Stock'}</Badge></Td>
                          <Td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEditColor(color)} className="p-2 text-geely-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => removeColor(color)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
                  <EmptyState title="Loading colors..." />
                ) : colors.length === 0 ? (
                  <EmptyState title="No colors yet for this vehicle" />
                ) : (
                  colors.map((color) => (
                    <Card key={color.id} padding="sm" className="space-y-3">
                      <div className="flex items-start gap-3">
                        <ColorSwatchThumb key={color.imageUrl ?? 'none'} color={color} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{color.name}</p>
                            <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">{color.price ? `+${color.price}` : '—'}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{color.colorCode}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge tone={color.inStock ? 'green' : 'red'}>{color.inStock ? 'In Stock' : 'Out of Stock'}</Badge>
                            {color.isDefault && <Badge tone="blue">Default</Badge>}
                            {!color.imageUrl && <Badge tone="gray">No image — won&apos;t appear in 360° view</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                        <button
                          onClick={() => openEditColor(color)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-geely-blue hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Edit2 className="w-4 h-4" />Edit
                        </button>
                        <button
                          onClick={() => removeColor(color)}
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

          {resource === 'interiors' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Interior Options</h3>
                <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Interior Option</Button>
              </div>
              {/* Tablet/desktop: dense table */}
              <div className="hidden md:block">
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
                              <button onClick={() => openEditInterior(interior)} className="p-2 text-geely-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => removeInterior(interior)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
                  <EmptyState title="Loading interior options..." />
                ) : interiors.length === 0 ? (
                  <EmptyState title="No interior options yet for this vehicle" />
                ) : (
                  interiors.map((interior) => (
                    <Card key={interior.id} padding="sm" className="space-y-3">
                      <div className="flex items-start gap-3">
                        <ImageThumb key={interior.imageUrl ?? 'none'} src={interior.imageUrl} alt={interior.name} sizeClass="w-11 h-11" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{interior.name}</p>
                            <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">{interior.price ? `+${interior.price}` : '—'}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{interior.materialType}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge tone={interior.inStock ? 'green' : 'red'}>{interior.inStock ? 'In Stock' : 'Out of Stock'}</Badge>
                            {interior.isDefault && <Badge tone="blue">Default</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                        <button
                          onClick={() => openEditInterior(interior)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-geely-blue hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Edit2 className="w-4 h-4" />Edit
                        </button>
                        <button
                          onClick={() => removeInterior(interior)}
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

          {resource === 'wheels' && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Wheels</h3>
                <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Wheel Option</Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Shows this vehicle&apos;s own wheel options plus any marked &quot;available for all vehicles&quot;.
              </p>
              {/* Tablet/desktop: dense table */}
              <div className="hidden md:block">
                <TableCard>
                  <THead>
                    <tr>
                      <Th>Name</Th>
                      <Th>Size</Th>
                      <Th>Price</Th>
                      <Th>Scope</Th>
                      <Th>Status</Th>
                      <Th className="text-right">Actions</Th>
                    </tr>
                  </THead>
                  <TBody>
                    {loading ? (
                      <EmptyTableRow colSpan={6} message="Loading wheel options..." />
                    ) : wheels.length === 0 ? (
                      <EmptyTableRow colSpan={6} message="No wheel options yet for this vehicle" />
                    ) : (
                      wheels.map((wheel) => (
                        <Tr key={wheel.id}>
                          <Td className="font-medium text-gray-900 dark:text-gray-100">
                            {wheel.name}
                            {wheel.isDefault && <span className="ml-2"><Badge tone="blue">Default</Badge></span>}
                          </Td>
                          <Td className="text-gray-500 dark:text-gray-400">{wheel.size}</Td>
                          <Td className="text-gray-500 dark:text-gray-400">{wheel.price ? `+${wheel.price}` : '—'}</Td>
                          <Td><Badge tone={wheel.vehicleId === null ? 'purple' : 'gray'}>{wheel.vehicleId === null ? 'All vehicles' : 'This vehicle'}</Badge></Td>
                          <Td><Badge tone={wheel.inStock ? 'green' : 'red'}>{wheel.inStock ? 'In Stock' : 'Out of Stock'}</Badge></Td>
                          <Td className="text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEditWheel(wheel)} className="p-2 text-geely-blue hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                              <button onClick={() => removeWheel(wheel)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 className="w-4 h-4" /></button>
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
                  <EmptyState title="Loading wheel options..." />
                ) : wheels.length === 0 ? (
                  <EmptyState title="No wheel options yet for this vehicle" />
                ) : (
                  wheels.map((wheel) => (
                    <Card key={wheel.id} padding="sm" className="space-y-3">
                      <div className="flex items-start gap-3">
                        <ImageThumb key={wheel.imageUrl ?? 'none'} src={wheel.imageUrl} alt={wheel.name} sizeClass="w-11 h-11" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{wheel.name}</p>
                            <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-100">{wheel.price ? `+${wheel.price}` : '—'}</p>
                          </div>
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{wheel.size}</p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                            <Badge tone={wheel.inStock ? 'green' : 'red'}>{wheel.inStock ? 'In Stock' : 'Out of Stock'}</Badge>
                            <Badge tone={wheel.vehicleId === null ? 'purple' : 'gray'}>{wheel.vehicleId === null ? 'All vehicles' : 'This vehicle'}</Badge>
                            {wheel.isDefault && <Badge tone="blue">Default</Badge>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 border-t border-gray-100 dark:border-gray-700 pt-3">
                        <button
                          onClick={() => openEditWheel(wheel)}
                          className="flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-geely-blue hover:bg-blue-50 dark:hover:bg-blue-900/30"
                        >
                          <Edit2 className="w-4 h-4" />Edit
                        </button>
                        <button
                          onClick={() => removeWheel(wheel)}
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
                {colorForm.imageUrl && <ImageThumb key={colorForm.imageUrl} src={colorForm.imageUrl} alt="" sizeClass="w-12 h-12" />}
                <Button variant="secondary" onClick={() => setShowMediaBrowser(true)} type="button">
                  <ImageIcon className="w-4 h-4" />{colorForm.imageUrl ? 'Change' : 'Choose'} Image
                </Button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                A shot of the vehicle in this color. Used as the swatch thumbnail and swapped into the model page&apos;s 360° viewer when selected.
              </p>
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
                {interiorForm.imageUrl && <ImageThumb key={interiorForm.imageUrl} src={interiorForm.imageUrl} alt="" sizeClass="w-12 h-12" />}
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

      {showForm && resource === 'wheels' && (
        <Modal title={editingWheel ? 'Edit Wheel Option' : 'Add Wheel Option'} onClose={() => setShowForm(false)} maxWidth="max-w-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
              <input value={wheelForm.name} onChange={(e) => setWheelForm({ ...wheelForm, name: e.target.value })}
                placeholder="e.g. Sport Alloy"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Size</label>
              <input value={wheelForm.size} onChange={(e) => setWheelForm({ ...wheelForm, size: e.target.value })}
                placeholder={'e.g. 16", 17", 18"'}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image</label>
              <div className="flex items-center gap-3">
                {wheelForm.imageUrl && <ImageThumb key={wheelForm.imageUrl} src={wheelForm.imageUrl} alt="" sizeClass="w-12 h-12" />}
                <Button variant="secondary" onClick={() => setShowMediaBrowser(true)} type="button">
                  <ImageIcon className="w-4 h-4" />{wheelForm.imageUrl ? 'Change' : 'Choose'} Image
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extra Price</label>
                <input type="number" value={wheelForm.price} onChange={(e) => setWheelForm({ ...wheelForm, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
                <input type="number" value={wheelForm.sortOrder} onChange={(e) => setWheelForm({ ...wheelForm, sortOrder: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={wheelForm.inStock} onChange={(e) => setWheelForm({ ...wheelForm, inStock: e.target.checked })} />
                In stock
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input type="checkbox" checked={wheelForm.isDefault} onChange={(e) => setWheelForm({ ...wheelForm, isDefault: e.target.checked })} />
                Default wheel
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input type="checkbox" checked={wheelForm.global} onChange={(e) => setWheelForm({ ...wheelForm, global: e.target.checked })} />
              Available for all vehicles
            </label>
          </div>
          <ModalActions>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={saveWheel} disabled={saving || !wheelForm.name || !wheelForm.size}>{saving ? 'Saving...' : 'Save'}</Button>
          </ModalActions>
        </Modal>
      )}

      <MediaBrowser
        isOpen={showMediaBrowser}
        onClose={() => setShowMediaBrowser(false)}
        onSelect={(url) => {
          if (resource === 'colors') setColorForm((f) => ({ ...f, imageUrl: url }));
          else if (resource === 'interiors') setInteriorForm((f) => ({ ...f, imageUrl: url }));
          else setWheelForm((f) => ({ ...f, imageUrl: url }));
          setShowMediaBrowser(false);
        }}
        fileType="image"
        title={resource === 'colors' ? 'Select Color Image' : resource === 'interiors' ? 'Select Interior Image' : 'Select Wheel Image'}
      />
    </div>
  );
}
