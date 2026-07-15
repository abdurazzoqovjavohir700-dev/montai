import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createServerSupabase } from '@/lib/supabase';

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabase();
  const { data, error } = await supabase
    .from('chats')
    .select('id, title, preview, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json([], { status: 200 });

  const chats = (data ?? []).map((c) => ({
    id: c.id,
    userId: user.id,
    title: c.title,
    preview: c.preview ?? '',
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

  return NextResponse.json(chats);
}
