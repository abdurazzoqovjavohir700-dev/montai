'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Menu, PanelLeftOpen } from 'lucide-react';
import MontaiLogo from '@/components/shared/MontaiLogo';
import ChatWindow from '@/components/chat/ChatWindow';
import GuestChatWindow from '@/components/chat/GuestChatWindow';
import Sidebar from '@/components/layout/Sidebar';
import type { Chat, User, Language } from '@/lib/types';

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

export function clearInitCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
}

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isGuest = searchParams.get('guest') === '1';

  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(!isGuest);
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    if (isGuest) return; // Guest mode — skip auth check

    // 1. Show cached data immediately
    const cached = readCache();
    if (cached?.user?.onboardingCompleted) {
      setUser(cached.user);
      setChats(cached.chats ?? []);
      setLoading(false);
    }

    // 2. Fetch fresh data in background
    fetch('/api/init')
      .then((r) => {
        if (r.status === 401) { clearInitCache(); router.push('/'); return null; }
        return r.json() as Promise<{ user: User; chats: Chat[] }>;
      })
      .then((data) => {
        if (!data) return;
        if (!data.user.onboardingCompleted) {
          clearInitCache();
          router.push('/onboarding');
          return;
        }
        setUser(data.user);
        setChats(Array.isArray(data.chats) ? data.chats : []);
        writeCache(data.user, data.chats ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cached) router.push('/');
      });
  }, [router, isGuest]);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    router.push('/chat');
  }, [router]);

  const handleChatCreated = useCallback((chatId: string, title: string) => {
    setChats((prev) => {
      const updated = [
        { id: chatId, userId: user?.id ?? '', title, preview: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        ...prev.filter((c) => c.id !== chatId),
      ];
      if (user) writeCache(user, updated);
      return updated;
    });
    window.history.replaceState(null, '', `/chat/${chatId}`);
  }, [user]);

  // Guest mode — render guest chat directly
  if (isGuest) {
    return (
      <div
        className="flex overflow-hidden"
        style={{
          background: '#0D0D0D',
          height: '100dvh',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        }}
      >
        <div className="flex flex-col flex-1 min-w-0 h-full relative">
          <GuestChatWindow key={chatKey} />
        </div>
      </div>
    );
  }

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
    <div
      className="flex overflow-hidden"
      style={{
        background: '#0D0D0D',
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
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
          activeChatId={null}
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
          activeChatId={null}
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
            key={chatKey}
            chatId={null}
            initialMessages={[]}
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

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0A0A0B' }}>
        <MontaiLogo size={56} />
      </div>
    }>
      <ChatPageInner />
    </Suspense>
  );
}
