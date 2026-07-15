'use client';

import { motion } from 'framer-motion';

const features = [
  {
    icon: '🎨',
    title: 'Color Grading',
    description:
      'Master cinematic color science — from LOG footage to LUTs, DaVinci Resolve nodes to Lumetri panels. Create any look from teal & orange to vintage film grain.',
    tags: ['DaVinci Resolve', 'Premiere Pro', 'Color Science'],
  },
  {
    icon: '✂️',
    title: 'Montage Theory',
    description:
      "Learn every cut type — J-cut, L-cut, match cut, smash cut. Understand Eisenstein's montage theory, the Kuleshov effect, and continuity editing principles.",
    tags: ['Cut Types', 'Rhythm', 'Pacing'],
  },
  {
    icon: '🔊',
    title: 'Sound Design',
    description:
      'Professional audio mixing — dialogue levels, SFX layering, music sync, noise reduction, and creating emotional atmosphere through sound.',
    tags: ['Audio Mix', 'Foley', 'Music Sync'],
  },
  {
    icon: '📖',
    title: 'Visual Storytelling',
    description:
      'Craft compelling narratives through editing. Master emotional arcs, scene pacing, reaction shots, and documentary assembly techniques.',
    tags: ['Narrative', 'Documentary', 'YouTube'],
  },
  {
    icon: '⚡',
    title: 'Software Mastery',
    description:
      'Expert guidance for Premiere Pro, DaVinci Resolve, Final Cut Pro, After Effects, and CapCut — with exact keyboard shortcuts and workflow tips.',
    tags: ['Shortcuts', 'Workflow', 'Export'],
  },
  {
    icon: '🚀',
    title: 'Platform Optimization',
    description:
      'Edit specifically for YouTube retention, TikTok virality, cinema standards, music videos, corporate content, and wedding cinematography.',
    tags: ['YouTube', 'TikTok', 'Cinema'],
  },
];

export default function Features() {
  return (
    <section className="px-4 py-20 max-w-6xl mx-auto">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12 space-y-3"
      >
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--accent-primary)]">
          What Montai Teaches
        </p>
        <h2
          className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)]"
          style={{ fontFamily: 'Sora, sans-serif' }}
        >
          Everything a Professional Editor Needs
        </h2>
        <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto">
          From beginner cuts to advanced color science — Montai adapts to your level and teaches in your language.
        </p>
      </motion.div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {features.map((feature, i) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.08 }}
            className="feature-card p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]"
          >
            <div className="text-4xl mb-4">{feature.icon}</div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
              {feature.title}
            </h3>
            <p className="text-[15px] text-[var(--text-secondary)] leading-relaxed mb-4">
              {feature.description}
            </p>
            <div className="flex flex-wrap gap-2">
              {feature.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.2)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
