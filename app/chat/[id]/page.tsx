'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Menu, PanelLeftClose } from 'lucide-react';
import MontaiLogo from '@/components/shared/MontaiLogo';
import ChatWindow from '@/components/chat/ChatWindow';
import Sidebar from '@/components/layout/Sidebar';
import Logo from '@/components/shared/Logo';
import type { Chat, Message, User, Language } from '@/lib/types';

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
    Promise.all([
      fetch('/api/user').then((r) => {
        if (r.status === 401) { router.push('/'); return null; }
        return r.json() as Promise<User>;
      }),
      fetch('/api/chat/history').then((r) => r.json() as Promise<Chat[]>),
      fetch(`/api/chat/${chatId}`).then((r) => {
        if (!r.ok) return { messages: [] };
        return r.json() as Promise<{ messages: Message[] }>;
      }),
    ])
      .then(([userData, chatsData, chatData]) => {
        if (!userData) return;
        if (!userData.onboardingCompleted) {
          router.push('/onboarding');
          return;
        }
        setUser(userData);
        setChats(Array.isArray(chatsData) ? chatsData : []);
        setMessages((chatData as { messages: Message[] }).messages ?? []);
        setLoading(false);
      })
      .catch(() => router.push('/'));
  }, [router, chatId]);

  const handleNewChat = useCallback(() => {
    router.push('/chat');
  }, [router]);

  const handleChatCreated = useCallback((newChatId: string, title: string) => {
    setChats((prev) => [
      { id: newChatId, userId: user?.id ?? '', title, preview: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ...prev.filter((c) => c.id !== newChatId),
    ]);
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
    <div className="h-screen flex overflow-hidden bg-[var(--bg-primary)]">
      {/* Desktop sidebar */}
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
          activeChatId={chatId}
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
          activeChatId={chatId}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onNewChat={handleNewChat}
          onChatsUpdate={setChats}
          nickname={user.nickname}
        />
      </div>

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
          <div className="md:hidden">
            <Logo size="sm" href={undefined} />
          </div>
          <div className="w-9 md:hidden" />
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
