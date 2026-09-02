'use client';

import { useState, useEffect } from 'react';
import type { Part } from '@/services/partsService';
import apiClient from '@/lib/apiClient';

export function useParts(params?: { category?: string; search?: string }) {
  const [partsList, setPartsList] = useState<Part[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    const fetchParts = async () => {
      try {
        let url = '/parts';
        const queryParts: string[] = [];
        if (params?.category) queryParts.push(`category=${params.category}`);
        if (params?.search) queryParts.push(`search=${encodeURIComponent(params.search)}`);
        if (queryParts.length) url += `?${queryParts.join('&')}`;

        const { data } = await apiClient.get(url);
        setPartsList(Array.isArray(data) ? data : data.parts || []);
      } catch {
        setPartsList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchParts();
  }, [params?.category, params?.search]);

  return { parts: partsList, loading };
}
