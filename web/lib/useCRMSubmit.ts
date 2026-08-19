import { useState } from 'react';

interface LeadData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  leadSource?: string;
  leadType: 'test-drive' | 'quote' | 'contact' | 'service';
  modelInterest?: string;
  vehicleId?: string;
  trimInterest?: string;
  message?: string;
  preferredDealer?: string;
  preferredDate?: string;
  preferredTime?: string;
  financingInterest?: boolean;
  consentGiven: boolean;
}

interface SubmitResponse {
  success: boolean;
  message: string;
  leadId?: string;
  duplicate?: boolean;
  notificationSent?: boolean;
}

export function useCRMSubmit() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SubmitResponse | null>(null);

  const submitLead = async (leadData: LeadData): Promise<SubmitResponse> => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Capture UTM parameters from URL
      const urlParams = new URLSearchParams(window.location.search);
      const utm_source = urlParams.get('utm_source') || undefined;
      const utm_medium = urlParams.get('utm_medium') || undefined;
      const utm_campaign = urlParams.get('utm_campaign') || undefined;
      const pageUrl = window.location.href;

      // Add source tracking
      const enrichedData = {
        ...leadData,
        leadSource: leadData.leadSource || 'Website',
        utm_source,
        utm_medium,
        utm_campaign,
        pageUrl
      };

      const response = await fetch('/api/crm/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(enrichedData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit lead');
      }

      setSuccess(data);
      return data;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkLeadExists = async (email?: string, phone?: string): Promise<boolean> => {
    if (!email && !phone) return false;

    try {
      const params = new URLSearchParams();
      if (email) params.append('email', email);
      if (phone) params.append('phone', phone);

      const response = await fetch(`/api/crm/lead?${params.toString()}`);
      const data = await response.json();

      return data.exists || false;
    } catch (err) {
      console.error('Error checking lead:', err);
      return false;
    }
  };

  const reset = () => {
    setLoading(false);
    setError(null);
    setSuccess(null);
  };

  return {
    submitLead,
    checkLeadExists,
    loading,
    error,
    success,
    reset
  };
}
