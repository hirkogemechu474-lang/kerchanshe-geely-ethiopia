/** Financing constants */

export const DEFAULT_DOWN_PAYMENT_PERCENT = 20;
export const MIN_DOWN_PAYMENT_PERCENT = 20;
export const MAX_LOAN_TERM_MONTHS = 84;
export const DEFAULT_INTEREST_RATE = 13.5;

export const LOAN_TERM_OPTIONS = [
  { months: 12, label: '1 Year' },
  { months: 24, label: '2 Years' },
  { months: 36, label: '3 Years' },
  { months: 48, label: '4 Years' },
  { months: 60, label: '5 Years' },
  { months: 72, label: '6 Years' },
  { months: 84, label: '7 Years' },
] as const;

export const BANK_PARTNERS = [
  { name: 'Commercial Bank of Ethiopia', rate: 12.5 },
  { name: 'Awash Bank',                  rate: 13.0 },
  { name: 'Bank of Abyssinia',           rate: 13.5 },
  { name: 'Dashen Bank',                 rate: 12.75 },
  { name: 'United Bank',                 rate: 13.25 },
] as const;
