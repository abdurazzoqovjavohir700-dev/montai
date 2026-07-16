'use client';

import { motion } from 'framer-motion';

export default function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 w-full"
      style={{ padding: '12px 0' }}
    >
      {/* Montai logo avatar — matches AI message style */}
      <div
        style={{
          width: 24, height: 24, borderRadius: '50%',
          background: 'linear-gradient(135deg, #F59E0B, #F97316)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          fontSize: 10, fontWeight: 700, color: '#0A0A0B',
          fontFamily: 'Sora, sans-serif',
          boxShadow: '0 2px 8px rgba(245,158,11,0.25)',
          marginTop: 2,
        }}
      >
        M
      </div>

      {/* Three dots */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingTop: 4 }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#52525B',
            }}
            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              delay: i * 0.18,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
