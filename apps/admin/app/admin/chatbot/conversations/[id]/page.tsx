import Link from 'next/link';
import { ArrowLeft, UserCheck } from 'lucide-react';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/auth/middleware';
import { serverApiClient } from '@/lib/serverApiClient';

interface ConversationMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  intent: string | null;
  matchedKnowledgeId: string | null;
  createdAt: string;
}

interface ConversationDetail {
  id: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  leadId: string | null;
  startedAt: string;
  messages: ConversationMessage[];
}

async function getConversation(id: string): Promise<ConversationDetail | null> {
  try {
    const client = await serverApiClient();
    const { data } = await client.get(`/chatbot/conversations/${id}`);
    return data;
  } catch (error) {
    console.error('Error fetching chatbot conversation:', error);
    return null;
  }
}

export default async function ChatbotConversationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requirePermission('canManageContent');

  const conversation = await getConversation(id);
  if (!conversation) notFound();

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/chatbot/conversations" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{conversation.customerName || 'Website Visitor'}</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Started {new Date(conversation.startedAt).toLocaleString()}
            {conversation.customerPhone && ` · ${conversation.customerPhone}`}
          </p>
        </div>
        {conversation.leadId && (
          <span className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-full ml-auto">
            <UserCheck className="w-4 h-4" />
            Lead created
          </span>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        {conversation.messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                message.role === 'user' ? 'bg-geely-blue text-white' : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <div className={`text-xs mt-1 ${message.role === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                {new Date(message.createdAt).toLocaleTimeString()}
                {message.intent && ` · ${message.intent}${message.intent === 'fallback' ? ' (unanswered)' : ''}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
