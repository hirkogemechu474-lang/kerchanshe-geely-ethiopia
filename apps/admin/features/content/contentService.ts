import apiClient from '@/lib/apiClient';

export const contentService = {
  hero: {
    get: async () => {
      const { data } = await apiClient.get('/admin/content/hero');
      return data;
    },
    update: async (payload: any) => {
      const { data } = await apiClient.patch('/admin/content/hero', payload);
      return data;
    },
  },
  showcase: {
    list: async () => {
      const { data } = await apiClient.get('/admin/content/showcase');
      return data;
    },
    create: async (payload: any) => {
      const { data } = await apiClient.post('/admin/content/showcase', payload);
      return data;
    },
    update: async (id: string, payload: any) => {
      const { data } = await apiClient.patch(`/admin/content/showcase/${id}`, payload);
      return data;
    },
    delete: async (id: string) => {
      await apiClient.delete(`/admin/content/showcase/${id}`);
    },
  },
  pages: {
    list: async () => {
      const { data } = await apiClient.get('/admin/content/pages');
      return data;
    },
    get: async (slug: string) => {
      const { data } = await apiClient.get(`/admin/content/pages/${slug}`);
      return data;
    },
    update: async (slug: string, payload: any) => {
      const { data } = await apiClient.patch(`/admin/content/pages/${slug}`, payload);
      return data;
    },
  },
};
