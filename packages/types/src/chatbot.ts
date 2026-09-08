export interface ChatbotConfig {
  enabled: boolean;
  greeting: string;
  logoUrl: string;
  primaryColor: string;
  fallbackMessage: string;
}

export type ChatbotIntent = 'vehicles' | 'test-drive' | 'promotions' | 'financing' | 'dealers' | 'knowledge' | 'greeting' | 'fallback';

export interface ChatbotKnowledgeEntry {
  id: string;
  question: string;
  keywords: string[];
  answer: string;
  category: string | null;
  isActive: boolean;
  priority: number;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotMessageDto {
  id: string;
  conversationId: string;
  role: 'user' | 'bot';
  content: string;
  intent: ChatbotIntent | null;
  matchedKnowledgeId: string | null;
  createdAt: string;
}

export interface ChatbotConversationSummary {
  id: string;
  sessionId: string;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  leadId: string | null;
  startedAt: string;
  lastMessageAt: string;
  messages: ChatbotMessageDto[];
  _count: { messages: number };
}
