'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMessages(initialMessages);
    setCurrentChatId(chatId);
  }, [chatId, initialMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

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
        if (!activeChatId) {
          const chatTitle = generateChatTitle(content);
          const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create', title: chatTitle, userId }),
            signal: abortRef.current.signal,
          });
          const data = await res.json() as { chatId: string };
          activeChatId = data.chatId;
          setCurrentChatId(activeChatId);

          // Auto-generate better title in background
          fetch('/api/chat/title', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chatId: activeChatId, message: content }),
          })
            .then((r) => r.json() as Promise<{ title: string }>)
            .then(({ title }) => {
              onChatCreated?.(activeChatId!, title);
            })
            .catch(() => {
              onChatCreated?.(activeChatId!, chatTitle);
            });
        }

        // Save user message
        await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChatId,
            role: 'user',
            content,
            imageBase64,
          }),
          signal: abortRef.current.signal,
        });

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

        if (!streamRes.ok) throw new Error('Stream failed');
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

        // Save AI response
        const aiMessage: Message = {
          id: crypto.randomUUID(),
          chatId: activeChatId,
          role: 'assistant',
          content: fullContent,
          createdAt: new Date().toISOString(),
        };

        await fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChatId,
            role: 'assistant',
            content: fullContent,
          }),
        });

        setMessages((prev) => [...prev, aiMessage]);
        setStreamingContent('');
      } catch (err: unknown) {
        if ((err as { name?: string }).name !== 'AbortError') {
          toast.error('Failed to get response. Please try again.');
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

  const showWelcome = messages.length === 0 && !isLoading && !streamingContent;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {showWelcome ? (
          <WelcomeScreen
            nickname={nickname}
            language={language}
            onSelectSuggestion={handleSend}
          />
        ) : (
          <div className="py-4 space-y-1">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </AnimatePresence>

            {/* Streaming message */}
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

            {/* Typing indicator (before streaming starts) */}
            {isLoading && !streamingContent && (
              <TypingIndicator />
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-[var(--border-subtle)] bg-[var(--bg-primary)]">
        <MessageInput
          onSend={handleSend}
          isLoading={isLoading}
          disabled={false}
        />
      </div>
    </div>
  );
}
