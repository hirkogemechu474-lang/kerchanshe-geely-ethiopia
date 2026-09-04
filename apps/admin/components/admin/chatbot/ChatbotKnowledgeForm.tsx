'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface ChatbotKnowledgeFormProps {
  entry?: {
    id: string;
    question: string;
    keywords: string[];
    answer: string;
    category: string | null;
    isActive: boolean;
    priority: number;
    displayOrder: number;
  };
  mode: 'create' | 'edit';
}

export default function ChatbotKnowledgeForm({ entry, mode }: ChatbotKnowledgeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    question: entry?.question || '',
    keywords: entry?.keywords.join(', ') || '',
    answer: entry?.answer || '',
    category: entry?.category || '',
    isActive: entry?.isActive !== undefined ? entry.isActive : true,
    priority: entry?.priority ?? 0,
    displayOrder: entry?.displayOrder ?? 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = mode === 'create' ? '/api/chatbot/knowledge' : `/api/chatbot/knowledge/${entry?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          keywords: formData.keywords
            .split(',')
            .map((k) => k.trim().toLowerCase())
            .filter(Boolean),
        }),
      });

      if (response.ok) {
        router.push('/admin/chatbot/knowledge');
        router.refresh();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to save entry');
      }
    } catch (error) {
      console.error('Error saving chatbot knowledge:', error);
      alert('Failed to save entry');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this entry? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/chatbot/knowledge/${entry?.id}`, { method: 'DELETE' });

      if (response.ok) {
        router.push('/admin/chatbot/knowledge');
        router.refresh();
      } else {
        alert('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting chatbot knowledge:', error);
      alert('Failed to delete entry');
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
            Delete Entry
          </button>
        </div>
      )}

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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">An admin-facing label — customers never see this text directly</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Keywords <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.keywords}
          onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
          required
          placeholder="e.g., warranty, guarantee, coverage period"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
        <p className="mt-1 text-sm text-gray-500">
          Comma-separated words or phrases. The chatbot answers with this entry when a customer's message contains one or more of them.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Answer <span className="text-red-500">*</span>
        </label>
        <textarea
          value={formData.answer}
          onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
          required
          placeholder="Provide the exact answer the chatbot should send..."
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
        <input
          type="text"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="e.g., Warranty, Service, Purchase"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
          <input
            type="number"
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
          />
          <p className="mt-1 text-sm text-gray-500">Breaks ties when multiple entries match equally — higher wins</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Display Order</label>
          <input
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
            min="0"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-geely-blue focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-6">
        <div>
          <label className="font-medium text-gray-700">Active</label>
          <p className="text-sm text-gray-500">Only active entries are used by the chatbot</p>
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

      <div className="flex gap-4 pt-6 border-t">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-geely-blue text-white py-3 rounded-lg hover:bg-navy disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving...
            </span>
          ) : mode === 'create' ? (
            'Create Entry'
          ) : (
            'Update Entry'
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
