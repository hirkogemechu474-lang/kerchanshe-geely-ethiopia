import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { MainLayout } from '@/components/MainLayout';
import { MapPin, Zap, Clock, Shield, DollarSign, Coffee, HelpCircle, Wifi, Utensils, Bath, Car } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Charging Stations Map | Geely Electric Vehicles Ethiopia',
  description: 'Find Geely EV charging stations across Ethiopia. Explore our growing network of DC fast chargers, Level 2 stations, and home charging solutions.',
  keywords: 'Geely charging stations, EV charging Ethiopia, electric vehicle charging map, DC fast charger Addis Ababa',
};

const icons = {
  map: MapPin,
  station: Zap,
  speed: Clock,
  reliability: Shield,
  pricing: DollarSign,
  amenities: Coffee,
  faq: HelpCircle
};

const STATION_TYPE_LABELS: Record<string, string> = {
  'fast-dc': 'Fast DC',
  'level-2': 'Level 2',
  'home': 'Home',
};

const STATION_TYPE_COLORS: Record<string, string> = {
  'fast-dc': 'from-red-500 to-orange-600',
  'level-2': 'from-blue-500 to-cyan-600',
  'home': 'from-green-500 to-emerald-600',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  operational: 'Operational',
  maintenance: 'Maintenance',
  planned: 'Coming Soon',
};

function normalizeStation(station: any, fallbackIndex: number): any {
  const type = station.stationType || 'level-2';
  const typeLabel = STATION_TYPE_LABELS[type] || 'Level 2';
  const availability = station.availability || 'operational';
  const amenities: string[] = Array.isArray(station.amenities) ? station.amenities : [];
  return {
    id: station.id || fallbackIndex,
    name: station.name,
    location: station.address ? `${station.city}${station.address ? ' - ' + station.address : ''}` : station.city,
    chargers: `${station.chargerCount || 1} x ${typeLabel} (${station.maxPower || ''})`,
    hours: station.hours || '24/7 Available',
    amenities: amenities.length ? amenities : ['Parking'],
    status: AVAILABILITY_LABELS[availability] || 'Operational',
    color: STATION_TYPE_COLORS[type] || 'from-blue-500 to-cyan-600',
    pricing: station.pricing || null,
    connector: Array.isArray(station.connector) ? station.connector : [],
    images: Array.isArray(station.images) ? station.images : [],
  };
}

const featuredStations = [
  {
    id: 1,
    name: 'Bole International Airport',
    location: 'Bole, Addis Ababa',
    chargers: '4 x DC Fast (120kW)',
    hours: '24/7 Available',
    amenities: ['WiFi', 'Lounge', 'Parking', 'Café'],
    status: 'Operational',
    color: 'from-green-500 to-emerald-600'
  },
  {
    id: 2,
    name: 'Meskel Square',
    location: 'Downtown Addis Ababa',
    chargers: '6 x Level 2 (7kW) + 2 x DC Fast',
    hours: '6:00 AM - 12:00 AM',
    amenities: ['WiFi', 'Restrooms', 'Parking', 'Shopping'],
    status: 'Operational',
    color: 'from-blue-500 to-cyan-600'
  },
  {
    id: 3,
    name: 'Edna Mall',
    location: 'Bole Medhanealem, Addis Ababa',
    chargers: '4 x Level 2 (7kW)',
    hours: '9:00 AM - 11:00 PM',
    amenities: ['WiFi', 'Restaurants', 'Parking', 'Cinema'],
    status: 'Operational',
    color: 'from-purple-500 to-indigo-600'
  },
  {
    id: 4,
    name: 'Dire Dawa City Center',
    location: 'Dire Dawa, Eastern Ethiopia',
    chargers: '2 x DC Fast (60kW) + 4 x Level 2',
    hours: '7:00 AM - 10:00 PM',
    amenities: ['WiFi', 'Restrooms', 'Parking', 'Restaurant'],
    status: 'Coming Soon',
    color: 'from-orange-500 to-red-500'
  }
];

const faqs = [
  {
    question: 'Where are Geely charging stations located in Ethiopia?',
    answer: 'Our charging network is rapidly expanding across Ethiopia. Currently, stations are available in Addis Ababa at key locations including Bole Airport, Meskel Square, and Edna Mall. We are also launching stations in regional cities including Dire Dawa, Adama, Hawassa, and Bahir Dar throughout the year.'
  },
  {
    question: 'What types of chargers are available at the stations?',
    answer: 'Our stations offer a mix of charging options to suit different needs. DC Fast Chargers (60-120kW) provide rapid charging for long trips, delivering 30-80% charge in 20-30 minutes. Level 2 chargers (7kW) are ideal for top-ups during shopping or work, adding about 50km of range per hour of charging.'
  },
  {
    question: 'How much does it cost to charge at a public station?',
    answer: 'Charging is priced transparently per kilowatt-hour (kWh). DC fast charging is typically ETB 8-12 per kWh, while Level 2 charging costs ETB 5-7 per kWh. Many partner locations offer complimentary or discounted charging for Geely EV owners. No subscription or hidden fees apply.'
  },
  {
    question: 'Are the charging stations available 24/7?',
    answer: 'Our flagship locations such as Bole International Airport operate 24 hours a day, 7 days a week. Mall and shopping center stations follow the operating hours of their host venues, typically 6 AM to midnight. All stations display real-time availability and hours on our mobile app and website.'
  },
  {
    question: 'Do I need a membership or special card to use the chargers?',
    answer: 'No membership is required. You can start charging simply by scanning the QR code at the station with your phone, using the Geely EV mobile app, or using a contactless payment card. Registered Geely EV owners enjoy discounted rates and priority access through the app.'
  },
  {
    question: 'What amenities are available at charging stations?',
    answer: 'Most stations offer comfortable waiting areas with complimentary WiFi. Many are located within or adjacent to shopping centers, cafes, and restaurants so you can relax, dine, or shop while charging. All stations feature dedicated EV parking, lighting for nighttime use, and 24/7 security camera coverage.'
  }
];

export default async function ChargingMapPage() {
  let page = await prisma.electricPage.findUnique({
    where: { slug: 'charging-map' }
  });

  if (!page) {
    page = await prisma.electricPage.create({
      data: {
        title: 'Charging Stations Map',
        slug: 'charging-map',
        pageType: 'custom',
        heroTitle: 'Find Charging Stations Nationwide',
        heroSubtitle: 'DISCOVER OUR GROWING NETWORK',
        heroImage: '/images/electric/charging-hero.jpg',
        content: 'Locate Geely charging stations across Ethiopia. From Addis Ababa to regional cities, our expanding network ensures you can charge conveniently wherever your journey takes you.',
        sections: JSON.stringify([
          {
            id: 'map',
            title: 'Interactive Map Overview',
            content: 'Our network spans major cities and highways across Ethiopia. From the heart of Addis Ababa to historic landmarks in the north and emerging business hubs in the east, charging locations are strategically positioned to keep you on the move. The network is growing monthly with new stations launching in Adama, Hawassa, Bahir Dar, and Mekelle throughout 2026. Each charging point is carefully selected to ensure accessibility, safety, and convenience for all Geely EV owners.'
          },
          {
            id: 'station',
            title: 'Station Types Available',
            content: 'We offer three primary charging options to suit every situation. DC Fast Chargers deliver maximum power for rapid top-ups during highway travel or busy schedules, available at flagship locations. Level 2 public chargers provide reliable charging for daily commuting and shopping stops, ideal for 1-3 hour sessions. Home charging solutions let you start every day with a full battery—our certified technicians can install a dedicated charger at your residence or apartment for ultimate convenience.'
          },
          {
            id: 'speed',
            title: 'Charging Speeds & Hours',
            content: 'Most charging stations operate 24 hours a day, 7 days a week for your convenience. DC Fast Chargers provide 120kW output, delivering 30-80% charge in approximately 20-30 minutes depending on battery size and temperature. Level 2 public chargers offer 7kW steady charging, adding roughly 50km of range per hour. Our intelligent app displays real-time station availability, current wait times, and charging speed so you can plan your stops efficiently.'
          },
          {
            id: 'reliability',
            title: 'Reliability & Support',
            content: 'Every charging station is backed by 24/7 technical support and monitored in real time by our network operations center. All chargers receive regular maintenance inspections to ensure maximum uptime. Should you encounter any issues, our roadside assistance team is available around the clock at every station location. On-site help buttons connect you instantly to a support agent who can troubleshoot or dispatch a technician. Our stations boast a 98% uptime record, giving you confidence on every journey.'
          },
          {
            id: 'pricing',
            title: 'Transparent Pricing',
            content: 'We believe in straightforward, fair pricing with no surprises. All charging is billed per kilowatt-hour (kWh) consumed, displayed clearly at every station and in the app before you start. DC Fast Charging rates: ETB 8-12 per kWh. Level 2 public charging: ETB 5-7 per kWh. Geely EV registered owners receive an automatic 15% loyalty discount on all public charging sessions. There are no monthly subscriptions, idle fees under 30 minutes, or hidden transaction charges. You pay only for the electricity you use.'
          },
          {
            id: 'amenities',
            title: 'Amenities at Stations',
            content: 'Our charging locations are designed to make your wait enjoyable and productive. Every station features dedicated EV parking bays with clear signage and security lighting. Complimentary high-speed WiFi is available at all flagship locations. Partner cafes and restaurants offer exclusive discounts for charging customers. Modern restroom facilities are accessible on-site at most stations. Covered waiting areas provide shade during sunny days and shelter during rain. Select premium locations include comfortable lounges with refreshments and EV information centers.'
          }
        ]),
        metadata: JSON.stringify({
          featuredStations: featuredStations,
          faqs: faqs
        }),
        isPublished: true,
        displayOrder: 2
      }
    });
  }

  const sections = JSON.parse(page.sections as string);
  const metadata = page.metadata ? JSON.parse(page.metadata as string) : {};
  const pageFaqs = metadata.faqs || faqs;

  // Live charging stations from the admin-managed ChargingStation model.
  // Fall back to the seed/legacy featuredStations only when none exist yet.
  const dbStations = await prisma.chargingStation.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
  });
  const fallbackStations: any[] = metadata.featuredStations || featuredStations;
  const stations =
    dbStations.length > 0
      ? dbStations.map((s, i) => normalizeStation(s, i))
      : fallbackStations;

  return (
    <MainLayout>
      <section className="relative bg-gradient-to-br from-green-600 via-green-500 to-blue-600 text-white py-16 md:py-24">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <MapPin className="w-16 h-16 mx-auto mb-6 text-green-200" />
            <div className="text-[13px] tracking-[0.14em] text-green-100 font-bold mb-3">
              {page.heroSubtitle}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {page.heroTitle}
            </h1>
            <p className="text-lg text-green-50 leading-relaxed">
              {page.content}
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-4xl mx-auto space-y-12">
            {sections.map((section: any, index: number) => {
              const IconComponent = icons[section.id as keyof typeof icons] || MapPin;
              return (
                <div
                  key={section.id}
                  className="bg-white rounded-xl shadow-sm border border-line p-8 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-navy mb-4">
                        {index + 1}. {section.title}
                      </h2>
                      <div className="text-steel leading-relaxed whitespace-pre-line">
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

      <section className="py-16 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <MapPin className="w-12 h-12 mx-auto mb-4 text-green-600" />
            <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
              Featured Charging Locations
            </h2>
            <p className="text-steel text-base max-w-2xl mx-auto">
              Explore our flagship stations across Ethiopia. More locations coming online every month.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stations.map((station: any) => (
              <div
                key={station.id}
                className="bg-white rounded-xl border border-line overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`h-40 bg-gradient-to-br ${station.color} flex items-center justify-center relative`}>
                  {station.images && station.images.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={station.images[0]}
                      alt={station.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <MapPin className="text-white" size={56} />
                  )}
                  <span className={`absolute top-4 right-4 text-xs font-bold px-4 py-1 rounded-full ${
                    station.status === 'Operational' 
                      ? 'bg-white text-green-600' 
                      : 'bg-white/90 text-orange-600'
                  }`}>
                    {station.status}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-navy mb-2">
                    {station.name}
                  </h3>
                  <p className="text-sm text-steel mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {station.location}
                  </p>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-sm">
                      <Zap className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span className="text-steel">{station.chargers}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Clock className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-steel">{station.hours}</span>
                    </div>
                    {station.pricing && (
                      <div className="flex items-center gap-3 text-sm">
                        <DollarSign className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span className="text-steel">{station.pricing}</span>
                      </div>
                    )}
                    {station.connector && station.connector.length > 0 && (
                      <div className="flex items-center gap-3 text-sm">
                        <Zap className="w-4 h-4 text-purple-600 flex-shrink-0" />
                        <span className="text-steel">{station.connector.join(' · ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-line pt-4">
                    <p className="text-xs font-semibold text-navy mb-3">AMENITIES</p>
                    <div className="flex flex-wrap gap-2">
                      {station.amenities.map((amenity: string, idx: number) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-ice text-navy rounded-full"
                        >
                          {amenity === 'WiFi' && <Wifi className="w-3 h-3" />}
                          {amenity === 'Restrooms' && <Bath className="w-3 h-3" />}
                          {amenity === 'Parking' && <Car className="w-3 h-3" />}
                          {(amenity === 'Café' || amenity === 'Restaurants' || amenity === 'Restaurant') && <Utensils className="w-3 h-3" />}
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {pageFaqs.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <HelpCircle className="w-12 h-12 mx-auto mb-4 text-green-600" />
                <h2 className="text-3xl md:text-4xl font-bold text-navy mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-steel">
                  Everything you need to know about Geely EV charging stations
                </p>
              </div>

              <div className="space-y-6">
                {pageFaqs.map((faq: any, index: number) => (
                  <div
                    key={index}
                    className="bg-ice rounded-lg border border-line p-6"
                  >
                    <h3 className="text-lg font-semibold text-navy mb-3">
                      Q: {faq.question}
                    </h3>
                    <p className="text-steel leading-relaxed">
                      A: {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-gradient-to-br from-green-600 to-blue-600 text-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Experience Electric Driving?
          </h2>
          <p className="text-xl text-green-50 mb-8 max-w-2xl mx-auto">
            Book a test drive to explore our electric vehicles, or visit your nearest Geely dealer to learn more about charging solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/test-drive"
              className="px-8 py-4 bg-white text-green-600 rounded-lg font-bold hover:bg-gray-100 transition-colors text-sm"
            >
              Book Test Drive
            </Link>
            <Link
              href="/dealers"
              className="px-8 py-4 bg-transparent text-white rounded-lg font-bold hover:bg-white hover:bg-opacity-10 transition-colors border-2 border-white/30 text-sm"
            >
              Find a Dealer
            </Link>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
