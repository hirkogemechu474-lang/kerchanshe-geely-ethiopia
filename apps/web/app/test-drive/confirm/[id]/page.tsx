'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/MainLayout';
import { Car, MapPin, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface TestDriveSummary {
  id: string;
  reference: string | null;
  customerName: string;
  vehicleName: string;
  preferredDate: string;
  preferredTime: string;
  location: string;
  status: string;
}

// Where a sales agent's "Send Test Drive Invite" email link lands (see
// admin/components/admin/sales/OrderTestDrivePanel.tsx and
// admin/app/api/admin/orders/[id]/send-test-drive/route.ts). Shows the
// proposed date/time/location and lets the customer confirm it with one
// tap — mirrors the agreement/handover signing pages' "load by id, act
// once" shape, just without a signature since there's nothing to sign here.
export default function TestDriveConfirmPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [testDrive, setTestDrive] = useState<TestDriveSummary | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/public/test-drives/${id}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Unable to load this test drive.');
        if (active) setTestDrive(data);
      } catch (err: any) {
        if (active) setLoadError(err.message || 'Unable to load this test drive.');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const confirm = async () => {
    setConfirming(true);
    setConfirmError('');
    try {
      const res = await fetch(`/api/public/test-drives/${id}/confirm`, { method: 'POST' });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Unable to confirm this test drive.');
      setTestDrive((prev) => (prev ? { ...prev, status: data.status } : prev));
    } catch (err: any) {
      setConfirmError(err.message || 'Unable to confirm this test drive.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-geely-blue/20 border-t-geely-blue rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (loadError || !testDrive) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-navy dark:text-ice mb-2">Something went wrong</h1>
            <p className="text-steel dark:text-steel-light text-sm">{loadError || 'This test drive could not be found.'}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isConfirmed = testDrive.status !== 'pending';

  return (
    <MainLayout>
      <div className="py-12 bg-ice dark:bg-midnight min-h-[70vh]">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white dark:bg-midnight-surface rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-1">
              <Car className="w-6 h-6 text-geely-blue" />
              <h1 className="text-2xl font-bold text-navy dark:text-ice">Test Drive Invitation</h1>
            </div>
            <p className="text-steel dark:text-steel-light text-sm mb-6">
              {testDrive.customerName} · {testDrive.vehicleName}
              {testDrive.reference && <span className="block text-xs text-gray-400 mt-1">Ref: {testDrive.reference}</span>}
            </p>

            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="w-4 h-4 text-geely-blue shrink-0" />
                <span className="text-navy dark:text-ice">{new Date(testDrive.preferredDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="w-4 h-4 text-geely-blue shrink-0" />
                <span className="text-navy dark:text-ice">{testDrive.preferredTime}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin className="w-4 h-4 text-geely-blue shrink-0" />
                <span className="text-navy dark:text-ice">{testDrive.location}</span>
              </div>
            </div>

            {isConfirmed ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <h2 className="text-lg font-bold text-navy dark:text-ice mb-1">
                  {testDrive.status === 'confirmed' ? "You're All Set!" : `Status: ${testDrive.status}`}
                </h2>
                <p className="text-sm text-steel dark:text-steel-light">
                  {testDrive.status === 'confirmed'
                    ? 'We look forward to seeing you. Please bring a valid driver’s license on the day.'
                    : 'Contact us if you have any questions about this test drive.'}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-steel dark:text-steel-light mb-4">
                  Your sales consultant has arranged this test drive for you. Please confirm you'll be there, or contact us if you need a different time.
                </p>
                {confirmError && <p className="text-sm text-red-600 mb-4">{confirmError}</p>}
                <button
                  onClick={confirm}
                  disabled={confirming}
                  className="w-full bg-geely-blue text-white font-bold py-3 rounded-lg hover:bg-opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {confirming ? 'Confirming…' : 'Confirm Test Drive'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
