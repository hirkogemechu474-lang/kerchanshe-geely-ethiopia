'use client';

import { useState, useEffect } from 'react';
import { parts, getPartsByCategory, searchParts } from '@/services/partsService';

export function useParts(params?: { category?: string; search?: string }) {
  const [partsList, setPartsList] = useState<typeof parts>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    setTimeout(() => {
      let result = parts;
      if (params?.category) result = getPartsByCategory(params.category);
      if (params?.search) result = searchParts(params.search);
      setPartsList(result);
      setLoading(false);
    }, 200);
  }, [params?.category, params?.search]);

  return { parts: partsList, loading };
}
