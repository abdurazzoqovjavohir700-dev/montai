'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, PanelLeftClose } from 'lucide-react';
import MontaiLogo from '@/components/shared/MontaiLogo';
import ChatWindow from '@/components/chat/ChatWindow';
import Sidebar from '@/components/layout/Sidebar';
import Logo from '@/components/shared/Logo';
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
    <div className="h-screen flex overflow-hidden bg-[var(--bg-primary)]">
      {/* Desktop sidebar wrapper with slide animation */}
      <div
        className="hidden md:block flex-shrink-0 h-full"
        style={{
          width: desktopSidebarVisible ? '260px' : '0px',
          minWidth: desktopSidebarVisible ? '260px' : '0px',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
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

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <button
            onClick={() => {
              if (window.innerWidth < 768) setSidebarOpen(true);
              else setDesktopSidebarVisible((v) => !v);
            }}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-tertiary)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'; }}
            aria-label="Toggle sidebar"
          >
            {desktopSidebarVisible ? <PanelLeftClose size={20} className="hidden md:block" /> : <Menu size={20} className="hidden md:block" />}
            <Menu size={20} className="md:hidden" />
          </button>
          {/* Logo only on mobile (sidebar hidden on mobile) */}
          <div className="md:hidden">
            <Logo size="sm" href={undefined} />
          </div>
          <div className="w-9 md:hidden" />
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
