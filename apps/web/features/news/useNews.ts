'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/services/adminApiClient';

export function useNews(params?: { category?: string; limit?: number }) {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const query: Record<string, string> = {};
    if (params?.category) query.category = params.category;
    if (params?.limit) query.limit = String(params.limit);

    adminApi.news
      .list(query)
      .then((data) => {
        if (!cancelled) setNews(Array.isArray(data) ? data : []);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params?.category, params?.limit]);

  return { news, loading, error };
}
