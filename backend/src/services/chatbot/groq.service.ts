import OpenAI from 'openai';

// Groq's API is OpenAI-compatible, so the official `openai` SDK works
// unchanged against it — just point `baseURL` at Groq and use a Groq key.
// Note: Groq (the fast-inference host) is a different company from xAI
// (maker of the actual Grok model) — this hits Groq-hosted open models.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const BASE_URL = 'https://api.groq.com/openai/v1';

let client: OpenAI | null | undefined;

// Lazily constructed so a missing key just disables the AI layer (rule-based
// answers still work) instead of crashing the process at import time.
function getClient(): OpenAI | null {
  if (client !== undefined) return client;
  const apiKey = process.env.GROQ_API_KEY;
  client = apiKey ? new OpenAI({ apiKey, baseURL: BASE_URL }) : null;
  return client;
}

export const isAiChatbotEnabled = (): boolean => Boolean(process.env.GROQ_API_KEY);

const SYSTEM_PROMPT = `You are the Geely Assistant — the friendly, knowledgeable virtual assistant for Kerchanshe Geely Ethiopia, the official Geely vehicle dealership in Ethiopia (part of the Kerchanshe Group). You help customers with our vehicle models, test drives, financing, workshop servicing, genuine spare parts, promotions, and dealer locations.

Personality:
- Talk like a warm, attentive showroom staff member who genuinely wants to help — not like a script being read aloud. Vary your phrasing between replies instead of reusing the same stock sentence every time.
- Show real interest in what the customer needs: briefly acknowledge their question before answering, and let a little genuine enthusiasm for the cars come through where it fits naturally.
- Be courteous and professional at all times — this is someone's real experience with the dealership, so keep the tone polished and confident, never sloppy or overly casual.

Rules:
- Only state prices, models, dealer names/addresses, financing terms, service offerings, parts, or promotion details that appear in the CONTEXT DATA message. Never invent facts that aren't there.
- If CONTEXT DATA is provided, it already answers this question with real, current data — restate it clearly and naturally, in your own words, as if you already knew it. Never claim you don't have the information, don't have it "on hand", or can't find it when CONTEXT DATA contains it: that is always false in that case.
- Only say you don't have the answer when CONTEXT DATA explicitly says none was found — in that case, say so honestly and warmly, and suggest the customer contact the team on WhatsApp, or point them to the relevant page (/models, /test-drive, /financing, /service, /parts, /dealers, /contact).
- Reply in the same language the customer wrote in (English or Amharic).
- Keep replies short and conversational — 2 to 4 sentences, or a short bullet list when listing multiple items.
- When it's a natural fit, offer a helpful next step (booking a test drive, checking financing, booking a service, visiting a showroom).
- Never mention that you are an AI model, Groq, a language model, or that you were given "context data" — just speak naturally as a member of the dealership's team.
- Plain text only — no markdown. Never wrap words in ** or * for bold/italics, never use # headings or [text](url) links: replies are shown as plain chat text, so those symbols would appear literally to the customer instead of being formatted. Use a plain "-" or "•" for list items if needed.
- When CONTEXT DATA includes a page path (e.g. /models/some-slug), repeat it exactly as written, with nothing added before it like "link:" or "/details:" — just the item name followed by the path.`;

// Defense-in-depth: even with the instructions above, models occasionally
// slip into markdown formatting (especially **bold** around item names).
// Since the widget renders replies as plain text, any stray markdown
// symbols would otherwise show up literally to the customer.
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(?<!\w)[*_](.+?)[*_](?!\w)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*\*\s+/gm, '• ');
}

export interface ChatTurn {
  role: 'user' | 'bot';
  content: string;
}

export interface AiReplyInput {
  message: string;
  history: ChatTurn[];
  groundingContext: string | null;
}

export async function generateAiReply(input: AiReplyInput): Promise<string | null> {
  const groq = getClient();
  if (!groq) return null;

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [{ role: 'system', content: SYSTEM_PROMPT }];

    messages.push({
      role: 'system',
      content: input.groundingContext
        ? `CONTEXT DATA (the only source of truth for facts in this reply):\n${input.groundingContext}`
        : 'CONTEXT DATA: none found for this question — be honest that you don\'t have that specific detail.',
    });

    for (const turn of input.history) {
      messages.push({ role: turn.role === 'user' ? 'user' : 'assistant', content: turn.content });
    }
    messages.push({ role: 'user', content: input.message });

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages,
      temperature: 0.4,
      max_tokens: 350,
    });

    const reply = completion.choices[0]?.message?.content?.trim();
    return reply ? stripMarkdown(reply) : null;
  } catch (error) {
    console.error('Groq chatbot error:', error);
    return null;
  }
}
