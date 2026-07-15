import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createServerSupabase } from '@/lib/supabase';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = createServerSupabase();

  // Verify ownership
  const { data: chat } = await supabase
    .from('chats')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: messages } = await supabase
    .from('messages')
    .select('id, chat_id, role, content, image_url, created_at')
    .eq('chat_id', id)
    .order('created_at', { ascending: true });

  const formatted = (messages ?? []).map((m) => ({
    id: m.id,
    chatId: m.chat_id,
    role: m.role,
    content: m.content,
    imageUrl: m.image_url,
    createdAt: m.created_at,
  }));

  return NextResponse.json({ messages: formatted });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json() as { title?: string };

  if (!body.title) return NextResponse.json({ error: 'Title required' }, { status: 400 });

  const supabase = createServerSupabase();
  const { error } = await supabase
    .from('chats')
    .update({ title: body.title.slice(0, 100), updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const supabase = createServerSupabase();

  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  return NextResponse.json({ success: true });
}
