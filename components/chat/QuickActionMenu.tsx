'use client';

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon, Settings, MessageSquarePlus, Clipboard,
  Search, X, Clock, ChevronRight,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Action {
  id: string;
  label: string;
  labelUz: string;
  icon: React.ReactNode;
  group: string;
  keywords: string[];
  available: boolean;
  badge?: string;
  onSelect?: () => void;
}

interface QuickActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadImage: () => void;
  onUploadPdf?: () => void;
  onNewChat: () => void;
  /** Ref to the "+" anchor element for positioning */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

const RECENT_KEY = 'montai_recent_actions';
const MAX_RECENT = 3;

function getRecent(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}
function saveRecent(id: string) {
  const prev = getRecent().filter(r => r !== id);
  localStorage.setItem(RECENT_KEY, JSON.stringify([id, ...prev].slice(0, MAX_RECENT)));
}

export default function QuickActionMenu({
  isOpen, onClose, onUploadImage, onUploadPdf, onNewChat, anchorRef,
}: QuickActionMenuProps) {
  const router = useRouter();
  const [query, setQuery]   = useState('');
  const [focused, setFocused] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [pos, setPos]       = useState({ bottom: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef  = useRef<HTMLDivElement>(null);
  const listRef   = useRef<HTMLDivElement>(null);

  const [canInteract, setCanInteract] = useState(false);

  // Portal mounting
  useEffect(() => { setMounted(true); }, []);

  // Position panel above anchor
  const updatePosition = useCallback(() => {
    if (!anchorRef?.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({
      bottom: window.innerHeight - rect.top + 10,
      left: Math.min(rect.left, window.innerWidth - 352),
    });
  }, [anchorRef]);

  // useLayoutEffect: position is computed before browser paints → animation starts from correct position
  useLayoutEffect(() => {
    if (!isOpen) { setCanInteract(false); return; }
    updatePosition();
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery('');
    setFocused(0);
    setRecent(getRecent());
    // Block accidental ghost taps on mobile for 350ms after open
    const interactTimer = setTimeout(() => setCanInteract(true), 350);
    // Focus search only on non-touch devices (touch devices get keyboard popup)
    const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
    const focusTimer = isTouchDevice ? null : setTimeout(() => searchRef.current?.focus(), 60);
    return () => {
      clearTimeout(interactTimer);
      if (focusTimer) clearTimeout(focusTimer);
    };
  }, [isOpen]);

  // ─── Outside click — mousedown + touchstart for mobile ───────────────────
  useEffect(() => {
    if (!isOpen) return;
    let active = false;
    const t = setTimeout(() => { active = true; }, 50);

    const isOutside = (node: Node | null) => {
      if (!node) return false;
      if (panelRef.current?.contains(node)) return false;
      if (anchorRef?.current?.contains(node)) return false;
      return true;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!active) return;
      if (isOutside(e.target as Node)) onClose();
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (!active) return;
      const touch = e.touches[0];
      if (!touch) return;
      if (isOutside(touch.target as Node)) onClose();
    };

    document.addEventListener('mousedown', handleMouseDown, { capture: true });
    document.addEventListener('touchstart', handleTouchStart, { capture: true, passive: true });
    return () => {
      clearTimeout(t);
      document.removeEventListener('mousedown', handleMouseDown, { capture: true });
      document.removeEventListener('touchstart', handleTouchStart, { capture: true });
    };
  }, [isOpen, onClose, anchorRef]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const handleSelect = useCallback((action: Action) => {
    if (!action.available) return;
    saveRecent(action.id);
    setRecent(getRecent());
    action.onSelect?.();
    onClose();
  }, [onClose]);

  const actions: Action[] = [
    {
      id: 'upload-image', label: 'Upload Images', labelUz: 'Rasm yuklash',
      icon: <ImageIcon size={16} strokeWidth={1.5} />, group: 'Fayllar',
      keywords: ['rasm', 'image', 'photo', 'upload'],
      available: true, onSelect: onUploadImage,
    },
    {
      id: 'upload-pdf', label: 'Upload PDF', labelUz: 'PDF yuklash',
      icon: <FileText size={16} strokeWidth={1.5} />, group: 'Fayllar',
      keywords: ['pdf', 'hujjat', 'document'], available: !!onUploadPdf,
      onSelect: onUploadPdf,
    },
    {
      id: 'paste-clipboard', label: 'Paste from Clipboard', labelUz: 'Clipboard dan joylashtirish',
      icon: <Clipboard size={16} strokeWidth={1.5} />, group: 'Fayllar',
      keywords: ['paste', 'clipboard', 'ctrl+v'],
      available: true,
      onSelect: async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            const ta = document.querySelector<HTMLTextAreaElement>('textarea[placeholder]');
            if (ta) {
              const nativeInput = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
              nativeInput?.set?.call(ta, ta.value + text);
              ta.dispatchEvent(new Event('input', { bubbles: true }));
              ta.focus();
            }
          }
        } catch { /* clipboard access denied */ }
      },
    },
    {
      id: 'new-chat', label: 'New Chat', labelUz: 'Yangi chat',
      icon: <MessageSquarePlus size={16} strokeWidth={1.5} />, group: 'Workspace',
      keywords: ['yangi', 'new', 'chat'], available: true, onSelect: onNewChat,
    },
    {
      id: 'settings', label: 'Settings', labelUz: 'Sozlamalar',
      icon: <Settings size={16} strokeWidth={1.5} />, group: 'Workspace',
      keywords: ['sozlamalar', 'settings', 'profil'],
      available: true, onSelect: () => router.push('/settings'),
    },
  ];

  const availableActions = actions.filter(a => a.available !== false);

  const filtered = query.trim()
    ? availableActions.filter(a =>
        a.labelUz.toLowerCase().includes(query.toLowerCase()) ||
        a.label.toLowerCase().includes(query.toLowerCase()) ||
        a.keywords.some(k => k.includes(query.toLowerCase()))
      )
    : availableActions;

  const groups = filtered.reduce<Record<string, Action[]>>((acc, a) => {
    if (!acc[a.group]) acc[a.group] = [];
    acc[a.group].push(a);
    return acc;
  }, {});

  const recentActions = !query.trim()
    ? actions.filter(a => recent.includes(a.id) && a.available)
    : [];

  // ─── Keyboard navigation ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocused(f => Math.min(f + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setFocused(f => Math.max(f - 1, 0)); }
      if (e.key === 'Enter') {
        e.preventDefault();
        const a = filtered[focused]; if (a) handleSelect(a);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, focused, filtered, handleSelect, onClose]);

  // Scroll focused item into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${focused}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [focused]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, scale: 0.94, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1], type: 'tween' }}
          // Prevent mouse events from reaching document listener
          onMouseDown={e => e.stopPropagation()}
          style={{
            willChange: 'transform, opacity',
            position: 'fixed',
            bottom: pos.bottom,
            left: Math.max(8, Math.min(pos.left, window.innerWidth - 352)),
            width: 340,
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: 480,
            background: 'rgba(17,17,20,0.97)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 16,
            boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.06)',
            overflow: 'hidden',
            zIndex: 9998,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search header */}
          <div style={{
            padding: '12px 14px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <Search size={14} strokeWidth={1.5} style={{ color: '#52525B', flexShrink: 0 }} />
            <input
              ref={searchRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setFocused(0); }}
              placeholder="Amal qidiring…"
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: '#FAFAFA', fontSize: 13.5, fontFamily: 'Inter, sans-serif',
                caretColor: '#60A5FA',
              }}
            />
            {query && (
              <button
                onMouseDown={e => e.preventDefault()} // prevent blur on search
                onClick={() => { setQuery(''); setFocused(0); searchRef.current?.focus(); }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#52525B', lineHeight: 0, padding: 2,
                }}
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            )}
          </div>

          {/* Actions list — pointer-events blocked for first 350ms to prevent ghost taps on mobile */}
          <div ref={listRef} style={{ overflowY: 'auto', flex: 1, padding: '8px 0', pointerEvents: canInteract ? 'auto' : 'none' }}>

            {/* Recently used */}
            {recentActions.length > 0 && !query && (
              <div style={{ marginBottom: 4 }}>
                <div style={{
                  padding: '4px 14px 6px',
                  fontSize: 10.5, color: '#3F3F46', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Clock size={10} strokeWidth={1.5} />
                  So&apos;nggi ishlatilgan
                </div>
                {recentActions.map(a => (
                  <ActionRow
                    key={a.id}
                    action={a}
                    idx={filtered.indexOf(a)}
                    focused={focused}
                    onSelect={handleSelect}
                    onHover={setFocused}
                  />
                ))}
                <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '8px 0' }} />
              </div>
            )}

            {/* Grouped actions */}
            {Object.entries(groups).map(([group, groupActions]) => (
              <div key={group} style={{ marginBottom: 4 }}>
                <div style={{
                  padding: '4px 14px 6px',
                  fontSize: 10.5, color: '#3F3F46', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {group}
                </div>
                {groupActions.map(a => (
                  <ActionRow
                    key={a.id}
                    action={a}
                    idx={filtered.indexOf(a)}
                    focused={focused}
                    onSelect={handleSelect}
                    onHover={setFocused}
                  />
                ))}
              </div>
            ))}

            {filtered.length === 0 && (
              <div style={{
                padding: '32px 14px', textAlign: 'center',
                color: '#52525B', fontSize: 13, fontFamily: 'Inter, sans-serif',
              }}>
                Hech narsa topilmadi
              </div>
            )}
          </div>

          {/* Footer hints */}
          <div style={{
            padding: '8px 14px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 10.5, color: '#3F3F46', fontFamily: 'Inter, sans-serif' }}>
              ↑↓ navigatsiya · Enter tanlash · Esc yopish
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ─── ActionRow ─────────────────────────────────────────── */
function ActionRow({
  action, idx, focused, onSelect, onHover,
}: {
  action: Action;
  idx: number;
  focused: number;
  onSelect: (a: Action) => void;
  onHover: (idx: number) => void;
}) {
  const isFocused = idx === focused;
  return (
    <button
      data-idx={idx}
      onMouseDown={e => {
        // Prevent focus from leaving search input
        e.preventDefault();
        if (action.available) onSelect(action);
      }}
      onMouseEnter={() => onHover(idx)}
      style={{
        width: '100%', padding: '9px 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        background: isFocused && action.available ? 'rgba(96,165,250,0.08)' : 'transparent',
        border: 'none', cursor: action.available ? 'pointer' : 'default',
        textAlign: 'left', transition: 'background 0.1s',
        opacity: action.available ? 1 : 0.45,
      }}
    >
      <span style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: isFocused && action.available ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
        color: isFocused && action.available ? '#60A5FA' : '#71717A',
        transition: 'all 0.1s',
      }}>
        {action.icon}
      </span>

      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          display: 'block', fontSize: 13.5, fontWeight: 500,
          color: isFocused && action.available ? '#60A5FA' : '#D4D4D8',
          fontFamily: 'Inter, sans-serif',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {action.labelUz}
        </span>
      </span>

      {action.badge && (
        <span style={{
          fontSize: 10, fontWeight: 600, color: '#52525B',
          background: 'rgba(255,255,255,0.06)',
          padding: '2px 7px', borderRadius: 20,
          fontFamily: 'Inter, sans-serif', flexShrink: 0, whiteSpace: 'nowrap',
        }}>
          {action.badge}
        </span>
      )}

      {action.available && isFocused && (
        <ChevronRight size={12} strokeWidth={1.5} style={{ color: '#60A5FA', flexShrink: 0 }} />
      )}
    </button>
  );
}
