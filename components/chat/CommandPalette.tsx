'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  Settings,
  MessageSquare,
  Zap,
  FileText,
  ChevronRight,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
}

interface CommandPaletteProps {
  onNewChat?: () => void;
  recentChats?: Array<{ id: string; title: string }>;
}

export default function CommandPalette({
  onNewChat,
  recentChats = [],
}: CommandPaletteProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelected(0);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [close]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const ACTIONS: CommandItem[] = [
    {
      id: 'new-chat',
      label: 'Yangi suhbat',
      description: 'Yangi chat boshlash',
      badge: 'N',
      icon: <Plus size={16} strokeWidth={1.5} />,
      action: () => {
        onNewChat?.();
        close();
      },
    },
    {
      id: 'settings',
      label: 'Sozlamalar',
      description: 'Ilova sozlamalari',
      icon: <Settings size={16} strokeWidth={1.5} />,
      action: () => {
        window.location.href = '/settings';
        close();
      },
    },
    {
      id: 'analyze',
      label: 'Rasm tahlil qil',
      description: 'Screenshot yoki rasm yuklash',
      icon: <Zap size={16} strokeWidth={1.5} />,
      action: () => {
        close();
        document.getElementById('cmd-file-trigger')?.click();
      },
    },
    {
      id: 'pdf',
      label: "PDF yuklash va tahlil",
      description: "PDF hujjatni o'qib tahlil qilish",
      icon: <FileText size={16} strokeWidth={1.5} />,
      action: () => {
        close();
      },
    },
  ];

  const recentItems: CommandItem[] = recentChats.slice(0, 5).map((c) => ({
    id: `chat-${c.id}`,
    label: c.title,
    description: 'Suhbat',
    icon: <MessageSquare size={15} strokeWidth={1.5} />,
    action: () => {
      window.location.href = `/chat/${c.id}`;
      close();
    },
  }));

  const allItems = [...ACTIONS, ...recentItems];
  const filtered = query
    ? allItems.filter(
        (i) =>
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          i.description?.toLowerCase().includes(query.toLowerCase()),
      )
    : allItems;

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelected((s) => (s + 1) % filtered.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelected((s) => (s - 1 + filtered.length) % filtered.length);
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      filtered[selected]?.action();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={close}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'fixed',
              top: '18%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 10000,
              width: 'min(560px, 92vw)',
              background: 'rgba(18,18,21,0.97)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow:
                '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
            }}
          >
            {/* Search */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 18px',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <Search
                size={17}
                strokeWidth={1.5}
                style={{ color: '#52525B', flexShrink: 0 }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Qidirish yoki buyruq kiriting..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#FAFAFA',
                  fontSize: 15,
                  fontFamily: 'Inter,sans-serif',
                }}
              />
              <kbd
                style={{
                  padding: '2px 7px',
                  borderRadius: 5,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 11,
                  color: '#52525B',
                  fontFamily: 'inherit',
                }}
              >
                esc
              </kbd>
            </div>

            {/* Items */}
            <div style={{ maxHeight: 320, overflowY: 'auto', padding: '6px 0' }}>
              {filtered.length === 0 && (
                <div
                  style={{
                    padding: '20px 18px',
                    color: '#52525B',
                    fontSize: 13,
                    textAlign: 'center',
                    fontFamily: 'Inter,sans-serif',
                  }}
                >
                  Natija topilmadi
                </div>
              )}
              {!query && recentItems.length > 0 && (
                <div
                  style={{
                    padding: '6px 18px 4px',
                    fontSize: 11,
                    color: '#3F3F46',
                    fontFamily: 'Inter,sans-serif',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                  }}
                >
                  {`So'nggi suhbatlar`}
                </div>
              )}
              {filtered.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelected(idx)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '9px 18px',
                    border: 'none',
                    background:
                      selected === idx
                        ? 'rgba(255,255,255,0.06)'
                        : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.1s',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      flexShrink: 0,
                      background:
                        selected === idx
                          ? 'rgba(96,165,250,0.12)'
                          : 'rgba(255,255,255,0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: selected === idx ? '#60A5FA' : '#71717A',
                      transition: 'all 0.1s',
                    }}
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 500,
                        color: selected === idx ? '#FAFAFA' : '#E4E4E7',
                        fontFamily: 'Inter,sans-serif',
                      }}
                    >
                      {item.label}
                    </div>
                    {item.description && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: '#52525B',
                          fontFamily: 'Inter,sans-serif',
                          marginTop: 1,
                        }}
                      >
                        {item.description}
                      </div>
                    )}
                  </div>
                  {item.badge && (
                    <kbd
                      style={{
                        padding: '2px 7px',
                        borderRadius: 5,
                        fontSize: 11,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: '#52525B',
                        fontFamily: 'inherit',
                      }}
                    >
                      {item.badge}
                    </kbd>
                  )}
                  <ChevronRight
                    size={13}
                    style={{ color: '#3F3F46', flexShrink: 0 }}
                  />
                </button>
              ))}
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '9px 18px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                gap: 16,
                fontSize: 11,
                color: '#3F3F46',
                fontFamily: 'Inter,sans-serif',
              }}
            >
              <span>↑↓ navigatsiya</span>
              <span>↵ tanlash</span>
              <span>esc yopish</span>
              <span style={{ marginLeft: 'auto', color: '#52525B' }}>
                Ctrl+K
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
