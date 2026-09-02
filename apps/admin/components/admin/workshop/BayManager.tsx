'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Power } from 'lucide-react';
import { Card, Button, Badge, type Tone } from '@/components/admin/ui';

interface Bay {
  id: string;
  name: string;
  bayType: string;
  status: string;
  isActive: boolean;
}

const BAY_TYPES = ['GENERAL', 'DIAGNOSTIC', 'ALIGNMENT', 'QUICK_SERVICE', 'PDI'];

const STATUS_TONE: Record<string, Tone> = {
  FREE: 'green',
  OCCUPIED: 'blue',
  OUT_OF_SERVICE: 'red',
};

export default function BayManager({ initialBays }: { initialBays: Bay[] }) {
  const router = useRouter();
  const [bays, setBays] = useState(initialBays);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', bayType: 'GENERAL' });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/admin/workshop/bays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create bay');
      setBays((prev) => [...prev, data.bay]);
      setForm({ name: '', bayType: 'GENERAL' });
      setShowForm(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleOutOfService = async (bay: Bay) => {
    const nextStatus = bay.status === 'OUT_OF_SERVICE' ? 'FREE' : 'OUT_OF_SERVICE';
    const res = await fetch(`/api/admin/workshop/bays/${bay.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      const data = await res.json();
      setBays((prev) => prev.map((b) => (b.id === bay.id ? data.bay : b)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm((v) => !v)}>
          <Plus className="w-4 h-4" />
          Add Bay
        </Button>
      </div>

      {showForm && (
        <Card padding="sm">
          <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bay name</label>
              <input
                required
                placeholder="Bay 1"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bay type</label>
              <select
                value={form.bayType}
                onChange={(e) => setForm({ ...form, bayType: e.target.value })}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                {BAY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <Button disabled={saving} type="submit">
              {saving ? 'Saving...' : 'Save Bay'}
            </Button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {bays.map((bay) => (
          <Card key={bay.id} padding="sm" className={!bay.isActive ? 'opacity-50' : ''}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">{bay.name}</span>
              <button onClick={() => toggleOutOfService(bay)} title="Toggle out-of-service" className="text-gray-400 hover:text-gray-700">
                <Power className="w-4 h-4" />
              </button>
            </div>
            <div className="text-xs text-gray-500 mb-2">{bay.bayType.replace('_', ' ')}</div>
            <Badge tone={STATUS_TONE[bay.status]}>{bay.status.replace('_', ' ')}</Badge>
          </Card>
        ))}
        {bays.length === 0 && <div className="text-gray-400 col-span-full py-8 text-center">No bays configured yet.</div>}
      </div>
    </div>
  );
}
