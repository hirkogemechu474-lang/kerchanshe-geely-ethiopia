'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';
import { FileText, Copy, Check } from 'lucide-react';

interface QuotationPdfData {
  id: string;
  quotationNo: string | null;
  quotationGeneratedAt: string | null;
  quotationValidUntil: string | null;
  unitPrice: number | null;
  quantity: number | null;
  discountAmount: number | null;
  vatAmount: number | null;
  vehicleYear: string | null;
  vehicleColor: string | null;
  paymentTerms: string | null;
  deliveryTerms: string | null;
}

async function parseJsonResponse(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { error: `Server error (${res.status}). Please try again.` };
  }
}

export default function QuotationPdfPanel({
  quotation,
  canManage,
  publicPdfUrl,
}: {
  quotation: QuotationPdfData;
  canManage: boolean;
  publicPdfUrl: string | null;
}) {
  const router = useRouter();
  const [unitPrice, setUnitPrice] = useState(quotation.unitPrice?.toString() || '');
  const [quantity, setQuantity] = useState(quotation.quantity?.toString() || '1');
  const [discountAmount, setDiscountAmount] = useState(quotation.discountAmount?.toString() || '0');
  const [vehicleYear, setVehicleYear] = useState(quotation.vehicleYear || '');
  const [vehicleColor, setVehicleColor] = useState(quotation.vehicleColor || '');
  const [validUntil, setValidUntil] = useState(quotation.quotationValidUntil?.slice(0, 10) || '');
  const [paymentTerms, setPaymentTerms] = useState(quotation.paymentTerms || '');
  const [deliveryTerms, setDeliveryTerms] = useState(quotation.deliveryTerms || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/admin/quotations/${quotation.id}/quotation-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitPrice,
          quantity,
          discountAmount,
          vehicleYear,
          vehicleColor,
          quotationValidUntil: validUntil || null,
          paymentTerms,
          deliveryTerms,
        }),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to generate quotation');
      setNotice(data.notificationSent ? 'Quotation emailed to the customer.' : 'Quotation generated, but the email could not be sent — check SMTP settings.');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!publicPdfUrl) return;
    try {
      await navigator.clipboard.writeText(publicPdfUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the link is still visible to select manually.
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Sales Quotation PDF</h2>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-blue-700">{notice}</p>}

      {quotation.quotationNo && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700 space-y-2">
          <p>
            <span className="font-semibold">{quotation.quotationNo}</span>
            {quotation.quotationGeneratedAt && (
              <span className="text-xs text-gray-400"> · generated {new Date(quotation.quotationGeneratedAt).toLocaleString()}</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a
              href={`/api/admin/quotations/${quotation.id}/quotation-pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:underline"
            >
              <FileText className="w-4 h-4" />
              View / Download PDF
            </a>
            {publicPdfUrl && (
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy customer link'}
              </button>
            )}
          </div>
        </div>
      )}

      {canManage && (
        <div className="space-y-3 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit price (ETB)</label>
              <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
              <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Discount (ETB)</label>
              <input type="number" min={0} value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle year</label>
              <input value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} placeholder="2026" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle color</label>
              <input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} placeholder="e.g. Pearl White" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Valid until</label>
              <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment terms</label>
              <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="30% Advance / 70% Before Delivery" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Delivery</label>
              <input value={deliveryTerms} onChange={(e) => setDeliveryTerms(e.target.value)} placeholder="Within 10 Working Days" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <p className="text-xs text-gray-500">VAT is calculated automatically at 15% of the vehicle price minus discount.</p>
          <Button onClick={generate} disabled={busy || !unitPrice}>
            {quotation.quotationNo ? 'Regenerate & Send Quotation PDF' : 'Generate & Send Quotation PDF'}
          </Button>
        </div>
      )}
    </Card>
  );
}
