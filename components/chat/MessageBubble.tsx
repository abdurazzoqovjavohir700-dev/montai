'use client';

import { useState, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import {
  Copy, Check, ThumbsUp, ThumbsDown, Share2,
  Download, RefreshCw, MoreHorizontal, Pencil,
} from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { formatTimestamp } from '@/lib/utils';
import type { Message } from '@/lib/types';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
  onEditResend?: (id: string, newContent: string) => void;
}

function MessageBubble({ message, onEditResend }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<'up' | 'down' | null>(null);
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startEdit = () => {
    setEditValue(message.content);
    setEditing(true);
    setTimeout(() => {
      textareaRef.current?.focus();
      const len = textareaRef.current?.value.length ?? 0;
      textareaRef.current?.setSelectionRange(len, len);
    }, 50);
  };

  const saveEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content) {
      onEditResend?.(message.id, trimmed);
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditValue(message.content);
    setEditing(false);
  };

  /* ── USER MESSAGE ── */
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-end w-full group"
        style={{ padding: '12px 0' }}
      >
        <div className="flex flex-col items-end gap-1.5" style={{ maxWidth: '75%' }}>
          {message.imageUrl && (
            <div className="rounded-xl overflow-hidden mb-1">
              <Image
                src={message.imageUrl}
                alt="Attached"
                width={300}
                height={200}
                className="max-w-[260px] max-h-[200px] object-contain"
              />
            </div>
          )}

          {editing ? (
            /* ── EDIT BOX ── */
            <div style={{
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '18px 18px 4px 18px',
              padding: '14px 16px',
              width: '100%',
              maxWidth: '600px',
              marginLeft: 'auto',
            }}>
              <textarea
                ref={textareaRef}
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
                  if (e.key === 'Escape') cancelEdit();
                }}
                rows={3}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FAFAFA',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  resize: 'none',
                  minHeight: '60px',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={cancelEdit}
                  style={{
                    background: 'transparent',
                    color: '#71717A',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '10px',
                    padding: '7px 16px',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.06)'); (e.currentTarget.style.color = '#A1A1AA'); }}
                  onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = '#71717A'); }}
                >
                  Bekor
                </button>
                <button
                  onClick={saveEdit}
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                    color: '#0A0A0B',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '7px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif',
                    transition: 'opacity 0.15s',
                    boxShadow: '0 2px 12px rgba(245,158,11,0.3)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Saqlash
                </button>
              </div>
            </div>
          ) : (
            /* ── BUBBLE ── */
            <div
              onClick={startEdit}
              style={{
                background: 'rgba(255,255,255,0.09)',
                color: '#F4F4F5',
                borderRadius: '18px 18px 4px 18px',
                padding: '13px 18px',
                fontSize: '15px',
                lineHeight: '1.65',
                letterSpacing: '-0.005em',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
              title="Tahrirlash uchun bosing"
            >
              {message.content}
            </div>
          )}

          {/* Hover actions */}
          {!editing && (
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <span className="text-[11px]" style={{ color: '#52525B' }}>
                {formatTimestamp(message.createdAt)}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md transition-colors"
                style={{ color: copied ? '#F59E0B' : '#52525B', background: 'transparent', border: 'none', cursor: 'pointer' }}
                title="Nusxalash"
              >
                {copied ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}
              </button>
              <button
                onClick={startEdit}
                className="p-1 rounded-md transition-colors"
                style={{ color: '#52525B', background: 'transparent', border: 'none', cursor: 'pointer' }}
                title="Tahrirlash"
              >
                <Pencil size={12} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  /* ── AI MESSAGE ── */
  const actionBtns = [
    { icon: copied ? <Check size={14} strokeWidth={1.5} /> : <Copy size={14} strokeWidth={1.5} />, action: handleCopy, title: 'Nusxalash', active: copied },
    { icon: <ThumbsUp size={14} strokeWidth={1.5} />, action: () => setLiked(l => l === 'up' ? null : 'up'), title: 'Yaxshi', active: liked === 'up' },
    { icon: <ThumbsDown size={14} strokeWidth={1.5} />, action: () => setLiked(l => l === 'down' ? null : 'down'), title: 'Yomon', active: liked === 'down' },
    { icon: <Share2 size={14} strokeWidth={1.5} />, action: () => navigator.share?.({ text: message.content }).catch(() => {}), title: 'Ulashish', active: false },
    { icon: <Download size={14} strokeWidth={1.5} />, action: () => { const b = new Blob([message.content], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'montai.txt'; a.click(); URL.revokeObjectURL(u); }, title: 'Yuklab olish', active: false },
    { icon: <RefreshCw size={14} strokeWidth={1.5} />, action: () => {}, title: 'Qayta', active: false },
    { icon: <MoreHorizontal size={14} strokeWidth={1.5} />, action: () => {}, title: 'Ko\'proq', active: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 w-full group"
      style={{ padding: '12px 0' }}
    >
      {/* Montai logo avatar */}
      <div
        className="flex items-center justify-center flex-shrink-0 font-bold mt-0.5"
        style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'linear-gradient(135deg, #F59E0B, #F97316)',
          color: '#0A0A0B',
          fontSize: 10, fontFamily: 'Sora, sans-serif',
          boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
        }}
      >
        M
      </div>

      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div style={{
          color: '#E4E4E7', fontSize: '15.5px', lineHeight: '1.85',
          letterSpacing: '-0.01em',
          fontFamily: "'Inter', sans-serif",
        }}>
          <MarkdownRenderer content={message.content} />
        </div>

        {/* Action buttons — hover da ko'rinadi */}
        {message.id !== 'streaming' && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
            {actionBtns.map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                title={btn.title}
                className="flex items-center justify-center rounded-md transition-all duration-150"
                style={{
                  width: '28px',
                  height: '28px',
                  color: btn.active ? '#F59E0B' : '#52525B',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                  (e.currentTarget as HTMLElement).style.color = btn.active ? '#F59E0B' : '#A1A1AA';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = btn.active ? '#F59E0B' : '#52525B';
                }}
              >
                {btn.icon}
              </button>
            ))}
            <span className="ml-1 text-[11px]" style={{ color: '#52525B' }}>
              {formatTimestamp(message.createdAt)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default memo(MessageBubble);
