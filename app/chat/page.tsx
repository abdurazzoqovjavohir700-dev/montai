'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, PanelLeftOpen } from 'lucide-react';
import MontaiLogo from '@/components/shared/MontaiLogo';
import ChatWindow from '@/components/chat/ChatWindow';
import Sidebar from '@/components/layout/Sidebar';
import type { Chat, User, Language } from '@/lib/types';

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(true);
  const [chatKey, setChatKey] = useState(0);

  useEffect(() => {
    Promise.all([
      fetch('/api/user').then((r) => {
        if (r.status === 401) { router.push('/'); return null; }
        return r.json() as Promise<User>;
      }),
      fetch('/api/chat/history').then((r) => r.json() as Promise<Chat[]>),
    ])
      .then(([userData, chatsData]) => {
        if (!userData) return;
        if (!userData.onboardingCompleted) {
          router.push('/onboarding');
          return;
        }
        setUser(userData);
        setChats(Array.isArray(chatsData) ? chatsData : []);
        setLoading(false);
      })
      .catch(() => router.push('/'));
  }, [router]);

  const handleNewChat = useCallback(() => {
    setChatKey((k) => k + 1);
    router.push('/chat');
  }, [router]);

  const handleChatCreated = useCallback((chatId: string, title: string) => {
    setChats((prev) => [
      { id: chatId, userId: user?.id ?? '', title, preview: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ...prev.filter((c) => c.id !== chatId),
    ]);
    // URL ni yangilaymiz lekin navigation qilmaymiz — remount bo'lmasin
    window.history.replaceState(null, '', `/chat/${chatId}`);
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <div style={{ animation: 'logoPulse 1.5s ease infinite' }}>
            <MontaiLogo size={64} />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#0D0D0D' }}>
      {/* Desktop sidebar wrapper with slide animation */}
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

      {/* Mobile sidebar */}
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

      {/* Main area — no separate header bar */}
      <div className="flex flex-col flex-1 min-w-0 h-full relative">
        {/* Floating sidebar toggle — top-left, overlaid on content */}
        <div
          style={{
            position: 'absolute', top: 12, left: 12, zIndex: 10,
          }}
        >
          <button
            onClick={() => {
              if (window.innerWidth < 768) setSidebarOpen(true);
              else setDesktopSidebarVisible((v) => !v);
            }}
            style={{
              width: 32, height: 32, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#52525B', transition: 'background 0.15s, color 0.15s',
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

        {/* Chat window */}
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
