'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Edit, Check, X, Phone, Mail, Calendar, Clock, User, Car, MapPin, Send } from 'lucide-react';
import { Card, Badge, EmptyState, Pagination, type Tone } from '@/components/admin/ui';

const PAGE_SIZE = 10;

const STATUS_TONE: Record<TestDrive['status'], Tone> = {
  pending: 'orange',
  confirmed: 'green',
  completed: 'blue',
  cancelled: 'red',
  no_show: 'gray',
};

const STATUS_LABEL: Record<TestDrive['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
  no_show: 'No Show',
};

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
  const [page, setPage] = useState(1);
  useEffect(() => {
    setItems(testDrives);
    setPage(1);
  }, [testDrives]);

  const pageItems = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page]
  );

  const updateStatus = async (id: string, status: TestDrive['status']) => {
    // When confirming a pending test drive, use the approve endpoint to send email
    if (status === 'confirmed') {
      const confirmedItem = items.find(item => item.id === id);
      if (confirmedItem && confirmedItem.status === 'pending') {
        const response = await fetch(`/api/test-drives/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
        if (response.ok) {
          const data = await response.json();
          setItems((current) => current.map((item) => item.id === id ? { ...item, status: 'confirmed' } : item));
          if (data.emailSent) {
            alert('Test drive approved! Confirmation email sent to customer.');
          } else {
            alert('Test drive approved, but email failed to send.');
          }
          return;
        }
        const data = await response.json().catch(() => null);
        alert(data?.error || 'Failed to approve test drive');
        return;
      }
    }

    const response = await fetch(`/api/test-drives/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    if (response.ok) {
      setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
      return;
    }
    const data = await response.json().catch(() => null);
    alert(data?.error || 'Failed to update status');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (items.length === 0) {
    return <EmptyState icon={User} title="No customer test-drive bookings yet" />;
  }

  return (
    <div className="space-y-4">
      {pageItems.map((testDrive) => (
        <Card key={testDrive.id} interactive className="space-y-4">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-geely-blue dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{testDrive.customerName}</h3>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 mt-1 text-sm text-gray-500 dark:text-gray-400">
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
            <Badge tone={STATUS_TONE[testDrive.status]}>{STATUS_LABEL[testDrive.status]}</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Car className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 dark:text-gray-100 font-medium truncate">{testDrive.vehicleModel}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 dark:text-gray-100">{formatDate(testDrive.date)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 dark:text-gray-100">{testDrive.time}</span>
            </div>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-900 dark:text-gray-100 truncate">{testDrive.location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 flex-wrap pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>Assigned to: <span className="font-medium text-gray-900 dark:text-gray-100">{testDrive.assignedTo}</span></span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {testDrive.status === 'pending' && (
                <>
                  <button onClick={() => updateStatus(testDrive.id, 'confirmed')} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                    <Send className="w-4 h-4" />
                    Approve & Email
                  </button>
                  <button onClick={() => updateStatus(testDrive.id, 'cancelled')} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </>
              )}
              {testDrive.status === 'confirmed' && (
                <button onClick={() => updateStatus(testDrive.id, 'completed')} className="flex items-center gap-1 px-3 py-1.5 bg-geely-blue text-white rounded-lg hover:bg-navy transition-colors text-sm">
                  <Check className="w-4 h-4" />
                  Mark Complete
                </button>
              )}
              <Link
                href={`/admin/test-drives/${testDrive.id}`}
                className="p-2 text-geely-blue dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </Link>
              <Link
                href={`/admin/test-drives/${testDrive.id}/edit`}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Card>
      ))}

      <Pagination page={page} pageSize={PAGE_SIZE} total={items.length} onPageChange={setPage} />
    </div>
  );
}
