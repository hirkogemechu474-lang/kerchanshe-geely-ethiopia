import { partsPageRepository } from '../../repositories';

export const partsContentService = {
  async getPageContent(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const [content, categories, brands, benefits, featuredParts] = await Promise.all([
        partsPageRepository.findContent(),
        partsPageRepository.findActiveCategories(),
        partsPageRepository.findActiveBrands(),
        partsPageRepository.findActiveBenefits(),
        partsPageRepository.findFeaturedParts(),
      ]);

      return {
        ok: true,
        data: {
          content,
          categories,
          brands,
          benefits,
          featuredParts,
        },
      };
    } catch (error: any) {
      console.error('[PARTS CONTENT ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch parts page content.' };
    }
  },

  async getFeaturedParts(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const parts = await partsPageRepository.findFeaturedParts();
      return { ok: true, data: parts };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch featured parts.' };
    }
  },

  async getExtraParts(limit = 8): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const parts = await partsPageRepository.findExtraParts(limit);
      return { ok: true, data: parts };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch extra parts.' };
    }
  },
};
