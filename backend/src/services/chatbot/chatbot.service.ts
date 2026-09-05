import { prisma } from '../../config/database';
import { LeadService } from '../leads/lead.service';

export interface ChatbotConfig {
  enabled: boolean;
  greeting: string;
  logoUrl: string;
  primaryColor: string;
  fallbackMessage: string;
}

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  enabled: true,
  greeting: "Hi! I'm the Geely Assistant. Ask me about our models, test drives, promotions, financing, or dealer locations.",
  logoUrl: '/assets/logos/geely-logo.png',
  primaryColor: '#194BFF',
  fallbackMessage: "I couldn't find an answer to that. Our team is happy to help you directly on WhatsApp.",
};

export type ChatbotIntent = 'vehicles' | 'test-drive' | 'promotions' | 'financing' | 'dealers' | 'knowledge' | 'fallback';

export interface ChatbotReply {
  answer: string;
  intent: ChatbotIntent;
  showWhatsAppCta: boolean;
}

// Ethiopian mobile number heuristic: 9 digits starting with 9, optionally
// prefixed with a leading 0 or +251. Not a strict validator — good enough to
// decide whether the customer volunteered a callback number in chat.
const PHONE_PATTERN = /(?:\+?251|0)?9\d{8}\b/;

const INTENT_KEYWORDS: Record<Exclude<ChatbotIntent, 'vehicles' | 'knowledge' | 'fallback'>, string[]> = {
  'test-drive': ['test drive', 'test-drive', 'testdrive', 'try the car', 'book a drive', 'schedule a drive'],
  financing: ['financ', 'loan', 'installment', 'down payment', 'downpayment', 'monthly payment', 'bank loan', 'credit', 'emi'],
  promotions: ['promo', 'offer', 'discount', 'deal', 'sale'],
  dealers: ['dealer', 'showroom', 'branch', 'address', 'location', 'where are you', 'where can i find'],
};

const VEHICLE_KEYWORDS = ['model', 'models', 'car', 'suv', 'sedan', 'price', 'latest', 'new car', 'specs', 'specification', 'vehicle'];

function normalize(message: string): string {
  return message.toLowerCase().replace(/[^\w\s+]/g, ' ').replace(/\s+/g, ' ').trim();
}

async function getConfig(): Promise<ChatbotConfig> {
  const setting = await prisma.setting.findUnique({ where: { key: 'chatbot_config' } });
  if (!setting) return DEFAULT_CHATBOT_CONFIG;
  try {
    return { ...DEFAULT_CHATBOT_CONFIG, ...JSON.parse(setting.value) };
  } catch {
    return DEFAULT_CHATBOT_CONFIG;
  }
}

// `requireNameMention` restricts this to messages that name a specific
// vehicle (a high-confidence signal, safe to check before the knowledge
// base). Without it, generic words like "car" or "model" would shadow every
// admin-curated knowledge base entry, since most questions mention a vehicle
// in passing — so the generic keyword fallback only runs once the knowledge
// base has already had a chance to answer.
async function answerVehicles(normalized: string, requireNameMention: boolean): Promise<string | null> {
  const vehicles = await prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { name: true, slug: true, model: true, badge: true },
  });
  if (vehicles.length === 0) return null;

  const mentioned = vehicles.filter((v) => normalized.includes(v.name.toLowerCase()) || normalized.includes(v.model.toLowerCase()));
  const genericMatch = !requireNameMention && VEHICLE_KEYWORDS.some((k) => normalized.includes(k));
  if (mentioned.length === 0 && !genericMatch) return null;

  const shortlist = (mentioned.length > 0 ? mentioned : vehicles).slice(0, 5);
  const lines = shortlist.map((v) => {
    return `• ${v.name}${v.badge ? ` (${v.badge})` : ''} — /models/${v.slug}`;
  });

  return `Here${shortlist.length === 1 ? "'s" : ' are'} our ${mentioned.length > 0 ? 'match' + (shortlist.length === 1 ? '' : 'es') : 'latest models'}:\n${lines.join('\n')}\n\nWant to book a test drive or see financing options for one of these?`;
}

async function answerTestDrive(): Promise<string> {
  const vehicles = await prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    take: 5,
    select: { name: true },
  });
  const names = vehicles.map((v) => v.name).join(', ');
  return `You can book a test drive for any of our current models${names ? ` (${names})` : ''} at /test-drive — just pick a date, time and location. Share your phone number here and our sales team can also confirm a slot directly with you.`;
}

async function answerPromotions(): Promise<string> {
  const now = new Date();
  const promotions = await prisma.promotion.findMany({
    where: { isActive: true, startDate: { lte: now }, endDate: { gte: now } },
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
    take: 5,
    select: { title: true, description: true, ctaButtonLink: true },
  });
  if (promotions.length === 0) {
    return "We don't have any active promotions right now — check back soon, or ask me about our latest models.";
  }
  const lines = promotions.map((p) => `• ${p.title}: ${p.description}${p.ctaButtonLink ? ` — ${p.ctaButtonLink}` : ''}`);
  return `Here are our current offers:\n${lines.join('\n')}`;
}

async function answerDealers(): Promise<string> {
  const dealers = await prisma.dealer.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    take: 5,
    select: { name: true, city: true, region: true, contact: true },
  });
  if (dealers.length === 0) {
    return "I couldn't find dealer locations right now — please reach us on WhatsApp and we'll point you to the nearest showroom.";
  }
  const lines = dealers.map((d) => {
    const phone = (d.contact as any)?.phone;
    return `• ${d.name} — ${d.city}, ${d.region}${phone ? ` — ${phone}` : ''}`;
  });
  return `Here are our dealer locations:\n${lines.join('\n')}`;
}

async function answerFinancing(): Promise<string> {
  const programs = await prisma.financingProgram.findMany({
    where: { status: 'PUBLISHED' },
    include: { bank: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  if (programs.length === 0) {
    return 'Visit /financing to see our current bank partners and loan calculators, or ask me about a specific model.';
  }
  const lines = programs.map((p) => `• ${p.bank.name} — ${p.name}: ${p.interestRate}% interest, ${p.downPaymentPercent}% down payment, up to ${p.maxTenureMonths} months`);
  return `Here's a look at our financing options:\n${lines.join('\n')}\n\nSee full details and calculate a monthly payment at /financing.`;
}

async function answerFromKnowledgeBase(normalized: string): Promise<{ id: string; answer: string } | null> {
  const entries = await prisma.chatbotKnowledge.findMany({ where: { isActive: true } });
  let best: { id: string; answer: string; score: number; priority: number; displayOrder: number } | null = null;

  for (const entry of entries) {
    const score = entry.keywords.filter((k) => normalized.includes(k.toLowerCase())).length;
    if (score === 0) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && entry.priority > best.priority) ||
      (score === best.score && entry.priority === best.priority && entry.displayOrder < best.displayOrder)
    ) {
      best = { id: entry.id, answer: entry.answer, score, priority: entry.priority, displayOrder: entry.displayOrder };
    }
  }

  return best ? { id: best.id, answer: best.answer } : null;
}

async function maybeCaptureLead(
  conversationId: string,
  existingLeadId: string | null,
  message: string,
  intent: ChatbotIntent
): Promise<void> {
  if (existingLeadId) return;
  if (intent !== 'test-drive' && intent !== 'financing') return;

  const phoneMatch = message.match(PHONE_PATTERN);
  if (!phoneMatch) return;

  const result = await LeadService.create({
    customerName: 'Website Chat Visitor',
    customerPhone: phoneMatch[0],
    source: 'chatbot',
    testDriveRequired: intent === 'test-drive',
    financingInterest: intent === 'financing',
  });

  if (result.ok) {
    await prisma.chatbotConversation.update({
      where: { id: conversationId },
      data: { leadId: result.data.id, customerPhone: phoneMatch[0] },
    });
  }
}

async function handleMessage(sessionId: string, message: string): Promise<ChatbotReply> {
  const conversation = await prisma.chatbotConversation.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
  });

  const normalized = normalize(message);
  let intent: ChatbotIntent = 'fallback';
  let answer: string | null = null;
  let matchedKnowledgeId: string | null = null;

  if (INTENT_KEYWORDS['test-drive'].some((k) => normalized.includes(k))) {
    intent = 'test-drive';
    answer = await answerTestDrive();
  } else if (INTENT_KEYWORDS.financing.some((k) => normalized.includes(k))) {
    intent = 'financing';
    answer = await answerFinancing();
  } else if (INTENT_KEYWORDS.promotions.some((k) => normalized.includes(k))) {
    intent = 'promotions';
    answer = await answerPromotions();
  } else if (INTENT_KEYWORDS.dealers.some((k) => normalized.includes(k))) {
    intent = 'dealers';
    answer = await answerDealers();
  } else {
    // High-confidence check first: a named vehicle mention. The broader
    // "mentions a generic word like 'car' or 'model'" check is deferred
    // below, after the knowledge base has had a chance to answer.
    const namedVehicleAnswer = await answerVehicles(normalized, true);
    if (namedVehicleAnswer) {
      intent = 'vehicles';
      answer = namedVehicleAnswer;
    }
  }

  if (!answer) {
    const kbMatch = await answerFromKnowledgeBase(normalized);
    if (kbMatch) {
      intent = 'knowledge';
      answer = kbMatch.answer;
      matchedKnowledgeId = kbMatch.id;
    }
  }

  if (!answer) {
    const genericVehicleAnswer = await answerVehicles(normalized, false);
    if (genericVehicleAnswer) {
      intent = 'vehicles';
      answer = genericVehicleAnswer;
    }
  }

  const config = await getConfig();
  if (!answer) {
    intent = 'fallback';
    answer = config.fallbackMessage;
  }

  await prisma.chatbotMessage.create({ data: { conversationId: conversation.id, role: 'user', content: message } });
  await prisma.chatbotMessage.create({
    data: { conversationId: conversation.id, role: 'bot', content: answer, intent, matchedKnowledgeId },
  });

  await maybeCaptureLead(conversation.id, conversation.leadId, message, intent);

  return { answer, intent, showWhatsAppCta: intent === 'fallback' };
}

export const chatbotService = {
  getConfig,
  handleMessage,
};
