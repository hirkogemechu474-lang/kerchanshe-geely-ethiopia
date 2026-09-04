'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Edit, Eye, EyeOff, BookOpen, Loader2, Trash2 } from 'lucide-react';

interface ChatbotKnowledgeEntry {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  category: string | null;
  isActive: boolean;
  priority: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export default function ChatbotKnowledgeList() {
  const [entries, setEntries] = useState<ChatbotKnowledgeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchEntries();
  }, []);

  async function fetchEntries() {
    try {
      const response = await fetch('/api/chatbot/knowledge');
      if (response.ok) {
        setEntries(await response.json());
      }
    } catch (error) {
      console.error('Error fetching chatbot knowledge:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this knowledge base entry? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      const response = await fetch(`/api/chatbot/knowledge/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting chatbot knowledge:', error);
      alert('Failed to delete entry');
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-geely-blue" />
        <span className="ml-2 text-gray-600">Loading knowledge base...</span>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
        <div className="text-gray-400 mb-4">
          <BookOpen className="w-16 h-16 mx-auto" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No knowledge base entries yet</h3>
        <p className="text-gray-600 mb-6">
          Add entries to teach the chatbot how to answer questions beyond models, test drives, promotions, financing, and dealers.
        </p>
        <Link
          href="/admin/chatbot/knowledge/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-geely-blue text-white rounded-lg hover:bg-navy"
        >
          <BookOpen className="w-5 h-5" />
          Create First Entry
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
      {entries.map((entry) => (
        <div key={entry.id} className="p-6 hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h3 className="text-lg font-semibold text-gray-900">{entry.question}</h3>

                {entry.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    <Eye className="w-3 h-3" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    <EyeOff className="w-3 h-3" />
                    Inactive
                  </span>
                )}

                {entry.category && (
                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">{entry.category}</span>
                )}
              </div>

              <p className="text-gray-600 text-sm line-clamp-2 mb-2">{entry.answer}</p>

              <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                <span>Keywords: {entry.keywords.join(', ') || '—'}</span>
                <span>Priority: {entry.priority}</span>
                <span>Order: {entry.displayOrder}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <Link
                href={`/admin/chatbot/knowledge/${entry.id}/edit`}
                className="p-2 text-gray-600 hover:bg-gray-100 hover:text-navy rounded-lg transition-colors"
                title="Edit entry"
              >
                <Edit className="w-4 h-4" />
              </Link>
              <button
                onClick={() => handleDelete(entry.id)}
                disabled={deletingId === entry.id}
                className="p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
                title="Delete entry"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
