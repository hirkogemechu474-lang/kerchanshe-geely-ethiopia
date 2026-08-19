/**
 * News Service — wraps lib/newsData static data.
 * Import from: @/services/newsService
 */
export {
  newsArticles,
  newsCategories,
  getFeaturedNews,
  getNewsByCategory,
  getLatestNews,
  getNewsById,
  getNewsBySlug,
} from '@/lib/newsData';

export type { NewsArticle } from '@/lib/newsData';
