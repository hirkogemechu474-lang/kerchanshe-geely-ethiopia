import { Metadata } from 'next';
import { MainLayout } from '@/components/MainLayout';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Zap, Gauge, Clock, MapPin, Battery, CreditCard, Headphones, HelpCircle, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Ultra-Fast DC Charging Network | Geely Electric Vehicles Ethiopia',
  description: 'Experience Geely Ethiopia\'s ultra-fast DC charging network. 150kW chargers, 30 minutes to 80%, strategic locations, easy payment, and 24/7 support.',
  keywords: 'Geely fast charging, DC fast charging Ethiopia, EV charging network, 150kW charger, electric vehicle charging',
};

async function getFastChargingPage() {
  try {
    const page = await prisma.electricPage.findUnique({
      where: { slug: 'fast-charging' }
    });

    if (!page) {
      return null;
    }

    return page;
  } catch (error) {
    console.error('Error fetching fast charging page:', error);
    return null;
  }
}

export default async function FastChargingPage() {
  const pageData = await getFastChargingPage();

  const featureCards = [
    {
      icon: Gauge,
      iconBgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      borderColor: 'border-purple-500',
      gradientFrom: 'from-purple-500',
      gradientTo: 'to-indigo-600',
      title: '150kW Ultra-Fast',
      subtitle: 'Power That Moves You',
      description: 'Our high-power DC chargers deliver up to 150kW of charging power, significantly reducing wait times and getting you back on the road faster than ever before.',
      bullets: [
        'Up to 150kW DC charging output',
        'CCS2 standard connector',
        'Compatible with all modern EVs',
        'Smart power distribution'
      ]
    },
    {
      icon: Clock,
      iconBgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-500',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-cyan-600',
      title: '30 Minutes to 80%',
      subtitle: 'Quick Top-Ups, Zero Waiting',
      description: 'Charge from 20% to 80% in approximately 30 minutes. Perfect for a coffee break or quick rest stop on long journeys across Ethiopia.',
      bullets: [
        '20% → 80% in ~30 minutes',
        '10 minutes = ~100km range',
        'Optimized charging curves',
        'Ideal for highway travel'
      ]
    },
    {
      icon: MapPin,
      iconBgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      borderColor: 'border-green-500',
      gradientFrom: 'from-green-500',
      gradientTo: 'to-emerald-600',
      title: 'Strategic Locations',
      subtitle: 'Where You Need Us Most',
      description: 'Our charging network is strategically placed at key locations throughout Ethiopia — from major highways to bustling city centers and popular shopping destinations.',
      bullets: [
        'Addis Ababa city centers',
        'Highway rest stops & fuel stations',
        'Major malls and entertainment hubs',
        'Geely showrooms & service centers'
      ]
    },
    {
      icon: Battery,
      iconBgColor: 'bg-teal-100',
      iconColor: 'text-teal-600',
      borderColor: 'border-teal-500',
      gradientFrom: 'from-teal-500',
      gradientTo: 'to-cyan-600',
      title: 'Battery-Friendly Charging',
      subtitle: 'Smart Protection for Longevity',
      description: 'Advanced charging algorithms with optimized curves and active thermal management ensure your battery stays healthy, efficient, and long-lasting throughout its life.',
      bullets: [
        'Optimized charging profiles',
        'Active thermal management',
        'BMS communication protocol',
        'Pre-conditioning support'
      ]
    },
    {
      icon: CreditCard,
      iconBgColor: 'bg-orange-100',
      iconColor: 'text-orange-600',
      borderColor: 'border-orange-500',
      gradientFrom: 'from-orange-500',
      gradientTo: 'to-red-500',
      title: 'Easy Payment',
      subtitle: 'Simple, Secure, Transparent',
      description: 'Multiple payment options and seamless app integration make paying for charging effortless. No hidden fees, transparent pricing, and real-time cost tracking.',
      bullets: [
        'Geely EV mobile app payment',
        'Credit & debit card support',
        'Pre-paid charging packages',
        'Real-time cost display'
      ]
    },
    {
      icon: Headphones,
      iconBgColor: 'bg-pink-100',
      iconColor: 'text-pink-600',
      borderColor: 'border-pink-500',
      gradientFrom: 'from-pink-500',
      gradientTo: 'to-rose-600',
      title: '24/7 Roadside Support',
      subtitle: 'Help When You Need It',
      description: 'Our dedicated support team is available around the clock, every day of the year. Whether you need charging assistance or have questions, we\'re just a call away.',
      bullets: [
        '24/7 customer helpline',
        'On-site charger assistance',
        'Mobile charging rescue service',
        'Live chat support in app'
      ]
    }
  ];

  const chargingComparison = [
    {
      level: 'Level 1',
      type: 'Standard Outlet',
      power: '2.3 kW',
      time: '24+ Hours',
      rangePerHour: '~10 km',
      color: 'bg-gray-400',
      barWidth: 'w-[10%]',
      useCase: 'Overnight home charging only',
      recommended: false
    },
    {
      level: 'Level 2',
      type: 'AC Wall Box',
      power: '7-22 kW',
      time: '6-8 Hours',
      rangePerHour: '~50 km',
      color: 'bg-blue-500',
      barWidth: 'w-[35%]',
      useCase: 'Home & workplace charging',
      recommended: false
    },
    {
      level: 'DC Fast',
      type: 'Ultra-Fast Charger',
      power: '50-150 kW',
      time: '30 Minutes*',
      rangePerHour: '~500 km',
      color: 'bg-purple-600',
      barWidth: 'w-[100%]',
      useCase: 'Highways, city centers, travel',
      recommended: true
    }
  ];

  const faqs = [
    {
      question: 'What is DC fast charging and how does it work?',
      answer: 'DC fast charging delivers direct current (DC) directly to your vehicle\'s battery, bypassing the onboard AC charger. This allows for much higher power transfer rates — up to 150kW — significantly reducing charging time compared to standard AC charging. The charger communicates directly with your vehicle\'s Battery Management System (BMS) to optimize the charging process safely.'
    },
    {
      question: 'Can I use DC fast charging every day?',
      answer: 'While DC fast charging is safe for daily use, we recommend a balanced approach. For daily home charging, Level 2 AC charging is gentler and perfectly adequate. Use DC fast charging when you need a quick top-up during the day or on long trips. Our smart chargers use optimized charging curves to minimize battery stress even during frequent fast charging sessions.'
    },
    {
      question: 'How much does DC fast charging cost in Ethiopia?',
      answer: 'Pricing is transparent and displayed at each charging station and in the Geely EV mobile app. Costs are calculated per kWh consumed, typically ranging from ETB 8-15 per kWh depending on the location and package. Pre-paid charging packages are available for additional savings. There are no hidden fees or subscription charges required to use the network.'
    },
    {
      question: 'Is DC fast charging compatible with all Geely EV models?',
      answer: 'Yes, all Geely electric vehicles sold in Ethiopia support DC fast charging via the CCS2 standard connector, which is the global standard for DC fast charging. Each vehicle has a maximum DC charging rate it can accept — our 150kW chargers automatically adjust to deliver the optimal power level for your specific vehicle model.'
    },
    {
      question: 'How do I find and use a Geely fast charging station?',
      answer: 'Use the Geely EV mobile app to locate all charging stations on an interactive map with real-time availability status. To charge: pull into a bay, plug in the CCS2 connector, authenticate via the app or by scanning a QR code, and the charging session starts automatically. You can monitor progress remotely and receive a notification when complete. Payment is processed automatically through your preferred payment method in the app.'
    },
    {
      question: 'What safety measures are in place at charging stations?',
      answer: 'Every Geely fast charging station meets international safety standards (IEC 61851) and includes multiple layers of protection: ground fault monitoring, overcurrent and overvoltage protection, thermal monitoring on cables and connectors, emergency stop buttons, and automatic cut-off systems. All stations are weatherproof and regularly inspected and maintained by certified technicians. Remote monitoring systems detect and resolve issues 24/7.'
    }
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-400 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
        </div>
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 mb-6">
                <Zap size={16} className="text-yellow-300" />
                <span className="text-[13px] tracking-[0.14em] font-bold uppercase">
                  {pageData?.heroSubtitle || 'DC FAST CHARGING NETWORK'}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                {pageData?.heroTitle || 'Ultra-Fast Charging On The Go'}
              </h1>
              <p className="text-lg sm:text-xl text-purple-100 mb-8 leading-relaxed max-w-xl">
                {pageData?.content || 'Power up your Geely EV in minutes, not hours. Our growing nationwide network of 150kW DC fast chargers keeps you moving across Ethiopia with speed, convenience, and confidence.'}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/electric/charging-map"
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all shadow-lg"
                >
                  <MapPin size={18} />
                  Find Charging Stations
                </Link>
                <Link
                  href="/test-drive"
                  className="inline-flex items-center gap-2 border-2 border-white text-white font-semibold text-sm px-8 py-4 rounded hover:bg-white hover:bg-opacity-10 transition-all"
                >
                  Book Test Drive
                  <ArrowRight size={18} />
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-yellow-300">150<span className="text-xl">kW</span></div>
                  <div className="text-sm text-purple-200 mt-1">Max Power</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-yellow-300">30<span className="text-xl">min</span></div>
                  <div className="text-sm text-purple-200 mt-1">To 80% Charge</div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl font-bold text-yellow-300">24/7</div>
                  <div className="text-sm text-purple-200 mt-1">Support</div>
                </div>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-400/30 to-blue-400/30 rounded-3xl blur-2xl"></div>
                <div className="relative bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 sm:p-10 w-full max-w-md">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-yellow-400 via-orange-400 to-purple-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                        <Zap size={48} className="sm:w-16 sm:h-16 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white/30 flex items-center justify-center">
                        <span className="text-xs font-bold text-white">⚡</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-purple-200">Charging Speed</span>
                        <span className="text-sm font-bold text-yellow-300">150 kW</span>
                      </div>
                      <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-yellow-400 via-orange-400 to-purple-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-purple-200">Battery Level</span>
                        <span className="text-sm font-bold text-green-400">80% (30 min)</span>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`h-8 flex-1 rounded-sm ${
                              i < 8
                                ? 'bg-gradient-to-t from-green-500 to-green-400'
                                : 'bg-white/20'
                            }`}
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                        <div className="text-2xl font-bold text-white">+100<span className="text-sm">km</span></div>
                        <div className="text-xs text-purple-200 mt-1">Range in 10 min</div>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3 border border-white/10 text-center">
                        <div className="text-2xl font-bold text-white">CCS2</div>
                        <div className="text-xs text-purple-200 mt-1">Connector</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block bg-purple-100 text-purple-700 text-xs font-bold px-4 py-2 rounded-full mb-4 tracking-wider uppercase">
              Why Choose Our Network
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-navy font-bold mb-4">
              The Geely Charging Advantage
            </h2>
            <p className="text-steel text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Every aspect of our fast charging network is designed for Ethiopian drivers — from power delivery to payment, from location strategy to battery care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featureCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={index}
                  className={`group bg-white border-2 ${card.borderColor} border-opacity-30 rounded-2xl p-6 sm:p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden relative`}
                >
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradientFrom} ${card.gradientTo} opacity-5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:opacity-10 transition-opacity`}></div>
                  <div className="relative">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 ${card.iconBgColor} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={card.iconColor} size={32} strokeWidth={2} />
                    </div>
                    <div className={`text-xs font-bold tracking-wider uppercase ${card.iconColor} mb-2`}>
                      {card.subtitle}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-navy mb-3">
                      {card.title}
                    </h3>
                    <p className="text-sm text-steel leading-relaxed mb-5">
                      {card.description}
                    </p>
                    <ul className="space-y-2">
                      {card.bullets.map((bullet, i) => (
                        <li key={i} className="flex gap-2 text-sm text-steel items-start">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full ${card.iconColor.replace('text-', 'bg-')} flex-shrink-0`}></span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Charging Speed Comparison */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-ice to-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block bg-blue-100 text-blue-700 text-xs font-bold px-4 py-2 rounded-full mb-4 tracking-wider uppercase">
              Speed Comparison
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-navy font-bold mb-4">
              Charging Speed Compared
            </h2>
            <p className="text-steel text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              See the difference between charging levels. DC fast charging delivers up to 50x faster charging than a standard household outlet.
            </p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-line p-6 sm:p-10 lg:p-12">
            <div className="space-y-8 sm:space-y-10">
              {chargingComparison.map((item, index) => (
                <div
                  key={index}
                  className={`relative rounded-2xl p-5 sm:p-8 border-2 transition-all ${
                    item.recommended
                      ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg'
                      : 'border-line bg-ice/30'
                  }`}
                >
                  {item.recommended && (
                    <div className="absolute -top-3 left-6 sm:left-8">
                      <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                        ⚡ RECOMMENDED FOR TRAVEL
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="lg:w-1/4 flex flex-col sm:flex-row lg:flex-col gap-4 items-start sm:items-center lg:items-start">
                      <div className={`${item.color} text-white rounded-xl p-3 sm:p-4 shadow-md`}>
                        <Zap size={24} strokeWidth={2.5} />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-steel uppercase tracking-wider mb-1">
                          {item.level}
                        </div>
                        <div className="text-xl sm:text-2xl font-bold text-navy">
                          {item.type}
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-1/2 space-y-3">
                      <div className="flex items-end gap-2 mb-2">
                        <div className={`h-14 sm:h-16 rounded-xl ${item.barWidth} ${item.color} opacity-90 shadow-inner transition-all`}></div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-xs text-steel font-semibold uppercase mb-1">Power</div>
                          <div className="font-bold text-navy text-lg">{item.power}</div>
                        </div>
                        <div>
                          <div className="text-xs text-steel font-semibold uppercase mb-1">Full Charge</div>
                          <div className="font-bold text-navy text-lg">{item.time}</div>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <div className="text-xs text-steel font-semibold uppercase mb-1">Range/Hour</div>
                          <div className="font-bold text-navy text-lg">{item.rangePerHour}</div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:w-1/4">
                      <div className={`rounded-xl p-5 ${item.recommended ? 'bg-white/80 border border-purple-200' : 'bg-white border border-line'}`}>
                        <div className="text-xs font-semibold text-steel uppercase tracking-wider mb-2">Best Used For</div>
                        <div className="text-sm font-semibold text-navy leading-relaxed">
                          {item.useCase}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 p-5 sm:p-6 bg-yellow-50 border border-yellow-200 rounded-2xl">
              <p className="text-xs sm:text-sm text-yellow-800 leading-relaxed">
                <strong className="font-bold">*Note:</strong> 30-minute charging time for DC Fast represents 20% → 80% state-of-charge (SOC) for a typical 50-70kWh battery pack. Actual charging speeds vary based on vehicle model, battery size, temperature, state of charge, and charger power. Times shown are approximate estimates for reference.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block bg-indigo-100 text-indigo-700 text-xs font-bold px-4 py-2 rounded-full mb-4 tracking-wider uppercase">
              Common Questions
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-navy font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-steel text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about Geely\'s ultra-fast DC charging network in Ethiopia.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-line rounded-2xl p-6 sm:p-8 hover:shadow-lg hover:border-purple-200 transition-all group"
              >
                <div className="flex gap-4 items-start">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                    <HelpCircle className="text-white" size={20} strokeWidth={2.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-navy text-base sm:text-lg mb-3 leading-snug group-hover:text-purple-700 transition-colors">
                      {faq.question}
                    </h4>
                    <p className="text-sm sm:text-base text-steel leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-800 text-white py-16 sm:py-20 lg:py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white rounded-full blur-3xl"></div>
        </div>
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center">
                <Zap size={32} className="sm:w-10 sm:h-10 text-yellow-300" strokeWidth={2.5} />
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
              Ready to Experience Ultra-Fast Charging?
            </h2>
            <p className="text-lg sm:text-xl text-purple-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Visit your nearest Geely showroom to learn more about our electric vehicles and nationwide charging network. The future of Ethiopian mobility is here.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/models/geometry-ex5"
                className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all shadow-xl"
              >
                Explore Electric Vehicles
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/electric/charging-map"
                className="inline-flex items-center gap-2 border-2 border-white text-white font-semibold text-sm px-8 py-4 rounded hover:bg-white hover:bg-opacity-10 transition-all"
              >
                <MapPin size={18} />
                View Charging Map
              </Link>
              <Link
                href="/dealers"
                className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold text-sm px-8 py-4 rounded hover:bg-white hover:bg-opacity-10 transition-all"
              >
                Find a Showroom
              </Link>
            </div>
            <div className="mt-12 pt-8 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Headphones size={18} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-purple-200 font-semibold">Call Us</div>
                  <div className="text-sm font-bold text-white">+251 111 123 456</div>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Battery size={18} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-purple-200 font-semibold">8-Year Warranty</div>
                  <div className="text-sm font-bold text-white">On EV Battery</div>
                </div>
              </div>
              <div className="flex items-center gap-3 justify-center sm:justify-end">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <CreditCard size={18} className="text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs text-purple-200 font-semibold">Flexible Plans</div>
                  <div className="text-sm font-bold text-white">Easy Financing</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
