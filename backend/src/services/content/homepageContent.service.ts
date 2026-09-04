import { contentRepository } from '../../repositories';

export const homepageContentService = {
  async getHomepageContent(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const [heroSections, showcases, featuredVehicles, faqs] = await Promise.all([
        contentRepository.findActiveHeroSections(),
        contentRepository.findActiveShowcases(),
        import('../../repositories/index.js').then((r) =>
          r.vehicleRepository.findManyPublic({ isActive: true, status: 'published', isFeatured: true }, 6)
        ),
        contentRepository.findActiveFaqs({ featuredOnly: true, limit: 6 }),
      ]);

      return {
        ok: true,
        data: {
          heroSections,
          showcases,
          featuredVehicles,
          faqs,
        },
      };
    } catch (error: any) {
      console.error('[HOMEPAGE CONTENT ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch homepage content.' };
    }
  },

  async getHeroSections(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const sections = await contentRepository.findActiveHeroSections();
      return { ok: true, data: sections };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch hero sections.' };
    }
  },

  async listHeroSections(includeInactive = false): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const sections = await contentRepository.findHeroSections(includeInactive);
      return { ok: true, data: sections };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch hero sections.' };
    }
  },

  async createHeroSection(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const section = await contentRepository.createHeroSection(data);
      return { ok: true, data: section };
    } catch (error: any) {
      return { ok: false, error: 'Failed to create hero section.' };
    }
  },

  async updateHeroSection(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const section = await contentRepository.updateHeroSection(id, data);
      return { ok: true, data: section };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update hero section.' };
    }
  },

  async deleteHeroSection(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await contentRepository.deleteHeroSection(id);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: 'Failed to delete hero section.' };
    }
  },

  async listShowcases(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const showcases = await contentRepository.findAllShowcases();
      return { ok: true, data: showcases };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch showcases.' };
    }
  },

  async createShowcase(data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const showcase = await contentRepository.createShowcase(data);
      return { ok: true, data: showcase };
    } catch (error: any) {
      return { ok: false, error: 'Failed to create showcase.' };
    }
  },

  async updateShowcase(id: string, data: any): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const showcase = await contentRepository.updateShowcase(id, data);
      return { ok: true, data: showcase };
    } catch (error: any) {
      return { ok: false, error: 'Failed to update showcase.' };
    }
  },

  async deleteShowcase(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await contentRepository.deleteShowcase(id);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: 'Failed to delete showcase.' };
    }
  },
};
