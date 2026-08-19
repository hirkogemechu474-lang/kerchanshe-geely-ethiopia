import { MainLayout } from "@/components/MainLayout";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import {
  Shield,
  Gift,
  FileText,
  Percent,
  BadgeDollarSign,
  Car,
  Building2,
  CalendarClock,
  Check,
  ChevronRight,
  FileDown,
  Phone,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Government Incentives & Benefits | Geely Ethiopia",
  description:
    "Discover Ethiopia's EV incentive programs including reduced import duties, lower VAT, registration waivers, priority parking, corporate fleet tax deductions, and future benefits pipeline.",
  keywords:
    "Geely Ethiopia EV incentives, electric vehicle tax benefits Ethiopia, EV import duty reduction, EV registration waiver Ethiopia, corporate fleet incentives Ethiopia",
  alternates: {
    canonical: "https://geelyethiopia.com/electric/incentives",
  },
  openGraph: {
    title: "Government Incentives & Benefits | Geely Ethiopia",
    description:
      "Save more with Ethiopia's EV support programs. Reduced import duties, lower VAT, registration fee waivers, priority parking, and corporate fleet incentives.",
    url: "https://geelyethiopia.com/electric/incentives",
    siteName: "Geely Ethiopia",
    locale: "en_ET",
    type: "website",
  },
};

export const revalidate = 3600;

async function getIncentiveFAQs() {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: {
        isActive: true,
        OR: [
          { category: { contains: "incentive", mode: "insensitive" } },
          { category: { contains: "tax", mode: "insensitive" } },
          { category: { contains: "ev", mode: "insensitive" } },
          { category: { contains: "electric", mode: "insensitive" } },
          { question: { contains: "incentive", mode: "insensitive" } },
          { question: { contains: "tax", mode: "insensitive" } },
          { question: { contains: "duty", mode: "insensitive" } },
        ],
      },
      take: 6,
      orderBy: [{ displayOrder: "asc" }, { createdAt: "desc" }],
    });
    return faqs;
  } catch (error) {
    console.error("Error fetching incentive FAQs:", error);
    return [];
  }
}

const defaultFAQs = [
  {
    question: "Who is eligible for EV import duty reductions?",
    answer:
      "All individuals and businesses importing fully electric vehicles (BEVs) into Ethiopia are eligible for the reduced import duty rates. Plug-in hybrids may also qualify for partial reductions. The vehicle must be classified as an electric vehicle by Ethiopian Customs and meet road safety standards.",
  },
  {
    question: "How much can I save on VAT and other taxes?",
    answer:
      "Electric vehicles benefit from reduced VAT brackets. Currently, EVs attract a lower VAT rate compared to conventional vehicles, along with exemptions on certain excise taxes. Combined savings can amount to 15-25% of the vehicle's CIF value depending on the model and year.",
  },
  {
    question: "Are registration fee waivers automatic?",
    answer:
      "Yes, registration fee waivers are automatically applied when you register an electric vehicle at the Transport Authority. Simply present your purchase invoice and vehicle documents showing the EV classification. You'll receive a full or partial waiver on the standard registration fee of approximately ETB 15,000.",
  },
  {
    question: "What priority parking and access benefits exist?",
    answer:
      "Dedicated EV parking spots are available at select shopping centers, office buildings, airports, and public facilities in Addis Ababa and expanding to regional cities. EVs also benefit from exemptions on certain parking fees and access to restricted zones during peak hours where applicable.",
  },
  {
    question: "How do corporate fleet tax deductions work?",
    answer:
      "Businesses purchasing electric vehicles for their fleet can claim a 150% tax deduction on the purchase cost in their first year of ownership. This accelerated depreciation benefit reduces taxable income significantly. Additionally, ongoing charging and maintenance costs are fully deductible business expenses.",
  },
  {
    question: "What future incentives are in the pipeline?",
    answer:
      "The Ministry of Transport and Ethiopian Energy Authority are developing additional incentives including: free public charging for the first 2 years, scrappage bonuses for trading in old petrol vehicles, low-interest green financing programs, and dedicated EV highway lanes. Expected rollout begins within 6-12 months.",
  },
];

export default async function IncentivesPage() {
  const dbFAQs = await getIncentiveFAQs();
  const faqs = dbFAQs.length > 0 ? dbFAQs : defaultFAQs;

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-[#0057B8] to-gold">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-gold rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white bg-opacity-15 backdrop-blur-sm text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-full mb-6 border border-white border-opacity-20">
                <Shield size={16} className="text-gold" />
                <span className="tracking-[0.1em]">SAVE MORE WITH EV SUPPORT PROGRAMS</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Government Incentives
                <br />
                <span className="text-gold">&amp; Benefits</span>
              </h1>
              <p className="text-base sm:text-lg text-blue-100 mb-8 max-w-xl leading-relaxed">
                Maximize your savings with Ethiopia&apos;s comprehensive electric vehicle incentive package.
                From reduced import duties to registration waivers, corporate tax breaks, and upcoming
                programs — going electric has never been more rewarding.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold text-sm px-8 py-4 rounded-lg hover:bg-opacity-90 transition-all shadow-xl"
                >
                  Request Consultation
                  <ChevronRight size={18} />
                </Link>
                <a
                  href="#cards"
                  className="inline-flex items-center gap-2 bg-transparent text-white border-2 border-white font-semibold text-sm px-8 py-4 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all"
                >
                  <FileDown size={18} />
                  Download Brochure
                </a>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gold opacity-20 blur-3xl rounded-full" />
                <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl border border-white border-opacity-20 flex items-center justify-center">
                  <div className="text-center p-6">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 mx-auto bg-gradient-to-br from-gold to-yellow-400 rounded-2xl flex items-center justify-center mb-6 shadow-2xl">
                      <Gift size={56} className="text-navy" />
                    </div>
                    <div className="text-white">
                      <div className="text-5xl sm:text-6xl font-bold text-gold mb-2">ETB 80K+</div>
                      <div className="text-sm sm:text-base text-blue-100 font-semibold tracking-wide">
                        POTENTIAL FIRST-YEAR SAVINGS
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Content Sections with Icons */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
              COMPREHENSIVE BENEFITS
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              All the Ways You Save with EV
            </h2>
            <p className="text-steel text-base sm:text-lg max-w-2xl mx-auto">
              Ethiopia&apos;s government has designed a complete incentive ecosystem to accelerate
              electric vehicle adoption across the country — for individuals and businesses alike.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Section 1: Reduced Import Duties */}
            <div className="group bg-ice rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-blue-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <FileText size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Reduced Import Duties</h3>
              <p className="text-sm text-steel leading-relaxed mb-4">
                Electric vehicles qualify for significantly reduced customs duty rates compared to
                petrol or diesel vehicles. This makes EVs substantially more affordable at the
                point of importation.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Special duty rates exclusively for EVs</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Up to 30% reduction vs. conventional vehicles</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Applied automatically at customs clearance</span>
                </li>
              </ul>
            </div>

            {/* Section 2: Lower VAT & Taxes */}
            <div className="group bg-ice rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-gold hover:border-opacity-40">
              <div className="w-16 h-16 bg-gradient-to-br from-gold to-yellow-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Percent size={32} className="text-navy" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Lower VAT &amp; Taxes</h3>
              <p className="text-sm text-steel leading-relaxed mb-4">
                EVs fall into reduced tax brackets for value-added tax and excise duties.
                Additional tax exemptions on EV-related purchases keep more money in your pocket.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>Reduced VAT rate on EV purchases</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>Excise tax exemptions for zero-emission vehicles</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>No luxury surtax on qualifying EV models</span>
                </li>
              </ul>
            </div>

            {/* Section 3: Registration Fee Waivers */}
            <div className="group bg-ice rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-green-200">
              <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <BadgeDollarSign size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Registration Fee Waivers</h3>
              <p className="text-sm text-steel leading-relaxed mb-4">
                Skip the standard vehicle registration and licensing fees. Electric vehicle
                owners benefit from full or significant reductions on all government registration charges.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Free or reduced vehicle registration</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>License plate fee exemptions included</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span>Save approximately ETB 15,000 upfront</span>
                </li>
              </ul>
            </div>

            {/* Section 4: Priority Parking & Access */}
            <div className="group bg-ice rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-purple-200">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-600 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Car size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Priority Parking &amp; Access</h3>
              <p className="text-sm text-steel leading-relaxed mb-4">
                Enjoy the convenience of dedicated EV parking spots in prime locations.
                Certain areas also grant EVs priority access and exemptions from parking fees.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Dedicated EV parking at major locations</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Free parking at select public facilities</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span>Priority access in restricted zones (planned)</span>
                </li>
              </ul>
            </div>

            {/* Section 5: Corporate Fleet Incentives */}
            <div className="group bg-ice rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-transparent hover:border-orange-200">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-500 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Building2 size={32} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-navy mb-3">Corporate Fleet Incentives</h3>
              <p className="text-sm text-steel leading-relaxed mb-4">
                Businesses investing in electric fleets enjoy powerful tax deductions and
                accelerated depreciation benefits that dramatically reduce the total cost of ownership.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>150% tax deduction for fleet purchases</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Accelerated depreciation schedules</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-steel">
                  <Check size={16} className="text-orange-600 flex-shrink-0 mt-0.5" />
                  <span>Charging infrastructure investment credits</span>
                </li>
              </ul>
            </div>

            {/* Section 6: Future Incentives Pipeline */}
            <div className="group bg-gradient-to-br from-navy to-blue-900 rounded-2xl p-6 sm:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gold border-opacity-30">
              <div className="w-16 h-16 bg-gradient-to-br from-gold to-yellow-400 rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <CalendarClock size={32} className="text-navy" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Future Incentives Pipeline</h3>
              <p className="text-sm text-blue-200 leading-relaxed mb-4">
                The Ethiopian government is actively developing additional EV support programs.
                Stay ahead of the curve by adopting now and locking in upcoming benefits.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-blue-200">
                  <Check size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>Free public charging programs (6 months)</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-200">
                  <Check size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>Scrappage bonuses for old petrol vehicles</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-blue-200">
                  <Check size={16} className="text-gold flex-shrink-0 mt-0.5" />
                  <span>Low-interest green financing (12 months)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Incentive Cards - 4 Benefit Cards in 2x2 Grid */}
      <section id="cards" className="py-16 sm:py-20 bg-gradient-to-br from-ice to-blue-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
              YOUR SAVINGS BREAKDOWN
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              Calculate Your Savings
            </h2>
            <p className="text-steel text-base sm:text-lg max-w-2xl mx-auto">
              These are the key financial benefits you can expect when purchasing
              a Geely electric vehicle in Ethiopia today.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Card 1: Import Duty Savings */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 to-blue-500" />
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <FileText size={28} className="text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full">
                    UP TO
                  </div>
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">Import Duty Savings</h3>
                <p className="text-3xl sm:text-4xl font-bold text-blue-600 mb-3">30%</p>
                <p className="text-sm text-steel mb-5 leading-relaxed">
                  Save up to 30% on vehicle import duties compared to equivalent conventional vehicles.
                  Applied automatically at customs for all fully electric Geely models.
                </p>
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Check size={18} className="text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-navy font-medium">On all BEV models — Geometry EX5 &amp; more</span>
                </div>
              </div>
            </div>

            {/* Card 2: Registration Waiver */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-green-600 to-emerald-500" />
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center group-hover:bg-green-600 transition-colors">
                    <BadgeDollarSign size={28} className="text-green-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="inline-flex items-center gap-1 bg-green-50 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
                    WAIVED
                  </div>
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">Registration Waiver</h3>
                <p className="text-3xl sm:text-4xl font-bold text-green-600 mb-3">ETB 15,000</p>
                <p className="text-sm text-steel mb-5 leading-relaxed">
                  Save approximately ETB 15,000 on vehicle registration, license plates,
                  and initial documentation fees when registering your new Geely EV.
                </p>
                <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                  <Check size={18} className="text-green-600 flex-shrink-0" />
                  <span className="text-sm text-navy font-medium">Applied at Transport Authority</span>
                </div>
              </div>
            </div>

            {/* Card 3: Annual Tax Benefits */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-gold to-yellow-400" />
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-gold transition-colors">
                    <Percent size={28} className="text-amber-600 group-hover:text-navy transition-colors" />
                  </div>
                  <div className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
                    PER YEAR
                  </div>
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">Annual Tax Benefits</h3>
                <p className="text-3xl sm:text-4xl font-bold text-amber-600 mb-3">ETB 8,000</p>
                <p className="text-sm text-steel mb-5 leading-relaxed">
                  Save approximately ETB 8,000 per year on circulation tax and annual vehicle
                  license fees. EVs benefit from reduced annual tax brackets for ongoing savings.
                </p>
                <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg">
                  <Check size={18} className="text-amber-600 flex-shrink-0" />
                  <span className="text-sm text-navy font-medium">Recurring annual benefit</span>
                </div>
              </div>
            </div>

            {/* Card 4: Corporate Deductions */}
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-600 to-violet-500" />
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                    <Building2 size={28} className="text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full">
                    BUSINESS
                  </div>
                </div>
                <h3 className="text-xl font-bold text-navy mb-2">Corporate Deductions</h3>
                <p className="text-3xl sm:text-4xl font-bold text-purple-600 mb-3">150%</p>
                <p className="text-sm text-steel mb-5 leading-relaxed">
                  150% tax deduction for fleet purchases in year one. Businesses can write off
                  1.5x the vehicle cost against taxable income — a powerful incentive.
                </p>
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-lg">
                  <Check size={18} className="text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-navy font-medium">Accelerated depreciation bonus</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline/Roadmap Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
              INCENTIVE ROADMAP
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              From Today to Tomorrow
            </h2>
            <p className="text-steel text-base sm:text-lg max-w-2xl mx-auto">
              Ethiopia&apos;s EV incentive framework is expanding rapidly. Adopt now to lock in
              current benefits and gain access to upcoming programs as they roll out.
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Timeline Line */}
            <div className="hidden md:block absolute top-10 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-gold to-purple-600 rounded-full" />
            <div className="md:hidden absolute top-0 bottom-0 left-10 w-1 bg-gradient-to-b from-blue-600 via-gold to-purple-600 rounded-full" />

            <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-3 md:gap-6">
              {/* Stage 1: Current */}
              <div className="relative flex md:block md:text-center">
                <div className="hidden md:flex md:justify-center mb-6">
                  <div className="relative z-10 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <Shield size={36} className="text-white" />
                  </div>
                </div>
                <div className="md:hidden relative z-10 w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl mr-6 flex-shrink-0">
                  <Shield size={32} className="text-white" />
                </div>
                <div className="flex-1 md:mt-0">
                  <div className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3 tracking-wider">
                    AVAILABLE NOW
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2 md:mb-3">Current Incentives</h3>
                  <ul className="space-y-2 text-sm text-steel">
                    <li className="flex md:block items-start gap-2">
                      <span className="text-blue-600 font-bold md:hidden">•</span>
                      <span>Reduced EV import duties (up to 30%)</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-blue-600 font-bold md:hidden">•</span>
                      <span>Lower VAT &amp; excise tax rates</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-blue-600 font-bold md:hidden">•</span>
                      <span>Registration fee waivers (ETB 15K)</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-blue-600 font-bold md:hidden">•</span>
                      <span>Corporate 150% fleet deductions</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-blue-600 font-bold md:hidden">•</span>
                      <span>Annual circulation tax reductions</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Stage 2: 6 Months */}
              <div className="relative flex md:block md:text-center">
                <div className="hidden md:flex md:justify-center mb-6">
                  <div className="relative z-10 w-20 h-20 bg-gold rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <CalendarClock size={36} className="text-navy" />
                  </div>
                </div>
                <div className="md:hidden relative z-10 w-20 h-20 bg-gold rounded-full flex items-center justify-center border-4 border-white shadow-xl mr-6 flex-shrink-0">
                  <CalendarClock size={32} className="text-navy" />
                </div>
                <div className="flex-1 md:mt-0">
                  <div className="inline-block bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3 tracking-wider">
                    IN 6 MONTHS
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2 md:mb-3">Expanded Benefits</h3>
                  <ul className="space-y-2 text-sm text-steel">
                    <li className="flex md:block items-start gap-2">
                      <span className="text-gold font-bold md:hidden">•</span>
                      <span>Free public charging at Geely stations</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-gold font-bold md:hidden">•</span>
                      <span>Old vehicle scrappage bonus scheme</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-gold font-bold md:hidden">•</span>
                      <span>Dedicated EV parking city-wide</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-gold font-bold md:hidden">•</span>
                      <span>HOV lane access for EVs</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-gold font-bold md:hidden">•</span>
                      <span>Charging installation rebates</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Stage 3: 12 Months */}
              <div className="relative flex md:block md:text-center">
                <div className="hidden md:flex md:justify-center mb-6">
                  <div className="relative z-10 w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                    <Gift size={36} className="text-white" />
                  </div>
                </div>
                <div className="md:hidden relative z-10 w-20 h-20 bg-purple-600 rounded-full flex items-center justify-center border-4 border-white shadow-xl mr-6 flex-shrink-0">
                  <Gift size={32} className="text-white" />
                </div>
                <div className="flex-1 md:mt-0">
                  <div className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-3 py-1.5 rounded-full mb-3 tracking-wider">
                    IN 12 MONTHS
                  </div>
                  <h3 className="text-xl font-bold text-navy mb-2 md:mb-3">Full EV Ecosystem</h3>
                  <ul className="space-y-2 text-sm text-steel">
                    <li className="flex md:block items-start gap-2">
                      <span className="text-purple-600 font-bold md:hidden">•</span>
                      <span>Low-interest green financing (8-10%)</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-purple-600 font-bold md:hidden">•</span>
                      <span>National highway fast-charging network</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-purple-600 font-bold md:hidden">•</span>
                      <span>EV toll road discount program</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-purple-600 font-bold md:hidden">•</span>
                      <span>Battery recycling credit system</span>
                    </li>
                    <li className="flex md:block items-start gap-2">
                      <span className="text-purple-600 font-bold md:hidden">•</span>
                      <span>EV grid-integration feed-in tariffs</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 bg-ice">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12 sm:mb-16">
            <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
              YOUR QUESTIONS ANSWERED
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-navy mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-steel text-base sm:text-lg max-w-2xl mx-auto">
              Everything you need to know about claiming EV incentives, tax benefits,
              and eligibility requirements in Ethiopia.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq: any, index: number) => (
              <div
                key={index}
                className="bg-white rounded-xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-shadow border border-line"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mt-0.5">
                    <span className="text-white text-sm font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-navy text-base sm:text-lg mb-2">
                      {faq.question}
                    </h4>
                    <p className="text-sm sm:text-base text-steel leading-relaxed">
                      {faq.answer.replace(/<[^>]*>/g, "")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-blue-900 to-blue-800">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-400 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-[13px] tracking-[0.14em] text-gold font-bold mb-3">
                READY TO MAXIMIZE YOUR SAVINGS?
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Let Our EV Specialists
                <br />
                <span className="text-gold">Guide You Through Every Step</span>
              </h2>
              <p className="text-base sm:text-lg text-blue-100 mb-8 max-w-xl leading-relaxed">
                From calculating your total incentive package to assisting with paperwork and
                documentation — our dedicated team makes claiming every benefit effortless.
                Book a free consultation or download our comprehensive incentives brochure today.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  href="/quote"
                  className="inline-flex items-center gap-2 bg-gold text-navy font-bold text-sm px-8 py-4 rounded-lg hover:bg-yellow-400 transition-all shadow-xl"
                >
                  <MessageSquare size={18} />
                  Request Consultation
                </Link>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 bg-transparent text-white border-2 border-white border-opacity-30 font-semibold text-sm px-8 py-4 rounded-lg hover:bg-white hover:bg-opacity-10 hover:border-opacity-50 transition-all"
                >
                  <FileDown size={18} />
                  Download Brochure
                </a>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-blue-200 text-sm">
                <div className="flex items-center gap-2">
                  <Phone size={16} className="text-gold" />
                  <span>Call: +251 11 000 0000</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-green-400" />
                  <span>Free consultation — no obligation</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white bg-opacity-5 backdrop-blur-sm rounded-3xl border border-white border-opacity-10 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center">
                    <BadgeDollarSign size={24} className="text-navy" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">Your Savings Estimate</h3>
                    <p className="text-xs text-blue-200">Based on typical EV purchase</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-white border-opacity-10">
                    <span className="text-blue-100 text-sm">Import Duty Savings</span>
                    <span className="text-white font-bold">- ETB 120,000</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white border-opacity-10">
                    <span className="text-blue-100 text-sm">Registration Waiver</span>
                    <span className="text-white font-bold">- ETB 15,000</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white border-opacity-10">
                    <span className="text-blue-100 text-sm">VAT &amp; Tax Reduction</span>
                    <span className="text-white font-bold">- ETB 65,000</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-white border-opacity-10">
                    <span className="text-blue-100 text-sm">Year 1 Circulation Tax</span>
                    <span className="text-white font-bold">- ETB 8,000</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-gold font-bold">Total Year 1 Savings</span>
                    <span className="text-gold font-bold text-2xl">ETB 208,000</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gold bg-opacity-10 rounded-xl border border-gold border-opacity-20">
                  <p className="text-xs text-blue-100 leading-relaxed">
                    <span className="text-gold font-bold">Note:</span> These are estimates
                    based on a typical Geometry EX5 purchase. Actual savings vary by model,
                    configuration, and applicable tax regulations. Contact us for a precise quote.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
