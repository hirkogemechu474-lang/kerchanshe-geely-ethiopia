import { reviewRepository } from '../../repositories';

export const reviewService = {
  async listAll(): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const reviews = await reviewRepository.findAll();
      return { ok: true, data: reviews };
    } catch (error: any) {
      console.error('[REVIEW LIST ERROR]', error.message);
      return { ok: false, error: 'Failed to fetch reviews.' };
    }
  },

  async approve(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const review = await reviewRepository.update(id, { status: 'approved', isActive: true });
      return { ok: true, data: review };
    } catch (error: any) {
      return { ok: false, error: 'Failed to approve review.' };
    }
  },

  async reject(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const review = await reviewRepository.update(id, { status: 'rejected', isActive: false });
      return { ok: true, data: review };
    } catch (error: any) {
      return { ok: false, error: 'Failed to reject review.' };
    }
  },

  async toggleFeatured(id: string): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const review = await reviewRepository.findById(id);
      if (!review) return { ok: false, error: 'Review not found.' };

      const updated = await reviewRepository.update(id, { isFeatured: !review.isFeatured });
      return { ok: true, data: updated };
    } catch (error: any) {
      return { ok: false, error: 'Failed to toggle featured.' };
    }
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    try {
      await reviewRepository.delete(id);
      return { ok: true };
    } catch (error: any) {
      return { ok: false, error: 'Failed to delete review.' };
    }
  },

  async getApprovedPublic(params?: { featured?: boolean; limit?: number }): Promise<{ ok: boolean; data?: any; error?: string }> {
    try {
      const reviews = await reviewRepository.findApprovedActive(params);
      return { ok: true, data: reviews };
    } catch (error: any) {
      return { ok: false, error: 'Failed to fetch reviews.' };
    }
  },
};
