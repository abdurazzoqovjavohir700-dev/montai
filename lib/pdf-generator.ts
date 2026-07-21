// Client-side PDF generation using jspdf
// Supports Uzbek Latin text, markdown content, tables, code blocks

interface PdfOptions {
  title?: string;
  author?: string;
  content: string;
  filename?: string;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/#{1,6}\s+/g, '')           // headings
    .replace(/\*\*(.*?)\*\*/g, '$1')     // bold
    .replace(/\*(.*?)\*/g, '$1')         // italic
    .replace(/`{3}[\s\S]*?`{3}/g, '')   // code blocks
    .replace(/`([^`]+)`/g, '$1')        // inline code
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/^[-*]\s+/gm, '• ')         // bullet lists
    .replace(/^\d+\.\s+/gm, '')          // numbered lists
    .replace(/^>\s+/gm, '')              // blockquotes
    .replace(/\|[^\n]+\|/g, '')          // tables
    .replace(/^-{3,}$/gm, '')            // hr
    .trim();
}

export async function generatePdf(options: PdfOptions): Promise<void> {
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const TITLE_COLOR: [number, number, number] = [59, 130, 246];
  const TEXT_COLOR: [number, number, number] = [30, 30, 30];
  const META_COLOR: [number, number, number] = [100, 100, 100];
  const CODE_BG: [number, number, number] = [240, 242, 247];
  const HEADING_COLORS: Record<number, [number, number, number]> = {
    1: [15, 15, 20],
    2: [35, 35, 45],
    3: [55, 55, 65],
  };

  function checkPageBreak(needed: number = 10) {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  }

  // ── Title page ────────────────────────────────────────────────────────────

  // Orange accent line at top
  doc.setFillColor(...TITLE_COLOR);
  doc.rect(margin, y, contentWidth, 1.5, 'F');
  y += 10;

  // Title
  if (options.title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...TITLE_COLOR);
    const titleLines = doc.splitTextToSize(options.title, contentWidth);
    titleLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 9;
    });
    y += 4;
  }

  // Meta line
  const author = options.author ?? 'Montai AI';
  const date = new Date().toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...META_COLOR);
  doc.text(`${author} · ${date}`, margin, y);
  y += 6;

  // Divider
  doc.setDrawColor(...META_COLOR);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ── Content rendering ─────────────────────────────────────────────────────

  const lines = options.content.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      checkPageBreak(12);

      if (level === 1) {
        y += 4;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(...HEADING_COLORS[1]);
      } else if (level === 2) {
        y += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...HEADING_COLORS[2]);
      } else {
        y += 2;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...HEADING_COLORS[3]);
      }

      const wrapped = doc.splitTextToSize(text, contentWidth);
      wrapped.forEach((wLine: string) => {
        checkPageBreak(8);
        doc.text(wLine, margin, y);
        y += (level === 1 ? 7 : level === 2 ? 6 : 5.5);
      });
      i++;
      continue;
    }

    // Code blocks
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```

      if (codeLines.length > 0) {
        const blockHeight = codeLines.length * 4.5 + 8;
        checkPageBreak(blockHeight + 4);

        doc.setFillColor(...CODE_BG);
        doc.setDrawColor(180, 180, 180);
        doc.setLineWidth(0.2);
        doc.roundedRect(margin, y, contentWidth, blockHeight, 2, 2, 'FD');

        doc.setFont('courier', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(50, 50, 50);
        y += 5;
        codeLines.forEach((codeLine) => {
          const truncated = codeLine.length > 90 ? codeLine.slice(0, 90) + '…' : codeLine;
          doc.text(truncated, margin + 4, y);
          y += 4.5;
        });
        y += 4;
      }
      continue;
    }

    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      y += 2;
      doc.setDrawColor(...META_COLOR);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('>')) {
      const text = line.replace(/^>\s*/, '');
      checkPageBreak(8);

      doc.setFillColor(245, 245, 245);
      doc.setDrawColor(...TITLE_COLOR);
      doc.setLineWidth(1.5);
      const bqLines = doc.splitTextToSize(text, contentWidth - 8);
      const bqHeight = bqLines.length * 5 + 4;

      doc.rect(margin, y - 3, 1.5, bqHeight, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      doc.setTextColor(...META_COLOR);

      bqLines.forEach((bqLine: string) => {
        doc.text(bqLine, margin + 6, y);
        y += 5;
      });
      y += 2;
      i++;
      continue;
    }

    // Bullet list
    if (/^[-*•]\s+/.test(line)) {
      const text = line.replace(/^[-*•]\s+/, '');
      checkPageBreak(6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...TEXT_COLOR);
      doc.setFillColor(...TITLE_COLOR);
      doc.circle(margin + 1.5, y - 1.5, 1, 'F');

      const wrapped = doc.splitTextToSize(text, contentWidth - 8);
      wrapped.forEach((wLine: string, wi: number) => {
        checkPageBreak(5.5);
        doc.text(wLine, margin + 6, wi === 0 ? y : y + wi * 5);
      });
      y += wrapped.length * 5 + 1;
      i++;
      continue;
    }

    // Numbered list
    const numMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      const num = numMatch[1];
      const text = numMatch[2];
      checkPageBreak(6);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(...TITLE_COLOR);
      doc.text(`${num}.`, margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...TEXT_COLOR);
      const wrapped = doc.splitTextToSize(text, contentWidth - 10);
      wrapped.forEach((wLine: string, wi: number) => {
        checkPageBreak(5.5);
        doc.text(wLine, margin + 8, wi === 0 ? y : y + wi * 5);
      });
      y += wrapped.length * 5 + 1;
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      y += 3;
      i++;
      continue;
    }

    // Regular paragraph — strip inline markdown
    const cleanText = line
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

    checkPageBreak(6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...TEXT_COLOR);
    const wrapped = doc.splitTextToSize(cleanText, contentWidth);
    wrapped.forEach((wLine: string) => {
      checkPageBreak(5.5);
      doc.text(wLine, margin, y);
      y += 5.5;
    });
    y += 1;
    i++;
  }

  // ── Page numbers ──────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...META_COLOR);
    doc.text(
      `Montai AI · ${p} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  // ── Download ──────────────────────────────────────────────────────────────
  const filename = options.filename ?? `montai_${Date.now()}.pdf`;
  doc.save(filename);
}

export function detectPdfRequest(message: string): boolean {
  const lower = message.toLowerCase();
  // Uzbek
  if (
    lower.includes('pdf yarat') ||
    lower.includes('pdf qilib ber') ||
    lower.includes('pdf tayyorla') ||
    lower.includes('hujjat tayyorla') ||
    lower.includes('pdf chiqar') ||
    lower.includes('pdf saqla') ||
    lower.includes('pdf ko\'rinish') ||
    lower.includes('pdf format') ||
    lower.includes('fayl yarat')
  ) return true;
  // English
  if (
    lower.includes('create pdf') ||
    lower.includes('make pdf') ||
    lower.includes('generate pdf') ||
    lower.includes('export pdf') ||
    lower.includes('download pdf') ||
    lower.includes('save as pdf') ||
    lower.includes('write pdf') ||
    lower.includes('build pdf') ||
    lower.includes('produce pdf') ||
    lower.includes('pdf file') ||
    lower.includes('pdf document') ||
    lower.includes('pdf saying') ||
    lower.includes('pdf named') ||
    lower.includes('pdf called') ||
    lower.includes('pdf with') ||
    lower.includes('pdf about')
  ) return true;
  // Russian
  if (
    lower.includes('создай pdf') ||
    lower.includes('сделай pdf') ||
    lower.includes('pdf документ') ||
    lower.includes('скачать pdf')
  ) return true;
  return false;
}

export function extractPdfTitle(message: string): string {
  // English: "pdf named X", "pdf called X", "pdf saying X", "create pdf: X"
  const enMatch = message.match(/pdf\s+(?:named|called|saying|titled|about|with(?:\s+title)?)[:\s]+["']?([^"'\n]+?)["']?\s*$/i);
  if (enMatch) return enMatch[1].trim().slice(0, 80);
  // Uzbek: "pdf yarat: X" or "PDF nomi: X"
  const uzMatch = message.match(/pdf\s+\w+[\s:]+(.+)/i);
  if (uzMatch) return uzMatch[1].trim().slice(0, 80);
  // Generic: content after colon
  const colonMatch = message.match(/(?:pdf|hujjat)[^:]*:\s*(.+)/i);
  if (colonMatch) return colonMatch[1].trim().slice(0, 80);
  return 'Montai Document';
}
