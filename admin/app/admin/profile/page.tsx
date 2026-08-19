import { requireAuth } from '@/lib/auth/middleware';
import { UserCircle2, Mail, Shield, Clock3 } from 'lucide-react';

export default async function ProfilePage() {
  const session = await requireAuth();
  const user = session.user;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Profile</h1>
        <p className="mt-1 text-sm text-gray-500">View account details and session information</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
              {user.name.charAt(0)}
            </div>
            <div>
              <div className="text-xl font-semibold text-gray-900">{user.name}</div>
              <div className="text-sm text-gray-500 capitalize">{user.role.replace('_', ' ')}</div>
            </div>
          </div>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4" />{user.email}</div>
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" />Account permissions inherited from role</div>
            <div className="flex items-center gap-2"><Clock3 className="w-4 h-4" />Active session in progress</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Session Summary</h2>
          <p className="text-sm text-gray-600">This screen is a lightweight profile landing page for the admin shell.</p>
        </div>
      </div>
    </div>
  );
}
