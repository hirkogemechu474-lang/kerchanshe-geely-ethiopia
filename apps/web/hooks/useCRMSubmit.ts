'use client';

import { useState } from 'react';
import apiClient from '@/lib/apiClient';

interface UseCRMSubmitResult {
  submitLead: (typeOrData: string | any, data?: any) => Promise<any>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

export function useCRMSubmit(): UseCRMSubmitResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitLead = async (typeOrData: string | any, data?: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const type = typeof typeOrData === 'string' ? typeOrData : 'crm/lead';
      const payload = typeof typeOrData === 'string' ? data : typeOrData;
      const response = await apiClient.post(`/${type}`, payload);
      setSuccess(true);
      return response.data;
    } catch (err: any) {
      const message = err.response?.data?.error || err.message || 'Submission failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitLead, loading, error, success };
}
