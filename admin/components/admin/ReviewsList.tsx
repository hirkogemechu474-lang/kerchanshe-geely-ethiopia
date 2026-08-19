'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Eye, Star, CheckCircle, XCircle, Loader } from 'lucide-react';
import { Button, TableCard, THead, TBody, Tr, Th, Td, EmptyTableRow } from '@/components/admin/ui';

interface Review {
  id: string;
  fullName: string;
  email: string;
  vehicleModel: string;
  rating: number;
  reviewTitle: string;
  reviewMessage: string;
  profileImage: string | null;
  status: string;
  isFeatured: boolean;
  createdAt: string;
}

export default function ReviewsList() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/admin/reviews');
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFeatured: !currentStatus }),
      });

      if (response.ok) {
        setReviews(reviews.map(r => r.id === id ? { ...r, isFeatured: !currentStatus } : r));
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const filteredReviews = filter === 'all'
    ? reviews
    : reviews.filter(r => r.status === filter);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button size="sm" variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>
          All ({reviews.length})
        </Button>
        <Button size="sm" variant={filter === 'pending' ? 'primary' : 'secondary'} onClick={() => setFilter('pending')}>
          Pending ({reviews.filter(r => r.status === 'pending').length})
        </Button>
        <Button size="sm" variant={filter === 'approved' ? 'primary' : 'secondary'} onClick={() => setFilter('approved')}>
          Approved ({reviews.filter(r => r.status === 'approved').length})
        </Button>
        <Button size="sm" variant={filter === 'rejected' ? 'primary' : 'secondary'} onClick={() => setFilter('rejected')}>
          Rejected ({reviews.filter(r => r.status === 'rejected').length})
        </Button>
      </div>

      {/* Reviews Table */}
      <TableCard>
        <THead>
          <tr>
            <Th>Customer</Th>
            <Th>Model</Th>
            <Th>Rating</Th>
            <Th>Status</Th>
            <Th>Featured</Th>
            <Th>Actions</Th>
          </tr>
        </THead>
        <TBody>
          {filteredReviews.map((review) => (
            <Tr key={review.id}>
              <Td>
                <div className="flex items-center gap-3">
                  {review.profileImage && (
                    <img src={review.profileImage} alt={review.fullName} className="w-8 h-8 rounded-full object-cover" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{review.fullName}</p>
                    <p className="text-xs text-gray-500">{review.email}</p>
                  </div>
                </div>
              </Td>
              <Td>{review.vehicleModel || '-'}</Td>
              <Td>
                <div className="flex gap-0.5">
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                </div>
              </Td>
              <Td>
                <select
                  value={review.status}
                  onChange={(e) => handleStatusChange(review.id, e.target.value)}
                  className={`px-2 py-1 rounded text-sm font-medium border-0 cursor-pointer ${
                    review.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : review.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Td>
              <Td>
                <button
                  onClick={() => handleToggleFeatured(review.id, review.isFeatured)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    review.isFeatured
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {review.isFeatured ? 'Featured' : 'Not Featured'}
                </button>
              </Td>
              <Td>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/reviews/${review.id}`}
                    className="text-blue-600 hover:text-blue-900"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="text-red-600 hover:text-red-900"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </Td>
            </Tr>
          ))}
          {filteredReviews.length === 0 && <EmptyTableRow colSpan={6} message="No reviews found" />}
        </TBody>
      </TableCard>
    </div>
  );
}
