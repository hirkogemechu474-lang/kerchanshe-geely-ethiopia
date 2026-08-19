'use client';

import { useState, useEffect } from 'react';
import { adminApi } from '@/services/adminApiClient';

export function useServiceMenu() {
  const [menu, setMenu] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.services
      .getMenu()
      .then((data) => setMenu(data.sections || []))
      .catch(() => setMenu([]))
      .finally(() => setLoading(false));
  }, []);

  return { menu, loading };
}
