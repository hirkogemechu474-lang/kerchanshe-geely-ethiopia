import { Landmark, Calculator, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";

interface Bank {
  id: string;
  name: string;
  shortDescription?: string | null;
}

interface FinancingSectionProps {
  banks: Bank[];
  /** Lowest published interestRate across all programs, or null if none exist. */
  startingRate: number | null;
}

/** Home-page teaser for the /financing calculator — real bank names and a
 * real starting rate (never a placeholder), matching the rest of the home
 * page's brand-guideline styling (page-container, disp headings, the
 * two-style Button component), not the more product-styled /financing
 * page itself. */
export default function FinancingSection({ banks, startingRate }: FinancingSectionProps) {
  if (banks.length === 0) return null;

  return (
    <section className="bg-white dark:bg-midnight-surface py-[70px] transition-colors">
      <div className="page-container">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[13px] tracking-[0.2em] text-active-blue font-bold mb-3 uppercase">
              Financing
            </div>
            <h2 className="disp text-[30px] md:text-4xl text-navy dark:text-ice font-bold mb-4 leading-tight">
              Own Your Geely,
              <br />
              Your Way
            </h2>
            <p className="text-steel dark:text-steel-light leading-relaxed mb-7 max-w-lg">
              Finance your next Geely through one of our trusted partner banks
              {startingRate !== null && (
                <>
                  {" "}
                  with rates starting from just{" "}
                  <strong className="text-navy dark:text-ice">{startingRate.toFixed(2)}% p.a.</strong>
                </>
              )}
              . Use our calculator to see an estimated monthly payment in seconds, or apply for financing directly
              — no formal quote required to get started.
            </p>
            <div className="flex flex-wrap gap-3 mb-8">
              <Button href="/financing#calculator" variant="solid">
                <Calculator size={18} /> Estimate My Payment
              </Button>
              <Button href="/financing/apply-loan" variant="outline">
                Apply for Financing
              </Button>
            </div>
            <div className="flex items-center gap-2 text-sm text-steel dark:text-steel-light">
              <ShieldCheck size={16} className="text-active-blue shrink-0" />
              Secure, bank-verified financing — final rates and approval are determined by your chosen bank.
            </div>
          </div>

          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-steel dark:text-steel-light mb-4">
              {banks.length} Partner Financing Bank{banks.length === 1 ? "" : "s"}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {banks.slice(0, 4).map((bank) => (
                <div
                  key={bank.id}
                  className="bg-ice dark:bg-midnight rounded-lg border border-line dark:border-midnight-line p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[110px] hover:border-active-blue transition-colors"
                >
                  <Landmark className="w-6 h-6 text-active-blue" />
                  <span className="text-sm font-bold text-navy dark:text-ice leading-snug">{bank.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
