'use client';

import {
  useState, useRef, useCallback, useEffect,
  type KeyboardEvent, type ChangeEvent, type DragEvent, type ClipboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, Plus, X, FileText, Zap, Search, Languages, AlignLeft, Wand2, Code2, Lightbulb } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { isImageFile, formatFileSize } from '@/lib/utils';
import { MAX_IMAGE_SIZE_MB, MAX_MESSAGE_LENGTH } from '@/lib/constants';
import { moderateText } from '@/lib/moderation';
import QuickActionMenu from './QuickActionMenu';

const ACCEPTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const ACCEPTED_TYPES = [...ACCEPTED_IMAGE_TYPES, 'application/pdf'];
const MAX_IMAGES = 3;
const MAX_PDF_SIZE_MB = 3;
const ALLOWED_IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif']);
const MAX_DIMENSION = 1568; // Groq vision limit

async function compressImage(file: File): Promise<{ base64: string; mime: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
      const canvas = document.createElement('canvas');
      canvas.width  = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unavailable')); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Compression failed')); return; }
        const reader = new FileReader();
        reader.onload = ev => {
          const dataUrl = ev.target?.result as string;
          resolve({ base64: dataUrl.split(',')[1], mime });
        };
        reader.onerror = () => reject(new Error('Read failed'));
        reader.readAsDataURL(blob);
      }, mime, 0.88);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')); };
    img.src = url;
  });
}

const SLASH_COMMANDS = [
  { id: 'analyze',   icon: <Zap size={13} strokeWidth={1.5}/>,      label: 'Analyze',    desc: 'Analyze image or text in detail',  fill: 'Analyze the following in detail:' },
  { id: 'translate', icon: <Languages size={13} strokeWidth={1.5}/>, label: 'Translate',  desc: 'Translate to Uzbek',               fill: 'Translate the following to Uzbek:' },
  { id: 'summarize', icon: <AlignLeft size={13} strokeWidth={1.5}/>, label: 'Summarize',  desc: 'Write a concise summary',          fill: 'Summarize the following concisely:' },
  { id: 'explain',   icon: <Lightbulb size={13} strokeWidth={1.5}/>, label: 'Explain',    desc: 'Explain simply',                   fill: 'Explain the following simply:' },
  { id: 'generate',  icon: <Wand2 size={13} strokeWidth={1.5}/>,     label: 'Generate',   desc: 'Create new content',               fill: 'Create professional content about:' },
  { id: 'search',    icon: <Search size={13} strokeWidth={1.5}/>,    label: 'Search',     desc: 'Find information',                 fill: 'Give me detailed information about:' },
  { id: 'code',      icon: <Code2 size={13} strokeWidth={1.5}/>,     label: 'Code',       desc: 'Write code or scripts',            fill: 'Write code for:' },
  { id: 'fix',       icon: <Zap size={13} strokeWidth={1.5}/>,       label: 'Fix',        desc: 'Debug and optimize',               fill: 'Review and fix this code:' },
];

async function verifyMagicBytes(file: File, mime: string): Promise<boolean> {
  try {
    const buf = await file.slice(0, 12).arrayBuffer();
    const b = new Uint8Array(buf);
    if (mime === 'image/jpeg' || mime === 'image/jpg') return b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
    if (mime === 'image/png') return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
    if (mime === 'image/gif') return b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38;
    if (mime === 'image/webp') return b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    if (mime === 'application/pdf') return b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46;
    return false;
  } catch { return false; }
}

const TYPO_FIXES: Record<string, string> = {
  'nma': 'nima', 'yxshi': 'yaxshi', 'slm': 'salom', 'bla': 'bilan',
  'tushntir': 'tushuntir', 'buladi': "bo'ladi", 'yoq': "yo'q",
  'coler': 'color', 'greding': 'grading', 'aftr': 'after',
  'efekts': 'effects', 'premire': 'premiere', 'davnchi': 'davinci',
  'rezolv': 'resolve', 'timlane': 'timeline', 'keyfram': 'keyframe',
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
  'Ask anything…',
  'Ctrl+V to paste an image…',
  'Try /code, /translate, /summarize…',
  'Ask about color grading, cuts, audio…',
  'Drop files here…',
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
  const [slashOpen, setSlashOpen]   = useState(false);
  const [slashSel, setSlashSel]     = useState(0);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const plusBtnRef = useRef<HTMLButtonElement>(null);

  const getHistory = (): string[] => { try { return JSON.parse(localStorage.getItem('montai_prompt_hist') ?? '[]'); } catch { return []; } };
  const pushHistory = (text: string) => { try { const h = [text, ...getHistory().filter(s => s !== text)].slice(0, 50); localStorage.setItem('montai_prompt_hist', JSON.stringify(h)); } catch {} };

  useEffect(() => {
    if (message || isLoading) return;
    const id = setInterval(() => setPlaceholderIdx(i => (i + 1) % PLACEHOLDERS.length), 3800);
    return () => clearInterval(id);
  }, [message, isLoading]);

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  const processPdf = useCallback((file: File) => {
    if (pdf) { toast.error('Remove the current PDF first.'); return; }
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext !== 'pdf') { toast.error('Only .pdf files accepted.'); return; }
    if (file.size > MAX_PDF_SIZE_MB * 1024 * 1024) { toast.error(`PDF must be under ${MAX_PDF_SIZE_MB}MB`); return; }
    setIsReading(true);
    verifyMagicBytes(file, 'application/pdf').then(valid => {
      if (!valid) { toast.error('Invalid PDF file.'); setIsReading(false); return; }
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
          res = await fetch('/api/parse-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ base64, name: file.name }) });
        } catch {
          toast.error('Connection error — check your internet.'); return;
        }
        const contentType = res.headers.get('content-type') ?? '';
        if (!contentType.includes('application/json')) {
          toast.error(res.status === 413 ? `PDF too large (max ${MAX_PDF_SIZE_MB}MB).` : `Server error (${res.status}).`);
          return;
        }
        const data = await res.json() as { text?: string; pages?: number; truncated?: boolean; error?: string };
        if (!res.ok || data.error) { toast.error(data.error ?? 'PDF parsing failed.'); return; }
        setPdf({ name: file.name, size: file.size, text: data.text ?? '', pages: data.pages ?? 0, truncated: data.truncated });
        toast.success(data.truncated ? `PDF loaded: ${data.pages} pages (truncated)` : `PDF loaded: ${data.pages} pages`);
      } catch { toast.error('Unexpected error parsing PDF.'); }
      finally { setIsReading(false); }
    };
    reader.onerror = () => { toast.error('Failed to read file'); setIsReading(false); };
    reader.readAsDataURL(file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const processFile = useCallback((file: File) => {
    const mime = file.type.toLowerCase();
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (mime === 'application/pdf' || ext === 'pdf') { processPdf(file); return; }
    if (!ACCEPTED_IMAGE_TYPES.includes(mime) || !ALLOWED_IMAGE_EXTS.has(ext)) { toast.error('Only PNG, JPG, WEBP, GIF and PDF accepted'); return; }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) { toast.error(`Image must be under ${MAX_IMAGE_SIZE_MB}MB`); return; }
    if (images.length >= MAX_IMAGES) { toast.error(`Maximum ${MAX_IMAGES} images`); return; }
    verifyMagicBytes(file, mime).then(valid => {
      if (!valid) { toast.error('Invalid image file.'); return; }
      setIsReading(true);
      const preview = URL.createObjectURL(file);
      compressImage(file)
        .then(({ base64, mime: outMime }) => {
          setImages(prev => prev.length < MAX_IMAGES
            ? [...prev, { preview, base64, name: file.name, size: file.size, mime: outMime }]
            : prev
          );
        })
        .catch(() => { toast.error('Failed to process image'); })
        .finally(() => setIsReading(false));
    });
  }, [images, processPdf]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => { Array.from(e.target.files ?? []).forEach(f => processFile(f)); e.target.value = ''; };
  const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e: DragEvent) => { e.preventDefault(); if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); };
  const handleDrop = (e: DragEvent) => { e.preventDefault(); setDragOver(false); Array.from(e.dataTransfer.files).slice(0, MAX_IMAGES - images.length).forEach(f => processFile(f)); };
  const handlePaste = (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) { if (item.type.startsWith('image/')) { const file = item.getAsFile(); if (file) { processFile(file); break; } } }
  };

  const slashQuery = message.startsWith('/') ? message.slice(1).toLowerCase() : '';
  const slashFiltered = message.startsWith('/') ? SLASH_COMMANDS.filter(c => !slashQuery || c.id.includes(slashQuery) || c.label.toLowerCase().includes(slashQuery)) : [];

  const applySlashCommand = useCallback((fill: string) => {
    setMessage(fill + ' ');
    setSlashOpen(false);
    setSlashSel(0);
    setTimeout(() => { const el = textareaRef.current; if (!el) return; el.focus(); el.selectionStart = el.selectionEnd = el.value.length; adjustHeight(); }, 0);
  }, [adjustHeight]);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed && images.length === 0 && !pdf) return;
    if (isLoading || disabled || isReading) return;
    const corrected = autocorrect(trimmed);
    const modResult = moderateText(corrected);
    if (modResult.blocked) { toast.error(modResult.message ?? 'Content not allowed.'); return; }
    if (trimmed) pushHistory(trimmed);
    onSend(corrected, images.length > 0 ? images : undefined, pdf ?? undefined);
    setMessage('');
    setImages([]);
    setPdf(null);
    setHistoryIdx(-1);
    setSlashOpen(false);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [message, images, pdf, isLoading, disabled, isReading, onSend]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (slashOpen && slashFiltered.length > 0) {
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashSel(s => (s - 1 + slashFiltered.length) % slashFiltered.length); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashSel(s => (s + 1) % slashFiltered.length); return; }
      if (e.key === 'Enter') { e.preventDefault(); const cmd = slashFiltered[slashSel]; if (cmd) applySlashCommand(cmd.fill); return; }
      if (e.key === 'Escape') { e.preventDefault(); setSlashOpen(false); return; }
    }
    if (!slashOpen) {
      if (e.key === 'ArrowUp' && message === '') {
        e.preventDefault(); const hist = getHistory(); if (!hist.length) return;
        const next = Math.min(historyIdx + 1, hist.length - 1); setHistoryIdx(next); setMessage(hist[next] ?? ''); setTimeout(adjustHeight, 0); return;
      }
      if (e.key === 'ArrowDown' && historyIdx >= 0) {
        e.preventDefault(); const hist = getHistory(); const next = historyIdx - 1;
        if (next < 0) { setHistoryIdx(-1); setMessage(''); setTimeout(adjustHeight, 0); }
        else { setHistoryIdx(next); setMessage(hist[next] ?? ''); setTimeout(adjustHeight, 0); } return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (e.target.value.length > MAX_MESSAGE_LENGTH) return;
    const val = e.target.value;
    setMessage(val);
    setHistoryIdx(-1);
    if (val.startsWith('/')) { setSlashOpen(true); setSlashSel(0); } else { setSlashOpen(false); }
    adjustHeight();
  };

  const canSend = (message.trim().length > 0 || images.length > 0 || !!pdf) && !isLoading && !disabled && !isReading;

  return (
    <div
      className="w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPaste={handlePaste}
    >
      {/* Attachments */}
      {(images.length > 0 || pdf || isReading) && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          {pdf && (
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                height: 52, borderRadius: 10, padding: '0 12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', gap: 8,
                maxWidth: 200,
              }}>
                <FileText size={18} strokeWidth={1.5} style={{ color: '#8B93A4', flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#EEEEF0', fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 130 }}>{pdf.name}</div>
                  <div style={{ fontSize: 10.5, color: '#5A6272', fontFamily: 'Inter, sans-serif' }}>PDF · {pdf.pages} pages</div>
                </div>
              </div>
              <button onClick={() => setPdf(null)} style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#EF4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <X size={9} strokeWidth={2.5} />
              </button>
            </div>
          )}
          {images.map((img, idx) => (
            <div key={idx} style={{ position: 'relative', flexShrink: 0 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.preview} alt={img.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)', display: 'block' }} />
              <button onClick={() => setImages(prev => prev.filter((_, i) => i !== idx))} style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#EF4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
                <X size={9} strokeWidth={2.5} />
              </button>
            </div>
          ))}
          {isReading && (
            <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.15)', borderTopColor: '#EEEEF0', animation: 'spin 0.7s linear infinite' }} />
            </div>
          )}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        {/* Slash popup */}
        <AnimatePresence>
          {slashOpen && slashFiltered.length > 0 && (
            <motion.div
              key="slash"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0,
                background: '#0F1116',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 2px 8px rgba(0,0,0,0.4)',
                zIndex: 50,
              }}
            >
              <div style={{ padding: '6px 12px 4px', fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', color: '#363C4D', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase' }}>
                Commands
              </div>
              {slashFiltered.map((cmd, i) => (
                <button
                  key={cmd.id}
                  onMouseDown={e => { e.preventDefault(); applySlashCommand(cmd.fill); }}
                  onMouseEnter={() => setSlashSel(i)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '8px 12px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: i === slashSel ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: 'none', cursor: 'pointer',
                    borderLeft: `2px solid ${i === slashSel ? 'rgba(255,255,255,0.18)' : 'transparent'}`,
                    transition: 'all 0.1s',
                  }}
                >
                  <span style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    background: i === slashSel ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.04)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: i === slashSel ? '#EEEEF0' : '#5A6272',
                  }}>{cmd.icon}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: '#EEEEF0', fontFamily: 'Inter, sans-serif', display: 'block' }}>{cmd.label}</span>
                    <span style={{ fontSize: 11, color: '#5A6272', fontFamily: 'Inter, sans-serif' }}>{cmd.desc}</span>
                  </span>
                  <span style={{ fontSize: 10, color: '#363C4D', fontFamily: 'monospace', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 4, padding: '1px 5px' }}>/{cmd.id}</span>
                </button>
              ))}
              <div style={{ padding: '4px 12px 6px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 10, color: '#363C4D', fontFamily: 'Inter, sans-serif' }}>↑↓ navigate · ↵ select · esc close</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick action menu anchor */}
        <div style={{ position: 'absolute', left: 0, bottom: '100%' }}>
          <QuickActionMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            onUploadImage={() => fileInputRef.current?.click()}
            onUploadPdf={() => pdfInputRef.current?.click()}
            onNewChat={() => onNewChat?.()}
            anchorRef={plusBtnRef as React.RefObject<HTMLElement | null>}
          />
        </div>

        <input ref={fileInputRef} type="file" accept={ACCEPTED_IMAGE_TYPES.join(',')} multiple onChange={handleFileSelect} className="hidden" />
        <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={e => { const f = e.target.files?.[0]; if (f) processPdf(f); e.target.value = ''; }} className="hidden" />

        {/* Main container — floating glass composer */}
        <motion.div
          animate={{
            boxShadow: dragOver
              ? 'var(--input-shadow-drag)'
              : focused
              ? 'var(--input-shadow-focus)'
              : 'var(--input-shadow-idle)',
          }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          style={{
            background: dragOver
              ? 'rgba(96,165,250,0.03)'
              : 'rgba(10,11,18,0.88)',
            backdropFilter: 'blur(28px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
            border: `1px solid ${dragOver ? 'rgba(96,165,250,0.28)' : focused ? 'rgba(255,255,255,0.13)' : 'rgba(255,255,255,0.075)'}`,
            borderRadius: 20,
            padding: '10px 10px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            position: 'relative',
            transition: 'border-color 0.18s ease, background 0.18s ease',
          }}
        >
          {/* Drag overlay text */}
          {dragOver && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 18,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, color: '#8B93A4', fontSize: 13.5, fontFamily: 'Inter, sans-serif',
              fontWeight: 500, zIndex: 1,
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              Drop to attach
            </div>
          )}

          {/* Plus / attachment button */}
          <motion.button
            ref={plusBtnRef}
            onClick={() => setMenuOpen(v => !v)}
            disabled={disabled}
            className="chat-action-btn"
            animate={{ rotate: menuOpen ? 45 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            style={{
              width: 32, height: 32, borderRadius: 10, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: menuOpen ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${menuOpen ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              color: menuOpen ? '#F0F0F2' : '#565E72',
              boxShadow: menuOpen ? '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)' : '0 1px 3px rgba(0,0,0,0.3)',
              transition: 'background 0.15s, border-color 0.15s, color 0.15s',
            }}
            onMouseEnter={e => {
              if (!menuOpen) {
                e.currentTarget.style.color = '#8D95A6';
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }
            }}
            onMouseLeave={e => {
              if (!menuOpen) {
                e.currentTarget.style.color = '#565E72';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }
            }}
          >
            <Plus size={14} strokeWidth={2} />
          </motion.button>

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
              flex: 1,
              background: 'transparent',
              resize: 'none',
              outline: 'none',
              border: 'none',
              color: dragOver ? 'transparent' : '#EEEEF0',
              fontFamily: 'Inter, sans-serif',
              fontSize: 14.5,
              lineHeight: '1.6',
              maxHeight: 200,
              paddingTop: 5,
              paddingBottom: 5,
              opacity: dragOver ? 0 : 1,
              transition: 'opacity 0.12s',
              caretColor: '#EEEEF0',
            }}
          />

          {/* Stop / Send */}
          {isLoading ? (
            <motion.button
              onClick={onStop}
              className="chat-action-btn"
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.90, transition: { type: 'spring', stiffness: 600, damping: 28 } }}
              style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer', color: '#F0F0F2',
                boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
              aria-label="Stop"
            >
              <svg width="9" height="9" viewBox="0 0 12 12" fill="currentColor"><rect x="1" y="1" width="10" height="10" rx="2.5" /></svg>
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSend}
              disabled={!canSend}
              className="chat-action-btn"
              animate={{
                background: canSend ? '#FFFFFF' : 'rgba(255,255,255,0.06)',
                scale: 1,
              }}
              whileHover={canSend ? { scale: 1.10 } : {}}
              whileTap={canSend ? { scale: 0.88, transition: { type: 'spring', stiffness: 600, damping: 28 } } : {}}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{
                width: 32, height: 32,
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: 'none',
                cursor: canSend ? 'pointer' : 'not-allowed',
                color: canSend ? '#07080D' : '#333847',
                opacity: canSend ? 1 : 0.35,
                boxShadow: canSend
                  ? '0 2px 12px rgba(255,255,255,0.15), 0 1px 3px rgba(0,0,0,0.4), inset 0 -1px 0 rgba(0,0,0,0.1)'
                  : 'none',
              }}
              aria-label="Send"
            >
              <ArrowUp size={14} strokeWidth={2.5} />
            </motion.button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
