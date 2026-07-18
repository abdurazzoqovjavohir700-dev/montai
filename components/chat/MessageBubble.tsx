'use client';

import { useState, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Copy, Check, ThumbsUp, ThumbsDown, Share2,
  Download, RefreshCw, Pencil, ZoomIn, FileText,
} from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import ImageLightbox from '@/components/chat/ImageLightbox';
import { formatTimestamp } from '@/lib/utils';
import type { Message } from '@/lib/types';

/* ─── PDF message parser ─────────────────────────────────── */
// Messages with PDF look like:
// "📄 PDF hujjat: **name.pdf** (N sahifa)\n\n<pdf text>\n\n---\n\nuser question"
// We extract the PDF meta and user text, hide the raw extracted text
interface PdfParsed { name: string; pages: string; truncated: boolean; userText: string }
function parsePdfMessage(content: string): PdfParsed | null {
  if (!content.startsWith('📄 PDF hujjat:')) return null;
  const sepIdx = content.indexOf('\n\n---\n\n');
  const header = content.slice(0, content.indexOf('\n\n'));
  const userText = sepIdx > -1 ? content.slice(sepIdx + 7).trim() : '';
  const match = header.match(/\*\*(.+?)\*\*\s*\((\d+)\s*sahifa(,\s*matn qisqartirildi)?/);
  if (!match) return null;
  return { name: match[1], pages: match[2], truncated: !!match[3], userText };
}

interface Props {
  message: Message;
  onEditResend?: (id: string, newContent: string) => void;
  onRegenerate?: (id: string) => void;
}

/* ─── Shared icon button ─────────────────────────────────── */
function IconBtn({
  onClick, title, active, children,
}: {
  onClick?: () => void;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 28, height: 28, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'transparent', border: 'none',
        color: active ? '#F59E0B' : '#52525B',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        (e.currentTarget.style.background = 'rgba(255,255,255,0.06)');
        (e.currentTarget.style.color = active ? '#F59E0B' : '#A1A1AA');
      }}
      onMouseLeave={e => {
        (e.currentTarget.style.background = 'transparent');
        (e.currentTarget.style.color = active ? '#F59E0B' : '#52525B');
      }}
    >
      {children}
    </button>
  );
}

/* ─── USER MESSAGE ───────────────────────────────────────── */
function UserBubble({ message, onEditResend }: Props) {
  const [lightbox, setLightbox]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [editVal, setEditVal]     = useState(message.content);
  const [copied, setCopied]       = useState(false);
  const textareaRef               = useRef<HTMLTextAreaElement>(null);

  const startEdit = () => {
    setEditVal(message.content);
    setEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      const l = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.setSelectionRange(l, l);
    }, 40);
  };

  const saveEdit = () => {
    const v = editVal.trim();
    if (v && v !== message.content) onEditResend?.(message.id, v);
    setEditing(false);
  };

  const cancelEdit = () => { setEditVal(message.content); setEditing(false); };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const imageUrls = message.imageUrls ?? (message.imageUrl ? [message.imageUrl] : []);
  const hasImage = imageUrls.length > 0;
  const pdfParsed = !hasImage ? parsePdfMessage(message.content) : null;
  const displayContent = pdfParsed ? pdfParsed.userText : message.content;
  const hasText  = !!displayContent.trim();

  /* ── Edit mode ─── */
  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="flex justify-end w-full"
        style={{ padding: '6px 0' }}
      >
        <div style={{
          maxWidth: '78%', width: '100%',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: 16, padding: '14px 16px',
        }}>
          <textarea
            ref={textareaRef}
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
              if (e.key === 'Escape') cancelEdit();
            }}
            rows={3}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: '#FAFAFA', fontSize: 15, lineHeight: 1.6,
              resize: 'none', minHeight: 60, fontFamily: 'Inter, sans-serif',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button
              onClick={cancelEdit}
              style={{
                padding: '7px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: '#71717A', fontSize: 13, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.06)'); (e.currentTarget.style.color = '#A1A1AA'); }}
              onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = '#71717A'); }}
            >
              Bekor
            </button>
            <button
              onClick={saveEdit}
              style={{
                padding: '7px 16px', borderRadius: 9, border: 'none',
                background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                color: '#0A0A0B', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                boxShadow: '0 2px 12px rgba(245,158,11,0.3)',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Saqlash
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Display mode ─── */
  const bubbleRadius = hasImage && !hasText ? '16px' : '18px 18px 4px 18px';
  // If only PDF (no typed text, no images) don't render empty bubble
  const showBubble = hasImage || hasText;

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
      className="flex justify-end w-full group"
      style={{ padding: '6px 0' }}
    >
      <div style={{ maxWidth: 'var(--msg-bubble-max, 78%)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>

        {/* PDF attachment card — shown separately above the bubble */}
        {pdfParsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 14px',
            background: 'rgba(245,158,11,0.07)',
            border: '1px solid rgba(245,158,11,0.22)',
            borderRadius: 12, marginBottom: hasText ? 6 : 0,
            maxWidth: 260,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: 'rgba(245,158,11,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <FileText size={17} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize: 12.5, fontWeight: 600, color: '#F59E0B',
                fontFamily: 'Inter, sans-serif',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 170,
              }}>
                {pdfParsed.name}
              </div>
              <div style={{ fontSize: 11, color: '#71717A', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                PDF · {pdfParsed.pages} sahifa{pdfParsed.truncated ? ' · qisqartirildi' : ''}
              </div>
            </div>
          </div>
        )}

        {/* Unified bubble — hidden when only PDF (no typed text, no images) */}
        {showBubble && (
          <div className="message-user-bubble" style={{
            background: 'rgba(255,255,255,0.09)',
            borderRadius: bubbleRadius,
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
          }}>
            {/* Images — grid layout */}
            {hasImage && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: imageUrls.length === 1 ? '1fr' : '1fr 1fr',
                gap: 2,
                background: 'rgba(0,0,0,0.2)',
              }}>
                {imageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setLightbox(true)}
                    style={{ position: 'relative', cursor: 'pointer' }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt={`Rasm ${idx + 1}`}
                      style={{
                        display: 'block', width: '100%',
                        maxWidth: imageUrls.length === 1 ? '320px' : '160px',
                        maxHeight: imageUrls.length === 1 ? '260px' : '160px',
                        height: 'auto', objectFit: 'cover',
                      }}
                    />
                    {idx === imageUrls.length - 1 && imageUrls.length > 1 && (
                      <div style={{
                        position: 'absolute', top: 6, right: 6,
                        fontSize: 10, fontWeight: 600, color: '#fff',
                        background: 'rgba(0,0,0,0.55)', borderRadius: 6,
                        padding: '2px 6px', fontFamily: 'Inter, sans-serif',
                      }}>
                        {imageUrls.length} rasm
                      </div>
                    )}
                    <div
                      className="image-zoom-overlay"
                      style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'rgba(0,0,0,0)', transition: 'background 0.18s',
                      }}
                    >
                      <div className="image-zoom-icon" style={{
                        width: 30, height: 30, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'rgba(255,255,255,0)', background: 'rgba(0,0,0,0)',
                        transition: 'all 0.18s',
                      }}>
                        <ZoomIn size={16} strokeWidth={1.5} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Text content — PDF messages show only user question */}
            {hasText && (
              <div
                onClick={(!hasImage && !pdfParsed) ? startEdit : undefined}
                style={{
                  padding: hasImage ? '10px 14px' : '12px 16px',
                  fontSize: 15, lineHeight: 1.65,
                  letterSpacing: '-0.005em',
                  color: '#F4F4F5',
                  wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                  cursor: (!hasImage && !pdfParsed) ? 'pointer' : 'default',
                  fontFamily: 'Inter, sans-serif',
                }}
                title={(!hasImage && !pdfParsed) ? 'Tahrirlash uchun bosing' : undefined}
              >
                {displayContent}
              </div>
            )}
          </div>
        )}

        {/* Metadata row */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" style={{ height: 24 }}>
          <span style={{ fontSize: 11, color: '#52525B', fontFamily: 'Inter, sans-serif', lineHeight: 1 }}>
            {formatTimestamp(message.createdAt)}
          </span>
          <IconBtn onClick={handleCopy} title="Nusxalash" active={copied}>
            {copied ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}
          </IconBtn>
          <IconBtn onClick={startEdit} title="Tahrirlash">
            <Pencil size={12} strokeWidth={1.5} />
          </IconBtn>
        </div>
      </div>

      {/* Lightbox — shows first image */}
      {hasImage && (
        <ImageLightbox
          src={imageUrls[0]}
          isOpen={lightbox}
          onClose={() => setLightbox(false)}
        />
      )}
    </motion.div>
  );
}

/* ─── PDF export helper ──────────────────────────────────── */
function mdToHtml(md: string): string {
  // Code blocks first (multi-line), before inline transforms
  let html = md.replace(/```([\w]*)\n([\s\S]*?)```/gm, (_, lang, code) => {
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return `<pre class="code-block"${lang ? ` data-lang="${lang}"` : ''}><code>${escaped}</code></pre>`;
  });

  // Headings
  html = html
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Inline formatting
  html = html
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^\d+\. /, '')}</li>`).join('');
    return `<ol>${items}</ol>`;
  });

  // Unordered lists
  html = html.replace(/((?:^[-*] .+\n?)+)/gm, (block) => {
    const items = block.trim().split('\n').map(l => `<li>${l.replace(/^[-*] /, '')}</li>`).join('');
    return `<ul>${items}</ul>`;
  });

  // Horizontal rule
  html = html.replace(/^---+$/gm, '<hr>');

  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>');

  return html;
}

function exportAsPdf(content: string, createdAt: string, extraImages?: string[]) {
  const date = new Date(createdAt).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const bodyHtml = mdToHtml(content);

  // Inline images (data URLs) the user appended
  const imgSection = extraImages && extraImages.length > 0
    ? extraImages.map(src => `<figure class="export-img"><img src="${src}" alt="Rasm"></figure>`).join('')
    : '';

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<title>Montai AI — Javob</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  body {
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    font-size: 14px; line-height: 1.85; color: #111827;
    background: #fff; padding: 52px 72px; max-width: 820px; margin: 0 auto;
  }
  .header {
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2px solid #F59E0B; padding-bottom: 18px; margin-bottom: 32px;
  }
  .logo { font-size: 22px; font-weight: 800; color: #F59E0B; letter-spacing: -0.5px; }
  .meta { font-size: 12px; color: #9CA3AF; text-align: right; }
  h1 { font-size: 22px; font-weight: 700; margin: 28px 0 12px; color: #111827;
       border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; }
  h2 { font-size: 18px; font-weight: 600; margin: 22px 0 10px; color: #1F2937; }
  h3 { font-size: 15px; font-weight: 600; margin: 18px 0 8px; color: #374151; }
  p { margin: 10px 0; }
  ul, ol { margin: 10px 0 10px 26px; }
  li { margin: 4px 0; }
  code {
    background: #F3F4F6; padding: 2px 7px; border-radius: 5px;
    font-family: 'Courier New', monospace; font-size: 12.5px; color: #DC2626;
  }
  .code-block {
    background: #1E293B; color: #E2E8F0; padding: 18px 20px; border-radius: 10px;
    font-family: 'Courier New', monospace; font-size: 12px;
    overflow-x: auto; margin: 14px 0; white-space: pre-wrap; line-height: 1.7;
    border-left: 3px solid #F59E0B;
  }
  .code-block code { background: none; padding: 0; color: inherit; font-size: inherit; }
  .code-block::before {
    content: attr(data-lang); display: block; color: #94A3B8;
    font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em;
    margin-bottom: 10px; font-family: 'Inter', sans-serif;
  }
  strong { font-weight: 700; }
  em { font-style: italic; color: #4B5563; }
  hr { border: none; border-top: 1px solid #E5E7EB; margin: 20px 0; }
  .export-img { margin: 18px 0; text-align: center; }
  .export-img img { max-width: 100%; border-radius: 10px; box-shadow: 0 2px 16px rgba(0,0,0,0.1); }
  .footer { margin-top: 44px; padding-top: 16px; border-top: 1px solid #E5E7EB;
            font-size: 11px; color: #9CA3AF; text-align: center; }
  @media print {
    body { padding: 18px 28px; }
    @page { margin: 18mm 20mm; size: A4; }
    .code-block { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="logo">Montai AI</div>
  <div class="meta">Yaratilgan: ${date}<br>montai-plum.vercel.app</div>
</div>
<div class="content"><p>${bodyHtml}</p></div>
${imgSection}
<div class="footer">Bu hujjat Montai AI tomonidan yaratildi · montai-plum.vercel.app</div>
<script>
  window.onload = function() {
    document.querySelectorAll('.code-block').forEach(el => {
      if (!el.getAttribute('data-lang')) el.style.paddingTop = '12px';
    });
    setTimeout(() => window.print(), 400);
  };
</script>
</body>
</html>`);
  win.document.close();
}

/* ─── AI MESSAGE ─────────────────────────────────────────── */
function AIBubble({ message, onRegenerate }: Props) {
  const [copied, setCopied] = useState(false);
  const [liked,  setLiked]  = useState<'up' | 'down' | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const actionBtns: { icon: React.ReactNode; fn: () => void; title: string; active?: boolean }[] = [
    {
      icon: copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />,
      fn: handleCopy, title: 'Nusxalash', active: copied,
    },
    {
      icon: <ThumbsUp size={14} strokeWidth={1.5} />,
      fn: () => setLiked(l => l === 'up' ? null : 'up'), title: 'Yaxshi', active: liked === 'up',
    },
    {
      icon: <ThumbsDown size={14} strokeWidth={1.5} />,
      fn: () => setLiked(l => l === 'down' ? null : 'down'), title: 'Yomon', active: liked === 'down',
    },
    {
      icon: <Share2 size={14} strokeWidth={1.5} />,
      fn: () => navigator.share?.({ text: message.content }).catch(() => {}), title: 'Ulashish',
    },
    {
      icon: <FileText size={14} strokeWidth={1.5} />,
      fn: () => exportAsPdf(message.content, message.createdAt),
      title: 'PDF sifatida saqlash',
    },
    {
      icon: <Download size={14} strokeWidth={1.5} />,
      fn: () => {
        const b = new Blob([message.content], { type: 'text/plain' });
        const u = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = u; a.download = 'montai-javob.txt'; a.click();
        URL.revokeObjectURL(u);
      },
      title: 'TXT yuklab olish',
    },
    {
      icon: <RefreshCw size={14} strokeWidth={1.5} />,
      fn: () => onRegenerate?.(message.id), title: 'Qayta generatsiya',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 340, damping: 26, mass: 0.85 }}
      className="flex items-start gap-3 w-full group"
      style={{ padding: '8px 0' }}
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 22, delay: 0.06 }}
        style={{
          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
          background: 'linear-gradient(135deg, #F59E0B, #F97316)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#0A0A0B',
          fontFamily: 'Sora, sans-serif',
          boxShadow: '0 2px 12px rgba(245,158,11,0.3)',
          marginTop: 2,
        }}
      >
        M
      </motion.div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Content */}
        <div className="message-ai-text" style={{
          color: '#E4E4E7', fontSize: '15.5px', lineHeight: '1.85',
          letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif',
        }}>
          <MarkdownRenderer content={message.content} />
        </div>

        {/* Action bar */}
        {message.id !== 'streaming' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.2 }}
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{ height: 28 }}
          >
            {actionBtns.map((btn, i) => (
              <IconBtn key={i} onClick={btn.fn} title={btn.title} active={btn.active}>
                {btn.icon}
              </IconBtn>
            ))}
            <span style={{
              marginLeft: 6, fontSize: 11, color: '#52525B',
              fontFamily: 'Inter, sans-serif', lineHeight: 1,
            }}>
              {formatTimestamp(message.createdAt)}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Export (memo-wrapped) ──────────────────────────────── */
function MessageBubble(props: Props) {
  if (props.message.role === 'user') return <UserBubble {...props} />;
  return <AIBubble {...props} />;
}

export default memo(MessageBubble);
