/**
 * Testimonials Service — wraps lib/testimonialsData static data.
 * Import from: @/services/testimonialsService
 */
export {
  testimonials,
  getTestimonialsByVehicle,
  getTestimonialsByRating,
  getVideoTestimonials,
  getAverageRating,
  getRatingCounts,
} from '@/lib/testimonialsData';

export type { Testimonial } from '@/lib/testimonialsData';
