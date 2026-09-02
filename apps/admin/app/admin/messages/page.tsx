import { requirePermission } from '@/lib/auth/middleware';
import { prisma } from '@/lib/prisma';
import MessagesInbox from '@/components/admin/messages/MessagesInbox';

export default async function MessagesPage() {
  await requirePermission('canViewMessages');

  const messages = await prisma.message.findMany({ orderBy: { createdAt: 'desc' }, take: 200 });
  return <MessagesInbox initialMessages={messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() }))} />;
  /* return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Messages & Inquiries</h1>
          <p className="mt-1 text-sm text-gray-500">Manage customer messages and support tickets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Inbox className="w-8 h-8 text-geely-blue mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">47</h3>
          <p className="text-sm text-gray-500">Total Messages</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <MessageCircle className="w-8 h-8 text-orange-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">12</h3>
          <p className="text-sm text-gray-500">Unread</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Send className="w-8 h-8 text-green-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">28</h3>
          <p className="text-sm text-gray-500">Replied</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Star className="w-8 h-8 text-yellow-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">5</h3>
          <p className="text-sm text-gray-500">Starred</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <Archive className="w-8 h-8 text-gray-600 mb-3" />
          <h3 className="text-2xl font-bold text-gray-900">234</h3>
          <p className="text-sm text-gray-500">Archived</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="w-64 bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 rounded-lg bg-blue-50 text-blue-700 font-medium">
              All Messages
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              Test Drive (8)
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              Financing (12)
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              Service (15)
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              Parts (7)
            </button>
            <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-gray-700">
              General (5)
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg border border-gray-200">
          <div className="border-b p-4">
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          <div className="divide-y">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-4 hover:bg-gray-50 cursor-pointer ${
                  message.status === 'unread' ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      message.priority === 'high' ? 'bg-red-500' :
                      message.priority === 'medium' ? 'bg-yellow-500' :
                      'bg-green-500'
                    }`} />
                    <div>
                      <div className="font-medium text-gray-900">{message.from}</div>
                      <div className="text-sm text-gray-500">{message.email}</div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">{message.date}</div>
                </div>
                <div className="ml-5">
                  <div className="font-medium text-gray-900 mb-1">{message.subject}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {message.category}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      message.status === 'unread' ? 'bg-blue-100 text-blue-700' :
                      message.status === 'read' ? 'bg-gray-100 text-gray-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {message.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  ); */
}
