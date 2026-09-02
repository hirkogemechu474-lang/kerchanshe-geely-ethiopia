'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Bell, CheckCircle2, Sparkles } from 'lucide-react';

const NOTIFICATION_EVENTS: Record<string, string> = {
  'quotation.newLead': 'New lead received (notifies sales managers)',
  'quotation.assigned': 'Lead assigned to a sales rep',
  'quotation.pendingApproval': 'Quotation awaiting manager approval',
  'quotation.sentToCustomer': 'Quotation PDF emailed to customer',
  'quotation.staffNotifiedOfSend': 'Staff notified when a quotation is sent to a customer',
  'quotation.statusChanged': 'Generic quotation status-change notification',
  'quotation.rejected': 'Quotation returned for correction',
  'quotation.escalated': 'Quotation escalated to a manager, with reason',
  'order.testDriveInvite': 'Test-drive invite sent for an order',
  'order.agreementSent': 'Sales agreement sent to customer',
  'order.agreementSignedByCustomer': 'Manager notified when customer signs the agreement',
  'order.countersigned': 'Agreement countersigned (payment link sent)',
  'order.agreementRejected': 'Agreement returned for correction',
  'order.handoverSignoffSent': 'Handover sign-off link sent to customer',
  'order.handoverComplete': 'Vehicle delivered / handover notice',
  'order.invoiceGenerated': 'Sales invoice generated',
  'testDrive.statusChanged': 'Test-drive request status changed',
  'testDrive.newPublicRequest': 'New public test-drive request received',
  'review.statusChanged': 'Customer review status changed',
  'partRequest.statusChanged': 'Parts request status changed',
  'workshop.jobCardMilestone': 'Job card milestone reached',
  'workshop.csiSurveyInvite': 'Post-service CSI survey invite sent',
};

type Rules = Record<string, { enabled: boolean }>;

function defaultRules(): Rules {
  return Object.fromEntries(Object.keys(NOTIFICATION_EVENTS).map((k) => [k, { enabled: true }]));
}

export default function NotificationRulesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<Rules>(defaultRules());
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/notification-rules');
        if (res.ok) {
          const json = await res.json();
          setRules({ ...defaultRules(), ...json });
        }
      } catch {
        setRules(defaultRules());
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (key: string) => {
    setRules((r) => ({ ...r, [key]: { enabled: !r[key]?.enabled } }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/notification-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
      } else {
        alert('Failed to save notification rules');
      }
    } catch {
      alert('Failed to save notification rules');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 flex items-center gap-2">
          <Sparkles className="animate-spin w-5 h-5" /> Loading notification rules...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/settings" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>
          <h1 className="text-2xl font-bold">Notification Rules</h1>
          <p className="text-gray-600">
            Turn individual automated email notifications on or off. Disabled events are skipped entirely — no
            email is sent, no code change required.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-geely-blue to-navy text-white rounded-lg shadow-md shadow-geely-blue/20 hover:from-blue-700 hover:to-blue-800 disabled:opacity-60"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
          {savedAt && (
            <span className="ml-1 text-xs text-blue-100 opacity-90 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved {savedAt}
            </span>
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
              <Bell className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">Events</h2>
              <p className="text-yellow-100 text-sm">All default to enabled — today's behavior is unaffected until you turn one off</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {Object.entries(NOTIFICATION_EVENTS).map(([key, label]) => (
            <label key={key} className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50 cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-gray-800">{label}</div>
                <div className="text-xs text-gray-400 font-mono">{key}</div>
              </div>
              <input
                type="checkbox"
                checked={rules[key]?.enabled ?? true}
                onChange={() => toggle(key)}
                className="w-5 h-5 rounded text-geely-blue focus:ring-geely-blue shrink-0"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
