'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import MessageInput, { type AttachedImage, type AttachedPdf } from './MessageInput';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { loadChatBg, applyChatBg } from '@/components/settings/ChatBgPicker';
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
    async (content: string, images?: AttachedImage[], pdf?: AttachedPdf) => {
      if (!content.trim() && (!images || images.length === 0) && !pdf) return;
      if (isLoading) return;

      const imageUrls = images?.map(img => `data:${img.mime};base64,${img.base64}`);

      // Prepend PDF text to content so AI gets full context
      const contentWithPdf = pdf
        ? `📄 **${pdf.name}** (${pdf.pages} sahifa) PDF mazmuni:\n\n${pdf.text}\n\n---\n\n${content || 'Yuqoridagi PDF hujjatini tahlil qil.'}`
        : content;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        chatId: currentChatId ?? '',
        role: 'user',
        content: contentWithPdf,
        imageUrl: imageUrls?.[0],
        imageUrls,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent('');

      abortRef.current = new AbortController();
      // 60-second safety timeout — prevents infinite loading if stream hangs on mobile
      const streamTimeout = setTimeout(() => abortRef.current?.abort(), 60_000);

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
          if (res.status === 401) {
            try { localStorage.removeItem('montai_init_cache'); } catch {}
            window.location.href = '/';
            return;
          }
          const data = await res.json() as { chatId?: string; error?: string };
          if (!data.chatId) throw new Error(data.error ?? "Chat yaratib bo'lmadi");
          activeChatId = data.chatId;
          setCurrentChatId(activeChatId);
        }

        // Save user message (fire-and-forget, saves first image)
        fetch('/api/chat/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chatId: activeChatId, role: 'user', content,
            imageBase64: images?.[0]?.base64,
            imageMime: images?.[0]?.mime,
          }),
        }).catch(e => console.error('[Save user msg]', e));

        // Stream AI response
        // IMPORTANT: Only send image data for the CURRENT message.
        // Historical messages have their base64 stripped to avoid:
        // 1. Enormous payloads (1MB image = millions of tokens in history)
        // 2. Text-only model receiving image blocks → 400 error → frozen UI
        const streamRes = await fetch('/api/chat/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: allMessages.map((m, idx) => {
              const isCurrentMsg = idx === allMessages.length - 1;
              const urls = m.imageUrls ?? (m.imageUrl ? [m.imageUrl] : []);

              // History messages with images → replace with text placeholder
              if (urls.length > 0 && !isCurrentMsg) {
                const note = urls.length > 1
                  ? `[Foydalanuvchi ${urls.length} ta rasm yubordi]`
                  : '[Foydalanuvchi rasm yubordi]';
                return { role: m.role, content: m.content.trim() ? `${note}\n${m.content}` : note };
              }

              // No images → plain text
              if (urls.length === 0) return { role: m.role, content: m.content };

              // Current message with images → full vision blocks
              const toBlock = (url: string) => {
                const isDataUrl = url.startsWith('data:');
                if (isDataUrl) {
                  const [header, data] = url.split(',');
                  const mediaType = header.replace('data:', '').replace(';base64', '') || 'image/jpeg';
                  return { type: 'image' as const, source: { type: 'base64' as const, media_type: mediaType, data } };
                }
                return { type: 'image_url' as const, image_url: { url } };
              };

              const blocks: unknown[] = urls.map(toBlock);
              if (m.content.trim()) blocks.push({ type: 'text', text: m.content });
              return { role: m.role, content: blocks };
            }),
            userContext: { nickname, language, experienceLevel, primarySoftware, focusAreas },
          }),
          signal: abortRef.current.signal,
        });

        if (!streamRes.ok) {
          if (streamRes.status === 401) {
            try { localStorage.removeItem('montai_init_cache'); } catch {}
            window.location.href = '/';
            return;
          }
          const errData = await streamRes.json().catch(() => ({})) as { error?: string };
          throw new Error(errData.error ?? `Xatolik (${streamRes.status})`);
        }

        // Moderation block — server returns 200 with JSON error field
        const contentType = streamRes.headers.get('Content-Type') ?? '';
        if (contentType.includes('application/json')) {
          const modData = await streamRes.json().catch(() => ({})) as { error?: string };
          if (modData.error) {
            // Show moderation message as AI response in chat
            const modMsg = {
              id: crypto.randomUUID(),
              chatId: currentChatId ?? '',
              role: 'assistant' as const,
              content: modData.error,
              createdAt: new Date().toISOString(),
            };
            setMessages(prev => [...prev, modMsg]);
            setIsLoading(false);
            return;
          }
        }

        if (!streamRes.body) throw new Error("Javob kelmadi — qaytadan urinib ko'ring.");

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

        if (!fullContent.trim()) throw new Error('AI bo\'sh javob qaytardi');

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
        const isAbort = (err as { name?: string }).name === 'AbortError';
        if (!isAbort) {
          const msg = (err as Error).message ?? '';
          const is429 = msg.includes('429')
            || msg.toLowerCase().includes('rate limit')
            || msg.toLowerCase().includes('cheklovi')
            || msg.toLowerCase().includes('limitiga')
            || msg.toLowerCase().includes('limit exceeded');
          const isNet = msg.includes('Failed to fetch')
            || msg.includes('NetworkError')
            || (msg.toLowerCase().includes('tarmoq'));
          const isTimeout = msg.toLowerCase().includes('timeout')
            || msg.toLowerCase().includes('aborted')
            || msg.toLowerCase().includes('vaqti tugadi');

          // Use server's Uzbek error message directly if it exists and is meaningful
          const isBareInternalMsg = !msg || msg === 'Stream failed' || msg.startsWith('Xatolik (');
          const friendlyText = is429
            ? '⚠️ AI server cheklovi — bir daqiqa kuting va qaytadan yuboring.\n\n_(Groq bepul rejim limitiga yetildi. 60 soniya kutib qaytadan yuboring.)_'
            : isNet
            ? "⚠️ Tarmoq xatosi — internet ulanishingizni tekshiring va qaytadan urinib ko'ring."
            : isTimeout
            ? '⚠️ Javob vaqti tugadi — qaytadan yuboring.'
            : isBareInternalMsg
            ? "⚠️ Xatolik yuz berdi. Qaytadan urinib ko'ring."
            : `⚠️ ${msg}`;

          // Show error as chat message so it doesn't silently disappear
          setMessages(prev => [
            ...prev,
            {
              id: crypto.randomUUID(),
              chatId: currentChatId ?? '',
              role: 'assistant' as const,
              content: friendlyText,
              createdAt: new Date().toISOString(),
            },
          ]);
          setStreamingContent('');

          toast.error(
            is429 ? 'AI cheklovi — 1 daqiqa kuting' :
            isNet ? 'Tarmoq xatosi' :
            isTimeout ? 'Javob vaqti tugadi' :
            'Xatolik yuz berdi',
          );
        }
        setStreamingContent('');
      } finally {
        clearTimeout(streamTimeout);
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

  // Chat background — localStorage dan yuklash
  useEffect(() => {
    applyChatBg(loadChatBg());
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
          // Same strip-history-images logic as handleSend
          messages: contextMessages.map((m, idx) => {
            const isCurrentMsg = idx === contextMessages.length - 1;
            const urls = m.imageUrls ?? (m.imageUrl ? [m.imageUrl] : []);
            if (urls.length > 0 && !isCurrentMsg) {
              const note = urls.length > 1
                ? `[Foydalanuvchi ${urls.length} ta rasm yubordi]`
                : '[Foydalanuvchi rasm yubordi]';
              return { role: m.role, content: m.content.trim() ? `${note}\n${m.content}` : note };
            }
            if (urls.length === 0) return { role: m.role, content: m.content };
            const toBlock = (url: string) => {
              const isDataUrl = url.startsWith('data:');
              if (isDataUrl) {
                const [header, data] = url.split(',');
                const mediaType = header.replace('data:', '').replace(';base64', '') || 'image/jpeg';
                return { type: 'image' as const, source: { type: 'base64' as const, media_type: mediaType, data } };
              }
              return { type: 'image_url' as const, image_url: { url } };
            };
            const blocks: unknown[] = urls.map(toBlock);
            if (m.content.trim()) blocks.push({ type: 'text', text: m.content });
            return { role: m.role, content: blocks };
          }),
          userContext: { nickname, language, experienceLevel, primarySoftware, focusAreas },
        }),
        signal: abortRef.current.signal,
      });
      if (streamRes.status === 401) {
        try { localStorage.removeItem('montai_init_cache'); } catch {}
        window.location.href = '/';
        return;
      }
      if (!streamRes.ok) {
        const errData = await streamRes.json().catch(() => ({})) as { error?: string };
        throw new Error(errData.error ?? `Xatolik (${streamRes.status})`);
      }
      if (!streamRes.body) throw new Error("Javob kelmadi.");
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
        toast.error('Qayta generatsiyada xatolik yuz berdi', { description: (err as Error).message });
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
      {/* Chat background layers */}
      <div className="chat-bg-layer" />
      <div className="chat-bg-overlay" />

      <ToastContainer />
      {/* Messages scroll */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: 'auto', zIndex: 2 }}
      >
        {showWelcome ? (
          <WelcomeScreen nickname={nickname} language={language} onSelectSuggestion={handleSend} />
        ) : (
          <div className="chat-messages-container">
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

            {isLoading && !streamingContent && (
              <TypingIndicator hasImage={messages.at(-1)?.imageUrls ? messages.at(-1)!.imageUrls!.length > 0 : !!messages.at(-1)?.imageUrl} />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input — scroll button floats above input so it always clears the input area */}
      <div className="chat-input-wrapper" style={{ zIndex: 2, position: 'relative' }}>
        <AnimatePresence>
          {showScrollBtn && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={scrollToBottom}
              style={{
                position: 'absolute',
                top: 0,
                right: '1.25rem',
                transform: 'translateY(calc(-100% - 10px))',
                width: 36,
                height: 36,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              <ChevronDown size={18} />
            </motion.button>
          )}
        </AnimatePresence>
        <div className="chat-input-inner">
          <MessageInput
            onSend={handleSend}
            onStop={() => { abortRef.current?.abort(); }}
            onNewChat={() => {
              setMessages([]);
              setCurrentChatId(null);
            }}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
