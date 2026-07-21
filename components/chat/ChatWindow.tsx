'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import MessageInput, { type AttachedImage, type AttachedPdf } from './MessageInput';
import CommandPalette from './CommandPalette';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { loadChatBg, applyChatBg } from '@/components/settings/ChatBgPicker';
import type { Message, Language } from '@/lib/types';
import { generateChatTitle } from '@/lib/utils';
import { detectPdfRequest, extractPdfTitle, generatePdf } from '@/lib/pdf-generator';
import { aiRM, type RMStatus } from '@/lib/request-manager';

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
  const [rmStatus, setRmStatus] = useState<RMStatus>({ state: 'idle', queueDepth: 0, attempt: 0, maxAttempts: 5 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => aiRM.subscribe(setRmStatus), []);

  useEffect(() => {
    setMessages(initialMessages);
    setCurrentChatId(chatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); // initialMessages intentionally excluded — parent passes new [] on every render

  useEffect(() => {
    // Use requestAnimationFrame to avoid layout thrashing
    const id = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    });
    return () => cancelAnimationFrame(id);
  }, [messages.length, !!streamingContent]);

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

      // Prepend PDF text — 65% token budget: text already truncated by server
      const contentWithPdf = pdf
        ? `[PDF_ATTACH]: **${pdf.name}** (${pdf.pages} sahifa${pdf.truncated ? ', matn qisqartirildi' : ''})\n\n${pdf.text}\n\n---\n\n${content || 'Yuqoridagi PDF hujjatini chuqur tahlil qil. Asosiy g\'oyalar, xulosalar va muhim faktlarni ajratib ko\'rsat.'}`
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

        // Build stream payload (only current message gets image data)
        const streamPayload = {
          messages: allMessages.map((m, idx) => {
            const isCurrentMsg = idx === allMessages.length - 1;
            const urls = m.imageUrls ?? (m.imageUrl ? [m.imageUrl] : []);

            if (urls.length > 0 && !isCurrentMsg) {
              const note = urls.length > 1
                ? `[Foydalanuvchi ${urls.length} ta rasm yubordi]`
                : '[Foydalanuvchi rasm yubordi]';
              return { role: m.role, content: m.content.trim() ? `${note}\n${m.content}` : note };
            }

            if (urls.length === 0) return { role: m.role, content: m.content };

            const toBlock = (url: string) => {
              if (url.startsWith('data:')) {
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
        };

        // aiRM.sendRaw() auto-retries 429/500/502/503/504 with exponential backoff.
        // Shows "Processing..." status via RMStatus — never shows "wait 1 minute".
        const streamRes = await aiRM.sendRaw(
          '/api/chat/stream',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(streamPayload),
          },
          abortRef.current.signal,
        );

        if (streamRes.status === 401) {
          try { localStorage.removeItem('montai_init_cache'); } catch {}
          window.location.href = '/';
          return;
        }

        // 422 = moderation block (not retryable — intentional)
        if (streamRes.status === 422) {
          const modData = await streamRes.json().catch(() => ({})) as { error?: string };
          if (modData.error) {
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(),
              chatId: currentChatId ?? '',
              role: 'assistant' as const,
              content: modData.error!,
              createdAt: new Date().toISOString(),
            }]);
            setIsLoading(false);
            return;
          }
        }

        if (!streamRes.ok) {
          const errData = await streamRes.json().catch(() => ({})) as { error?: string };
          throw new Error(errData.error ?? `Xatolik (${streamRes.status})`);
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

        // Auto PDF generation if user requested it
        if (detectPdfRequest(content)) {
          const title = extractPdfTitle(content);
          const filename = `${title.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_-]/g,'').toLowerCase() || 'montai_doc'}.pdf`;
          toast.info('PDF tayyorlanmoqda...', { duration: 3000 });
          setTimeout(() => {
            generatePdf({ title, content: fullContent, filename, author: nickname })
              .then(() => toast.success('PDF tayyor — yuklab olindi'))
              .catch((err) => {
                console.error('[PDF generation]', err);
                toast.error('PDF yaratishda xatolik. Qaytadan urinib ko\'ring.');
              });
          }, 400);
        }

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
        const isAbort =
          (err as { name?: string }).name === 'AbortError' ||
          (err as { code?: string }).code === 'CANCELLED';

        if (!isAbort) {
          const rawMsg = (err as Error).message ?? '';
          const isNet = rawMsg.toLowerCase().includes('failed to fetch')
            || rawMsg.toLowerCase().includes('networkerror')
            || rawMsg.toLowerCase().includes('tarmoq');

          // Strip provider-specific wait messages — user never sees "1 daqiqa kuting"
          const friendlyText = rawMsg.match(/daqiqa|kuting|wait.*min|min.*wait/i)
            ? "Xatolik yuz berdi. Qaytadan urinib ko'ring."
            : isNet
            ? "Tarmoq ulanishi yo'q — internet aloqasini tekshiring."
            : rawMsg || "Xatolik yuz berdi. Qaytadan urinib ko'ring.";

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

          toast.error(isNet ? 'Tarmoq xatosi' : 'Xatolik yuz berdi');
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

  // Quick action from AIBubble (Explain Simpler, Continue, Translate, etc.)
  const handleQuickAction = useCallback((prompt: string) => {
    void handleSend(prompt);
  }, [handleSend]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sidebar custom events — items dispatch 'montai:send' to inject prompts
  useEffect(() => {
    const handler = (e: Event) => {
      const prompt = (e as CustomEvent<{ prompt: string }>).detail?.prompt;
      if (prompt) void handleSend(prompt);
    };
    window.addEventListener('montai:send', handler);
    return () => window.removeEventListener('montai:send', handler);
  }, [handleSend]);

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

  const inputElement = (
    <MessageInput
      onSend={handleSend}
      onStop={() => { abortRef.current?.abort(); }}
      onNewChat={() => {
        setMessages([]);
        setCurrentChatId(null);
      }}
      isLoading={isLoading}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Chat background layers */}
      <div className="chat-bg-layer" />
      <div className="chat-bg-overlay" />

      <ToastContainer />
      <CommandPalette
        onNewChat={() => { setMessages([]); setCurrentChatId(null); }}
        recentChats={messages.filter(m => m.role === 'user').slice(-5).map(m => ({ id: m.chatId || m.id, title: m.content.slice(0, 50) }))}
      />

      {/* Messages scroll — min-height:0 ensures flex child can shrink so %height children work */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', zIndex: 2, display: 'flex', flexDirection: 'column' }}
      >
        <AnimatePresence mode="wait">
          {showWelcome ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <WelcomeScreen
                nickname={nickname}
                language={language}
                onSelectSuggestion={handleSend}
                inputSlot={inputElement}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
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
                      onQuickAction={msg.role === 'assistant' ? handleQuickAction : undefined}
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

                {isLoading && !streamingContent && (() => {
                  const lastMsg = messages.at(-1);
                  const hasImg = lastMsg?.imageUrls ? lastMsg.imageUrls.length > 0 : !!lastMsg?.imageUrl;
                  const hasPdf = !hasImg && !!(lastMsg?.content?.startsWith('[PDF_ATTACH]:'));
                  return (
                    <>
                      {/* Retry / queue status — replaces "wait 1 minute" */}
                      {(rmStatus.state === 'retrying' || rmStatus.attempt > 0) && (
                        <motion.div
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 14px', borderRadius: 10, marginBottom: 6,
                            background: 'rgba(96,165,250,0.06)',
                            border: '1px solid rgba(96,165,250,0.12)',
                          }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          >
                            <Loader2 size={13} strokeWidth={2} style={{ color: '#60A5FA' }} />
                          </motion.div>
                          <span style={{ fontSize: 12.5, color: '#A1A1AA', fontFamily: 'Inter, sans-serif' }}>
                            {rmStatus.state === 'retrying'
                              ? `So'rov qayta yuborilmoqda (${rmStatus.attempt}/${rmStatus.maxAttempts})...`
                              : rmStatus.queueDepth > 1
                              ? `Navbatda ${rmStatus.queueDepth - 1} ta so'rov`
                              : 'So\'rovingiz qayta ishlanmoqda...'}
                          </span>
                        </motion.div>
                      )}
                      <TypingIndicator hasImage={hasImg} hasPdf={hasPdf} />
                    </>
                  );
                })()}
                <div ref={bottomRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom input — only shown when chat has messages */}
      <AnimatePresence>
        {!showWelcome && (
          <motion.div
            key="bottom-input"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="chat-input-wrapper"
            style={{ zIndex: 2, position: 'relative' }}
          >
            <AnimatePresence>
              {showScrollBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.75, y: 6 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 24 }}
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
              {inputElement}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
