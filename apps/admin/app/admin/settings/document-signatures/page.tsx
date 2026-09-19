'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, PenTool, CheckCircle2, Sparkles } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

type DocumentType = 'QUOTATION' | 'SALES_AGREEMENT' | 'HANDOVER';
type SignerRole = 'sales_agent' | 'manager' | 'customer';
type SignatureRequirements = Record<DocumentType, SignerRole[]>;

const DEFAULT_REQUIREMENTS: SignatureRequirements = {
  QUOTATION: ['customer'],
  SALES_AGREEMENT: ['customer'],
  HANDOVER: ['manager', 'customer'],
};

const DOCUMENT_LABELS: Record<DocumentType, string> = {
  QUOTATION: 'Quotation',
  SALES_AGREEMENT: 'Sales Agreement',
  HANDOVER: 'Handover',
};

const ROLE_LABELS: Record<SignerRole, string> = {
  sales_agent: 'Sales Agent',
  manager: 'Manager',
  customer: 'Customer',
};

const ROLES: SignerRole[] = ['sales_agent', 'manager', 'customer'];
const DOCUMENT_TYPES: DocumentType[] = ['QUOTATION', 'SALES_AGREEMENT', 'HANDOVER'];

export default function DocumentSignaturesPage() {
  useAdminAuth('canManageSettings');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [requirements, setRequirements] = useState<SignatureRequirements>(DEFAULT_REQUIREMENTS);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings/document-signatures');
        if (res.ok) {
          const json = await res.json();
          if (json && Object.keys(json).length > 0) {
            setRequirements(json);
          }
        }
      } catch {
        setRequirements(DEFAULT_REQUIREMENTS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggle = (doc: DocumentType, role: SignerRole) => {
    setRequirements((r) => {
      const current = r[doc] || [];
      const next = current.includes(role) ? current.filter((x) => x !== role) : [...current, role];
      return { ...r, [doc]: next };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings/document-signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requirements),
      });
      if (res.ok) {
        setSavedAt(new Date().toLocaleTimeString());
        setTimeout(() => setSavedAt(null), 2500);
      } else {
        alert('Failed to save signature requirements');
      }
    } catch {
      alert('Failed to save signature requirements');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 flex items-center gap-2">
          <Sparkles className="animate-spin w-5 h-5" /> Loading document signature settings...
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
          <h1 className="text-2xl font-bold">Document Signatures</h1>
          <p className="text-gray-600">
            Choose which roles must sign each document type before the next step can proceed. The customer and
            manager signing flows already exist; checking "Sales Agent" adds a simple in-app acknowledgement step
            for staff.
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
        <div className="bg-gradient-to-r from-purple-500 via-fuchsia-500 to-purple-600 p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg">
              <PenTool className="w-7 h-7 text-white" />
            </div>
            <div className="text-white">
              <h2 className="text-xl font-bold">Required Signers</h2>
              <p className="text-purple-100 text-sm">Per document type</p>
            </div>
          </div>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-2 pr-4 font-semibold text-gray-700">Document</th>
                {ROLES.map((role) => (
                  <th key={role} className="text-center py-2 px-4 font-semibold text-gray-700">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DOCUMENT_TYPES.map((doc) => (
                <tr key={doc} className="border-b border-gray-50">
                  <td className="py-3 pr-4 font-medium text-gray-900">{DOCUMENT_LABELS[doc]}</td>
                  {ROLES.map((role) => (
                    <td key={role} className="text-center py-3 px-4">
                      <input
                        type="checkbox"
                        checked={requirements[doc]?.includes(role) ?? false}
                        onChange={() => toggle(doc, role)}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-900">
        For Sales Agreement, "Manager" is off by default because today's order pipeline only requires the
        customer's signature before an order can move to Ready for Delivery — checking Manager here makes
        countersignature a hard requirement going forward, not just informational.
      </div>
    </div>
  );
}
