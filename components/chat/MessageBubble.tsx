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
  const hasText  = !!message.content.trim();

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

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
      className="flex justify-end w-full group"
      style={{ padding: '6px 0' }}
    >
      <div style={{ maxWidth: 'var(--msg-bubble-max, 78%)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>

        {/* Unified bubble */}
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
              gridTemplateColumns: imageUrls.length === 1 ? '1fr' : imageUrls.length === 2 ? '1fr 1fr' : '1fr 1fr',
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

          {/* Text content */}
          {hasText && (
            <div
              onClick={!hasImage ? startEdit : undefined}
              style={{
                padding: hasImage ? '10px 14px' : '12px 16px',
                fontSize: 15, lineHeight: 1.65,
                letterSpacing: '-0.005em',
                color: '#F4F4F5',
                wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                cursor: hasImage ? 'default' : 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
              title={!hasImage ? 'Tahrirlash uchun bosing' : undefined}
            >
              {message.content}
            </div>
          )}
        </div>

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
function exportAsPdf(content: string, createdAt: string) {
  const date = new Date(createdAt).toLocaleDateString('uz-UZ', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // Convert basic markdown to HTML for print view
  const html = content
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^```[\w]*\n([\s\S]*?)```$/gm, '<pre><code>$1</code></pre>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');

  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html lang="uz">
<head>
<meta charset="UTF-8">
<title>Montai — AI Javobi</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', serif; font-size: 14px; line-height: 1.8;
         color: #1a1a1a; background: #fff; padding: 48px 64px; max-width: 800px; margin: 0 auto; }
  h1 { font-size: 22px; margin: 24px 0 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
  h2 { font-size: 18px; margin: 20px 0 10px; color: #374151; }
  h3 { font-size: 15px; margin: 16px 0 8px; color: #4b5563; }
  p { margin: 12px 0; }
  ul { margin: 10px 0 10px 24px; }
  li { margin: 4px 0; }
  code { background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
  pre { background: #1f2937; color: #e5e7eb; padding: 16px; border-radius: 8px;
        font-family: monospace; font-size: 12px; overflow-x: auto; margin: 12px 0; white-space: pre-wrap; }
  pre code { background: none; padding: 0; color: inherit; font-size: inherit; }
  strong { font-weight: 700; }
  em { font-style: italic; color: #4b5563; }
  .header { border-bottom: 3px solid #f59e0b; padding-bottom: 16px; margin-bottom: 28px; }
  .logo { font-size: 20px; font-weight: 800; color: #f59e0b; letter-spacing: -0.5px; }
  .meta { font-size: 12px; color: #9ca3af; margin-top: 6px; }
  .content { line-height: 1.9; }
  @media print {
    body { padding: 20px 32px; }
    @page { margin: 20mm; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="logo">Montai AI</div>
  <div class="meta">Yaratilgan: ${date}</div>
</div>
<div class="content"><p>${html}</p></div>
<script>window.onload = function() { window.print(); }</script>
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
