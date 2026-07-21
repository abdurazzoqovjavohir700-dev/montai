'use client';

import { useEffect, useRef, useState } from 'react';
import { Palette, Scissors, Volume2, BookOpen, Monitor, Rocket } from 'lucide-react';

const features = [
  {
    icon: <Palette size={22} strokeWidth={1.5} />,
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.18) 0%, rgba(96,165,250,0.10) 100%)',
    glow: 'rgba(96,165,250,0.2)',
    title: 'Color Grading',
    desc: 'Master cinematic color science — LOG footage, LUTs, DaVinci Resolve nodes to Lumetri panels. Create any look from teal & orange to vintage film.',
    tags: ['DaVinci Resolve', 'Lumetri', 'LUTs'],
  },
  {
    icon: <Scissors size={22} strokeWidth={1.5} />,
    gradient: 'linear-gradient(135deg, rgba(99,102,241,0.18) 0%, rgba(139,92,246,0.10) 100%)',
    glow: 'rgba(99,102,241,0.2)',
    title: 'Montage Theory',
    desc: "Every cut type — J-cut, L-cut, match cut, smash cut. Eisenstein's montage theory, the Kuleshov effect, and continuity editing principles.",
    tags: ['Cut Types', 'Rhythm', 'Pacing'],
  },
  {
    icon: <Volume2 size={22} strokeWidth={1.5} />,
    gradient: 'linear-gradient(135deg, rgba(34,197,94,0.18) 0%, rgba(16,185,129,0.10) 100%)',
    glow: 'rgba(34,197,94,0.2)',
    title: 'Sound Design',
    desc: 'Professional audio mixing — dialogue levels, SFX layering, music sync, noise reduction, and creating emotional atmosphere through sound.',
    tags: ['Audio Mix', 'Foley', 'Music Sync'],
  },
  {
    icon: <BookOpen size={22} strokeWidth={1.5} />,
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.18) 0%, rgba(244,114,182,0.10) 100%)',
    glow: 'rgba(236,72,153,0.2)',
    title: 'Visual Storytelling',
    desc: 'Craft compelling narratives through editing. Master emotional arcs, scene pacing, reaction shots, and documentary assembly techniques.',
    tags: ['Narrative', 'Documentary', 'YouTube'],
  },
  {
    icon: <Monitor size={22} strokeWidth={1.5} />,
    gradient: 'linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(59,130,246,0.10) 100%)',
    glow: 'rgba(14,165,233,0.2)',
    title: 'Software Mastery',
    desc: 'Expert guidance for Premiere Pro, DaVinci Resolve, Final Cut Pro, After Effects, and CapCut — with exact keyboard shortcuts and workflow tips.',
    tags: ['Shortcuts', 'Workflow', 'Export'],
  },
  {
    icon: <Rocket size={22} strokeWidth={1.5} />,
    gradient: 'linear-gradient(135deg, rgba(96,165,250,0.18) 0%, rgba(239,68,68,0.10) 100%)',
    glow: 'rgba(239,68,68,0.2)',
    title: 'Platform Optimization',
    desc: 'Edit for YouTube retention, TikTok virality, cinema standards, music videos, corporate content, and wedding cinematography.',
    tags: ['YouTube', 'TikTok', 'Cinema'],
  },
];

function useInView(ref: React.RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const isVisible = useInView(sectionRef);

  return (
    <section
      id="features"
      ref={sectionRef}
      className="features-section"
      style={{
        maxWidth: 1100, margin: '0 auto',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}
    >
      {/* Section header */}
      <div style={{ textAlign: 'center', marginBottom: 56 }}>
        <span style={{
          fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
          fontSize: 12, color: '#60A5FA',
          textTransform: 'uppercase', letterSpacing: '3px',
        }}>
          WHAT MONTAI TEACHES
        </span>
        <h2 style={{
          fontFamily: 'var(--font-outfit), Outfit, sans-serif',
          fontWeight: 800, fontSize: 'clamp(32px, 4vw, 48px)',
          color: '#FAFAFA', marginTop: 12,
          letterSpacing: '-1.5px', lineHeight: 1.1,
        }}>
          Everything a Professional<br />Editor Needs
        </h2>
        <p style={{
          fontFamily: 'var(--font-inter), Inter, sans-serif',
          fontSize: 16, color: '#52525B',
          marginTop: 14, maxWidth: 480, margin: '14px auto 0', lineHeight: 1.65,
        }}>
          From beginner cuts to advanced color science — Montai adapts to your level and teaches in your language.
        </p>
      </div>

      {/* Cards grid */}
      <div className="features-grid" style={{ display: 'grid', gap: 16 }}>
        {features.map((f, i) => (
          <FeatureCard key={f.title} feature={f} delay={i * 0.08} visible={isVisible} />
        ))}
      </div>
    </section>
  );
}

function FeatureCard({ feature, delay, visible }: {
  feature: typeof features[0];
  delay: number;
  visible: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#0F0F11',
        border: `1px solid ${hovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}`,
        borderRadius: 16, padding: '28px 24px',
        transition: 'all 0.3s ease',
        cursor: 'default', position: 'relative', overflow: 'hidden',
        transform: visible ? `translateY(${hovered ? -6 : 0}px)` : 'translateY(20px)',
        opacity: visible ? 1 : 0,
        boxShadow: hovered ? `0 20px 60px ${feature.glow}, 0 0 0 1px rgba(255,255,255,0.04)` : '0 2px 8px rgba(0,0,0,0.4)',
        transitionDelay: `${delay}s`,
      }}
    >
      {/* Top shimmer line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 1,
        background: `linear-gradient(90deg, transparent 0%, ${feature.glow} 40%, ${feature.glow} 60%, transparent 100%)`,
        opacity: hovered ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }} />

      <div style={{
        width: 52, height: 52, borderRadius: 14, marginBottom: 18,
        background: feature.gradient,
        border: `1px solid ${feature.glow}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#60A5FA',
        boxShadow: hovered ? `0 8px 24px ${feature.glow}` : 'none',
        transition: 'box-shadow 0.3s ease',
      }}>
        {feature.icon}
      </div>

      <h3 style={{
        fontFamily: 'var(--font-display, Manrope, sans-serif)',
        fontWeight: 600, fontSize: 18, color: '#FAFAFA', marginBottom: 10,
      }}>
        {feature.title}
      </h3>

      <p style={{
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        fontSize: 14, color: '#6B7280', lineHeight: 1.65, marginBottom: 20,
      }}>
        {feature.desc}
      </p>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {feature.tags.map(tag => (
          <span key={tag} style={{
            fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
            fontSize: 11, padding: '4px 10px', borderRadius: 6,
            background: 'rgba(96,165,250,0.08)', color: '#60A5FA',
          }}>
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}
