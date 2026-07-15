'use client';

import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, x: -8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 px-4 py-2"
    >
      {/* Montai Avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold text-black"
        style={{ background: 'linear-gradient(135deg, #F59E0B, #F97316)', boxShadow: '0 0 12px rgba(245,158,11,0.3)' }}
      >
        M
      </div>

      {/* Bubble */}
      <div
        className="rounded-2xl rounded-tl-sm px-4 py-3 border-l-[3px]"
        style={{
          background: 'var(--bg-chat-ai)',
          borderLeftColor: 'var(--accent-primary)',
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
