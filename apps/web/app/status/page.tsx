'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { CheckCircle, Search, AlertCircle, FileText } from 'lucide-react';

type StatusResult = {
  type: string;
  label: string;
  reference: string;
  status: string;
  createdAt: string;
  quotationNo?: string | null;
  orderNo?: string | null;
  pdfToken?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Received',
  unread: 'Received',
  pending: 'Pending',
  scheduled: 'Scheduled',
  contacted: 'Contacted',
  in_progress: 'In Progress',
  quoted: 'Quoted',
  converted: 'Converted',
  closed: 'Closed',
  cancelled: 'Cancelled',
  booked: 'Booked',
  financing_pending: 'Financing Pending',
  ready_for_delivery: 'Ready for Delivery',
  delivered: 'Delivered',
  not_requested: 'Not Requested',
  requested: 'Financing Requested',
  documents_pending: 'Documents Pending',
  documents_submitted: 'Documents Submitted',
  under_review: 'Under Review',
  conditionally_approved: 'Conditionally Approved',
  rejected: 'Rejected',
  customer_declined: 'Customer Declined',
  disbursed: 'Disbursed',
  completed: 'Completed',
};

function formatStatus(status: string): string {
  return STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-ET', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function StatusPage() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(searchParams.get('ref') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StatusResult | null>(null);

  async function lookup(ref: string) {
    if (!ref.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/public/status?ref=${encodeURIComponent(ref.trim())}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.found) {
        setError(data.error || 'No request found for that reference number.');
        return;
      }
      setResult(data.result);
    } catch {
      setError('Unable to check status right now. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialRef = searchParams.get('ref');
    if (initialRef) {
      void lookup(initialRef);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">CHECK YOUR STATUS</div>
          <h1 className="disp text-4xl font-bold mb-4">Track Your Request</h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl">
            Enter the reference number from your confirmation email to check the status of your quote, purchase, service appointment, financing application, parts request, or test drive.
          </p>
        </div>
      </div>

      <section className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-10">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void lookup(reference);
            }}
            className="bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line shadow-lg p-6 sm:p-8"
          >
            <label className="block text-sm font-semibold text-navy dark:text-ice mb-2">Reference Number</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="GY-SQ-24082026-001"
                className="flex-1 px-4 py-3 border border-line dark:border-midnight-line rounded-lg focus:outline-none focus:border-geely-blue"
              />
              <button
                type="submit"
                disabled={loading}
                className={`inline-flex items-center gap-2 bg-geely-blue text-white font-bold text-sm px-6 py-3 rounded-lg transition-all ${
                  loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'
                }`}
              >
                <Search size={16} />
                {loading ? 'Checking...' : 'Check Status'}
              </button>
            </div>
          </form>

          {error && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="mt-6 bg-white dark:bg-midnight-surface rounded-lg border border-line dark:border-midnight-line shadow-lg p-6 sm:p-8">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="text-green-600" size={22} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-navy dark:text-ice">{result.label}</h2>
                  <p className="text-sm text-steel dark:text-steel-light mt-1">Submitted {formatDate(result.createdAt)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-line dark:border-midnight-line">
                <div>
                  <div className="text-xs text-steel dark:text-steel-light uppercase tracking-wide mb-1">Reference</div>
                  <div className="font-bold text-navy dark:text-ice">{result.reference}</div>
                </div>
                <div>
                  <div className="text-xs text-steel dark:text-steel-light uppercase tracking-wide mb-1">Status</div>
                  <div className="font-bold text-geely-blue">{formatStatus(result.status)}</div>
                </div>
              </div>
              {result.quotationNo && (
                <a
                  href={`/api/public/quotations/${encodeURIComponent(result.reference)}/pdf${
                    result.pdfToken ? `?token=${encodeURIComponent(result.pdfToken)}` : ''
                  }`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-geely-blue hover:underline"
                >
                  <FileText size={16} />
                  Download Quotation PDF ({result.quotationNo})
                </a>
              )}
              {result.orderNo && (
                <p className="mt-3 text-xs text-steel dark:text-steel-light">
                  Order number: <span className="font-semibold">{result.orderNo}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
