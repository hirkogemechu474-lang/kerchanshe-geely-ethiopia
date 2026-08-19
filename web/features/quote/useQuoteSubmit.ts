'use client';

import { useState } from 'react';
import { adminApi } from '@/services/adminApiClient';

export function useQuoteSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await adminApi.quote.submit(data);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit quote request');
    } finally {
      setLoading(false);
    }
  };

  return { submit, loading, error, success };
}
