// Standard amortizing-loan math (reducing-balance monthly repayment) — the
// same calculation real bank finance calculators use (see e.g. Geely
// dealership finance-calculator pages). Illustrative only: every consumer
// of this must pair it with a "not a loan offer" disclaimer, since the
// bank's own credit assessment determines the real, final terms.

export interface LoanCalculationInput {
  vehiclePrice: number;
  downPaymentPercent: number; // 0-100
  annualInterestRatePercent: number; // e.g. 14.5
  tenureMonths: number;
}

export interface LoanCalculationResult {
  downPaymentAmount: number;
  principal: number;
  monthlyPayment: number;
  totalRepayable: number;
  totalInterest: number;
}

export function calculateLoan(input: LoanCalculationInput): LoanCalculationResult {
  const downPaymentAmount = Math.round((input.vehiclePrice * clamp(input.downPaymentPercent, 0, 100)) / 100);
  const principal = Math.max(0, input.vehiclePrice - downPaymentAmount);
  const monthlyRate = Math.max(0, input.annualInterestRatePercent) / 100 / 12;
  const months = Math.max(1, Math.round(input.tenureMonths));

  let monthlyPayment: number;
  if (monthlyRate === 0) {
    monthlyPayment = principal / months;
  } else {
    const factor = Math.pow(1 + monthlyRate, months);
    monthlyPayment = (principal * monthlyRate * factor) / (factor - 1);
  }

  const totalRepayableOnLoan = monthlyPayment * months;

  return {
    downPaymentAmount,
    principal,
    monthlyPayment: Math.round(monthlyPayment),
    totalRepayable: Math.round(totalRepayableOnLoan + downPaymentAmount),
    totalInterest: Math.round(totalRepayableOnLoan - principal),
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
