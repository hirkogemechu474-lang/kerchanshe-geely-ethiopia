'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/services/adminApiClient';
import type { Dealer } from '@/types/dealer';

export function useDealers(params?: { city?: string }) {
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    adminApi.dealers
      .list(params)
      .then((data) => {
        if (!cancelled) setDealers(Array.isArray(data) ? data : []);
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
  }, [params?.city]);

  return { dealers, loading, error };
}
