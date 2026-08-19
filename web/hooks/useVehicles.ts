'use client';

import { useState, useEffect } from 'react';
import type { VehicleRecord } from '@/types/vehicle';

interface UseVehiclesOptions {
  category?: string;
  featured?: boolean;
  enabled?: boolean;
}

interface UseVehiclesResult {
  vehicles: VehicleRecord[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Client-side hook for fetching vehicles from the public API.
 * For server components, import getVehicles() from @/services/vehicleService directly.
 */
export function useVehicles(options: UseVehiclesOptions = {}): UseVehiclesResult {
  const { category, featured, enabled = true } = options;
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [tick, setTick]         = useState(0);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (category) params.set('category', category);
    if (featured) params.set('featured', 'true');

    fetch(`/api/public/vehicles${params.size ? `?${params}` : ''}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);
        return res.json() as Promise<VehicleRecord[] | { vehicles: VehicleRecord[] }>;
      })
      .then((data) => {
        if (!cancelled) {
          const list = Array.isArray(data) ? data : data.vehicles ?? [];
          setVehicles(list);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [category, featured, enabled, tick]);

  return { vehicles, loading, error, refetch: () => setTick((t) => t + 1) };
}
