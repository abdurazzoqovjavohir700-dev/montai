'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import MontaiLogo from '@/components/shared/MontaiLogo';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), 50); }, []);

  const fadeUp = (delay: number): React.CSSProperties => ({
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(24px)',
    transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
  });

  return (
    <section
      className="hero-section"
      style={{
        minHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated film strip bottom */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, overflow: 'hidden', opacity: 0.05, pointerEvents: 'none' }}>
        <div className="animate-filmstrip" style={{ display: 'flex', width: '200%' }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', flexShrink: 0, margin: '0 4px' }}>
              <div style={{ height: 8, width: 64, borderRadius: 4, background: '#F59E0B', marginBottom: 2 }} />
              <div style={{ height: 40, width: 64, borderRadius: 4, border: '1px solid #27272A' }} />
              <div style={{ height: 8, width: 64, borderRadius: 4, background: '#F59E0B', marginTop: 2 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Gradient orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '25%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(245,158,11,0.07) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', right: '15%',
        width: 350, height: 350,
        background: 'radial-gradient(circle, rgba(249,115,22,0.05) 0%, transparent 70%)',
        borderRadius: '50%', filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', maxWidth: 1100, width: '100%' }}>

        {/* Badge */}
        <div style={{ ...fadeUp(0.1), display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 20, border: '1px solid rgba(245,158,11,0.2)', background: 'rgba(245,158,11,0.05)', marginBottom: 32 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: '#F59E0B', fontFamily: 'var(--font-space), Space Grotesk, sans-serif', fontWeight: 500 }}>
            <Sparkles size={11} style={{ display: 'inline', marginRight: 4 }} />
            AI-Powered Video Editing Mentorship
          </span>
        </div>

        {/* Logo */}
        <div style={{ ...fadeUp(0.2), marginBottom: 36, filter: 'drop-shadow(0 12px 32px rgba(245,158,11,0.4))' }}>
          <MontaiLogo size={96} />
        </div>

        {/* Headline */}
        <h1 className="hero-headline" style={{
          ...fadeUp(0.3),
          fontFamily: 'var(--font-outfit), Outfit, sans-serif',
          fontWeight: 900,
          fontSize: 'clamp(48px, 7vw, 76px)',
          lineHeight: 1.02,
          letterSpacing: '-3px',
          color: '#FAFAFA',
          marginBottom: 24,
        }}>
          Master the Art of
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 60%, #EF4444 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Video Montage
          </span>
        </h1>

        {/* Subtitle */}
        <p style={{
          ...fadeUp(0.45),
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          fontSize: 18,
          color: '#71717A',
          maxWidth: 520,
          lineHeight: 1.7,
          marginBottom: 40,
        }}>
          Your personal AI mentor for professional video editing — color grading,
          sound design, storytelling, and every cut type from beginner to cinema level.
        </p>

        {/* CTA */}
        <div className="hero-cta" style={{ ...fadeUp(0.6), display: 'flex', gap: 12, marginBottom: 56, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={onGetStarted}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '15px 36px', borderRadius: 14,
              background: 'linear-gradient(135deg, #F59E0B, #F97316)',
              color: '#0A0A0B', fontSize: 16, fontWeight: 700,
              fontFamily: 'var(--font-space), Space Grotesk, sans-serif',
              border: 'none', cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(245,158,11,0.35)',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 36px rgba(245,158,11,0.5)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 24px rgba(245,158,11,0.35)';
            }}
          >
            Get Started Free
            <ArrowRight size={18} />
          </button>

          <a
            href="#features"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '15px 32px', borderRadius: 14,
              border: '1px solid #27272A',
              color: '#A0A0A0', fontSize: 16, fontWeight: 500,
              fontFamily: 'var(--font-space), Space Grotesk, sans-serif',
              textDecoration: 'none', background: 'transparent',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(245,158,11,0.4)';
              (e.currentTarget as HTMLElement).style.color = '#FAFAFA';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = '#27272A';
              (e.currentTarget as HTMLElement).style.color = '#A0A0A0';
            }}
          >
            See How It Works
          </a>
        </div>

        {/* Stats */}
        <div className="hero-stats" style={{ ...fadeUp(0.75), display: 'flex', gap: 48, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { num: '10+', label: 'Expert Topics' },
            { num: '13', label: 'Languages' },
            { num: '100%', label: 'Free Forever' },
          ].map(stat => (
            <div key={stat.label} style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
                fontWeight: 700, fontSize: 32,
                background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>{stat.num}</div>
              <div style={{
                fontFamily: 'var(--font-inter), Inter, sans-serif',
                fontSize: 13, color: '#52525B', marginTop: 4,
              }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
