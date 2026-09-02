'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MainLayout } from '@/components/MainLayout';
import apiClient from '@/lib/apiClient';

interface Dealer {
  id: string;
  name: string;
  address?: string | {
    street?: string;
    area?: string;
    city?: string;
    region?: string;
    country?: string;
  };
  city?: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
  workingHours?: string;
  hours?: Record<string, string>;
  coordinates?: { latitude?: number; longitude?: number };
  images?: string[];
  type?: string;
}
import { AlertCircle, QrCode, UserPlus, Car, FileText, MapPin, Phone, Clock, Navigation } from 'lucide-react';

const STEPS = [
  {
    icon: UserPlus,
    title: '1. Register',
    description: 'Just your name, phone, and email — no password, no account.',
  },
  {
    icon: Car,
    title: '2. Browse Vehicles',
    description: 'Explore the full Geely lineup with photos, videos, and complete specifications.',
  },
  {
    icon: FileText,
    title: '3. Choose Your Next Step',
    description: 'Get a personalized quote, book a test drive, or continue straight to payment.',
  },
];

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
        const { data } = await apiClient.get('/dealers');
        const dealersList = Array.isArray(data) ? data : data.dealers || [];
        if (active) setDealers(dealersList.filter((d: any) => d.type === 'showroom' || d.type === 'both'));
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
      if (!data?.visitId) {
        throw new Error(data?.error || 'Unable to start your visit.');
      }
      router.push(`/visit/register?visitId=${encodeURIComponent(data.visitId)}`);
    } catch (err: any) {
      setError(err.message || 'Unable to start your visit. Please ask the front desk for assistance.');
      setStarting(false);
    }
  };

  return (
    <MainLayout>
      {/* Hero */}
      <div className="bg-navy text-white py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 text-center">
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
              className="bg-gold text-[#2c2308] font-bold text-sm px-8 py-4 rounded hover:bg-opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
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
          <h2 className="disp text-2xl md:text-3xl text-navy dark:text-ice font-bold text-center mb-10">
            How a Showroom Visit Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.title} className="bg-white dark:bg-midnight-surface rounded-xl border border-line dark:border-midnight-line p-6 text-center">
                <div className="w-12 h-12 bg-geely-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="text-geely-blue" size={24} />
                </div>
                <h3 className="font-bold text-navy mb-2">{step.title}</h3>
                <p className="text-sm text-steel dark:text-steel-light">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Showroom locations */}
      <section className="py-14">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="disp text-2xl md:text-3xl text-navy font-bold text-center mb-10">
            Our Showroom Locations
          </h2>
          {dealersLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-geely-blue border-t-transparent" />
            </div>
          ) : dealers.length === 0 ? (
            <p className="text-center text-steel">Showroom locations are managed from the admin panel.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dealers.map((dealer) => (
                <div key={dealer.id} className="bg-white border border-line rounded-xl p-6">
                  <h3 className="font-bold text-navy text-lg mb-3">{dealer.name}</h3>
                  <div className="space-y-2 text-sm text-steel">
                    <div className="flex items-start gap-2">
                      <MapPin size={16} className="text-geely-blue shrink-0 mt-0.5" />
                      <span>
                        {typeof dealer.address === 'string'
                          ? dealer.address
                          : `${(dealer.address as any)?.street || ''}, ${(dealer.address as any)?.city || dealer.city || ''}`}
                      </span>
                    </div>
                    {dealer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-geely-blue shrink-0" />
                        <a href={`tel:${dealer.phone}`} className="hover:text-geely-blue">
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
                  <div className="flex gap-2 mt-4">
                    <Link
                      href={`/dealers/${dealer.id}`}
                      aria-label={`View details for ${dealer.name}`}
                      className="flex-1 text-center bg-geely-blue text-white text-xs font-bold py-2 px-3 rounded hover:bg-opacity-90 transition-all"
                    >
                      View Details
                    </Link>
                    {dealer.coordinates && (
                      <a
                        href={`https://www.google.com/maps?q=${dealer.coordinates.latitude},${dealer.coordinates.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-navy dark:text-ice border border-line dark:border-midnight-line py-2 px-3 rounded hover:bg-ice dark:hover:bg-midnight dark:hover:bg-midnight dark:hover:bg-midnight transition-all"
                      >
                        <Navigation size={14} />
                        Directions
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </MainLayout>
  );
}
