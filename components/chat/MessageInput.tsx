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
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
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
      {/* Image preview — compact 48px thumbnail */}
      {attachedImage && (
        <div
          className="mb-2 flex items-center gap-2 px-3 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Image
            src={attachedImage.preview}
            alt="Attached"
            width={48}
            height={48}
            className="object-cover rounded-lg flex-shrink-0"
            style={{ width: 48, height: 48 }}
          />
          <span className="text-xs flex-1 truncate" style={{ color: '#71717A', fontSize: 12 }}>{attachedImage.name}</span>
          <button
            onClick={() => setAttachedImage(null)}
            className="p-1 rounded-md transition-colors flex-shrink-0"
            style={{ color: '#52525B', background: 'transparent', border: 'none', cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#A1A1AA')}
            onMouseLeave={e => (e.currentTarget.style.color = '#52525B')}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      )}

      {/* Input wrapper */}
      <div
        style={{
          background: '#1A1A1A',
          border: `1px solid ${focused ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '16px',
          padding: '12px 16px',
          boxShadow: focused ? '0 0 0 3px rgba(245,158,11,0.08)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
        }}
      >
        {/* Attach */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading || disabled}
          style={{
            width: 32, height: 32,
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#52525B',
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#52525B'; }}
          title="Attach image"
        >
          <Paperclip size={16} strokeWidth={1.5} />
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
          style={{
            flex: 1,
            background: 'transparent',
            resize: 'none',
            outline: 'none',
            border: 'none',
            color: '#FAFAFA',
            fontFamily: 'Inter, sans-serif',
            fontSize: '15px',
            lineHeight: '1.6',
            maxHeight: '200px',
            paddingTop: 4,
            paddingBottom: 4,
          }}
        />

        {/* Stop / Send */}
        {isLoading ? (
          <button
            onClick={onStop}
            style={{
              width: 36, height: 36,
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              background: '#3F3F46',
              border: 'none',
              cursor: 'pointer',
              color: '#FAFAFA',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#52525B')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3F3F46')}
            aria-label="Stop"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="10" height="10" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSend}
            disabled={!canSend}
            style={{
              width: 36, height: 36,
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              background: canSend ? 'linear-gradient(135deg, #F59E0B, #F97316)' : 'rgba(255,255,255,0.06)',
              border: 'none',
              cursor: canSend ? 'pointer' : 'not-allowed',
              color: canSend ? '#0A0A0B' : '#3F3F46',
              opacity: canSend ? 1 : 0.5,
              transition: 'all 0.15s',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => { if (canSend) (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
            aria-label="Send message"
          >
            <ArrowUp size={16} strokeWidth={1.5} />
          </button>
        )}
      </div>

      <p className="text-center mt-2" style={{ fontSize: '12px', color: '#3F3F46' }}>
        Montai xato qilishi mumkin. Muhim ma&apos;lumotlarni tekshiring.
      </p>
    </div>
  );
}
