'use client';

import {
  useState, useRef, useCallback, useEffect,
  type KeyboardEvent, type ChangeEvent, type DragEvent, type ClipboardEvent,
} from 'react';
import { ArrowUp, Plus, X, FileText } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { isImageFile, formatFileSize } from '@/lib/utils';
import { MAX_IMAGE_SIZE_MB, MAX_MESSAGE_LENGTH } from '@/lib/constants';
import { moderateText } from '@/lib/moderation';
import QuickActionMenu from './QuickActionMenu';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, 'application/pdf'];
const MAX_IMAGES = 3;
// Vercel/Netlify body limit ~4.5 MB → base64 blows to 133%, so max raw PDF = 3 MB
const MAX_PDF_SIZE_MB = 3;

const ALLOWED_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);

// Magic byte signatures to verify actual file content (prevent .JpG extension tricks)
async function verifyMagicBytes(file: File, mime: string): Promise<boolean> {
  try {
    const buf = await file.slice(0, 12).arrayBuffer();
    const b = new Uint8Array(buf);
    if (mime === 'image/jpeg' || mime === 'image/jpg') {
      return b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
    }
    if (mime === 'image/png') {
      return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
    }
    if (mime === 'image/gif') {
      return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38;
    }
    if (mime === 'image/webp') {
      return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46
        && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    }
    if (mime === 'application/pdf') {
      return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;
    }
    return false;
  } catch { return false; }
}

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

const PLACEHOLDERS = [
  'Xabar yozing…',
  'Savol bering…',
  'Ctrl+V — rasm joylash…',
  'Video montaj bo\'yicha so\'rang…',
  'Rasm tashlang…',
  'Color grading, sound design…',
];

export interface AttachedImage {
  preview: string;
  base64: string;
  name: string;
  size: number;
  mime: string;
}

export interface AttachedPdf {
  name: string;
  size: number;
  text: string;
  pages: number;
  truncated?: boolean;
}

interface MessageInputProps {
  onSend: (message: string, images?: AttachedImage[], pdf?: AttachedPdf) => void;
  onStop?: () => void;
  onNewChat?: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

export default function MessageInput({ onSend, onStop, onNewChat, isLoading, disabled }: MessageInputProps) {
  const [message, setMessage]       = useState('');
  const [images, setImages]         = useState<AttachedImage[]>([]);
  const [pdf, setPdf]               = useState<AttachedPdf | null>(null);
  const [isReading, setIsReading]   = useState(false);
  const [focused, setFocused]       = useState(false);
  const [dragOver, setDragOver]     = useState(false);
  const [menuOpen, setMenuOpen]     = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const textareaRef                 = useRef<HTMLTextAreaElement>(null);
  const fileInputRef                = useRef<HTMLInputElement>(null);
  const pdfInputRef                 = useRef<HTMLInputElement>(null);
  const menuAnchorRef               = useRef<HTMLDivElement>(null);
  const plusBtnRef                  = useRef<HTMLButtonElement>(null);

  /* Rotate placeholder when not typing */
  useEffect(() => {
    if (message || isLoading) return;
    const id = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length);
    }, 3500);
    return () => clearInterval(id);
  }, [message, isLoading]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const processPdf = useCallback((file: File) => {
    if (pdf) {
      toast.error('Bir vaqtda faqat 1 ta PDF biriktiriladi. Avvalgisini o\'chiring.');
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext !== 'pdf') {
      toast.error('Faqat .pdf fayllar qabul qilinadi.');
      return;
    }
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
      toast.error(`PDF hajmi ${MAX_PDF_SIZE_MB}MB dan kichik bo'lishi kerak`);
      return;
    }
    setIsReading(true);
    // Magic bytes check before reading full file
    verifyMagicBytes(file, 'application/pdf').then(valid => {
      if (!valid) {
        toast.error('Bu haqiqiy PDF fayl emas. Fayl ichidagi ma\'lumotlar mos kelmadi.');
        setIsReading(false);
        return;
      }
      startPdfRead(file);
    });
  }, [pdf]); // eslint-disable-line react-hooks/exhaustive-deps

  const startPdfRead = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(',')[1];

        let res: Response;
        try {
          res = await fetch('/api/parse-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64, name: file.name }),
          });
        } catch {
          toast.error('Server bilan ulanishda xatolik — internet ulanishini tekshiring.');
          return;
        }

        // Server HTML yoki boshqa format qaytarishi mumkin (413, 502 va h.k.)
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          if (res.status === 413) {
            toast.error(`PDF hajmi juda katta. Maksimum ${MAX_PDF_SIZE_MB}MB ruxsat etiladi.`);
          } else {
            toast.error(`Server xatosi (${res.status}). Keyinroq qaytadan urining.`);
          }
          return;
        }

        const data = await res.json() as { text?: string; pages?: number; truncated?: boolean; error?: string };
        if (!res.ok || data.error) {
          toast.error(data.error ?? 'PDF tahlil qilishda xatolik yuz berdi.');
          return;
        }
        setPdf({ name: file.name, size: file.size, text: data.text ?? '', pages: data.pages ?? 0, truncated: data.truncated });
        if (data.truncated) {
          toast.success(`PDF yuklandi: ${data.pages} sahifa (uzoq hujjat, dastlabki qism tahlil qilindi)`);
        } else {
          toast.success(`PDF yuklandi: ${data.pages} sahifa`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        if (msg.includes('413') || msg.toLowerCase().includes('too large')) {
          toast.error(`PDF juda katta — maksimum ${MAX_PDF_SIZE_MB}MB.`);
        } else {
          toast.error('PDF tahlil qilishda kutilmagan xatolik. Boshqa PDF sinab ko\'ring.');
        }
      } finally {
        setIsReading(false);
      }
    };
    reader.onerror = () => {
      toast.error('Faylni o\'qishda xatolik yuz berdi');
      setIsReading(false);
    };
    reader.readAsDataURL(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const processFile = useCallback((file: File) => {
    const mime = file.type.toLowerCase();
    // Extension normalization (catches .JpG .JPG tricks)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';

    if (mime === 'application/pdf' || ext === 'pdf') {
      processPdf(file);
      return;
    }
    if (!ACCEPTED_IMAGE_TYPES.includes(mime) || !ALLOWED_IMAGE_EXTS.has(ext)) {
      toast.error('Faqat PNG, JPG, WEBP, GIF va PDF formatlari qabul qilinadi');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Rasm hajmi ${MAX_IMAGE_SIZE_MB}MB dan kichik bo'lishi kerak`);
      return;
    }
    if (images.length >= MAX_IMAGES) {
      toast.error(`Maksimal ${MAX_IMAGES} ta rasm biriktiriladi`);
      return;
    }

    // Verify actual image content via magic bytes
    verifyMagicBytes(file, mime).then(valid => {
      if (!valid) {
        toast.error('Fayl formati mos kelmadi. Haqiqiy rasm fayli yuklang.');
        return;
      }
      setIsReading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setImages(prev => prev.length < MAX_IMAGES ? [...prev, {
          preview: result,
          base64: result.split(',')[1],
          name: file.name,
          size: file.size,
          mime,
        }] : prev);
        setIsReading(false);
      };
      reader.onerror = () => {
        toast.error('Rasmni o\'qishda xatolik yuz berdi');
        setIsReading(false);
      };
      reader.readAsDataURL(file);
    });
  }, [images, processPdf]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach(f => processFile(f));
    e.target.value = '';
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragOver(true);
  };
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
  };
  const handleDrop = (e: DragEvent) => {
    e.preventDefault(); setDragOver(false);
    Array.from(e.dataTransfer.files).slice(0, MAX_IMAGES - images.length).forEach(f => processFile(f));
  };

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

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed && images.length === 0 && !pdf) return;
    if (isLoading || disabled || isReading) return;
    const corrected = autocorrect(trimmed);
    if (corrected !== trimmed) toast.info('Avtomatik tuzatildi');

    const modResult = moderateText(corrected);
    if (modResult.blocked) {
      toast.error(modResult.message ?? 'Bu turdagi kontent uchun yordam bera olmayman.', {
        description: 'Videomontaj, ranglar, texnika yoki boshqa mavzular bo\'yicha so\'rang.',
      });
      return;
    }

    onSend(corrected, images.length > 0 ? images : undefined, pdf ?? undefined);
    setMessage('');
    setImages([]);
    setPdf(null);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [message, images, pdf, isLoading, disabled, isReading, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > MAX_MESSAGE_LENGTH) return;
    setMessage(e.target.value);
    adjustHeight();
  };

  const removeImage = (idx: number) => setImages(prev => prev.filter((_, i) => i !== idx));
  const removePdf = () => setPdf(null);

  const canSend = (message.trim().length > 0 || images.length > 0 || !!pdf) && !isLoading && !disabled && !isReading;

  const showHint = !message && !isLoading && images.length === 0 && !pdf && !dragOver;

  return (
    <div
      className="w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Attachments strip — images + PDF */}
      {(images.length > 0 || pdf || isReading) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          {/* PDF badge */}
          {pdf && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                height: 60, borderRadius: 10, padding: '0 12px',
                background: 'rgba(245,158,11,0.08)',
                border: '1px solid rgba(245,158,11,0.25)',
                display: 'flex', alignItems: 'center', gap: 8,
                maxWidth: 200,
              }}>
                <FileText size={22} strokeWidth={1.5} style={{ color: '#F59E0B', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: 12, fontWeight: 600, color: '#F59E0B',
                    fontFamily: 'Inter, sans-serif',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    maxWidth: 130,
                  }}>
                    {pdf.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: '#71717A', fontFamily: 'Inter, sans-serif' }}>
                    PDF · {pdf.pages} sahifa
                  </div>
                </div>
              </div>
              <button
                onClick={removePdf}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#EF4444', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff', lineHeight: 0,
                }}
              >
                <X size={10} strokeWidth={2} />
              </button>
            </div>
          )}

          {images.map((img, idx) => (
            <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.preview}
                alt={img.name}
                style={{
                  width: 60, height: 60, borderRadius: 10,
                  objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'block',
                }}
              />
              <button
                onClick={() => removeImage(idx)}
                style={{
                  position: 'absolute', top: -6, right: -6,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#EF4444', border: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#fff', lineHeight: 0,
                }}
              >
                <X size={10} strokeWidth={2} />
              </button>
              {idx === 0 && images.length > 1 && (
                <div style={{
                  position: 'absolute', bottom: 3, right: 3,
                  fontSize: 9, fontWeight: 700, color: '#fff',
                  background: 'rgba(0,0,0,0.55)', borderRadius: 4,
                  padding: '1px 4px', fontFamily: 'Inter, sans-serif',
                }}>
                  {images.length}/{MAX_IMAGES}
                </div>
              )}
            </div>
          ))}
          {isReading && (
            <div style={{
              width: 60, height: 60, borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', border: '2px solid rgba(245,158,11,0.3)', borderTopColor: '#F59E0B', animation: 'spin 0.8s linear infinite' }} />
            </div>
          )}
        </div>
      )}

      {/* Main input wrapper */}
      <div style={{ position: 'relative' }}>
        {/* QuickActionMenu anchor */}
        <div ref={menuAnchorRef} style={{ position: 'absolute', left: 0, bottom: '100%' }}>
          <QuickActionMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            onUploadImage={() => fileInputRef.current?.click()}
            onUploadPdf={() => pdfInputRef.current?.click()}
            onNewChat={() => onNewChat?.()}
            anchorRef={plusBtnRef as React.RefObject<HTMLElement | null>}
          />
        </div>

        <div
          style={{
            background: dragOver ? 'rgba(245,158,11,0.04)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${
              dragOver ? 'rgba(245,158,11,0.5)' :
              focused   ? 'rgba(255,255,255,0.18)' :
                          'rgba(255,255,255,0.09)'
            }`,
            borderRadius: 18,
            padding: '11px 12px',
            boxShadow: dragOver
              ? '0 0 0 3px rgba(245,158,11,0.12), 0 8px 32px rgba(0,0,0,0.4)'
              : focused
              ? '0 0 0 2px rgba(245,158,11,0.07), 0 8px 32px rgba(0,0,0,0.35)'
              : '0 4px 20px rgba(0,0,0,0.25)',
            transition: 'border-color 0.18s, box-shadow 0.18s, background 0.15s',
            display: 'flex', alignItems: 'flex-end', gap: 8,
            position: 'relative',
          }}
        >
          {/* Drag overlay */}
          {dragOver && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, pointerEvents: 'none',
              color: '#F59E0B', fontSize: 14, fontWeight: 500,
              fontFamily: 'Inter, sans-serif', zIndex: 1,
            }}>
              📎 Bu yerga tashlang
            </div>
          )}

          {/* "+" button — intentionally NOT disabled while AI loading so user can open new chat/upload */}
          <button
            ref={plusBtnRef}
            onClick={() => setMenuOpen(v => !v)}
            disabled={disabled}
            title="Fayl qo'shish yoki amallar"
            style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: menuOpen ? 'rgba(245,158,11,0.12)' : 'transparent',
              border: `1px solid ${menuOpen ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              color: menuOpen ? '#F59E0B' : '#52525B',
              transition: 'all 0.15s',
              transform: menuOpen ? 'rotate(45deg)' : 'none',
            }}
            onMouseEnter={e => {
              if (!menuOpen) {
                (e.currentTarget.style.color = '#A1A1AA');
                (e.currentTarget.style.background = 'rgba(255,255,255,0.06)');
                (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)');
              }
            }}
            onMouseLeave={e => {
              if (!menuOpen) {
                (e.currentTarget.style.color = '#52525B');
                (e.currentTarget.style.background = 'transparent');
                (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)');
              }
            }}
          >
            <Plus size={16} strokeWidth={1.8} />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES.join(',')}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={pdfInputRef}
            type="file"
            accept="application/pdf"
            onChange={e => { const f = e.target.files?.[0]; if (f) processPdf(f); e.target.value = ''; }}
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
            placeholder={dragOver ? '' : PLACEHOLDERS[placeholderIdx]}
            disabled={disabled || dragOver}
            rows={1}
            style={{
              flex: 1, background: 'transparent', resize: 'none',
              outline: 'none', border: 'none',
              color: dragOver ? 'transparent' : '#FAFAFA',
              fontFamily: 'Inter, sans-serif', fontSize: 15,
              lineHeight: '1.6', maxHeight: 200,
              paddingTop: 3, paddingBottom: 3,
              opacity: dragOver ? 0 : 1,
              transition: 'opacity 0.12s',
              caretColor: '#F59E0B',
            }}
          />

          {/* Stop / Send */}
          {isLoading ? (
            <button
              onClick={onStop}
              style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer', color: '#FAFAFA', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.14)'); }}
              onMouseLeave={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.08)'); }}
              aria-label="Stop"
            >
              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                <rect x="1" y="1" width="10" height="10" rx="2.5" />
              </svg>
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              style={{
                width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: canSend ? 'linear-gradient(135deg, #F59E0B, #F97316)' : 'rgba(255,255,255,0.06)',
                border: 'none',
                cursor: canSend ? 'pointer' : 'not-allowed',
                color: canSend ? '#0A0A0B' : '#3F3F46',
                opacity: canSend ? 1 : 0.45,
                transform: 'scale(1)',
                transition: 'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
                boxShadow: canSend ? '0 2px 12px rgba(245,158,11,0.35)' : 'none',
              }}
              onMouseEnter={e => { if (canSend) { (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)'; } }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
              aria-label="Yuborish"
            >
              <ArrowUp size={15} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

    </div>
  );
}
