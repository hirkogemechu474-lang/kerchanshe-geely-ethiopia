'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface FAQFormProps {
  faq?: {
    id: string;
    question: string;
    answer: string;
    category: string | null;
    displayOrder: number;
    isActive: boolean;
    isFeatured: boolean;
  };
  mode: 'create' | 'edit';
}

export default function FAQForm({ faq, mode }: FAQFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    question: faq?.question || '',
    answer: faq?.answer || '',
    category: faq?.category || '',
    displayOrder: faq?.displayOrder || 0,
    isActive: faq?.isActive !== undefined ? faq.isActive : true,
    isFeatured: faq?.isFeatured !== undefined ? faq.isFeatured : false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create'
        ? '/api/admin/faq'
        : `/api/admin/faq/${faq?.id}`;

      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push('/admin/faq');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save FAQ');
      }
    } catch (error) {
      console.error('Error saving FAQ:', error);
      alert('Failed to save FAQ');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/faq/${faq?.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/admin/faq');
        router.refresh();
      } else {
        alert('Failed to delete FAQ');
      }
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      alert('Failed to delete FAQ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {mode === 'edit' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Delete FAQ
          </button>
        </div>
      )}

      {/* Question */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Question <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.question}
          onChange={(e) => setFormData({ ...formData, question: e.target.value })}
          required
          placeholder="e.g., What is the warranty period for Geely vehicles?"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Answer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Answer <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          required
          placeholder="Provide a detailed answer to the question..."
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          You can use basic HTML tags like &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;
        </p>
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category
        </label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="e.g., Warranty, Service, Purchase, Financing"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Optional category for grouping FAQs
        </p>
      </div>

      {/* Display Order */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Display Order
        </label>
        <input
          type="number"
          value={formData.displayOrder}
          onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          min="0"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Lower numbers appear first (0 = first, 1 = second, etc.)
        </p>
      </div>

      {/* Toggles */}
      <div className="space-y-4 border-t pt-6">
        {/* Featured */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">Featured</label>
            <p className="text-sm text-gray-500">
              Highlight this FAQ prominently on the homepage
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.isFeatured ? 'bg-yellow-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isFeatured ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Active */}
        <div className="flex items-center justify-between">
          <div>
            <label className="font-medium text-gray-700">Active</label>
            <p className="text-sm text-gray-500">
              Show this FAQ to website visitors
            </p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.isActive ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </span>
          ) : mode === 'create' ? (
            'Create FAQ'
          ) : (
            'Update FAQ'
          )}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={loading}
          className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}