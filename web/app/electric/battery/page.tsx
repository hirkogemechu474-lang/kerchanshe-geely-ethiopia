import { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Battery, Zap, Shield, Clock, Leaf, Wrench, BarChart3, AlertCircle, HelpCircle, Award } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Battery Technology & Warranty | Geely Electric Vehicles Ethiopia',
  description: 'Comprehensive guide to Geely EV battery technology, capacity, range, charging, warranty, safety, and maintenance for Ethiopian customers.',
  keywords: 'Geely EV battery, electric vehicle battery warranty, EV battery lifespan, battery technology Ethiopia',
};

const icons = {
  technology: Battery,
  capacity: BarChart3,
  range: Zap,
  charging: Clock,
  lifespan: Award,
  warranty: Shield,
  safety: AlertCircle,
  maintenance: Wrench,
  recycling: Leaf,
  faq: HelpCircle
};

export default async function BatteryPage() {
  // Get or create the battery page record
  let page = await prisma.electricPage.findUnique({
    where: { slug: 'battery' }
  });

  // Create default page if it doesn't exist
  if (!page) {
    page = await prisma.electricPage.create({
      data: {
        title: 'Battery & Warranty',
        slug: 'battery',
        pageType: 'custom',
        heroTitle: 'Advanced Battery Technology',
        heroSubtitle: 'Power, Performance, and Peace of Mind',
        heroImage: '/images/electric/battery-hero.jpg',
        content: 'Geely electric vehicles are powered by advanced lithium-ion battery technology, engineered for performance, safety, and longevity.',
        sections: JSON.stringify([
          {
            id: 'technology',
            title: 'Battery Technology',
            content: 'Our electric vehicles use advanced lithium-ion battery packs with intelligent battery management systems (BMS) that optimize performance, safety, and longevity. The battery cells are sourced from world-leading suppliers and engineered to withstand the Ethiopian climate.'
          },
          {
            id: 'capacity',
            title: 'Capacity & Specifications',
            content: 'The Geely Geometry EX5 features a high-capacity battery pack providing excellent range for both city and highway driving. The battery energy density ensures maximum range while maintaining a compact and efficient design.'
          },
          {
            id: 'range',
            title: 'Range Performance',
            content: 'Achieve up to 480km on a single charge under optimal conditions. Real-world range depends on driving style, terrain, climate, and vehicle load. Our intelligent energy management system helps maximize your range in all conditions.'
          },
          {
            id: 'charging',
            title: 'Charging Time',
            content: 'Fast DC charging: 30-80% in approximately 30 minutes. Level 2 AC charging: Full charge in 6-8 hours. Home charging (standard outlet): Full charge overnight. Charging times vary based on charger power and battery temperature.'
          },
          {
            id: 'lifespan',
            title: 'Battery Lifespan',
            content: 'Geely EV batteries are designed to retain over 80% capacity after 8 years or 160,000km of typical use. Advanced thermal management and intelligent charging algorithms help maximize battery life. Proper care can extend battery performance even further.'
          },
          {
            id: 'warranty',
            title: 'Warranty Coverage',
            content: 'All Geely electric vehicles come with comprehensive battery warranty coverage: 8 years or 160,000km warranty on the battery pack. Coverage includes capacity degradation below 70%, manufacturing defects, and component failures. Extended warranty options available.'
          },
          {
            id: 'safety',
            title: 'Safety Features',
            content: 'Multiple layers of battery safety protection: IP67 waterproof and dustproof rating, thermal management system preventing overheating, collision protection with reinforced battery enclosure, real-time monitoring for abnormal conditions, automatic power cutoff in emergencies.'
          },
          {
            id: 'maintenance',
            title: 'Maintenance Tips',
            content: 'Keep your battery healthy: Avoid frequent full discharges (keep between 20-80%), use recommended charging equipment, park in shade when possible in hot weather, follow scheduled service intervals, update battery management software as recommended.'
          },
          {
            id: 'recycling',
            title: 'Recycling & Sustainability',
            content: 'Geely is committed to sustainable battery lifecycle management. End-of-life batteries are recycled through certified partners, recovering valuable materials. Second-life applications for batteries that no longer meet vehicle standards. Environmentally responsible disposal practices.'
          }
        ]),
        metadata: JSON.stringify({
          faqs: [
            {
              question: 'How long does the battery last?',
              answer: 'The battery is designed to retain over 80% of its original capacity after 8 years or 160,000km under normal use conditions. With proper care, many batteries exceed this performance.'
            },
            {
              question: 'Can I charge at home?',
              answer: 'Yes! You can charge using a standard household outlet (slow charging) or install a Level 2 home charger for faster charging. We recommend professional installation of home charging equipment.'
            },
            {
              question: 'What happens if the battery fails?',
              answer: 'Battery failures are rare. If a manufacturing defect occurs within the warranty period (8 years/160,000km), it will be repaired or replaced at no cost. Regular service helps prevent issues.'
            },
            {
              question: 'How does temperature affect the battery?',
              answer: 'Extreme temperatures can temporarily affect range and charging speed. Our thermal management system helps mitigate this. Park in shade when possible in hot weather and pre-condition the cabin while plugged in.'
            },
            {
              question: 'Can the battery be replaced?',
              answer: 'Yes, batteries can be replaced if needed, though this is rarely necessary during the vehicle\'s useful life. Replacement costs decrease over time as battery technology improves. Contact your Geely dealer for details.'
            },
            {
              question: 'Is the battery safe in a collision?',
              answer: 'Yes. The battery pack is enclosed in a reinforced structure designed to protect it in collisions. Multiple safety systems monitor the battery and automatically disconnect power if an impact is detected.'
            }
          ]
        }),
        isPublished: true,
        displayOrder: 1
      }
    });
  }

  const sections = JSON.parse(page.sections as string);
  const metadata = JSON.parse(page.metadata as string);
  const faqs = metadata.faqs || [];

  return (
    <>
      <Header />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-16 md:py-24">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <Battery className="w-16 h-16 mx-auto mb-6 text-blue-300" />
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                {page.heroTitle}
              </h1>
              <p className="text-xl text-blue-100 mb-6">
                {page.heroSubtitle}
              </p>
              <p className="text-lg text-blue-200">
                {page.content}
              </p>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-12">
              {sections.map((section: any, index: number) => {
                const IconComponent = icons[section.id as keyof typeof icons] || Battery;
                return (
                  <div
                    key={section.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          {index + 1}. {section.title}
                        </h2>
                        <div className="text-gray-600 leading-relaxed whitespace-pre-line">
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

        {/* FAQ Section */}
        {faqs.length > 0 && (
          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-12">
                  <HelpCircle className="w-12 h-12 mx-auto mb-4 text-blue-600" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-gray-600">
                    Common questions about Geely EV batteries
                  </p>
                </div>

                <div className="space-y-6">
                  {faqs.map((faq: any, index: number) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg border border-gray-200 p-6"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">
                        Q: {faq.question}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        A: {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Experience Electric?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Book a test drive and experience Geely's advanced electric vehicle technology firsthand.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/test-drive"
                className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                Book Test Drive
              </a>
              <Link
                href="/dealers"
                className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors border-2 border-white/20"
              >
                Find a Dealer
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
