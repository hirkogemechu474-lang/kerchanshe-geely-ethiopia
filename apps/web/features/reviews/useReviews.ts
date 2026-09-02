'use client';

import { useState, useEffect } from 'react';
import type { Testimonial } from '@/services/testimonialsService';
import apiClient from '@/lib/apiClient';

export function useReviews(vehicleId?: string) {
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const fetch = async () => {
      try {
        const url = vehicleId ? `/testimonials?vehicleId=${vehicleId}` : '/testimonials';
        const { data } = await apiClient.get(url);
        setReviews(Array.isArray(data) ? data : data.testimonials || []);
      } catch {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [vehicleId]);

  return { reviews, loading };
}
