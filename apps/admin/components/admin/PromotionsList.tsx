'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Eye, Calendar, Zap, Plus } from 'lucide-react';
import { Button, LinkButton, Card, EmptyState, Badge } from '@/components/admin/ui';

interface Promotion {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  bannerImage: string | null;
  isFeatured: boolean;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
}

export default function PromotionsList() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired' | 'featured'>('all');

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const response = await fetch('/api/admin/promotions');
      const data = await response.json();
      setPromotions(data.promotions || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;

    try {
      const response = await fetch(`/api/admin/promotions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPromotions(promotions.filter(p => p.id !== id));
      }
    } catch (error) {
      console.error('Error deleting promotion:', error);
    }
  };

  const isPromotionActive = (promo: Promotion) => {
    const now = new Date();
    const start = new Date(promo.startDate);
    const end = new Date(promo.endDate);
    return now >= start && now <= end;
  };

  const filteredPromotions = promotions.filter(p => {
    if (filter === 'active') return isPromotionActive(p) && p.isActive;
    if (filter === 'expired') return !isPromotionActive(p) || !p.isActive;
    if (filter === 'featured') return p.isFeatured;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center p-12 text-gray-500">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>
            All ({promotions.length})
          </Button>
          <Button size="sm" variant={filter === 'active' ? 'primary' : 'secondary'} onClick={() => setFilter('active')}>
            Active ({promotions.filter(p => isPromotionActive(p) && p.isActive).length})
          </Button>
          <Button size="sm" variant={filter === 'featured' ? 'primary' : 'secondary'} onClick={() => setFilter('featured')}>
            Featured ({promotions.filter(p => p.isFeatured).length})
          </Button>
        </div>
        <LinkButton href="/admin/promotions/new">
          <Plus size={16} />
          New Promotion
        </LinkButton>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromotions.map((promotion) => {
          const active = isPromotionActive(promotion);
          return (
            <Card key={promotion.id} padding="none" interactive className="overflow-hidden">
              {/* Banner Image */}
              <div className="relative h-40 bg-gradient-to-br from-blue-100 to-purple-100">
                {promotion.bannerImage ? (
                  <img
                    src={promotion.bannerImage}
                    alt={promotion.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Zap size={32} />
                  </div>
                )}
                {promotion.isFeatured && (
                  <div className="absolute top-2 right-2">
                    <Badge tone="orange">FEATURED</Badge>
                  </div>
                )}
                {active && (
                  <div className="absolute top-2 left-2">
                    <Badge tone="green">ACTIVE</Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 space-y-3">
                <h3 className="font-bold text-navy text-lg line-clamp-2">{promotion.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{promotion.description}</p>

                {/* Dates */}
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar size={14} />
                  <span>{new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link
                    href={`/admin/promotions/${promotion.id}`}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-geely-blue hover:text-blue-900 font-medium"
                  >
                    <Edit size={14} />
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(promotion.id)}
                    className="flex-1 flex items-center justify-center gap-1 text-sm text-red-600 hover:text-red-900 font-medium"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredPromotions.length === 0 && (
        <Card padding="none">
          <EmptyState icon={Zap} title="No promotions found" />
        </Card>
      )}
    </div>
  );
}
