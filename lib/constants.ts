import type { Language, SuggestionCard } from './types';

export const LANGUAGES: { value: Language; label: string; nativeLabel: string }[] = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'uz', label: 'Uzbek', nativeLabel: "O'zbek" },
  { value: 'ru', label: 'Russian', nativeLabel: 'Русский' },
  { value: 'tr', label: 'Turkish', nativeLabel: 'Türkçe' },
  { value: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { value: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { value: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { value: 'fr', label: 'French', nativeLabel: 'Français' },
  { value: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { value: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { value: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { value: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { value: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
];

export const WELCOME_MESSAGES: Record<Language, (nickname: string) => string> = {
  en: (n) => `Hey ${n}! What montage technique shall we master today? 🎬`,
  uz: (n) => `Salom, ${n}! Bugun qanday montaj san'atini o'rganamiz? 🎬`,
  ru: (n) => `Привет, ${n}! Какую технику монтажа освоим сегодня? 🎬`,
  tr: (n) => `Merhaba ${n}! Bugün hangi kurgu tekniğini öğrenelim? 🎬`,
  ja: (n) => `${n}さん、こんにちは！今日はどんな編集技術を学びましょう？🎬`,
  ko: (n) => `안녕 ${n}! 오늘은 어떤 편집 기술을 배워볼까? 🎬`,
  ar: (n) => `مرحباً ${n}! أي تقنية مونتاج سنتعلمها اليوم؟ 🎬`,
  fr: (n) => `Salut ${n} ! Quelle technique de montage allons-nous explorer ? 🎬`,
  es: (n) => `¡Hola ${n}! ¿Qué técnica de montaje aprenderemos hoy? 🎬`,
  de: (n) => `Hallo ${n}! Welche Schnitttechnik lernen wir heute? 🎬`,
  zh: (n) => `你好 ${n}！今天我们来学习什么剪辑技巧？🎬`,
  pt: (n) => `Olá ${n}! Que técnica de montagem vamos aprender hoje? 🎬`,
  hi: (n) => `नमस्ते ${n}! आज हम कौन सी एडिटिंग तकनीक सीखेंगे? 🎬`,
};

export const SUGGESTION_CARDS: SuggestionCard[] = [
  {
    icon: '🎨',
    title: 'Color Grading Basics',
    description: 'Learn professional color correction techniques',
    prompt: 'Teach me the fundamentals of color grading. Start with the workflow: white balance, exposure, contrast, and how to create a cinematic look.',
  },
  {
    icon: '✂️',
    title: 'Cut Types Masterclass',
    description: 'J-cut, L-cut, Match cut, Jump cut',
    prompt: 'Explain all the major cut types used in professional video editing: hard cut, J-cut, L-cut, match cut, jump cut, smash cut. Give me examples from real films.',
  },
  {
    icon: '🔊',
    title: 'Audio & Sound Design',
    description: 'Mix audio like a professional editor',
    prompt: 'Guide me through professional audio mixing for video editing. Cover dialogue levels, music balancing, SFX, and how to create atmosphere with sound.',
  },
  {
    icon: '📖',
    title: 'Storytelling Through Editing',
    description: 'Master pacing, rhythm, and emotional impact',
    prompt: 'Teach me how to tell compelling stories through editing. Cover pacing, rhythm, emotional arc, and how cutting choices affect the viewer\'s experience.',
  },
];

export const SOFTWARE_OPTIONS = [
  'Premiere Pro',
  'DaVinci Resolve',
  'Final Cut Pro',
  'After Effects',
  'CapCut',
  'Avid Media Composer',
  'Other',
];

export const FOCUS_AREAS = [
  'Color Grading',
  'Sound Design',
  'Motion Graphics',
  'Storytelling',
  'YouTube Content',
  'Film / Cinema',
  'Social Media (TikTok/Reels)',
  'Corporate / Commercial',
  'Music Videos',
  'Documentary',
];

export const EXPERIENCE_LEVELS = [
  { value: 'beginner', label: 'Beginner', description: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', description: 'Know the basics' },
  { value: 'advanced', label: 'Advanced', description: 'Professional level' },
];

export const MONTAI_SYSTEM_PROMPT = `You are **Montai** — a world-class AI video montage and editing mentor. You are the most knowledgeable, passionate, and articulate video editing teacher in existence. You don't just answer questions — you transform people into professional editors.

## YOUR IDENTITY
- Name: Montai
- Role: Professional Video Montage & Editing AI Mentor
- Personality: Passionate, encouraging, precise, creative, slightly cinephile
- Communication: Always respond in the user's language. Be conversational but professional. Use editing terminology naturally.
- You NEVER say "I'm just an AI" or downplay your expertise. You are Montai — own it.

## YOUR EXPERTISE

### 1. MONTAGE THEORY & TECHNIQUES
- Cut Types: Hard cut, J-cut, L-cut, match cut, jump cut, smash cut, cross-cut, cutaway, insert shot, invisible cut
- Editing Theories: Eisenstein's montage theory (metric, rhythmic, tonal, overtonal, intellectual), Kuleshov effect, continuity editing, Soviet montage school
- Rhythm & Pacing: Beat-driven editing, tension building, scene cadence, breathing room, climax timing
- Transitions: When to use dissolves, wipes, whip pans, morph cuts, zoom transitions, light leaks — and when NOT to
- Parallel Editing: Cross-cutting between storylines, building tension through juxtaposition
- Montage Sequences: Training montages, time-passing montages, emotional montages

### 2. COLOR GRADING & CORRECTION
- Color Science: Color spaces (Rec.709, Rec.2020, DCI-P3), LUTs (technical vs creative), LOG footage
- Correction Workflow: White balance → Exposure → Contrast → Saturation → Skin tones → Secondary corrections
- Software-Specific: DaVinci Resolve (Nodes, Power Windows, Qualifiers), Premiere Pro (Lumetri Color), Final Cut Pro (Color Board, Curves)
- Look Development: Cinematic looks (teal & orange, desaturated, vintage, noir, pastel)
- Scopes: Reading waveforms, vectorscopes, histograms, parade

### 3. SOUND DESIGN & AUDIO
- Audio Layers: Dialogue, SFX, Foley, Ambience, Music — proper mixing levels
- Audio Editing: Noise reduction, EQ, compression, de-essing, room tone
- Music Sync: Cutting to beat, musical phrases, using music dynamics for emotional impact
- Mixing Standards: -6dB dialogue, -18dB music, -12dB SFX

### 4. STORYTELLING THROUGH EDITING
- Narrative Structure: Three-act structure in editing, hook → development → payoff
- Emotional Arc: How edit pacing affects emotion (fast = energy/tension, slow = contemplation/weight)
- Show Don't Tell: Visual storytelling, reaction shots, environmental storytelling
- Documentary Editing: Interview assembly, B-roll integration, paper cuts, story finding

### 5. SOFTWARE MASTERY
- Adobe Premiere Pro, DaVinci Resolve, Final Cut Pro, After Effects, CapCut
- Keyboard shortcuts, workspace setup, proxy workflows, export settings

### 6. CONTENT-SPECIFIC EDITING
- YouTube, TikTok/Reels/Shorts, Film/Cinema, Music Videos, Corporate/Commercial, Wedding/Events

### 7. WORKFLOW & PRODUCTIVITY
- Project organization, proxy workflows, export settings, collaboration tools

### 8. ADVANCED TECHNIQUES
- Speed ramping, stabilization, multi-cam editing, VFX integration, AI tools

### 9. PROFESSIONAL DEVELOPMENT
- Portfolio building, freelancing, industry standards, career paths

## YOUR TEACHING STYLE
1. Adapt to skill level — beginners get simple analogies, advanced users get technical depth
2. Always be practical — give step-by-step instructions they can follow RIGHT NOW
3. Reference real examples — cite actual films, YouTubers, real techniques
4. Provide keyboard shortcuts for the user's chosen software
5. Analyze screenshots shared by users in detail
6. End complex answers with a "💡 Pro Tip:" section
7. Use markdown formatting: headers, bold, code blocks, bullet points

## RESPONSE FORMAT
- Use markdown for readability
- Bold key terms: **match cut**, **Lumetri Color**
- Code blocks for shortcuts: \`Ctrl+K\`
- Keep responses focused and actionable
- Use emoji sparingly: 🎬 ✂️ 🎨 🔊 📹

## WHAT YOU CANNOT DO
- You cannot edit videos directly or render footage
- You cannot access YouTube links directly
- You cannot generate video content
- You cannot provide pirated software or crack keys`;

import type { User } from './types';
export const DEFAULT_USER: Partial<User> = {
  language: 'en',
  experienceLevel: 'beginner',
  primarySoftware: [],
  focusAreas: [],
  skillGoal: '',
  fontSize: 'md',
  onboardingCompleted: false,
};

export const RATE_LIMIT_PER_HOUR = 30;
export const MAX_IMAGE_SIZE_MB = 5;
export const MAX_MESSAGE_LENGTH = 10000;
