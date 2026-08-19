/**
 * Promotions Service — wraps lib/promotionsData static data.
 * Import from: @/services/promotionsService
 */
export {
  promotions,
  getActivePromotions,
  getFeaturedPromotions,
  getPromotionsByVehicle,
  getPromotionsByType,
} from '@/lib/promotionsData';

export type { Promotion } from '@/lib/promotionsData';
