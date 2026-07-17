import { type NextRequest } from 'next/server';
import { getSessionUser, checkRateLimit } from '@/lib/session';
import { streamChatResponse, type ChatMessage } from '@/lib/ai';
import { moderateText, logModerationEvent } from '@/lib/moderation';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Rate limiting
  const rateLimit = await checkRateLimit(user.id);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: 'Rate limit exceeded. You can send 30 messages per hour.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json() as {
    messages: ChatMessage[];
    userContext?: {
      nickname?: string;
      language?: string;
      experienceLevel?: string;
      primarySoftware?: string[];
      focusAreas?: string[];
    };
  };

  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: 'Messages required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Server-side text moderation on the last user message
  const lastMsg = body.messages.at(-1);
  if (lastMsg?.role === 'user') {
    const textContent = typeof lastMsg.content === 'string'
      ? lastMsg.content
      : (lastMsg.content as Array<{ type: string; text?: string }>)
          .filter(b => b.type === 'text')
          .map(b => b.text ?? '')
          .join(' ');

    const modResult = moderateText(textContent);
    if (modResult.blocked) {
      logModerationEvent({
        type: 'text', category: modResult.category,
        confidence: modResult.confidence, timestamp: new Date().toISOString(),
        userId: user.id,
      });
      return new Response(
        JSON.stringify({ error: modResult.message }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Limit message history to last 20 messages
  const messages = body.messages.slice(-20);

  try {
    const stream = await streamChatResponse(messages, body.userContext ?? {
      nickname: user.nickname,
      language: user.language,
      experienceLevel: user.experienceLevel,
      primarySoftware: user.primarySoftware,
      focusAreas: user.focusAreas,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Rate-Limit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const msgLow = msg.toLowerCase();
    console.error('[Stream Error]', msg);
    const is429 = msg.includes('429') || msgLow.includes('rate limit') || msgLow.includes('rate_limit') || msgLow.includes('too many requests');
    const isAuth = msg.includes('401') || msgLow.includes('api key') || msgLow.includes('unauthorized') || msgLow.includes('invalid_api_key');
    const isExhausted = msgLow.includes('exhausted');
    const isImage = msgLow.includes('image') || msgLow.includes('vision') || msgLow.includes('multimodal');
    const errText = is429       ? 'AI so\'rovlar limiti — 1 daqiqa kuting va qaytadan yuboring.'
      : isAuth     ? 'AI ulanishida muammo — iltimos keyinroq urinib ko\'ring.'
      : isExhausted ? 'AI xizmati vaqtincha yukli — bir daqiqada qaytadan urinib ko\'ring.'
      : isImage    ? 'Rasm tahlil qilishda xatolik — rasm formatini tekshiring.'
      : 'AI xizmati hozir band. Qaytadan urinib ko\'ring.';
    return new Response(
      JSON.stringify({ error: errText }),
      { status: is429 ? 429 : isAuth ? 401 : 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
