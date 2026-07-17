'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Palette, Scissors, Volume2, BookOpen, Zap, Monitor, Download, Wand2, Play } from 'lucide-react';
import { DYNAMIC_GREETINGS } from '@/lib/constants';
import type { Language } from '@/lib/types';
import MontaiLogo from '@/components/shared/MontaiLogo';

const SUBTITLES: Record<Language, string> = {
  uz: 'Video montaj, color grading, sound design — istalgan savol bering',
  en: 'Video editing, color grading, sound design — ask me anything',
  ru: 'Видеомонтаж, цветокоррекция, звуковой дизайн — спрашивайте',
  tr: 'Video kurgu, renk düzeltme, ses tasarımı — ne istersen sor',
  ja: '映像編集、カラーグレーディング、サウンドデザイン — 何でも聞いて',
  ko: '영상 편집, 색보정, 사운드 디자인 — 무엇이든 물어보세요',
  ar: 'تحرير الفيديو، تصحيح الألوان، التصميم الصوتي — اسألني',
  fr: 'Montage vidéo, étalonnage, design sonore — demandez-moi tout',
  es: 'Edición de video, corrección de color, diseño de sonido — pregunta',
  de: 'Videoschnitt, Farbkorrektur, Sounddesign — frag mich alles',
  zh: '视频剪辑、调色、声音设计 — 随时提问',
  pt: 'Edição de vídeo, correção de cor, design de som — pergunte',
  hi: 'वीडियो एडिटिंग, कलर ग्रेडिंग, साउंड डिज़ाइन — कुछ भी पूछें',
};

const SUGGESTION_CARDS = [
  {
    icon: <Palette size={16} strokeWidth={1.5} />,
    accent: 'rgba(245,158,11,0.9)',
    bg: 'rgba(245,158,11,0.08)',
    title: 'Color Grading Basics',
    description: 'LUT, Curves, Color Wheels asoslari',
    prompt: 'Color grading nima va qanday qilinadi? Eng oddiy usuldan boshlab o\'rgat',
  },
  {
    icon: <Scissors size={16} strokeWidth={1.5} />,
    accent: 'rgba(139,92,246,0.9)',
    bg: 'rgba(139,92,246,0.08)',
    title: 'Cut Types Masterclass',
    description: 'J-cut, L-cut, Match cut, Jump cut',
    prompt: 'Barcha professional montaj turlari: J-cut, L-cut, match cut, jump cut. Har birini misollar bilan tushuntir',
  },
  {
    icon: <Volume2 size={16} strokeWidth={1.5} />,
    accent: 'rgba(34,197,94,0.9)',
    bg: 'rgba(34,197,94,0.08)',
    title: 'Audio & Sound Design',
    description: 'Dialogue, music, SFX miksing',
    prompt: 'Professional audio mixing qanday qilinadi? Dialogue, musiqa va SFX qanday darajalarda bo\'lishi kerak?',
  },
  {
    icon: <Play size={16} strokeWidth={1.5} />,
    accent: 'rgba(239,68,68,0.9)',
    bg: 'rgba(239,68,68,0.08)',
    title: 'YouTube uchun montaj',
    description: 'Hook, retention, pacing texnikasi',
    prompt: 'YouTube video uchun professional montaj qanday qilinadi? Birinchi 5 sekundda qanday hook qilaman?',
  },
  {
    icon: <Monitor size={16} strokeWidth={1.5} />,
    accent: 'rgba(14,165,233,0.9)',
    bg: 'rgba(14,165,233,0.08)',
    title: 'Kompyuter talablari',
    description: 'GPU, RAM, CPU — nimalar kerak?',
    prompt: 'Video montaj uchun kompyuter qanday bo\'lishi kerak? GPU, RAM, CPU talablari nima? Budget variant bormi?',
  },
  {
    icon: <Zap size={16} strokeWidth={1.5} />,
    accent: 'rgba(249,115,22,0.9)',
    bg: 'rgba(249,115,22,0.08)',
    title: 'Tez maslahatlar',
    description: 'Pro editorlar siri — workflow',
    prompt: 'Montajda tezroq ishlash uchun 5 ta professional maslahat ber. Keyboard shortcuts ham qo\'sh',
  },
];

const QUICK_ACTIONS = [
  { icon: <Download size={13} strokeWidth={1.5} />, label: "Dastur o'rnatish", prompt: "After Effects yoki DaVinci Resolve ni qanday o'rnataman? System requirements nima?" },
  { icon: <Wand2 size={13} strokeWidth={1.5} />, label: 'Plugin tavsiya', prompt: "Video montaj uchun eng yaxshi pluginlar qaysilar? Bepul va pullik variantlar" },
  { icon: <Play size={13} strokeWidth={1.5} />, label: 'Birinchi loyiha', prompt: "Men yangi boshlovchiman. Birinchi video loyihamni qanday boshlashim kerak? Step by step ko'rsat" },
  { icon: <BookOpen size={13} strokeWidth={1.5} />, label: 'Storytelling', prompt: "Editing orqali kuchli hikoya qilish qanday? Pacing, rhythm, emotional arc tushuntir" },
];

interface WelcomeScreenProps {
  nickname: string;
  language: Language;
  onSelectSuggestion: (prompt: string) => void;
}

export default function WelcomeScreen({ nickname, language, onSelectSuggestion }: WelcomeScreenProps) {
  const greeting = useMemo(() => {
    const list = DYNAMIC_GREETINGS[language] ?? DYNAMIC_GREETINGS.en;
    return list[Math.floor(Math.random() * list.length)](nickname || 'Editor');
  }, [nickname, language]);

  const subtitle = SUBTITLES[language] ?? SUBTITLES.en;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100%',
        padding: 'clamp(20px, 5vw, 40px) clamp(12px, 4vw, 24px) 24px',
        overflowY: 'auto',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          textAlign: 'center', width: '100%', maxWidth: 680,
        }}
      >
        {/* Logo with float animation */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <div
            style={{
              position: 'absolute', width: 96, height: 96,
              background: 'rgba(245,158,11,0.12)', filter: 'blur(24px)', borderRadius: '50%',
            }}
          />
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 6px 20px rgba(245,158,11,0.35))' }}
          >
            <MontaiLogo size={64} />
          </motion.div>
        </div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.35 }}
          className="welcome-heading"
          style={{
            fontFamily: 'Sora, sans-serif',
            color: '#FAFAFA',
            fontSize: 'clamp(20px, 5.5vw, 28px)',
            fontWeight: 700,
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          {greeting}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.35 }}
          style={{ color: '#52525B', fontSize: '14px', marginBottom: 24 }}
        >
          {subtitle}
        </motion.p>

        {/* Quick action pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.28, duration: 0.35 }}
          style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 }}
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.label}
              onClick={() => onSelectSuggestion(action.prompt)}
              className="welcome-quick-pill"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 13px', borderRadius: 20,
                background: '#141414', border: '1px solid rgba(255,255,255,0.07)',
                color: '#71717A', fontSize: 13, cursor: 'pointer',
                transition: 'all 0.15s', fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = '#1A1A1A';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.12)';
                (e.currentTarget as HTMLElement).style.color = '#FAFAFA';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = '#141414';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.color = '#71717A';
              }}
            >
              <span style={{ color: '#F59E0B' }}>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </motion.div>

        {/* 6 suggestion cards — 2-column on wider screens, 1-column on mobile */}
        <div className="welcome-cards-grid">
          {SUGGESTION_CARDS.map((card, i) => (
            <motion.button
              key={card.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 + i * 0.05, duration: 0.3 }}
              onClick={() => onSelectSuggestion(card.prompt)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                textAlign: 'left', padding: 16, borderRadius: 12,
                background: '#141414', border: '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
              whileHover={{
                y: -2,
                borderColor: 'rgba(245,158,11,0.3)',
                boxShadow: '0 4px 20px rgba(245,158,11,0.08)',
                background: '#1A1A1A',
              }}
              whileTap={{ scale: 0.97 }}
            >
              <div style={{
                width: 32, height: 32, borderRadius: 8, marginBottom: 10,
                background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: card.accent,
              }}>{card.icon}</div>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#E4E4E7', marginBottom: 4, display: 'block' }}>
                {card.title}
              </span>
              <span className="welcome-card-desc" style={{ fontSize: 12, color: '#71717A', lineHeight: 1.4 }}>
                {card.description}
              </span>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
