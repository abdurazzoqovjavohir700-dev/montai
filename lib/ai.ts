import Groq from 'groq-sdk';
import type { Stream } from 'groq-sdk/core/streaming';
import type { ChatCompletionChunk } from 'groq-sdk/resources/chat/completions';
import { MONTAI_SYSTEM_PROMPT } from './constants';
import { getImageSafetyPrompt, logModerationEvent } from './moderation';

// ─── Groq client ─────────────────────────────────────────────────────────────

function getGroq(): Groq {
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: unknown }>;
}

type ErrorClass = 'model_unavailable' | 'rate_limit' | 'auth' | 'unknown';

// ─── Fallback chains (ordered by preference) ─────────────────────────────────
// Active Groq models as of 2026-07: llama-3.3-70b-versatile, llama-3.1-8b-instant,
// meta-llama/llama-4-scout-17b-16e-instruct, qwen/qwen3-32b, openai/gpt-oss-20b
// Deprecated: gemma2-9b-it, llama-3.2-*-preview

// Free tier actual TPM limits (measured 2026-07):
//   llama-4-scout = 30K TPM (highest available — primary for text+vision)
//   gpt-oss-120b  = 8K TPM
//   qwen3.6-27b   = 8K TPM
//   llama-3.1-8b  = 6K TPM
//   llama-3.3-70b = 6K TPM  ← too low, avoid as primary
//   qwen3-32b     = 6K TPM
// System prompt ~600 tokens → llama-4-scout handles comfortably
const TEXT_CHAIN = [
  'meta-llama/llama-4-scout-17b-16e-instruct', // Primary: 30K TPM, multimodal, best free tier limit
  'openai/gpt-oss-120b',                         // Fallback: 8K TPM
  'qwen/qwen3.6-27b',                             // Fallback: 8K TPM
  'llama-3.1-8b-instant',                         // Last resort: 6K TPM
] as const;

// Vision handled by Gemini (Groq has no vision models — all return "content must be a string")
const GEMINI_VISION_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-001',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
] as const;

// ─── Error classification ────────────────────────────────────────────────────

function classifyError(err: unknown): ErrorClass {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  if (msg.includes('429') || msg.includes('rate limit') || msg.includes('rate_limit')) return 'rate_limit';
  if (msg.includes('401') || msg.includes('api key') || msg.includes('unauthorized') || msg.includes('invalid_api_key')) return 'auth';
  if (
    msg.includes('404') || msg.includes('not found') ||
    msg.includes('deprecated') || msg.includes('unsupported') ||
    msg.includes('does not exist') || msg.includes('unavailable') ||
    (msg.includes('model') && (msg.includes('invalid') || msg.includes('error') || msg.includes('fail')))
  ) return 'model_unavailable';
  return 'unknown';
}

function shouldTryNext(ec: ErrorClass): boolean {
  return ec !== 'auth';
}

// ─── Content helpers ─────────────────────────────────────────────────────────

export function hasImageContent(content: ChatMessage['content']): boolean {
  if (typeof content === 'string') return false;
  return content.some(b => b.type === 'image' || b.type === 'image_url');
}

function toGroqContent(
  content: ChatMessage['content'],
): Groq.Chat.ChatCompletionMessageParam['content'] {
  if (typeof content === 'string') return content;
  return content.map(block => {
    if (block.type === 'image') {
      const src = block.source as { type: string; media_type: string; data: string };
      // Validate base64 data exists and has reasonable length (min ~100 chars)
      if (!src?.data || src.data.length < 100) {
        console.error('[VISION] Invalid image block — data missing or too short:', src?.data?.length ?? 0);
        return { type: 'text' as const, text: '[Image failed to load — please re-upload]' };
      }
      const mime = src.media_type || 'image/jpeg';
      const url = `data:${mime};base64,${src.data}`;
      console.log('[VISION] Image block OK — mime:', mime, 'base64 length:', src.data.length);
      return { type: 'image_url' as const, image_url: { url } };
    }
    if (block.type === 'image_url') {
      const b = block as { type: 'image_url'; image_url: { url: string } };
      console.log('[VISION] image_url block — url length:', b.image_url?.url?.length ?? 0);
      return b;
    }
    return { type: 'text' as const, text: (block as { type: string; text: string }).text ?? '' };
  });
}

function sanitizeForTextModel(content: ChatMessage['content'], imageFailedReason?: string): string {
  if (typeof content === 'string') return content;
  const text = content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: string; text?: string }).text ?? '')
    .join(' ');
  const imgCount = content.filter(b => b.type === 'image' || b.type === 'image_url').length;
  if (imgCount > 0 && imageFailedReason) {
    const note = `[Foydalanuvchi ${imgCount > 1 ? `${imgCount} ta rasm` : 'rasm'} yubordi — ${imageFailedReason}]`;
    return text ? `${note}\n${text}` : note;
  }
  if (imgCount > 0) return text ? `[rasm]\n${text}` : '[rasm]';
  return text;
}

// ─── OpenRouter vision (free, no credit card) ────────────────────────────────

function buildOpenAIVisionContent(msg: ChatMessage, fallbackText: string): unknown[] {
  const content: unknown[] = [];
  if (typeof msg.content !== 'string') {
    for (const block of msg.content) {
      if (block.type === 'image') {
        const src = block.source as { media_type: string; data: string };
        if (src?.data && src.data.length > 100) {
          content.push({ type: 'image_url', image_url: { url: `data:${src.media_type || 'image/jpeg'};base64,${src.data}` } });
        }
      } else if (block.type === 'image_url') {
        content.push(block);
      } else if (block.type === 'text') {
        const t = (block as { text?: string }).text ?? '';
        if (t) content.push({ type: 'text', text: t });
      }
    }
  }
  if (!content.some(b => (b as { type: string }).type === 'image_url')) return [];
  if (!content.some(b => (b as { type: string }).type === 'text')) {
    content.push({ type: 'text', text: fallbackText });
  }
  return content;
}

async function streamOpenRouterVision(
  msg: ChatMessage,
  systemPrompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const enc = new TextEncoder();
  const apiKey = process.env.OPENROUTER_API_KEY ?? '';
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set');

  const content = buildOpenAIVisionContent(msg, 'Bu rasmni batafsil tahlil qil.');
  if (content.length === 0) throw new Error('No image data');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.2-11b-vision-instruct:free',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ],
      max_tokens: 2048,
      temperature: 0.65,
      stream: true,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(`OpenRouter ${res.status}: ${err.error?.message ?? 'Unknown'}`);
  }
  if (!res.body) throw new Error('No body from OpenRouter');

  console.log('[VISION] Using OpenRouter llama-3.2-11b-vision:free');
  return new ReadableStream({
    async start(controller) {
      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let buf = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const json = line.slice(6).trim();
            if (!json || json === '[DONE]') continue;
            try {
              const chunk = JSON.parse(json) as { choices?: Array<{ delta?: { content?: string } }> };
              const text = chunk.choices?.[0]?.delta?.content ?? '';
              if (text) controller.enqueue(enc.encode(text));
            } catch { /* skip malformed chunk */ }
          }
        }
        controller.close();
      } catch (e) { controller.error(e); }
    },
  });
}

// ─── Gemini vision streaming ──────────────────────────────────────────────────

async function streamGeminiVision(
  msg: ChatMessage,
  systemPrompt: string,
): Promise<ReadableStream<Uint8Array>> {
  const enc = new TextEncoder();
  const apiKey = process.env.GEMINI_API_KEY ?? '';

  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const parts: unknown[] = [];
  let userText = '';

  if (typeof msg.content !== 'string') {
    for (const block of msg.content) {
      if (block.type === 'image') {
        const src = block.source as { media_type: string; data: string };
        if (src?.data && src.data.length > 100) {
          parts.push({ inlineData: { mimeType: src.media_type || 'image/jpeg', data: src.data } });
        }
      } else if (block.type === 'image_url') {
        const url = ((block as unknown) as { image_url: { url: string } }).image_url?.url ?? '';
        if (url.startsWith('data:')) {
          const comma = url.indexOf(',');
          const mimeType = url.slice(5, comma).replace(';base64', '');
          const data = url.slice(comma + 1);
          parts.push({ inlineData: { mimeType, data } });
        }
      } else if (block.type === 'text') {
        userText += (block as { text?: string }).text ?? '';
      }
    }
  } else {
    userText = msg.content;
  }

  if (parts.length === 0) {
    const errMsg = '⚠️ Rasm yuklanmadi — qaytadan yuklang va urinib ko\'ring.';
    return new ReadableStream({ start(c) { c.enqueue(enc.encode(errMsg)); c.close(); } });
  }
  parts.push({ text: userText.trim() || 'Bu rasmni batafsil tahlil qil.' });

  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts }],
    generationConfig: { maxOutputTokens: 2048, temperature: 0.65 },
  });

  for (const model of GEMINI_VISION_MODELS) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body },
      );

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({})) as { error?: { message?: string } };
        console.error(`[VISION/Gemini/${model}] HTTP ${res.status}:`, errJson.error?.message);
        continue;
      }
      if (!res.body) continue;

      console.log(`[VISION] Using Gemini model: ${model}`);

      return new ReadableStream({
        async start(controller) {
          const reader = res.body!.getReader();
          const dec = new TextDecoder();
          let buf = '';
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buf += dec.decode(value, { stream: true });
              const lines = buf.split('\n');
              buf = lines.pop() ?? '';
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const json = line.slice(6).trim();
                if (!json || json === '[DONE]') continue;
                try {
                  const chunk = JSON.parse(json) as {
                    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
                  };
                  const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
                  if (text) controller.enqueue(enc.encode(text));
                } catch { /* skip malformed SSE line */ }
              }
            }
            controller.close();
          } catch (e) {
            controller.error(e);
          }
        },
      });
    } catch (err) {
      console.error(`[VISION/Gemini/${model}] Network error:`, err);
    }
  }

  const fallbackMsg = '⚠️ Rasm tahlil qilinmadi — Gemini xatolik. Qaytadan urinib ko\'ring.';
  return new ReadableStream({ start(c) { c.enqueue(enc.encode(fallbackMsg)); c.close(); } });
}

// ─── Core: try models in order ───────────────────────────────────────────────

type GroqStream = Stream<ChatCompletionChunk>;

interface StreamParams {
  model: string;
  messages: Groq.Chat.ChatCompletionMessageParam[];
  max_tokens: number;
  temperature: number;
}

async function tryModelsInOrder(
  models: readonly string[],
  buildParams: (model: string) => StreamParams,
): Promise<{ stream: GroqStream; model: string }> {
  const groq = getGroq();
  let lastErr: unknown;
  let highPriorityErr: unknown;

  for (const model of models) {
    // Retry strategy: rate_limit gets 2 retries (1s, 2s); other errors skip immediately
    const delays = [0, 1000, 2000];
    for (let attempt = 0; attempt < delays.length; attempt++) {
      if (delays[attempt] > 0) await new Promise(r => setTimeout(r, delays[attempt]));
      try {
        const stream = await groq.chat.completions.create({
          ...buildParams(model),
          stream: true,
        }) as GroqStream;
        return { stream, model };
      } catch (err) {
        const cls = classifyError(err);
        lastErr = err;
        if (cls === 'rate_limit' || cls === 'auth') highPriorityErr = err;
        if (!shouldTryNext(cls)) break; // auth → stop all
        if (cls !== 'rate_limit') break; // non-rate-limit → next model
        // rate_limit → retry with next delay
      }
    }
    if (highPriorityErr && classifyError(highPriorityErr) === 'auth') break;
  }

  throw highPriorityErr ?? lastErr;
}

// ─── Main export ─────────────────────────────────────────────────────────────

export async function streamChatResponse(
  messages: ChatMessage[],
  userContext?: {
    nickname?: string;
    language?: string;
    experienceLevel?: string;
    primarySoftware?: string[];
    focusAreas?: string[];
  },
  opts?: { hasImage?: boolean; isPdfRequest?: boolean }
): Promise<ReadableStream<Uint8Array>> {
  const now = new Date();
  const dateStr = now.toLocaleDateString('uz-UZ', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  const contextAddition = `\n\n=== CURRENT CONTEXT ===
Current date: ${dateStr}
Current time: ${timeStr}
User nickname: ${userContext?.nickname ?? 'Editor'}
User language: ${userContext?.language ?? 'en'} — ALWAYS respond in this language
User experience: ${userContext?.experienceLevel ?? 'beginner'}
User software: ${userContext?.primarySoftware?.join(', ') ?? 'not specified'}
Use their nickname naturally (not every message). Respond in their language. Adapt to their experience level.`;

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  // opts.hasImage comes directly from the frontend which definitively knows
  // whether an image was attached. Falls back to content inspection if not provided.
  const hasImage = opts?.hasImage ?? (lastUserMsg ? hasImageContent(lastUserMsg.content) : false);
  console.log('[AI] hasImage:', hasImage, '(flag:', opts?.hasImage, '| detected:', lastUserMsg ? hasImageContent(lastUserMsg.content) : false, ')');
  const hasPdf = !hasImage && typeof lastUserMsg?.content === 'string' && lastUserMsg.content.startsWith('[PDF_ATTACH]:');

  const pdfStrictMode = opts?.isPdfRequest
    ? `\n\n=== PDF GENERATION — ULTRA STRICT MODE ===
RULE #1: Generate EXACTLY what the user requested. NOT MORE. NOT LESS.
RULE #2: FORBIDDEN ADDITIONS — do NOT add any of these unless user explicitly requested:
  - Introduction / Overview / Purpose / Background
  - Summary / Conclusion / Closing remarks
  - Timeline / Next steps / Resources / References
  - Tips / Notes / Additional information
  - Disclaimers / Recommendations
RULE #3: Match content type to request:
  - "shortcuts" → numbered shortcut list ONLY
  - "invoice" → invoice fields ONLY
  - "notes on X" → bullet-point notes ONLY
  - "report" → report structure ONLY as specified
  - "checklist" → checkboxes ONLY
RULE #4: DO NOT pad or elaborate. If user gave you content, format it. If they gave a topic, generate that topic's content only.
RULE #5: Start with # [Title] immediately. No preamble. No "Here is your PDF:" sentences.
VIOLATING THESE RULES = FAILURE.`
    : '';

  const imageContextAddition = hasImage
    ? `\n\n=== IMAGE ANALYSIS MODE — MANDATORY ===
CRITICAL: The user has uploaded an image. You MUST analyze ONLY the attached image.
DO NOT reference previous conversation topics. DO NOT continue any previous subject.
The attached image is your PRIMARY and ONLY focus for this response.

Analyze what is ACTUALLY in the image:
- If it is a PERSON or SELFIE: describe the person, their appearance, expression, background, lighting
- If it is a PHOTO: describe the scene, subjects, composition, colors, mood
- If it is a SCREENSHOT/UI: perform a full UX/UI audit with specific fixes
- If it is CODE: identify bugs, errors, improvements
- If it is a DOCUMENT: extract and summarize the content
- If it is an ERROR MESSAGE: diagnose the root cause and provide the fix

NEVER say "I see you uploaded an image" — just analyze it directly.
NEVER describe previous chat topics — focus 100% on the image.`
    : '';

  const safetyAddition = hasImage ? getImageSafetyPrompt() : '';
  const pdfAddition = hasPdf
    ? '\n\n=== PDF TAHLIL ===\nFoydalanuvchi PDF hujjat yubordi. Chuqur tahlil qil: asosiy g\'oyalar, xulosalar, muhim faktlar, raqamlar va tuzilmani ajratib ko\'rsat. Markdown dan foydalanib tartibli yoz.'
    : '';
  const systemPrompt = MONTAI_SYSTEM_PROMPT + contextAddition + pdfStrictMode + imageContextAddition + safetyAddition + pdfAddition;
  // 65% of free-tier TPM budget used for response; PDF needs more tokens for detailed analysis
  const maxTokens = hasImage ? 2048 : hasPdf ? 2048 : 1536;

  const buildGroqMessages = (visionOk: boolean, imgFailReason?: string): Groq.Chat.ChatCompletionMessageParam[] => {
    // When image is present, use only the last 4 messages (2 exchanges).
    // Sending the full history of an unrelated conversation (e.g., 20 AE messages)
    // causes the model to ignore the image and continue the old topic instead.
    const effectiveMessages = hasImage ? messages.slice(-4) : messages;
    return [
      { role: 'system', content: systemPrompt },
      ...effectiveMessages.map((msg) => {
        const hasImgInMsg = typeof msg.content !== 'string' && hasImageContent(msg.content);
        const content = (!visionOk && hasImgInMsg)
          ? sanitizeForTextModel(msg.content, imgFailReason)
          : toGroqContent(msg.content);
        return { role: msg.role as 'user' | 'assistant', content } as Groq.Chat.ChatCompletionMessageParam;
      }),
    ];
  };

  // Vision → OpenRouter (free) → Gemini → error
  if (hasImage && lastUserMsg) {
    logModerationEvent({ type: 'image', category: 'safe', confidence: 'high', timestamp: new Date().toISOString() });

    // 1. Try OpenRouter (free, no credit card needed)
    try {
      return await streamOpenRouterVision(lastUserMsg, systemPrompt);
    } catch (orErr) {
      console.warn('[VISION] OpenRouter failed:', (orErr as Error).message);
    }

    // 2. Try Gemini (requires billing to be enabled)
    try {
      return await streamGeminiVision(lastUserMsg, systemPrompt);
    } catch (gemErr) {
      console.warn('[VISION] Gemini failed:', (gemErr as Error).message);
    }

    // 3. Both failed → clear error
    const lang = userContext?.language ?? 'uz';
    const enc = new TextEncoder();
    const msg = lang === 'uz'
      ? '⚠️ Rasm tahlili ishlamayapti.\n\nYechim:\n1. openrouter.ai da bepul ro\'yxatdan o\'ting\n2. API key oling (karta kerak emas)\n3. Vercel > Settings > Environment Variables ga OPENROUTER_API_KEY qo\'shing'
      : lang === 'ru'
      ? '⚠️ Анализ изображений недоступен.\n\nРешение: получите бесплатный API ключ на openrouter.ai и добавьте OPENROUTER_API_KEY в переменные окружения Vercel.'
      : '⚠️ Image analysis unavailable.\n\nFix: Get a free API key at openrouter.ai and add OPENROUTER_API_KEY to Vercel environment variables.';
    return new ReadableStream({ start(c) { c.enqueue(enc.encode(msg)); c.close(); } });
  }

  const modelChain = TEXT_CHAIN;

  let activeStream: GroqStream;
  let activeModel: string;

  try {
    const result = await tryModelsInOrder(modelChain, (model) => ({
      model,
      messages: buildGroqMessages(false),
      max_tokens: maxTokens,
      temperature: 0.65,
    }));
    activeStream = result.stream;
    activeModel = result.model;
  } catch (err) {
    throw err;
  }
  const encoder = new TextEncoder();

  const drainStream = async (
    stream: GroqStream,
    controller: ReadableStreamDefaultController<Uint8Array>,
  ) => {
    for await (const chunk of stream) {
      const text = (chunk as ChatCompletionChunk).choices[0]?.delta?.content ?? '';
      if (text) controller.enqueue(encoder.encode(text));
    }
  };

  return new ReadableStream({
    async start(controller) {
      try {
        await drainStream(activeStream, controller);
        controller.close();
      } catch (streamErr) {
        const cls = classifyError(streamErr);

        if (!shouldTryNext(cls)) {
          controller.error(streamErr);
          return;
        }

        const remaining = [...TEXT_CHAIN].filter(m => m !== activeModel);

        if (remaining.length === 0) {
          controller.error(streamErr);
          return;
        }

        const groq = getGroq();
        let recovered = false;
        for (const fallbackModel of remaining) {
          try {
            const fallback = await groq.chat.completions.create({
              model: fallbackModel,
              messages: buildGroqMessages(false),
              max_tokens: 1024,
              temperature: 0.7,
              stream: true,
            }) as GroqStream;
            await drainStream(fallback, controller);
            recovered = true;
            break;
          } catch (fbErr) {
            if (!shouldTryNext(classifyError(fbErr))) break;
          }
        }

        if (!recovered) {
          controller.error(new Error('All fallback models exhausted'));
        } else {
          controller.close();
        }
      }
    },
  });
}

// ─── Chat title generation ────────────────────────────────────────────────────

export async function generateChatTitle(userMessage: string): Promise<string> {
  const groq = getGroq();
  const payload: Groq.Chat.ChatCompletionMessageParam = {
    role: 'user',
    content: `Generate a concise 3-6 word title for a chat that starts with this message. Return ONLY the title, nothing else:\n\n"${userMessage.slice(0, 200)}"`,
  };

  for (const model of ['llama-3.1-8b-instant', 'llama-3.3-70b-versatile', 'qwen/qwen3-32b'] as const) {
    try {
      const response = await groq.chat.completions.create({
        model, max_tokens: 30, messages: [payload],
      });
      const title = response.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') ?? '';
      return title.slice(0, 60) || 'New Chat';
    } catch {
      // try next
    }
  }
  return 'New Chat';
}
