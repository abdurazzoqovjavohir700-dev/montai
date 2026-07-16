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
        style={{ padding: '4px 0' }}
      >
        <div className="flex flex-col items-end gap-1" style={{ maxWidth: '70%' }}>
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
              background: '#2F2F2F',
              borderRadius: '16px',
              padding: '16px',
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
                  lineHeight: '1.5',
                  resize: 'none',
                  minHeight: '60px',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={cancelEdit}
                  style={{
                    background: '#3F3F46',
                    color: '#E4E4E7',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#52525B')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#3F3F46')}
                >
                  Bekor
                </button>
                <button
                  onClick={saveEdit}
                  style={{
                    background: '#FAFAFA',
                    color: '#0A0A0B',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#D4D4D8')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#FAFAFA')}
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
                background: '#2F2F2F',
                color: '#FAFAFA',
                borderRadius: '20px',
                padding: '12px 18px',
                fontSize: '16px',
                lineHeight: '1.6',
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                cursor: 'pointer',
              }}
              title="Tahrirlash uchun bosing"
            >
              {message.content}
            </div>
          )}

          {/* Hover actions */}
          {!editing && (
            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                {formatTimestamp(message.createdAt)}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 rounded-md transition-colors"
                style={{ color: copied ? 'var(--accent-primary)' : 'var(--text-tertiary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                title="Nusxalash"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
              </button>
              <button
                onClick={startEdit}
                className="p-1 rounded-md transition-colors"
                style={{ color: 'var(--text-tertiary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
                title="Tahrirlash"
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  /* ── AI MESSAGE ── */
  const actionBtns = [
    { icon: copied ? <Check size={16} /> : <Copy size={16} />, action: handleCopy, title: 'Nusxalash', active: copied },
    { icon: <ThumbsUp size={16} />, action: () => setLiked(l => l === 'up' ? null : 'up'), title: 'Yaxshi', active: liked === 'up' },
    { icon: <ThumbsDown size={16} />, action: () => setLiked(l => l === 'down' ? null : 'down'), title: 'Yomon', active: liked === 'down' },
    { icon: <Share2 size={16} />, action: () => navigator.share?.({ text: message.content }).catch(() => {}), title: 'Ulashish', active: false },
    { icon: <Download size={16} />, action: () => { const b = new Blob([message.content], { type: 'text/plain' }); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = 'montai.txt'; a.click(); URL.revokeObjectURL(u); }, title: 'Yuklab olish', active: false },
    { icon: <RefreshCw size={16} />, action: () => {}, title: 'Qayta', active: false },
    { icon: <MoreHorizontal size={16} />, action: () => {}, title: 'Ko\'proq', active: false },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className="flex items-start gap-3 w-full group"
      style={{ padding: '4px 0', maxWidth: '85%' }}
    >
      <div
        className="flex items-center justify-center flex-shrink-0 font-bold mt-1"
        style={{
          width: 24, height: 24, borderRadius: '50%',
          background: '#F59E0B', color: '#0A0A0B',
          fontSize: 12, fontFamily: 'Sora, sans-serif',
        }}
      >
        M
      </div>

      <div className="flex flex-col gap-2 min-w-0 flex-1">
        <div style={{ color: '#D4D4D8', fontSize: '16px', lineHeight: '1.8' }}>
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
                  width: '32px',
                  height: '32px',
                  color: btn.active ? '#F59E0B' : '#71717A',
                  background: 'transparent',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = '#27272A';
                  (e.currentTarget as HTMLElement).style.color = btn.active ? '#F59E0B' : '#D4D4D8';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                  (e.currentTarget as HTMLElement).style.color = btn.active ? '#F59E0B' : '#71717A';
                }}
              >
                {btn.icon}
              </button>
            ))}
            <span className="ml-1 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
              {formatTimestamp(message.createdAt)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default memo(MessageBubble);
