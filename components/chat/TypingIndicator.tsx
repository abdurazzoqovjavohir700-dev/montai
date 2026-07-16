'use client';

import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, x: -8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 px-4 sm:px-8 py-2 w-full"
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold"
        style={{
          background: 'linear-gradient(135deg, #F59E0B, #F97316)',
          color: '#0A0A0B',
          boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
          fontFamily: 'Sora, sans-serif',
        }}
      >
        M
      </div>

      <div
        className="rounded-[18px] rounded-tl-sm px-5 py-3.5"
        style={{
          background: 'var(--bg-tertiary)',
          borderLeft: '3px solid var(--accent-primary)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        <div className="flex items-center gap-1.5 h-5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    </motion.div>
  );
}
