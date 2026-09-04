'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, StatTile, Pagination } from '@/components/admin/ui';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/services/sales/orderStateMachine';
import { ClipboardList, Truck, Hourglass, CheckCircle2, Search, X } from 'lucide-react';

const PAGE_SIZE = 25;

interface OrderRow {
  id: string;
  orderNo: string;
  customerName: string;
  customerPhone: string;
  vehicleModel: string;
  totalPrice: number | null;
  financingStatus: string;
  status: string;
  orderDate: string;
  pdiComplete: boolean;
  pdiProgress: string;
}

interface Stats {
  total: number;
  booked: number;
  readyForDelivery: number;
  delivered: number;
}

export default function OrdersList() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [stats, setStats] = useState<Stats>({ total: 0, booked: 0, readyForDelivery: 0, delivered: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const load = useCallback(async (p: number, status: string | null, q: string) => {
    const params = new URLSearchParams({ page: String(p) });
    if (status) params.set('status', status);
    if (q) params.set('search', q);
    const res = await fetch(`/api/orders?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
      setStats(data.stats);
      setTotal(data.total);
    }
  }, []);

  useEffect(() => {
    load(page, statusFilter, search);
  }, [page, statusFilter, search, load]);

  // Debounce the search box so every keystroke doesn't fire a request.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const selectStatus = (status: string | null) => {
    setPage(1);
    setStatusFilter((current) => (current === status ? null : status));
  };

  if (!orders) return <div className="text-gray-400 text-sm">Loading orders…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total Orders" value={stats.total} icon={ClipboardList} onClick={() => selectStatus(null)} active={statusFilter === null} />
        <StatTile label="Booked" value={stats.booked} icon={Hourglass} onClick={() => selectStatus('BOOKED')} active={statusFilter === 'BOOKED'} />
        <StatTile label="Ready for Delivery" value={stats.readyForDelivery} icon={Truck} tone={statusFilter !== 'READY_FOR_DELIVERY' && stats.readyForDelivery > 0 ? 'highlight' : 'default'} onClick={() => selectStatus('READY_FOR_DELIVERY')} active={statusFilter === 'READY_FOR_DELIVERY'} />
        <StatTile label="Delivered" value={stats.delivered} icon={CheckCircle2} onClick={() => selectStatus('DELIVERED')} active={statusFilter === 'DELIVERED'} />
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search order #, customer, phone, or vehicle…"
          className="w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 pl-9 pr-9 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-geely-blue/40"
        />
        {searchInput && (
          <button type="button" onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" aria-label="Clear search">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <TableCard>
        <THead>
          <tr>
            <Th>Order#</Th>
            <Th>Customer</Th>
            <Th>Vehicle</Th>
            <Th>Total</Th>
            <Th>Financing</Th>
            <Th>PDI</Th>
            <Th>Status</Th>
            <Th>Date</Th>
          </tr>
        </THead>
        <TBody>
          {orders.map((o) => (
            <Tr key={o.id}>
              <Td>
                <Link href={`/admin/orders/${o.id}`} className="text-geely-blue font-medium hover:underline">
                  {o.orderNo}
                </Link>
              </Td>
              <Td>
                {o.customerName}
                <div className="text-xs text-gray-400">{o.customerPhone}</div>
              </Td>
              <Td>{o.vehicleModel}</Td>
              <Td className="text-gray-500">{o.totalPrice != null ? `ETB ${o.totalPrice.toLocaleString('en-US')}` : '—'}</Td>
              <Td className="text-gray-500">{o.financingStatus.replace(/_/g, ' ')}</Td>
              <Td>
                <span className={o.pdiComplete ? 'text-green-600 font-medium' : 'text-gray-500'}>{o.pdiProgress}</span>
              </Td>
              <Td>
                <span className={`px-2 py-0.5 rounded-full text-xs ${ORDER_STATUS_COLORS[o.status as keyof typeof ORDER_STATUS_COLORS]}`}>
                  {ORDER_STATUS_LABELS[o.status as keyof typeof ORDER_STATUS_LABELS]}
                </span>
              </Td>
              <Td className="text-gray-500">{new Date(o.orderDate).toLocaleDateString()}</Td>
            </Tr>
          ))}
          {orders.length === 0 && (
            <EmptyTableRow
              colSpan={8}
              message={search || statusFilter ? 'No orders match your search/filter.' : 'No orders yet. Convert a quotation to create one.'}
            />
          )}
        </TBody>
      </TableCard>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
