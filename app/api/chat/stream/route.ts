import { type NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { streamChatResponse, type ChatMessage } from '@/lib/ai';
import { moderateText, logModerationEvent } from '@/lib/moderation';

export const maxDuration = 60;

// Per-user sliding-window rate limit (in-memory; resets on cold start)
// Authenticated users: 120 requests per hour (generous, but prevents API exhaustion)
const userWindows = new Map<string, number[]>();
const USER_LIMIT = 120;
const USER_WINDOW_MS = 60 * 60 * 1000;

function checkUserLimit(userId: string): boolean {
  const now = Date.now();
  const reqs = (userWindows.get(userId) ?? []).filter(t => now - t < USER_WINDOW_MS);
  if (reqs.length >= USER_LIMIT) { userWindows.set(userId, reqs); return false; }
  reqs.push(now);
  userWindows.set(userId, reqs);
  return true;
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!checkUserLimit(user.id)) {
    return new Response(
      JSON.stringify({ error: 'So\'rov limiti tugadi. Bir soatdan keyin qaytadan urinib ko\'ring.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json() as {
    messages: ChatMessage[];
    hasImage?: boolean;
    isPdfRequest?: boolean;
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
      // 422 = unprocessable content (not retryable by client)
      return new Response(
        JSON.stringify({ error: modResult.message }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // Limit message history to last 20 messages
  const messages = body.messages.slice(-20);

  // Audit log — verify image payload is received correctly before processing
  const lastMsgForLog = messages.at(-1);
  if (lastMsgForLog && Array.isArray(lastMsgForLog.content)) {
    const imgBlocks = (lastMsgForLog.content as Array<{ type: string; source?: { data?: string; media_type?: string }; image_url?: { url?: string } }>)
      .filter(b => b.type === 'image' || b.type === 'image_url');
    if (imgBlocks.length > 0) {
      const b = imgBlocks[0];
      const dataLen = b.type === 'image'
        ? (b.source?.data?.length ?? 0)
        : (b.image_url?.url?.length ?? 0);
      const mime = b.type === 'image' ? b.source?.media_type : 'image_url';
      console.log('[API/stream] Image received —', {
        userId: user.id,
        msgCount: messages.length,
        imgBlockCount: imgBlocks.length,
        mime,
        dataLen,
        valid: dataLen > 100,
      });
    }
  }

  try {
    const stream = await streamChatResponse(
      messages,
      body.userContext ?? {
        nickname: user.nickname,
        language: user.language,
        experienceLevel: user.experienceLevel,
        primarySoftware: user.primarySoftware,
        focusAreas: user.focusAreas,
      },
      { hasImage: body.hasImage, isPdfRequest: body.isPdfRequest },
    );

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    const is429 = msg.includes('429') || msg.includes('rate limit') || msg.includes('rate_limit') || msg.includes('too many requests');
    const isAuth = msg.includes('401') || msg.includes('api key') || msg.includes('unauthorized');

    // Return 429/503 so client request-manager retries automatically
    const status = is429 ? 429 : isAuth ? 503 : 503;
    return new Response(
      JSON.stringify({ error: 'AI provider busy. Retrying automatically.' }),
      { status, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
