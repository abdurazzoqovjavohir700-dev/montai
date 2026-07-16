import Groq from 'groq-sdk';
import { MONTAI_SYSTEM_PROMPT } from './constants';

function getGroq(): Groq {
  return new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: unknown }>;
}

function hasImageContent(content: ChatMessage['content']): boolean {
  if (typeof content === 'string') return false;
  return content.some(b => b.type === 'image' || b.type === 'image_url');
}

function toGroqContent(content: ChatMessage['content']): Groq.Chat.ChatCompletionMessageParam['content'] {
  if (typeof content === 'string') return content;
  return content.map(block => {
    if (block.type === 'image') {
      const src = block.source as { type: string; media_type: string; data: string };
      return {
        type: 'image_url' as const,
        image_url: { url: `data:${src.media_type};base64,${src.data}` },
      };
    }
    if (block.type === 'image_url') return block as { type: 'image_url'; image_url: { url: string } };
    return { type: 'text' as const, text: (block as { type: string; text: string }).text ?? '' };
  });
}

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

  const systemPrompt = MONTAI_SYSTEM_PROMPT + contextAddition;

  const hasImage = messages.some(m => hasImageContent(m.content));
  // Vision uchun llama-3.2-90b-vision-preview (Groq'da ishlaydi), text uchun llama-3.3-70b-versatile
  const model = hasImage ? 'llama-3.2-90b-vision-preview' : 'llama-3.3-70b-versatile';
  const maxTokens = hasImage ? 1500 : 2048;

  const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: toGroqContent(msg.content),
    } as Groq.Chat.ChatCompletionMessageParam)),
  ];

  let stream;
  try {
    stream = await getGroq().chat.completions.create({
      model,
      messages: groqMessages,
      max_tokens: maxTokens,
      temperature: 0.65,
      stream: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('429') || msg.includes('rate limit') || msg.includes('Rate limit')) {
      stream = await getGroq().chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: groqMessages,
        max_tokens: 1024,
        temperature: 0.65,
        stream: true,
      });
    } else {
      throw err;
    }
  }

  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? '';
          if (text) {
            controller.enqueue(encoder.encode(text));
          }
        }
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('429') || msg.includes('rate limit') || msg.includes('Rate limit')) {
          // Fallback model bilan qayta urinish
          try {
            const fallback = await getGroq().chat.completions.create({
              model: 'llama-3.1-8b-instant',
              messages: groqMessages,
              max_tokens: 1024,
              temperature: 0.7,
              stream: true,
            });
            for await (const chunk of fallback) {
              const text = chunk.choices[0]?.delta?.content ?? '';
              if (text) controller.enqueue(encoder.encode(text));
            }
            controller.close();
          } catch (fallbackErr) {
            controller.error(fallbackErr);
          }
        } else {
          controller.error(err);
        }
      }
    },
  });
}

export async function generateChatTitle(userMessage: string): Promise<string> {
  const response = await getGroq().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 30,
    messages: [
      {
        role: 'user',
        content: `Generate a concise 3-6 word title for a chat that starts with this message. Return ONLY the title, nothing else:\n\n"${userMessage.slice(0, 200)}"`,
      },
    ],
  });

  const title = response.choices[0]?.message?.content?.trim().replace(/^["']|["']$/g, '') ?? 'New Chat';
  return title.slice(0, 60) || 'New Chat';
}
