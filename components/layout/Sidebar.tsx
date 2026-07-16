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
    try {
      await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
      onChatsUpdate(chats.filter(c => c.id !== chatId));
      if (activeChatId === chatId) router.push('/chat');
    } catch {
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
        <div style={{ padding: '2px 8px' }}>
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
              width: '100%', fontSize: 14, borderRadius: 6, padding: '6px 10px',
              background: '#2F2F2F', border: '1px solid #52525B',
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
            padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
            background: isActive ? '#2F2F2F' : hovered ? '#1F1F1F' : 'transparent',
            transition: 'background 0.15s',
            textDecoration: 'none',
          }}
        >
          <span style={{
            fontSize: 14, color: '#B4B4B4', overflow: 'hidden',
            textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }}>
            {truncateText(chat.title, 32)}
          </span>
          {hovered && (
            <div style={{ display: 'flex', gap: 2, flexShrink: 0, marginLeft: 4 }}>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); setRenamingId(chat.id); setRenameValue(chat.title); }}
                style={{ padding: 4, borderRadius: 4, color: '#6B7280', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#D4D4D8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
              >
                <Edit3 size={13} strokeWidth={1.5} />
              </button>
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); handleDelete(chat.id); }}
                style={{ padding: 4, borderRadius: 4, color: '#6B7280', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#EF4444')}
                onMouseLeave={e => (e.currentTarget.style.color = '#6B7280')}
              >
                <Trash2 size={13} strokeWidth={1.5} />
              </button>
            </div>
          )}
        </Link>
      </div>
    );
  };

  const sidebarContent = (
    <div style={{
      width: 260, background: '#0D0D0D', borderRight: '1px solid #1A1A1A',
      display: 'flex', flexDirection: 'column', height: '100%', padding: 8,
    }}>
      {/* Logo header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px 12px' }}>
        <MontaiLogo size={32} />
        <span style={{
          fontFamily: 'Sora, sans-serif', fontSize: 18, fontWeight: 700,
          background: 'linear-gradient(135deg, #F59E0B, #F97316)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>Montai</span>
      </div>

      {/* Top actions */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
        <button
          onClick={() => { onNewChat(); onClose(); }}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #F59E0B, #F97316)',
            color: '#0A0A0B', fontWeight: 600, fontSize: 14,
            fontFamily: 'Inter, sans-serif', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          <Plus size={16} strokeWidth={1.5} />
          New Chat
        </button>
        <button
          onClick={() => setSearchOpen(v => !v)}
          style={{
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: searchOpen ? '#2F2F2F' : 'transparent',
            color: '#6B7280', transition: 'background 0.15s, color 0.15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1F1F1F'; (e.currentTarget as HTMLElement).style.color = '#D4D4D8'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = searchOpen ? '#2F2F2F' : 'transparent'; (e.currentTarget as HTMLElement).style.color = '#6B7280'; }}
          title="Qidirish"
        >
          <Search size={16} strokeWidth={1.5} />
        </button>
        <button
          onClick={onClose}
          className="md:hidden"
          style={{
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#6B7280',
          }}
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* Search input */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 4 }}
          >
            <input
              autoFocus
              placeholder="Chatlarni qidirish..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8,
                background: '#1F1F1F', border: '1px solid #2F2F2F',
                color: '#FAFAFA', fontSize: 14, outline: 'none',
                fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat list */}
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 4 }}>
        {chats.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#52525B', fontSize: 13, padding: '40px 16px' }}>
            Hali chat yo&apos;q
          </p>
        ) : filteredChats ? (
          filteredChats.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#52525B', fontSize: 13, padding: '20px 16px' }}>
              Topilmadi
            </p>
          ) : (
            filteredChats.map(chat => <ChatItem key={chat.id} chat={chat} />)
          )
        ) : (
          grouped.map(group => (
            <div key={group.label} style={{ marginBottom: 8 }}>
              <p style={{
                fontSize: 12, color: '#6B7280', fontWeight: 500,
                padding: '12px 14px 6px', letterSpacing: '0.04em', textTransform: 'uppercase',
              }}>
                {group.label}
              </p>
              {group.chats.map(chat => <ChatItem key={chat.id} chat={chat} />)}
            </div>
          ))
        )}
      </div>

      {/* Profile section */}
      <div ref={profileRef} style={{ position: 'relative' }}>
        {/* Dropdown */}
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.12 }}
              style={{
                position: 'absolute', bottom: '100%', left: 0, right: 0,
                background: '#1A1A1A', border: '1px solid #2F2F2F',
                borderRadius: 10, marginBottom: 4, overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              }}
            >
              <button
                onClick={() => { setProfileOpen(false); setSettingsOpen(true); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 14px', color: '#B4B4B4', fontSize: 14,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'Inter, sans-serif',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1F1F1F'; (e.currentTarget as HTMLElement).style.color = '#FAFAFA'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#B4B4B4'; }}
              >
                <Settings size={15} strokeWidth={1.5} />
                Sozlamalar
              </button>
              <Link
                href="/privacy"
                onClick={() => setProfileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px', color: '#B4B4B4', fontSize: 14,
                  textDecoration: 'none', transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1F1F1F'; (e.currentTarget as HTMLElement).style.color = '#FAFAFA'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#B4B4B4'; }}
              >
                <Shield size={15} strokeWidth={1.5} />
                Maxfiylik
              </Link>
              <div style={{ borderTop: '1px solid #2F2F2F', margin: '2px 0' }} />
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '10px 14px', color: '#EF4444', fontSize: 14,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif', transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#1F1F1F')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <LogOut size={15} strokeWidth={1.5} />
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
            padding: '10px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: profileOpen ? '#1F1F1F' : 'transparent',
            borderTop: '1px solid #1A1A1A', transition: 'background 0.15s',
            fontFamily: 'Inter, sans-serif',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#1F1F1F')}
          onMouseLeave={e => (e.currentTarget.style.background = profileOpen ? '#1F1F1F' : 'transparent')}
        >
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#F59E0B',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 600, color: '#0A0A0B', flexShrink: 0,
          }}>
            {nickname.charAt(0).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 14, color: '#FAFAFA', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'left' }}>
              {nickname}
            </span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>Free</span>
          </div>
          <ChevronUp size={14} strokeWidth={1.5} style={{ color: '#6B7280', transform: profileOpen ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.2s', flexShrink: 0 }} />
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
              style={{ background: 'rgba(0,0,0,0.6)' }}
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
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
