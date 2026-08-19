'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Edit, Trash2, GripVertical, CheckCircle, XCircle, Image as ImageIcon, Video } from 'lucide-react';

interface HeroSection {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  mediaType: string;
  imageUrl: string | null;
  videoUrl: string | null;
  posterUrl: string | null;
  buttonText: string | null;
  buttonLink: string | null;
  status: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

export default function HeroSectionList() {
  const [heroSections, setHeroSections] = useState<HeroSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchHeroSections();
  }, []);

  const fetchHeroSections = async () => {
    try {
      const response = await fetch('/api/admin/hero?includeInactive=true');
      const data = await response.json();
      setHeroSections(data.heroSections || []);
    } catch (error) {
      console.error('Error fetching hero sections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero section?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/hero/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setHeroSections(heroSections.filter(h => h.id !== id));
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete hero section');
      }
    } catch (error) {
      console.error('Error deleting hero section:', error);
      alert('Failed to delete hero section');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/hero/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (response.ok) {
        fetchHeroSections(); // Refresh list
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating hero section:', error);
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading hero sections...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {heroSections.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hero sections yet</h3>
          <p className="text-sm mb-4">Create your first hero section to display on the homepage</p>
          <Link
            href="/admin/content/hero/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <ImageIcon className="w-4 h-4" />
            Create Hero Section
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
                  Preview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Title
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
              {heroSections.map((hero) => (
                <tr key={hero.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <GripVertical className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-600">{hero.sortOrder}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-24 h-14 bg-gray-100 rounded overflow-hidden">
                      {hero.mediaType === 'IMAGE' && hero.imageUrl ? (
                        <img 
                          src={hero.imageUrl} 
                          alt={hero.title}
                          className="w-full h-full object-cover"
                        />
                      ) : hero.mediaType === 'VIDEO' && (hero.posterUrl || hero.videoUrl) ? (
                        <img 
                          src={hero.posterUrl || hero.videoUrl || ''} 
                          alt={hero.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="text-gray-300" size={20} />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{hero.title}</div>
                    {hero.subtitle && (
                      <div className="text-xs text-gray-500 mt-1">{hero.subtitle}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      hero.mediaType === 'VIDEO' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {hero.mediaType === 'VIDEO' ? <Video size={12} /> : <ImageIcon size={12} />}
                      {hero.mediaType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(hero.id, hero.isActive)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                        hero.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {hero.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {hero.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="View on homepage"
                      >
                        <Eye size={18} />
                      </a>
                      <Link
                        href={`/admin/content/hero/${hero.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit size={18} />
                      </Link>
                      <button
                        onClick={() => handleDelete(hero.id)}
                        disabled={deleting}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
