import apiClient from '@/lib/apiClient';

export interface Testimonial {
  id: string;
  name: string;
  content: string;
  rating: number;
  vehicleId?: string;
  vehicleName?: string;
  image?: string;
  isVideo?: boolean;
  videoUrl?: string;
  createdAt?: string;
}

export async function getTestimonialsByVehicle(vehicleId: string): Promise<Testimonial[]> {
  const { data } = await apiClient.get(`/testimonials?vehicleId=${vehicleId}`);
  return Array.isArray(data) ? data : data.testimonials || [];
}

export async function getTestimonialsByRating(rating: number): Promise<Testimonial[]> {
  const { data } = await apiClient.get(`/testimonials?rating=${rating}`);
  return Array.isArray(data) ? data : data.testimonials || [];
}

export async function getVideoTestimonials(): Promise<Testimonial[]> {
  const { data } = await apiClient.get('/testimonials?video=true');
  return Array.isArray(data) ? data : data.testimonials || [];
}

export async function getAverageRating(): Promise<number> {
  const { data } = await apiClient.get('/testimonials?stats=true');
  return data.averageRating || 0;
}

export async function getRatingCounts(): Promise<Record<number, number>> {
  const { data } = await apiClient.get('/testimonials?stats=true');
  return data.ratingCounts || {};
}

export const testimonials = {
  getByVehicle: getTestimonialsByVehicle,
  getByRating: getTestimonialsByRating,
  getVideo: getVideoTestimonials,
  getAverageRating,
  getRatingCounts,
};
