'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, Edit, Trash2, GripVertical, CheckCircle, XCircle, Image as ImageIcon, Video } from 'lucide-react';
import { TableCard, THead, TBody, Tr, Th, Td, EmptyState, Badge, LinkButton } from '@/components/admin/ui';

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
      const response = await fetch('/api/content/hero-sections?includeInactive=true');
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

  if (heroSections.length === 0) {
    return (
      <EmptyState
        icon={ImageIcon}
        title="No hero sections yet"
        description="Create your first hero section to display on the homepage"
        action={
          <LinkButton href="/admin/content/hero/new">
            <ImageIcon className="w-4 h-4" />
            Create Hero Section
          </LinkButton>
        }
      />
    );
  }

  return (
    <TableCard>
      <THead>
        <tr>
          <Th className="w-12">Order</Th>
          <Th>Preview</Th>
          <Th>Title</Th>
          <Th>Type</Th>
          <Th>Status</Th>
          <Th className="text-right">Actions</Th>
        </tr>
      </THead>
      <TBody>
        {heroSections.map((hero) => (
          <Tr key={hero.id}>
            <Td>
              <div className="flex items-center gap-2">
                <GripVertical className="text-gray-400" size={16} />
                <span className="text-gray-600">{hero.sortOrder}</span>
              </div>
            </Td>
            <Td>
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
            </Td>
            <Td>
              <div className="font-medium text-gray-900">{hero.title}</div>
              {hero.subtitle && (
                <div className="text-xs text-gray-500 mt-1">{hero.subtitle}</div>
              )}
            </Td>
            <Td>
              <Badge tone={hero.mediaType === 'VIDEO' ? 'purple' : 'blue'}>
                <span className="inline-flex items-center gap-1">
                  {hero.mediaType === 'VIDEO' ? <Video size={12} /> : <ImageIcon size={12} />}
                  {hero.mediaType}
                </span>
              </Badge>
            </Td>
            <Td>
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
            </Td>
            <Td className="text-right">
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
                  className="p-2 text-geely-blue hover:bg-blue-50 rounded transition-colors"
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
            </Td>
          </Tr>
        ))}
      </TBody>
    </TableCard>
  );
}
