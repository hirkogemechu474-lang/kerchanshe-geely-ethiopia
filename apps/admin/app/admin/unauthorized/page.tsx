import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';

export default function Unauthorized() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-600 rounded-full mb-6">
          <ShieldAlert className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-xl text-red-200 mb-8">
          You don't have permission to access this resource.
        </p>
        
        <div className="space-y-4">
          <Link
            href="/admin/analytics"
            className="block w-full bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Return to Dashboard
          </Link>
          <Link
            href="/admin/login"
            className="block w-full border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </div>
  );
}
