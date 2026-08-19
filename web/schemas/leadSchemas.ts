/**
 * Zod validation schemas for lead / form submissions.
 * The app uses react-hook-form; wire these into useForm({ resolver: zodResolver(schema) }).
 *
 * NOTE: zod is not yet in package.json. Add it with:
 *   npm install zod @hookform/resolvers --workspace apps/web
 */

// ─── Inline minimal type-safe validators without Zod ──────────────────────────
// These work today without a new dependency.
// Replace with Zod schemas when you add zod to the project.

export interface TestDriveFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleInterest: string;
  dealerLocation: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  consentGiven: boolean;
}

export interface QuoteFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleInterest: string;
  purchaseTimeframe: string;
  financingNeeded: boolean;
  tradeIn: boolean;
  tradeInDetails?: string;
  message?: string;
  consentGiven: boolean;
}

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhone(phone: string): boolean {
  // Ethiopian mobile: +251 9x or +251 7x or local 09x/07x
  return /^(\+2519|\+2517|09|07)\d{8}$/.test(phone.replace(/[\s-]/g, ''));
}
