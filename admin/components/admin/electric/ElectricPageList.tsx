'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Edit, Trash2, CheckCircle, XCircle, MapPin, Home, Zap, FileText } from 'lucide-react';

interface ElectricPage {
  id: string;
  title: string;
  slug: string;
  pageType: string;
  isPublished: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

const PAGE_TYPE_ICONS = {
  'charging-map': MapPin,
  'home-charging': Home,
  'fast-charging': Zap,
  'custom': FileText,
};

const PAGE_TYPE_LABELS = {
  'charging-map': 'Charging Map',
  'home-charging': 'Home Charging',
  'fast-charging': 'Fast Charging',
  'custom': 'Custom Page',
};

export default function ElectricPageList() {
  const [pages, setPages] = useState<ElectricPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const response = await fetch('/api/admin/electric');
      const data = await response.json();
      setPages(data.pages || []);
    } catch (error) {
      console.error('Error fetching electric pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/electric/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPages(pages.filter(p => p.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    } finally {
      setDeleting(false);
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/electric/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus }),
      });

      if (response.ok) {
        fetchPages();
      } else {
        alert('Failed to update publish status');
      }
    } catch (error) {
      console.error('Error updating page:', error);
      alert('Failed to update publish status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading electric pages...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {pages.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <Zap className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No electric pages yet</h3>
          <p className="text-sm mb-4">Create your first electric mobility page</p>
          <Link
            href="/admin/electric/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Zap className="w-4 h-4" />
            Create Electric Page
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-12">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pages.map((page) => {
                const Icon = PAGE_TYPE_ICONS[page.pageType as keyof typeof PAGE_TYPE_ICONS] || FileText;
                const typeLabel = PAGE_TYPE_LABELS[page.pageType as keyof typeof PAGE_TYPE_LABELS] || page.pageType;
                
                return (
                  <tr key={page.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">{page.displayOrder}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{page.title}</div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">/electric/{page.slug}</code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <Icon size={12} />
                        {typeLabel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(page.id, page.isPublished)}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          page.isPublished
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {page.isPublished ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        {page.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`/electric/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          title="View page"
                        >
                          <Eye size={18} />
                        </a>
                        <Link
                          href={`/admin/electric/${page.id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(page.id)}
                          disabled={deleting}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
