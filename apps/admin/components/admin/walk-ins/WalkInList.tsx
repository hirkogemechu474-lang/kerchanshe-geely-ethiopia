'use client';

import { useEffect, useState } from 'react';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, Button, Modal, ModalActions } from '@/components/admin/ui';
import { Search, Trash2, UserPlus } from 'lucide-react';

interface WalkIn {
  id: string;
  customerName: string;
  phone: string;
  email: string | null;
  vehicleInterest: string | null;
  notes: string | null;
  registeredBy: { id: string; name: string; email: string };
  createdAt: string;
}

const inputClass = 'w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm';

export default function WalkInList() {
  const [items, setItems] = useState<WalkIn[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchItems = async (p: number, q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), pageSize: '20' });
      if (q) params.set('search', q);
      const res = await fetch(`/api/walk-ins?${params}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems(page, search);
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchItems(1, search);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await fetch(`/api/walk-ins/${deleteId}`, { method: 'DELETE' });
    setDeleteId(null);
    fetchItems(page, search);
  };

  return (
    <>
      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, or email..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg text-sm"
          />
        </div>
        <Button type="submit" size="sm">Search</Button>
      </form>

      {/* Table */}
      <TableCard>
        <THead>
          <Tr>
            <Th>Customer Name</Th>
            <Th>Phone</Th>
            <Th>Email</Th>
            <Th>Vehicle Interest</Th>
            <Th>Registered By</Th>
            <Th>Date</Th>
            <Th className="w-20"></Th>
          </Tr>
        </THead>
        <TBody>
          {loading ? (
            <EmptyTableRow colSpan={7} message="Loading..." />
          ) : items.length === 0 ? (
            <EmptyTableRow colSpan={7} message="No walk-in registrations yet." />
          ) : (
            items.map((item) => (
              <Tr key={item.id}>
                <Td className="font-medium">{item.customerName}</Td>
                <Td>{item.phone}</Td>
                <Td>{item.email || '—'}</Td>
                <Td>{item.vehicleInterest || '—'}</Td>
                <Td>{item.registeredBy.name}</Td>
                <Td>{new Date(item.createdAt).toLocaleDateString()}</Td>
                <Td>
                  <button
                    onClick={() => setDeleteId(item.id)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </Td>
              </Tr>
            ))
          )}
        </TBody>
      </TableCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Page {page} of {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <Modal title="Delete Walk-in Registration" onClose={() => setDeleteId(null)}>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this walk-in registration? This action cannot be undone.
          </p>
          <ModalActions>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete</Button>
          </ModalActions>
        </Modal>
      )}
    </>
  );
}
