'use client';
import { useEffect, useMemo, useState } from 'react';
import { Archive, Inbox, MessageCircle, Search, Send, Star } from 'lucide-react';

type AdminMessage = { id: string; from: string; email: string; subject: string; category: string; priority: string; status: string; content: string; response?: string | null; createdAt: string };

export default function MessagesInbox({ initialMessages }: { initialMessages: AdminMessage[] }) {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const categories = useMemo(() => Array.from(new Set(messages.map((message) => message.category))).sort(), [messages]);
  const filtered = messages.filter((message) => {
    const text = `${message.from} ${message.email} ${message.subject} ${message.content}`.toLowerCase();
    return (category === 'all' || message.category === category) && text.includes(query.toLowerCase());
  });
  const markRead = async (id: string) => {
    const response = await fetch(`/api/admin/messages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'read' }) });
    if (response.ok) setMessages((current) => current.map((message) => message.id === id ? { ...message, status: 'read' } : message));
  };
  const count = (status: string) => messages.filter((message) => message.status === status).length;
  const stats = [[Inbox, messages.length, 'Total Messages', 'text-blue-600'], [MessageCircle, count('unread'), 'Unread', 'text-orange-600'], [Send, count('replied'), 'Replied', 'text-green-600'], [Star, messages.filter((message) => message.priority === 'high').length, 'High Priority', 'text-yellow-600'], [Archive, count('archived'), 'Archived', 'text-gray-600']] as const;
  return <div className="space-y-6">
    <div><h1 className="text-3xl font-bold text-gray-900">Messages & Inquiries</h1><p className="mt-1 text-sm text-gray-500">Live customer messages from website forms.</p></div>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">{stats.map(([Icon, value, label, color]) => <div key={label} className="bg-white rounded-lg border border-gray-200 p-6"><Icon className={`w-8 h-8 mb-3 ${color}`} /><h3 className="text-2xl font-bold text-gray-900">{value}</h3><p className="text-sm text-gray-500">{label}</p></div>)}</div>
    <div className="flex gap-4 items-start">
      <div className="w-64 bg-white rounded-lg border border-gray-200 p-4"><h3 className="font-semibold text-gray-900 mb-4">Categories</h3><div className="space-y-2"><button onClick={() => setCategory('all')} className={`w-full text-left px-3 py-2 rounded-lg ${category === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>All Messages ({messages.length})</button>{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`w-full text-left px-3 py-2 rounded-lg ${category === item ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>{item} ({messages.filter((message) => message.category === item).length})</button>)}</div></div>
      <div className="flex-1 bg-white rounded-lg border border-gray-200"><div className="border-b p-4 relative"><Search className="absolute left-7 top-6 w-4 h-4 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search messages..." className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg" /></div><div className="divide-y">{filtered.length === 0 ? <div className="p-10 text-center text-gray-500">No messages found.</div> : filtered.map((message) => <button type="button" onClick={() => message.status === 'unread' && markRead(message.id)} key={message.id} className={`w-full text-left p-4 hover:bg-gray-50 ${message.status === 'unread' ? 'bg-blue-50' : ''}`}><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${message.priority === 'high' ? 'bg-red-500' : message.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} /><div><div className="font-medium text-gray-900">{message.from}</div><div className="text-sm text-gray-500">{message.email}</div></div></div><div className="text-sm text-gray-500">{new Date(message.createdAt).toLocaleString()}</div></div><div className="ml-5"><div className="font-medium text-gray-900 mb-1">{message.subject}</div><p className="text-sm text-gray-600 line-clamp-2 mb-2">{message.content}</p><div className="flex gap-2"><span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">{message.category}</span><span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">{message.status.toUpperCase()}</span></div></div></button>)}</div></div>
    </div>
  </div>;
}
