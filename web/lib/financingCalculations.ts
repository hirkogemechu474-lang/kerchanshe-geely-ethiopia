export interface LoanCalculation {
  monthlyPayment: number;
  totalInterest: number;
  totalCost: number;
  amortizationSchedule: AmortizationEntry[];
}

export interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function calculateLoan(
  vehiclePrice: number,
  downPayment: number,
  loanPeriodMonths: number,
  annualInterestRate: number
): LoanCalculation {
  const loanAmount = vehiclePrice - downPayment;
  const monthlyInterestRate = annualInterestRate / 100 / 12;

  // Calculate monthly payment using the formula:
  // M = P * [r(1+r)^n] / [(1+r)^n - 1]
  const monthlyPayment =
    loanAmount *
    (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, loanPeriodMonths)) /
    (Math.pow(1 + monthlyInterestRate, loanPeriodMonths) - 1);

  // Generate amortization schedule
  const amortizationSchedule: AmortizationEntry[] = [];
  let remainingBalance = loanAmount;

  for (let month = 1; month <= loanPeriodMonths; month++) {
    const interestPayment = remainingBalance * monthlyInterestRate;
    const principalPayment = monthlyPayment - interestPayment;
    remainingBalance -= principalPayment;

    amortizationSchedule.push({
      month,
      payment: monthlyPayment,
      principal: principalPayment,
      interest: interestPayment,
      balance: Math.max(0, remainingBalance), // Ensure no negative balance
    });
  }

  const totalInterest = monthlyPayment * loanPeriodMonths - loanAmount;
  const totalCost = vehiclePrice + totalInterest;

  return {
    monthlyPayment,
    totalInterest,
    totalCost,
    amortizationSchedule,
  };
}

export function formatCurrency(amount: number): string {
  return `ETB ${amount.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1000000) {
    return `ETB ${(amount / 1000000).toFixed(2)}M`;
  }
  return formatCurrency(amount);
}

// Typical interest rates from Ethiopian banks
export const bankPartners = [
  { name: "Commercial Bank of Ethiopia", rate: 12.5 },
  { name: "Awash Bank", rate: 13.0 },
  { name: "Bank of Abyssinia", rate: 13.5 },
  { name: "Dashen Bank", rate: 12.75 },
  { name: "United Bank", rate: 13.25 },
];

export const loanTermOptions = [
  { months: 12, label: "1 Year" },
  { months: 24, label: "2 Years" },
  { months: 36, label: "3 Years" },
  { months: 48, label: "4 Years" },
  { months: 60, label: "5 Years" },
  { months: 72, label: "6 Years" },
  { months: 84, label: "7 Years" },
];
