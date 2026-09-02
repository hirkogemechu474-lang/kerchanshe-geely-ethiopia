import apiClient from '@/lib/apiClient';

export const settingsService = {
  business: {
    get: async () => {
      const { data } = await apiClient.get('/admin/settings/business');
      return data;
    },
    update: async (payload: any) => {
      const { data } = await apiClient.patch('/admin/settings/business', payload);
      return data;
    },
  },
  contact: {
    get: async () => {
      const { data } = await apiClient.get('/admin/settings/contact');
      return data;
    },
    update: async (payload: any) => {
      const { data } = await apiClient.patch('/admin/settings/contact', payload);
      return data;
    },
  },
  social: {
    get: async () => {
      const { data } = await apiClient.get('/admin/settings/social');
      return data;
    },
    update: async (payload: any) => {
      const { data } = await apiClient.patch('/admin/settings/social', payload);
      return data;
    },
  },
  integrations: {
    get: async () => {
      const { data } = await apiClient.get('/admin/settings/integrations');
      return data;
    },
    update: async (payload: any) => {
      const { data } = await apiClient.patch('/admin/settings/integrations', payload);
      return data;
    },
  },
};
