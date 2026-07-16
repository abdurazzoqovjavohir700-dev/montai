'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import MessageInput from './MessageInput';
import { toast } from 'react-hot-toast';
import type { Message, Language } from '@/lib/types';
import { generateChatTitle } from '@/lib/utils';

interface ChatWindowProps {
  chatId: string | null;
  initialMessages?: Message[];
  nickname: string;
  language: Language;
  userId: string;
  onChatCreated?: (chatId: string, title: string) => void;
  primarySoftware?: string[];
  focusAreas?: string[];
  experienceLevel?: string;
}

export default function ChatWindow({
  chatId,
  initialMessages = [],
  nickname,
  language,
  userId,
  onChatCreated,
  primarySoftware,
  focusAreas,
  experienceLevel,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [currentChatId, setCurrentChatId] = useState<string | null>(chatId);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
    setCurrentChatId(chatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); // initialMessages intentionally excluded — parent passes new [] on every render

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollBtn(distFromBottom > 200);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = useCallback(
    async (content: string, imageBase64?: string) => {
      if (!content.trim() && !imageBase64) return;
      if (isLoading) return;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        chatId: currentChatId ?? '',
        role: 'user',
        content,
        imageUrl: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : undefined,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent('');

      abortRef.current = new AbortController();

      try {
        const allMessages = [...messages, userMessage];

        // Create or get chat ID
        let activeChatId = currentChatId;
        let newChatTitle = '';
        if (!activeChatId) {
          newChatTitle = generateChatTitle(content);
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', title: newChatTitle, userId }),
            signal: abortRef.current.signal,
          });
          const data = await res.json() as { chatId: string };
          activeChatId = data.chatId;
          setCurrentChatId(activeChatId);
        }

        // Save user message (fire-and-forget)
        fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: activeChatId, role: 'user', content, imageBase64 }),
        }).catch(e => console.error('[Save user msg]', e));

        // Stream AI response
        const streamRes = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages.map((m) => ({
              role: m.role,
              content: m.imageUrl
                ? [
                    {
                      type: 'image',
                      source: {
                        type: 'base64',
                        media_type: 'image/jpeg',
                        data: m.imageUrl.split(',')[1],
                      },
                    },
                    { type: 'text', text: m.content },
                  ]
                : m.content,
            })),
            userContext: { nickname, language, experienceLevel, primarySoftware, focusAreas },
          }),
          signal: abortRef.current.signal,
        });

        if (!streamRes.ok) {
          const errData = await streamRes.json().catch(() => ({})) as { error?: string };
          throw new Error(errData.error ?? 'Stream failed');
        }
        if (!streamRes.body) throw new Error('No response body');

        const reader = streamRes.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullContent += chunk;
          setStreamingContent(fullContent);
        }

        if (!fullContent.trim()) throw new Error('Bo\'sh javob keldi');

        const aiMessage: Message = {
          id: crypto.randomUUID(),
          chatId: activeChatId,
          role: 'assistant',
          content: fullContent,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, aiMessage]);
        setStreamingContent('');

        // Browser notification — foydalanuvchi boshqa tabda bo'lsa
        if (typeof window !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Montai javob berdi', {
            body: fullContent.slice(0, 80) + (fullContent.length > 80 ? '…' : ''),
            icon: '/favicon.svg',
          });
        }

        // DB'ga saqlash
        fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: activeChatId, role: 'assistant', content: fullContent }),
        }).catch(e => console.error('[Save AI msg]', e));

        // Stream tugagandan keyin navigation — refresh ko'rinmaydi
        if (newChatTitle) {
          fetch('/api/chat/title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: activeChatId, message: content }),
          })
            .then((r) => r.json() as Promise<{ title: string }>)
            .then(({ title }) => onChatCreated?.(activeChatId!, title))
            .catch(() => onChatCreated?.(activeChatId!, newChatTitle));
        }
      } catch (err: unknown) {
        if ((err as { name?: string }).name !== 'AbortError') {
          const msg = (err as Error).message ?? '';
          toast.error(msg || 'Xatolik yuz berdi. Qaytadan urinib ko\'ring.');
          setStreamingContent('');
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [
      isLoading,
      currentChatId,
      messages,
      userId,
      nickname,
      language,
      experienceLevel,
      primarySoftware,
      focusAreas,
      onChatCreated,
    ]
  );

  // Notification ruxsati so'rash
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Qayta generatsiya — AI javobini o'chira va qaytadan stream qiladi
  const handleRegenerate = useCallback(async (messageId: string) => {
    const idx = messages.findIndex(m => m.id === messageId);
    if (idx < 0 || isLoading) return;
    const contextMessages = messages.slice(0, idx);
    setMessages(contextMessages);
    setIsLoading(true);
    setStreamingContent('');
    abortRef.current = new AbortController();
    try {
      const streamRes = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: contextMessages.map(m => ({
            role: m.role,
            content: m.imageUrl
              ? [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: m.imageUrl.split(',')[1] } }, { type: 'text', text: m.content }]
              : m.content,
          })),
          userContext: { nickname, language, experienceLevel, primarySoftware, focusAreas },
        }),
        signal: abortRef.current.signal,
      });
      if (!streamRes.ok || !streamRes.body) throw new Error('Stream failed');
      const reader = streamRes.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullContent += decoder.decode(value);
        setStreamingContent(fullContent);
      }
      if (!fullContent.trim()) throw new Error('Bo\'sh javob');
      const aiMsg: Message = { id: crypto.randomUUID(), chatId: currentChatId ?? '', role: 'assistant', content: fullContent, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, aiMsg]);
      setStreamingContent('');
      if (currentChatId) {
        fetch('/api/chat/message', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chatId: currentChatId, role: 'assistant', content: fullContent }) }).catch(() => {});
      }
    } catch (err) {
      if ((err as { name?: string }).name !== 'AbortError') {
        toast.error('Qayta urinishda xatolik yuz berdi');
        setStreamingContent('');
      }
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages, isLoading, currentChatId, nickname, language, experienceLevel, primarySoftware, focusAreas]);

  const showWelcome = messages.length === 0 && !isLoading && !streamingContent;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Messages scroll */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto' }}
      >
        {showWelcome ? (
          <WelcomeScreen nickname={nickname} language={language} onSelectSuggestion={handleSend} />
        ) : (
          <div style={{ maxWidth: '780px', margin: '0 auto', padding: '48px 24px 24px' }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onEditResend={(id, newContent) => {
                    const idx = messages.findIndex(m => m.id === id);
                    if (idx === -1) return;
                    setMessages(prev => prev.slice(0, idx));
                    void handleSend(newContent);
                  }}
                  onRegenerate={msg.role === 'assistant' ? handleRegenerate : undefined}
                />
              ))}
            </AnimatePresence>

            {streamingContent && (
              <MessageBubble
                message={{
                  id: 'streaming',
                  chatId: currentChatId ?? '',
                  role: 'assistant',
                  content: streamingContent,
                  createdAt: new Date().toISOString(),
                }}
              />
            )}

            {isLoading && !streamingContent && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-28 right-6 w-9 h-9 rounded-full flex items-center justify-center shadow-lg z-10"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <ChevronDown size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Input — centered at 780px */}
      <div style={{ width: '100%', padding: '12px 24px 24px', background: '#0D0D0D' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <MessageInput
            onSend={handleSend}
            onStop={() => { abortRef.current?.abort(); }}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
