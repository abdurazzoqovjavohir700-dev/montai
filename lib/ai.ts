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

const VISION_CHAIN = [
  'meta-llama/llama-4-scout-17b-16e-instruct', // 30K TPM, native multimodal
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
      return { type: 'image_url' as const, image_url: { url: `data:${src.media_type};base64,${src.data}` } };
    }
    if (block.type === 'image_url') {
      return block as { type: 'image_url'; image_url: { url: string } };
    }
    return { type: 'text' as const, text: (block as { type: string; text: string }).text ?? '' };
  });
}

function sanitizeForTextModel(content: ChatMessage['content']): string {
  if (typeof content === 'string') return content;
  return content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: string; text?: string }).text ?? '')
    .join(' ') || '[rasm]';
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
  let highPriorityErr: unknown; // preserve rate_limit/auth over model_unavailable

  for (const model of models) {
    try {
      console.log(`[AI] Trying model: ${model}`);
      const stream = await groq.chat.completions.create({
        ...buildParams(model),
        stream: true,
      }) as GroqStream;
      console.log(`[AI] Model OK: ${model}`);
      return { stream, model };
    } catch (err) {
      const cls = classifyError(err);
      console.warn(`[AI] ${model} failed (${cls}):`, err instanceof Error ? err.message : String(err));
      lastErr = err;
      // Keep the highest-priority error (rate_limit/auth > model_unavailable/unknown)
      if (cls === 'rate_limit' || cls === 'auth') highPriorityErr = err;
      if (!shouldTryNext(cls)) break;
    }
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
  }
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
  const hasImage = lastUserMsg ? hasImageContent(lastUserMsg.content) : false;

  const safetyAddition = hasImage ? getImageSafetyPrompt() : '';
  const systemPrompt = MONTAI_SYSTEM_PROMPT + contextAddition + safetyAddition;
  const maxTokens = hasImage ? 1500 : 1024;

  const buildGroqMessages = (visionOk: boolean): Groq.Chat.ChatCompletionMessageParam[] => [
    { role: 'system', content: systemPrompt },
    ...messages.map((msg) => {
      const hasImgInMsg = typeof msg.content !== 'string' && hasImageContent(msg.content);
      const content = (!visionOk && hasImgInMsg)
        ? sanitizeForTextModel(msg.content)
        : toGroqContent(msg.content);
      return { role: msg.role as 'user' | 'assistant', content } as Groq.Chat.ChatCompletionMessageParam;
    }),
  ];

  const modelChain = hasImage ? VISION_CHAIN : TEXT_CHAIN;
  console.log(`[AI] hasImage=${hasImage} chain=[${modelChain.join(', ')}]`);

  let activeStream: GroqStream;
  let activeModel: string;
  let usingVision = hasImage;

  try {
    const result = await tryModelsInOrder(modelChain, (model) => ({
      model,
      messages: buildGroqMessages(hasImage),
      max_tokens: maxTokens,
      temperature: 0.65,
    }));
    activeStream = result.stream;
    activeModel = result.model;
  } catch (visionErr) {
    if (!hasImage) throw visionErr;

    console.warn('[AI] All vision models failed, degrading to text chain');
    logModerationEvent({ type: 'image', category: 'safe', confidence: 'low', timestamp: new Date().toISOString() });
    usingVision = false;

    const result = await tryModelsInOrder(TEXT_CHAIN, (model) => ({
      model,
      messages: buildGroqMessages(false),
      max_tokens: 1024,
      temperature: 0.65,
    }));
    activeStream = result.stream;
    activeModel = result.model;
  }

  console.log(`[AI] Streaming model=${activeModel} vision=${usingVision}`);
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
        console.warn(`[AI] Stream error (${cls}) on ${activeModel}`);

        if (!shouldTryNext(cls)) {
          controller.error(streamErr);
          return;
        }

        const chain: string[] = usingVision
          ? [...VISION_CHAIN, ...TEXT_CHAIN]
          : [...TEXT_CHAIN];
        const remaining = chain.filter(m => m !== activeModel);

        if (remaining.length === 0) {
          controller.error(streamErr);
          return;
        }

        const groq = getGroq();
        let recovered = false;
        for (const fallbackModel of remaining) {
          try {
            console.log(`[AI] Stream recovery: trying ${fallbackModel}`);
            const visionOk = (VISION_CHAIN as readonly string[]).includes(fallbackModel);
            const fallback = await groq.chat.completions.create({
              model: fallbackModel,
              messages: buildGroqMessages(visionOk),
              max_tokens: 1024,
              temperature: 0.7,
              stream: true,
            }) as GroqStream;
            await drainStream(fallback, controller);
            console.log(`[AI] Recovered with ${fallbackModel}`);
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
