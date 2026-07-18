import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

// 65% token budget: 8 000 chars ≈ 2 000 tokens → leaves room for AI response
const PDF_CHAR_LIMIT = 8_000;
// Vercel serverless body cap ~4.5 MB; base64 adds 33% overhead → max raw 3 MB
const MAX_RAW_BYTES = 3 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { base64?: string; name?: string };
    const { base64, name } = body;

    if (!base64) {
      return NextResponse.json({ error: 'base64 maydoni kerak' }, { status: 400 });
    }

    const buffer = Buffer.from(base64, 'base64');

    if (buffer.byteLength > MAX_RAW_BYTES) {
      return NextResponse.json(
        { error: `PDF juda katta. Maksimum 3 MB ruxsat etiladi (hozirgi: ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB).` },
        { status: 413 },
      );
    }

    // Magic bytes: PDF must start with %PDF (0x25 0x50 0x44 0x46)
    if (buffer.length < 4 || buffer[0] !== 0x25 || buffer[1] !== 0x50 || buffer[2] !== 0x44 || buffer[3] !== 0x46) {
      return NextResponse.json(
        { error: "Bu haqiqiy PDF fayl emas. Faqat .pdf fayllar qabul qilinadi." },
        { status: 422 },
      );
    }

    // pdf-parse v2: PDFParse class API
    const pdfParseModule = await import('pdf-parse') as {
      PDFParse: new (opts: { data: Uint8Array }) => {
        getText(opts: { first: number }): Promise<{ text?: string; total?: number; pages?: Array<unknown> }>;
      };
    };
    const parser = new pdfParseModule.PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText({ first: 25 });
    const rawText = (result.text ?? '').trim();
    const totalPages = result.total ?? result.pages?.length ?? 0;

    if (!rawText) {
      return NextResponse.json(
        { error: "PDF matnini o'qib bo'lmadi. Bu skanerlangan (rasm-asosidagi) PDF bo'lishi mumkin — OCR kerak bo'ladi." },
        { status: 422 },
      );
    }

    const truncated = rawText.length > PDF_CHAR_LIMIT;
    const text = truncated ? rawText.slice(0, PDF_CHAR_LIMIT) : rawText;

    return NextResponse.json({
      text,
      pages: totalPages,
      truncated,
      name: name ?? 'document.pdf',
    });
  } catch (err) {
    console.error('[parse-pdf]', err);
    const msg = err instanceof Error ? err.message : 'Noma\'lum xatolik';
    return NextResponse.json(
      { error: `PDF tahlil qilishda xatolik: ${msg}` },
      { status: 500 },
    );
  }
}
