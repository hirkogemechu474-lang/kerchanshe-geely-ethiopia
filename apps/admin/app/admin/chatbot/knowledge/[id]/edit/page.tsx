import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';
import ChatbotKnowledgeForm from '@/components/admin/chatbot/ChatbotKnowledgeForm';

async function getEntry(id: string) {
  try {
    const client = await serverApiClient();
    const { data } = await client.get(`/chatbot/knowledge/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching chatbot knowledge entry:', error);
    return null;
  }
}

export default async function EditChatbotKnowledgePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission('canManageContent');

  const entry = await getEntry(id);
  if (!entry) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/chatbot/knowledge" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Knowledge Base Entry</h1>
          <p className="text-gray-600 mt-1">
            {entry.question.substring(0, 60)}
            {entry.question.length > 60 ? '...' : ''}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ChatbotKnowledgeForm entry={entry} mode="edit" />
      </div>
    </div>
  );
}
