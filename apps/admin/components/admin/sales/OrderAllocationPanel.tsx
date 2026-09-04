'use client';

import { useEffect, useState } from 'react';
import { Card, Button } from '@/components/admin/ui';

type Vehicle = { id: string; name: string; model: string; stock: number };
type Allocation = { vehicleId: string; vin: string | null; status: string; vehicle?: Vehicle } | null;

export default function OrderAllocationPanel({ orderId, allocation, canManage }: { orderId: string; allocation: Allocation; canManage: boolean }) {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState(allocation?.vehicleId || '');
  const [vin, setVin] = useState(allocation?.vin || '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    fetch('/api/vehicles?limit=200&status=published')
      .then((response) => response.json())
      .then((data) => setVehicles(Array.isArray(data?.vehicles) ? data.vehicles : []))
      .catch(() => setVehicles([]));
  }, []);

  const reserve = async () => {
    if (!vehicleId) return;
    setBusy(true); setNotice('');
    try {
      const response = await fetch(`/api/orders/${orderId}/allocation`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ vehicleId, vin }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Allocation failed');
      setNotice('Vehicle reserved for this order.');
      window.location.reload();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Allocation failed'); }
    finally { setBusy(false); }
  };

  const release = async () => {
    setBusy(true); setNotice('');
    try {
      const response = await fetch(`/api/orders/${orderId}/allocation`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Release failed');
      setNotice('Vehicle allocation released.');
      window.location.reload();
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Release failed'); }
    finally { setBusy(false); }
  };

  return <Card className="space-y-4">
    <div><h2 className="font-semibold text-gray-900">Vehicle Allocation</h2><p className="text-sm text-gray-500 mt-1">Reserve a stock unit now. ERP reference fields are ready for a future connector.</p></div>
    {allocation && allocation.status !== 'RELEASED' ? <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">Reserved: {allocation.vehicle?.name || allocation.vehicleId}{allocation.vin ? ` · VIN ${allocation.vin}` : ''} <span className="font-semibold">({allocation.status})</span></div> : null}
    {canManage && <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
      <label className="text-sm text-gray-700">Vehicle<select value={vehicleId} onChange={(event) => setVehicleId(event.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"><option value="">Select vehicle</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.name} · {vehicle.stock} available</option>)}</select></label>
      <label className="text-sm text-gray-700">VIN (optional)<input value={vin} onChange={(event) => setVin(event.target.value)} className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Vehicle identification number" /></label>
      <div className="flex gap-2"><Button onClick={reserve} disabled={busy || !vehicleId}>Reserve</Button>{allocation && allocation.status !== 'RELEASED' && <Button variant="secondary" onClick={release} disabled={busy}>Release</Button>}</div>
    </div>}
    {notice && <p className="text-sm text-gray-600">{notice}</p>}
  </Card>;
}
