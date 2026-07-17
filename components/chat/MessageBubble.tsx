'use client';

import { useState, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Copy, Check, ThumbsUp, ThumbsDown, Share2,
  Download, RefreshCw, Pencil, ZoomIn,
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
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
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
        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ height: 24 }}>
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
      icon: <Download size={14} strokeWidth={1.5} />,
      fn: () => {
        const b = new Blob([message.content], { type: 'text/plain' });
        const u = URL.createObjectURL(b);
        const a = document.createElement('a');
        a.href = u; a.download = 'montai-javob.txt'; a.click();
        URL.revokeObjectURL(u);
      },
      title: 'Yuklab olish',
    },
    {
      icon: <RefreshCw size={14} strokeWidth={1.5} />,
      fn: () => onRegenerate?.(message.id), title: 'Qayta generatsiya',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 w-full group"
      style={{ padding: '8px 0' }}
    >
      {/* Avatar */}
      <div style={{
        width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #F59E0B, #F97316)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 10, fontWeight: 700, color: '#0A0A0B',
        fontFamily: 'Sora, sans-serif',
        boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
        marginTop: 3,
      }}>
        M
      </div>

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
          <div
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
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
          </div>
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
