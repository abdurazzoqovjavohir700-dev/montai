import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createServerSupabase } from '@/lib/supabase';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabase();

  const { data: chats } = await supabase
    .from('chats')
    .select('id, title, preview, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const chatIds = (chats ?? []).map((c) => c.id);
  let messages: unknown[] = [];

  if (chatIds.length > 0) {
    const { data: msgs } = await supabase
      .from('messages')
      .select('chat_id, role, content, created_at')
      .in('chat_id', chatIds)
      .order('created_at', { ascending: true });
    messages = msgs ?? [];
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    user: {
      email: user.email,
      nickname: user.nickname,
      language: user.language,
      experienceLevel: user.experienceLevel,
      primarySoftware: user.primarySoftware,
      focusAreas: user.focusAreas,
      joinedAt: user.createdAt,
    },
    chats: (chats ?? []).map((chat) => ({
      ...chat,
      messages: messages.filter((m) => (m as { chat_id: string }).chat_id === chat.id),
    })),
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="montai-export-${new Date().toISOString().split('T')[0]}.json"`,
    },
  });
}
