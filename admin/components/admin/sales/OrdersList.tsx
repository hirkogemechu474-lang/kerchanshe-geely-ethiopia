'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, StatTile, Pagination } from '@/components/admin/ui';
import { ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '@/lib/sales/orderStateMachine';
import { ClipboardList, Truck, Hourglass, CheckCircle2 } from 'lucide-react';

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

  const load = useCallback(async (p: number) => {
    const res = await fetch(`/api/admin/orders?page=${p}`);
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders);
      setStats(data.stats);
      setTotal(data.total);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

  if (!orders) return <div className="text-gray-400 text-sm">Loading orders…</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Total Orders" value={stats.total} icon={ClipboardList} />
        <StatTile label="Booked" value={stats.booked} icon={Hourglass} />
        <StatTile label="Ready for Delivery" value={stats.readyForDelivery} icon={Truck} tone={stats.readyForDelivery > 0 ? 'highlight' : 'default'} />
        <StatTile label="Delivered" value={stats.delivered} icon={CheckCircle2} />
      </div>

      <TableCard>
        <THead>
          <tr>
            <Th>Order#</Th>
            <Th>Customer</Th>
            <Th>Vehicle</Th>
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
              <Td className="text-gray-500">{o.financingStatus.replace('_', ' ')}</Td>
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
          {orders.length === 0 && <EmptyTableRow colSpan={7} message="No orders yet. Convert a quotation to create one." />}
        </TBody>
      </TableCard>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
    </div>
  );
}
