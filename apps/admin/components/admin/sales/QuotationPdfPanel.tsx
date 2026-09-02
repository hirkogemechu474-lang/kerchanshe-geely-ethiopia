'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/admin/ui';
import { FileText, Copy, Check } from 'lucide-react';
import { isPdfUrl, resolveDocumentUrl } from '@/lib/fileType';

interface VehicleColorOption {
  id: string;
  name: string;
  colorCode: string;
  inStock: boolean;
}

interface QuotationPdfData {
  id: string;
  vehicleModel: string | null;
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
  signedDocumentUrl: string | null;
  signedAt: string | null;
  managerApprovalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  managerRejectionReason: string | null;
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
  publicSignUrl,
  webAppUrl,
}: {
  quotation: QuotationPdfData;
  canManage: boolean;
  publicPdfUrl: string | null;
  publicSignUrl: string | null;
  webAppUrl: string;
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
  const [colorOptions, setColorOptions] = useState<VehicleColorOption[] | null>(null);

  // Best-effort: Quotation.vehicleModel is a free-text name, not a real
  // Vehicle.id, so this resolves by name (see /api/admin/vehicle-colors's
  // vehicleName fallback) and simply leaves colorOptions null — falling
  // back to the free-text input below — if no vehicle or no colors match.
  useEffect(() => {
    if (!quotation.vehicleModel) return;
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/admin/vehicle-colors?vehicleName=${encodeURIComponent(quotation.vehicleModel!)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (active && data.success && Array.isArray(data.colors) && data.colors.length > 0) {
          setColorOptions(data.colors);
        }
      } catch {
        // Leave colorOptions null — the free-text input still works.
      }
    })();
    return () => {
      active = false;
    };
  }, [quotation.vehicleModel]);

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
      setNotice('Quotation generated. A manager has been notified to review and approve it before it can be sent to the customer.');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const sendToCustomer = async () => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch(`/api/admin/quotations/${quotation.id}/send-quotation`, { method: 'POST' });
      const data = await parseJsonResponse(res);
      if (!res.ok) throw new Error(data.error || 'Failed to send quotation');
      setNotice(data.notificationSent ? 'Quotation emailed to the customer.' : 'Quotation sent, but the email could not be delivered — check SMTP settings.');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    const link = publicSignUrl || publicPdfUrl;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — the link is still visible to select manually.
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-geely-blue" />
        <h2 className="text-lg font-semibold text-gray-900">Sales Quotation PDF</h2>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {notice && <p className="text-sm text-blue-700">{notice}</p>}

      {quotation.quotationNo && quotation.managerApprovalStatus === 'PENDING' && (
        <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
          Awaiting manager approval before this can be sent to the customer.
        </p>
      )}
      {quotation.managerApprovalStatus === 'REJECTED' && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          Returned for correction{quotation.managerRejectionReason ? `: ${quotation.managerRejectionReason}` : '.'} Update the details below and regenerate.
        </p>
      )}

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
              className="inline-flex items-center gap-2 text-sm font-medium text-geely-blue hover:underline"
            >
              <FileText className="w-4 h-4" />
              View / Download PDF
            </a>
            {(publicSignUrl || publicPdfUrl) && (
              <button
                type="button"
                onClick={copyLink}
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied' : 'Copy customer sign link'}
              </button>
            )}
          </div>

          {canManage && quotation.managerApprovalStatus === 'APPROVED' && !quotation.signedDocumentUrl && (
            <Button onClick={sendToCustomer} disabled={busy}>
              {busy ? 'Sending…' : 'Send Quotation to Customer'}
            </Button>
          )}

          <div className="pt-2 border-t border-gray-100">
            {quotation.signedDocumentUrl ? (
              <div className="flex items-start gap-4">
                {isPdfUrl(quotation.signedDocumentUrl) ? (
                  <a
                    href={resolveDocumentUrl(quotation.signedDocumentUrl, webAppUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-32 h-20 rounded-lg border border-gray-200 flex flex-col items-center justify-center gap-1 text-xs font-medium text-geely-blue hover:bg-gray-50"
                  >
                    <FileText className="w-5 h-5" />
                    View signed PDF
                  </a>
                ) : (
                  <img
                    src={resolveDocumentUrl(quotation.signedDocumentUrl, webAppUrl)}
                    alt="Signed quotation"
                    className="w-32 h-20 object-cover rounded-lg border border-gray-200"
                  />
                )}
                <p className="text-xs text-green-600 font-medium self-center">
                  Signed {quotation.signedAt ? new Date(quotation.signedAt).toLocaleString() : ''}
                </p>
              </div>
            ) : (
              <p className="text-xs text-gray-500">Not yet signed by the customer.</p>
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
              {colorOptions ? (
                <select
                  value={vehicleColor}
                  onChange={(e) => setVehicleColor(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">Select a color…</option>
                  {colorOptions.map((color) => (
                    <option key={color.id} value={color.name} disabled={!color.inStock}>
                      {color.name}{!color.inStock ? ' (out of stock)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input value={vehicleColor} onChange={(e) => setVehicleColor(e.target.value)} placeholder="e.g. Pearl White" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              )}
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
            {quotation.quotationNo ? 'Regenerate Quotation' : 'Generate Quotation'}
          </Button>
        </div>
      )}
    </Card>
  );
}
