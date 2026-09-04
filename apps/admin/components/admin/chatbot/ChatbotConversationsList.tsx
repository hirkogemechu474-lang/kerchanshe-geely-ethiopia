'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessagesSquare, UserCheck } from 'lucide-react';

interface ConversationRow {
  id: string;
  sessionId: string;
  customerName: string | null;
  customerPhone: string | null;
  leadId: string | null;
  startedAt: string;
  lastMessageAt: string;
  messages: { content: string; role: string; createdAt: string }[];
  _count: { messages: number };
}

interface ConversationsResponse {
  items: ConversationRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ChatbotConversationsList() {
  const [data, setData] = useState<ConversationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unansweredOnly, page]);

  async function fetchConversations() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '20' });
      if (unansweredOnly) params.set('unanswered', 'true');
      const response = await fetch(`/api/chatbot/conversations?${params.toString()}`);
      if (response.ok) {
        setData(await response.json());
      }
    } catch (error) {
      console.error('Error fetching chatbot conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={unansweredOnly}
            onChange={(e) => {
              setPage(1);
              setUnansweredOnly(e.target.checked);
            }}
            className="rounded border-gray-300"
          />
          Show only conversations with an unanswered question
        </label>
        {data && <span className="text-sm text-gray-500">{data.total} conversation{data.total === 1 ? '' : 's'}</span>}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-geely-blue" />
          <span className="ml-2 text-gray-600">Loading conversations...</span>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <MessagesSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations yet</h3>
          <p className="text-gray-600">Chats started by website visitors will show up here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
          {data.items.map((conv) => (
            <Link
              key={conv.id}
              href={`/admin/chatbot/conversations/${conv.id}`}
              className="block p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{conv.customerName || 'Website Visitor'}</span>
                    {conv.customerPhone && <span className="text-sm text-gray-500">{conv.customerPhone}</span>}
                    {conv.leadId && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                        <UserCheck className="w-3 h-3" />
                        Lead created
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conv.messages[0]?.content || 'No messages'}</p>
                </div>
                <div className="text-right text-xs text-gray-500 shrink-0">
                  <div>{conv._count.messages} messages</div>
                  <div>{new Date(conv.lastMessageAt).toLocaleString()}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {data.page} of {data.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
            disabled={page >= data.totalPages}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
