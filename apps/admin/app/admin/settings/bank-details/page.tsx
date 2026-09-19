'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Landmark, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// Company bank account, printed on the Sales Agreement's "Payment" section
// and the Sales Invoice's "Payment" section — see
// backend/src/services/pdf/companyInfo.ts (getCompanyInfo()) and
// backend/src/routes/settings.routes.ts's GET/POST /api/settings/bank-details.
interface BankDetails {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch: string;
}

const DEFAULT_DATA: BankDetails = {
  bankName: '',
  accountNumber: '',
  accountName: 'Kerchanshe Trading PLC',
  branch: '',
};

export default function BankDetailsPage() {
  useAdminAuth('canManageSettings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BankDetails>(DEFAULT_DATA);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/bank-details');
        if (res.ok) {
          const json = await res.json();
          setData({
            bankName: json.bankName ?? DEFAULT_DATA.bankName,
            accountNumber: json.accountNumber ?? DEFAULT_DATA.accountNumber,
            accountName: json.accountName ?? DEFAULT_DATA.accountName,
            branch: json.branch ?? DEFAULT_DATA.branch,
          });
        }
      } catch {
        setData(DEFAULT_DATA);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/bank-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
      } else {
        alert('Failed to save bank details');
      }
    } catch {
      alert('Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading bank details...</div>
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
          <h1 className="text-2xl font-bold">Bank Details</h1>
          <p className="text-gray-600">Company bank account shown on the Sales Agreement and Sales Invoice</p>
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
        <div className="bg-gradient-to-r from-teal-500 via-cyan-500 to-teal-600 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
              <Landmark className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">Bank Account</h2>
              <p className="text-teal-100 text-sm">Used for the "Payment" section on printed sales documents</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Bank Name</label>
            <input
              value={data.bankName}
              onChange={(e) => setData((d) => ({ ...d, bankName: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="e.g. Commercial Bank of Ethiopia"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1.5">Account Name</label>
            <input
              value={data.accountName}
              onChange={(e) => setData((d) => ({ ...d, accountName: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Kerchanshe Trading PLC"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Account Number</label>
              <input
                value={data.accountNumber}
                onChange={(e) => setData((d) => ({ ...d, accountNumber: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">Branch</label>
              <input
                value={data.branch}
                onChange={(e) => setData((d) => ({ ...d, branch: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
