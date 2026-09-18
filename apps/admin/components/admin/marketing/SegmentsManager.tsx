'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, Edit, Send, Users, Loader2, Target } from 'lucide-react';
import { Card, Button, TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow, Modal, ModalActions } from '@/components/admin/ui';

const LOYALTY_TIERS = ['BRONZE', 'SILVER', 'GOLD', 'VIP'] as const;

interface SegmentCriteria {
  loyaltyTiers?: string[];
  vehicleModels?: string[];
  vehicleYearBefore?: number;
  noServiceInMonths?: number;
  addressContains?: string;
}

interface Segment {
  id: string;
  name: string;
  description: string | null;
  criteria: SegmentCriteria;
  createdAt: string;
}

function criteriaSummary(c: SegmentCriteria): string {
  const parts: string[] = [];
  if (c.loyaltyTiers?.length) parts.push(`Tier: ${c.loyaltyTiers.join(', ')}`);
  if (c.vehicleModels?.length) parts.push(`Owns: ${c.vehicleModels.join(', ')}`);
  if (c.vehicleYearBefore) parts.push(`Vehicle year ≤ ${c.vehicleYearBefore}`);
  if (c.noServiceInMonths) parts.push(`No service in ${c.noServiceInMonths}mo`);
  if (c.addressContains) parts.push(`Address has "${c.addressContains}"`);
  return parts.length ? parts.join(' · ') : 'Everyone';
}

export default function SegmentsManager() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [vehicleModels, setVehicleModels] = useState<string[]>([]);
  const [editing, setEditing] = useState<Segment | 'new' | null>(null);
  const [sending, setSending] = useState<Segment | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [segRes, modelsRes] = await Promise.all([
        fetch('/api/segments').then((r) => r.json()),
        fetch('/api/segments/meta/vehicle-models').then((r) => r.json()),
      ]);
      setSegments(segRes.items || []);
      setVehicleModels(modelsRes.models || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this segment? This cannot be undone.')) return;
    const res = await fetch(`/api/segments/${id}`, { method: 'DELETE' });
    if (res.ok) setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Plus className="w-4 h-4" /> New Segment
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <TableCard>
          <THead>
            <tr>
              <Th>Name</Th>
              <Th>Criteria</Th>
              <Th>Created</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </THead>
          <TBody>
            {segments.length === 0 ? (
              <EmptyTableRow colSpan={4} message="No segments yet — create one to start targeting customers." />
            ) : (
              segments.map((s) => (
                <Tr key={s.id}>
                  <Td className="font-medium text-gray-900 dark:text-gray-100">
                    {s.name}
                    {s.description && <p className="text-xs font-normal text-gray-400 mt-0.5">{s.description}</p>}
                  </Td>
                  <Td className="text-gray-500 dark:text-gray-400">{criteriaSummary(s.criteria)}</Td>
                  <Td className="text-gray-500 dark:text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" size="sm" onClick={() => setSending(s)}>
                        <Send className="w-3.5 h-3.5" /> Send
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => setEditing(s)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))
            )}
          </TBody>
        </TableCard>
      )}

      {editing && (
        <SegmentFormModal
          segment={editing === 'new' ? null : editing}
          vehicleModels={vehicleModels}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}

      {sending && <SendCampaignModal segment={sending} onClose={() => setSending(null)} />}
    </div>
  );
}

function SegmentFormModal({
  segment,
  vehicleModels,
  onClose,
  onSaved,
}: {
  segment: Segment | null;
  vehicleModels: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(segment?.name || '');
  const [description, setDescription] = useState(segment?.description || '');
  const [loyaltyTiers, setLoyaltyTiers] = useState<string[]>(segment?.criteria.loyaltyTiers || []);
  const [selectedModels, setSelectedModels] = useState<string[]>(segment?.criteria.vehicleModels || []);
  const [vehicleYearBefore, setVehicleYearBefore] = useState(segment?.criteria.vehicleYearBefore?.toString() || '');
  const [noServiceInMonths, setNoServiceInMonths] = useState(segment?.criteria.noServiceInMonths?.toString() || '');
  const [addressContains, setAddressContains] = useState(segment?.criteria.addressContains || '');
  const [preview, setPreview] = useState<{ total: number; emailable: number } | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const buildCriteria = (): SegmentCriteria => ({
    ...(loyaltyTiers.length && { loyaltyTiers }),
    ...(selectedModels.length && { vehicleModels: selectedModels }),
    ...(vehicleYearBefore && { vehicleYearBefore: Number(vehicleYearBefore) }),
    ...(noServiceInMonths && { noServiceInMonths: Number(noServiceInMonths) }),
    ...(addressContains.trim() && { addressContains: addressContains.trim() }),
  });

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const res = await fetch('/api/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ criteria: buildCriteria() }),
      });
      const data = await res.json();
      if (res.ok) setPreview({ total: data.total, emailable: data.emailable });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = { name, description, criteria: buildCriteria() };
      const res = await fetch(segment ? `/api/segments/${segment.id}` : '/api/segments', {
        method: segment ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save segment.');
      onSaved();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={segment ? 'Edit Segment' : 'New Segment'} onClose={onClose} maxWidth="max-w-lg">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Segment name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. GOLD+ owners due for service"
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description (optional)</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
          />
        </div>

        <div className="border-t border-gray-100 dark:border-gray-700 pt-4 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Targeting criteria</p>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Loyalty tier</label>
            <div className="flex flex-wrap gap-2">
              {LOYALTY_TIERS.map((tier) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => toggle(loyaltyTiers, setLoyaltyTiers, tier)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${
                    loyaltyTiers.includes(tier)
                      ? 'bg-geely-blue text-white border-geely-blue'
                      : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>
          </div>

          {vehicleModels.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Owns a vehicle model</label>
              <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                {vehicleModels.map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => toggle(selectedModels, setSelectedModels, model)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      selectedModels.includes(model)
                        ? 'bg-geely-blue text-white border-geely-blue'
                        : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {model}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Vehicle year ≤</label>
              <input
                type="number"
                value={vehicleYearBefore}
                onChange={(e) => setVehicleYearBefore(e.target.value)}
                placeholder="e.g. 2020"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">No service in (months)</label>
              <input
                type="number"
                value={noServiceInMonths}
                onChange={(e) => setNoServiceInMonths(e.target.value)}
                placeholder="e.g. 12"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Address contains (best-effort city/region match)</label>
            <input
              value={addressContains}
              onChange={(e) => setAddressContains(e.target.value)}
              placeholder="e.g. Addis Ababa"
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="button" variant="secondary" size="sm" onClick={handlePreview} disabled={previewing}>
              {previewing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Users className="w-3.5 h-3.5" />}
              Preview matches
            </Button>
            {preview && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                <strong className="text-gray-900 dark:text-gray-100">{preview.total}</strong> customer{preview.total === 1 ? '' : 's'} match
                {' '}({preview.emailable} with an email on file)
              </span>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <ModalActions>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {segment ? 'Save Changes' : 'Create Segment'}
        </Button>
      </ModalActions>
    </Modal>
  );
}

function SendCampaignModal({ segment, onClose }: { segment: Segment; onClose: () => void }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [preview, setPreview] = useState<{ total: number; emailable: number } | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sentCount: number; failedCount: number; emailable: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/segments/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ criteria: segment.criteria }),
    })
      .then((r) => r.json())
      .then((data) => setPreview({ total: data.total, emailable: data.emailable }))
      .catch(() => {});
  }, [segment]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) { setError('Subject and message are required.'); return; }
    if (!confirm(`Send this campaign to ${preview?.emailable ?? 'the matching'} customer(s)? This cannot be undone.`)) return;
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/segments/${segment.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, ctaLabel: ctaLabel || undefined, ctaUrl: ctaUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send campaign.');
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal title={`Send Campaign — ${segment.name}`} onClose={onClose} maxWidth="max-w-lg">
      {result ? (
        <div className="space-y-4">
          <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <p className="text-sm text-green-800 dark:text-green-300">
              Sent to <strong>{result.sentCount}</strong> of {result.emailable} customer{result.emailable === 1 ? '' : 's'} with an email on file.
              {result.failedCount > 0 && ` ${result.failedCount} failed to send.`}
            </p>
          </Card>
          <ModalActions>
            <Button onClick={onClose}>Done</Button>
          </ModalActions>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            {preview
              ? <>Matches <strong className="text-gray-900 dark:text-gray-100">{preview.total}</strong> customer{preview.total === 1 ? '' : 's'} · {preview.emailable} reachable by email</>
              : 'Loading matching customers…'}
          </p>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CTA button label (optional)</label>
              <input
                value={ctaLabel}
                onChange={(e) => setCtaLabel(e.target.value)}
                placeholder="e.g. View Offer"
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">CTA URL (optional)</label>
              <input
                value={ctaUrl}
                onChange={(e) => setCtaUrl(e.target.value)}
                placeholder="https://..."
                className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <ModalActions>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send Campaign
            </Button>
          </ModalActions>
        </div>
      )}
    </Modal>
  );
}
