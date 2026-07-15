'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Film } from 'lucide-react';
import ChatWindow from '@/components/chat/ChatWindow';
import Sidebar from '@/components/layout/Sidebar';
import Logo from '@/components/shared/Logo';
import type { Chat, User, Language } from '@/lib/types';

export default function ChatPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    router.replace(`/chat/${chatId}`);
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-4">
          <Film size={32} className="text-[var(--accent-primary)] animate-pulse-orange" />
          <div className="flex gap-1.5">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-screen flex overflow-hidden bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <Sidebar
        chats={chats}
        activeChatId={null}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onNewChat={handleNewChat}
        onChatsUpdate={setChats}
        nickname={user.nickname}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Mobile header */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Open sidebar"
          >
            <Menu size={20} />
          </button>
          <Logo size="sm" href={undefined} />
          <div className="w-9" />
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
