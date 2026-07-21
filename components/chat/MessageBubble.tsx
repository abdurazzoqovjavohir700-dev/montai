'use client';

import { useState, useRef, memo, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Check, ThumbsUp, ThumbsDown, Share2, Download, RefreshCw,
  Pencil, ZoomIn, FileText, Terminal, BookOpen, ListOrdered, AlertCircle,
  Search, Bookmark, BookmarkCheck, ChevronDown, ChevronUp,
  Languages, AlignLeft, Sparkles, Play, MessageSquare, MoreHorizontal,
  Wand2, ArrowRight, Zap,
} from 'lucide-react';
import MarkdownRenderer from '@/components/shared/MarkdownRenderer';
import ImageLightbox from '@/components/chat/ImageLightbox';
import { formatTimestamp } from '@/lib/utils';
import { generatePdf } from '@/lib/pdf-generator';
import { toast } from '@/components/ui/Toast';
import type { Message } from '@/lib/types';

/* ─── PDF message parser ─────────────────────────────────── */
interface PdfParsed { name: string; pages: string; truncated: boolean; userText: string }
function parsePdfMessage(content: string): PdfParsed | null {
  if (!content.startsWith('[PDF_ATTACH]:')) return null;
  const sepIdx = content.indexOf('\n\n---\n\n');
  const header = content.slice(0, content.indexOf('\n\n'));
  const userText = sepIdx > -1 ? content.slice(sepIdx + 7).trim() : '';
  const match = header.match(/\*\*(.+?)\*\*\s*\((\d+)\s*sahifa(,\s*matn qisqartirildi)?/);
  if (!match) return null;
  return { name: match[1], pages: match[2], truncated: !!match[3], userText };
}

/* ─── Response type detection ────────────────────────────── */
type ResponseType = 'code' | 'tutorial' | 'list' | 'guide' | 'error' | 'research' | 'summary' | 'general';

function detectType(content: string): ResponseType {
  const codeBlocks = (content.match(/```[\s\S]*?```/g) ?? []).length;
  const lists = (content.match(/^[-*•] .+/gm) ?? []).length;
  const numbered = (content.match(/^\d+\. .+/gm) ?? []).length;
  const headings = (content.match(/^#{1,3} .+/gm) ?? []).length;
  const hasError = /error:|xato:|bug\s|issue|tuzat|fix/i.test(content.slice(0, 300));
  if (codeBlocks >= 2 || (codeBlocks >= 1 && content.length < 1200)) return 'code';
  if (numbered >= 4 && (codeBlocks >= 1 || headings >= 2)) return 'tutorial';
  if (headings >= 3) return 'guide';
  if (lists + numbered >= 5) return 'list';
  if (hasError && codeBlocks >= 1) return 'error';
  if (headings >= 2) return 'research';
  if (content.length < 450 && headings === 0) return 'summary';
  return 'general';
}

const TYPE_META: Record<ResponseType, { label: string; color: string; bg: string; icon: React.ReactNode } | null> = {
  code:     { label: 'Kod',         color: '#60A5FA', bg: 'rgba(96,165,250,0.1)',  icon: <Terminal    size={10} strokeWidth={1.5}/> },
  tutorial: { label: "Qo'llanma",   color: '#A78BFA', bg: 'rgba(167,139,250,0.1)', icon: <BookOpen    size={10} strokeWidth={1.5}/> },
  list:     { label: "Ro'yxat",     color: '#34D399', bg: 'rgba(52,211,153,0.1)',  icon: <ListOrdered size={10} strokeWidth={1.5}/> },
  guide:    { label: "Yo'riqnoma",  color: '#94A3B8', bg: 'rgba(148,163,184,0.1)', icon: <Play        size={10} strokeWidth={1.5}/> },
  error:    { label: 'Tuzatish',    color: '#F87171', bg: 'rgba(248,113,113,0.1)', icon: <AlertCircle size={10} strokeWidth={1.5}/> },
  research: { label: 'Tahlil',      color: '#38BDF8', bg: 'rgba(56,189,248,0.1)',  icon: <Search      size={10} strokeWidth={1.5}/> },
  summary:  { label: 'Xulosa',      color: '#A1A1AA', bg: 'rgba(161,161,170,0.1)', icon: <AlignLeft   size={10} strokeWidth={1.5}/> },
  general:  null,
};

function calcReadTime(text: string): string {
  const words = text.trim().split(/\s+/).length;
  const mins = Math.ceil(words / 200);
  return mins <= 1 ? '~1 min' : `~${mins} min`;
}

/* ─── PDF fallback export ─────────────────────────────────── */
function exportAsPdf(content: string, createdAt: string) {
  const date = new Date(createdAt).toLocaleDateString('uz-UZ', { year:'numeric', month:'long', day:'numeric' });
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Montai AI</title>
<style>body{font-family:system-ui,sans-serif;max-width:800px;margin:48px auto;padding:0 24px;color:#111;line-height:1.8}
.hdr{border-bottom:2px solid #60A5FA;padding-bottom:16px;margin-bottom:32px;display:flex;justify-content:space-between}
.logo{font-size:20px;font-weight:800;color:#1e293b}pre{background:#f3f4f6;padding:16px;border-radius:8px;overflow-x:auto;font-size:13px}
h1,h2,h3{margin:1.4em 0 .6em}@media print{@page{margin:20mm}}</style>
</head><body><div class="hdr"><div class="logo">Montai AI</div><span style="color:#9ca3af;font-size:12px">${date}</span></div>
<pre style="white-space:pre-wrap;font-family:inherit;background:none;padding:0">${content.replace(/</g,'&lt;')}</pre>
<script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  win.document.close();
}

/* ════════════════════════════════════════════════════════════
   PREMIUM ICON BUTTON — used in toolbar
   ════════════════════════════════════════════════════════════ */
function ToolBtn({
  onClick, title, active, children, danger,
}: {
  onClick?: () => void;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  const [hov, setHov] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      animate={{
        scale: pressed ? 0.92 : hov ? 1.05 : 1,
        y: hov && !pressed ? -1 : 0,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 26 }}
      style={{
        width: 30, height: 30,
        borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active
          ? 'rgba(96,165,250,0.1)'
          : hov
          ? danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.07)'
          : 'transparent',
        border: active
          ? '1px solid rgba(96,165,250,0.25)'
          : hov
          ? danger ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.1)'
          : '1px solid transparent',
        color: active ? '#60A5FA' : hov ? (danger ? '#F87171' : '#D4D4D8') : '#52525B',
        cursor: 'pointer',
        boxShadow: active ? '0 0 8px rgba(96,165,250,0.15)' : hov ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
        transition: 'background 0.12s, border-color 0.12s, color 0.12s, box-shadow 0.12s',
        flexShrink: 0,
      }}
    >
      {children}
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════════════
   PREMIUM SMART ACTION PILL
   ════════════════════════════════════════════════════════════ */
function SmartPill({
  onClick, icon, label, active, color,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  color?: string;
}) {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);

  const accentColor = color ?? '#71717A';
  const accentBg = color ? `${color}15` : 'rgba(255,255,255,0.05)';
  const accentBorder = color ? `${color}25` : 'rgba(255,255,255,0.08)';

  return (
    <motion.button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      animate={{
        scale: pressed ? 0.95 : hov ? 1.03 : 1,
        y: hov && !pressed ? -1 : 0,
      }}
      transition={{ type: 'spring', stiffness: 480, damping: 24 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '4px 11px', borderRadius: 20,
        background: active || hov ? accentBg : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active || hov ? accentBorder : 'rgba(255,255,255,0.07)'}`,
        color: active || hov ? accentColor : '#52525B',
        fontSize: 11.5, fontWeight: 500,
        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
        whiteSpace: 'nowrap', flexShrink: 0,
        boxShadow: hov ? '0 2px 10px rgba(0,0,0,0.25)' : 'none',
        transition: 'background 0.12s, border-color 0.12s, color 0.12s',
        letterSpacing: '-0.01em',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', opacity: active || hov ? 1 : 0.7 }}>
        {icon}
      </span>
      {label}
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════════════
   TEXT SELECTION MENU
   ════════════════════════════════════════════════════════════ */
function SelectionMenu({ onAction }: { onAction: (action: string, text: string) => void }) {
  const [menu, setMenu] = useState<{ x: number; y: number; text: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? '';
        if (text.length < 15 || !sel?.rangeCount) { setMenu(null); return; }
        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setMenu({ x: rect.left + rect.width / 2, y: rect.top + window.scrollY - 8, text });
      }, 180);
    };
    const handleSelChange = () => {
      const text = window.getSelection()?.toString().trim() ?? '';
      if (!text) setMenu(null);
    };
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelChange);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelChange);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!menu) return null;

  const ACTIONS = [
    { id: 'explain',   label: 'Tushuntir', icon: <BookOpen size={11} strokeWidth={1.5}/>,  color: '#60A5FA' },
    { id: 'translate', label: "O'zbek",    icon: <Languages size={11} strokeWidth={1.5}/>, color: '#34D399' },
    { id: 'improve',   label: 'Yaxshila',  icon: <Wand2 size={11} strokeWidth={1.5}/>,     color: '#A78BFA' },
    { id: 'summarize', label: 'Xulosa',    icon: <AlignLeft size={11} strokeWidth={1.5}/>, color: '#94A3B8' },
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 4, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.96 }}
        transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          left: menu.x, top: menu.y,
          transform: 'translate(-50%, -100%)',
          zIndex: 9000,
          display: 'flex', gap: 2,
          padding: '4px 6px', borderRadius: 12,
          background: 'rgba(18,18,22,0.97)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}
      >
        {/* Caret */}
        <div style={{
          position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)',
          width: 10, height: 5,
          background: 'rgba(18,18,22,0.97)',
          clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
        }}/>
        {ACTIONS.map(a => (
          <button
            key={a.id}
            onClick={() => { onAction(a.id, menu.text); setMenu(null); window.getSelection()?.removeAllRanges(); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 8,
              background: 'transparent', border: 'none',
              color: '#71717A', fontSize: 11.5,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              transition: 'all 0.1s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.background = `${a.color}15`;
              (e.currentTarget as HTMLElement).style.color = a.color;
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.background = 'transparent';
              (e.currentTarget as HTMLElement).style.color = '#71717A';
            }}
          >
            <span style={{ color: 'inherit', display: 'flex' }}>{a.icon}</span>
            {a.label}
          </button>
        ))}
      </motion.div>
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════════════════════════
   USER BUBBLE
   ════════════════════════════════════════════════════════════ */
function UserBubble({ message, onEditResend }: Props) {
  const [lightbox, setLightbox]   = useState(false);
  const [editing, setEditing]     = useState(false);
  const [editVal, setEditVal]     = useState(message.content);
  const [copied, setCopied]       = useState(false);
  const [hov, setHov]             = useState(false);
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const imageUrls = message.imageUrls ?? (message.imageUrl ? [message.imageUrl] : []);
  const hasImage = imageUrls.length > 0;
  const pdfParsed = !hasImage ? parsePdfMessage(message.content) : null;
  const displayContent = pdfParsed ? pdfParsed.userText : message.content;
  const hasText = !!displayContent.trim();

  if (editing) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        className="flex justify-end w-full"
        style={{ padding: '6px 0' }}
      >
        <div style={{
          maxWidth: '78%', width: '100%',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 16, padding: '14px 16px',
          border: '1px solid rgba(255,255,255,0.09)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
        }}>
          <textarea
            ref={textareaRef}
            value={editVal}
            onChange={e => setEditVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); }
              if (e.key === 'Escape') { setEditVal(message.content); setEditing(false); }
            }}
            rows={3}
            style={{
              width: '100%', background: 'transparent', border: 'none', outline: 'none',
              color: '#FAFAFA', fontSize: 15, lineHeight: 1.65,
              resize: 'none', minHeight: 60, fontFamily: 'Inter, sans-serif',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
            <button
              onClick={() => { setEditVal(message.content); setEditing(false); }}
              style={{ padding: '7px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717A', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter,sans-serif' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#71717A'; }}
            >Bekor</button>
            <button
              onClick={saveEdit}
              style={{ padding: '7px 16px', borderRadius: 9, border: 'none', background: '#FFFFFF', color: '#08090D', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
            >Saqlash</button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 24, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.8 }}
      className="flex justify-end w-full"
      style={{ padding: '6px 0' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
    >
      <div style={{ maxWidth: 'var(--msg-bubble-max, 78%)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
        {pdfParsed && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px',
            background: 'rgba(96,165,250,0.06)', border: '1px solid rgba(96,165,250,0.15)',
            borderRadius: 12, marginBottom: hasText ? 6 : 0, maxWidth: 260,
          }}>
            <div style={{ width:34,height:34,borderRadius:8,flexShrink:0,background:'rgba(96,165,250,0.08)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              <FileText size={17} strokeWidth={1.5} style={{ color:'#60A5FA' }}/>
            </div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:12.5,fontWeight:600,color:'#8B93A4',fontFamily:'Inter,sans-serif',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:170 }}>
                {pdfParsed.name}
              </div>
              <div style={{ fontSize:11,color:'#71717A',fontFamily:'Inter,sans-serif',marginTop:2 }}>
                PDF · {pdfParsed.pages} sahifa{pdfParsed.truncated ? ' · qisqartirildi' : ''}
              </div>
            </div>
          </div>
        )}

        {(hasImage || hasText) && (
          <div
            className="message-user-bubble"
            style={{ background:'rgba(255,255,255,0.08)',borderRadius:hasImage&&!hasText?'16px':'18px 18px 4px 18px',border:'1px solid rgba(255,255,255,0.07)',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.2)' }}
          >
            {hasImage && (
              <div style={{ display:'grid',gridTemplateColumns:imageUrls.length===1?'1fr':'1fr 1fr',gap:2,background:'rgba(0,0,0,0.2)' }}>
                {imageUrls.map((url, idx) => (
                  <div key={idx} onClick={() => setLightbox(true)} style={{ position:'relative',cursor:'pointer' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Rasm ${idx+1}`} style={{ display:'block',width:'100%',maxWidth:imageUrls.length===1?'320px':'160px',maxHeight:imageUrls.length===1?'260px':'160px',height:'auto',objectFit:'cover' }}/>
                    <div className="image-zoom-overlay" style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0)',transition:'background 0.18s' }}>
                      <div className="image-zoom-icon" style={{ width:30,height:30,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'rgba(255,255,255,0)',background:'rgba(0,0,0,0)',transition:'all 0.18s' }}>
                        <ZoomIn size={16} strokeWidth={1.5}/>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {hasText && (
              <div
                onClick={(!hasImage && !pdfParsed) ? startEdit : undefined}
                style={{ padding:hasImage?'10px 14px':'12px 16px',fontSize:15,lineHeight:1.65,letterSpacing:'-0.005em',color:'#F4F4F5',wordBreak:'break-word',whiteSpace:'pre-wrap',cursor:(!hasImage&&!pdfParsed)?'pointer':'default',fontFamily:'Inter,sans-serif' }}
              >
                {displayContent}
              </div>
            )}
          </div>
        )}

        {/* Hover meta row */}
        <motion.div
          animate={{ opacity: hov ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          style={{ display: 'flex', alignItems: 'center', gap: 4, height: 24, pointerEvents: hov ? 'auto' : 'none' }}
        >
          <span style={{ fontSize:11,color:'#3F3F46',fontFamily:'Inter,sans-serif' }}>{formatTimestamp(message.createdAt)}</span>
          <ToolBtn onClick={handleCopy} title="Nusxalash" active={copied}>
            {copied ? <Check size={12} strokeWidth={2}/> : <Copy size={12} strokeWidth={1.5}/>}
          </ToolBtn>
          <ToolBtn onClick={startEdit} title="Tahrirlash">
            <Pencil size={12} strokeWidth={1.5}/>
          </ToolBtn>
        </motion.div>
      </div>
      {hasImage && <ImageLightbox src={imageUrls[0]} isOpen={lightbox} onClose={() => setLightbox(false)}/>}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════
   PREMIUM AI RESPONSE TOOLBAR
   — Hover safe-zone: invisible bridge between content & toolbar
   — 400ms delayed hide, instant show
   — Glass pill design
   ════════════════════════════════════════════════════════════ */
function AIToolbar({
  message, onRegenerate, onQuickAction,
  visible, onMouseEnter, onMouseLeave,
}: {
  message: Message;
  onRegenerate?: (id: string) => void;
  onQuickAction?: (p: string) => void;
  visible: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const [copied, setCopied]         = useState(false);
  const [liked, setLiked]           = useState<'up'|'down'|null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [showMore, setShowMore]     = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ marginTop: 10, userSelect: 'none' }}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key="toolbar"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            {/* ── Row 1: Icon actions ── */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 2,
              padding: '3px 5px', borderRadius: 12,
              background: 'rgba(18,18,22,0.9)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
              flexWrap: 'wrap',
            }}>
              <ToolBtn onClick={handleCopy} title={copied ? 'Nusxalandi!' : 'Nusxalash'} active={copied}>
                {copied ? <Check size={13} strokeWidth={2}/> : <Copy size={13} strokeWidth={1.5}/>}
              </ToolBtn>

              <ToolBtn onClick={() => onRegenerate?.(message.id)} title="Qayta yoz">
                <RefreshCw size={13} strokeWidth={1.5}/>
              </ToolBtn>

              <ToolBtn onClick={() => setLiked(l => l==='up' ? null : 'up')} title="Yaxshi" active={liked==='up'}>
                <ThumbsUp size={13} strokeWidth={1.5}/>
              </ToolBtn>

              <ToolBtn onClick={() => setLiked(l => l==='down' ? null : 'down')} title="Yomon" active={liked==='down'}>
                <ThumbsDown size={13} strokeWidth={1.5}/>
              </ToolBtn>

              <ToolBtn onClick={() => setBookmarked(v => !v)} title={bookmarked ? "Saqlangan" : "Saqlash"} active={bookmarked}>
                {bookmarked ? <BookmarkCheck size={13} strokeWidth={1.5}/> : <Bookmark size={13} strokeWidth={1.5}/>}
              </ToolBtn>

              {/* Separator */}
              <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.07)', margin: '0 3px', flexShrink: 0 }}/>

              <ToolBtn
                onClick={() => generatePdf({ title:'Montai Javob', content:message.content, filename:`montai_${Date.now()}.pdf` }).catch(()=>exportAsPdf(message.content, message.createdAt))}
                title="PDF saqlash"
              >
                <FileText size={13} strokeWidth={1.5}/>
              </ToolBtn>

              <ToolBtn
                onClick={async () => {
                  if (navigator.share) {
                    await navigator.share({ text: message.content }).catch(() => {});
                  } else {
                    await navigator.clipboard.writeText(message.content);
                    toast.success('Matn nusxalandi!');
                  }
                }}
                title="Ulashish / Nusxalash"
              >
                <Share2 size={13} strokeWidth={1.5}/>
              </ToolBtn>

              <ToolBtn
                onClick={() => { const b=new Blob([message.content],{type:'text/plain'});const u=URL.createObjectURL(b);const a=document.createElement('a');a.href=u;a.download='montai-javob.txt';a.click();URL.revokeObjectURL(u); }}
                title="TXT yuklab olish"
              >
                <Download size={13} strokeWidth={1.5}/>
              </ToolBtn>

              <ToolBtn onClick={() => setShowMore(v => !v)} title="Ko'proq" active={showMore}>
                <MoreHorizontal size={13} strokeWidth={1.5}/>
              </ToolBtn>
            </div>

            {/* ── Row 2: Smart action pills ── */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <SmartPill
                onClick={() => onQuickAction?.("Yuqoridagi javobni yanada soddalashtir — texnik atamalar o'rniga kundalik misollar bilan tushuntir")}
                icon={<Sparkles size={11} strokeWidth={1.5}/>}
                label="Soddaroq"
                color="#A78BFA"
              />
              <SmartPill
                onClick={() => onQuickAction?.("Iltimos, davom ettir")}
                icon={<ArrowRight size={11} strokeWidth={1.5}/>}
                label="Davom et"
                color="#60A5FA"
              />
              <SmartPill
                onClick={() => onQuickAction?.("Yuqoridagi javobni o'zbek tiliga tarjima qil")}
                icon={<Languages size={11} strokeWidth={1.5}/>}
                label="O'zbek"
                color="#34D399"
              />
              <SmartPill
                onClick={() => onQuickAction?.("Yuqoridagi javobni 3-4 qatorda qisqacha xulosalab ber")}
                icon={<AlignLeft size={11} strokeWidth={1.5}/>}
                label="Xulosa"
                color="#94A3B8"
              />
              <SmartPill
                onClick={() => onQuickAction?.("Ushbu mavzuni yanada chuqurroq, professionalroq darajada tushuntir")}
                icon={<Zap size={11} strokeWidth={1.5}/>}
                label="Kengaytir"
                color="#F87171"
              />
            </div>

            {/* ── Extended (More) ── */}
            <AnimatePresence>
              {showMore && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingTop: 2 }}>
                    <SmartPill
                      onClick={() => onQuickAction?.("Yuqoridagi javob asosida 5 ta qo'shimcha savol taklif qil")}
                      icon={<MessageSquare size={11} strokeWidth={1.5}/>}
                      label="Savollar"
                    />
                    <SmartPill
                      onClick={() => onQuickAction?.("Yuqoridagi mazmunni jadval ko'rinishida qayta formatlash")}
                      icon={<ListOrdered size={11} strokeWidth={1.5}/>}
                      label="Jadval"
                    />
                    <SmartPill
                      onClick={() => onQuickAction?.("Ushbu mavzuga oid real dunyo misoli keltir")}
                      icon={<Play size={11} strokeWidth={1.5}/>}
                      label="Misol"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   AI BUBBLE — with hover safe-zone fix
   ════════════════════════════════════════════════════════════ */
interface Props {
  message: Message;
  onEditResend?: (id: string, newContent: string) => void;
  onRegenerate?: (id: string) => void;
  onQuickAction?: (action: string) => void;
}

function AIBubble({ message, onRegenerate, onQuickAction }: Props) {
  const [toolbarVisible, setToolbarVisible] = useState(false);
  const [collapsed, setCollapsed]           = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isStreaming = message.id === 'streaming';

  const responseType = useMemo(() =>
    isStreaming ? 'general' as ResponseType : detectType(message.content),
    [message.content, isStreaming]
  );
  const readTime = useMemo(() => calcReadTime(message.content), [message.content]);
  const typeMeta = TYPE_META[responseType];
  const isLong = message.content.length > 3200;

  /* ── Hover safe-zone logic ─────────────────────────────────────
     Both the message content AND the toolbar share the same
     enter/leave handlers via a single clearTimeout + setTimeout.
     Moving from message → toolbar cancels the hide timer → no flicker.
  ───────────────────────────────────────────────────────────────── */
  const handleEnter = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setToolbarVisible(true);
  }, []);

  const handleLeave = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setToolbarVisible(false), 420);
  }, []);

  useEffect(() => () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); }, []);

  const handleSelectionAction = useCallback((action: string, text: string) => {
    const prompts: Record<string, string> = {
      explain:   `Quyidagi matnni batafsil tushuntir:\n\n"${text}"`,
      translate: `Quyidagi matnni o'zbek tiliga tarjima qil:\n\n"${text}"`,
      improve:   `Quyidagi matnni yaxshila va professional qil:\n\n"${text}"`,
      summarize: `Quyidagi matnni 2-3 qatorda xulosalab ber:\n\n"${text}"`,
    };
    const prompt = prompts[action];
    if (prompt) onQuickAction?.(prompt);
  }, [onQuickAction]);

  return (
    <>
      {!isStreaming && <SelectionMenu onAction={handleSelectionAction}/>}
      <motion.div
        initial={{ opacity:0, x:-16, scale:0.97 }}
        animate={{ opacity:1, x:0, scale:1 }}
        transition={{ type:'spring', stiffness:340, damping:26, mass:0.85 }}
        className="flex items-start gap-3 w-full"
        style={{ padding: '10px 0' }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {/* Avatar */}
        <motion.div
          initial={{ scale:0.6, opacity:0 }}
          animate={{ scale:1, opacity:1 }}
          transition={{ type:'spring', stiffness:400, damping:22, delay:0.06 }}
          style={{
            width:30, height:30, borderRadius:'50%', flexShrink:0,
            background:'rgba(255,255,255,0.06)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:11, fontWeight:700, color:'#EEEEF0',
            fontFamily:'var(--font-display,Manrope,sans-serif)',
            border:'1px solid rgba(255,255,255,0.1)',
            boxShadow:'0 2px 8px rgba(0,0,0,0.3)',
            marginTop:1,
          }}
        >
          M
        </motion.div>

        <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
          {/* Header: type badge + meta */}
          {!isStreaming && (
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ delay:0.1, duration:0.2 }}
              style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}
            >
              {typeMeta && (
                <span style={{
                  display:'inline-flex', alignItems:'center', gap:5,
                  padding:'2px 8px', borderRadius:20,
                  background:typeMeta.bg, color:typeMeta.color,
                  fontSize:10.5, fontWeight:500, fontFamily:'Inter,sans-serif',
                }}>
                  {typeMeta.icon} {typeMeta.label}
                </span>
              )}
              <span style={{ fontSize:11, color:'#3F3F46', fontFamily:'Inter,sans-serif', display:'flex', alignItems:'center', gap:3 }}>
                <MessageSquare size={10} strokeWidth={1.5} style={{ opacity:0.5 }}/>
                {readTime}
              </span>
              <span style={{ fontSize:11, color:'#3F3F46', fontFamily:'Inter,sans-serif', marginLeft:'auto' }}>
                {formatTimestamp(message.createdAt)}
              </span>
            </motion.div>
          )}

          {/* Content */}
          <div style={{ position:'relative' }}>
            <div
              style={{
                maxHeight: isLong && collapsed ? 320 : 'none',
                overflow: isLong && collapsed ? 'hidden' : 'visible',
                transition: 'max-height 0.3s ease',
              }}
              className={isStreaming ? 'streaming-cursor' : ''}
            >
              <div className="message-ai-text" style={{ color:'#E4E4E7', fontSize:'15.5px', lineHeight:'1.85', letterSpacing:'-0.01em', fontFamily:'Inter,sans-serif' }}>
                <MarkdownRenderer content={message.content}/>
              </div>
            </div>
            {isLong && collapsed && (
              <div style={{ position:'absolute',bottom:0,left:0,right:0,height:80,background:'linear-gradient(transparent,var(--bg-primary,#0D0D0D))',pointerEvents:'none' }}/>
            )}
          </div>

          {isLong && !isStreaming && (
            <button
              onClick={() => setCollapsed(v => !v)}
              style={{
                alignSelf:'flex-start', display:'flex', alignItems:'center', gap:5,
                padding:'4px 12px', borderRadius:20, marginTop:8,
                background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.09)',
                color:'#71717A', fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif',
                transition:'all 0.13s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.09)'; (e.currentTarget as HTMLElement).style.color='#FAFAFA'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color='#71717A'; }}
            >
              {collapsed ? <ChevronDown size={12} strokeWidth={1.5}/> : <ChevronUp size={12} strokeWidth={1.5}/>}
              {collapsed ? "To'liq ko'rish" : "Yig'ish"}
            </button>
          )}

          {/* ── PREMIUM TOOLBAR with hover safe-zone ── */}
          {!isStreaming && (
            <AIToolbar
              message={message}
              onRegenerate={onRegenerate}
              onQuickAction={onQuickAction}
              visible={toolbarVisible}
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            />
          )}
        </div>
      </motion.div>
    </>
  );
}

/* ─── Export ─────────────────────────────────────────────── */
function MessageBubble(props: Props) {
  if (props.message.role === 'user') return <UserBubble {...props}/>;
  return <AIBubble {...props}/>;
}

export default memo(MessageBubble);
