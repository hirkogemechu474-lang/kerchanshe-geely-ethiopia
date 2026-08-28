import { reviewRepository } from '@/repositories/reviewRepository';
import { sendStatusEmail } from '@/lib/status-email';

export interface UpdateReviewInput {
  status?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  reviewTitle?: string;
  reviewMessage?: string;
}

export async function updateReview(id: string, input: UpdateReviewInput) {
  const review = await reviewRepository.update(id, {
    ...(input.status && { status: input.status }),
    ...(input.isFeatured !== undefined && { isFeatured: input.isFeatured }),
    ...(input.isActive !== undefined && { isActive: input.isActive }),
    ...(input.reviewTitle && { reviewTitle: input.reviewTitle }),
    ...(input.reviewMessage && { reviewMessage: input.reviewMessage }),
  });

  if (input.status && ['approved', 'rejected'].includes(input.status) && review.email) {
    try {
      await sendStatusEmail({
        to: review.email,
        name: review.fullName,
        entityType: 'Review',
        status: input.status,
        reference: review.id,
        details: review.reviewTitle,
      });
    } catch (error) {
      console.error('[status-email] review', error);
    }
  }

  return review;
}
