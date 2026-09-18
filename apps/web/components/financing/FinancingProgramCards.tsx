"use client";

import { CheckCircle2 } from "lucide-react";
import type { CalcProgram } from "./FinanceCalculator";

function num(value: string | number): number {
  return typeof value === "number" ? value : parseFloat(value) || 0;
}

/** Scannable side-by-side comparison of every published financing program —
 * the interactive calculator personalizes one program at a time, this shows
 * the full lineup so a visitor can compare rates/terms before picking one. */
export function FinancingProgramCards({ programs }: { programs: CalcProgram[] }) {
  if (programs.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {programs.map((program) => (
        <div
          key={program.id}
          className={`relative rounded-2xl border p-6 bg-white dark:bg-midnight-surface transition-all hover:shadow-lg ${
            program.highlightBadge
              ? "border-geely-blue shadow-md shadow-active-blue/10"
              : "border-line dark:border-midnight-line"
          }`}
        >
          {program.badgeText && (
            <span
              className={`absolute -top-3 left-6 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                program.highlightBadge ? "bg-gold text-[#2c2308]" : "bg-geely-blue text-white"
              }`}
            >
              {program.badgeText}
            </span>
          )}
          <div className="text-sm font-semibold text-steel dark:text-steel-light mb-1">{program.bank.name}</div>
          <div className="font-bold text-navy dark:text-ice text-lg mb-4">{program.name}</div>

          <div className="text-3xl font-bold text-geely-blue tabular-nums mb-1">
            {num(program.interestRate).toFixed(2)}%<span className="text-sm font-medium text-steel dark:text-steel-light"> p.a.</span>
          </div>
          <div className="text-xs text-steel dark:text-steel-light mb-5">Indicative interest rate</div>

          <ul className="space-y-2 text-sm mb-5">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-geely-blue shrink-0 mt-0.5" />
              <span className="text-navy dark:text-ice">
                {num(program.minDownPaymentPercent)}%–{num(program.maxDownPaymentPercent)}% down payment
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-geely-blue shrink-0 mt-0.5" />
              <span className="text-navy dark:text-ice">
                {program.minTenureMonths}–{program.maxTenureMonths} month terms
              </span>
            </li>
            {!program.appliesToAllVehicles && (
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-geely-blue shrink-0 mt-0.5" />
                <span className="text-navy dark:text-ice">Selected models only</span>
              </li>
            )}
          </ul>

          {program.eligibilityNote && (
            <p className="text-xs text-steel dark:text-steel-light border-t border-line dark:border-midnight-line pt-3">
              {program.eligibilityNote}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
