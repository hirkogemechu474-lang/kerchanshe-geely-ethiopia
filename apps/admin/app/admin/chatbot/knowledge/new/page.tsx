import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requirePermission } from '@/lib/auth/middleware';
import ChatbotKnowledgeForm from '@/components/admin/chatbot/ChatbotKnowledgeForm';

export default async function NewChatbotKnowledgePage() {
  await requirePermission('canManageContent');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/chatbot/knowledge" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Knowledge Base Entry</h1>
          <p className="text-gray-600 mt-1">Teach the chatbot how to answer a question it can't already answer from live data</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ChatbotKnowledgeForm mode="create" />
      </div>
    </div>
  );
}
