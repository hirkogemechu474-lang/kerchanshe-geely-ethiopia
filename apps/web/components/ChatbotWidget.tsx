'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { X, Send, MessageCircle } from 'lucide-react';
import { openWhatsAppChat } from '@/lib/whatsapp';
import { withBasePath } from '@/lib/basePath';

interface ChatbotConfig {
  enabled: boolean;
  greeting: string;
  logoUrl: string;
  primaryColor: string;
  fallbackMessage: string;
}

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
  intent?: string;
  showWhatsAppCta?: boolean;
}

const QUICK_REPLIES = ['Our models', 'Book a test drive', 'Current promotions', 'Find a dealer'];
const SESSION_KEY = 'geely_chatbot_session';

function getSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `session-${Date.now()}`;
  }
}

function ctaForIntent(intent?: string): { label: string; href: string } | null {
  switch (intent) {
    case 'vehicles':
      return { label: 'View All Models', href: '/models' };
    case 'test-drive':
      return { label: 'Book a Test Drive', href: '/test-drive' };
    case 'financing':
      return { label: 'See Financing Options', href: '/financing' };
    case 'dealers':
      return { label: 'Find a Dealer', href: '/dealers' };
    default:
      return null;
  }
}

export default function ChatbotWidget() {
  const [config, setConfig] = useState<ChatbotConfig | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/public/chatbot/config')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.enabled) setConfig(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isOpen]);

  function handleOpen() {
    setIsOpen(true);
    if (config && messages.length === 0) {
      setMessages([{ role: 'bot', content: config.greeting }]);
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInput('');
    setSending(true);

    try {
      const response = await fetch('/api/public/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: getSessionId(), message: trimmed }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages((prev) => [...prev, { role: 'bot', content: data.answer, intent: data.intent, showWhatsAppCta: data.showWhatsAppCta }]);
      } else {
        setMessages((prev) => [...prev, { role: 'bot', content: "Sorry, something went wrong. Please try again in a moment." }]);
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', content: "Sorry, something went wrong. Please try again in a moment." }]);
    } finally {
      setSending(false);
    }
  }

  if (!config) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={handleOpen}
          className="fixed bottom-24 right-6 z-50 text-white p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all animate-bounce-slow"
          style={{ backgroundColor: config.primaryColor }}
          aria-label="Open Geely Assistant chat"
        >
          <img src={withBasePath(config.logoUrl)} alt="" className="h-7 w-7 rounded-full bg-white object-contain" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[32rem] max-h-[calc(100vh-8rem)] bg-white dark:bg-midnight-surface rounded-2xl shadow-2xl overflow-hidden animate-slide-up flex flex-col">
          <div className="p-4 flex items-center justify-between text-white" style={{ backgroundColor: config.primaryColor }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center overflow-hidden">
                <img src={withBasePath(config.logoUrl)} alt="" className="h-7 w-7 object-contain" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Geely Assistant</h3>
                <p className="text-xs opacity-80">Ask about models, test drives & more</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors" aria-label="Close">
              <X size={20} />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-midnight">
            {messages.map((message, i) => {
              const cta = message.role === 'bot' ? ctaForIntent(message.intent) : null;
              return (
                <div key={i} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    <div
                      className={`rounded-2xl px-4 py-2 text-sm whitespace-pre-wrap ${
                        message.role === 'user' ? 'text-white' : 'bg-white dark:bg-midnight-surface text-navy dark:text-ice border border-gray-200 dark:border-white/10'
                      }`}
                      style={message.role === 'user' ? { backgroundColor: config.primaryColor } : undefined}
                    >
                      {message.content}
                    </div>
                    {cta && (
                      <Link
                        href={cta.href}
                        className="mt-2 inline-block text-xs font-semibold px-3 py-1.5 rounded-full border"
                        style={{ color: config.primaryColor, borderColor: config.primaryColor }}
                      >
                        {cta.label}
                      </Link>
                    )}
                    {message.showWhatsAppCta && (
                      <button
                        onClick={() => openWhatsAppChat({ inquiryType: 'general', customMessage: `Hello, I chatted with the website assistant and need more help: "${message.content}"` })}
                        className="mt-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        <MessageCircle size={14} />
                        Continue on WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-midnight-surface border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-2 text-sm text-steel dark:text-steel-light">
                  Typing...
                </div>
              </div>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 bg-gray-50 dark:bg-midnight">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  onClick={() => sendMessage(reply)}
                  className="text-xs px-3 py-1.5 rounded-full bg-white dark:bg-midnight-surface border border-gray-200 dark:border-white/10 text-navy dark:text-ice hover:bg-gray-100 transition-colors"
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="p-3 border-t border-gray-200 dark:border-white/10 flex items-center gap-2 bg-white dark:bg-midnight-surface"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-white/10 bg-transparent focus:outline-none focus:ring-2 focus:ring-offset-0"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="p-2 rounded-full text-white disabled:opacity-50 transition-opacity"
              style={{ backgroundColor: config.primaryColor }}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
