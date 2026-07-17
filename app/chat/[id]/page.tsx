'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Menu, PanelLeftOpen } from 'lucide-react';
import MontaiLogo from '@/components/shared/MontaiLogo';
import ChatWindow from '@/components/chat/ChatWindow';
import Sidebar from '@/components/layout/Sidebar';
import type { Chat, Message, User, Language } from '@/lib/types';

const CACHE_KEY = 'montai_init_cache';

function readCache(): { user: User; chats: Chat[] } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) as { user: User; chats: Chat[] } : null;
  } catch { return null; }
}

function writeCache(user: User, chats: Chat[]) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ user, chats })); } catch { /* ignore */ }
}

export default function ChatByIdPage() {
  const router = useRouter();
  const params = useParams();
  const chatId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Show cached user+chats immediately
    const cached = readCache();
    if (cached?.user?.onboardingCompleted) {
      setUser(cached.user);
      setChats(cached.chats ?? []);
      // Don't setLoading(false) yet — still need messages
    }

    // 2. Fetch in parallel: init (user+chats) + messages for this chat
    Promise.all([
      fetch('/api/init').then((r) => {
        if (r.status === 401) { router.push('/'); return null; }
        return r.json() as Promise<{ user: User; chats: Chat[] }>;
      }),
      fetch(`/api/chat/${chatId}`).then((r) => {
        if (!r.ok) return { messages: [] };
        return r.json() as Promise<{ messages: Message[] }>;
      }),
    ])
      .then(([initData, chatData]) => {
        if (!initData) return;
        if (!initData.user.onboardingCompleted) {
          router.push('/onboarding');
          return;
        }
        setUser(initData.user);
        setChats(Array.isArray(initData.chats) ? initData.chats : []);
        writeCache(initData.user, initData.chats ?? []);
        setMessages((chatData as { messages: Message[] }).messages ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cached) router.push('/');
        else setLoading(false);
      });
  }, [router, chatId]);

  const handleNewChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  const handleChatCreated = useCallback((newChatId: string, title: string) => {
    setChats((prev) => {
      const updated = [
        { id: newChatId, userId: user?.id ?? '', title, preview: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ...prev.filter((c) => c.id !== newChatId),
      ];
      if (user) writeCache(user, updated);
      return updated;
    });
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div style={{ animation: 'logoPulse 1.5s ease infinite' }}>
          <MontaiLogo size={64} />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#0D0D0D' }}>
      <div
        className="hidden md:block flex-shrink-0 h-full"
        style={{
          width: desktopSidebarVisible ? '240px' : '0px',
          minWidth: desktopSidebarVisible ? '240px' : '0px',
          overflow: 'hidden',
          transition: 'all 0.25s ease',
        }}
      >
        <Sidebar
          chats={chats}
          activeChatId={chatId}
          isOpen={false}
          onClose={() => {}}
          onNewChat={handleNewChat}
          onChatsUpdate={setChats}
          nickname={user.nickname}
        />
      </div>

      <div className="md:hidden">
        <Sidebar
          chats={chats}
          activeChatId={chatId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          onChatsUpdate={setChats}
          nickname={user.nickname}
        />
      </div>

      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        <div
          style={{
            position: 'absolute',
            top: 'max(12px, env(safe-area-inset-top, 12px))',
            left: 'max(12px, env(safe-area-inset-left, 12px))',
            zIndex: 10,
          }}
        >
          <button
            onClick={() => {
              if (window.innerWidth < 768) setSidebarOpen(true);
              else setDesktopSidebarVisible((v) => !v);
            }}
            style={{
              width: 44, height: 44, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#52525B', transition: 'background 0.15s, color 0.15s',
              touchAction: 'manipulation',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.color = '#A1A1AA'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#52525B'; }}
            aria-label="Toggle sidebar"
          >
            {desktopSidebarVisible
              ? <PanelLeftOpen size={18} strokeWidth={1.5} className="hidden md:block" />
              : <Menu size={18} strokeWidth={1.5} className="hidden md:block" />}
            <Menu size={18} strokeWidth={1.5} className="md:hidden" />
          </button>
        </div>

        <div className="flex-1 min-h-0">
          <ChatWindow
            chatId={chatId}
            initialMessages={messages}
            nickname={user.nickname}
            language={(user.language as Language) || 'en'}
            userId={user.id}
            onChatCreated={handleChatCreated}
            primarySoftware={user.primarySoftware}
            focusAreas={user.focusAreas}
            experienceLevel={user.experienceLevel}
          />
        </div>
      </div>
    </div>
  );
}
