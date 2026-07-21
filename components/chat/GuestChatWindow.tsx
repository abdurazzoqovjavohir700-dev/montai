'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, LogIn, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import WelcomeScreen from './WelcomeScreen';
import MessageInput, { type AttachedImage, type AttachedPdf } from './MessageInput';
import { toast, ToastContainer } from '@/components/ui/Toast';
import { detectPdfRequest, extractPdfTitle, generatePdf } from '@/lib/pdf-generator';
import type { Message } from '@/lib/types';
import { aiRM, type RMStatus } from '@/lib/request-manager';

const GUEST_MSG_THRESHOLD = 3; // Show "sign in" prompt after this many messages

export default function GuestChatWindow() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [showSignInBanner, setShowSignInBanner] = useState(false);
  const [rmStatus, setRmStatus] = useState<RMStatus>({ state: 'idle', queueDepth: 0, attempt: 0, maxAttempts: 5 });
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => aiRM.subscribe(setRmStatus), []);
  const msgCountRef = useRef(0);

  useEffect(() => {
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

  const handleSend = useCallback(
    async (content: string, images?: AttachedImage[], pdf?: AttachedPdf) => {
      if (!content.trim() && (!images || images.length === 0) && !pdf) return;
      if (isLoading) return;

      const imageUrls = images?.map(img => `data:${img.mime};base64,${img.base64}`);

      const contentWithPdf = pdf
        ? `[PDF_ATTACH]: **${pdf.name}** (${pdf.pages} sahifa${pdf.truncated ? ', qisqartirildi' : ''})\n\n${pdf.text}\n\n---\n\n${content || 'Bu PDFni tahlil qil.'}`
        : content;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        chatId: 'guest',
        role: 'user',
        content: contentWithPdf,
        imageUrl: imageUrls?.[0],
        imageUrls,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setStreamingContent('');

      // Show sign-in banner after threshold
      msgCountRef.current++;
      if (msgCountRef.current >= GUEST_MSG_THRESHOLD) {
        setShowSignInBanner(true);
      }

      abortRef.current = new AbortController();
      const streamTimeout = setTimeout(() => abortRef.current?.abort(), 60_000);

      try {
        const allMessages = [...messages, userMessage];

        const guestPayload = {
          messages: allMessages.map((m, idx) => {
            const isCurrentMsg = idx === allMessages.length - 1;
            const urls = m.imageUrls ?? (m.imageUrl ? [m.imageUrl] : []);

            if (urls.length > 0 && !isCurrentMsg) {
              return { role: m.role, content: `[Foydalanuvchi rasm yubordi]\n${m.content}` };
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
            const userText = m.content.trim();
            blocks.push({ type: 'text', text: userText || 'Analyze this image in detail.' });
            return { role: m.role, content: blocks };
          }),
          userContext: { nickname: 'Guest', language: 'uz' },
        };

        // aiRM.sendRaw() auto-retries 429/500/502/503/504 — never blocks with "wait 1 minute"
        const streamRes = await aiRM.sendRaw(
          '/api/guest/stream',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(guestPayload),
          },
          abortRef.current.signal,
        );

        // 422 = moderation block (not retryable)
        if (streamRes.status === 422) {
          const modData = await streamRes.json().catch(() => ({})) as { error?: string };
          if (modData.error) {
            setMessages(prev => [...prev, {
              id: crypto.randomUUID(), chatId: 'guest',
              role: 'assistant' as const, content: modData.error!,
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

        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), chatId: 'guest',
          role: 'assistant', content: fullContent,
          createdAt: new Date().toISOString(),
        }]);
        setStreamingContent('');

        // Only generate PDF when AI produced actual document content (starts with # heading).
        const isPdfRequest = detectPdfRequest(content);
        const aiProducedDoc = fullContent.trimStart().startsWith('#') && fullContent.length > 300;
        if (isPdfRequest && aiProducedDoc) {
          const title = extractPdfTitle(content);
          const filename = `${title.replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_-]/g,'').toLowerCase() || 'montai_doc'}.pdf`;
          toast.info('PDF tayyorlanmoqda...', { duration: 3000 });
          setTimeout(() => {
            generatePdf({ title, content: fullContent, filename })
              .then(() => toast.success('PDF tayyor — yuklab olindi'))
              .catch((err) => {
                console.error('[PDF generation]', err);
                toast.error('PDF yaratishda xatolik. Qaytadan urinib ko\'ring.');
              });
          }, 400);
        }
      } catch (err: unknown) {
        const isAbort =
          (err as { name?: string }).name === 'AbortError' ||
          (err as { code?: string }).code === 'CANCELLED';

        if (!isAbort) {
          const rawMsg = (err as Error).message ?? '';
          const isNet = rawMsg.toLowerCase().includes('failed to fetch')
            || rawMsg.toLowerCase().includes('networkerror');

          // Check if this is an exhausted guest limit (not provider rate limit)
          const isGuestLimit = rawMsg === 'guest_limit_reached';

          const friendlyText = isGuestLimit
            ? "Bepul urinishlar tugadi. Davom etish uchun ro'yxatdan o'ting."
            : rawMsg.match(/daqiqa|kuting|wait.*min/i)
            ? "Xatolik yuz berdi. Qaytadan urinib ko'ring."
            : isNet
            ? "Tarmoq ulanishi yo'q — internet aloqasini tekshiring."
            : rawMsg || "Xatolik yuz berdi. Qaytadan urinib ko'ring.";

          if (isGuestLimit) setShowSignInBanner(true);

          setMessages(prev => [...prev, {
            id: crypto.randomUUID(), chatId: 'guest',
            role: 'assistant' as const, content: friendlyText,
            createdAt: new Date().toISOString(),
          }]);
          setStreamingContent('');
          toast.error(isGuestLimit ? "Ro'yxatdan o'ting" : isNet ? 'Tarmoq xatosi' : 'Xatolik yuz berdi');
        }
        setStreamingContent('');
      } finally {
        clearTimeout(streamTimeout);
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [isLoading, messages]
  );

  // Listen for sidebar prompt injections — placed after handleSend is declared
  useEffect(() => {
    const handler = (e: Event) => {
      const prompt = (e as CustomEvent<{ prompt: string }>).detail?.prompt;
      if (prompt) void handleSend(prompt);
    };
    window.addEventListener('montai:send', handler);
    return () => window.removeEventListener('montai:send', handler);
  }, [handleSend]);

  const showWelcome = messages.length === 0 && !isLoading && !streamingContent;

  const inputElement = (
    <MessageInput
      onSend={handleSend}
      onStop={() => { abortRef.current?.abort(); }}
      isLoading={isLoading}
    />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      <div className="chat-bg-layer" />
      <div className="chat-bg-overlay" />
      <ToastContainer />

      {/* Guest header bar — safe-area-aware for Android notch */}
      <div style={{
        position: 'absolute',
        top: 'max(12px, env(safe-area-inset-top, 12px))',
        right: 'max(12px, env(safe-area-inset-right, 12px))',
        zIndex: 20,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 8,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          fontSize: 11.5, color: '#5A6272',
          fontFamily: 'Inter, sans-serif',
          backdropFilter: 'blur(8px)',
        }}>
          Mehmon
        </div>
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 8,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#A1A1AA', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)';
            (e.currentTarget as HTMLElement).style.color = '#FAFAFA';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
            (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
          }}
        >
          <LogIn size={12} strokeWidth={1.5} />
          Kirish
        </button>
      </div>

      {/* Elegant glass sign-in pill */}
      <AnimatePresence>
        {showSignInBanner && !showWelcome && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute', bottom: 90, left: '50%', transform: 'translateX(-50%)',
              zIndex: 20, display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px 9px 14px',
              background: 'rgba(12,14,20,0.88)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 40,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)',
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{ fontSize: 12.5, color: '#8B93A4', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em' }}>
              Chat tarixi saqlash uchun
            </span>
            <button
              onClick={() => router.push('/')}
              style={{
                padding: '5px 12px', borderRadius: 20,
                background: '#FFFFFF', border: 'none', color: '#08090D',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              }}
            >
              Kirish
            </button>
            <button
              onClick={() => setShowSignInBanner(false)}
              style={{
                width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                color: '#5A6272', fontSize: 11, cursor: 'pointer', flexShrink: 0,
              }}
            >
              <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages area — minHeight:0 ensures flex child can shrink */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-scroll"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', zIndex: 2, display: 'flex', flexDirection: 'column' }}
      >
        <AnimatePresence mode="wait">
          {showWelcome ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            >
              <WelcomeScreen
                nickname="Guest"
                language="uz"
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
                      onQuickAction={msg.role === 'assistant' ? (prompt) => void handleSend(prompt) : undefined}
                    />
                  ))}
                </AnimatePresence>

                {streamingContent && (
                  <MessageBubble
                    message={{
                      id: 'streaming', chatId: 'guest',
                      role: 'assistant', content: streamingContent,
                      createdAt: new Date().toISOString(),
                    }}
                  />
                )}

                {isLoading && !streamingContent && (
                  <>
                    {(rmStatus.state === 'retrying' || rmStatus.attempt > 0) && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
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
                            : 'So\'rovingiz qayta ishlanmoqda...'}
                        </span>
                      </motion.div>
                    )}
                    <TypingIndicator hasImage={false} hasPdf={false} />
                  </>
                )}
                <div ref={bottomRef} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom input */}
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
                  onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
                  style={{
                    position: 'absolute', top: 0, right: '1.25rem',
                    transform: 'translateY(calc(-100% - 10px))',
                    width: 36, height: 36, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer', zIndex: 10,
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
