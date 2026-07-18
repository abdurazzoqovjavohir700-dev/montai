import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

// 65% token budget: 8 000 chars ≈ 2 000 tokens → leaves room for response
const PDF_CHAR_LIMIT = 8_000;
// Vercel/Netlify serverless body cap ~4.5 MB → base64 overhead 133% → max raw 3 MB
const MAX_RAW_BYTES = 3 * 1024 * 1024;

async function parsePdf(buffer: Buffer): Promise<{ text: string; totalPages: number }> {
  // Try pdf-parse v2 first (best quality)
  try {
    const { PDFParse } = await import('pdf-parse') as { PDFParse: new (opts: object) => { getText(opts: object): Promise<{ text?: string; total?: number; pages?: { length: number } }> } };
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText({ first: 25 });
    const text = (result.text ?? '').trim();
    const totalPages = (result as { total?: number }).total ?? result.pages?.length ?? 0;
    if (text) return { text, totalPages };
  } catch {
    // fall through to pdfjs
  }

  // Fallback: pdfjs-dist directly (more compatible with serverless)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js') as {
      getDocument(src: { data: Uint8Array; useWorkerFetch: boolean; isEvalSupported: boolean; useSystemFonts: boolean }): { promise: Promise<{
        numPages: number;
        getPage(n: number): Promise<{ getTextContent(): Promise<{ items: Array<{ str?: string }> }> }>;
      }> };
    };
    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;
    const totalPages = doc.numPages;
    const pagesToRead = Math.min(totalPages, 25);
    const parts: string[] = [];
    for (let i = 1; i <= pagesToRead; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str ?? '').join(' ');
      parts.push(pageText);
    }
    return { text: parts.join('\n\n').trim(), totalPages };
  } catch {
    // fall through
  }

  return { text: '', totalPages: 0 };
}

export async function POST(req: NextRequest) {
  try {
    const { base64, name } = await req.json() as { base64?: string; name?: string };
    if (!base64) return NextResponse.json({ error: 'base64 kerak' }, { status: 400 });

    const buffer = Buffer.from(base64, 'base64');

    if (buffer.byteLength > MAX_RAW_BYTES) {
      return NextResponse.json(
        { error: `PDF hajmi juda katta. Maksimum 3 MB ruxsat etiladi (hozirgi: ${(buffer.byteLength / 1024 / 1024).toFixed(1)} MB).` },
        { status: 413 },
      );
    }

    const { text: rawText, totalPages } = await parsePdf(buffer);

    if (!rawText) {
      return NextResponse.json(
        { error: 'PDF matnini o\'qib bo\'lmadi. Bu skanerlangan (rasm-asosidagi) PDF bo\'lishi mumkin.' },
        { status: 422 },
      );
    }

    const truncated = rawText.length > PDF_CHAR_LIMIT;
    const text = truncated ? rawText.slice(0, PDF_CHAR_LIMIT) : rawText;

    return NextResponse.json({ text, pages: totalPages, truncated, name: name ?? 'document.pdf' });
  } catch (err) {
    console.error('[parse-pdf]', err);
    return NextResponse.json({ error: 'PDF tahlil qilishda xatolik yuz berdi.' }, { status: 500 });
  }
}
