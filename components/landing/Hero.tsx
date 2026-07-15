'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

interface HeroProps {
  onGetStarted: () => void;
}

export default function Hero({ onGetStarted }: HeroProps) {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-screen px-4 pt-20 pb-20 overflow-hidden">

      {/* Background radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(245,158,11,0.07) 0%, transparent 65%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Animated film strip bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden opacity-[0.06] pointer-events-none">
        <div className="flex animate-filmstrip" style={{ width: '200%' }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <div key={i} className="flex flex-col flex-shrink-0 mx-1">
              <div className="h-2 w-16 rounded-sm mb-0.5" style={{ background: 'var(--accent-primary)' }} />
              <div className="h-10 w-16 rounded-sm" style={{ border: '1px solid var(--border-subtle)' }} />
              <div className="h-2 w-16 rounded-sm mt-0.5" style={{ background: 'var(--accent-primary)' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Content — all centered */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto w-full space-y-8">

        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold"
          style={{
            border: '1px solid rgba(245,158,11,0.3)',
            background: 'rgba(245,158,11,0.07)',
            color: 'var(--accent-primary)',
          }}
        >
          <Sparkles size={11} />
          AI-Powered Video Editing Mentorship
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--accent-primary)' }}
          />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.1] tracking-tight"
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          Master the Art of
          <br />
          <span className="gradient-text">Video Montage</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg sm:text-xl max-w-2xl leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          Your personal AI mentor for professional video editing — color grading,
          sound design, storytelling, and every cut type from beginner to cinema level.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-base transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #F59E0B, #F97316)',
              color: '#0A0A0B',
              boxShadow: '0 4px 30px rgba(245,158,11,0.3)',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 40px rgba(245,158,11,0.45)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 30px rgba(245,158,11,0.3)';
            }}
          >
            Get Started — It&apos;s Free
            <ArrowRight size={18} />
          </button>

          <button
            onClick={onGetStarted}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm transition-all duration-200"
            style={{
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              background: 'transparent',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(245,158,11,0.4)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
            }}
          >
            See How It Works
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="flex items-center justify-center gap-10 pt-4"
        >
          {[
            { value: '10+', label: 'Expert Topics' },
            { value: '13', label: 'Languages' },
            { value: '100%', label: 'Free Forever' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span
                className="text-2xl font-bold gradient-text"
                style={{ fontFamily: 'Sora, sans-serif' }}
              >
                {stat.value}
              </span>
              <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                {stat.label}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Social proof strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="flex items-center justify-center gap-2 text-xs"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <div className="flex -space-x-2">
            {['🎬', '✂️', '🎨', '🔊', '🚀'].map((emoji, i) => (
              <div
                key={i}
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs border"
                style={{
                  background: 'var(--bg-tertiary)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                {emoji}
              </div>
            ))}
          </div>
          <span>Trusted by editors worldwide</span>
        </motion.div>
      </div>
    </section>
  );
}
