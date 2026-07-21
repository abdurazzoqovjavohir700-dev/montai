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

const SUGGESTIONS: Record<Language, Array<{ label: string; prompt: string }>> = {
  en: [
    { label: 'Color grading basics', prompt: 'Teach me color grading fundamentals — workflow, white balance, contrast, cinematic look.' },
    { label: 'Cut types masterclass', prompt: 'Explain J-cut, L-cut, match cut, jump cut with real film examples.' },
    { label: 'Audio mixing guide', prompt: 'Professional audio mixing for video — dialogue levels, music, SFX balance.' },
    { label: 'Storytelling through cuts', prompt: 'How to tell compelling stories through editing — pacing, rhythm, emotional arc.' },
  ],
  uz: [
    { label: 'Color grading asoslari', prompt: 'Color grading nima va qanday qilinadi? Workflow, white balance, kontrast, cinematic look.' },
    { label: 'Montaj turlari', prompt: 'J-cut, L-cut, match cut, jump cut — har birini real misollar bilan tushuntir.' },
    { label: 'Audio miksing', prompt: 'Video uchun professional audio mixing — dialogue, musiqa, SFX darajalari.' },
    { label: 'Storytelling', prompt: 'Montaj orqali kuchli hikoya qilish — pacing, rhythm, emotional arc.' },
  ],
  ru: [
    { label: 'Цветокоррекция', prompt: 'Основы цветокоррекции — workflow, баланс белого, контраст, кинематографический вид.' },
    { label: 'Типы монтажа', prompt: 'J-cut, L-cut, match cut, jump cut с примерами из реальных фильмов.' },
    { label: 'Аудио микширование', prompt: 'Профессиональное аудио для видео — уровни диалогов, музыки, SFX.' },
    { label: 'Сторителлинг', prompt: 'Как рассказывать истории через монтаж — темп, ритм, эмоциональная дуга.' },
  ],
  tr: [
    { label: 'Renk düzeltme', prompt: 'Renk düzeltme temelleri — workflow, beyaz dengesi, kontrast, sinematik görünüm.' },
    { label: 'Kurgu türleri', prompt: 'J-cut, L-cut, match cut, jump cut — gerçek film örnekleriyle açıkla.' },
    { label: 'Ses miksaj', prompt: 'Video için profesyonel ses miksajı — diyalog, müzik, SFX seviyeleri.' },
    { label: 'Hikaye anlatımı', prompt: 'Kurgu yoluyla etkileyici hikayeler — tempo, ritim, duygusal ark.' },
  ],
  ja: [
    { label: 'カラーグレーディング', prompt: 'カラーグレーディングの基礎 — ワークフロー、ホワイトバランス、コントラスト。' },
    { label: 'カット技法', prompt: 'J-cut、L-cut、マッチカット、ジャンプカットを映画の例で説明して。' },
    { label: 'オーディオミキシング', prompt: '動画のプロ音声ミキシング — セリフ、音楽、SFXのレベル設定。' },
    { label: 'ストーリーテリング', prompt: '編集でどのように物語を語るか — ペーシング、リズム、感情的な流れ。' },
  ],
  ko: [
    { label: '색 보정', prompt: '색 보정 기초 — 워크플로우, 화이트 밸런스, 콘트라스트, 시네마틱 룩.' },
    { label: '편집 기법', prompt: 'J-cut, L-cut, 매치 컷, 점프 컷 — 실제 영화 예제로 설명해줘.' },
    { label: '오디오 믹싱', prompt: '영상 전문 오디오 믹싱 — 대화, 음악, SFX 레벨 설정.' },
    { label: '스토리텔링', prompt: '편집을 통한 스토리텔링 — 페이싱, 리듬, 감정적 흐름.' },
  ],
  ar: [
    { label: 'تصحيح الألوان', prompt: 'أساسيات تصحيح الألوان — سير العمل، توازن الأبيض، التباين، المظهر السينمائي.' },
    { label: 'أنواع المقاطع', prompt: 'J-cut وL-cut والمطابقة والقفز — مع أمثلة من أفلام حقيقية.' },
    { label: 'مزج الصوت', prompt: 'المزج الصوتي الاحترافي للفيديو — مستويات الحوار والموسيقى والمؤثرات.' },
    { label: 'سرد القصص', prompt: 'كيف تروي قصصاً مؤثرة عبر المونتاج — الإيقاع والتوقيت والقوس العاطفي.' },
  ],
  fr: [
    { label: 'Étalonnage', prompt: 'Bases de l\'étalonnage — workflow, balance des blancs, contraste, look cinématique.' },
    { label: 'Types de coupes', prompt: 'J-cut, L-cut, match cut, jump cut avec des exemples de vrais films.' },
    { label: 'Mixage audio', prompt: 'Mixage audio professionnel pour vidéo — niveaux dialogue, musique, SFX.' },
    { label: 'Storytelling', prompt: 'Raconter des histoires à travers le montage — rythme, tempo, arc émotionnel.' },
  ],
  es: [
    { label: 'Color grading', prompt: 'Fundamentos del color grading — flujo de trabajo, balance de blancos, contraste, aspecto cinematográfico.' },
    { label: 'Tipos de cortes', prompt: 'J-cut, L-cut, match cut, jump cut con ejemplos de películas reales.' },
    { label: 'Mezcla de audio', prompt: 'Mezcla de audio profesional para vídeo — niveles de diálogo, música y SFX.' },
    { label: 'Narrativa visual', prompt: 'Cómo contar historias atractivas a través del montaje — ritmo, tempo, arco emocional.' },
  ],
  de: [
    { label: 'Farbkorrektur', prompt: 'Farbkorrektur-Grundlagen — Workflow, Weißabgleich, Kontrast, Filmoptik.' },
    { label: 'Schnittarten', prompt: 'J-cut, L-cut, Match-cut, Jump-cut mit realen Filmbeispielen erklärt.' },
    { label: 'Audio-Mixing', prompt: 'Professionelles Audio-Mixing für Video — Dialog, Musik, SFX-Pegel.' },
    { label: 'Storytelling', prompt: 'Geschichten durch Schnitt erzählen — Pacing, Rhythmus, emotionaler Bogen.' },
  ],
  zh: [
    { label: '调色基础', prompt: '调色基础 — 工作流程、白平衡、对比度、电影感。' },
    { label: '剪辑技巧', prompt: 'J-cut、L-cut、匹配剪辑、跳接 — 用真实电影例子讲解。' },
    { label: '音频混音', prompt: '视频专业音频混音 — 对话、音乐、音效电平设置。' },
    { label: '叙事技巧', prompt: '通过剪辑讲故事 — 节奏、韵律、情感弧线。' },
  ],
  pt: [
    { label: 'Gradação de cor', prompt: 'Fundamentos de color grading — fluxo de trabalho, balanço de branco, contraste, visual cinematográfico.' },
    { label: 'Tipos de corte', prompt: 'J-cut, L-cut, match cut, jump cut com exemplos de filmes reais.' },
    { label: 'Mixagem de áudio', prompt: 'Mixagem de áudio profissional para vídeo — diálogo, música, SFX.' },
    { label: 'Narrativa visual', prompt: 'Como contar histórias através da edição — ritmo, cadência, arco emocional.' },
  ],
  hi: [
    { label: 'कलर ग्रेडिंग', prompt: 'कलर ग्रेडिंग की मूल बातें — वर्कफ़्लो, व्हाइट बैलेंस, कंट्रास्ट, सिनेमाई लुक।' },
    { label: 'कट प्रकार', prompt: 'J-cut, L-cut, मैच कट, जंप कट — असली फिल्म उदाहरणों के साथ।' },
    { label: 'ऑडियो मिक्सिंग', prompt: 'वीडियो के लिए प्रोफेशनल ऑडियो मिक्सिंग — डायलॉग, म्यूजिक, SFX स्तर।' },
    { label: 'स्टोरीटेलिंग', prompt: 'एडिटिंग के जरिए कहानी कहना — पेसिंग, रिदम, भावनात्मक चाप।' },
  ],
};

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
      padding: 'clamp(20px, 5vh, 48px) clamp(16px, 5vw, 32px) 20px',
      overflowY: 'auto',
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        width: '100%',
        maxWidth: 640,
      }}>
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          style={{ marginBottom: 22, position: 'relative' }}
        >
          <div style={{
            position: 'absolute',
            inset: -20,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(96,165,250,0.1) 0%, transparent 70%)',
            filter: 'blur(12px)',
            pointerEvents: 'none',
          }} />
          <motion.div
            animate={{
              y: [0, -4, 0],
              filter: [
                'drop-shadow(0 4px 16px rgba(96,165,250,0.25))',
                'drop-shadow(0 6px 24px rgba(96,165,250,0.42))',
                'drop-shadow(0 4px 16px rgba(96,165,250,0.25))',
              ],
            }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <MontaiLogo size={52} />
          </motion.div>
        </motion.div>

        {/* Greeting */}
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: 'var(--font-display, Manrope, sans-serif)',
            fontSize: 'clamp(20px, 4.5vw, 26px)',
            fontWeight: 700,
            color: '#EEEEF0',
            letterSpacing: '-0.03em',
            lineHeight: 1.25,
            marginBottom: 8,
          }}
        >
          {greeting}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.17, duration: 0.4 }}
          style={{
            fontSize: 13.5,
            color: '#5A6272',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.005em',
            marginBottom: 28,
            lineHeight: 1.55,
          }}
        >
          {subtitle}
        </motion.p>

        {/* Input slot */}
        {inputSlot && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: '100%', marginBottom: 20 }}
          >
            {inputSlot}
          </motion.div>
        )}

        {/* Suggestion pills */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.38 }}
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            width: '100%',
          }}
        >
          {suggestions.map((s, i) => (
            <motion.button
              key={s.label}
              onClick={() => onSelectSuggestion(s.prompt)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 + i * 0.05, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)' }}
              whileTap={{ scale: 0.975 }}
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.07)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'Inter, sans-serif',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                transition: 'all 0.18s ease',
              }}
            >
              <span style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#8B93A4',
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
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
