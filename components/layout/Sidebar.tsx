'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Plus, Settings, Lock, Trash2, Edit3, MessageSquare, Film, User,
  MoreHorizontal, X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { groupChatsByDate, truncateText } from '@/lib/utils';
import Logo from '@/components/shared/Logo';
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
  const pathname = usePathname();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const grouped = groupChatsByDate(chats);

  const handleDelete = async (chatId: string) => {
    try {
      await fetch(`/api/chat/${chatId}`, { method: 'DELETE' });
      const updated = chats.filter((c) => c.id !== chatId);
      onChatsUpdate(updated);

      if (activeChatId === chatId) {
        router.push('/chat');
      }
      toast.success('Chat deleted');
    } catch {
      toast.error('Failed to delete chat');
    }
    setOpenMenuId(null);
  };

  const handleRename = async (chatId: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    try {
      await fetch(`/api/chat/${chatId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameValue.trim() }),
      });
      const updated = chats.map((c) =>
        c.id === chatId ? { ...c, title: renameValue.trim() } : c
      );
      onChatsUpdate(updated);
      toast.success('Chat renamed');
    } catch {
      toast.error('Failed to rename chat');
    }
    setRenamingId(null);
  };

  const startRename = (chat: Chat) => {
    setRenamingId(chat.id);
    setRenameValue(chat.title);
    setOpenMenuId(null);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-subtle)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
        <Logo size="sm" />
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* New Chat */}
      <div className="p-3">
        <button
          onClick={() => { onNewChat(); onClose(); }}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(249,115,22,0.1))',
            border: '1px solid rgba(245,158,11,0.25)',
            color: 'var(--accent-primary)',
          }}
        >
          <Plus size={16} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Film strip decoration */}
      <div className="px-3 mb-1 flex items-center gap-1 opacity-20">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className="h-3 flex-1 border border-[var(--border-subtle)] rounded-sm"
          />
        ))}
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-4">
            <Film size={28} className="text-[var(--text-tertiary)] opacity-50" />
            <p className="text-xs text-[var(--text-tertiary)]">No chats yet. Start a new conversation!</p>
          </div>
        ) : (
          grouped.map((group) => (
            <div key={group.label} className="mb-3">
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-tertiary)]">
                {group.label}
              </p>
              {group.chats.map((chat) => {
                const isActive = chat.id === activeChatId;
                const isRenaming = renamingId === chat.id;
                const menuOpen = openMenuId === chat.id;

                return (
                  <div key={chat.id} className="relative group mb-0.5">
                    {isRenaming ? (
                      <div className="px-2 py-1">
                        <input
                          autoFocus
                          value={renameValue}
                          onChange={(e) => setRenameValue(e.target.value)}
                          onBlur={() => handleRename(chat.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(chat.id);
                            if (e.key === 'Escape') setRenamingId(null);
                          }}
                          className="w-full text-sm bg-[var(--bg-tertiary)] border border-[var(--accent-primary)] rounded-lg px-2 py-1.5 text-[var(--text-primary)] outline-none"
                        />
                      </div>
                    ) : (
                      <Link
                        href={`/chat/${chat.id}`}
                        onClick={() => { if (window.innerWidth < 768) onClose(); }}
                        className={`flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-all duration-150 ${
                          isActive
                            ? 'chat-item-active text-[var(--text-primary)]'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        <MessageSquare size={14} className="flex-shrink-0 opacity-60" />
                        <span className="flex-1 truncate text-xs leading-snug">
                          {truncateText(chat.title, 32)}
                        </span>

                        {/* Context menu trigger */}
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setOpenMenuId(menuOpen ? null : chat.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity hover:text-[var(--accent-primary)]"
                          aria-label="Chat options"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      </Link>
                    )}

                    {/* Dropdown menu */}
                    <AnimatePresence>
                      {menuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.12 }}
                          className="absolute right-0 top-full mt-1 z-20 bg-[var(--bg-tertiary)] border border-[var(--border-subtle)] rounded-lg shadow-xl overflow-hidden min-w-[130px]"
                          onMouseLeave={() => setOpenMenuId(null)}
                        >
                          <button
                            onClick={() => startRename(chat)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <Edit3 size={12} />
                            Rename
                          </button>
                          <button
                            onClick={() => handleDelete(chat.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--error)] hover:bg-[var(--bg-secondary)] transition-colors"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[var(--border-subtle)] p-3 space-y-1">
        <Link
          href="/settings"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname === '/settings'
              ? 'text-[var(--accent-primary)] bg-[var(--accent-glow)]'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
          }`}
        >
          <Settings size={15} />
          <span>Settings</span>
        </Link>
        <Link
          href="/privacy"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          <Lock size={15} />
          <span>Privacy</span>
        </Link>
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-subtle)' }}
          >
            <User size={12} className="text-[var(--text-tertiary)]" />
          </div>
          <span className="text-xs text-[var(--text-tertiary)] truncate">{nickname}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">{sidebarContent}</div>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 mobile-overlay md:hidden"
              onClick={onClose}
            />
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
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
