/**
 * Financing calculation utilities.
 * Moved from lib/financingCalculations.ts — import from @/utils/financing
 */
export {
  calculateLoan,
  formatCurrency,
  formatCurrencyCompact,
  bankPartners,
  loanTermOptions,
} from '@/lib/financingCalculations';

export type {
  LoanCalculation,
  AmortizationEntry,
} from '@/lib/financingCalculations';
