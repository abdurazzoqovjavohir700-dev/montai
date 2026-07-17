import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createServerSupabase } from '@/lib/supabase';

// Returns user + chat list in a single request to avoid double getServerSession() calls
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabase();
  const { data } = await supabase
    .from('chats')
    .select('id, title, preview, created_at, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })
    .limit(100);

  const chats = (data ?? []).map((c) => ({
    id: c.id,
    userId: user.id,
    title: c.title,
    preview: c.preview ?? '',
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  }));

  return NextResponse.json(
    { user, chats },
    {
      headers: {
        // Allow client to use stale data for 5s while revalidating in background
        'Cache-Control': 'private, max-age=0, stale-while-revalidate=5',
      },
    },
  );
}
