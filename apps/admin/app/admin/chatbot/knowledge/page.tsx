import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requirePermission } from '@/lib/auth/middleware';
import { PageHeader } from '@/components/admin/ui';
import ChatbotKnowledgeList from '@/components/admin/chatbot/ChatbotKnowledgeList';

export default async function ChatbotKnowledgePage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Chatbot Knowledge Base"
        description="Custom questions and answers the chatbot uses when a customer's message doesn't match a model, test drive, promotion, financing, or dealer query."
        actions={
          <Link
            href="/admin/chatbot/knowledge/new"
            className="flex items-center gap-2 bg-geely-blue text-white px-4 py-2 rounded-lg hover:bg-navy transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Entry
          </Link>
        }
      />

      <ChatbotKnowledgeList />
    </div>
  );
}
