import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/session';

export const runtime = 'nodejs';
export const maxDuration = 30;

// pdf-parse v2 (pdfjs-dist internally) uses DOMMatrix for coordinate math.
// Vercel serverless Node.js doesn't include browser APIs — polyfill the minimum.
if (typeof globalThis.DOMMatrix === 'undefined') {
  // @ts-expect-error — minimal polyfill: only identity-transform is needed for text extraction
  globalThis.DOMMatrix = class DOMMatrix {
    a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
    m11 = 1; m12 = 0; m13 = 0; m14 = 0;
    m21 = 0; m22 = 1; m23 = 0; m24 = 0;
    m31 = 0; m32 = 0; m33 = 1; m34 = 0;
    m41 = 0; m42 = 0; m43 = 0; m44 = 1;
    is2D = true; isIdentity = true;
    getTransform() { return this; }
    inverse() { return new (globalThis.DOMMatrix as unknown as new () => typeof this)(); }
    multiply(other: unknown) { return other; }
    translate(x = 0, y = 0) { const m = new (globalThis.DOMMatrix as unknown as new () => typeof this)(); m.e = x; m.f = y; return m; }
    scale(sx = 1, sy = 1) { const m = new (globalThis.DOMMatrix as unknown as new () => typeof this)(); m.a = sx; m.d = sy; return m; }
    toString() { return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`; }
  };
}

// 65% token budget: 8 000 chars ≈ 2 000 tokens → leaves room for AI response
const PDF_CHAR_LIMIT = 8_000;
// Vercel serverless body cap ~4.5 MB; base64 adds 33% overhead → max raw 3 MB
const MAX_RAW_BYTES = 3 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

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
