'use client';

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { Paperclip, ArrowUp, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { isImageFile, formatFileSize } from '@/lib/utils';
import { MAX_IMAGE_SIZE_MB, MAX_MESSAGE_LENGTH } from '@/lib/constants';
import Image from 'next/image';

interface MessageInputProps {
  onSend: (message: string, imageBase64?: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function MessageInput({ onSend, isLoading, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ preview: string; base64: string; name: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    const maxHeight = 6 * 24; // 6 rows * ~24px line height
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, []);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length > MAX_MESSAGE_LENGTH) return;
    setMessage(value);
    adjustHeight();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed && !attachedImage) return;
    if (isLoading || disabled) return;

    onSend(trimmed, attachedImage?.base64);
    setMessage('');
    setAttachedImage(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isImageFile(file)) {
      toast.error('Only PNG, JPG, and WebP images are supported');
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      const base64 = result.split(',')[1];
      setAttachedImage({
        preview: result,
        base64,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const canSend = (message.trim().length > 0 || !!attachedImage) && !isLoading && !disabled;

  return (
    <div className="px-4 pb-4 pt-2">
      {/* Image preview */}
      {attachedImage && (
        <div className="mb-2 flex items-center gap-2 p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
          <Image
            src={attachedImage.preview}
            alt="Attached"
            width={40}
            height={40}
            className="w-10 h-10 object-cover rounded"
          />
          <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">{attachedImage.name}</span>
          <button
            onClick={() => setAttachedImage(null)}
            className="p-0.5 text-[var(--text-tertiary)] hover:text-[var(--error)] transition-colors"
            aria-label="Remove attachment"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input area */}
      <div
        className="flex items-end gap-2 rounded-2xl border transition-all duration-200 p-2"
        style={{
          background: 'var(--bg-tertiary)',
          borderColor: 'var(--border-subtle)',
        }}
        onFocus={() => {}}
      >
        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || disabled}
          className="p-2 rounded-xl text-[var(--text-tertiary)] hover:text-[var(--accent-primary)] hover:bg-[var(--bg-secondary)] transition-all duration-200 flex-shrink-0 disabled:opacity-40"
          aria-label="Attach screenshot"
          title="Attach screenshot (PNG, JPG, WebP, max 5MB)"
        >
          <Paperclip size={18} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder="Message Montai… (Enter to send, Shift+Enter for new line)"
          disabled={isLoading || disabled}
          rows={1}
          className="flex-1 bg-transparent text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm resize-none outline-none leading-6 max-h-36 py-1.5 disabled:opacity-50"
          style={{ fontFamily: 'Inter, sans-serif' }}
          aria-label="Message input"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!canSend}
          className="p-2 rounded-xl transition-all duration-200 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canSend ? 'linear-gradient(135deg, #F59E0B, #F97316)' : 'var(--bg-secondary)',
            color: canSend ? '#0A0A0B' : 'var(--text-tertiary)',
            boxShadow: canSend ? '0 0 16px rgba(245,158,11,0.3)' : 'none',
          }}
          aria-label="Send message"
        >
          {isLoading ? (
            <svg className="animate-spin w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <ArrowUp size={18} />
          )}
        </button>
      </div>

      <p className="text-center text-[10px] text-[var(--text-tertiary)] mt-2">
        Montai can make mistakes. Verify important information.
      </p>
    </div>
  );
}
