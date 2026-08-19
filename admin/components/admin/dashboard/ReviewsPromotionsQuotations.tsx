'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Star, Zap, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface Stats {
  reviews: {
    pending: number;
    approved: number;
    total: number;
  };
  promotions: {
    active: number;
    featured: number;
    total: number;
  };
  quotations: {
    new: number;
    contacted: number;
    inProgress: number;
    converted: number;
    closed: number;
    total: number;
  };
}

export default function ReviewsPromotionsQuotations() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [reviewsRes, promotionsRes, quotationsRes] = await Promise.all([
        fetch('/api/admin/reviews'),
        fetch('/api/admin/promotions'),
        fetch('/api/admin/quotations'),
      ]);

      let reviewsData = { pending: 0, approved: 0, total: 0 };
      let promotionsData = { active: 0, featured: 0, total: 0 };
      let quotationsData = { new: 0, contacted: 0, inProgress: 0, converted: 0, closed: 0, total: 0 };

      if (reviewsRes.ok) {
        const reviews = await reviewsRes.json();
        const reviewsArray = Array.isArray(reviews) ? reviews : reviews?.reviews || [];
        reviewsData = {
          pending: reviewsArray.filter((r: any) => r.status === 'pending').length,
          approved: reviewsArray.filter((r: any) => r.status === 'approved').length,
          total: reviewsArray.length,
        };
      }

      if (promotionsRes.ok) {
        const promotions = await promotionsRes.json();
        const promotionsArray = Array.isArray(promotions) ? promotions : promotions?.promotions || [];
        const now = new Date();
        promotionsData = {
          active: promotionsArray.filter(
            (p: any) =>
              p.isActive &&
              new Date(p.startDate) <= now &&
              new Date(p.endDate) >= now
          ).length,
          featured: promotionsArray.filter((p: any) => p.isFeatured).length,
          total: promotionsArray.length,
        };
      }

      if (quotationsRes.ok) {
        const quotations = await quotationsRes.json();
        const quotationsArray = Array.isArray(quotations) ? quotations : quotations?.quotations || [];
        quotationsData = {
          new: quotationsArray.filter((q: any) => q.status === 'new').length,
          contacted: quotationsArray.filter((q: any) => q.status === 'contacted').length,
          inProgress: quotationsArray.filter((q: any) => q.status === 'in_progress').length,
          converted: quotationsArray.filter((q: any) => q.status === 'converted').length,
          closed: quotationsArray.filter((q: any) => q.status === 'closed').length,
          total: quotationsArray.length,
        };
      }

      setStats({
        reviews: reviewsData,
        promotions: promotionsData,
        quotations: quotationsData,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Reviews Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Customer Reviews</h3>
          <Star className="h-6 w-6 text-yellow-500" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Pending Approval</span>
            <span className="inline-flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="font-bold text-gray-900">{stats.reviews.pending}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Approved</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-bold text-gray-900">{stats.reviews.approved}</span>
            </span>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500 mb-2">Total: {stats.reviews.total}</p>
            <Link
              href="/admin/reviews"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage Reviews →
            </Link>
          </div>
        </div>
      </div>

      {/* Promotions Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Promotions</h3>
          <Zap className="h-6 w-6 text-pink-500" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Currently Active</span>
            <span className="inline-flex items-center gap-1">
              <div className="h-3 w-3 bg-green-500 rounded-full"></div>
              <span className="font-bold text-gray-900">{stats.promotions.active}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Featured</span>
            <span className="inline-flex items-center gap-1">
              <div className="h-3 w-3 bg-yellow-500 rounded-full"></div>
              <span className="font-bold text-gray-900">{stats.promotions.featured}</span>
            </span>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500 mb-2">Total: {stats.promotions.total}</p>
            <Link
              href="/admin/promotions"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage Promotions →
            </Link>
          </div>
        </div>
      </div>

      {/* Quotations Widget */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Quote Requests</h3>
          <FileText className="h-6 w-6 text-blue-500" />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">New</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="font-bold text-gray-900">{stats.quotations.new}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Converted</span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="font-bold text-gray-900">{stats.quotations.converted}</span>
            </span>
          </div>

          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500 mb-2">Total: {stats.quotations.total}</p>
            <Link
              href="/admin/quotations"
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Manage Quotations →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
