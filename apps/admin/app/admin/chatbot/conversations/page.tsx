import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import ChatbotConversationsList from '@/components/admin/chatbot/ChatbotConversationsList';

export default async function ChatbotConversationsPage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chatbot Conversations"
        description="Review what customers are asking the chatbot, and use unanswered questions to grow the knowledge base."
      />
      <ChatbotConversationsList />
    </div>
  );
}
