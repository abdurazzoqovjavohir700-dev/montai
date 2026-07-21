'use client';

import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* ─── Animated aurora orb ───────────────────────────────────── */
function AuroraOrb({
  color, x, y, size, duration, delay,
}: {
  color: string; x: string; y: string; size: number; duration: number; delay: number;
}) {
  return (
    <motion.div
      aria-hidden
      animate={{
        x: [0, 40, -30, 20, 0],
        y: [0, -30, 20, -15, 0],
        scale: [1, 1.12, 0.94, 1.08, 1],
        opacity: [0.3, 0.5, 0.35, 0.48, 0.3],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
        times: [0, 0.25, 0.5, 0.75, 1],
      }}
      style={{
        position: 'absolute',
        left: x, top: y,
        width: size, height: size,
        borderRadius: '50%',
        background: `radial-gradient(circle at 40% 40%, ${color} 0%, transparent 70%)`,
        filter: `blur(${Math.round(size * 0.12)}px)`,
        pointerEvents: 'none',
        willChange: 'transform, opacity',
      }}
    />
  );
}

/* ─── Particle ──────────────────────────────────────────────── */
interface Particle { id: number; x: number; y: number; size: number; dur: number; delay: number; opacity: number }

/* ════════════════════════════════════════════════════════════
   AURORA BACKGROUND — full-screen ambient layer
════════════════════════════════════════════════════════════ */
export default function AuroraBackground({ children }: { children?: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Cursor spotlight
  const mx = useMotionValue(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);
  const my = useMotionValue(typeof window !== 'undefined' ? window.innerHeight / 2 : 0);
  const smx = useSpring(mx, { stiffness: 60, damping: 28 });
  const smy = useSpring(my, { stiffness: 60, damping: 28 });
  const spotX = useTransform(smx, v => v - 350);
  const spotY = useTransform(smy, v => v - 350);

  useEffect(() => {
    const move = (e: MouseEvent) => { mx.set(e.clientX); my.set(e.clientY); };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, [mx, my]);

  // Subtle particles
  const particles: Particle[] = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: (i * 37 + 5) % 97,
    y: (i * 53 + 12) % 92,
    size: 1 + (i % 3),
    dur: 12 + (i % 8) * 2,
    delay: i * 0.8,
    opacity: 0.1 + (i % 4) * 0.05,
  }));

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}
      aria-hidden
    >
      {/* Base deep background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 140% 80% at 50% -10%, rgba(15,20,40,0.9) 0%, #05060A 55%)',
      }}/>

      {/* Aurora orbs */}
      <AuroraOrb color="rgba(30,60,160,0.45)"  x="-8%" y="-12%" size={800} duration={18} delay={0}   />
      <AuroraOrb color="rgba(15,40,100,0.35)"  x="60%" y="-5%"  size={600} duration={22} delay={3}   />
      <AuroraOrb color="rgba(50,30,130,0.30)"  x="30%" y="55%"  size={700} duration={20} delay={6}   />
      <AuroraOrb color="rgba(10,50,120,0.25)"  x="-5%" y="45%"  size={500} duration={25} delay={2}   />
      <AuroraOrb color="rgba(40,80,180,0.20)"  x="75%" y="70%"  size={450} duration={16} delay={9}   />

      {/* Cursor spotlight */}
      <motion.div
        style={{
          position: 'absolute',
          x: spotX, y: spotY,
          width: 700, height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(96,165,250,0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
          willChange: 'transform',
        }}
      />

      {/* Grid overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)
        `,
        backgroundSize: '64px 64px',
        maskImage: 'radial-gradient(ellipse 90% 90% at 50% 50%, black 30%, transparent 100%)',
      }}/>

      {/* Subtle particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          animate={{ y: [0, -30, 0], opacity: [p.opacity, p.opacity * 2.5, p.opacity] }}
          transition={{ duration: p.dur, repeat: Infinity, ease: 'easeInOut', delay: p.delay }}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'rgba(148,163,184,0.6)',
            willChange: 'transform, opacity',
          }}
        />
      ))}

      {/* Noise overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`,
        backgroundSize: '256px 256px',
        opacity: 0.018,
        mixBlendMode: 'overlay',
      }}/>

      {children}
    </div>
  );
}
