import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import FAQForm from '@/components/admin/faq/FAQForm';

export const metadata: Metadata = {
  title: 'New FAQ - Admin',
  description: 'Create a new frequently asked question',
};

export default function NewFAQPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">Create New FAQ</h1>
          <p className="text-gray-600 mt-1">
            Add a new frequently asked question for your website
          </p>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">💡 FAQ Best Practices</h3>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Use clear, specific questions that customers actually ask</li>
          <li>• Provide comprehensive but concise answers</li>
          <li>• Use categories to group related FAQs (Warranty, Service, Purchase, etc.)</li>
          <li>• Mark important FAQs as "Featured" to highlight them</li>
          <li>• Use HTML tags like &lt;strong&gt;, &lt;ul&gt;, &lt;p&gt; for better formatting</li>
        </ul>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <FAQForm mode="create" />
      </div>
    </div>
  );
}