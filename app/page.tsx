'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import AuthModal from '@/components/auth/AuthModal';
import MontaiLogo from '@/components/shared/MontaiLogo';
import AuroraBackground from '@/components/ui/AuroraBackground';
import { LiquidGlass, GlassButton } from '@/components/ui/LiquidGlass';
import { ArrowRight } from 'lucide-react';

/* ─── Google wordmark SVG ───────────────────────────────────── */
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

/* ─── Floating badge ────────────────────────────────────────── */
function FloatingBadge({ value, label, icon }: { value: string; label: string; icon?: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
      padding: '12px 10px',
      background: 'rgba(255,255,255,0.038)',
      border: '1px solid rgba(255,255,255,0.075)',
      borderRadius: 14,
      backdropFilter: 'blur(16px) saturate(1.3)',
      WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.07)',
    }}>
      {icon && <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>}
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: 18, fontWeight: 700, color: '#F0F0F2', letterSpacing: '-0.03em', lineHeight: 1,
      }}>{value}</span>
      <span style={{
        fontSize: 9.5, color: 'var(--t-02)', fontFamily: 'var(--font-body)',
        letterSpacing: '0.07em', textTransform: 'uppercase', fontWeight: 600,
      }}>{label}</span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div style={{ minHeight: '100vh', background: '#05060A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MontaiLogo size={48} />
      </div>
    );
  }

  return (
    <main style={{ minHeight: '100dvh', background: '#05060A', position: 'relative', overflow: 'hidden', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <AuroraBackground />

      {/* Content layer */}
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '24px 16px',
      }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: '100%', maxWidth: 400,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 0,
          }}
        >
          {/* Logo + hero */}
          <motion.div
            initial={{ scale: 0.82, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.06 }}
            style={{ marginBottom: 36, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}
          >
            {/* Logo with glow halo */}
            <div style={{ position: 'relative' }}>
              <div style={{
                position: 'absolute', inset: -24, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(96,165,250,0.14) 0%, transparent 70%)',
                filter: 'blur(20px)', pointerEvents: 'none',
              }} />
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ filter: 'drop-shadow(0 4px 20px rgba(96,165,250,0.28))', position: 'relative', zIndex: 1 }}
              >
                <MontaiLogo size={62} />
              </motion.div>
            </div>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: 34, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 1, marginBottom: 10,
                background: 'linear-gradient(160deg, #F0F0F2 0%, #8D95A6 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                Montai
              </div>
              <div style={{
                fontSize: 14, color: 'var(--t-02)', fontFamily: 'var(--font-body)',
                letterSpacing: '-0.01em', lineHeight: 1.55,
              }}>
                Your AI video editing mentor
              </div>
            </div>
          </motion.div>

          {/* Glass card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%' }}
          >
            <LiquidGlass
              blurStrength={36}
              glassOpacity={0.10}
              borderOpacity={0.09}
              glowOnHover={false}
              borderRadius={24}
              elevated
              style={{ padding: '28px 28px 24px' }}
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <h1 style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 19, fontWeight: 700, color: 'var(--t-00)',
                  letterSpacing: '-0.03em', lineHeight: 1.25, marginBottom: 8,
                }}>
                  Start learning today
                </h1>
                <p style={{
                  fontSize: 13, color: 'var(--t-02)', fontFamily: 'var(--font-body)', lineHeight: 1.6,
                }}>
                  Professional video editing knowledge,<br />available instantly.
                </p>
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <GlassButton primary onClick={() => setAuthOpen(true)} style={{ width: '100%', padding: '13px 24px', borderRadius: 14, fontSize: 14 }}>
                  <GoogleIcon />
                  Continue with Google
                </GlassButton>

                <GlassButton onClick={() => router.push('/chat?guest=1')} style={{ width: '100%', padding: '12px 24px', borderRadius: 14, fontSize: 14 }}>
                  Try without account
                  <ArrowRight size={14} strokeWidth={2} />
                </GlassButton>
              </div>

              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                <span style={{ fontSize: 10.5, color: '#363C4D', fontFamily: 'Inter, sans-serif', letterSpacing: '0.06em' }}>OR</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <FloatingBadge value="50+" label="Topics" icon="🎬" />
                <FloatingBadge value="13" label="Languages" icon="🌍" />
                <FloatingBadge value="AI" label="Powered" icon="✨" />
              </div>
            </LiquidGlass>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ marginTop: 20, display: 'flex', gap: 20, alignItems: 'center' }}
          >
            {[
              { label: 'Privacy', href: '/privacy' },
              { label: 'Terms', href: '/terms' },
            ].map(link => (
              <a key={link.href} href={link.href}
                style={{
                  fontSize: 11.5, color: '#363C4D', fontFamily: 'Inter, sans-serif',
                  textDecoration: 'none', letterSpacing: '0.02em',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = '#8B93A4')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = '#363C4D')}
              >
                {link.label}
              </a>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {authOpen && <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />}
      </AnimatePresence>
    </main>
  );
}
