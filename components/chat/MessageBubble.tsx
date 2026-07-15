'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import { formatTimestamp } from '@/lib/utils';
import type { Message } from '@/lib/types';
import Image from 'next/image';

interface MessageBubbleProps {
  message: Message;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-end justify-end gap-2 px-4 py-1.5 group"
      >
        <div className="flex flex-col items-end gap-1 max-w-[75%]">
          {message.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] mb-1">
              <Image
                src={message.imageUrl}
                alt="Attached screenshot"
                width={300}
                height={200}
                className="max-w-[300px] max-h-[200px] object-contain"
              />
            </div>
          )}
          <div
            className="px-4 py-3 rounded-2xl rounded-br-sm text-black text-sm leading-relaxed relative"
            style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)' }}
            onMouseEnter={() => setShowTime(true)}
            onMouseLeave={() => setShowTime(false)}
          >
            <p className="whitespace-pre-wrap break-words font-medium">{message.content}</p>
          </div>
          {showTime && (
            <span className="text-[10px] text-[var(--text-tertiary)] px-1">
              {formatTimestamp(message.createdAt)}
            </span>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 px-4 py-1.5 group"
    >
      {/* Montai Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-black mt-0.5"
        style={{
          background: 'linear-gradient(135deg, #F59E0B, #F97316)',
          boxShadow: '0 0 12px rgba(245,158,11,0.25)',
          fontFamily: 'Sora, sans-serif',
        }}
      >
        M
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1 max-w-[80%] flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3 border-l-[3px] border-[var(--accent-primary)] text-sm relative"
          style={{
            background: 'var(--bg-chat-ai)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
          onMouseEnter={() => setShowTime(true)}
          onMouseLeave={() => setShowTime(false)}
        >
          <MarkdownRenderer content={message.content} />

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-md p-1 text-[var(--text-tertiary)] hover:text-[var(--accent-primary)]"
            aria-label="Copy message"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>

        {showTime && (
          <span className="text-[10px] text-[var(--text-tertiary)] px-1">
            {formatTimestamp(message.createdAt)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
