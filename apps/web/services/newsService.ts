import apiClient from '@/lib/apiClient';

export interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  image?: string;
  category?: string;
  publishedAt?: string;
  isFeatured?: boolean;
}

export async function getNewsBySlug(slug: string): Promise<NewsArticle> {
  const { data } = await apiClient.get(`/news/${slug}`);
  return data;
}

export async function getNewsById(id: string): Promise<NewsArticle> {
  const { data } = await apiClient.get(`/news/${id}`);
  return data;
}

export async function getLatestNews(limit?: number): Promise<NewsArticle[]> {
  const params = limit ? `?limit=${limit}` : '';
  const { data } = await apiClient.get(`/news${params}`);
  return Array.isArray(data) ? data : data.articles || [];
}

export async function getFeaturedNews(): Promise<NewsArticle[]> {
  const { data } = await apiClient.get('/news?featured=true');
  return Array.isArray(data) ? data : data.articles || [];
}

export async function getNewsByCategory(category: string): Promise<NewsArticle[]> {
  const { data } = await apiClient.get(`/news?category=${category}`);
  return Array.isArray(data) ? data : data.articles || [];
}

export const newsArticles = {
  list: getLatestNews,
  getBySlug: getNewsBySlug,
  getById: getNewsById,
  getFeatured: getFeaturedNews,
  getByCategory: getNewsByCategory,
};

export const newsCategories = ['Technology', 'Industry', 'Company News'];
