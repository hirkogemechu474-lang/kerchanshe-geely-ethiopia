/**
 * Dealers Feature Module
 * Manages dealer locations, contact info, and services
 */

export { dealerRepository } from '@/repositories/dealerRepository';
export type { Dealer } from '@/types/dealer';

// Client-side hook for fetching dealers via Admin API
export { useDealers } from './useDealers';
