import { type NextRequest } from 'next/server';
import { streamChatResponse, type ChatMessage } from '@/lib/ai';
import { moderateText } from '@/lib/moderation';

// In-memory guest sliding-window rate limit (per IP, resets on server restart)
// Allows burst, then throttles — never hard-blocks completely
const guestWindows = new Map<string, { requests: number[]; }>();
const GUEST_LIMIT = 20;   // max requests per 60-minute window
const WINDOW_MS   = 60 * 60 * 1000;

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function checkGuestLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = guestWindows.get(ip) ?? { requests: [] };
  // Sliding window: remove timestamps older than 1 hour
  entry.requests = entry.requests.filter(t => now - t < WINDOW_MS);

  if (entry.requests.length >= GUEST_LIMIT) {
    guestWindows.set(ip, entry);
    return { allowed: false, remaining: 0 };
  }

  entry.requests.push(now);
  guestWindows.set(ip, entry);
  return { allowed: true, remaining: GUEST_LIMIT - entry.requests.length };
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = checkGuestLimit(ip);

  if (!limit.allowed) {
    // Return 429 so client request-manager handles retry + shows proper UX
    return new Response(
      JSON.stringify({ error: 'guest_limit_reached' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const body = await req.json() as {
    messages: ChatMessage[];
    userContext?: { nickname?: string; language?: string };
  };

  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response(JSON.stringify({ error: 'Messages required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Moderation on last user message
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
      return new Response(
        JSON.stringify({ error: modResult.message }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  const messages = body.messages.slice(-10);

  try {
    const stream = await streamChatResponse(messages, {
      nickname: body.userContext?.nickname ?? 'Editor',
      language: body.userContext?.language ?? 'uz',
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Guest-Remaining': String(limit.remaining),
      },
    });
  } catch (err) {
    const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
    const is429 = msg.includes('429') || msg.includes('rate limit') || msg.includes('rate_limit');
    return new Response(
      JSON.stringify({ error: 'AI provider busy. Retrying automatically.' }),
      { status: is429 ? 429 : 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
