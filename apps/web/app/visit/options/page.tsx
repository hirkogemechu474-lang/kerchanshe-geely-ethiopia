'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { Car, AlertCircle } from 'lucide-react';

interface VisitInfo {
  fullName: string | null;
}

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const visitId = searchParams.get('visitId') || '';

  const [visit, setVisit] = useState<VisitInfo | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visitId) {
      setError('Your visit session could not be found. Please scan the QR code again.');
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/visit/${encodeURIComponent(visitId)}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Unable to load your visit.');
        if (active) setVisit(data);
      } catch (err: any) {
        if (active) setError(err.message || 'Unable to load your visit.');
      }
    })();
    return () => {
      active = false;
    };
  }, [visitId]);

  if (error) {
    return (
      <div className="max-w-xl mx-auto px-4 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-navy dark:text-ice mb-2">Something went wrong</h1>
        <p className="text-steel dark:text-steel-light">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 text-center">
      <div className="w-16 h-16 bg-geely-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <Car className="w-8 h-8 text-geely-blue" />
      </div>
      <h1 className="text-3xl font-bold text-navy dark:text-ice mb-2">
        {visit?.fullName ? `Welcome, ${visit.fullName}!` : 'Welcome!'}
      </h1>
      <p className="text-steel dark:text-steel-light mb-8">
        Explore our full range of Geely vehicles — photos, videos, and complete specifications for every model.
      </p>
      <button
        onClick={() => router.push(`/models?visitId=${encodeURIComponent(visitId)}`)}
        className="bg-geely-blue text-white px-8 py-4 rounded-lg font-bold hover:bg-opacity-90 transition-colors"
      >
        Browse Our Vehicles
      </button>
    </div>
  );
}

export default function VisitOptionsPage() {
  return (
    <MainLayout>
      <div className="py-16 bg-ice dark:bg-midnight min-h-[70vh] flex items-center">
        <Suspense fallback={null}>
          <WelcomeContent />
        </Suspense>
      </div>
    </MainLayout>
  );
}
