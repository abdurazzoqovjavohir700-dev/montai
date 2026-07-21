'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_CYCLES = {
  text: [
    { text: "O'ylayapti...", sub: 'Kontekst tahlil qilinmoqda' },
    { text: 'Tahlil qilinmoqda...', sub: 'Bilim bazasi qidirilmoqda' },
    { text: 'Javob yozayapti...', sub: 'Matn generatsiya qilinmoqda' },
    { text: 'Tugatilmoqda...', sub: 'Yakuniy tekshiruv' },
  ],
  image: [
    { text: 'Rasm ko\'rilmoqda...', sub: 'Vision model ishlamoqda' },
    { text: 'Elementlar aniqlanmoqda...', sub: 'Kompozitsiya tahlili' },
    { text: 'Tahlil tayyorlanmoqda...', sub: 'Natija yozilmoqda' },
  ],
  pdf: [
    { text: "PDF o'qilmoqda...", sub: 'Sahifalar skanlanmoqda' },
    { text: 'Matn tahlil qilinmoqda...', sub: 'Tuzilma va mavzular' },
    { text: 'Xulosalar tayyorlanmoqda...', sub: 'AI javob tuzmoqda' },
  ],
};

// Neural network dot animation
function NeuralDots() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          animate={{
            y: [0, -5, 0],
            opacity: [0.25, 1, 0.25],
            background: [
              'rgba(96,165,250,0.2)',
              'rgba(96,165,250,0.9)',
              'rgba(96,165,250,0.2)',
            ],
          }}
          transition={{
            duration: 1.1,
            repeat: Infinity,
            delay: i * 0.12,
            ease: 'easeInOut',
          }}
          style={{
            width: i === 2 ? 8 : i === 1 || i === 3 ? 5 : 3.5,
            height: i === 2 ? 8 : i === 1 || i === 3 ? 5 : 3.5,
            borderRadius: '50%',
            background: 'rgba(96,165,250,0.2)',
          }}
        />
      ))}
    </div>
  );
}

// Spinning orbit ring
function OrbitRing() {
  return (
    <div style={{ position: 'relative', width: 28, height: 28 }}>
      {/* Center */}
      <div style={{
        position: 'absolute', inset: 4,
        background: '#FFFFFF',
        borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, fontWeight: 800, color: '#EEEEF0',
        fontFamily: 'var(--font-display, Manrope, sans-serif)',
        boxShadow: '0 0 12px rgba(96,165,250,0.25)',
        zIndex: 2,
      }}>
        M
      </div>
      {/* Pulse rings */}
      <motion.div
        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        style={{
          position: 'absolute', inset: -2, borderRadius: '50%',
          border: '1.5px solid rgba(96,165,250,0.35)',
        }}
      />
      <motion.div
        animate={{ scale: [1, 2.4, 1], opacity: [0.25, 0, 0.25] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
        style={{
          position: 'absolute', inset: -2, borderRadius: '50%',
          border: '1px solid rgba(96,165,250,0.12)',
        }}
      />
      {/* Orbiting dot */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        style={{ position: 'absolute', inset: -4, borderRadius: '50%' }}
      >
        <div style={{
          position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
          width: 5, height: 5, borderRadius: '50%',
          background: '#60A5FA',
          boxShadow: '0 0 6px rgba(96,165,250,0.5)',
        }} />
      </motion.div>
    </div>
  );
}

// Streaming progress bar
function ProgressBar({ phase, total }: { phase: number; total: number }) {
  const pct = ((phase + 1) / total) * 100;
  return (
    <div style={{
      width: 80, height: 2, borderRadius: 1,
      background: 'rgba(255,255,255,0.06)',
      overflow: 'hidden',
    }}>
      <motion.div
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          height: '100%', borderRadius: 1,
          background: '#FFFFFF',
          boxShadow: '0 0 4px rgba(96,165,250,0.4)',
        }}
      />
    </div>
  );
}

export default function TypingIndicator({ hasImage, hasPdf }: { hasImage?: boolean; hasPdf?: boolean }) {
  const [phase, setPhase] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const key = hasPdf ? 'pdf' : hasImage ? 'image' : 'text';
  const phases = STATUS_CYCLES[key];

  // Canvas for neural network visualization
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setPhase(0);
    const id = setInterval(() => setPhase(p => Math.min(p + 1, phases.length - 1)), 1800);
    return () => clearInterval(id);
  }, [phases.length]);

  // Minimal neural canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width = 80;
    const H = canvas.height = 24;
    let raf = 0;
    let t = 0;

    const nodes = Array.from({ length: 6 }, (_, i) => ({
      x: 8 + i * 13,
      y: H / 2 + Math.sin(i * 1.2) * 4,
    }));

    const draw = () => {
      t += 0.04;
      ctx.clearRect(0, 0, W, H);

      // Connections
      for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i];
        const b = nodes[i + 1];
        const pulse = (Math.sin(t * 2 - i * 0.8) + 1) / 2;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(96,165,250,${0.06 + pulse * 0.15})`;
        ctx.lineWidth = 0.8;
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Nodes
      nodes.forEach((n, i) => {
        const pulse = (Math.sin(t * 2.5 - i * 0.9) + 1) / 2;
        const r = 2.2 + pulse * 1.5;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96,165,250,${0.2 + pulse * 0.5})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 w-full"
      style={{ padding: '10px 0' }}
    >
      <OrbitRing />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 1, minWidth: 0 }}>
        {/* Status line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setExpanded(v => !v)}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={phase}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                style={{ fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}
              >
                {phases[phase].text}
              </motion.span>
            </AnimatePresence>
            <motion.svg
              width="10" height="10" viewBox="0 0 10 10" fill="none"
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ color: '#3F3F46', flexShrink: 0 }}
            >
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </motion.svg>
          </button>

          <ProgressBar phase={phase} total={phases.length} />
        </div>

        {/* Neural visualization + dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <canvas ref={canvasRef} style={{ display: 'block', opacity: 0.9 }} />
          <NeuralDots />
        </div>

        {/* Expandable detail */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                display: 'flex', flexDirection: 'column', gap: 7,
                marginTop: 2,
              }}>
                {phases.map((p, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <motion.div
                      animate={i === phase ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: i < phase ? '#22C55E' : i === phase ? '#60A5FA' : 'rgba(255,255,255,0.1)',
                        boxShadow: i === phase ? '0 0 8px rgba(96,165,250,0.4)' : 'none',
                      }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{
                        fontSize: 11.5, fontWeight: i === phase ? 600 : 400,
                        color: i < phase ? '#22C55E' : i === phase ? '#60A5FA' : '#3F3F46',
                        fontFamily: 'Inter, sans-serif',
                      }}>
                        {p.text.replace('...', '')}
                      </div>
                      {i === phase && (
                        <div style={{ fontSize: 10, color: '#52525B', fontFamily: 'Inter, sans-serif', marginTop: 1 }}>
                          {p.sub}
                        </div>
                      )}
                    </div>
                    {i < phase && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6l3 3 5-5" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
