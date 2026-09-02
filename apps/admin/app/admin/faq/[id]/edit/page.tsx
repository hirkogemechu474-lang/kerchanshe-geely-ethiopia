import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import FAQForm from '@/components/admin/faq/FAQForm';
import { serverApiClient } from '@/lib/serverApiClient';
import { requirePermission } from '@/lib/auth/middleware';

export const metadata: Metadata = {
  title: 'Edit FAQ - Admin',
  description: 'Edit frequently asked question',
};

async function getFAQ(id: string) {
  try {
    const client = await serverApiClient();
    const { data } = await client.get(`/content/faqs/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return null;
  }
}

export default async function EditFAQPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
  await requirePermission('canManageContent');

  const faq = await getFAQ(id);

  if (!faq) {
    notFound();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/faq"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit FAQ</h1>
          <p className="text-gray-600 mt-1">
            Update "{faq.question.substring(0, 60)}{faq.question.length > 60 ? '...' : ''}"
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">⚠️ Important</h3>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Changes will be visible immediately on the website</li>
          <li>• Setting "Active" to OFF will hide this FAQ from visitors</li>
          <li>• Featured FAQs appear prominently on the homepage</li>
          <li>• Use HTML tags for better formatting in answers</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <FAQForm faq={faq} mode="edit" />
      </div>
    </div>
  );
}