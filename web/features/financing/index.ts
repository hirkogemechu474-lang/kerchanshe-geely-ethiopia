/**
 * Financing feature barrel.
 */
export { calculateLoan, bankPartners, loanTermOptions } from '@/lib/financingCalculations';
export { BANK_PARTNERS, LOAN_TERM_OPTIONS }              from '@/constants/financing';
export type { LoanCalculation, AmortizationEntry }       from '@/lib/financingCalculations';
