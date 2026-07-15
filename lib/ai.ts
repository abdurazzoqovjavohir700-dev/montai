import Groq from 'groq-sdk';
import { MONTAI_SYSTEM_PROMPT } from './constants';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string | Array<{ type: string; [key: string]: unknown }>;
}

function messageToText(content: ChatMessage['content']): string {
  if (typeof content === 'string') return content;
  return content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: string; text: string }).text)
    .join('');
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
  const contextAddition = userContext
    ? `\n\n## USER CONTEXT\n- Nickname: ${userContext.nickname ?? 'Editor'}\n- Language: ${userContext.language ?? 'English'} — ALWAYS respond in this language\n- Experience Level: ${userContext.experienceLevel ?? 'beginner'}\n- Primary Software: ${userContext.primarySoftware?.join(', ') ?? 'Not specified'}\n- Focus Areas: ${userContext.focusAreas?.join(', ') ?? 'General'}\n\nAdapt your teaching style and language to match the user's level and preferred language.`
    : '';

  const systemPrompt = MONTAI_SYSTEM_PROMPT + contextAddition;

  const groqMessages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: messageToText(msg.content),
    })),
  ];

  const stream = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: groqMessages,
    max_tokens: 4096,
    stream: true,
  });

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
        controller.error(err);
      }
    },
  });
}

export async function generateChatTitle(userMessage: string): Promise<string> {
  const response = await groq.chat.completions.create({
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
