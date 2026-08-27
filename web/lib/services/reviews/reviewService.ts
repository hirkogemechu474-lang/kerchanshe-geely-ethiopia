import { reviewRepository } from '@/repositories/reviewRepository';
import { sendFormEmail } from '@/lib/form-email';

export async function submitReview(input: {
  fullName: string;
  email?: string | null;
  vehicleModel: string;
  rating: number;
  reviewTitle: string;
  reviewMessage: string;
}) {
  const review = await reviewRepository.create({
    fullName: input.fullName,
    email: input.email || null,
    vehicleModel: input.vehicleModel,
    rating: input.rating,
    reviewTitle: input.reviewTitle,
    reviewMessage: input.reviewMessage,
    status: 'pending', // Requires admin approval
    isFeatured: false,
    isActive: true,
  });

  let notificationSent = false;
  if (input.email) {
    try {
      notificationSent = await sendFormEmail({
        type: 'customer review',
        name: input.fullName,
        email: input.email,
        subject: `New review: ${input.reviewTitle}`,
        reference: review.id,
        details: `Vehicle: ${input.vehicleModel}\nRating: ${input.rating}/5\n\n${input.reviewMessage}`,
      });
    } catch (emailError) {
      console.error('[review:email]', emailError);
    }
  }

  return { review, notificationSent };
}
