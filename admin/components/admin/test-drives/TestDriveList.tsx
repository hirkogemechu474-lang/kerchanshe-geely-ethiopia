'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Eye, Edit, Check, X, Phone, Mail, Calendar, Clock, User, Car, MapPin } from 'lucide-react';
import { Card, Badge, Button, LinkButton, EmptyState, type Tone } from '@/components/admin/ui';

export interface TestDrive {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  vehicleModel: string;
  date: string;
  time: string;
  location: string;
  assignedTo: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  createdAt: string;
  notes?: string;
}

export default function TestDriveList({ testDrives }: { testDrives: TestDrive[] }) {
  const [items, setItems] = useState<TestDrive[]>([]);
  useEffect(() => {
    setItems(testDrives);
  }, [testDrives]);
  const updateStatus = async (id: string, status: TestDrive['status']) => {
    const response = await fetch(`/api/admin/test-drives/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (response.ok) setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
  };

  const getStatusBadge = (status: TestDrive['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">Pending</span>;
      case 'confirmed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Confirmed</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Completed</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Cancelled</span>;
      case 'no_show':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">No Show</span>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-4">
      {items.length === 0 && <div className="bg-white rounded-lg border border-gray-200 p-10 text-center text-gray-500">No customer test-drive bookings yet.</div>}
      {items.map((testDrive) => (
        <div
          key={testDrive.id}
          className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{testDrive.customerName}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {testDrive.customerEmail}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    {testDrive.customerPhone}
                  </span>
                </div>
              </div>
            </div>
            {getStatusBadge(testDrive.status)}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 text-sm">
              <Car className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium">{testDrive.vehicleModel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{formatDate(testDrive.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{testDrive.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{testDrive.location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <User className="w-4 h-4" />
              <span>Assigned to: <span className="font-medium text-gray-900">{testDrive.assignedTo}</span></span>
            </div>
            <div className="flex items-center gap-2">
              {testDrive.status === 'pending' && (
                <>
                  <button onClick={() => updateStatus(testDrive.id, 'confirmed')} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                    <Check className="w-4 h-4" />
                    Confirm
                  </button>
                  <button onClick={() => updateStatus(testDrive.id, 'cancelled')} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              {testDrive.status === 'confirmed' && (
                <button onClick={() => updateStatus(testDrive.id, 'completed')} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                  <Check className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
              <Link
                href={`/admin/test-drives/${testDrive.id}`}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/test-drives/${testDrive.id}/edit`}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="bg-white rounded-lg border border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Showing <span className="font-medium">{items.length}</span> customer booking{items.length === 1 ? '' : 's'}
        </div>
        <div className="flex gap-2">
        </div>
      </div>
    </div>
  );
}
