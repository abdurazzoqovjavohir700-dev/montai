import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as { action?: string; title?: string };

  if (body.action === 'create') {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('chats')
      .insert({
        user_id: user.id,
        title: (body.title ?? 'New Chat').slice(0, 100),
        preview: '',
      })
      .select('id')
      .single();

    if (error) return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 });
    return NextResponse.json({ chatId: data.id });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
