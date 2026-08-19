import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/MainLayout';
import {
  Home,
  Zap,
  CheckCircle,
  DollarSign,
  Shield,
  Wrench,
  HelpCircle,
  Phone,
  Mail,
  Award,
  Clock,
  Users,
  Star
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Home Charging Solutions | Geely Electric Vehicles Ethiopia',
  description: 'Professional home charging installation for Geely EVs in Ethiopia. Standard outlet, wall box chargers, cost savings, safety features, and maintenance guidance.',
  keywords: 'Geely home charging, EV home charger Ethiopia, wall box installation, EV charging cost, home charging safety',
};

const sectionIcons = {
  standard: Home,
  wallbox: Zap,
  installation: CheckCircle,
  costs: DollarSign,
  safety: Shield,
  maintenance: Wrench,
};

const packages = [
  {
    name: 'Basic',
    price: '35,000',
    period: 'ETB',
    description: 'Essential home charging setup',
    features: [
      'Standard 220V outlet inspection',
      'Basic charging cable included',
      '15m cable length',
      'Installation manual & guide',
      '30-day installation warranty',
      'Email support'
    ],
    highlighted: false,
    icon: Home
  },
  {
    name: 'Standard',
    price: '85,000',
    period: 'ETB',
    description: 'Most popular - fast wall box charging',
    features: [
      '7kW Wall Box Charger (Type 2)',
      'Professional site survey',
      'Full installation (up to 20m wiring)',
      'Circuit breaker & protection',
      'WiFi connectivity & app control',
      '1-year charger warranty',
      '3 months phone support',
      'Post-installation testing'
    ],
    highlighted: true,
    icon: Zap
  },
  {
    name: 'Premium',
    price: '145,000',
    period: 'ETB',
    description: 'Complete charging solution',
    features: [
      '11kW Smart Wall Box Charger',
      'Advanced site survey & load analysis',
      'Full installation (up to 40m wiring)',
      'Surge protection & smart meter',
      'Load balancing & solar readiness',
      'Premium weatherproof enclosure',
      '2-year charger warranty',
      '1 year on-site support',
      'Priority service scheduling',
      'Free software updates'
    ],
    highlighted: false,
    icon: Award
  }
];

const faqs = [
  {
    question: 'Can I charge my Geely EV from a regular home outlet?',
    answer: 'Yes, all Geely EVs can be charged using a standard 220V household outlet. This provides slow overnight charging, typically taking 8-10 hours for a full charge. This is the simplest method and requires no special installation beyond a properly grounded outlet.'
  },
  {
    question: 'What is a Wall Box charger and why should I get one?',
    answer: 'A Wall Box is a dedicated home charging station that delivers faster charging speeds. Our 7kW charger charges your EV in 4-6 hours (vs 8-10 hours from a standard outlet). Wall boxes are safer, more durable, and offer smart features like scheduling and app control.'
  },
  {
    question: 'How much does home installation cost?',
    answer: 'Installation packages start at 35,000 ETB for our Basic package (outlet inspection and cable). The Standard package with a 7kW Wall Box and full installation costs 85,000 ETB. Premium packages with 11kW smart chargers start at 145,000 ETB. All packages include professional installation.'
  },
  {
    question: 'Is home charging safe for my vehicle and home?',
    answer: 'Absolutely. Our chargers meet international safety standards (CE, IEC 61851, IP54/IP65 weatherproof ratings). Professional installation ensures proper grounding, circuit protection, and load management. All chargers include built-in safety features: overcurrent protection, overvoltage protection, temperature monitoring, and automatic emergency shutoff.'
  },
  {
    question: 'How much does it cost to charge at home compared to fuel?',
    answer: 'Home charging is dramatically cheaper than fuel. Driving 100km in a Geely EV costs approximately 50-70 ETB in electricity, compared to 350-450 ETB in fuel for a similar gasoline vehicle. Over 15,000 km annually, that\s a savings of roughly 45,000-57,000 ETB per year in fuel costs alone.'
  },
  {
    question: 'What maintenance does my home charger need?',
    answer: 'Geely home chargers are designed for minimal upkeep. No regular maintenance is required beyond: keeping the connector clean and dry, occasional visual inspection of cables and housing for damage, and updating charger firmware when available. Our Premium package includes free software updates and on-site support for 1 year.'
  }
];

export default async function HomeChargingPage() {
  let page = await prisma.electricPage.findUnique({
    where: { slug: 'home-charging' }
  });

  if (!page) {
    page = await prisma.electricPage.create({
      data: {
        title: 'Home Charging',
        slug: 'home-charging',
        pageType: 'home-charging',
        heroTitle: 'Charge at Home, Wake Up Ready',
        heroSubtitle: 'CONVENIENT OVERNIGHT CHARGING',
        heroImage: '/images/electric/home-charging-hero.jpg',
        content: 'Professional home charging solutions for Geely electric vehicle owners in Ethiopia. From simple outlet charging to smart wall box installation, we make EV ownership effortless.',
        sections: JSON.stringify([
          {
            id: 'standard',
            title: 'Standard Outlet Charging',
            bulletPoints: [
              'Works with any standard 220V household outlet',
              'Full charge in 8-10 hours — perfect for overnight',
              'Plug and charge — no complicated setup',
              'Ideal for daily commuters who drive under 100km/day',
              'Requires a properly grounded 3-pin outlet'
            ],
            content: 'Start charging immediately with the cable included with your vehicle. No installation required — just plug into a properly grounded 220V outlet and wake up to a fully charged vehicle every morning.'
          },
          {
            id: 'wallbox',
            title: 'Wall Box Installation',
            bulletPoints: [
              '7kW dedicated charger — 3x faster than standard outlet',
              'Full charge in just 4-6 hours',
              'Professional installation by certified technicians',
              'Type 2 connector — compatible with all Geely EVs',
              'Built-in cable management and safety lock'
            ],
            content: 'Upgrade to a dedicated Wall Box charger for faster, more convenient charging at home. Our certified technicians handle the complete installation process, ensuring safety and reliability.'
          },
          {
            id: 'installation',
            title: 'Installation Process',
            bulletPoints: [
              'Free site survey to assess your home electrical system',
              'Professional installation by certified electricians',
              'Full system testing and handover demonstration',
              'Ongoing technical support and maintenance options',
              'Typical installation completed in one day'
            ],
            content: 'Our turnkey installation service ensures a hassle-free experience: 1) Site survey — our technicians evaluate your electrical panel and recommend the best charger location. 2) Installation — certified electricians install the charger, wiring, and circuit protection. 3) Testing — complete system validation and a handover walkthrough. 4) Support — ongoing phone and on-site support to keep your charger running smoothly.'
          },
          {
            id: 'costs',
            title: 'Cost Savings',
            bulletPoints: [
              'Charging at home costs ~50-70 ETB per 100km driven',
              'Fuel equivalent costs ~350-450 ETB per 100km',
              'Save ~45,000-57,000 ETB annually on fuel',
              'Schedule charging during off-peak hours for even lower rates',
              'Lower maintenance costs — no oil changes, fewer moving parts'
            ],
            content: 'Driving electric is dramatically more affordable than gasoline. The average Ethiopian driver covers 15,000 km annually. At current fuel prices, that costs approximately 60,000-75,000 ETB per year in fuel alone. Home charging brings that down to roughly 9,000-12,000 ETB per year in electricity — saving you over 80% on energy costs.'
          },
          {
            id: 'safety',
            title: 'Safety Features',
            bulletPoints: [
              'International safety certifications (CE, IEC 61851)',
              'IP54/IP65 weatherproof ratings — outdoor installation safe',
              'Smart features: overcurrent, overvoltage, temperature protection',
              'Automatic emergency shutoff and fault detection',
              'Reinforced housing and tamper-resistant design'
            ],
            content: 'Your safety is our priority. Every Geely-approved home charger meets rigorous international safety standards. Multiple layers of protection include: real-time temperature monitoring, overcurrent and overvoltage protection, ground fault detection, and automatic power cutoff if any abnormal condition is detected.'
          },
          {
            id: 'maintenance',
            title: 'Maintenance & Care',
            bulletPoints: [
              'Minimal upkeep required — no moving parts',
              'Keep connector clean, dry, and free of debris',
              'Inspect cables periodically for visible damage',
              'Software updates deliver feature and safety improvements',
              'Premium packages include free on-site maintenance'
            ],
            content: 'Home chargers are designed for years of trouble-free service with minimal maintenance. Basic care involves keeping the charging connector clean, avoiding cable kinks, and reporting any damage promptly. Smart chargers receive over-the-air software updates that add features and enhance performance.'
          }
        ]),
        metadata: JSON.stringify({
          packages,
          faqs
        }),
        isPublished: true,
        displayOrder: 2
      }
    });
  }

  const sections = JSON.parse(page.sections as string);
  const pageMetadata = JSON.parse(page.metadata as string);
  const pageFaqs = pageMetadata.faqs || faqs;
  const pagePackages = pageMetadata.packages || packages;

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-blue-700 text-white py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 left-0 w-full h-full opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-300 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-6 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
              <Home className="w-10 h-10 md:w-12 md:h-12 text-white" />
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 leading-tight tracking-tight">
              {page.heroTitle}
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl font-semibold tracking-widest text-orange-100 mb-6 uppercase">
              {page.heroSubtitle}
            </p>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              {page.content}
            </p>
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
            {sections.map((section: any, index: number) => {
              const IconComponent = sectionIcons[section.id as keyof typeof sectionIcons] || Home;
              const bulletPoints = section.bulletPoints || [];
              return (
                <div
                  key={section.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8 md:p-10 hover:shadow-lg hover:border-orange-200 transition-all duration-300"
                >
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-100 to-orange-50 rounded-xl flex items-center justify-center border border-orange-100">
                      <IconComponent className="w-7 h-7 sm:w-8 sm:h-8 text-orange-600" strokeWidth={2.25} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                        <span className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-orange-500 to-blue-600 text-white rounded-lg text-sm sm:text-base font-bold flex-shrink-0">
                          {index + 1}
                        </span>
                        <span>{section.title}</span>
                      </h2>
                      {bulletPoints.length > 0 && (
                        <ul className="space-y-3 mb-5">
                          {bulletPoints.map((point: string, i: number) => (
                            <li key={i} className="flex items-start gap-3 text-gray-700">
                              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0 mt-0.5" strokeWidth={2.25} />
                              <span className="text-base sm:text-lg leading-relaxed">{point}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="text-gray-600 leading-relaxed text-base sm:text-lg whitespace-pre-line">
                        {section.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Installation Packages Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-blue-100 rounded-2xl mb-5">
              <Award className="w-7 h-7 md:w-8 md:h-8 text-blue-600" strokeWidth={2.25} />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Installation Packages
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the perfect home charging package for your needs. All packages include professional installation by our certified technicians.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {pagePackages.map((pkg: any, index: number) => {
              const PkgIcon = typeof pkg.icon === 'function' ? pkg.icon : (index === 0 ? Home : index === 1 ? Zap : Award);
              return (
                <div
                  key={pkg.name}
                  className={`relative rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 flex flex-col ${
                    pkg.highlighted
                      ? 'border-orange-500 bg-gradient-to-b from-orange-50 to-white shadow-2xl shadow-orange-100/50 scale-100 md:-mt-4 md:mb-4'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-xl'
                  }`}
                >
                  {pkg.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-1.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-1.5">
                        <Star className="w-4 h-4" fill="currentColor" />
                        MOST POPULAR
                        <Star className="w-4 h-4" fill="currentColor" />
                      </div>
                    </div>
                  )}

                  <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
                    pkg.highlighted
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    <PkgIcon className="w-7 h-7" strokeWidth={2.25} />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-1">{pkg.name}</h3>
                  <p className="text-gray-500 text-sm mb-5">{pkg.description}</p>

                  <div className="mb-6 pb-6 border-b border-gray-100">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-gray-500">ETB</span>
                      <span className={`text-4xl sm:text-5xl font-extrabold ${
                        pkg.highlighted ? 'text-orange-600' : 'text-gray-900'
                      }`}>
                        {pkg.price}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">One-time payment, installation included</p>
                  </div>

                  <ul className="space-y-3 flex-1 mb-7">
                    {pkg.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                          pkg.highlighted ? 'text-orange-500' : 'text-green-500'
                        }`} strokeWidth={2.5} />
                        <span className="text-sm sm:text-base text-gray-700 leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={`tel:+251110000000`}
                    className={`block text-center py-3.5 px-6 rounded-xl font-bold text-base transition-all duration-200 ${
                      pkg.highlighted
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-xl'
                        : 'bg-gray-900 text-white hover:bg-gray-800 shadow-md'
                    }`}
                  >
                    Get This Package
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      {pageFaqs.length > 0 && (
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12 md:mb-14">
                <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 bg-orange-100 rounded-2xl mb-5">
                  <HelpCircle className="w-7 h-7 md:w-8 md:h-8 text-orange-600" strokeWidth={2.25} />
                </div>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                  Everything you need to know about home charging for your Geely electric vehicle.
                </p>
              </div>

              <div className="space-y-5">
                {pageFaqs.map((faq: any, index: number) => (
                  <div
                    key={index}
                    className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 hover:border-orange-200 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start gap-4 mb-3">
                      <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg flex items-center justify-center border border-orange-100">
                        <span className="font-bold text-orange-600 text-base">Q</span>
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug pt-1">
                        {faq.question}
                      </h3>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                        <span className="font-bold text-blue-600 text-base">A</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed text-base sm:text-lg pt-1">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-80 h-80 bg-orange-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
              Ready to Install Your Home Charger?
            </h2>
            <p className="text-lg sm:text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Contact our installation team today for a free site survey and personalized consultation.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center mb-10">
              <a
                href="tel:+251110000000"
                className="flex items-center gap-4 px-8 py-4 bg-white text-blue-900 rounded-2xl font-bold text-lg shadow-xl hover:bg-gray-50 hover:shadow-2xl transition-all duration-300 w-full sm:w-auto justify-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Phone className="w-6 h-6 text-white" strokeWidth={2.25} />
                </div>
                <div className="text-left">
                  <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Call Us</div>
                  <div className="text-2xl text-blue-900 font-extrabold">+251 11 000 0000</div>
                </div>
              </a>

              <a
                href="mailto:homecharging@geely-ethiopia.com"
                className="flex items-center gap-4 px-8 py-4 bg-blue-700/40 backdrop-blur-sm text-white rounded-2xl font-bold text-lg border-2 border-white/20 hover:bg-blue-700/60 hover:border-white/30 transition-all duration-300 w-full sm:w-auto justify-center"
              >
                <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-white" strokeWidth={2.25} />
                </div>
                <div className="text-left">
                  <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">Email Us</div>
                  <div className="text-lg md:text-xl text-white font-extrabold">homecharging@geely-ethiopia.com</div>
                </div>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto pt-6 border-t border-white/15">
              <div className="flex items-center gap-3 justify-center sm:justify-start">
                <Clock className="w-6 h-6 text-orange-400 flex-shrink-0" strokeWidth={2.25} />
                <span className="text-blue-100 text-base font-medium">Same-week appointments</span>
              </div>
              <div className="flex items-center gap-3 justify-center">
                <Users className="w-6 h-6 text-orange-400 flex-shrink-0" strokeWidth={2.25} />
                <span className="text-blue-100 text-base font-medium">Certified technicians</span>
              </div>
              <div className="flex items-center gap-3 justify-center sm:justify-end">
                <Shield className="w-6 h-6 text-orange-400 flex-shrink-0" strokeWidth={2.25} />
                <span className="text-blue-100 text-base font-medium">Full warranty included</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
