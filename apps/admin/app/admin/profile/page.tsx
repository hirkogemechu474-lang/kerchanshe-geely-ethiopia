import { requireAuth } from '@/lib/auth/middleware';
import { Mail, Shield, Clock3 } from 'lucide-react';
import { PageHeader, Card } from '@/components/admin/ui';
import { serverApiClient } from '@/lib/serverApiClient';
import ProfileTitleForm from '@/components/admin/profile/ProfileTitleForm';

export default async function ProfilePage() {
  const session = await requireAuth();
  const user = session.user;

  // AdminUser (the session shape) doesn't carry `title` — fetch the full
  // record so the form below starts from the real saved value.
  const client = await serverApiClient();
  const fullUser = await client.get(`/admin/users/${user.id}`).then((r) => r.data.user).catch(() => null);

  return (
    <div className="space-y-6">
      <PageHeader title="Your Profile" description="View account details and session information" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-geely-blue text-white flex items-center justify-center text-xl font-semibold">
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
        </Card>

        <Card className="space-y-4">
          <h2 className="font-semibold text-gray-900">Signing Details</h2>
          <p className="text-sm text-gray-600">
            Your job title is printed alongside your name whenever you sign or approve a document.
          </p>
          <ProfileTitleForm userId={user.id} initialTitle={fullUser?.title || ''} />
        </Card>
      </div>
    </div>
  );
}
