import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createServerSupabase } from '@/lib/supabase';
import { generateChatTitle } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { chatId: string; message: string };

  try {
    const title = await generateChatTitle(body.message);

    const supabase = createServerSupabase();
    await supabase
      .from('chats')
      .update({ title })
      .eq('id', body.chatId)
      .eq('user_id', user.id);

    return NextResponse.json({ title });
  } catch {
    return NextResponse.json({ title: 'New Chat' });
  }
}
