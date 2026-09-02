import { contentRepository, newsRepository, promotionRepository, reviewRepository } from '../../repositories';

export const publicContentService = {
  async getBrands(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const brands = await contentRepository.findActiveBrands();
      return { ok: true, data: brands };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch brands.' };
    }
  },

  async getCategories(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const categories = await contentRepository.findActiveCategories();
      return { ok: true, data: categories };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch categories.' };
    }
  },

  async getCategoryBySlug(slug: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const category = await contentRepository.findActiveCategoryBySlug(slug);
      if (!category) return { ok: false, error: 'Category not found.' };
      return { ok: true, data: category };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch category.' };
    }
  },

  async getFaqs(params?: { category?: string; featuredOnly?: boolean; limit?: number }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const faqs = await contentRepository.findActiveFaqs(params);
      return { ok: true, data: faqs };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch FAQs.' };
    }
  },

  async getFaqCategories(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const categories = await contentRepository.findActiveFaqCategories();
      return { ok: true, data: categories };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch FAQ categories.' };
    }
  },

  async getNews(limit = 6): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const articles = await newsRepository.findPublished(limit);
      return { ok: true, data: articles };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch news.' };
    }
  },

  async getPromotions(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const promotions = await promotionRepository.findActive();
      return { ok: true, data: promotions };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch promotions.' };
    }
  },

  async getReviews(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const reviews = await reviewRepository.findApprovedActive({ limit: 10 });
      return { ok: true, data: reviews };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch reviews.' };
    }
  },

  async getSiteNavItems(placement?: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const items = await contentRepository.findActiveSiteNavItems(placement as any);
      return { ok: true, data: items };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch navigation items.' };
    }
  },
};
