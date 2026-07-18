'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TEXT_STATES = [
  { text: "O'ylayapti" },
  { text: 'Tayyorlayapti' },
  { text: 'Javob yozayapti' },
];

const IMAGE_STATES = [
  { text: 'Rasm tahlil qilinmoqda' },
  { text: "Ko'rish modeli ishlamoqda" },
  { text: 'Javob tayyorlanmoqda' },
];

const PDF_STATES = [
  { text: 'PDF o\'qilmoqda' },
  { text: 'Matn tahlil qilinmoqda' },
  { text: 'Xulosalar tayyorlanmoqda' },
];

export default function TypingIndicator({
  hasImage,
  hasPdf,
}: {
  hasImage?: boolean;
  hasPdf?: boolean;
}) {
  const [phase, setPhase] = useState(0);

  const phases = hasPdf ? PDF_STATES : hasImage ? IMAGE_STATES : TEXT_STATES;

  useEffect(() => {
    setPhase(0);
    const id = setInterval(() => setPhase(p => (p + 1) % phases.length), 2000);
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
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: '50%',
        background: 'linear-gradient(135deg, #F59E0B, #F97316)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#0A0A0B',
        fontFamily: 'Sora, sans-serif',
        boxShadow: '0 2px 12px rgba(245,158,11,0.3)',
        marginTop: 2,
        position: 'relative',
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 2 }}>
        {/* Phase label */}
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

        {/* Animated bar */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <motion.div
              key={i}
              style={{
                width: i === 2 || i === 3 ? 10 : 5,
                height: 4,
                borderRadius: 2,
                background: 'rgba(245,158,11,0.4)',
              }}
              animate={{
                opacity: [0.25, 1, 0.25],
                scaleX: [1, 1.4, 1],
                background: [
                  'rgba(245,158,11,0.25)',
                  'rgba(245,158,11,0.9)',
                  'rgba(245,158,11,0.25)',
                ],
              }}
              transition={{
                duration: 1.3,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
