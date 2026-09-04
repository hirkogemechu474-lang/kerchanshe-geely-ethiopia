import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import ChatbotSettingsForm from '@/components/admin/chatbot/ChatbotSettingsForm';

export default async function ChatbotSettingsPage() {
  await requirePermission('canManageContent');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Chatbot"
        description="Control the customer-facing assistant that answers questions about models, test drives, promotions, financing, and dealers."
      />
      <ChatbotSettingsForm />
    </div>
  );
}
