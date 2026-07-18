'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TEXT_STATES = [
  { text: "O'ylayapti", detail: 'Groq llama-4-scout modeli ishlamoqda' },
  { text: 'Tayyorlayapti', detail: 'Kontekst tahlil qilinmoqda' },
  { text: 'Javob yozayapti', detail: 'Matn generatsiya qilinmoqda…' },
];

const IMAGE_STATES = [
  { text: 'Rasm tahlil qilinmoqda', detail: 'Vision modeli rasmni ko\'rmoqda' },
  { text: "Ko'rish modeli ishlamoqda", detail: 'Elementlar aniqlanmoqda' },
  { text: 'Javob tayyorlanmoqda', detail: 'Tahlil natijasi yozilmoqda…' },
];

const PDF_STATES = [
  { text: "PDF o'qilmoqda", detail: 'Matn sahifalardan chiqarilmoqda' },
  { text: 'Matn tahlil qilinmoqda', detail: 'Tuzilma va mavzular aniqlanmoqda' },
  { text: 'Xulosalar tayyorlanmoqda', detail: 'AI javob tuzmoqda…' },
];

export default function TypingIndicator({
  hasImage,
  hasPdf,
}: {
  hasImage?: boolean;
  hasPdf?: boolean;
}) {
  const [phase, setPhase]       = useState(0);
  const [expanded, setExpanded] = useState(false);

  const phases = hasPdf ? PDF_STATES : hasImage ? IMAGE_STATES : TEXT_STATES;

  useEffect(() => {
    setPhase(0);
    const id = setInterval(() => setPhase(p => (p + 1) % phases.length), 2200);
    return () => clearInterval(id);
  }, [phases.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 w-full"
      style={{ padding: '10px 0' }}
    >
      {/* Avatar with pulse ring */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'linear-gradient(135deg, #F59E0B, #F97316)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#0A0A0B',
        fontFamily: 'Sora, sans-serif',
        boxShadow: '0 2px 12px rgba(245,158,11,0.3)',
        marginTop: 2, position: 'relative',
      }}>
        M
        <motion.div
          style={{
            position: 'absolute', inset: -3, borderRadius: '50%',
            border: '1.5px solid rgba(245,158,11,0.4)',
          }}
          animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 2, minWidth: 0 }}>
        {/* Clickable phase label */}
        <button
          onClick={() => setExpanded(v => !v)}
          title={expanded ? 'Yopish' : 'Tafsilotlarni ko\'rish'}
          style={{
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={phase}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              style={{
                fontSize: 13.5, color: '#71717A', fontFamily: 'Inter, sans-serif',
                letterSpacing: '-0.01em',
              }}
            >
              {phases[phase].text}
            </motion.span>
          </AnimatePresence>
          {/* Chevron */}
          <motion.svg
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            style={{ color: '#52525B', flexShrink: 0, marginTop: 1 }}
          >
            <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        </button>

        {/* Animated bars */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <motion.div
              key={i}
              style={{
                width: i === 2 || i === 3 ? 10 : 5,
                height: 4, borderRadius: 2,
                background: 'rgba(245,158,11,0.4)',
              }}
              animate={{
                opacity: [0.25, 1, 0.25],
                scaleX: [1, 1.4, 1],
                background: ['rgba(245,158,11,0.25)', 'rgba(245,158,11,0.9)', 'rgba(245,158,11,0.25)'],
              }}
              transition={{
                duration: 1.3, repeat: Infinity, delay: i * 0.1, ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Expandable detail panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -4 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -4 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                marginTop: 4,
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.04)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {phases.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Status dot */}
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: i < phase
                        ? '#22C55E'
                        : i === phase
                        ? '#F59E0B'
                        : 'rgba(255,255,255,0.12)',
                      boxShadow: i === phase ? '0 0 6px rgba(245,158,11,0.5)' : 'none',
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: i === phase ? 600 : 400,
                        color: i < phase ? '#22C55E' : i === phase ? '#F59E0B' : '#52525B',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        {p.text}
                      </div>
                      {i === phase && (
                        <div style={{
                          fontSize: 10.5, color: '#71717A',
                          fontFamily: 'Inter, sans-serif', marginTop: 1,
                        }}>
                          {p.detail}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
