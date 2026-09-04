'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, RefreshCw, Timer, AlertTriangle, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';
import { Card, StatTile, Button } from '@/components/admin/ui';

interface SlaDashboard {
  active: number;
  breached: number;
  completed: number;
  complianceRate: number;
}

export default function SlaMonitor() {
  const [dash, setDash] = useState<SlaDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/sla/dashboard');
    if (res.ok) setDash(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const checkBreached = async () => {
    setChecking(true);
    setResult('');
    const res = await fetch('/api/sla/check-breached', { method: 'POST' });
    setChecking(false);
    if (res.ok) {
      const r = await res.json();
      setResult(`${r.breachedCount} breached timer(s) found; ${r.escalatedCount} escalation(s) notified.`);
      load();
    } else {
      setResult('Failed to run breach check.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <StatTile label="Active" value={dash?.active ?? '—'} icon={Timer} />
        <StatTile label="Breached" value={dash?.breached ?? '—'} icon={AlertTriangle} tone={(dash?.breached ?? 0) > 0 ? 'highlight' : 'default'} />
        <StatTile label="Completed" value={dash?.completed ?? '—'} icon={CheckCircle2} />
        <StatTile label="Compliance" value={dash ? `${dash.complianceRate}%` : '—'} icon={Activity} />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={checkBreached} disabled={checking}>
            <ShieldAlert className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} /> Check &amp; Escalate Breached
          </Button>
          <Button variant="secondary" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {result && <p className="text-sm text-geely-blue">{result}</p>}

      <Card>
        <h3 className="font-semibold mb-3">About SLA Timers</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          SLA timers track workflow stages such as lead response (60 min), quotation approval (4 hrs), payment confirmation,
          discount approval, PDI completion, registration, delivery scheduling, and post-delivery follow-up. A timer is
          marked <strong>breached</strong> when its deadline passes while still active; high-priority stages escalate to
          managers and finance automatically. Run <em>Check &amp; Escalate</em> to scan active timers.
        </p>
      </Card>
    </div>
  );
}
