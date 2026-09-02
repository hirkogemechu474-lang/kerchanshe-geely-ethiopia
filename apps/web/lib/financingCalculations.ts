export interface LoanCalculation {
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  amortization?: AmortizationEntry[];
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function calculateLoan(principal: number, rate: number, termMonths: number): LoanCalculation {
  const monthlyRate = rate / 100 / 12;
  const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
  const totalPayment = monthlyPayment * termMonths;
  const totalInterest = totalPayment - principal;

  return {
    principal,
    interestRate: rate,
    termMonths,
    monthlyPayment,
    totalPayment,
    totalInterest,
  };
}

export function formatCurrency(amount: number, currency: string = 'ETB'): string {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number, currency: string = 'ETB'): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ${currency}`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K ${currency}`;
  return formatCurrency(amount, currency);
}

export const bankPartners = [
  { id: '1', name: 'Commercial Bank of Ethiopia', logo: '/images/banks/cbe.png' },
  { id: '2', name: 'Dashen Bank', logo: '/images/banks/dashen.png' },
  { id: '3', name: 'Awash Bank', logo: '/images/banks/awash.png' },
];

export const loanTermOptions = [
  { value: 12, label: '12 months' },
  { value: 24, label: '24 months' },
  { value: 36, label: '36 months' },
  { value: 48, label: '48 months' },
  { value: 60, label: '60 months' },
];
