'use client';

import { useState, useEffect } from 'react';
import { testimonials, getTestimonialsByVehicle } from '@/services/testimonialsService';

export function useReviews(vehicleId?: string) {
  const [reviews, setReviews] = useState(testimonials);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const filtered = vehicleId ? getTestimonialsByVehicle(vehicleId) : testimonials;
      setReviews(filtered);
      setLoading(false);
    }, 100);
  }, [vehicleId]);

  return { reviews, loading };
}
