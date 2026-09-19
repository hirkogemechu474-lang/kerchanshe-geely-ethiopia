'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAdminAuth } from '@/hooks/useAdminAuth';

export default function AdminContentLegacyRedirect() {
  useAdminAuth('canManageContent');
  const router = useRouter();
  useEffect(() => {
    // Instant redirect — but allow browser/plugin time to hook (300ms)
    const t = setTimeout(() => router.replace('/admin/settings/about'), 300);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-[65vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-gray-200 shadow-xl p-8 text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
          <RefreshCw className="w-8 h-8 animate-spin" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Moving to About Page CMS</h1>
          <p className="text-gray-500 leading-relaxed">
            The old Content Pages area has been merged into a single
            <span className="mx-1 inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              About Page & Homepage CMS
            </span>
            under Settings.
          </p>
        </div>
        <Link
          href="/admin/settings/about"
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold hover:from-amber-600 hover:to-orange-700 transition-all shadow-lg shadow-amber-500/20"
        >
          Go Now
          <ArrowRight className="w-4 h-4" />
        </Link>
        <div className="text-xs text-gray-400 pt-2">Redirecting automatically…</div>
      </div>
    </div>
  );
}
