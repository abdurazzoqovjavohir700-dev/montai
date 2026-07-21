'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { DYNAMIC_GREETINGS } from '@/lib/constants';
import type { Language } from '@/lib/types';
import MontaiLogo from '@/components/shared/MontaiLogo';

const SUBTITLES: Record<Language, string> = {
  uz: 'Video montaj, color grading, sound design — istalgan savol bering',
  en: 'Video editing, color grading, sound design — ask me anything',
  ru: 'Видеомонтаж, цветокоррекция, звуковой дизайн — задайте вопрос',
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

const SUGGESTIONS: Record<Language, Array<{ icon: string; label: string; prompt: string }>> = {
  en: [
    { icon: '🎨', label: 'Color grading basics', prompt: 'Teach me color grading fundamentals — workflow, white balance, contrast, cinematic look.' },
    { icon: '✂️', label: 'Cut types masterclass', prompt: 'Explain J-cut, L-cut, match cut, jump cut with real film examples.' },
    { icon: '🎵', label: 'Audio mixing guide', prompt: 'Professional audio mixing for video — dialogue levels, music, SFX balance.' },
    { icon: '🎬', label: 'Storytelling through cuts', prompt: 'How to tell compelling stories through editing — pacing, rhythm, emotional arc.' },
  ],
  uz: [
    { icon: '🎨', label: 'Color grading asoslari', prompt: 'Color grading nima va qanday qilinadi? Workflow, white balance, kontrast, cinematic look.' },
    { icon: '✂️', label: 'Montaj turlari', prompt: 'J-cut, L-cut, match cut, jump cut — har birini real misollar bilan tushuntir.' },
    { icon: '🎵', label: 'Audio miksing', prompt: 'Video uchun professional audio mixing — dialogue, musiqa, SFX darajalari.' },
    { icon: '🎬', label: 'Storytelling', prompt: 'Montaj orqali kuchli hikoya qilish — pacing, rhythm, emotional arc.' },
  ],
  ru: [
    { icon: '🎨', label: 'Цветокоррекция', prompt: 'Основы цветокоррекции — workflow, баланс белого, контраст, кинематографический вид.' },
    { icon: '✂️', label: 'Типы монтажа', prompt: 'J-cut, L-cut, match cut, jump cut с примерами из реальных фильмов.' },
    { icon: '🎵', label: 'Аудио микширование', prompt: 'Профессиональное аудио для видео — уровни диалогов, музыки, SFX.' },
    { icon: '🎬', label: 'Сторителлинг', prompt: 'Как рассказывать истории через монтаж — темп, ритм, эмоциональная дуга.' },
  ],
  tr: [
    { icon: '🎨', label: 'Renk düzeltme', prompt: 'Renk düzeltme temelleri — workflow, beyaz dengesi, kontrast, sinematik görünüm.' },
    { icon: '✂️', label: 'Kurgu türleri', prompt: 'J-cut, L-cut, match cut, jump cut — gerçek film örnekleriyle açıkla.' },
    { icon: '🎵', label: 'Ses miksaj', prompt: 'Video için profesyonel ses miksajı — diyalog, müzik, SFX seviyeleri.' },
    { icon: '🎬', label: 'Hikaye anlatımı', prompt: 'Kurgu yoluyla etkileyici hikayeler — tempo, ritim, duygusal ark.' },
  ],
  ja: [
    { icon: '🎨', label: 'カラーグレーディング', prompt: 'カラーグレーディングの基礎 — ワークフロー、ホワイトバランス、コントラスト。' },
    { icon: '✂️', label: 'カット技法', prompt: 'J-cut、L-cut、マッチカット、ジャンプカットを映画の例で説明して。' },
    { icon: '🎵', label: 'オーディオミキシング', prompt: '動画のプロ音声ミキシング — セリフ、音楽、SFXのレベル設定。' },
    { icon: '🎬', label: 'ストーリーテリング', prompt: '編集でどのように物語を語るか — ペーシング、リズム、感情的な流れ。' },
  ],
  ko: [
    { icon: '🎨', label: '색 보정', prompt: '색 보정 기초 — 워크플로우, 화이트 밸런스, 콘트라스트, 시네마틱 룩.' },
    { icon: '✂️', label: '편집 기법', prompt: 'J-cut, L-cut, 매치 컷, 점프 컷 — 실제 영화 예제로 설명해줘.' },
    { icon: '🎵', label: '오디오 믹싱', prompt: '영상 전문 오디오 믹싱 — 대화, 음악, SFX 레벨 설정.' },
    { icon: '🎬', label: '스토리텔링', prompt: '편집을 통한 스토리텔링 — 페이싱, 리듬, 감정적 흐름.' },
  ],
  ar: [
    { icon: '🎨', label: 'تصحيح الألوان', prompt: 'أساسيات تصحيح الألوان — سير العمل، توازن الأبيض، التباين، المظهر السينمائي.' },
    { icon: '✂️', label: 'أنواع المقاطع', prompt: 'J-cut وL-cut والمطابقة والقفز — مع أمثلة من أفلام حقيقية.' },
    { icon: '🎵', label: 'مزج الصوت', prompt: 'المزج الصوتي الاحترافي للفيديو — مستويات الحوار والموسيقى والمؤثرات.' },
    { icon: '🎬', label: 'سرد القصص', prompt: 'كيف تروي قصصاً مؤثرة عبر المونتاج — الإيقاع والتوقيت والقوس العاطفي.' },
  ],
  fr: [
    { icon: '🎨', label: 'Étalonnage', prompt: 'Bases de l\'étalonnage — workflow, balance des blancs, contraste, look cinématique.' },
    { icon: '✂️', label: 'Types de coupes', prompt: 'J-cut, L-cut, match cut, jump cut avec des exemples de vrais films.' },
    { icon: '🎵', label: 'Mixage audio', prompt: 'Mixage audio professionnel pour vidéo — niveaux dialogue, musique, SFX.' },
    { icon: '🎬', label: 'Storytelling', prompt: 'Raconter des histoires à travers le montage — rythme, tempo, arc émotionnel.' },
  ],
  es: [
    { icon: '🎨', label: 'Color grading', prompt: 'Fundamentos del color grading — flujo de trabajo, balance de blancos, contraste.' },
    { icon: '✂️', label: 'Tipos de cortes', prompt: 'J-cut, L-cut, match cut, jump cut con ejemplos de películas reales.' },
    { icon: '🎵', label: 'Mezcla de audio', prompt: 'Mezcla de audio profesional para vídeo — niveles de diálogo, música y SFX.' },
    { icon: '🎬', label: 'Narrativa visual', prompt: 'Cómo contar historias atractivas a través del montaje — ritmo, tempo, arco emocional.' },
  ],
  de: [
    { icon: '🎨', label: 'Farbkorrektur', prompt: 'Farbkorrektur-Grundlagen — Workflow, Weißabgleich, Kontrast, Filmoptik.' },
    { icon: '✂️', label: 'Schnittarten', prompt: 'J-cut, L-cut, Match-cut, Jump-cut mit realen Filmbeispielen erklärt.' },
    { icon: '🎵', label: 'Audio-Mixing', prompt: 'Professionelles Audio-Mixing für Video — Dialog, Musik, SFX-Pegel.' },
    { icon: '🎬', label: 'Storytelling', prompt: 'Geschichten durch Schnitt erzählen — Pacing, Rhythmus, emotionaler Bogen.' },
  ],
  zh: [
    { icon: '🎨', label: '调色基础', prompt: '调色基础 — 工作流程、白平衡、对比度、电影感。' },
    { icon: '✂️', label: '剪辑技巧', prompt: 'J-cut、L-cut、匹配剪辑、跳接 — 用真实电影例子讲解。' },
    { icon: '🎵', label: '音频混音', prompt: '视频专业音频混音 — 对话、音乐、音效电平设置。' },
    { icon: '🎬', label: '叙事技巧', prompt: '通过剪辑讲故事 — 节奏、韵律、情感弧线。' },
  ],
  pt: [
    { icon: '🎨', label: 'Gradação de cor', prompt: 'Fundamentos de color grading — fluxo de trabalho, balanço de branco, contraste.' },
    { icon: '✂️', label: 'Tipos de corte', prompt: 'J-cut, L-cut, match cut, jump cut com exemplos de filmes reais.' },
    { icon: '🎵', label: 'Mixagem de áudio', prompt: 'Mixagem de áudio profissional para vídeo — diálogo, música, SFX.' },
    { icon: '🎬', label: 'Narrativa visual', prompt: 'Como contar histórias através da edição — ritmo, cadência, arco emocional.' },
  ],
  hi: [
    { icon: '🎨', label: 'कलर ग्रेडिंग', prompt: 'कलर ग्रेडिंग की मूल बातें — वर्कफ़्लो, व्हाइट बैलेंस, कंट्रास्ट, सिनेमाई लुक।' },
    { icon: '✂️', label: 'कट प्रकार', prompt: 'J-cut, L-cut, मैच कट, जंप कट — असली फिल्म उदाहरणों के साथ।' },
    { icon: '🎵', label: 'ऑडियो मिक्सिंग', prompt: 'वीडियो के लिए प्रोफेशनल ऑडियो मिक्सिंग — डायलॉग, म्यूजिक, SFX स्तर।' },
    { icon: '🎬', label: 'स्टोरीटेलिंग', prompt: 'एडिटिंग के जरिए कहानी कहना — पेसिंग, रिदम, भावनात्मक चाप।' },
  ],
};

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 32 };
const SPRING_SLOW = { type: 'spring' as const, stiffness: 260, damping: 28 };

interface WelcomeScreenProps {
  nickname: string;
  language: Language;
  onSelectSuggestion: (prompt: string) => void;
  inputSlot?: React.ReactNode;
}

export default function WelcomeScreen({ nickname, language, onSelectSuggestion, inputSlot }: WelcomeScreenProps) {
  const greeting = useMemo(() => {
    const list = DYNAMIC_GREETINGS[language] ?? DYNAMIC_GREETINGS.en;
    return list[Math.floor(Math.random() * list.length)](nickname || 'Editor');
  }, [nickname, language]);

  const subtitle = SUBTITLES[language] ?? SUBTITLES.en;
  const suggestions = SUGGESTIONS[language] ?? SUGGESTIONS.en;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minHeight: 0,
      padding: 'clamp(24px, 6vh, 56px) clamp(16px, 5vw, 32px) 20px',
      overflowY: 'auto',
      position: 'relative',
    }}>
      {/* Ambient glow behind content */}
      <div style={{
        position: 'absolute',
        top: '5%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 560,
        height: 320,
        background: 'radial-gradient(ellipse at center, rgba(96,165,250,0.10) 0%, rgba(120,80,220,0.05) 40%, transparent 70%)',
        filter: 'blur(48px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        maxWidth: 640,
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ ...SPRING_SLOW, delay: 0 }}
          style={{ marginBottom: 28, position: 'relative' }}
        >
          <motion.div
            animate={{
              y: [0, -5, 0],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              filter: 'drop-shadow(0 6px 24px rgba(96,165,250,0.30))',
            }}
          >
            <MontaiLogo size={54} />
          </motion.div>
        </motion.div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.08 }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(22px, 4.5vw, 28px)',
            fontWeight: 700,
            color: 'var(--t-00)',
            letterSpacing: '-0.035em',
            lineHeight: 1.2,
            marginBottom: 10,
          }}
        >
          {greeting}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING, delay: 0.14 }}
          style={{
            fontSize: 14,
            color: 'var(--t-02)',
            fontFamily: 'var(--font-body)',
            letterSpacing: '-0.005em',
            marginBottom: 32,
            lineHeight: 1.6,
            maxWidth: 420,
          }}
        >
          {subtitle}
        </motion.p>

        {/* Input slot */}
        {inputSlot && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...SPRING, delay: 0.18 }}
            style={{ width: '100%', marginBottom: 24 }}
          >
            {inputSlot}
          </motion.div>
        )}

        {/* Suggestion cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
            width: '100%',
          }}
        >
          {suggestions.map((s, i) => (
            <motion.button
              key={s.label}
              onClick={() => onSelectSuggestion(s.prompt)}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ ...SPRING, delay: 0.22 + i * 0.06 }}
              whileHover={{
                y: -2,
                scale: 1.015,
                transition: { type: 'spring', stiffness: 500, damping: 30 },
              }}
              whileTap={{
                scale: 0.97,
                transition: { type: 'spring', stiffness: 600, damping: 30 },
              }}
              style={{
                padding: '14px 16px',
                borderRadius: 14,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.09)',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                boxShadow: '0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.09)',
                backdropFilter: 'blur(24px) saturate(1.5)',
                WebkitBackdropFilter: 'blur(24px) saturate(1.5)',
                transition: 'background 0.18s, border-color 0.18s, box-shadow 0.18s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(255,255,255,0.07)';
                el.style.borderColor = 'rgba(255,255,255,0.14)';
                el.style.boxShadow = '0 6px 32px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.12)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = 'rgba(255,255,255,0.04)';
                el.style.borderColor = 'rgba(255,255,255,0.09)';
                el.style.boxShadow = '0 4px 24px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.09)';
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1 }}>{s.icon}</span>
              <span style={{
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--t-01)',
                letterSpacing: '-0.01em',
                lineHeight: 1.4,
                fontFamily: 'var(--font-body)',
              }}>
                {s.label}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
