'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, StatTile } from '@/components/admin/ui';
import { Users, Car, ShieldCheck, Search } from 'lucide-react';

interface CustomerRow {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  vehicles: { id: string; plateNo: string; vin: string | null; model: string | null; warrantyEndDate: string | null }[];
}

export default function CustomersList() {
  const [customers, setCustomers] = useState<CustomerRow[] | null>(null);
  const [stats, setStats] = useState({ totalCustomers: 0, totalVehicles: 0, underWarranty: 0 });
  const [query, setQuery] = useState('');

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

      <div className="relative max-w-sm">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, plate, or VIN…"
          className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-800 rounded-lg pl-9 pr-3 py-2 text-sm"
        />
      </div>

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
