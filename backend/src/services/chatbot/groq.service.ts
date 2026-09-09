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

const SYSTEM_PROMPT = `You are the Geely Assistant, the official website chatbot for Kerchanshe Geely Ethiopia (a car dealership).

Rules:
- Only state prices, models, dealer names/addresses, financing terms, or promotion details that appear in the CONTEXT DATA message. Never invent facts that aren't there.
- If CONTEXT DATA is provided, it already answers this question with real, current data — restate it clearly and naturally. Never claim you don't have the information, don't have it "on hand", or can't find it when CONTEXT DATA contains it: that is always false in that case.
- Only say you don't have the answer when CONTEXT DATA explicitly says none was found — in that case, say so honestly and suggest the customer contact the team on WhatsApp, or point them to the relevant page (/models, /test-drive, /financing, /dealers, /contact).
- Reply in the same language the customer wrote in (English or Amharic).
- Keep replies short and conversational — 2 to 4 sentences, or a short bullet list when listing multiple items.
- When it's a natural fit, offer a next step (booking a test drive, checking financing, visiting a showroom).
- Never mention that you are an AI model, Groq, a language model, or that you were given "context data" — just speak naturally as the dealership's assistant.`;

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

    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Groq chatbot error:', error);
    return null;
  }
}
