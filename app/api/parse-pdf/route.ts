import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';
export const maxDuration = 30;

// 65% of usable context budget: ~8 000 chars ≈ 2 000 tokens
// Leaves 35% for conversation history + AI response
const PDF_CHAR_LIMIT = 8_000;

export async function POST(req: NextRequest) {
  try {
    const { base64, name } = await req.json() as { base64?: string; name?: string };
    if (!base64) return NextResponse.json({ error: 'Base64 kerak' }, { status: 400 });

    const buffer = Buffer.from(base64, 'base64');

    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText({ first: 30 });

    let text = (result.text ?? '').trim();
    const totalPages: number = (result as { total?: number }).total ?? result.pages?.length ?? 0;
    const truncated = text.length > PDF_CHAR_LIMIT;
    if (truncated) text = text.slice(0, PDF_CHAR_LIMIT);

    if (!text) {
      return NextResponse.json(
        { error: 'PDF matnini o\'qib bo\'lmadi. Skanerlangan yoki rasm-asosidagi PDF bo\'lishi mumkin.' },
        { status: 422 },
      );
    }

    return NextResponse.json({
      text,
      pages: totalPages,
      truncated,
      name: name ?? 'document.pdf',
    });
  } catch (err) {
    console.error('[parse-pdf]', err);
    return NextResponse.json(
      { error: 'PDF tahlil qilishda xatolik yuz berdi.' },
      { status: 500 },
    );
  }
}
