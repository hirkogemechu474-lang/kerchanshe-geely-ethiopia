import { prisma } from '../../config/database';
import { LeadService } from '../leads/lead.service';
import { generateAiReply, isAiChatbotEnabled, type ChatTurn } from './groq.service';

export interface ChatbotConfig {
  enabled: boolean;
  greeting: string;
  logoUrl: string;
  primaryColor: string;
  fallbackMessage: string;
}

export const DEFAULT_CHATBOT_CONFIG: ChatbotConfig = {
  enabled: true,
  greeting: "Hello, and welcome to Kerchanshe Geely Ethiopia! 👋 I'm the Geely Assistant — I can help with our models, test drives, financing, workshop servicing, genuine parts, promotions, or finding your nearest dealer. What can I help you with today?",
  logoUrl: '/assets/logos/geely-logo.png',
  primaryColor: '#194BFF',
  fallbackMessage: "I couldn't find an answer to that. Our team is happy to help you directly on WhatsApp.",
};

export type ChatbotIntent = 'vehicles' | 'test-drive' | 'promotions' | 'financing' | 'dealers' | 'contact' | 'service' | 'parts' | 'knowledge' | 'greeting' | 'fallback';

export interface ChatbotReply {
  answer: string;
  intent: ChatbotIntent;
  showWhatsAppCta: boolean;
}

export interface ChatbotAiStatus {
  enabled: boolean;
  provider: 'groq';
  model: string;
}

// Ethiopian mobile number heuristic: 9 digits starting with 9, optionally
// prefixed with a leading 0 or +251. Not a strict validator — good enough to
// decide whether the customer volunteered a callback number in chat.
const PHONE_PATTERN = /(?:\+?251|0)?9\d{8}\b/;

const INTENT_KEYWORDS: Record<Exclude<ChatbotIntent, 'vehicles' | 'knowledge' | 'greeting' | 'fallback'>, string[]> = {
  'test-drive': ['test drive', 'test-drive', 'testdrive', 'try the car', 'book a drive', 'schedule a drive'],
  financing: ['financ', 'loan', 'installment', 'down payment', 'downpayment', 'monthly payment', 'bank loan', 'credit', 'emi'],
  promotions: ['promo', 'offer', 'discount', 'deal', 'sale'],
  dealers: ['dealer', 'showroom', 'branch', 'find a dealer', 'nearest'],
  // Checked after `dealers` in the intent chain below, so a message naming
  // both ("dealer address") still resolves to the more specific dealers
  // answer. 'address'/'location' moved here from dealers — "give me your
  // address" is a contact-info ask, not necessarily "list every dealer".
  contact: ['contact', 'phone number', 'phone', 'call you', 'email', 'e-mail', 'reach you', 'get in touch', 'whatsapp', 'address', 'location', 'where are you', 'where can i find'],
  service: ['service', 'maintenance', 'oil change', 'workshop', 'repair', 'servicing', 'tune up', 'inspection', 'checkup', 'check up', 'job card'],
  // 'part' is checked as a whole word (see WHOLE_WORD_PATTERNS, matches
  // "part"/"parts") since it's a common substring of unrelated words
  // ("apartment", "particular", "department").
  parts: ['part', 'spare part', 'spare parts', 'genuine part', 'auto parts'],
};

// Most keywords above are deliberately matched as substrings/prefixes
// ("financ" for finance/financing/financial, "promo" for promo/promotion/
// promotions, "discount" for discount/discounted) so `.includes()` is
// correct for them. A couple are short enough to false-positive inside an
// unrelated real word — "deal" inside "dealer", "sale" inside "sales"/
// "wholesale" — which is exactly how "Find a dealer" used to get misread as
// a promotions question. Those are matched as whole words instead.
// 'sale' deliberately does NOT match its own plural "sales" — in this
// dealership domain "sales" overwhelmingly means the sales team/department
// ("my sales agent", "sales manager"), not a discount event, so treating it
// as a promotions signal would misfire constantly. 'deal' does match "deals"
// since that plural has no such competing everyday meaning here.
const WHOLE_WORD_PATTERNS: Record<string, RegExp> = {
  deal: /\bdeals?\b/,
  sale: /\bsale\b/,
  part: /\bparts?\b/,
};

function keywordMatches(normalized: string, keyword: string): boolean {
  const wholeWordPattern = WHOLE_WORD_PATTERNS[keyword];
  if (wholeWordPattern) return wholeWordPattern.test(normalized);
  return normalized.includes(keyword);
}

const VEHICLE_KEYWORDS = ['model', 'models', 'car', 'suv', 'sedan', 'price', 'latest', 'new car', 'specs', 'specification', 'vehicle'];

// Signals a follow-up question is still about the last vehicle this
// conversation identified by name, even though this message doesn't name one
// itself (e.g. "does it have a sunroof?" right after asking about the EX5).
const VEHICLE_FOLLOWUP_KEYWORDS = [
  'safety', 'feature', 'color', 'colour', 'interior', 'wheel', 'accessory', 'accessories',
  'spec', 'warranty', 'engine', 'mileage', 'fuel', 'seat', 'dimension', 'power', 'torque',
  'transmission', 'airbag', 'adas', 'camera', 'sensor', 'infotainment', 'connectivity',
  'climate', 'lighting', 'range', 'battery', 'charging', 'trunk', 'cargo', 'boot',
];
const PRONOUN_FOLLOWUP_PATTERN = /\b(it|this|that)\b/;

function looksLikeVehicleFollowUp(normalized: string): boolean {
  return VEHICLE_FOLLOWUP_KEYWORDS.some((k) => normalized.includes(k)) || PRONOUN_FOLLOWUP_PATTERN.test(normalized);
}

// Small talk that isn't covered by any specific intent above but still
// deserves a real reply instead of the generic "couldn't find an answer"
// fallback. Checked only after every more specific intent has had a chance
// to match, so e.g. "hi, book me a test drive" still answers the test drive.
const GREETING_PATTERN = /\b(hi+|hello+|hey+|hiya|yo|sup|greetings|good morning|good afternoon|good evening)\b/;
const THANKS_PATTERN = /\b(thanks?|thank you|thank u|thankyou|appreciate it|appreciated)\b/;
const HELP_PATTERN = /\b(who are you|what are you|what can you do|what do you do|how (can|do) you help|how does this (work|chat)|what is this)\b/;

// Catches the model punting ("I don't have that on hand") even when it was
// handed real grounding data — see the note where this is used below.
const HEDGE_PATTERN = /\b(i don'?t have|i do not have|i don'?t know|i'?m not (sure|able)|i can'?t (find|provide|access)|i couldn'?t find|no (information|data) (on|about)|not (currently )?available to me)\b/i;

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

function getAiStatus(): ChatbotAiStatus {
  return { enabled: isAiChatbotEnabled(), provider: 'groq', model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b' };
}

// Turns a flat string-valued spec section (as edited via the admin
// SpecificationsEditor, e.g. { adas: '', airbags: '6' }) into grounding
// lines, skipping blank fields the admin hasn't filled in.
function humanizeKey(key: string): string {
  const spaced = key.replace(/([A-Z])/g, ' $1');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatSpecSection(label: string, section: unknown): string[] {
  if (!section || typeof section !== 'object') return [];
  const parts = Object.entries(section as Record<string, unknown>)
    .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
    .map(([k, v]) => `${humanizeKey(k)}: ${v}`);
  return parts.length > 0 ? [`${label} — ${parts.join(', ')}`] : [];
}

type VehicleDetail = NonNullable<Awaited<ReturnType<typeof getVehicleDetail>>>;

async function getVehicleDetail(vehicleId: string) {
  return prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: {
      id: true,
      name: true,
      slug: true,
      badge: true,
      category: true,
      specifications: true,
      colors: { select: { name: true }, orderBy: { sortOrder: 'asc' } },
      interiors: { select: { name: true, materialType: true }, orderBy: { sortOrder: 'asc' } },
      wheels: { select: { name: true, size: true }, orderBy: { sortOrder: 'asc' } },
      accessories: { select: { name: true, category: true }, orderBy: { sortOrder: 'asc' } },
    },
  });
}

// Grounds the AI in everything admin-curated about one specific vehicle —
// full specs JSON plus its colors/interior/wheel/accessory options — instead
// of just its name and slug, so follow-up questions about features, safety,
// or warranty terms can be answered from real data instead of a punt.
function formatVehicleDetail(v: VehicleDetail): string {
  const specs = (v.specifications as Record<string, unknown>) || {};
  const lines: string[] = [`${v.name}${v.badge ? ` (${v.badge})` : ''} — /models/${v.slug}`];

  lines.push(...formatSpecSection('Engine', specs.engine));
  lines.push(...formatSpecSection('Dimensions', specs.dimensions));
  lines.push(...formatSpecSection('Features', specs.features));
  lines.push(...formatSpecSection('Safety', specs.safety));
  lines.push(...formatSpecSection('Warranty', specs.warranty));

  if (v.colors.length > 0) lines.push(`Available colors: ${v.colors.map((c) => c.name).join(', ')}`);
  if (v.interiors.length > 0) lines.push(`Interior options: ${v.interiors.map((i) => `${i.name} (${i.materialType})`).join(', ')}`);
  if (v.wheels.length > 0) lines.push(`Wheel options: ${v.wheels.map((w) => `${w.name} ${w.size}`).join(', ')}`);
  if (v.accessories.length > 0) lines.push(`Accessories available: ${v.accessories.map((a) => a.name).join(', ')}`);

  return lines.join('\n');
}

// `requireNameMention` restricts this to messages that name a specific
// vehicle (a high-confidence signal, safe to check before the knowledge
// base). Without it, generic words like "car" or "model" would shadow every
// admin-curated knowledge base entry, since most questions mention a vehicle
// in passing — so the generic keyword fallback only runs once the knowledge
// base has already had a chance to answer.
//
// When exactly one vehicle is named, the reply is grounded in that vehicle's
// full detail (specs/colors/interior/wheels/accessories) rather than just a
// name+link line, and its id is returned so the conversation can remember it
// for follow-up questions that don't repeat the name.
async function answerVehicles(normalized: string, requireNameMention: boolean): Promise<{ text: string; vehicleId: string | null } | null> {
  const vehicles = await prisma.vehicle.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { id: true, name: true, slug: true, model: true, badge: true },
  });
  if (vehicles.length === 0) return null;

  const mentioned = vehicles.filter((v) => normalized.includes(v.name.toLowerCase()) || normalized.includes(v.model.toLowerCase()));
  const genericMatch = !requireNameMention && VEHICLE_KEYWORDS.some((k) => normalized.includes(k));
  if (mentioned.length === 0 && !genericMatch) return null;

  if (mentioned.length === 1) {
    const detail = await getVehicleDetail(mentioned[0].id);
    if (detail) return { text: formatVehicleDetail(detail), vehicleId: detail.id };
  }

  const shortlist = (mentioned.length > 0 ? mentioned : vehicles).slice(0, 5);
  const lines = shortlist.map((v) => {
    return `• ${v.name}${v.badge ? ` (${v.badge})` : ''} — /models/${v.slug}`;
  });

  const text = `Here${shortlist.length === 1 ? "'s" : ' are'} our ${mentioned.length > 0 ? 'match' + (shortlist.length === 1 ? '' : 'es') : 'latest models'}:\n${lines.join('\n')}\n\nWant to book a test drive or see financing options for one of these?`;
  return { text, vehicleId: null };
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

function readContactSetting(raw: Record<string, any>): string {
  const parts: string[] = [];
  const phone = raw?.phone?.primary || raw?.phone?.sales;
  if (phone) parts.push(`Phone: ${phone}`);
  if (raw?.whatsapp) parts.push(`WhatsApp: ${raw.whatsapp}`);
  const email = raw?.email?.general || raw?.email?.sales;
  if (email) parts.push(`Email: ${email}`);
  const addr = raw?.headquarters?.address;
  if (addr) {
    const addressLine = [addr.street, addr.area, addr.city, addr.region, addr.country].filter(Boolean).join(', ');
    if (addressLine) parts.push(`Address: ${addressLine}`);
  }
  return parts.join('\n');
}

async function answerContact(): Promise<string> {
  const setting = await prisma.setting.findUnique({ where: { key: 'contact_information' } });
  if (!setting?.value) {
    return "I don't have our contact details loaded right now — please check the /contact page or reach us on WhatsApp.";
  }
  try {
    const contact = JSON.parse(setting.value);
    const lines = readContactSetting(contact);
    if (!lines) return "I don't have our contact details loaded right now — please check the /contact page or reach us on WhatsApp.";
    return `Here's how to reach us:\n${lines}\n\nYou can also find this on our /contact page.`;
  } catch {
    return "I don't have our contact details loaded right now — please check the /contact page or reach us on WhatsApp.";
  }
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

async function answerService(): Promise<string> {
  return 'Our workshop team handles everything from scheduled maintenance and oil changes to diagnostics and warranty work. Book a service at /service, or share your phone number here and our service team will confirm a slot with you directly.';
}

async function answerParts(normalized: string): Promise<string> {
  const parts = await prisma.sparePart.findMany({
    where: { isActive: true },
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }],
    take: 30,
    select: { name: true, category: true, brand: true, stock: true },
  });
  if (parts.length === 0) {
    return "Visit /parts to browse our genuine spare parts catalog and request a quote — tell me which part you're after and I can point you in the right direction.";
  }
  const mentioned = parts.filter(
    (p) => normalized.includes(p.name.toLowerCase()) || (p.brand && normalized.includes(p.brand.toLowerCase())) || normalized.includes(p.category.toLowerCase())
  );
  const shortlist = (mentioned.length > 0 ? mentioned : parts).slice(0, 5);
  const lines = shortlist.map((p) => `• ${p.name}${p.brand ? ` (${p.brand})` : ''}${p.stock > 0 ? '' : ' — currently out of stock'}`);
  return `Here${shortlist.length === 1 ? "'s" : ' are'} some genuine parts we stock:\n${lines.join('\n')}\n\nVisit /parts for full details, pricing and to request a quote.`;
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

function answerThanks(): string {
  return "You're very welcome! Let me know if you'd like to see our models, book a test drive, check financing, book a service, browse genuine parts, or find a dealer near you.";
}

function answerHelp(): string {
  return 'I can help you explore our models, book a test drive, check current promotions, look at financing options, book a workshop service, find genuine parts, or connect you with a dealer near you. Just ask me something like "what SUVs do you have", "how do I book a test drive", or "I need to service my car".';
}

async function maybeCaptureLead(
  conversationId: string,
  existingLeadId: string | null,
  message: string,
  intent: ChatbotIntent
): Promise<void> {
  if (existingLeadId) return;
  if (intent !== 'test-drive' && intent !== 'financing' && intent !== 'service') return;

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

async function getRecentHistory(conversationId: string): Promise<ChatTurn[]> {
  const recent = await prisma.chatbotMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: 8,
    select: { role: true, content: true },
  });
  return recent.reverse().map((m) => ({ role: m.role as 'user' | 'bot', content: m.content }));
}

async function handleMessage(sessionId: string, message: string): Promise<ChatbotReply> {
  const conversation = await prisma.chatbotConversation.upsert({
    where: { sessionId },
    update: {},
    create: { sessionId },
  });

  const history = isAiChatbotEnabled() ? await getRecentHistory(conversation.id) : [];
  const config = await getConfig();

  const normalized = normalize(message);
  let intent: ChatbotIntent = 'fallback';
  let answer: string | null = null;
  let matchedKnowledgeId: string | null = null;
  let matchedVehicleId: string | null = null;

  if (INTENT_KEYWORDS['test-drive'].some((k) => keywordMatches(normalized, k))) {
    intent = 'test-drive';
    answer = await answerTestDrive();
  } else if (INTENT_KEYWORDS.financing.some((k) => keywordMatches(normalized, k))) {
    intent = 'financing';
    answer = await answerFinancing();
  } else if (INTENT_KEYWORDS.dealers.some((k) => keywordMatches(normalized, k))) {
    intent = 'dealers';
    answer = await answerDealers();
  } else if (INTENT_KEYWORDS.contact.some((k) => keywordMatches(normalized, k))) {
    intent = 'contact';
    answer = await answerContact();
  } else if (INTENT_KEYWORDS.promotions.some((k) => keywordMatches(normalized, k))) {
    intent = 'promotions';
    answer = await answerPromotions();
  } else if (INTENT_KEYWORDS.service.some((k) => keywordMatches(normalized, k))) {
    intent = 'service';
    answer = await answerService();
  } else if (INTENT_KEYWORDS.parts.some((k) => keywordMatches(normalized, k))) {
    intent = 'parts';
    answer = await answerParts(normalized);
  } else {
    // High-confidence check first: a named vehicle mention. The broader
    // "mentions a generic word like 'car' or 'model'" check is deferred
    // below, after the knowledge base has had a chance to answer. A null
    // result here (requireNameMention: true) reliably means this message
    // doesn't name any vehicle at all — used below to detect follow-ups.
    const namedVehicleAnswer = await answerVehicles(normalized, true);
    if (namedVehicleAnswer) {
      intent = 'vehicles';
      answer = namedVehicleAnswer.text;
      matchedVehicleId = namedVehicleAnswer.vehicleId;
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

  // This message didn't name a vehicle itself (else the branch above would
  // have answered) and nothing else matched — if it reads like a follow-up
  // ("does it have ADAS?") and we remember which vehicle this conversation
  // was just discussing, ground the answer in that vehicle's full detail
  // instead of falling through to the generic "latest models" list.
  if (!answer && conversation.lastVehicleId && looksLikeVehicleFollowUp(normalized)) {
    const detail = await getVehicleDetail(conversation.lastVehicleId);
    if (detail) {
      intent = 'vehicles';
      answer = formatVehicleDetail(detail);
      matchedVehicleId = detail.id;
    }
  }

  if (!answer) {
    const genericVehicleAnswer = await answerVehicles(normalized, false);
    if (genericVehicleAnswer) {
      intent = 'vehicles';
      answer = genericVehicleAnswer.text;
      matchedVehicleId = genericVehicleAnswer.vehicleId;
    }
  }

  if (!answer && GREETING_PATTERN.test(normalized)) {
    intent = 'greeting';
    answer = config.greeting;
  } else if (!answer && THANKS_PATTERN.test(normalized)) {
    intent = 'greeting';
    answer = answerThanks();
  } else if (!answer && HELP_PATTERN.test(normalized)) {
    intent = 'greeting';
    answer = answerHelp();
  }

  const ruleBasedAnswer = answer;
  if (!ruleBasedAnswer) {
    intent = 'fallback';
  }

  // The rule engine already fetched real vehicles/promotions/dealers/financing/
  // contact details for this intent — reuse that formatted text as grounding
  // so the AI layer can only restate real data, never invent prices or specs.
  const aiAnswer = await generateAiReply({ message, history, groundingContext: ruleBasedAnswer });

  // Despite the system prompt telling it to only speak from CONTEXT DATA, the
  // model sometimes hedges anyway ("I don't have that on hand") even when
  // real grounding was provided — observed live with dealer lookups, where a
  // real dealer record existed but the AI answered as if it had nothing.
  // When we already have a solid rule-based answer, a hedging AI reply is
  // strictly worse than just showing that real answer, so discard it.
  const aiHedged = aiAnswer != null && ruleBasedAnswer != null && HEDGE_PATTERN.test(aiAnswer);
  answer = aiHedged ? ruleBasedAnswer : aiAnswer ?? ruleBasedAnswer ?? config.fallbackMessage;

  await prisma.chatbotMessage.create({ data: { conversationId: conversation.id, role: 'user', content: message } });
  await prisma.chatbotMessage.create({
    data: { conversationId: conversation.id, role: 'bot', content: answer, intent, matchedKnowledgeId },
  });

  if (matchedVehicleId && matchedVehicleId !== conversation.lastVehicleId) {
    await prisma.chatbotConversation.update({
      where: { id: conversation.id },
      data: { lastVehicleId: matchedVehicleId },
    });
  }

  await maybeCaptureLead(conversation.id, conversation.leadId, message, intent);

  return { answer, intent, showWhatsAppCta: intent === 'fallback' && !aiAnswer };
}

export const chatbotService = {
  getConfig,
  getAiStatus,
  handleMessage,
};
