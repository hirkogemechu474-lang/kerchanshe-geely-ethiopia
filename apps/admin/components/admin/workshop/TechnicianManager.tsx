'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Wrench, Phone, Power } from 'lucide-react';
import { Card, Button, Badge, TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow } from '@/components/admin/ui';

interface Technician {
  id: string;
  name: string;
  phone: string | null;
  skillLevel: string;
  certificationLevel: string | null;
  isActive: boolean;
  jobCardCount: number;
}

const SKILL_LEVELS = ['JUNIOR', 'INTERMEDIATE', 'SENIOR', 'MASTER'];

export default function TechnicianManager({ initialTechnicians }: { initialTechnicians: Technician[] }) {
  const router = useRouter();
  const [technicians, setTechnicians] = useState(initialTechnicians);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', phone: '', skillLevel: 'JUNIOR', certificationLevel: '' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/workshop/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create technician');
      setTechnicians((prev) => [...prev, { ...data.technician, jobCardCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)));
      setForm({ name: '', phone: '', skillLevel: 'JUNIOR', certificationLevel: '' });
      setShowForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (technician: Technician) => {
    const res = await fetch(`/api/admin/workshop/technicians/${technician.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !technician.isActive }),
    });
    if (res.ok) {
      const data = await res.json();
      setTechnicians((prev) => prev.map((t) => (t.id === technician.id ? { ...t, isActive: data.technician.isActive } : t)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4" />
          Add Technician
        </Button>
      </div>

      {showForm && (
        <Card padding="sm">
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={form.skillLevel}
              onChange={(e) => setForm({ ...form, skillLevel: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {SKILL_LEVELS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <input
              placeholder="Certification (optional)"
              value={form.certificationLevel}
              onChange={(e) => setForm({ ...form, certificationLevel: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <div className="md:col-span-4 flex items-center gap-3">
              <Button disabled={saving} type="submit">
                {saving ? 'Saving...' : 'Save Technician'}
              </Button>
              {error && <span className="text-sm text-red-600">{error}</span>}
            </div>
          </form>
        </Card>
      )}

      <TableCard>
        <THead>
          <tr>
            <Th>Name</Th>
            <Th>Skill Level</Th>
            <Th>Certification</Th>
            <Th>Open Job Cards</Th>
            <Th>Status</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </THead>
        <TBody>
          {technicians.map((t) => (
            <Tr key={t.id} className={!t.isActive ? 'opacity-50' : ''}>
              <Td className="font-medium text-gray-900">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-gray-400" />
                  {t.name}
                  {t.phone && (
                    <span className="text-gray-400 text-xs flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {t.phone}
                    </span>
                  )}
                </div>
              </Td>
              <Td>{t.skillLevel}</Td>
              <Td className="text-gray-500">{t.certificationLevel || '—'}</Td>
              <Td>{t.jobCardCount}</Td>
              <Td>
                <Badge tone={t.isActive ? 'green' : 'gray'}>{t.isActive ? 'Active' : 'Inactive'}</Badge>
              </Td>
              <Td className="text-right">
                <button onClick={() => toggleActive(t)} className="text-gray-400 hover:text-gray-700" title={t.isActive ? 'Deactivate' : 'Reactivate'}>
                  <Power className="w-4 h-4" />
                </button>
              </Td>
            </Tr>
          ))}
          {technicians.length === 0 && <EmptyTableRow colSpan={6} message="No technicians yet." />}
        </TBody>
      </TableCard>
    </div>
  );
}
