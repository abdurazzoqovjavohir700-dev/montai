'use client';

import { useState, useRef, useCallback, type KeyboardEvent, type ChangeEvent } from 'react';
import { Paperclip, ArrowUp, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { isImageFile } from '@/lib/utils';
import { MAX_IMAGE_SIZE_MB, MAX_MESSAGE_LENGTH } from '@/lib/constants';
import Image from 'next/image';

const TYPO_FIXES: Record<string, string> = {
  // O'zbek
  'nma': 'nima', 'qalaysa': 'qalaysan', 'yxshi': 'yaxshi',
  'slm': 'salom', 'rahma': 'rahmat', 'kk': 'kerak',
  'bla': 'bilan', 'qlay': 'qanday', 'tushntir': 'tushuntir',
  'buladi': "bo'ladi", 'yoq': "yo'q", 'uzgartir': "o'zgartir",
  'urgatgin': "o'rgatgin", 'krsatgin': "ko'rsatgin",
  // Russian
  'здраствуйте': 'здравствуйте', 'помагите': 'помогите',
  'пажалуста': 'пожалуйста', 'видио': 'видео', 'мантаж': 'монтаж',
  'эфект': 'эффект', 'спосибо': 'спасибо',
  // English
  'coler': 'color', 'greding': 'grading', 'aftr': 'after',
  'efekts': 'effects', 'premire': 'premiere', 'davnchi': 'davinci',
  'rezolv': 'resolve', 'timlane': 'timeline', 'keyfram': 'keyframe',
  'rendring': 'rendering', 'tranzishn': 'transition',
  'tutoral': 'tutorial', 'begginer': 'beginner', 'editting': 'editing',
  // Turkish
  'merhba': 'merhaba', 'yardm': 'yardım', 'vidyo': 'video',
  // French
  'monterge': 'montage', 'coulleur': 'couleur', 'trasition': 'transition',
  // Spanish
  'edision': 'edición', 'efektos': 'efectos',
  // German
  'schnit': 'schnitt', 'effeckt': 'effekt',
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

interface MessageInputProps {
  onSend: (message: string, imageBase64?: string) => void;
  onStop?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onStop, isLoading, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [attachedImage, setAttachedImage] = useState<{ preview: string; base64: string; name: string } | null>(null);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 150)}px`;
  }, []);

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > MAX_MESSAGE_LENGTH) return;
    setMessage(e.target.value);
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
    const corrected = autocorrect(trimmed);
    if (corrected !== trimmed) toast('Avtomatik tuzatildi', { icon: '✓', duration: 1500 });
    onSend(corrected, attachedImage?.base64);
    setMessage('');
    setAttachedImage(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isImageFile(file)) { toast.error('Only PNG, JPG, and WebP images are supported'); return; }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) { toast.error(`Image must be smaller than ${MAX_IMAGE_SIZE_MB}MB`); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAttachedImage({ preview: result, base64: result.split(',')[1], name: file.name });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const canSend = (message.trim().length > 0 || !!attachedImage) && !isLoading && !disabled;

  return (
    <div className="w-full">
      {/* Image preview */}
      {attachedImage && (
        <div
          className="mb-2 flex items-center gap-2 p-2 rounded-xl"
          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
        >
          <Image src={attachedImage.preview} alt="Attached" width={40} height={40} className="w-10 h-10 object-cover rounded-lg" />
          <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{attachedImage.name}</span>
          <button
            onClick={() => setAttachedImage(null)}
            className="p-1 rounded transition-colors"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Input wrapper */}
      <div
        className="flex items-end gap-2"
        style={{
          background: '#2F2F2F',
          border: `1px solid ${focused ? '#52525B' : '#2F2F2F'}`,
          borderRadius: '24px',
          padding: '14px 18px',
        }}
      >
        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || disabled}
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-40"
          style={{ color: 'var(--text-tertiary)' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-tertiary)'; }}
          title="Attach image"
        >
          <Paperclip size={18} strokeWidth={1.5} />
        </button>

        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileSelect} className="hidden" />

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Xabar yozing…"
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none leading-6 py-1.5"
          style={{
            color: 'var(--text-primary)',
            fontFamily: 'Inter, sans-serif',
            fontSize: '16px',
            maxHeight: '200px',
          }}
        />

        {/* Stop / Send */}
        {isLoading ? (
          <button
            onClick={onStop}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: '#3F3F46', color: '#FAFAFA' }}
            aria-label="Stop"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="2" y="2" width="10" height="10" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: canSend ? '#FAFAFA' : '#3F3F46',
              color: canSend ? '#0A0A0B' : '#71717A',
            }}
            onMouseEnter={(e) => { if (canSend) (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            aria-label="Send message"
          >
            <ArrowUp size={17} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <p className="text-center mt-2" style={{ fontSize: '12px', color: '#52525B' }}>
        Montai xato qilishi mumkin. Muhim ma&apos;lumotlarni tekshiring.
      </p>
    </div>
  );
}
