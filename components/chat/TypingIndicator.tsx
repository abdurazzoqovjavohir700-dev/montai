'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATES = [
  { text: 'O\'ylayapti', dots: true },
  { text: 'Tayyorlayapti', dots: true },
  { text: 'Javob yozayapti', dots: true },
];

export default function TypingIndicator({ hasImage }: { hasImage?: boolean }) {
  const [phase, setPhase] = useState(0);

  const phases = hasImage
    ? [
        { text: 'Rasm tahlil qilinmoqda', dots: true },
        { text: 'Ko\'rish modeli ishlamoqda', dots: true },
        { text: 'Javob tayyorlanmoqda', dots: true },
      ]
    : STATES;

  useEffect(() => {
    const id = setInterval(() => setPhase(p => (p + 1) % phases.length), 2200);
    return () => clearInterval(id);
  }, [phases.length]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 w-full"
      style={{ padding: '10px 0' }}
    >
      {/* Avatar */}
      <div style={{
        width: 24, height: 24, borderRadius: '50%',
        background: 'linear-gradient(135deg, #F59E0B, #F97316)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 10, fontWeight: 700, color: '#0A0A0B',
        fontFamily: 'Sora, sans-serif',
        boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
        marginTop: 2,
        position: 'relative',
      }}>
        M
        {/* Pulse ring */}
        <motion.div
          style={{
            position: 'absolute', inset: -3, borderRadius: '50%',
            border: '1.5px solid rgba(245,158,11,0.35)',
          }}
          animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
        />
      </div>

      {/* Thinking content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 2 }}>
        {/* Phase label */}
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            style={{
              fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.01em',
            }}
          >
            {phases[phase].text}
          </motion.span>
        </AnimatePresence>

        {/* Animated dots bar */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div
              key={i}
              style={{
                width: i === 2 ? 8 : 5, height: 4, borderRadius: 2,
                background: 'rgba(245,158,11,0.4)',
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scaleX: [1, 1.3, 1],
                background: ['rgba(245,158,11,0.3)', 'rgba(245,158,11,0.8)', 'rgba(245,158,11,0.3)'],
              }}
              transition={{
                duration: 1.4, repeat: Infinity,
                delay: i * 0.12, ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
