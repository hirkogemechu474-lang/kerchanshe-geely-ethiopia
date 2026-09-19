'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, StatusBadge } from '@/components/admin/ui';

interface RoadsideRequest {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  currentLocation: string;
  city: string;
  vehicleModel: string;
  plateNumber: string;
  color: string;
  issueType: string;
  isVehicleSafe: boolean;
  hasMembership: boolean;
  status: string;
  assignedTo: string | null;
  createdAt: string;
}

const STATUS_OPTIONS = ['NEW', 'DISPATCHED', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'];

export default function RoadsideRequestsList({ requests }: { requests: RoadsideRequest[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const updateStatus = async (id: string, status: string) => {
    setBusyId(id);
    setError('');
    try {
      const res = await fetch(`/api/roadside-requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <TableCard>
      {error && <p className="px-4 pt-4 text-sm text-red-600">{error}</p>}
      <THead>
        <tr>
          <Th>Customer</Th>
          <Th>Vehicle</Th>
          <Th>Issue</Th>
          <Th>Location</Th>
          <Th>Safety</Th>
          <Th>Status</Th>
          <Th>Received</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </THead>
      <TBody>
        {requests.map((r) => (
          <Tr key={r.id}>
            <Td>
              <div className="font-medium text-gray-900">{r.firstName} {r.lastName}</div>
              <a href={`tel:${r.phone}`} className="text-xs text-geely-blue hover:underline">{r.phone}</a>
              {r.hasMembership && <span className="ml-2 text-xs text-green-700">Member</span>}
            </Td>
            <Td className="text-gray-900">{r.color} {r.vehicleModel} <span className="text-xs text-gray-500">({r.plateNumber})</span></Td>
            <Td className="text-gray-900 capitalize">{r.issueType.replace(/-/g, ' ')}</Td>
            <Td className="text-gray-500">
              <div>{r.currentLocation}</div>
              <div className="text-xs">{r.city}</div>
            </Td>
            <Td>
              {r.isVehicleSafe ? (
                <span className="text-xs text-green-700">Safe</span>
              ) : (
                <span className="text-xs font-semibold text-red-600">Unsafe — urgent</span>
              )}
            </Td>
            <Td><StatusBadge status={r.status} /></Td>
            <Td className="text-gray-500 text-xs">{new Date(r.createdAt).toLocaleString()}</Td>
            <Td className="text-right">
              <select
                value={r.status}
                onChange={(e) => updateStatus(r.id, e.target.value)}
                disabled={busyId === r.id}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </Td>
          </Tr>
        ))}
        {requests.length === 0 && <EmptyTableRow colSpan={8} message="No roadside assistance requests have been submitted yet." />}
      </TBody>
    </TableCard>
  );
}
