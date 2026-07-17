import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { base64, name } = await req.json() as { base64?: string; name?: string };
    if (!base64) return NextResponse.json({ error: 'Base64 kerak' }, { status: 400 });

    const buffer = Buffer.from(base64, 'base64');

    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText({ first: 50 });

    const text = (result.text ?? '').trim();
    const pages = result.pages?.length ?? 0;

    if (!text) {
      return NextResponse.json(
        { error: 'PDF matnini o\'qib bo\'lmadi. Skanerlangan yoki rasm-asosidagi PDF bo\'lishi mumkin.' },
        { status: 422 },
      );
    }

    return NextResponse.json({ text, pages, name: name ?? 'document.pdf' });
  } catch (err) {
    console.error('[parse-pdf]', err);
    return NextResponse.json(
      { error: 'PDF tahlil qilishda xatolik yuz berdi.' },
      { status: 500 },
    );
  }
}
