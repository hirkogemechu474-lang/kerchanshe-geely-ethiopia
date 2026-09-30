import { requireAuth } from '@/lib/auth/middleware';
import { PageHeader, Card } from '@/components/admin/ui';
import ChangePasswordForm from '@/components/admin/profile/ChangePasswordForm';

export default async function ChangePasswordPage() {
  const session = await requireAuth();
  const forced = Boolean(session.user.mustChangePassword);

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title={forced ? 'Choose your own password' : 'Change password'}
        description={
          forced
            ? 'Your account was set up with a temporary password. Choose a new one to continue — you cannot use the rest of the portal until you do.'
            : 'Use a password only you know. You will stay signed in on this device.'
        }
      />
      <Card>
        <ChangePasswordForm forced={forced} />
      </Card>
    </div>
  );
}
