'use client';
import { useEffect, useMemo, useState } from 'react';
import { Archive, Inbox, MessageCircle, Search, Send, Star } from 'lucide-react';
import { PageHeader, Card, StatTile, Badge } from '@/components/admin/ui';

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
  const stats = [
    [Inbox, messages.length, 'Total Messages'] as const,
    [MessageCircle, count('unread'), 'Unread'] as const,
    [Send, count('replied'), 'Replied'] as const,
    [Star, messages.filter((message) => message.priority === 'high').length, 'High Priority'] as const,
    [Archive, count('archived'), 'Archived'] as const,
  ];
  return <div className="space-y-6">
    <PageHeader title="Messages & Inquiries" description="Live customer messages from website forms." />
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">{stats.map(([Icon, value, label]) => <StatTile key={label} label={label} value={value} icon={Icon} />)}</div>
    <div className="flex gap-4 items-start">
      <Card padding="sm" className="w-64"><h3 className="font-semibold text-gray-900 mb-4">Categories</h3><div className="space-y-2"><button onClick={() => setCategory('all')} className={`w-full text-left px-3 py-2 rounded-lg ${category === 'all' ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>All Messages ({messages.length})</button>{categories.map((item) => <button key={item} onClick={() => setCategory(item)} className={`w-full text-left px-3 py-2 rounded-lg ${category === item ? 'bg-blue-50 text-blue-700 font-medium' : 'hover:bg-gray-50 text-gray-700'}`}>{item} ({messages.filter((message) => message.category === item).length})</button>)}</div></Card>
      <Card padding="none" className="flex-1"><div className="border-b border-gray-100 p-4 relative"><Search className="absolute left-7 top-6 w-4 h-4 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Search messages..." className="w-full pl-9 px-4 py-2 border border-gray-300 rounded-lg" /></div><div className="divide-y divide-gray-100">{filtered.length === 0 ? <div className="p-10 text-center text-gray-500">No messages found.</div> : filtered.map((message) => <button type="button" onClick={() => message.status === 'unread' && markRead(message.id)} key={message.id} className={`w-full text-left p-4 hover:bg-gray-50 ${message.status === 'unread' ? 'bg-blue-50' : ''}`}><div className="flex items-start justify-between mb-2"><div className="flex items-center gap-3"><div className={`w-2 h-2 rounded-full ${message.priority === 'high' ? 'bg-red-500' : message.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} /><div><div className="font-medium text-gray-900">{message.from}</div><div className="text-sm text-gray-500">{message.email}</div></div></div><div className="text-sm text-gray-500">{new Date(message.createdAt).toLocaleString()}</div></div><div className="ml-5"><div className="font-medium text-gray-900 mb-1">{message.subject}</div><p className="text-sm text-gray-600 line-clamp-2 mb-2">{message.content}</p><div className="flex gap-2"><Badge tone="gray">{message.category}</Badge><Badge tone="green">{message.status.toUpperCase()}</Badge></div></div></button>)}</div></Card>
    </div>
  </div>;
}
