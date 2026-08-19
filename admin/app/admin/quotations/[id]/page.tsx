import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calendar, Mail, MessageSquare, Phone, User, CarFront } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { requirePermission } from '@/lib/auth/middleware';

function formatDate(value: Date) {
  return new Intl.DateTimeFormat('en-ET', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function statusClass(status: string) {
  switch (status) {
    case 'converted': return 'bg-green-100 text-green-800';
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
  await requirePermission('canManageContent');
  const { id } = await params;
  const quotation = await prisma.quotation.findUnique({ where: { id } });

  if (!quotation) notFound();

  const status = quotation.status || 'new';

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
            <div className="flex gap-3"><User className="mt-0.5 h-5 w-5 text-blue-600" /><div><p className="text-xs text-gray-500">Customer</p><p className="font-semibold text-gray-900">{quotation.customerName}</p></div></div>
            <div className="flex gap-3"><CarFront className="mt-0.5 h-5 w-5 text-blue-600" /><div><p className="text-xs text-gray-500">Vehicle</p><p className="font-semibold text-gray-900">{quotation.vehicleModel}</p></div></div>
            <div className="flex gap-3"><Phone className="mt-0.5 h-5 w-5 text-blue-600" /><div><p className="text-xs text-gray-500">Phone</p><a className="font-semibold text-blue-600 hover:underline" href={`tel:${quotation.phoneNumber}`}>{quotation.phoneNumber}</a></div></div>
            <div className="flex gap-3"><Mail className="mt-0.5 h-5 w-5 text-blue-600" /><div><p className="text-xs text-gray-500">Email</p><a className="break-all font-semibold text-blue-600 hover:underline" href={`mailto:${quotation.email}`}>{quotation.email}</a></div></div>
            <div className="flex gap-3"><Calendar className="mt-0.5 h-5 w-5 text-blue-600" /><div><p className="text-xs text-gray-500">Submitted</p><p className="font-semibold text-gray-900">{formatDate(quotation.createdAt)}</p></div></div>
            <div><p className="text-xs text-gray-500">Preferred dealer</p><p className="font-semibold text-gray-900">{quotation.preferredDealer || 'Not specified'}</p></div>
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900">Request Details</h2>
          <dl className="space-y-4 text-sm">
            <div><dt className="text-gray-500">Financing</dt><dd className="font-semibold text-gray-900">{quotation.financingInterest ? 'Requested' : 'Not requested'}</dd></div>
            <div><dt className="text-gray-500">Trade-in</dt><dd className="font-semibold text-gray-900">{quotation.tradeInInterest ? 'Yes' : 'No'}</dd></div>
            <div><dt className="text-gray-500">Assigned to</dt><dd className="font-semibold text-gray-900">{quotation.assignedTo || 'Unassigned'}</dd></div>
          </dl>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-3 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-600" /><h2 className="text-lg font-bold text-gray-900">Customer Message</h2></div>
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
