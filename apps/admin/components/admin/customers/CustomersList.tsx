'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, StatTile, Button, Modal, ModalActions } from '@/components/admin/ui';
import { Users, Car, ShieldCheck, Search, Plus } from 'lucide-react';

interface CustomerRow {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  vehicles: { id: string; plateNo: string; vin: string | null; model: string | null; warrantyEndDate: string | null }[];
}

const inputClass = 'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm';

function AddCustomerModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', address: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          email: form.email || null,
          address: form.address || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save customer');
      onCreated(data.customer.id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add Customer" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          For a walk-in with no account — record at least their name and phone number.
        </p>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Full name *</label>
          <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Phone *</label>
          <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email (optional)</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Address (optional)</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputClass} />
        </div>
        <ModalActions>
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Customer'}</Button>
        </ModalActions>
      </form>
    </Modal>
  );
}

export default function CustomersList({ canAdd }: { canAdd: boolean }) {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[] | null>(null);
  const [stats, setStats] = useState({ totalCustomers: 0, totalVehicles: 0, underWarranty: 0 });
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async (q: string) => {
    const res = await fetch(`/api/customers${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    if (res.ok) {
      const data = await res.json();
      const customersList = data.items || data.customers || [];
      setCustomers(customersList);
      setStats({
        totalCustomers: data.total ?? customersList.length,
        totalVehicles: customersList.reduce((sum: number, c: any) => sum + (c.vehicles?.length || 0), 0),
        underWarranty: customersList.reduce((sum: number, c: any) => sum + (c.vehicles?.filter((v: any) => v.warrantyEndDate && new Date(v.warrantyEndDate) >= new Date()).length || 0), 0),
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(query), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [query, load]);

  if (!customers) return <div className="text-gray-400 text-sm">Loading customers…</div>;

  const isWarrantyActive = (date: string | null) => date !== null && new Date(date) >= new Date();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatTile label="Customers" value={stats.totalCustomers} icon={Users} />
        <StatTile label="Vehicles on File" value={stats.totalVehicles} icon={Car} />
        <StatTile label="Under Warranty" value={stats.underWarranty} icon={ShieldCheck} tone={stats.underWarranty > 0 ? 'highlight' : 'default'} />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative max-w-sm flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, plate, or VIN…"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm"
          />
        </div>
        {canAdd && (
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="w-4 h-4" /> Add Customer
          </Button>
        )}
      </div>

      {showAdd && (
        <AddCustomerModal
          onClose={() => setShowAdd(false)}
          onCreated={(id) => {
            setShowAdd(false);
            router.push(`/admin/customers/${id}`);
          }}
        />
      )}

      <TableCard>
        <THead>
          <tr>
            <Th>Customer</Th>
            <Th>Phone</Th>
            <Th>Vehicles</Th>
          </tr>
        </THead>
        <TBody>
          {customers.map((c) => (
            <Tr key={c.id}>
              <Td>
                <Link href={`/admin/customers/${c.id}`} className="text-geely-blue dark:text-blue-400 font-medium hover:underline">
                  {c.fullName}
                </Link>
                {c.email && <div className="text-xs text-gray-400">{c.email}</div>}
              </Td>
              <Td>{c.phone}</Td>
              <Td>
                {c.vehicles.length === 0 ? (
                  <span className="text-gray-400">No vehicle on file</span>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {c.vehicles.map((v) => (
                      <span
                        key={v.id}
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          isWarrantyActive(v.warrantyEndDate)
                            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                            : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                        title={v.model ?? undefined}
                      >
                        {v.plateNo}
                      </span>
                    ))}
                  </div>
                )}
              </Td>
            </Tr>
          ))}
          {customers.length === 0 && <EmptyTableRow colSpan={3} message="No customers match that search." />}
        </TBody>
      </TableCard>
    </div>
  );
}
