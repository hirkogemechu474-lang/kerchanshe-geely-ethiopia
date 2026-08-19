"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  calculateLoan,
  formatCurrency,
  bankPartners,
  loanTermOptions,
  type LoanCalculation,
} from "@/lib/financingCalculations";
import { ChevronDown, ChevronUp, Calculator, Download } from "lucide-react";

interface FinancingCalculatorProps {
  defaultPrice?: number;
  vehicleName?: string;
}

export default function FinancingCalculator({
  defaultPrice = 3000000,
  vehicleName,
}: FinancingCalculatorProps) {
  const initialPrice = Number.isFinite(defaultPrice) && defaultPrice > 0 ? defaultPrice : 3000000;
  const [vehiclePrice, setVehiclePrice] = useState(initialPrice);
  const [downPayment, setDownPayment] = useState(initialPrice * 0.2);
  const [loanPeriodMonths, setLoanPeriodMonths] = useState(36);
  const [interestRate, setInterestRate] = useState(12.5);
  const [showAmortization, setShowAmortization] = useState(false);
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);

  // Recalculate when inputs change
  useEffect(() => {
    if (vehiclePrice > 0 && downPayment >= 0 && downPayment < vehiclePrice) {
      const result = calculateLoan(vehiclePrice, downPayment, loanPeriodMonths, interestRate);
      setCalculation(result);
    }
  }, [vehiclePrice, downPayment, loanPeriodMonths, interestRate]);

  const downPaymentPercentage = vehiclePrice > 0 ? (downPayment / vehiclePrice) * 100 : 0;
  const loanAmount = vehiclePrice - downPayment;

  const handleDownPaymentPercentageChange = (percentage: number) => {
    setDownPayment((vehiclePrice * percentage) / 100);
  };

  return (
    <div className="bg-white rounded-lg border border-line shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-navy text-white p-6">
        <div className="flex items-center gap-3 mb-2">
          <Calculator size={24} />
          <h3 className="text-2xl font-bold">Financing Calculator</h3>
        </div>
        {vehicleName && (
          <p className="text-[#b9cbe4] text-sm">Calculate monthly payments for {vehicleName}</p>
        )}
      </div>

      {/* Calculator Form */}
      <div className="p-6 space-y-6">
        {/* Vehicle Price */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            Vehicle Price
          </label>
          <input
            type="number"
            value={vehiclePrice}
            onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) setVehiclePrice(v); }}
            className="w-full px-4 py-3 border border-line rounded-lg text-lg font-bold focus:outline-none focus:border-geely-blue"
          />
          <input
            type="range"
            min="1000000"
            max="10000000"
            step="100000"
            value={vehiclePrice}
            onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) setVehiclePrice(v); }}
            className="w-full mt-3 accent-geely-blue"
          />
          <div className="flex justify-between text-xs text-steel mt-1">
            <span>ETB 1M</span>
            <span>ETB 10M</span>
          </div>
        </div>

        {/* Down Payment */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            Down Payment ({downPaymentPercentage.toFixed(0)}%)
          </label>
          <input
            type="number"
            value={downPayment}
            onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) setDownPayment(v); }}
            className="w-full px-4 py-3 border border-line rounded-lg text-lg font-bold focus:outline-none focus:border-geely-blue"
          />
          <input
            type="range"
            min="0"
            max={vehiclePrice * 0.5}
            step="10000"
            value={downPayment}
            onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) setDownPayment(v); }}
            className="w-full mt-3 accent-geely-blue"
          />
          <div className="flex gap-2 mt-3">
            {[10, 20, 30, 40, 50].map((percent) => (
              <button
                key={percent}
                onClick={() => handleDownPaymentPercentageChange(percent)}
                className={`flex-1 px-3 py-2 text-xs font-semibold rounded transition-all ${
                  Math.abs(downPaymentPercentage - percent) < 1
                    ? "bg-geely-blue text-white"
                    : "bg-ice text-navy hover:bg-geely-blue hover:text-white"
                }`}
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        {/* Loan Period */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            Loan Period
          </label>
          <select
            value={loanPeriodMonths}
            onChange={(e) => setLoanPeriodMonths(Number(e.target.value))}
            className="w-full px-4 py-3 border border-line rounded-lg text-lg font-bold focus:outline-none focus:border-geely-blue"
          >
            {loanTermOptions.map((option) => (
              <option key={option.months} value={option.months}>
                {option.label} ({option.months} months)
              </option>
            ))}
          </select>
        </div>

        {/* Interest Rate */}
        <div>
          <label className="block text-sm font-semibold text-navy mb-2">
            Annual Interest Rate ({interestRate.toFixed(2)}%)
          </label>
          <input
            type="number"
            step="0.1"
            value={interestRate}
            onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) setInterestRate(v); }}
            className="w-full px-4 py-3 border border-line rounded-lg text-lg font-bold focus:outline-none focus:border-geely-blue"
          />
          <input
            type="range"
            min="5"
            max="20"
            step="0.5"
            value={interestRate}
            onChange={(e) => { const v = Number(e.target.value); if (Number.isFinite(v)) setInterestRate(v); }}
            className="w-full mt-3 accent-geely-blue"
          />
          
          {/* Bank Partners */}
          <div className="mt-3">
            <p className="text-xs text-steel mb-2">Typical rates from our partner banks:</p>
            <div className="grid grid-cols-2 gap-2">
              {bankPartners.map((bank) => (
                <button
                  key={bank.name}
                  onClick={() => setInterestRate(bank.rate)}
                  className="text-left px-3 py-2 bg-ice rounded text-xs hover:bg-geely-blue hover:text-white transition-all"
                >
                  <div className="font-semibold">{bank.name}</div>
                  <div className="text-[10px] opacity-75">{bank.rate}% APR</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {calculation && (
        <>
          <div className="bg-gradient-to-br from-geely-blue to-navy text-white p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Monthly Payment */}
              <div className="text-center md:text-left">
                <div className="text-[#b9cbe4] text-xs font-semibold mb-1 uppercase tracking-wider">
                  Monthly Payment
                </div>
                <div className="text-3xl md:text-4xl font-bold">
                  {formatCurrency(calculation.monthlyPayment)}
                </div>
              </div>

              {/* Total Interest */}
              <div className="text-center md:text-left">
                <div className="text-[#b9cbe4] text-xs font-semibold mb-1 uppercase tracking-wider">
                  Total Interest
                </div>
                <div className="text-2xl md:text-3xl font-bold">
                  {formatCurrency(calculation.totalInterest)}
                </div>
              </div>

              {/* Total Cost */}
              <div className="text-center md:text-left">
                <div className="text-[#b9cbe4] text-xs font-semibold mb-1 uppercase tracking-wider">
                  Total Cost
                </div>
                <div className="text-2xl md:text-3xl font-bold">
                  {formatCurrency(calculation.totalCost)}
                </div>
              </div>
            </div>

            {/* Loan Summary */}
            <div className="mt-6 pt-6 border-t border-white border-opacity-20">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-[#b9cbe4] text-xs mb-1">Loan Amount</div>
                  <div className="font-bold">{formatCurrency(loanAmount)}</div>
                </div>
                <div>
                  <div className="text-[#b9cbe4] text-xs mb-1">Down Payment</div>
                  <div className="font-bold">{formatCurrency(downPayment)}</div>
                </div>
                <div>
                  <div className="text-[#b9cbe4] text-xs mb-1">Loan Term</div>
                  <div className="font-bold">
                    {loanTermOptions.find((opt) => opt.months === loanPeriodMonths)?.label}
                  </div>
                </div>
                <div>
                  <div className="text-[#b9cbe4] text-xs mb-1">Interest Rate</div>
                  <div className="font-bold">{interestRate.toFixed(2)}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 bg-ice border-t border-line">
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="/quote"
                className="flex-1 text-center bg-gold text-[#2c2308] font-bold text-sm py-3 px-6 rounded hover:bg-opacity-90 transition-all"
              >
                Apply for Financing
              </a>
              <Link
                href="/dealers"
                className="flex-1 text-center bg-navy text-white font-bold text-sm py-3 px-6 rounded hover:bg-opacity-90 transition-all"
              >
                Visit Showroom
              </Link>
              <button
                onClick={() => setShowAmortization(!showAmortization)}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-line rounded text-sm font-semibold text-navy hover:bg-white transition-all"
              >
                {showAmortization ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                {showAmortization ? "Hide" : "View"} Schedule
              </button>
            </div>
          </div>

          {/* Amortization Schedule */}
          {showAmortization && (
            <div className="p-6 border-t border-line">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-bold text-navy">Payment Schedule</h4>
                <button className="flex items-center gap-2 text-sm font-semibold text-geely-blue hover:underline">
                  <Download size={16} />
                  Download PDF
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-ice border-b-2 border-line">
                      <th className="px-4 py-3 text-left font-bold text-navy">Month</th>
                      <th className="px-4 py-3 text-right font-bold text-navy">Payment</th>
                      <th className="px-4 py-3 text-right font-bold text-navy">Principal</th>
                      <th className="px-4 py-3 text-right font-bold text-navy">Interest</th>
                      <th className="px-4 py-3 text-right font-bold text-navy">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {calculation.amortizationSchedule.map((entry) => (
                      <tr key={entry.month} className="hover:bg-ice transition-colors">
                        <td className="px-4 py-3 font-semibold text-navy">{entry.month}</td>
                        <td className="px-4 py-3 text-right text-steel">
                          {formatCurrency(entry.payment)}
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-semibold">
                          {formatCurrency(entry.principal)}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-600">
                          {formatCurrency(entry.interest)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-navy">
                          {formatCurrency(entry.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
