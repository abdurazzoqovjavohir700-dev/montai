import { type NextRequest } from 'next/server';
import { getSessionUser, checkRateLimit } from '@/lib/session';
import { streamChatResponse, type ChatMessage } from '@/lib/ai';

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

  // Limit message history to last 20 messages
  const messages = body.messages.slice(-20);

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
}
