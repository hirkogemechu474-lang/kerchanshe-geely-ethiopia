'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

export default function CategoriesRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to vehicle settings where categories are managed
    router.replace('/admin/vehicles/settings');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="w-12 h-12 animate-spin text-violet-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Redirecting to Vehicle Settings</h2>
        <p className="text-gray-600">Vehicle categories are now managed in Vehicle Settings...</p>
      </div>
    </div>
  );
}
