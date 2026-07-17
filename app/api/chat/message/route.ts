import { NextResponse, type NextRequest } from 'next/server';
import { getSessionUser } from '@/lib/session';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json() as {
    chatId: string;
    role: 'user' | 'assistant';
    content: string;
    imageBase64?: string;
    imageMime?: string;
  };

  if (!body.chatId || !body.role || !body.content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  // Verify chat ownership
  const { data: chat } = await supabase
    .from('chats')
    .select('id')
    .eq('id', body.chatId)
    .eq('user_id', user.id)
    .single();

  if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 });

  // Upload image if provided — strict server-side validation
  let imageUrl: string | null = null;
  if (body.imageBase64 && body.role === 'user') {
    const VALID_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const mime = (body.imageMime ?? '').toLowerCase();
    if (!VALID_MIMES.includes(mime)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }
    // Prevent DoS: base64 of 10MB = ~13.3M chars
    if (body.imageBase64.length > 13_500_000) {
      return NextResponse.json({ error: 'Image exceeds 10MB' }, { status: 413 });
    }
    const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    const buffer = Buffer.from(body.imageBase64, 'base64');
    // Double check decoded size
    if (buffer.byteLength > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image exceeds 10MB' }, { status: 413 });
    }
    const filename = `${user.id}/${body.chatId}/${Date.now()}.${ext}`;
    const { data: uploadData } = await supabase.storage
      .from('chat-images')
      .upload(filename, buffer, {
        contentType: mime,
        upsert: false,
      });
    if (uploadData) {
      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(filename);
      imageUrl = urlData.publicUrl;
    }
  }

  const { error } = await supabase.from('messages').insert({
    chat_id: body.chatId,
    role: body.role,
    content: body.content.slice(0, 50000),
    image_url: imageUrl,
  });

  if (error) return NextResponse.json({ error: 'Failed to save message' }, { status: 500 });

  // Update chat preview and timestamp
  const preview = body.role === 'user' ? body.content.slice(0, 100) : undefined;
  await supabase
    .from('chats')
    .update({
      updated_at: new Date().toISOString(),
      ...(preview ? { preview } : {}),
    })
    .eq('id', body.chatId);

  return NextResponse.json({ success: true });
}
