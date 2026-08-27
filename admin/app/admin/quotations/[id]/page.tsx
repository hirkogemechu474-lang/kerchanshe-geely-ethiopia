import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Mail, MessageSquare, Phone, User, CarFront } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/middleware';
import { ConfigurationSummary } from '@/components/admin/sales/ConfigurationSummary';
import QuotationPdfPanel from '@/components/admin/sales/QuotationPdfPanel';
import { env } from '@/lib/env';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-ET', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function statusClass(status: string) {
  switch (status) {
    case 'converted': return 'bg-green-100 text-green-800';
    case 'accepted': return 'bg-teal-100 text-teal-800';
    case 'approved': return 'bg-emerald-100 text-emerald-800';
    case 'closed': return 'bg-gray-100 text-gray-700';
    case 'contacted': return 'bg-blue-100 text-blue-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-red-100 text-red-800';
  }
}

export default async function QuotationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePermission('canManageContent');
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({ where: { id } });

  if (!quotation) notFound();

  const status = quotation.status || 'new';
  const webAppUrl = env.app.url.replace(/\/$/, '');
  const publicPdfUrl = quotation.reference
    ? `${webAppUrl}/api/public/quotations/${encodeURIComponent(quotation.reference)}/pdf`
    : null;
  const publicSignUrl = quotation.reference ? `${webAppUrl}/quotation/${encodeURIComponent(quotation.reference)}` : null;

  // UC-01 dedupe visibility: surface other inquiries from the same phone
  // number rather than silently hiding them.
  const priorInquiries = await prisma.quotation.findMany({
    where: { phoneNumber: quotation.phoneNumber, id: { not: quotation.id } },
    orderBy: { createdAt: 'desc' },
    select: { id: true, vehicleModel: true, status: true, createdAt: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/quotations" className="rounded-lg p-2 hover:bg-gray-100" aria-label="Back to quotations">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quotation Request</h1>
            <p className="text-sm text-gray-500">Reference: {quotation.id}</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusClass(status)}`}>
          {status.replace('_', ' ').toUpperCase()}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-xl border border-gray-200 bg-white p-6 lg:col-span-2">
          <h2 className="mb-5 text-lg font-bold text-gray-900">Customer Request</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex gap-3"><User className="mt-0.5 h-5 w-5 text-geely-blue" /><div><p className="text-xs text-gray-500">Customer</p><p className="font-semibold text-gray-900">{quotation.customerName}</p></div></div>
            <div className="flex gap-3"><CarFront className="mt-0.5 h-5 w-5 text-geely-blue" /><div><p className="text-xs text-gray-500">Vehicle</p><p className="font-semibold text-gray-900">{quotation.vehicleModel || 'General enquiry'}</p></div></div>
            <div className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 text-geely-blue" /><div><p className="text-xs text-gray-500">Phone</p><a className="font-semibold text-geely-blue hover:underline" href={`tel:${quotation.phoneNumber}`}>{quotation.phoneNumber}</a></div></div>
            <div className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 text-geely-blue" /><div><p className="text-xs text-gray-500">Email</p>{quotation.email ? <a className="break-all font-semibold text-geely-blue hover:underline" href={`mailto:${quotation.email}`}>{quotation.email}</a> : <p className="font-semibold text-gray-400">Not provided</p>}</div></div>
            <div className="flex gap-3"><Calendar className="mt-0.5 h-5 w-5 text-geely-blue" /><div><p className="text-xs text-gray-500">Submitted</p><p className="font-semibold text-gray-900">{formatDate(quotation.createdAt)}</p></div></div>
            <div><p className="text-xs text-gray-500">Preferred dealer</p><p className="font-semibold text-gray-900">{quotation.preferredDealer || 'Not specified'}</p></div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900">Request Details</h2>
          <dl className="space-y-4 text-sm">
            <div><dt className="text-gray-500">Lead source</dt><dd className="font-semibold text-gray-900 capitalize">{quotation.source.replace('-', ' ')}</dd></div>
            <div><dt className="text-gray-500">Financing</dt><dd className="font-semibold text-gray-900">{quotation.financingInterest ? 'Requested' : 'Not requested'}</dd></div>
            <div><dt className="text-gray-500">Trade-in</dt><dd className="font-semibold text-gray-900">{quotation.tradeInInterest ? 'Yes' : 'No'}</dd></div>
            <div><dt className="text-gray-500">Assigned to</dt><dd className="font-semibold text-gray-900">{quotation.assignedTo || 'Unassigned'}</dd></div>
          </dl>
        </section>
      </div>

      <ConfigurationSummary configuration={quotation.configurationJson} />

      <QuotationPdfPanel
        quotation={{
          id: quotation.id,
          quotationNo: quotation.quotationNo,
          quotationGeneratedAt: quotation.quotationGeneratedAt?.toISOString() || null,
          quotationValidUntil: quotation.quotationValidUntil?.toISOString() || null,
          unitPrice: quotation.unitPrice,
          quantity: quotation.quantity,
          discountAmount: quotation.discountAmount,
          vatAmount: quotation.vatAmount,
          vehicleYear: quotation.vehicleYear,
          vehicleColor: quotation.vehicleColor,
          paymentTerms: quotation.paymentTerms,
          deliveryTerms: quotation.deliveryTerms,
          signedDocumentUrl: quotation.signedDocumentUrl,
          signedAt: quotation.signedAt?.toISOString() || null,
        }}
        canManage={session.user.permissions.canManageQuotations}
        publicPdfUrl={publicPdfUrl}
        publicSignUrl={publicSignUrl}
        webAppUrl={webAppUrl}
      />

      {priorInquiries.length > 0 && (
        <section className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-3 text-lg font-bold text-blue-900">
            Other inquiries from this phone number ({priorInquiries.length})
          </h2>
          <ul className="space-y-2">
            {priorInquiries.map((p) => (
              <li key={p.id} className="flex items-center justify-between text-sm">
                <Link href={`/admin/quotations/${p.id}`} className="text-blue-700 hover:underline font-medium">
                  {p.vehicleModel || 'General enquiry'}
                </Link>
                <span className="text-geely-blue">
                  {p.status.replace('_', ' ')} · {formatDate(p.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-3 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-geely-blue" /><h2 className="text-lg font-bold text-gray-900">Customer Message</h2></div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">{quotation.message || 'No additional message was provided.'}</p>
      </section>

      {quotation.internalNotes && (
        <section className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="mb-2 text-lg font-bold text-yellow-900">Internal Notes</h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-yellow-900">{quotation.internalNotes}</p>
        </section>
      )}
    </div>
  );
}
