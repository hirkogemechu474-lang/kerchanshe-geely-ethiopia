import { Metadata } from 'next';
import { MainLayout } from '@/components/MainLayout';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import {
  Leaf,
  Wind,
  Cloud,
  TreeDeciduous,
  Droplets,
  Factory,
  Recycle,
  Trees,
  HelpCircle,
  Globe,
  Sprout,
  BarChart3,
  ChevronRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Environmental Impact | Geely Electric Vehicles Ethiopia',
  description: 'Discover how Geely electric vehicles reduce emissions, improve air quality, and contribute to a cleaner, greener future for Ethiopia.',
  keywords: 'Geely EV environment, electric vehicle emissions Ethiopia, zero emissions car Addis Ababa, green mobility Ethiopia',
};

const contentSections = [
  {
    id: 'emissions',
    icon: Wind,
    title: 'Zero Tailpipe Emissions',
    subtitle: 'Pure Air, Pure Driving',
    color: 'green',
    bgGradient: 'from-green-50 to-emerald-50',
    borderColor: 'border-green-200',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    points: [
      '0 grams of CO2 per kilometer driven',
      'Zero NOx (Nitrogen Oxides) emissions',
      'No particulate matter (PM2.5, PM10) output',
      'Eliminates harmful exhaust fumes entirely',
    ],
  },
  {
    id: 'air-quality',
    icon: Cloud,
    title: 'Air Quality Improvement',
    subtitle: 'Healthier Cities for Everyone',
    color: 'sky',
    bgGradient: 'from-sky-50 to-blue-50',
    borderColor: 'border-sky-200',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    points: [
      'Dramatically reduces urban smog formation',
      'Lower rates of respiratory & cardiovascular illnesses',
      'Cleaner air for children, elderly & vulnerable groups',
      'Significant healthcare cost savings for communities',
    ],
  },
  {
    id: 'co2-reduction',
    icon: TreeDeciduous,
    title: 'CO2 Reduction Impact',
    subtitle: 'Tons Saved Per Vehicle',
    color: 'emerald',
    bgGradient: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    points: [
      '4.6 tons CO2 saved per vehicle annually',
      '46+ tons over a 10-year vehicle lifetime',
      'Equivalent to planting ~225 mature trees per car',
      'Supports Ethiopia carbon neutrality goals',
    ],
  },
  {
    id: 'oil-dependency',
    icon: Droplets,
    title: 'Reduced Oil Dependency',
    subtitle: 'A Sustainable Energy Future',
    color: 'teal',
    bgGradient: 'from-teal-50 to-cyan-50',
    borderColor: 'border-teal-200',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    points: [
      'Eliminates need for gasoline & diesel drilling',
      'Prevents risk of oil spills & environmental disasters',
      'Reduces national petroleum import expenditures',
      'Shifts consumption to domestic renewable energy sources',
    ],
  },
  {
    id: 'noise-pollution',
    icon: Factory,
    title: 'Noise Pollution Reduction',
    subtitle: 'Quiet, Peaceful Electric Motors',
    color: 'indigo',
    bgGradient: 'from-indigo-50 to-violet-50',
    borderColor: 'border-indigo-200',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    points: [
      'Near-silent operation compared to combustion engines',
      '50-70% lower noise levels in urban environments',
      'Reduces stress-related illnesses & sleep disturbances',
      'Improves quality of life in residential neighborhoods',
    ],
  },
  {
    id: 'battery-recycling',
    icon: Recycle,
    title: 'Battery Recycling Program',
    subtitle: 'Circular Economy Commitment',
    color: 'lime',
    bgGradient: 'from-lime-50 to-green-50',
    borderColor: 'border-lime-200',
    iconBg: 'bg-lime-100',
    iconColor: 'text-lime-600',
    points: [
      '80-95% recovery rate for lithium, cobalt, nickel & copper',
      'Second-life battery use for solar energy storage',
      'Certified partners for environmentally safe processing',
      'Closed-loop manufacturing: recycled materials in new batteries',
    ],
  },
];

const impactStats = [
  {
    label: 'Tons of CO2 Saved / Year',
    value: '4,600',
    unit: 'tons',
    icon: TreeDeciduous,
    iconBg: 'bg-green-500',
    iconColor: 'text-white',
    description: 'Prevented from entering the atmosphere',
  },
  {
    label: 'Trees Equivalent Planted',
    value: '225,000',
    unit: 'trees',
    icon: Trees,
    iconBg: 'bg-emerald-500',
    iconColor: 'text-white',
    description: 'Mature trees needed to absorb same CO2',
  },
  {
    label: 'Barrels of Oil Saved',
    value: '31,200',
    unit: 'barrels',
    icon: Droplets,
    iconBg: 'bg-teal-500',
    iconColor: 'text-white',
    description: 'Crude oil not extracted or refined',
  },
  {
    label: 'Liters of Fuel Saved',
    value: '5,250,000',
    unit: 'liters',
    icon: Sprout,
    iconBg: 'bg-green-600',
    iconColor: 'text-white',
    description: 'Petrol that stays in the ground',
  },
];

const faqs = [
  {
    question: 'Are electric vehicles really better for the environment if electricity comes from fossil fuels?',
    answer:
      'Yes, EVs are still significantly cleaner even with Ethiopia current grid mix. Studies show EVs produce 60-70% fewer lifecycle emissions than petrol vehicles. As Ethiopia expands its renewable energy capacity (hydro, solar, wind), the advantage grows even larger. A single EV on Ethiopian roads saves approximately 4.6 tons of CO2 annually compared to an average petrol car.',
  },
  {
    question: 'What happens to EV batteries at the end of their life? Are they disposed of safely?',
    answer:
      'Geely operates a comprehensive battery recycling program. End-of-life EV batteries go through multiple stages: first, they are evaluated for second-life applications (such as solar energy storage systems), then professionally recycled using certified processes that recover 80-95% of valuable materials including lithium, cobalt, nickel, and copper. These recycled materials are then reused to manufacture new battery packs, creating a true circular economy.',
  },
  {
    question: 'How do electric vehicles specifically improve air quality in Addis Ababa?',
    answer:
      'Addis Ababa faces significant air quality challenges due to vehicle emissions, particularly in dense traffic areas like Meskel Square, Merkato, and Bole. Electric vehicles produce zero tailpipe emissions—meaning no NOx, no particulate matter (PM2.5/PM10), and no exhaust fumes. If just 10% of Addis Ababa vehicles were electric, we would see measurable reductions in smog, fewer respiratory hospital admissions, and improved quality of life for the 5+ million residents.',
  },
  {
    question: 'How much CO2 does one Geely EV save compared to a similar petrol car?',
    answer:
      'A Geely electric vehicle driven 15,000 km per year in Ethiopia saves approximately 4.6 tons of CO2 annually compared to a typical petrol sedan. Over a 10-year vehicle lifetime, that is 46+ tons of CO2 prevented—the equivalent of planting about 225 mature trees, or the carbon absorbed by roughly 2.5 hectares of forest. The savings are even greater for high-mileage drivers such as taxis and commercial fleets.',
  },
  {
    question: 'Is lithium mining for EV batteries worse for the environment than oil extraction?',
    answer:
      'While all resource extraction has environmental impact, responsible lithium production is far less damaging than the ongoing cycle of oil extraction, transport, refining, and combustion. Unlike oil which is permanently burned and releases CO2 into the atmosphere, lithium is recyclable and reusable. Geely partners with ethically certified lithium suppliers and invests in next-generation battery technologies that reduce or eliminate cobalt entirely.',
  },
  {
    question: 'How does Ethiopia Green Legacy initiative align with electric vehicle adoption?',
    answer:
      'Ethiopia Green Legacy initiative—through which over 25 billion trees have been planted—shows the nation dedication to environmental restoration. Electric vehicle adoption perfectly complements this effort: the trees pull CO2 out of the air, and EVs prevent new emissions from being released in the first place. Together, this strategy creates a powerful one-two punch in the fight against climate change while positioning Ethiopia as a continental leader in sustainable development.',
  },
];

export default async function EnvironmentPage() {
  let page;
  try {
    page = await prisma.electricPage.findUnique({
      where: { slug: 'environment' },
    });

    if (!page) {
      page = await prisma.electricPage.create({
        data: {
          title: 'Environmental Impact',
          slug: 'environment',
          pageType: 'custom',
          heroTitle: 'Drive Into A Cleaner Future',
          heroSubtitle: 'ENVIRONMENTAL IMPACT OF ELECTRIC MOBILITY',
          content:
            'Every kilometer driven in a Geely electric vehicle is a step toward cleaner air, healthier cities, and a greener Ethiopia.',
          isPublished: true,
          displayOrder: 2,
        },
      });
    }
  } catch (error) {
    console.error('Error fetching/creating environment page:', error);
  }

  return (
    <MainLayout>
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-emerald-600 to-teal-600 text-white py-16 md:py-24 lg:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-teal-300 blur-3xl" />
        </div>
        <div className="relative max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-white/15 backdrop-blur-sm rounded-2xl mb-8 border border-white/20">
              <Trees className="w-10 h-10 md:w-12 md:h-12 text-green-100" />
            </div>
            <div className="text-xs md:text-sm tracking-[0.16em] font-bold uppercase text-green-100 mb-4">
              {page?.heroSubtitle || 'ENVIRONMENTAL IMPACT OF ELECTRIC MOBILITY'}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              {page?.heroTitle || 'Drive Into A Cleaner Future'}
            </h1>
            <p className="text-lg md:text-xl text-green-50 mb-10 max-w-2xl mx-auto leading-relaxed">
              {page?.content ||
                'Every kilometer driven in a Geely electric vehicle is a step toward cleaner air, healthier cities, and a greener Ethiopia.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/test-drive"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-green-700 rounded-lg font-bold text-sm hover:bg-green-50 transition-colors shadow-xl shadow-green-900/30"
              >
                Book Test Drive
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/models/geometry-ex5"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-transparent text-white rounded-lg font-bold text-sm border-2 border-white/30 hover:bg-white/10 transition-colors"
              >
                Explore EV Models
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="text-center mb-14 md:mb-16">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Six Pillars of Environmental Impact
            </h2>
            <p className="text-base md:text-lg text-steel max-w-2xl mx-auto">
              Every Geely electric vehicle delivers measurable environmental benefits across key sustainability dimensions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {contentSections.map((section, idx) => {
              const Icon = section.icon;
              return (
                <div
                  key={section.id}
                  className={`relative bg-gradient-to-br ${section.bgGradient} rounded-2xl border ${section.borderColor} p-6 md:p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`flex items-center justify-center w-12 h-12 ${section.iconBg} rounded-xl`}
                    >
                      <Icon className={`w-6 h-6 ${section.iconColor}`} />
                    </div>
                    <div className="text-xs font-bold text-steel uppercase tracking-wider">
                      0{idx + 1}
                    </div>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold text-navy mb-1.5">
                    {section.title}
                  </h3>
                  <div className="text-sm font-semibold text-steel mb-5">
                    {section.subtitle}
                  </div>
                  <ul className="space-y-3">
                    {section.points.map((point, i) => (
                      <li key={i} className="flex gap-3 text-sm text-steel leading-relaxed">
                        <span className={`mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${section.iconColor.replace('text-', 'bg-')}`} />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gradient-to-br from-ice via-white to-green-50">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-xl mb-4">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-xs tracking-[0.14em] font-bold uppercase text-emerald-600 mb-3">
              Collective Impact
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              If 1,000 Drivers Switch to EV
            </h2>
            <p className="text-base md:text-lg text-steel max-w-2xl mx-auto">
              Imagine what happens when a thousand Ethiopians make the switch. The numbers tell a powerful story.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {impactStats.map((stat) => {
              const StatIcon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="group relative bg-white rounded-2xl border border-line p-6 md:p-8 shadow-sm hover:shadow-2xl hover:border-green-200 transition-all duration-300 overflow-hidden"
                >
                  <div className={`absolute -right-8 -top-8 w-32 h-32 ${stat.iconBg} opacity-5 rounded-full group-hover:opacity-10 transition-opacity`} />
                  <div className={`inline-flex items-center justify-center w-14 h-14 ${stat.iconBg} rounded-xl mb-5 shadow-lg`}>
                    <StatIcon className={`w-7 h-7 ${stat.iconColor}`} />
                  </div>
                  <div className="text-3xl md:text-4xl font-black text-navy mb-1.5 tracking-tight">
                    {stat.value}
                    <span className="text-base font-semibold text-steel ml-1.5">{stat.unit}</span>
                  </div>
                  <h4 className="text-sm font-bold text-navy mb-2 leading-snug">{stat.label}</h4>
                  <p className="text-xs text-steel leading-relaxed">{stat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-14 items-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-navy/5 rounded-xl mb-5">
                <Globe className="w-6 h-6 text-green-700" />
              </div>
              <div className="text-xs tracking-[0.14em] font-bold uppercase text-green-700 mb-3">
                Ethiopia-Specific Context
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-navy mb-6 leading-tight">
                Driving Green in the Land of Origins
              </h2>
              <div className="space-y-5 text-steel leading-relaxed text-base">
                <p>
                  <strong className="text-navy">Addis Ababa Air Quality:</strong> As one of Africa fastest-growing capital cities,
                  Addis Ababa faces urban air quality challenges from vehicle emissions. The Ethiopian Environment and Climate Change
                  Institute identifies transport as a major source of PM2.5, PM10, and NOx pollution, particularly in densely
                  populated corridors such as Bole, Meskel Square, and Merkato.
                </p>
                <p>
                  <strong className="text-navy">Green Legacy Initiative:</strong> Ethiopia Green Legacy campaign has successfully
                  planted over 25 billion trees since 2019, restoring degraded landscapes across the country. This extraordinary
                  effort is complemented by the shift to electric mobility: trees sequester existing CO2 while EVs prevent new
                  emissions from being released. Together, they represent a holistic approach to climate action.
                </p>
                <p>
                  <strong className="text-navy">Renewable Energy Advantage:</strong> Ethiopia generates over 90% of its electricity
                  from renewable hydropower, with rapid expansion in solar and wind. This means charging a Geely EV in Ethiopia is
                  among the cleanest anywhere in the world—far greener than in countries still dependent on coal and gas.
                </p>
              </div>
            </div>
            <div className="space-y-5">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 text-white rounded-2xl p-6 md:p-8 shadow-xl shadow-green-900/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-11 h-11 bg-white/15 rounded-xl">
                    <Sprout className="w-5 h-5 text-green-100" />
                  </div>
                  <h3 className="text-xl font-bold">25+ Billion Trees Planted</h3>
                </div>
                <p className="text-green-50 text-sm leading-relaxed">
                  Ethiopia Green Legacy is one of the world most ambitious reforestation programs, restoring watersheds and
                  biodiversity across every region of the country.
                </p>
              </div>
              <div className="bg-gradient-to-br from-navy to-blue-800 text-white rounded-2xl p-6 md:p-8 shadow-xl shadow-navy/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-11 h-11 bg-white/15 rounded-xl">
                    <ZapReplacement />
                  </div>
                  <h3 className="text-xl font-bold">90%+ Renewable Energy</h3>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed">
                  The national grid runs primarily on clean hydropower from the Blue Nile and Omo basins, with solar and wind
                  capacity expanding rapidly. Ethiopian EVs charge with some of the planet cleanest electrons.
                </p>
              </div>
              <div className="bg-gradient-to-br from-teal-600 to-cyan-600 text-white rounded-2xl p-6 md:p-8 shadow-xl shadow-teal-900/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center justify-center w-11 h-11 bg-white/15 rounded-xl">
                    <Cloud className="w-5 h-5 text-teal-100" />
                  </div>
                  <h3 className="text-xl font-bold">Cleaner Air in Cities</h3>
                </div>
                <p className="text-teal-50 text-sm leading-relaxed">
                  Each EV on Addis Ababa roads directly improves air quality for pedestrians, cyclists, residents, and children.
                  Widespread EV adoption will measurably reduce asthma and respiratory hospitalizations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 bg-gradient-to-b from-green-50/50 to-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="text-center mb-12 md:mb-14">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mb-4">
              <HelpCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-xs tracking-[0.14em] font-bold uppercase text-green-700 mb-3">
              Common Questions
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Environmental FAQs
            </h2>
            <p className="text-base md:text-lg text-steel max-w-2xl mx-auto">
              Everything you need to know about the environmental case for electric mobility in Ethiopia.
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4 md:space-y-5">
            {faqs.map((faq, index) => (
              <FAQItem key={index} faq={faq} index={index} />
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden py-16 md:py-20 bg-gradient-to-br from-green-700 via-emerald-600 to-teal-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-teal-300 blur-3xl" />
        </div>
        <div className="relative max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 md:w-24 md:h-24 bg-white/15 backdrop-blur-sm rounded-2xl mb-8 border border-white/20">
              <Leaf className="w-10 h-10 md:w-12 md:h-12 text-green-100" />
            </div>
            <h2 className="text-3xl md:text-5xl font-bold mb-5 leading-tight">
              Join the Green Revolution
            </h2>
            <p className="text-lg md:text-xl text-green-50 mb-10 max-w-2xl mx-auto leading-relaxed">
              Every Geely electric vehicle you drive is a vote for cleaner air, quieter streets, and a sustainable future
              for Ethiopia. Book your test drive today and experience silent, zero-emission driving firsthand.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/test-drive"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-green-700 rounded-lg font-bold text-sm hover:bg-green-50 transition-colors shadow-2xl shadow-green-900/30"
              >
                Book a Test Drive
                <ChevronRight className="w-4 h-4" />
              </Link>
              <Link
                href="/dealers"
                className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-transparent text-white rounded-lg font-bold text-sm border-2 border-white/30 hover:bg-white/10 transition-colors"
              >
                Visit a Showroom
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-green-100">
              <div className="flex items-center gap-2">
                <Leaf className="w-4 h-4" />
                <span>0 Tailpipe Emissions</span>
              </div>
              <div className="flex items-center gap-2">
                <Trees className="w-4 h-4" />
                <span>Save 4.6 Tons CO<sub>2</sub>/Year</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>90%+ Renewable Grid</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}

function FAQItem({ faq, index }: { faq: { question: string; answer: string }; index: number }) {
  return (
    <div className="group bg-white rounded-xl border border-line hover:border-green-200 hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="flex gap-4 p-6 md:p-7">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-lg font-bold text-navy mb-3 leading-snug group-hover:text-green-700 transition-colors">
            {faq.question}
          </h3>
          <p className="text-sm md:text-base text-steel leading-relaxed">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

function ZapReplacement() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-blue-100"
    >
      <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}
