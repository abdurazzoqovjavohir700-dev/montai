'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus, Search, Trash2, Edit3, X,
  Settings, Shield, LogOut, ChevronUp,
} from 'lucide-react';
import SettingsModal from '@/components/settings/SettingsModal';
import MontaiLogo from '@/components/shared/MontaiLogo';
import { toast } from 'react-hot-toast';
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
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  chats,
  activeChatId,
  isOpen,
  onClose,
  onNewChat,
  onChatsUpdate,
  nickname,
}: SidebarProps) {
  const router = useRouter();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const grouped = groupChatsByDate(chats);
  const filteredChats = searchQuery
    ? chats.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleDelete = async (chatId: string) => {
    // Optimistic — darhol UI dan o'chiramiz
    onChatsUpdate(chats.filter(c => c.id !== chatId));
    if (activeChatId === chatId) router.push('/chat');
    try {
      await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
    } catch {
      // Xato bo'lsa qaytaramiz
      onChatsUpdate(chats);
      toast.error('Chatni o\'chirib bo\'lmadi');
    }
  };

  const handleRename = async (chatId: string) => {
    if (!renameValue.trim()) { setRenamingId(null); return; }
    try {
      await fetch(`/api/chat/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameValue.trim() }),
      });
      onChatsUpdate(chats.map(c => c.id === chatId ? { ...c, title: renameValue.trim() } : c));
    } catch {
      toast.error('Nom o\'zgartirib bo\'lmadi');
    }
    setRenamingId(null);
  };

  const ChatItem = ({ chat }: { chat: Chat }) => {
    const isActive = chat.id === activeChatId;
    const isRenaming = renamingId === chat.id;
    const [hovered, setHovered] = useState(false);

    if (isRenaming) {
      return (
        <div style={{ padding: '2px 4px' }}>
          <input
            autoFocus
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={() => handleRename(chat.id)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleRename(chat.id);
              if (e.key === 'Escape') setRenamingId(null);
            }}
            style={{
              width: '100%', fontSize: 13, borderRadius: 6, padding: '5px 8px',
              background: '#2F2F2F', border: '1px solid #3F3F46',
              color: '#FAFAFA', outline: 'none', fontFamily: 'Inter, sans-serif',
            }}
          />
        </div>
      );
    }

    return (
      <div
        className="group relative"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <Link
          href={`/chat/${chat.id}`}
          onClick={() => { if (window.innerWidth < 768) onClose(); }}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 36, padding: '0 10px', borderRadius: 8, cursor: 'pointer',
            background: isActive ? 'rgba(255,255,255,0.08)' : hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
            transition: 'background 0.15s',
            textDecoration: 'none',
          }}
        >
          <span style={{
            fontSize: 13,
            color: isActive ? '#FAFAFA' : '#A1A1AA',
            overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
            fontWeight: isActive ? 500 : 400,
          }}>
            {truncateText(chat.title, 28)}
          </span>
          <div style={{
            display: 'flex', gap: 2, flexShrink: 0, marginLeft: 4,
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.15s',
          }}>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); setRenamingId(chat.id); setRenameValue(chat.title); }}
              style={{ padding: 3, borderRadius: 4, color: '#52525B', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A1A1AA')}
              onMouseLeave={e => (e.currentTarget.style.color = '#52525B')}
            >
              <Edit3 size={12} strokeWidth={1.5} />
            </button>
            <button
              onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(chat.id); }}
              style={{ padding: 3, borderRadius: 4, color: '#52525B', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s', display: 'flex', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={e => (e.currentTarget.style.color = '#52525B')}
            >
              <Trash2 size={12} strokeWidth={1.5} />
            </button>
          </div>
        </Link>
      </div>
    );
  };

  const sidebarContent = (
    <div style={{
      width: 240, background: '#0A0A0A', borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', height: '100%', padding: 8,
    }}>
      {/* Logo header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px 12px' }}>
        <MontaiLogo size={28} />
        <span style={{
          fontFamily: 'Sora, sans-serif', fontSize: 16, fontWeight: 700,
          background: 'linear-gradient(135deg, #F59E0B, #F97316)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Montai</span>
      </div>

      {/* Top actions */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <button
          onClick={() => { onNewChat(); onClose(); }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            height: 36, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #F59E0B, #F97316)',
            color: '#0A0A0B', fontWeight: 600, fontSize: 13,
            fontFamily: 'Inter, sans-serif', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={15} strokeWidth={1.5} />
          New Chat
        </button>
        <button
          onClick={() => setSearchOpen(v => !v)}
          style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, border: 'none', cursor: 'pointer', flexShrink: 0,
            background: searchOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
            color: '#52525B', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = searchOpen ? 'rgba(255,255,255,0.08)' : 'transparent'; (e.currentTarget as HTMLElement).style.color = '#52525B'; }}
          title="Qidirish"
        >
          <Search size={15} strokeWidth={1.5} />
        </button>
        <button
          onClick={onClose}
          className="md:hidden"
          style={{
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#52525B', flexShrink: 0,
          }}
        >
          <X size={15} strokeWidth={1.5} />
        </button>
      </div>

      {/* Search input */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 6 }}
          >
            <input
              autoFocus
              placeholder="Chatlarni qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#FAFAFA', fontSize: 13, outline: 'none',
                fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 4 }}>
        {chats.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#52525B', fontSize: 12, padding: '40px 16px' }}>
            Hali chat yo&apos;q
          </p>
        ) : filteredChats ? (
          filteredChats.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#52525B', fontSize: 12, padding: '20px 16px' }}>
              Topilmadi
            </p>
          ) : (
            filteredChats.map(chat => <ChatItem key={chat.id} chat={chat} />)
          )
        ) : (
          grouped.map(group => (
            <div key={group.label} style={{ marginBottom: 4 }}>
              <p style={{
                fontSize: 11, color: '#52525B', fontWeight: 500,
                padding: '12px 10px 4px', letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                {group.label}
              </p>
              {group.chats.map(chat => <ChatItem key={chat.id} chat={chat} />)}
            </div>
          ))
        )}
      </div>

      {/* Profile section */}
      <div ref={profileRef} style={{ position: 'relative', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 0 0' }}>
        {/* Dropdown */}
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute', bottom: '100%', left: 0, right: 0,
                background: '#141414', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, marginBottom: 4, overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <button
                onClick={() => { setProfileOpen(false); setSettingsOpen(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 14px', color: '#A1A1AA', fontSize: 13,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'Inter, sans-serif',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#FAFAFA'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; }}
              >
                <Settings size={14} strokeWidth={1.5} />
                Sozlamalar
              </button>
              <Link
                href="/privacy"
                onClick={() => setProfileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', color: '#A1A1AA', fontSize: 13,
                  textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; (e.currentTarget as HTMLElement).style.color = '#FAFAFA'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; }}
              >
                <Shield size={14} strokeWidth={1.5} />
                Maxfiylik
              </Link>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '2px 0' }} />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 14px', color: '#EF4444', fontSize: 13,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={14} strokeWidth={1.5} />
                Chiqish
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Profile button */}
        <button
          onClick={() => setProfileOpen(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: profileOpen ? 'rgba(255,255,255,0.05)' : 'transparent',
            transition: 'background 0.15s',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
          onMouseLeave={e => (e.currentTarget.style.background = profileOpen ? 'rgba(255,255,255,0.05)' : 'transparent')}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%', background: '#F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 600, color: '#0A0A0B', flexShrink: 0,
          }}>
            {nickname.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 13, color: '#FAFAFA', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'left' }}>
              {nickname}
            </span>
            <span style={{ fontSize: 11, color: '#52525B' }}>Free</span>
          </div>
          <ChevronUp size={13} strokeWidth={1.5} style={{ color: '#52525B', transform: profileOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
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
              initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
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
