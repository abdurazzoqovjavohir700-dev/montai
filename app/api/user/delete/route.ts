import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createServerSupabase } from '@/lib/supabase';

export async function DELETE() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = createServerSupabase();

  // Delete all user data (CASCADE handles chats/messages via FK)
  const { error } = await supabase.from('users').delete().eq('id', user.id);

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });

  return NextResponse.json({ success: true });
}
