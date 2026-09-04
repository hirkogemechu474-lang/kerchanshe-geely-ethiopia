'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, Wrench, Search, Car, Clock, ClipboardCheck } from 'lucide-react';
import {
  Card, StatTile, Button, Badge, statusTone, TableCard, THead, TBody, Tr, Th, Td,
  EmptyTableRow,
} from '@/components/admin/ui';

interface LookupVehicle {
  id: string;
  vin: string | null;
  plateNo: string;
  make: string | null;
  model: string | null;
  year: number | null;
  color: string | null;
  mileageLastKnown: number | null;
  lastServiceDate: string | null;
}

interface LookupCustomer {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
}

interface LookupResponse {
  vehicle: LookupVehicle | null;
  customer: LookupCustomer | null;
  recentBookings: any[];
  openJobCards: any[];
}

interface QueueBooking {
  id: string;
  reference: string | null;
  customerName: string;
  customerPhone: string;
  vehicleInfo: string;
  serviceType: string;
  status: string;
  date: string;
  notes: string | null;
  queuePosition: number;
}

type Tab = 'checkin' | 'queue';

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function fmtMileage(value: number | null | undefined) {
  if (value === null || value === undefined) return '—';
  return `${value.toLocaleString('en-US')} km`;
}

export default function ServiceCheckInList() {
  const [tab, setTab] = useState<Tab>('checkin');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [lookupKey, setLookupKey] = useState('');
  const [lookupMode, setLookupMode] = useState<'vin' | 'plateNo' | 'phone'>('vin');
  const [lookup, setLookup] = useState<LookupResponse | null>(null);
  const [lookedUp, setLookedUp] = useState(false);

  const [form, setForm] = useState({
    serviceType: 'general-service',
    complaintText: '',
    estimatedArrival: '',
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    vehicleMake: '',
    vehicleModel: '',
    vehicleYear: '',
    vehicleColor: '',
  });

  const [queue, setQueue] = useState<QueueBooking[]>([]);
  const [queueLoading, setQueueLoading] = useState(false);

  const loadQueue = useCallback(async () => {
    setQueueLoading(true);
    try {
      const res = await fetch('/api/service-check-in/queue');
      if (res.ok) {
        const data = await res.json();
        setQueue(data.queue ?? []);
      }
    } catch {
      // Ignore — show empty queue on failure.
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab === 'queue') loadQueue();
  }, [tab, loadQueue]);

  const doLookup = async () => {
    if (!lookupKey) { setError('Enter a value to look up.'); return; }
    setLoading(true);
    setError('');
    setMessage('');
    setLookedUp(false);
    try {
      const res = await fetch(`/api/service-check-in/lookup?${lookupMode}=${encodeURIComponent(lookupKey)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setLookup(null);
        setError(err.error || 'No matching vehicle or customer found.');
        return;
      }
      const data: LookupResponse = await res.json();
      setLookup(data);
      setLookedUp(true);
      // Pre-fill the check-in form from the lookup result.
      setForm((prev) => ({
        ...prev,
        customerName: data.customer?.fullName ?? prev.customerName,
        customerPhone: data.customer?.phone ?? prev.customerPhone,
        customerEmail: data.customer?.email ?? prev.customerEmail,
        vehicleMake: data.vehicle?.make ?? prev.vehicleMake,
        vehicleModel: data.vehicle?.model ?? prev.vehicleModel,
        vehicleYear: data.vehicle?.year ? String(data.vehicle.year) : prev.vehicleYear,
        vehicleColor: data.vehicle?.color ?? prev.vehicleColor,
      }));
    } catch {
      setError('Lookup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitCheckIn = async () => {
    if (!form.customerName || !form.customerPhone) {
      setError('Customer name and phone are required.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/service-check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vin: lookup?.vehicle?.vin ?? undefined,
          plateNo: lookup?.vehicle?.plateNo ?? undefined,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail || undefined,
          vehicleMake: form.vehicleMake,
          vehicleModel: form.vehicleModel,
          vehicleYear: form.vehicleYear,
          vehicleColor: form.vehicleColor,
          serviceType: form.serviceType,
          complaintText: form.complaintText,
          estimatedArrival: form.estimatedArrival || undefined,
        }),
      });
      if (res.status === 409) {
        const err = await res.json();
        setError(`Vehicle already checked in (${err.jobCardNo ?? 'open job card'}).`);
        return;
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error || 'Failed to check in vehicle.');
        return;
      }
      const data = await res.json();
      setMessage(data.message || 'Vehicle checked in successfully.');
      setLookup(null);
      setLookedUp(false);
      setForm((prev) => ({ ...prev, complaintText: '', estimatedArrival: '' }));
    } catch {
      setError('Check-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  const inputCls =
    'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <StatTile label="Check In" value="Form" icon={Wrench} active={tab === 'checkin'} onClick={() => setTab('checkin')} />
        <StatTile label="Queue" value={queue.length} icon={Clock} active={tab === 'queue'} onClick={() => { setTab('queue'); loadQueue(); }} />
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {message && <p className="text-sm text-green-600 dark:text-green-400">{message}</p>}

      {tab === 'checkin' && (
        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-geely-blue" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Look up Customer Vehicle</h2>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Search by</label>
                <select
                  value={lookupMode}
                  onChange={(e) => setLookupMode(e.target.value as 'vin' | 'plateNo' | 'phone')}
                  className={inputCls + ' w-auto'}
                >
                  <option value="vin">VIN</option>
                  <option value="plateNo">Plate No.</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div className="flex-1 min-w-48">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Value</label>
                <input
                  value={lookupKey}
                  onChange={(e) => setLookupKey(e.target.value)}
                  placeholder={lookupMode === 'vin' ? '17-character VIN' : lookupMode === 'plateNo' ? 'e.g. AA 12345' : 'e.g. +251911000000'}
                  className={inputCls}
                />
              </div>
              <Button onClick={doLookup} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Look Up
              </Button>
            </div>

            {lookedUp && lookup?.vehicle && (
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 text-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-geely-blue" />
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {[lookup.vehicle.make, lookup.vehicle.model, lookup.vehicle.year ? String(lookup.vehicle.year) : ''].filter(Boolean).join(' ') || 'Vehicle'}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-gray-600 dark:text-gray-300">
                  <div><span className="text-gray-400">VIN</span><br />{lookup.vehicle.vin || '—'}</div>
                  <div><span className="text-gray-400">Plate</span><br />{lookup.vehicle.plateNo || '—'}</div>
                  <div><span className="text-gray-400">Color</span><br />{lookup.vehicle.color || '—'}</div>
                  <div><span className="text-gray-400">Mileage</span><br />{fmtMileage(lookup.vehicle.mileageLastKnown)}</div>
                </div>
                {lookup.vehicle.lastServiceDate && (
                  <p className="text-xs text-gray-400 mt-2">Last service: {fmtDate(lookup.vehicle.lastServiceDate)}</p>
                )}
              </div>
            )}

            {lookedUp && lookup?.customer && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Customer: <strong>{lookup.customer.fullName}</strong> · {lookup.customer.phone}{lookup.customer.email ? ` · ${lookup.customer.email}` : ''}
              </p>
            )}

            {(lookup?.openJobCards?.length ?? 0) > 0 && (
              <p className="text-sm text-orange-600 dark:text-orange-400">
                Open job card(s) already on file for this vehicle — confirm before double-checking in.
              </p>
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-geely-blue" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Check In Vehicle</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Customer Name *</label>
                <input className={inputCls} {...field('customerName')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Customer Phone *</label>
                <input className={inputCls} {...field('customerPhone')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Email</label>
                <input className={inputCls} {...field('customerEmail')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Service Type</label>
                <select className={inputCls} {...field('serviceType')}>
                  <option value="general-service">General Service</option>
                  <option value="repair">Repair</option>
                  <option value="recall">Recall</option>
                  <option value="inspection">Inspection</option>
                  <option value="diagnostic">Diagnostic</option>
                  <option value="pdi">PDI</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Complaint / Notes</label>
                <textarea className={inputCls} rows={2} {...field('complaintText')} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Estimated Arrival (optional)</label>
                <input type="datetime-local" className={inputCls} {...field('estimatedArrival')} />
              </div>
            </div>
            <Button onClick={submitCheckIn} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />} Check In Vehicle
            </Button>
          </Card>
        </div>
      )}

      {tab === 'queue' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-geely-blue" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Check-In Queue</h2>
            </div>
            <Button variant="secondary" size="sm" onClick={loadQueue} disabled={queueLoading}>
              <RefreshCw className={`w-4 h-4 ${queueLoading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
          <TableCard>
            <THead>
              <Tr>
                <Th>Pos</Th>
                <Th>Ref</Th>
                <Th>Customer</Th>
                <Th>Vehicle</Th>
                <Th>Service</Th>
                <Th>Status</Th>
                <Th>Checked in</Th>
              </Tr>
            </THead>
            <TBody>
              {queueLoading ? (
                <EmptyTableRow colSpan={7} message="Loading…" />
              ) : queue.length === 0 ? (
                <EmptyTableRow colSpan={7} message="No vehicles currently checked in." />
              ) : (
                queue.map((b) => (
                  <Tr key={b.id}>
                    <Td className="font-semibold">#{b.queuePosition}</Td>
                    <Td className="font-mono text-xs">{b.reference || '—'}</Td>
                    <Td>{b.customerName}</Td>
                    <Td>{b.vehicleInfo}</Td>
                    <Td>{b.serviceType.replace(/_/g, ' ').toUpperCase()}</Td>
                    <Td><Badge tone={statusTone(b.status)}>{b.status.toUpperCase()}</Badge></Td>
                    <Td>{fmtDate(b.date)}</Td>
                  </Tr>
                ))
              )}
            </TBody>
          </TableCard>
        </Card>
      )}
    </div>
  );
}
