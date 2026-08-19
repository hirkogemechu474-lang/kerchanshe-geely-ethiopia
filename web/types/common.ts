/**
 * Shared utility types used across the public website.
 */

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagination?: PaginationMeta;
  };
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
}

export type Status = 'idle' | 'loading' | 'success' | 'error';

export interface FormState<T = void> {
  status: Status;
  data?: T;
  error?: string;
}
