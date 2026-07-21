'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Trash2, Edit3, X, Settings, Shield, LogOut, ChevronUp,
  ChevronDown, MessageSquare, BookOpen, FileText, Star, Clock, Palette,
  Film, Music, Bot, StickyNote, Zap, Volume2, Download, Eye, Layers,
  Shuffle, Scissors, BarChart2, Upload, Lock, Unlock, GitMerge, Image,
  AlignLeft, Archive, Bookmark, Hash, Filter,
} from 'lucide-react';
import SettingsModal from '@/components/settings/SettingsModal';
import MontaiLogo from '@/components/shared/MontaiLogo';
import { toast } from '@/components/ui/Toast';
import { signOut } from 'next-auth/react';
import { groupChatsByDate, truncateText } from '@/lib/utils';
import type { Chat } from '@/lib/types';

interface SidebarProps {
  chats: Chat[];
  activeChatId?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onChatsUpdate: (chats: Chat[]) => void;
  nickname: string;
}

// ── Premium badge ────────────────────────────────────────────────────────────
function Badge({ label, color = 'orange' }: { label: string; color?: 'orange' | 'blue' | 'green' | 'purple' }) {
  const colors = {
    orange: { bg: 'rgba(96,165,250,0.1)', text: '#60A5FA', border: 'rgba(96,165,250,0.2)' },
    blue: { bg: 'rgba(59,130,246,0.1)', text: '#60A5FA', border: 'rgba(59,130,246,0.2)' },
    green: { bg: 'rgba(34,197,94,0.08)', text: '#4ADE80', border: 'rgba(34,197,94,0.15)' },
    purple: { bg: 'rgba(139,92,246,0.1)', text: '#A78BFA', border: 'rgba(139,92,246,0.2)' },
  };
  const c = colors[color];
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 4, padding: '1px 5px', flexShrink: 0,
      fontFamily: 'Inter, sans-serif',
    }}>
      {label}
    </span>
  );
}

// ── Tool item (clickable) ─────────────────────────────────────────────────────
function ToolItem({
  label, icon, badge, badgeColor, onClick, active,
}: {
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeColor?: 'orange' | 'blue' | 'green' | 'purple';
  onClick?: () => void;
  active?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 7,
        padding: '5px 8px', borderRadius: 6, border: 'none', cursor: onClick ? 'pointer' : 'default',
        background: active ? 'rgba(96,165,250,0.08)' : hov ? 'rgba(255,255,255,0.04)' : 'transparent',
        color: active ? '#60A5FA' : hov ? '#8B93A4' : '#52525B',
        fontFamily: 'Inter, sans-serif', fontSize: 12.5, transition: 'all 0.13s',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: 'inherit' }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge && <Badge label={badge} color={badgeColor ?? 'orange'} />}
    </button>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────
function Section({
  icon, label, count, children, defaultOpen = false, badge,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: { label: string; color?: 'orange' | 'blue' | 'green' | 'purple' };
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: 1 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 7,
          padding: '5px 8px', borderRadius: 7, border: 'none', cursor: 'pointer',
          background: 'transparent', color: '#3F3F46',
          fontFamily: 'Inter, sans-serif', transition: 'all 0.13s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#71717A'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3F3F46'; (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      >
        <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, color: 'inherit' }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 10.5, fontWeight: 600, textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {label}
        </span>
        {badge && <Badge label={badge.label} color={badge.color ?? 'orange'} />}
        {count !== undefined && count > 0 && !badge && (
          <span style={{ fontSize: 9.5, color: '#52525B', background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: '0 5px' }}>
            {count}
          </span>
        )}
        <motion.span
          animate={{ rotate: open ? 0 : -90 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: 'flex', flexShrink: 0, color: '#2A2A2E' }}
        >
          <ChevronDown size={10} strokeWidth={2} />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden', paddingLeft: 4 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Chat item with AnimatePresence layout ─────────────────────────────────────
function ChatItem({
  chat, isActive, onDelete, onRename,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}) {
  const [hov, setHov] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [val, setVal] = useState(chat.title);
  const [confirmDel, setConfirmDel] = useState(false);

  if (renaming) {
    return (
      <motion.div layout style={{ padding: '2px 4px' }}>
        <input
          autoFocus value={val}
          onChange={e => setVal(e.target.value)}
          onBlur={() => { onRename(chat.id, val); setRenaming(false); }}
          onKeyDown={e => {
            if (e.key === 'Enter') { onRename(chat.id, val); setRenaming(false); }
            if (e.key === 'Escape') { setVal(chat.title); setRenaming(false); }
          }}
          style={{
            width: '100%', fontSize: 12.5, borderRadius: 6, padding: '5px 8px',
            background: '#2F2F2F', border: '1px solid #3F3F46', color: '#FAFAFA',
            outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      style={{ overflow: 'hidden' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setConfirmDel(false); }}
    >
      {confirmDel ? (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '4px 8px', borderRadius: 6,
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.15)',
          marginBottom: 2,
        }}>
          <span style={{ fontSize: 11, color: '#EF4444', flex: 1, fontFamily: 'Inter, sans-serif' }}>O&apos;chirishni tasdiqlash?</span>
          <button onClick={() => onDelete(chat.id)} style={{ fontSize: 10, color: '#EF4444', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '2px 6px' }}>Ha</button>
          <button onClick={() => setConfirmDel(false)} style={{ fontSize: 10, color: '#52525B', background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Yo&apos;q</button>
        </div>
      ) : (
        <Link
          href={`/chat/${chat.id}`}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 30, padding: '0 8px', borderRadius: 6,
            background: isActive ? 'rgba(96,165,250,0.07)' : hov ? 'rgba(255,255,255,0.04)' : 'transparent',
            borderLeft: isActive ? '2px solid rgba(96,165,250,0.45)' : '2px solid transparent',
            transition: 'all 0.12s', textDecoration: 'none',
          }}
        >
          <span style={{
            fontSize: 12.5, color: isActive ? '#F4F4F5' : '#71717A',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            flex: 1, fontWeight: isActive ? 500 : 400, fontFamily: 'Inter, sans-serif',
          }}>
            {truncateText(chat.title, 26)}
          </span>
          <div style={{ display: 'flex', gap: 1, flexShrink: 0, marginLeft: 3, opacity: hov ? 1 : 0, transition: 'opacity 0.12s' }}>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setRenaming(true); setVal(chat.title); }}
              style={{ padding: 3, borderRadius: 4, color: '#3F3F46', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A1A1AA')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3F3F46')}
            >
              <Edit3 size={11} strokeWidth={1.5} />
            </button>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setConfirmDel(true); }}
              style={{ padding: 3, borderRadius: 4, color: '#3F3F46', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3F3F46')}
            >
              <Trash2 size={11} strokeWidth={1.5} />
            </button>
          </div>
        </Link>
      )}
    </motion.div>
  );
}

// ── Notes panel — localStorage ────────────────────────────────────────────────
function NotesPanel() {
  const [notes, setNotes] = useState<{ id: string; text: string; ts: number }[]>(() => {
    try { return JSON.parse(localStorage.getItem('montai_notes') ?? '[]') as { id: string; text: string; ts: number }[]; } catch { return []; }
  });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const save = () => {
    if (!draft.trim()) { setAdding(false); setDraft(''); return; }
    const updated = [{ id: crypto.randomUUID(), text: draft.trim(), ts: Date.now() }, ...notes];
    setNotes(updated);
    localStorage.setItem('montai_notes', JSON.stringify(updated));
    setDraft(''); setAdding(false);
  };

  const del = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    localStorage.setItem('montai_notes', JSON.stringify(updated));
  };

  return (
    <div>
      {adding ? (
        <div style={{ padding: '4px 0 6px' }}>
          <textarea
            autoFocus value={draft} onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save(); if (e.key === 'Escape') { setAdding(false); setDraft(''); } }}
            placeholder="Eslatma yozing... (Ctrl+Enter saqlash)"
            style={{
              width: '100%', minHeight: 64, padding: '6px 8px', borderRadius: 7,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(96,165,250,0.15)',
              color: '#E4E4E7', fontSize: 11.5, resize: 'vertical', outline: 'none',
              fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', lineHeight: 1.5,
            }}
          />
          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
            <button onClick={save} style={{ flex: 1, padding: '4px', borderRadius: 5, border: 'none', background: '#FFFFFF', color: '#0A0A0B', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Saqlash</button>
            <button onClick={() => { setAdding(false); setDraft(''); }} style={{ flex: 1, padding: '4px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.07)', background: 'transparent', color: '#71717A', fontSize: 11, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Bekor</button>
          </div>
        </div>
      ) : (
        <ToolItem label="Yangi Eslatma" icon={<Plus size={10} strokeWidth={2} />} onClick={() => setAdding(true)} active />
      )}
      {notes.slice(0, 6).map(n => (
        <motion.div key={n.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <div
            style={{
              padding: '5px 8px', borderRadius: 6, margin: '1px 0',
              background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.04)',
              display: 'flex', alignItems: 'flex-start', gap: 6,
            }}
          >
            <span style={{ flex: 1, fontSize: 11, color: '#A1A1AA', lineHeight: 1.45, fontFamily: 'Inter, sans-serif', wordBreak: 'break-word' }}>
              {n.text.slice(0, 80)}{n.text.length > 80 ? '…' : ''}
            </span>
            <button onClick={() => del(n.id)} style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: '#3F3F46', padding: '1px 2px', lineHeight: 1 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#EF4444'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#3F3F46'; }}
            >
              <X size={9} strokeWidth={2} />
            </button>
          </div>
        </motion.div>
      ))}
      {notes.length === 0 && !adding && (
        <p style={{ textAlign: 'center', color: '#2A2A2E', fontSize: 11, padding: '8px', fontFamily: 'Inter, sans-serif' }}>Hali eslatma yo&apos;q</p>
      )}
    </div>
  );
}

export default function Sidebar({
  chats, activeChatId, isOpen, onClose, onNewChat, onChatsUpdate, nickname,
}: SidebarProps) {
  const router = useRouter();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Dispatch a prompt to active ChatWindow without navigating away
  const sendPrompt = useCallback((prompt: string) => {
    onClose();
    if (!window.location.pathname.startsWith('/chat')) {
      router.push('/chat');
      // Small delay to let ChatWindow mount first
      setTimeout(() => window.dispatchEvent(new CustomEvent('montai:send', { detail: { prompt } })), 400);
    } else {
      window.dispatchEvent(new CustomEvent('montai:send', { detail: { prompt } }));
    }
  }, [onClose, router]);

  const grouped = groupChatsByDate(chats);
  const filteredChats = searchQuery
    ? chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleDelete = useCallback(async (chatId: string) => {
    const prev = [...chats];
    onChatsUpdate(chats.filter(c => c.id !== chatId));
    if (activeChatId === chatId) router.push('/chat');
    try {
      await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
    } catch {
      onChatsUpdate(prev);
      toast.error('Chatni o\'chirib bo\'lmadi');
    }
  }, [chats, activeChatId, onChatsUpdate, router]);

  const handleRename = useCallback(async (chatId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    onChatsUpdate(chats.map(c => c.id === chatId ? { ...c, title: newTitle.trim() } : c));
    try {
      await fetch(`/api/chat/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
    } catch {
      toast.error('Nom o\'zgartirib bo\'lmadi');
    }
  }, [chats, onChatsUpdate]);

  const renderChats = (list: Chat[]) => (
    <AnimatePresence mode="popLayout" initial={false}>
      {list.map(chat => (
        <ChatItem
          key={chat.id}
          chat={chat}
          isActive={chat.id === activeChatId}
          onDelete={handleDelete}
          onRename={handleRename}
        />
      ))}
    </AnimatePresence>
  );

  const sidebarContent = (
    <div style={{
      width: 240,
      background: 'rgba(6,7,12,0.82)',
      backdropFilter: 'blur(48px) saturate(1.7)',
      WebkitBackdropFilter: 'blur(48px) saturate(1.7)',
      borderRight: '1px solid rgba(255,255,255,0.065)',
      boxShadow: '1px 0 0 rgba(255,255,255,0.035), inset -1px 0 0 rgba(0,0,0,0.3)',
      display: 'flex', flexDirection: 'column', height: '100%', padding: 8,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 8px 10px' }}>
        <MontaiLogo size={24} />
        <span style={{ fontFamily: 'var(--font-display,Manrope,sans-serif)', fontSize: 14.5, fontWeight: 700, color: '#EEEEF0', letterSpacing: '-0.02em' }}>
          Montai
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          className="md:hidden"
          style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, border: 'none', cursor: 'pointer', background: 'transparent', color: '#3F3F46' }}
        >
          <X size={13} strokeWidth={1.5} />
        </button>
      </div>

      {/* New Chat + Search */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
        <motion.button
          onClick={() => { onNewChat(); onClose(); }}
          whileHover={{ scale: 1.02, boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25)' }}
          whileTap={{ scale: 0.96 }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            height: 32, borderRadius: 9, border: '1px solid rgba(255,255,255,0.14)', cursor: 'pointer',
            background: 'rgba(255,255,255,0.9)',
            color: '#08090D', fontWeight: 600, fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <Plus size={13} strokeWidth={2.5} />
          New Chat
        </motion.button>
        <button
          onClick={() => setSearchOpen(v => !v)}
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: searchOpen ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.04)',
            color: searchOpen ? '#60A5FA' : '#3F3F46', transition: 'all 0.13s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLElement).style.color = '#71717A'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = searchOpen ? 'rgba(96,165,250,0.08)' : 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = searchOpen ? '#60A5FA' : '#3F3F46'; }}
        >
          <Search size={12} strokeWidth={1.8} />
        </button>
      </div>

      {/* Search input */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 8 }}
          >
            <input
              autoFocus placeholder="Chatlarni qidirish..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '6px 10px', borderRadius: 7,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
                color: '#FAFAFA', fontSize: 12, outline: 'none',
                fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable sections */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>

        {/* ── CHATS ──────────────────────────────────── */}
        <Section icon={<MessageSquare size={10} strokeWidth={1.8} />} label="Suhbatlar" count={chats.length} defaultOpen>
          {chats.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#2A2A2E', fontSize: 11.5, padding: '14px 8px', fontFamily: 'Inter, sans-serif' }}>
              Hali chat yo&apos;q
            </p>
          ) : filteredChats ? (
            filteredChats.length === 0
              ? <p style={{ textAlign: 'center', color: '#2A2A2E', fontSize: 11.5, padding: '8px', fontFamily: 'Inter, sans-serif' }}>Topilmadi</p>
              : renderChats(filteredChats)
          ) : (
            grouped.map(group => (
              <div key={group.label}>
                <p style={{ fontSize: 9.5, color: '#2A2A2E', padding: '7px 8px 2px', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                  {group.label}
                </p>
                {renderChats(group.chats)}
              </div>
            ))
          )}
        </Section>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.03)', margin: '4px 0' }} />

        {/* ── AI MENTOR ─────────────────────────────── */}
        <Section icon={<Bot size={10} strokeWidth={1.8} />} label="AI Mentor" badge={{ label: 'AI', color: 'orange' }}>
          <ToolItem label="Mentor Rejim" icon={<Zap size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('Menga video montaj bo\'yicha professional mentor bo\'l. 10-qadam o\'quv yo\'li yarat. Har qadam bilan amaliy mashq ber. Birinchi qadamdan boshlaylik.')} />
          <ToolItem label="Shaxsiy O'quv Yo'li" icon={<BarChart2 size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('Mening tajriba darajam va maqsadlarimga qarab shaxsiy video montaj o\'quv yo\'li tuzib bering. Qaysi dasturni, qanday tartibda, qancha vaqtda o\'rganishimni rejalang.')} />
          <ToolItem label="Bugungi Mashq" icon={<BookOpen size={10} strokeWidth={1.5} />} badge="Daily"
            onClick={() => sendPrompt(`Bugungi sana (${new Date().toLocaleDateString('uz-UZ')}) uchun 3 ta video montaj amaliy mashq bering. Har biri 15-30 daqiqa. Turli xil ko'nikmalarni rivojlantirsin.`)} />
          <ToolItem label="Savol-Javob" icon={<MessageSquare size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('Montaj haqida bilmoqchi bo\'lgan savollarimga professional tarzda javob ber. Birinchi savol: Professional video montajda eng ko\'p qilinadigan xatolar nima?')} />
        </Section>

        {/* ── AFTER EFFECTS SCRIPTS ─────────────────── */}
        <Section icon={<Layers size={10} strokeWidth={1.8} />} label="AE Scripts" badge={{ label: 'New', color: 'green' }}>
          <ToolItem label="Automation Scripts" icon={<Zap size={10} strokeWidth={1.5} />} badge="200+"
            onClick={() => sendPrompt('After Effects uchun eng ko\'p ishlatiladigan automation scriptlari ro\'yxatini ber: BG Renderer, Duik Bassel, Motion Bro. Har birini o\'rnatish va ishlatish qo\'llanmasi bilan.')} />
          <ToolItem label="Motion & Animation" icon={<Film size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('After Effects motion design scriptlari: AEJuice, Motion Bro, Ease and Wizz, Motion Tools 2. Bularni qayerdan topish va qanday o\'rnatish kerak? Har bir scriptning asosiy funksiyalari nimalar?')} />
          <ToolItem label="Audio Sync" icon={<Volume2 size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('After Effects da audio sync skriptlari: Sound Keys, Beatbox, Auto Lip Sync. Bu skriptlar bilan musiqa va animatsiyani qanday sinxronlashtirish kerak? Bosqichma-bosqich tushuntir.')} />
          <ToolItem label="Camera Tools" icon={<Eye size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('After Effects kamera skriptlari: BRAW Toolbox, GoPro FX Reframe, Camera Shake Deblur. 3D kamera animatsiyasi uchun qaysi skriptlar eng foydali? Har birini tushuntir.')} />
          <ToolItem label="Expressions Pack" icon={<Hash size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('After Effects expressions — eng muhim ifodalar: wiggle, loopOut, time, linear, ease. Har birini amaliy misol bilan tushuntir. Boshlang\'ich darajadan professional darajaga o\'rgatim.')} />
          <ToolItem label="Render & Export" icon={<Download size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('After Effects render optimizatsiya skriptlari: BG Renderer Max, Render Garden. Render tezligini oshirish uchun qaysi sozlamalar optimal? 4K va 1080p uchun alohida tavsiyalar ber.')} />
          <ToolItem label="Text Animator" icon={<AlignLeft size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('After Effects text animation skriptlari: Type Monkey, TextDelay, AnimText. Professional kinoteatr sifatida matn animatsiyalarini qanday yaratish kerak? 5 ta eng yaxshi effektni tushuntir.')} />
          <ToolItem label="Color & LUT Tools" icon={<Palette size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('After Effects color grading skriptlari va plaginlari: Magic Bullet Looks, FilmConvert, RSMB. LUT qo\'llash va color correction uchun eng yaxshi workflow qanday?')} />
        </Section>

        {/* ── LEARNING HUB ─────────────────────────── */}
        <Section icon={<BookOpen size={10} strokeWidth={1.8} />} label="Learning Hub">
          {[
            { name: 'Premiere Pro', prompt: 'Adobe Premiere Pro ni noldan professional darajaga o\'rganish rejasi. 30 kunlik o\'quv dasturi tuz: har kuni nima o\'rganish kerak, qaysi YouTube kanallar eng yaxshi, qanday amaliy loyihalar.' },
            { name: 'After Effects', prompt: 'After Effects ni noldan o\'rganish. Birinchi hafta uchun: interface, asosiy animatsiya, keyframe, expressions asoslari. Har kuni 1 soatlik dars rejasi.' },
            { name: 'DaVinci Resolve', prompt: 'DaVinci Resolve — bepul versiyasidan professional ishlash. Color grading, Cut page, Fusion effektlari. 21 kunlik strukturali o\'quv rejasi.' },
            { name: 'CapCut Pro', prompt: 'CapCut bilan professional video montaj. Desktop versiyasining barcha xususiyatlari: efektlar, transition, subtitle, export sozlamalari.' },
            { name: 'Motion Design', prompt: 'Motion design kasbini noldan o\'rganish yo\'li. Qaysi dasturlarni bilish kerak, qanday portfolio yaratish, qayerda ish topish. 6 oylik karyera rejasi.' },
            { name: 'Sound Design', prompt: 'Video uchun professional sound design: dialogue editing, music mixing, SFX. Ableton Live yoki Adobe Audition qaysi biri yaxshiroq? Boshlang\'ich uchun to\'liq yo\'l haritasi.' },
            { name: 'Color Grading', prompt: 'Professional color grading asoslaridan masterclass. Color theory, primary va secondary correction, LUT ishlatish, cinema look yaratish. DaVinci Resolve asosida o\'rgat.' },
          ].map(({ name, prompt }) => (
            <ToolItem key={name} label={name} icon={<Film size={10} strokeWidth={1.5} />} onClick={() => sendPrompt(prompt)} />
          ))}
        </Section>

        {/* ── LUT LIBRARY ──────────────────────────── */}
        <Section icon={<Palette size={10} strokeWidth={1.8} />} label="LUT Library">
          {[
            { label: 'Cinematic Pack', badge: 'Free', prompt: 'Cinematic LUT to\'plami — bepul yuklab olish mumkin bo\'lgan eng yaxshi cinematic LUT\'lar. DaVinci Resolve va Premiere Pro da o\'rnatish va ishlatish qo\'llanmasi.' },
            { label: 'Teal & Orange', badge: 'Free', prompt: 'Teal & Orange — Hollywood LUT effekti. Bu rang sxemasini qanday yaratish va o\'zingizning LUT yaratish. Bepul alternativalar qayerdan topish.' },
            { label: 'ARRI Alexa Look', badge: '', prompt: 'ARRI Alexa kamera ko\'rinishini simulyatsiya qiluvchi LUT\'lar. Log-C footage bilan ishlash, ARRI color science tushunchasi. iPhone va DSC kamera uchun moslash.' },
            { label: 'Film Emulation', badge: '', prompt: 'Film emulation LUT\'lar: Kodak, Fuji, Agfa ko\'rinishlari. RNI Films, Dehancer, FilmConvert — qaysi biri siz uchun? Har birining farqi va ishlatish usuli.' },
            { label: 'Color Grading AI', badge: 'AI', prompt: 'AI yordamida color grading: Runway ML, Topaz Video AI, DaVinci Neural Engine. Avtomatik color matching va grade yaratish qanday amalga oshiriladi?' },
          ].map(({ label, badge, prompt }) => (
            <ToolItem key={label} label={label} icon={<Palette size={10} strokeWidth={1.5} />}
              badge={badge || undefined} badgeColor={badge === 'Free' ? 'green' : badge === 'AI' ? 'purple' : undefined}
              onClick={() => sendPrompt(prompt)} />
          ))}
        </Section>

        {/* ── PDF & DOCS ────────────────────────────── */}
        <Section icon={<FileText size={10} strokeWidth={1.8} />} label="PDF & Docs">
          <ToolItem label="PDF Yarat" icon={<Plus size={10} strokeWidth={2} />} active
            onClick={() => { onNewChat(); onClose(); sendPrompt('Video montaj bo\'yicha qo\'llanma PDF yarat — "Montaj Asoslari" nomli professional hujjat. Har bir bob bilan to\'liq mazmunli PDF chiqar.'); }} />
          <ToolItem label="PDF Birlashtir" icon={<GitMerge size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('Bir nechta PDF faylni birlashtirish uchun eng yaxshi usullar qaysilar? Bepul online vositalar, desktop ilovalar va Python kodi bilan tushuntir.')} />
          <ToolItem label="PDF → Word" icon={<Shuffle size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('PDF ni Word hujjatga (DOCX) aylantirish uchun eng yaxshi usullar: bepul online vositalar (Smallpdf, ILovePDF), Adobe Acrobat, LibreOffice. Matn va formatlash saqlanib qoladimi?')} />
          <ToolItem label="PDF OCR" icon={<AlignLeft size={10} strokeWidth={1.5} />} badge="AI"
            onClick={() => sendPrompt('PDF OCR (optik belgi tanish) — skanerlangan hujjatlardan matn chiqarish. Bepul vositalar: Tesseract, Adobe Scan, Google Drive OCR. O\'zbekcha matn uchun qaysi biri yaxshi?')} />
          <ToolItem label="PDF Siqish" icon={<Filter size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('PDF fayl hajmini kamaytirish usullari. Online vositalar va terminal buyruqlari bilan fayl sifatini saqlab siqish. 50MB ni 2MB ga kamaytirish mumkinmi?')} />
          <ToolItem label="PDF Himoya" icon={<Lock size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('PDF ga parol qo\'yish va huquqlarni cheklash. Adobe Acrobat, qpdf va online vositalar bilan PDF ni himoya qilish usullari. Print va copy huquqlarini qanday cheklash?')} />
        </Section>

        {/* ── MUSIC & SFX ──────────────────────────── */}
        <Section icon={<Music size={10} strokeWidth={1.8} />} label="Music & SFX">
          <ToolItem label="Royalty-Free Saytlar" icon={<Music size={10} strokeWidth={1.5} />} badge="Free"
            onClick={() => sendPrompt('Video uchun royalty-free musiqa saytlari ro\'yxati: YouTube Audio Library, Pixabay Music, Freesound, Bensound, Free Music Archive, ccMixter. Har birining afzalliklari va kamchiliklari.')} />
          <ToolItem label="Cinematic Skorlar" icon={<Film size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('Video uchun sinematik orkestr musiqasini topish. Epidemic Sound, Artlist, Musicbed — qaysi biri eng yaxshi? Bepul alternativlar bormi? Creative Commons lisenziyasi nima?')} />
          <ToolItem label="SFX Effektlar" icon={<Volume2 size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('Video uchun bepul sound effects (SFX): Freesound.org, ZapSplat, Soundsnap, BBC Sound Effects. Whoosh, transition, cinematic boom effektlarini qayerdan topish?')} />
          <ToolItem label="Audio Mixing Guide" icon={<BarChart2 size={10} strokeWidth={1.5} />}
            onClick={() => sendPrompt('Video uchun professional audio mixing qo\'llanmasi. Dialogue, musiqa va SFX qanday darajalarda bo\'lishi kerak (dB)? Premiere Pro va DaVinci Resolve da audio mixdown.')} />
          <ToolItem label="Musiqa Topish AI" icon={<Zap size={10} strokeWidth={1.5} />} badge="AI"
            onClick={() => sendPrompt('AI yordamida video uchun musiqa topish: Suno AI, Udio, Mubert. Bu platformalar bepulmi? Mualliflik huquqi qanday? YouTube uchun ishlatish mumkinmi?')} />
        </Section>

        {/* ── NOTES ─────────────────────────────────── */}
        <Section icon={<StickyNote size={10} strokeWidth={1.8} />} label="Eslatmalar">
          <NotesPanel />
        </Section>

        {/* ── HISTORY ───────────────────────────────── */}
        <Section icon={<Clock size={10} strokeWidth={1.8} />} label="Tarix">
          {grouped.slice(0, 3).map(group => (
            <div key={group.label}>
              <p style={{ fontSize: 9, color: '#2A2A2E', padding: '5px 8px 1px', letterSpacing: '0.07em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
                {group.label}
              </p>
              {group.chats.slice(0, 3).map(chat => (
                <ToolItem key={chat.id} label={truncateText(chat.title, 28)} icon={<Clock size={10} strokeWidth={1.5} />}
                  active={chat.id === activeChatId}
                  onClick={() => { router.push(`/chat/${chat.id}`); onClose(); }}
                />
              ))}
            </div>
          ))}
          {chats.length === 0 && <p style={{ textAlign: 'center', color: '#2A2A2E', fontSize: 11, padding: '8px', fontFamily: 'Inter, sans-serif' }}>Tarix yo&apos;q</p>}
        </Section>

        {/* ── SETTINGS ──────────────────────────────── */}
        <Section icon={<Settings size={10} strokeWidth={1.8} />} label="Tizim">
          <ToolItem label="Sozlamalar" icon={<Settings size={10} strokeWidth={1.5} />} onClick={() => setSettingsOpen(true)} />
          <ToolItem label="Maxfiylik" icon={<Shield size={10} strokeWidth={1.5} />} onClick={() => { router.push('/privacy'); onClose(); }} />
        </Section>
      </div>

      {/* Profile */}
      <div ref={profileRef} style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 6, marginTop: 4 }}>
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: 'absolute', bottom: '100%', left: 0, right: 0,
                background: '#111113', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 10, marginBottom: 4, overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
              }}
            >
              <button onClick={() => { setProfileOpen(false); setSettingsOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 12px', color: '#A1A1AA', fontSize: 12.5, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#FAFAFA'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; }}
              >
                <Settings size={12} strokeWidth={1.5} /> Sozlamalar
              </button>
              <Link href="/privacy" onClick={() => setProfileOpen(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', color: '#A1A1AA', fontSize: 12.5, textDecoration: 'none' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#FAFAFA'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; }}
              >
                <Shield size={12} strokeWidth={1.5} /> Maxfiylik
              </Link>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', margin: '2px 0' }} />
              <button onClick={() => { setProfileOpen(false); setConfirmLogout(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 12px', color: '#EF4444', fontSize: 12.5, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.07)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={12} strokeWidth={1.5} /> Chiqish
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setProfileOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: profileOpen ? 'rgba(255,255,255,0.04)' : 'transparent',
            transition: 'background 0.13s', fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
          onMouseLeave={e => (e.currentTarget.style.background = profileOpen ? 'rgba(255,255,255,0.04)' : 'transparent')}
        >
          <div style={{
            width: 24, height: 24, borderRadius: '50%',
            background: '#FFFFFF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color: '#0A0A0B', flexShrink: 0,
          }}>
            {nickname.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: '#FAFAFA', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Inter, sans-serif' }}>
              {nickname}
            </div>
            <div style={{ fontSize: 10, color: '#363C4D', fontFamily: 'Inter, sans-serif' }}>Montai</div>
          </div>
          <ChevronUp size={11} strokeWidth={1.8}
            style={{ color: '#2A2A2E', transform: profileOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', flexShrink: 0 }}
          />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Logout confirm */}
      <AnimatePresence>
        {confirmLogout && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setConfirmLogout(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 10 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#141416', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px', width: 340, boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#FAFAFA', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>Chiqishni tasdiqlang</h3>
              <p style={{ fontSize: 13, color: '#52525B', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, marginBottom: 20 }}>
                Montai dan chiqmoqchimisiz? Chat tarixi saqlanib qoladi.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmLogout(false)}
                  style={{ flex: 1, padding: '9px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#A1A1AA', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={e => { (e.currentTarget.style.background = 'rgba(255,255,255,0.05)'); (e.currentTarget.style.color = '#FAFAFA'); }}
                  onMouseLeave={e => { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = '#A1A1AA'); }}
                >Bekor</button>
                <button onClick={() => { try { localStorage.removeItem('montai_init_cache'); localStorage.removeItem('montai_prompt_hist'); } catch {} signOut({ callbackUrl: '/' }); }}
                  style={{ flex: 1, padding: '9px', borderRadius: 9, border: 'none', background: '#EF4444', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#DC2626')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#EF4444')}
                >Chiqish</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="hidden md:flex h-full">{sidebarContent}</div>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -248 }} animate={{ x: 0 }} exit={{ x: -248 }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
            >
              {sidebarContent}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

