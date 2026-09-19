'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { MainLayout } from '@/components/MainLayout';
import apiClient from '@/lib/apiClient';
import { getDealers, type Dealer } from '@/lib/api';
import { withBasePath } from '@/lib/publicPath';
import {
  AlertCircle, QrCode, UserPlus, Car, FileText, MapPin, Phone, Clock, Navigation,
  Star, Store, Sofa, Package, ParkingSquare, ShieldCheck,
} from 'lucide-react';

const STEPS = [
  {
    icon: UserPlus,
    title: 'Register',
    description: 'Just your name, phone, and email. No password, no account.',
  },
  {
    icon: Car,
    title: 'Browse Vehicles',
    description: 'Explore the full Geely lineup with photos, videos, and complete specifications.',
  },
  {
    icon: FileText,
    title: 'Choose Your Next Step',
    description: 'Get a personalized quote, book a test drive, or continue straight to payment.',
  },
];

const FACILITY_ICONS: Record<string, { icon: typeof Store; label: string }> = {
  showroom: { icon: Store, label: 'Showroom' },
  serviceCenter: { icon: ShieldCheck, label: 'Service Center' },
  partsShop: { icon: Package, label: 'Parts Shop' },
  testDriveArea: { icon: Car, label: 'Test Drive Area' },
  customerLounge: { icon: Sofa, label: 'Customer Lounge' },
  parking: { icon: ParkingSquare, label: 'Parking' },
};

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-80px' },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

// QR target: the showroom's static QR code always points here. Registering
// mints a fresh ShowroomVisit session, then continues into the lightweight
// registration form.
export default function VisitStartPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [dealersLoading, setDealersLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        // /dealers requires an admin session and 401s for site visitors — the
        // public listing (and the phone/hours/coordinates normalization the
        // cards below rely on) comes from getDealers() -> /public/dealers.
        const dealersList = await getDealers();
        if (active) setDealers(dealersList.filter((d) => d.type === 'showroom' || d.type === 'both'));
      } catch (err) {
        console.error('Failed to load showroom locations:', err);
      } finally {
        if (active) setDealersLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const startVisit = async () => {
    setStarting(true);
    setError('');
    try {
      const { data } = await apiClient.post('/visit/start');
      // The backend returns the created ShowroomVisit row itself (its
      // primary key is `id`), not a `visitId` field.
      if (!data?.id) {
        throw new Error(data?.error || 'Unable to start your visit.');
      }
      router.push(`/visit/register?visitId=${encodeURIComponent(data.id)}`);
    } catch (err: any) {
      setError(err.message || 'Unable to start your visit. Please ask the front desk for assistance.');
      setStarting(false);
    }
  };

  return (
    <MainLayout>
      {/* Hero */}
      <div className="relative overflow-hidden text-white py-20">
        <Image
          src="/uploads/seed/models/ex2/images/lifestyle/lifestyle-2.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy/90 via-navy/85 to-navy" />
        <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
          <div className="text-[13px] tracking-[0.2em] text-gold font-bold mb-4 uppercase">
            Visit Our Showroom
          </div>
          <h1 className="disp text-4xl sm:text-5xl font-bold mb-4 max-w-3xl mx-auto">
            Experience Geely in Person
          </h1>
          <p className="text-[#d8e4f5] text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Register in seconds, then go straight to browsing vehicles, requesting a quote, booking
            a test drive, or completing your purchase.
          </p>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={startVisit}
              disabled={starting}
              className="bg-gold text-[#2c2308] font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 hover:shadow-lg hover:shadow-gold/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {starting ? 'Starting…' : 'Register for Your Visit'}
            </button>
            {error && (
              <p className="text-sm text-red-300 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </p>
            )}
            <div className="flex items-center gap-2 text-[#c3d2ea] text-sm">
              <QrCode size={18} />
              Scanned this from the showroom QR code? Tap the button above to begin.
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="py-14 bg-ice dark:bg-midnight">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <motion.h2 {...fadeUp} className="disp text-2xl md:text-3xl text-navy dark:text-ice font-bold text-center mb-12">
            How a Showroom Visit Works
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
            <div className="hidden md:block absolute top-9 left-[16.5%] right-[16.5%] h-px bg-line dark:bg-midnight-line" />
            {STEPS.map((step, index) => (
              <motion.div
                key={step.title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: index * 0.1 }}
                className="relative bg-white dark:bg-midnight-surface rounded-xl border border-line dark:border-midnight-line p-6 pt-8 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-navy dark:bg-geely-blue text-white text-xs font-bold flex items-center justify-center border-4 border-ice dark:border-midnight">
                  {index + 1}
                </span>
                <div className="w-14 h-14 bg-geely-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="text-geely-blue" size={26} />
                </div>
                <h3 className="font-bold text-navy dark:text-ice mb-2">{step.title}</h3>
                <p className="text-sm text-steel dark:text-steel-light">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Showroom locations */}
      <section className="py-14">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <motion.h2 {...fadeUp} className="disp text-2xl md:text-3xl text-navy dark:text-ice font-bold text-center mb-10">
            Our Showroom Locations
          </motion.h2>
          {dealersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-xl overflow-hidden animate-pulse">
                  <div className="h-36 bg-ice dark:bg-midnight" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 w-2/3 bg-ice dark:bg-midnight rounded" />
                    <div className="h-3 w-full bg-ice dark:bg-midnight rounded" />
                    <div className="h-3 w-1/2 bg-ice dark:bg-midnight rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : dealers.length === 0 ? (
            <p className="text-center text-steel dark:text-steel-light">Showroom locations are managed from the admin panel.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealers.map((dealer, index) => {
                const addressLine = typeof dealer.address === 'string'
                  ? dealer.address
                  : `${dealer.address?.street || dealer.address?.area || ''}, ${dealer.address?.city || dealer.city || ''}`;
                const activeFacilities = Object.entries(dealer.facilities || {}).filter(([, on]) => on);

                return (
                  <motion.div
                    key={dealer.id}
                    {...fadeUp}
                    transition={{ ...fadeUp.transition, delay: Math.min(index, 3) * 0.08 }}
                    className="bg-white dark:bg-midnight-surface border border-line dark:border-midnight-line rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="relative h-36 bg-geely-blue/5">
                      {dealer.gallery?.[0] ? (
                        <Image
                          src={withBasePath(dealer.gallery[0])}
                          alt={`${dealer.name} showroom`}
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="text-geely-blue/30" size={36} />
                        </div>
                      )}
                      {dealer.featured && (
                        <span className="absolute top-3 left-3 bg-geely-blue text-white text-[11px] font-bold px-2.5 py-1 rounded-full tracking-wide">
                          FEATURED
                        </span>
                      )}
                      {!!dealer.rating && (
                        <span className="absolute top-3 right-3 flex items-center gap-1 bg-navy/80 text-white text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                          <Star size={12} className="fill-gold text-gold" />
                          {dealer.rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div className="p-6">
                      <h3 className="font-bold text-navy dark:text-ice text-lg mb-3">{dealer.name}</h3>
                      <div className="space-y-2 text-sm text-steel dark:text-steel-light">
                        <div className="flex items-start gap-2">
                          <MapPin size={16} className="text-geely-blue shrink-0 mt-0.5" />
                          <span>{addressLine}</span>
                        </div>
                        {dealer.phone && (
                          <div className="flex items-center gap-2">
                            <Phone size={16} className="text-geely-blue shrink-0" />
                            <a href={`tel:${dealer.phone}`} className="hover:text-geely-blue transition-colors">
                              {dealer.phone}
                            </a>
                          </div>
                        )}
                        {dealer.hours && (
                          <div className="flex items-start gap-2">
                            <Clock size={16} className="text-geely-blue shrink-0 mt-0.5" />
                            <div>
                              <div>Mon-Fri: {dealer.hours.weekday || 'N/A'}</div>
                              <div>Sat: {dealer.hours.saturday || 'N/A'}</div>
                              <div>Sun: {dealer.hours.sunday || 'N/A'}</div>
                            </div>
                          </div>
                        )}
                      </div>

                      {dealer.services && dealer.services.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {dealer.services.slice(0, 3).map((s) => (
                            <span key={s} className="text-xs font-semibold text-geely-blue bg-geely-blue/10 dark:bg-blue-bright/10 dark:text-blue-bright px-2.5 py-1 rounded-full">
                              {s}
                            </span>
                          ))}
                          {dealer.services.length > 3 && (
                            <span className="text-xs font-semibold text-steel dark:text-steel-light px-2.5 py-1">
                              +{dealer.services.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {activeFacilities.length > 0 && (
                        <div className="flex flex-wrap gap-x-3 gap-y-1.5 mt-4 pt-4 border-t border-line dark:border-midnight-line">
                          {activeFacilities.map(([key]) => {
                            const facility = FACILITY_ICONS[key];
                            if (!facility) return null;
                            return (
                              <span key={key} className="flex items-center gap-1 text-[11px] font-medium text-steel dark:text-steel-light">
                                <facility.icon size={13} className="text-geely-blue" />
                                {facility.label}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div className="flex gap-2 mt-5">
                        <Link
                          href={`/dealers/${dealer.id}`}
                          aria-label={`View details for ${dealer.name}`}
                          className="flex-1 text-center bg-geely-blue text-white text-xs font-bold py-2.5 px-3 rounded hover:bg-opacity-90 transition-all"
                        >
                          View Details
                        </Link>
                        {dealer.coordinates?.latitude != null && dealer.coordinates?.longitude != null && (
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${dealer.coordinates.latitude},${dealer.coordinates.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs font-semibold text-navy dark:text-ice border border-line dark:border-midnight-line py-2.5 px-3 rounded hover:bg-ice dark:hover:bg-midnight transition-all"
                          >
                            <Navigation size={14} />
                            Directions
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
