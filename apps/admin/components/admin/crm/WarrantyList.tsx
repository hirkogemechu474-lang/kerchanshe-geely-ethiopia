'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, ShieldCheck, Wrench, Mail, Plus } from 'lucide-react';
import {
  Card, StatTile, Button, Badge, statusTone, TableCard, THead, TBody, Tr, Th, Td,
  EmptyTableRow, Pagination, Modal, ModalActions,
} from '@/components/admin/ui';

interface Warranty {
  id: string;
  orderId: string | null;
  orderNo?: string;
  vehicleModel: string;
  vin?: string | null;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string | null;
  purchaseDate: string | null;
  warrantyStartDate: string | null;
  warrantyEndDate: string | null;
  warrantyYears: number | null;
  warrantyKm: number | null;
  currentKm: number | null;
  status: string;
  nextServiceDate: string | null;
  nextServiceKm: number | null;
  lastServiceDate?: string | null;
}

interface ListResponse {
  warranties: Warranty[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function fmtDate(value: string | null | undefined) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString();
}

export default function WarrantyList() {
  const [tab, setTab] = useState<'all' | 'upcoming'>('all');
  const [data, setData] = useState<ListResponse | null>(null);
  const [upcoming, setUpcoming] = useState<Warranty[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);
  const [showRegister, setShowRegister] = useState(false);
  const [showService, setShowService] = useState<Warranty | null>(null);
  const [orderId, setOrderId] = useState('');
  const [serviceForm, setServiceForm] = useState({ serviceDate: '', serviceType: '', kmAtService: '', cost: '', performedBy: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    if (tab === 'all') {
      const res = await fetch(`/api/warranty?page=${page}&pageSize=20`);
      if (res.ok) setData(await res.json());
    } else {
      const res = await fetch(`/api/warranty/upcoming-services?days=${days}`);
      if (res.ok) setUpcoming(await res.json());
    }
    setLoading(false);
  }, [tab, page, days]);

  useEffect(() => { load(); }, [load]);

  const registerWarranty = async () => {
    setSubmitting(true);
    setMessage('');
    const res = await fetch(`/api/warranty/${orderId}/register`, { method: 'POST' });
    setSubmitting(false);
    if (res.ok) {
      setMessage('Warranty registered.');
      setShowRegister(false);
      setOrderId('');
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Failed to register warranty.');
    }
  };

  const addService = async () => {
    if (!showService) return;
    setSubmitting(true);
    setMessage('');
    const res = await fetch(`/api/warranty/${showService.id}/service`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceDate: serviceForm.serviceDate,
        serviceType: serviceForm.serviceType,
        kmAtService: serviceForm.kmAtService ? Number(serviceForm.kmAtService) : undefined,
        cost: serviceForm.cost ? Number(serviceForm.cost) : undefined,
        performedBy: serviceForm.performedBy || undefined,
        description: serviceForm.description || undefined,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      setMessage('Service record added.');
      setShowService(null);
      setServiceForm({ serviceDate: '', serviceType: '', kmAtService: '', cost: '', performedBy: '', description: '' });
      load();
    } else {
      const err = await res.json().catch(() => ({}));
      setMessage(err.error || 'Failed to add service record.');
    }
  };

  const rows = tab === 'all' ? (data?.warranties ?? []) : upcoming;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        {(['all', 'upcoming'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              tab === t ? 'bg-geely-blue text-white' : 'text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600'
            }`}
          >
            {t === 'all' ? 'All Warranties' : 'Upcoming Services'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowRegister(true)}>
            <Plus className="w-4 h-4" /> Register
          </Button>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {tab === 'all' && data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="Total" value={data.total} icon={ShieldCheck} />
          <StatTile label="Active" value={data.warranties.filter((w) => w.status === 'ACTIVE').length} icon={ShieldCheck} />
          <StatTile label="Upcoming (30d)" value={data.warranties.filter((w) => w.nextServiceDate && new Date(w.nextServiceDate).getTime() < Date.now() + 30 * 86400000).length} icon={Mail} />
          <StatTile label="Registered" value={upcoming.length ? '—' : data.total} icon={Wrench} />
        </div>
      )}

      {tab === 'upcoming' && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-400">Days ahead</label>
          <input
            type="number"
            value={days}
            min={1}
            onChange={(e) => setDays(Number(e.target.value) || 30)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm w-24"
          />
        </div>
      )}

      <TableCard>
        <THead>
          <Tr>
            <Th>Customer</Th>
            <Th>Vehicle</Th>
            <Th>Status</Th>
            <Th>Warranty Period</Th>
            <Th>Next Service</Th>
            <Th>Next Km</Th>
            <Th>Current Km</Th>
            <Th>Actions</Th>
          </Tr>
        </THead>
        <TBody>
          {loading ? (
            <EmptyTableRow colSpan={8} message="Loading…" />
          ) : rows.length === 0 ? (
            <EmptyTableRow colSpan={8} message={tab === 'all' ? 'No warranties registered yet.' : 'No upcoming services in this window.'} />
          ) : (
            rows.map((w) => (
              <Tr key={w.id}>
                <Td className="font-medium text-gray-900 dark:text-gray-100">{w.customerName}</Td>
                <Td>{w.vehicleModel || '—'}</Td>
                <Td><Badge tone={statusTone(w.status)}>{w.status}</Badge></Td>
                <Td>{fmtDate(w.warrantyStartDate)} → {fmtDate(w.warrantyEndDate)}</Td>
                <Td>{fmtDate(w.nextServiceDate)}</Td>
                <Td>{w.nextServiceKm != null ? `${w.nextServiceKm.toLocaleString()} km` : '—'}</Td>
                <Td>{w.currentKm != null ? `${w.currentKm.toLocaleString()} km` : '—'}</Td>
                <Td>
                  <Button variant="secondary" size="sm" onClick={() => setShowService(w)}>
                    <Wrench className="w-3.5 h-3.5" /> Add Service
                  </Button>
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </TableCard>

      {tab === 'all' && data && <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />}

      {showRegister && (
        <Modal title="Register Warranty" onClose={() => { setShowRegister(false); setMessage(''); }}>
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Order ID</label>
              <input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Order ID (e.g. cm…)"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">The order must be DELIVERED to register its warranty.</p>
            </div>
            {message && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}
            <ModalActions>
              <Button variant="secondary" size="sm" onClick={() => setShowRegister(false)}>Cancel</Button>
              <Button size="sm" onClick={registerWarranty} disabled={submitting || !orderId}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Register'}
              </Button>
            </ModalActions>
          </div>
        </Modal>
      )}

      {showService && (
        <Modal title={`Add Service Record — ${showService.customerName}`} onClose={() => { setShowService(null); setMessage(''); }}>
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Service Date</label>
                <input type="date" value={serviceForm.serviceDate} onChange={(e) => setServiceForm({ ...serviceForm, serviceDate: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Service Type</label>
                <input value={serviceForm.serviceType} onChange={(e) => setServiceForm({ ...serviceForm, serviceType: e.target.value })} placeholder="e.g. Scheduled maintenance" className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Km at Service</label>
                <input type="number" value={serviceForm.kmAtService} onChange={(e) => setServiceForm({ ...serviceForm, kmAtService: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
              <div>
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Cost (ETB)</label>
                <input type="number" value={serviceForm.cost} onChange={(e) => setServiceForm({ ...serviceForm, cost: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
              <div className="col-span-2">
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Performed By</label>
                <input value={serviceForm.performedBy} onChange={(e) => setServiceForm({ ...serviceForm, performedBy: e.target.value })} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
              <div className="col-span-2">
                <label className="block mb-1 text-gray-700 dark:text-gray-300">Description</label>
                <textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} rows={2} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2" />
              </div>
            </div>
            {message && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}
            <ModalActions>
              <Button variant="secondary" size="sm" onClick={() => setShowService(null)}>Cancel</Button>
              <Button size="sm" onClick={addService} disabled={submitting || !serviceForm.serviceDate || !serviceForm.serviceType}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </ModalActions>
          </div>
        </Modal>
      )}
    </div>
  );
}
