'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Badge } from '@/components/admin/ui';
import { Car } from 'lucide-react';

interface TradeInEvaluationData {
  id: string;
  vin: string | null;
  plateNo: string | null;
  year: number;
  make: string | null;
  model: string | null;
  color: string | null;
  mileage: number;
  condition: string;
  interiorCondition: string | null;
  exteriorCondition: string | null;
  mechanicalCondition: string | null;
  hasAccidents: boolean | null;
  hasModifications: boolean | null;
  serviceHistoryNotes: string | null;
  photoUrls: string[];
  estimatedValue: number | null;
  evaluatedValue: number | null;
  approvalStatus: string;
  internalNotes: string | null;
}

function formatETB(value: number): string {
  return `ETB ${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function statusBadgeTone(status: string): 'green' | 'red' | 'orange' {
  if (status === 'APPROVED') return 'green';
  if (status === 'REJECTED') return 'red';
  return 'orange';
}

// Renders the vehicle-condition/mileage/photo/valuation trade-in evaluation
// captured on the public /trade-in form (linked via
// Quotation.tradeInEvaluationId) — this data previously had a full backend
// CRUD API (trade-in.routes.ts) but no admin UI consumed it at all.
export default function TradeInEvaluationPanel({
  evaluation,
  canManage,
}: {
  evaluation: TradeInEvaluationData | null;
  canManage: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [evaluatedValue, setEvaluatedValue] = useState(
    evaluation?.evaluatedValue != null ? String(evaluation.evaluatedValue) : ''
  );

  if (!evaluation) return null;

  const decide = async (approvalStatus: 'APPROVED' | 'REJECTED') => {
    setBusy(true);
    setError('');
    try {
      const value = parseFloat(evaluatedValue);
      const res = await fetch(`/api/trade-in/${evaluation.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus,
          ...(Number.isFinite(value) && { evaluatedValue: value }),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update evaluation');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="w-5 h-5 text-geely-blue" />
          <h2 className="text-lg font-semibold text-gray-900">Trade-In Evaluation</h2>
        </div>
        <Badge tone={statusBadgeTone(evaluation.approvalStatus)}>
          {evaluation.approvalStatus}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className="text-xs text-gray-500">Vehicle</p>
          <p className="font-semibold text-gray-900">
            {[evaluation.year, evaluation.make, evaluation.model].filter(Boolean).join(' ') || 'Not specified'}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500">VIN / Plate</p>
          <p className="font-semibold text-gray-900">{evaluation.vin || evaluation.plateNo || 'Not provided'}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Mileage</p>
          <p className="font-semibold text-gray-900">{evaluation.mileage.toLocaleString()} km</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Overall condition</p>
          <p className="font-semibold text-gray-900 capitalize">{evaluation.condition}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Accidents / Modifications</p>
          <p className="font-semibold text-gray-900">
            {evaluation.hasAccidents ? 'Has accident history' : 'No accidents reported'}
            {' · '}
            {evaluation.hasModifications ? 'Modified' : 'Unmodified'}
          </p>
        </div>
        {evaluation.serviceHistoryNotes && (
          <div>
            <p className="text-xs text-gray-500">Service history</p>
            <p className="font-semibold text-gray-900">{evaluation.serviceHistoryNotes}</p>
          </div>
        )}
        {evaluation.estimatedValue != null && (
          <div>
            <p className="text-xs text-gray-500">Estimated value</p>
            <p className="font-semibold text-gray-900">{formatETB(evaluation.estimatedValue)}</p>
          </div>
        )}
      </div>

      {evaluation.photoUrls.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Photos ({evaluation.photoUrls.length})</p>
          <div className="flex flex-wrap gap-2">
            {evaluation.photoUrls.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={`Trade-in photo ${i + 1}`} className="h-20 w-20 rounded-lg object-cover border border-gray-200" />
              </a>
            ))}
          </div>
        </div>
      )}

      {canManage && evaluation.approvalStatus === 'PENDING' && (
        <div className="space-y-3 border-t border-gray-100 pt-4">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Approved value (ETB)</label>
            <input
              type="number"
              value={evaluatedValue}
              onChange={(e) => setEvaluatedValue(e.target.value)}
              className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="e.g. 850000"
            />
          </div>
          <div className="flex gap-3">
            <Button onClick={() => decide('APPROVED')} disabled={busy}>
              {busy ? 'Saving…' : 'Approve Trade-In Value'}
            </Button>
            <Button variant="secondary" onClick={() => decide('REJECTED')} disabled={busy}>
              Reject
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
