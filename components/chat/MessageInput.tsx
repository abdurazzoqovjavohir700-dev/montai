'use client';

import {
  useState, useRef, useCallback,
  type KeyboardEvent, type ChangeEvent, type DragEvent, type ClipboardEvent,
} from 'react';
import { Paperclip, ArrowUp, X, ImageIcon, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { isImageFile, formatFileSize } from '@/lib/utils';
import { MAX_IMAGE_SIZE_MB, MAX_MESSAGE_LENGTH } from '@/lib/constants';
import { moderateText } from '@/lib/moderation';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

const TYPO_FIXES: Record<string, string> = {
  'nma': 'nima', 'qalaysa': 'qalaysan', 'yxshi': 'yaxshi',
  'slm': 'salom', 'rahma': 'rahmat', 'kk': 'kerak',
  'bla': 'bilan', 'qlay': 'qanday', 'tushntir': 'tushuntir',
  'buladi': "bo'ladi", 'yoq': "yo'q", 'uzgartir': "o'zgartir",
  'coler': 'color', 'greding': 'grading', 'aftr': 'after',
  'efekts': 'effects', 'premire': 'premiere', 'davnchi': 'davinci',
  'rezolv': 'resolve', 'timlane': 'timeline', 'keyfram': 'keyframe',
  'rendring': 'rendering', 'tranzishn': 'transition',
};

function autocorrect(text: string): string {
  if (typeof localStorage === 'undefined') return text;
  if (localStorage.getItem('autocorrectEnabled') !== 'true') return text;
  let result = text;
  for (const [typo, fix] of Object.entries(TYPO_FIXES)) {
    result = result.replace(new RegExp(`\\b${typo}\\b`, 'gi'), fix);
  }
  return result;
}

interface AttachedImage {
  preview: string;
  base64: string;
  name: string;
  size: number;
  mime: string;
}

interface MessageInputProps {
  onSend: (message: string, imageBase64?: string, imageMime?: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onStop, isLoading, disabled }: MessageInputProps) {
  const [message, setMessage]           = useState('');
  const [image, setImage]               = useState<AttachedImage | null>(null);
  const [isReading, setIsReading]       = useState(false);
  const [focused, setFocused]           = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const textareaRef                     = useRef<HTMLTextAreaElement>(null);
  const fileInputRef                    = useRef<HTMLInputElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  /* ── Process a File object (shared by picker / drop / paste) ── */
  const processFile = useCallback((file: File) => {
    const mime = file.type.toLowerCase();
    if (!ACCEPTED_TYPES.includes(mime)) {
      toast.error('Faqat PNG, JPG, WEBP, GIF formatlari qabul qilinadi');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Rasm hajmi ${MAX_IMAGE_SIZE_MB}MB dan kichik bo'lishi kerak`);
      return;
    }
    setIsReading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImage({
        preview: result,
        base64: result.split(',')[1],
        name: file.name,
        size: file.size,
        mime,
      });
      setIsReading(false);
    };
    reader.onerror = () => {
      toast.error('Rasmni o\'qishda xatolik yuz berdi');
      setIsReading(false);
    };
    reader.readAsDataURL(file);
  }, []);

  /* ── File picker ─────────────────────────────────────────── */
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  /* ── Drag & Drop ─────────────────────────────────────────── */
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
  };
  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  /* ── Paste from clipboard ────────────────────────────────── */
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) { processFile(file); break; }
      }
    }
  };

  /* ── Send ────────────────────────────────────────────────── */
  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed && !image) return;
    if (isLoading || disabled || isReading) return;
    const corrected = autocorrect(trimmed);
    if (corrected !== trimmed) toast.info('Avtomatik tuzatildi');

    // Client-side moderation — block before sending
    const modResult = moderateText(corrected);
    if (modResult.blocked) {
      toast.error(modResult.message ?? 'Bu turdagi kontent uchun yordam bera olmayman.', {
        description: 'Videomontaj, ranglar, texnika yoki boshqa mavzular bo\'yicha so\'rang.',
      });
      return;
    }

    onSend(corrected, image?.base64, image?.mime);
    setMessage('');
    setImage(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [message, image, isLoading, disabled, isReading, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > MAX_MESSAGE_LENGTH) return;
    setMessage(e.target.value);
    adjustHeight();
  };

  const canSend = (message.trim().length > 0 || !!image) && !isLoading && !disabled && !isReading;

  /* ── Skeleton shimmer during FileReader ──────────────────── */
  const ImageSkeleton = () => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10, marginBottom: 8,
    }}>
      <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="skeleton" style={{ height: 10, width: '60%', borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton" style={{ height: 9, width: '35%', borderRadius: 4 }} />
      </div>
    </div>
  );

  /* ── Image preview card ──────────────────────────────────── */
  const ImagePreview = () => image && (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px',
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 10, marginBottom: 8,
    }}>
      {/* Thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.preview}
        alt="Preview"
        style={{
          width: 44, height: 44, borderRadius: 8,
          objectFit: 'cover', flexShrink: 0,
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 12.5, color: '#D4D4D8', fontFamily: 'Inter, sans-serif',
          fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          margin: 0,
        }}>
          {image.name}
        </p>
        <p style={{ fontSize: 11.5, color: '#52525B', fontFamily: 'Inter, sans-serif', margin: '2px 0 0' }}>
          {formatFileSize(image.size)} · {image.mime.split('/')[1].toUpperCase()}
        </p>
      </div>

      {/* Remove */}
      <button
        onClick={() => setImage(null)}
        style={{
          padding: 5, borderRadius: 6, border: 'none',
          background: 'rgba(255,255,255,0.05)', color: '#52525B',
          cursor: 'pointer', flexShrink: 0, lineHeight: 0,
        }}
        onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(239,68,68,0.1)'); (e.currentTarget.style.color = '#EF4444'); }}
        onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.05)'); (e.currentTarget.style.color = '#52525B'); }}
        title="Rasmni olib tashlash"
      >
        <X size={13} strokeWidth={1.5} />
      </button>
    </div>
  );

  return (
    <div
      className="w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Image states */}
      {isReading && <ImageSkeleton />}
      {!isReading && image && <ImagePreview />}

      {/* Input wrapper */}
      <div
        style={{
          background: dragOver ? '#1E1E1E' : '#1A1A1A',
          border: `1px solid ${
            dragOver ? 'rgba(245,158,11,0.5)' :
            focused   ? 'rgba(255,255,255,0.2)' :
                        'rgba(255,255,255,0.1)'
          }`,
          borderRadius: 16,
          padding: '12px 14px',
          boxShadow: dragOver
            ? '0 0 0 3px rgba(245,158,11,0.12), inset 0 0 0 1px rgba(245,158,11,0.15)'
            : focused
            ? '0 0 0 3px rgba(245,158,11,0.07)'
            : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
          display: 'flex', alignItems: 'flex-end', gap: 10,
          position: 'relative',
        }}
      >
        {/* Drag overlay label */}
        {dragOver && (
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, pointerEvents: 'none',
            background: 'rgba(245,158,11,0.04)',
            color: '#F59E0B', fontSize: 13.5, fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            zIndex: 1,
          }}>
            <ImageIcon size={18} strokeWidth={1.5} />
            Rasmni bu yerga tashlang
          </div>
        )}

        {/* Attach button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || disabled}
          title="Rasm biriktirish (yoki rasm joylashtiring)"
          style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: image ? 'rgba(245,158,11,0.1)' : 'transparent',
            border: 'none', cursor: 'pointer',
            color: image ? '#F59E0B' : '#52525B',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = image ? '#F59E0B' : '#A1A1AA'; (e.currentTarget as HTMLElement).style.background = image ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = image ? '#F59E0B' : '#52525B'; (e.currentTarget as HTMLElement).style.background = image ? 'rgba(245,158,11,0.1)' : 'transparent'; }}
        >
          <Paperclip size={16} strokeWidth={1.5} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={dragOver ? '' : 'Xabar yozing… (rasm joylashtirib yuboring)'}
          disabled={disabled || dragOver}
          rows={1}
          style={{
            flex: 1, background: 'transparent', resize: 'none',
            outline: 'none', border: 'none',
            color: dragOver ? 'transparent' : '#FAFAFA',
            fontFamily: 'Inter, sans-serif', fontSize: 15,
            lineHeight: '1.6', maxHeight: 200,
            paddingTop: 4, paddingBottom: 4,
            opacity: dragOver ? 0 : 1,
            transition: 'opacity 0.1s',
          }}
        />

        {/* Stop / Send */}
        {isLoading ? (
          <button
            onClick={onStop}
            style={{
              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#3F3F46', border: 'none', cursor: 'pointer', color: '#FAFAFA',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#52525B')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3F3F46')}
            aria-label="Stop"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="10" height="10" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: canSend ? 'linear-gradient(135deg, #F59E0B, #F97316)' : 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
              color: canSend ? '#0A0A0B' : '#3F3F46',
              opacity: canSend ? 1 : 0.5,
              transform: 'scale(1)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (canSend) (e.currentTarget as HTMLElement).style.transform = 'scale(1.07)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            aria-label="Send"
          >
            <ArrowUp size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Format hint */}
      {!isLoading && (
        <p style={{ textAlign: 'center', marginTop: 8, fontSize: 11.5, color: '#3F3F46', fontFamily: 'Inter, sans-serif' }}>
          Montai xato qilishi mumkin. Rasm: PNG, JPG, WEBP, GIF · Drag &amp; drop yoki ctrl+v
        </p>
      )}

      {/* Validation error for unsupported actions */}
      {isReading && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginTop: 4, color: '#71717A',
          fontSize: 12, fontFamily: 'Inter, sans-serif',
        }}>
          <AlertCircle size={12} strokeWidth={1.5} />
          Rasm o&apos;qilmoqda…
        </div>
      )}
    </div>
  );
}
