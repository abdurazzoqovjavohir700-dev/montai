'use client';

import { useState, useEffect, useCallback } from 'react';
import { Check, Palette, Type, Zap, Moon } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

/* ─── Types ──────────────────────────────────────────────── */
export interface ThemePrefs {
  accent:    string;   // hex
  accent2:   string;   // derived hex
  theme:     string;   // theme id
  font:      string;   // font-family string
  density:   'compact' | 'normal' | 'spacious';
  motion:    boolean;
}

const STORAGE_KEY = 'montai_theme_prefs';

const DEFAULTS: ThemePrefs = {
  accent:  '#F59E0B',
  accent2: '#F97316',
  theme:   'default',
  font:    'Inter, sans-serif',
  density: 'normal',
  motion:  true,
};

/* ─── Accent colors ──────────────────────────────────────── */
const ACCENTS: { label: string; hex: string; hex2: string; glow: string }[] = [
  { label: 'Orange',  hex: '#F59E0B', hex2: '#F97316', glow: 'rgba(245,158,11,0.18)'  },
  { label: 'Amber',   hex: '#D97706', hex2: '#B45309', glow: 'rgba(217,119,6,0.18)'   },
  { label: 'Blue',    hex: '#3B82F6', hex2: '#2563EB', glow: 'rgba(59,130,246,0.18)'  },
  { label: 'Indigo',  hex: '#6366F1', hex2: '#4F46E5', glow: 'rgba(99,102,241,0.18)'  },
  { label: 'Purple',  hex: '#8B5CF6', hex2: '#7C3AED', glow: 'rgba(139,92,246,0.18)'  },
  { label: 'Pink',    hex: '#EC4899', hex2: '#DB2777', glow: 'rgba(236,72,153,0.18)'  },
  { label: 'Rose',    hex: '#F43F5E', hex2: '#E11D48', glow: 'rgba(244,63,94,0.18)'   },
  { label: 'Red',     hex: '#EF4444', hex2: '#DC2626', glow: 'rgba(239,68,68,0.18)'   },
  { label: 'Teal',    hex: '#14B8A6', hex2: '#0D9488', glow: 'rgba(20,184,166,0.18)'  },
  { label: 'Emerald', hex: '#10B981', hex2: '#059669', glow: 'rgba(16,185,129,0.18)'  },
  { label: 'Green',   hex: '#22C55E', hex2: '#16A34A', glow: 'rgba(34,197,94,0.18)'   },
  { label: 'Cyan',    hex: '#06B6D4', hex2: '#0891B2', glow: 'rgba(6,182,212,0.18)'   },
];

/* ─── Themes ─────────────────────────────────────────────── */
const THEMES: {
  id: string; label: string; tag?: string;
  vars: Record<string, string>;
}[] = [
  {
    id: 'default', label: 'Default',
    vars: {
      '--bg-primary':   '#0D0D0D', '--bg-secondary': '#111113',
      '--bg-tertiary':  '#18181B', '--bg-elevated':  '#1F1F23',
      '--text-primary': '#FAFAFA', '--text-secondary':'#A1A1AA',
      '--text-tertiary':'#71717A', '--border':        '#27272A',
    },
  },
  {
    id: 'midnight', label: 'Midnight', tag: 'Deep',
    vars: {
      '--bg-primary':   '#080B14', '--bg-secondary': '#0C1020',
      '--bg-tertiary':  '#111827', '--bg-elevated':  '#162033',
      '--text-primary': '#F1F5F9', '--text-secondary':'#94A3B8',
      '--text-tertiary':'#64748B', '--border':        '#1E293B',
    },
  },
  {
    id: 'amoled', label: 'AMOLED', tag: 'Pure Black',
    vars: {
      '--bg-primary':   '#000000', '--bg-secondary': '#030303',
      '--bg-tertiary':  '#0A0A0A', '--bg-elevated':  '#111111',
      '--text-primary': '#FFFFFF', '--text-secondary':'#A3A3A3',
      '--text-tertiary':'#737373', '--border':        '#1A1A1A',
    },
  },
  {
    id: 'carbon', label: 'Carbon', tag: 'Charcoal',
    vars: {
      '--bg-primary':   '#121212', '--bg-secondary': '#1A1A1A',
      '--bg-tertiary':  '#222222', '--bg-elevated':  '#2A2A2A',
      '--text-primary': '#EEEEEE', '--text-secondary':'#9E9E9E',
      '--text-tertiary':'#616161', '--border':        '#333333',
    },
  },
  {
    id: 'slate', label: 'Slate', tag: 'Cool',
    vars: {
      '--bg-primary':   '#0F172A', '--bg-secondary': '#1E293B',
      '--bg-tertiary':  '#334155', '--bg-elevated':  '#1E293B',
      '--text-primary': '#F8FAFC', '--text-secondary':'#94A3B8',
      '--text-tertiary':'#64748B', '--border':        '#334155',
    },
  },
  {
    id: 'nord', label: 'Nord', tag: 'Arctic',
    vars: {
      '--bg-primary':   '#2E3440', '--bg-secondary': '#3B4252',
      '--bg-tertiary':  '#434C5E', '--bg-elevated':  '#4C566A',
      '--text-primary': '#ECEFF4', '--text-secondary':'#D8DEE9',
      '--text-tertiary':'#81A1C1', '--border':        '#434C5E',
    },
  },
  {
    id: 'dracula', label: 'Dracula', tag: 'Classic',
    vars: {
      '--bg-primary':   '#282A36', '--bg-secondary': '#1E1F29',
      '--bg-tertiary':  '#343746', '--bg-elevated':  '#44475A',
      '--text-primary': '#F8F8F2', '--text-secondary':'#BD93F9',
      '--text-tertiary':'#6272A4', '--border':        '#44475A',
    },
  },
  {
    id: 'rose', label: 'Rose Pine', tag: 'Warm',
    vars: {
      '--bg-primary':   '#191724', '--bg-secondary': '#1F1D2E',
      '--bg-tertiary':  '#26233A', '--bg-elevated':  '#403D52',
      '--text-primary': '#E0DEF4', '--text-secondary':'#908CAA',
      '--text-tertiary':'#6E6A86', '--border':        '#403D52',
    },
  },
];

/* ─── Fonts ──────────────────────────────────────────────── */
const FONTS: { label: string; value: string; mono?: boolean }[] = [
  { label: 'Inter',         value: 'Inter, sans-serif'          },
  { label: 'Sora',          value: 'Sora, sans-serif'           },
  { label: 'System UI',     value: 'system-ui, sans-serif'      },
  { label: 'JetBrains Mono',value: "'JetBrains Mono', monospace", mono: true },
];

/* ─── Apply to DOM ───────────────────────────────────────── */
export function applyThemePrefs(prefs: ThemePrefs) {
  const root = document.documentElement;

  // Accent
  root.style.setProperty('--accent', prefs.accent);
  root.style.setProperty('--accent-primary', prefs.accent);
  root.style.setProperty('--accent-secondary', prefs.accent2);
  root.style.setProperty('--accent-hover', prefs.accent2);
  root.style.setProperty('--accent-glow',
    `${prefs.accent}2E`);
  root.style.setProperty('--accent-glow-strong',
    `${prefs.accent}4D`);
  root.style.setProperty('--accent-gradient',
    `linear-gradient(135deg, ${prefs.accent} 0%, ${prefs.accent2} 100%)`);
  root.style.setProperty('--color-accent-primary', prefs.accent);
  root.style.setProperty('--color-accent-secondary', prefs.accent2);

  // Theme background / text / border
  const theme = THEMES.find(t => t.id === prefs.theme) ?? THEMES[0];
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));

  // Body bg
  document.body.style.backgroundColor = theme.vars['--bg-primary'] ?? '#0D0D0D';

  // Font
  document.body.style.fontFamily = prefs.font;

  // Density
  const densityVars: Record<string, Record<string, string>> = {
    compact:   { '--msg-padding': '6px 0',   '--msg-line-height': '1.65' },
    normal:    { '--msg-padding': '8px 0',   '--msg-line-height': '1.85' },
    spacious:  { '--msg-padding': '14px 0',  '--msg-line-height': '2.0'  },
  };
  Object.entries(densityVars[prefs.density] ?? {}).forEach(([k, v]) => root.style.setProperty(k, v));

  // Motion
  if (!prefs.motion) {
    root.style.setProperty('--transition-fast',   '0ms ease');
    root.style.setProperty('--transition-normal', '0ms ease');
    root.style.setProperty('--transition-slow',   '0ms ease');
  } else {
    root.style.setProperty('--transition-fast',   '150ms ease');
    root.style.setProperty('--transition-normal', '250ms ease');
    root.style.setProperty('--transition-slow',   '400ms cubic-bezier(0.16, 1, 0.3, 1)');
  }
}

/* ─── Storage ────────────────────────────────────────────── */
export function loadThemePrefs(): ThemePrefs {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) as Partial<ThemePrefs> };
  } catch { return DEFAULTS; }
}

function saveThemePrefs(p: ThemePrefs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

/* ─── Component ──────────────────────────────────────────── */
export default function ThemeSystem() {
  const [prefs, setPrefs] = useState<ThemePrefs>(() => loadThemePrefs());
  const [customHex, setCustomHex] = useState('#F59E0B');
  const [section, setSection] = useState<'accent'|'theme'|'font'|'motion'>('accent');

  // Live preview on any change
  useEffect(() => { applyThemePrefs(prefs); }, [prefs]);

  const set = useCallback(<K extends keyof ThemePrefs>(key: K, val: ThemePrefs[K]) => {
    setPrefs(prev => ({ ...prev, [key]: val }));
  }, []);

  const setAccent = useCallback((hex: string, hex2: string) => {
    setPrefs(prev => ({ ...prev, accent: hex, accent2: hex2 }));
  }, []);

  const apply = () => {
    saveThemePrefs(prefs);
    toast.success('Mavzu saqlandi');
  };

  const reset = () => {
    setPrefs(DEFAULTS);
    saveThemePrefs(DEFAULTS);
    toast.info('Standart mavzuga qaytarildi');
  };

  /* ── Section pill nav ── */
  const sectionTabs: { id: typeof section; label: string; icon: React.ReactNode }[] = [
    { id: 'accent', label: 'Rang',    icon: <Palette size={13} strokeWidth={1.5} /> },
    { id: 'theme',  label: 'Mavzu',   icon: <Moon    size={13} strokeWidth={1.5} /> },
    { id: 'font',   label: 'Shrift',  icon: <Type    size={13} strokeWidth={1.5} /> },
    { id: 'motion', label: 'Harakat', icon: <Zap     size={13} strokeWidth={1.5} /> },
  ];

  /* ── Accent dot ── */
  const AccentDot = ({ hex, hex2, selected, label }: { hex: string; hex2: string; selected: boolean; label: string }) => (
    <button
      onClick={() => setAccent(hex, hex2)}
      title={label}
      style={{
        width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
        background: `linear-gradient(135deg, ${hex}, ${hex2})`,
        boxShadow: selected ? `0 0 0 3px #fff2, 0 0 0 5px ${hex}` : `0 2px 8px ${hex}40`,
        transform: selected ? 'scale(1.15)' : 'scale(1)',
        transition: 'transform 0.15s, box-shadow 0.15s',
        outline: 'none',
      }}
    />
  );

  /* ── Theme card ── */
  const ThemeCard = ({ theme }: { theme: typeof THEMES[0] }) => {
    const selected = prefs.theme === theme.id;
    return (
      <button
        onClick={() => set('theme', theme.id)}
        style={{
          borderRadius: 10, border: 'none', cursor: 'pointer', overflow: 'hidden', padding: 0,
          outline: selected ? `2px solid ${prefs.accent}` : '2px solid transparent',
          transition: 'outline 0.12s, transform 0.12s',
          transform: selected ? 'scale(1.03)' : 'scale(1)',
          background: 'transparent',
        }}
      >
        {/* Mini preview */}
        <div style={{ width: '100%', aspectRatio: '3/2', position: 'relative', overflow: 'hidden', background: theme.vars['--bg-primary'] }}>
          {/* Fake sidebar */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '28%', background: theme.vars['--bg-secondary'], borderRight: `1px solid ${theme.vars['--border']}` }}>
            {[70, 55, 55, 50].map((w, i) => (
              <div key={i} style={{ margin: `${i === 0 ? 6 : 4}px 6px`, height: 7, width: `${w}%`, borderRadius: 3, background: theme.vars['--border'], opacity: 0.7 }} />
            ))}
          </div>
          {/* Fake messages */}
          <div style={{ position: 'absolute', left: '30%', right: 4, top: 4, bottom: 4, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 4 }}>
            <div style={{ alignSelf: 'flex-end', height: 10, width: '55%', borderRadius: 5, background: prefs.accent, opacity: 0.8 }} />
            <div style={{ alignSelf: 'flex-start', height: 10, width: '70%', borderRadius: 5, background: theme.vars['--bg-tertiary'] }} />
            <div style={{ alignSelf: 'flex-start', height: 8, width: '50%', borderRadius: 5, background: theme.vars['--bg-tertiary'], opacity: 0.6 }} />
          </div>
          {selected && (
            <div style={{ position: 'absolute', top: 5, right: 5, width: 18, height: 18, borderRadius: '50%', background: prefs.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={10} strokeWidth={2.5} style={{ color: '#0A0A0B' }} />
            </div>
          )}
        </div>
        <div style={{ padding: '7px 8px', background: theme.vars['--bg-secondary'], display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11.5, fontWeight: 500, color: theme.vars['--text-primary'], fontFamily: 'Inter, sans-serif' }}>{theme.label}</span>
          {theme.tag && <span style={{ fontSize: 10, color: theme.vars['--text-tertiary'], fontFamily: 'Inter, sans-serif' }}>{theme.tag}</span>}
        </div>
      </button>
    );
  };

  /* ── Toggle ── */
  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      style={{
        width: 42, height: 23, borderRadius: 12, flexShrink: 0, border: 'none',
        background: on ? `linear-gradient(135deg, ${prefs.accent}, ${prefs.accent2})` : '#3F3F46',
        cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
        boxShadow: on ? `0 0 12px ${prefs.accent}40` : 'none',
      }}
    >
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#FAFAFA', position: 'absolute', top: 2.5, left: on ? 21.5 : 2.5, transition: 'left 0.18s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );

  return (
    <div>
      {/* Section pills */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
        {sectionTabs.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 12.5, fontWeight: 500, fontFamily: 'Inter, sans-serif',
              background: section === s.id ? `linear-gradient(135deg, ${prefs.accent}20, ${prefs.accent2}20)` : 'rgba(255,255,255,0.05)',
              color: section === s.id ? prefs.accent : '#71717A',
              outline: section === s.id ? `1px solid ${prefs.accent}50` : '1px solid rgba(255,255,255,0.07)',
              transition: 'all 0.15s',
            }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {/* ── ACCENT ── */}
      {section === 'accent' && (
        <div>
          <p style={{ fontSize: 12.5, color: '#52525B', fontFamily: 'Inter, sans-serif', marginBottom: 16, lineHeight: 1.6 }}>
            Tanlangan rang butun interfeysdagi tugma, link va belgilar rangini o&apos;zgartiradi.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
            {ACCENTS.map(a => (
              <AccentDot key={a.hex} hex={a.hex} hex2={a.hex2} label={a.label}
                selected={prefs.accent === a.hex} />
            ))}
          </div>
          {/* Custom color picker */}
          <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="color"
              value={customHex}
              onChange={e => setCustomHex(e.target.value)}
              style={{ width: 40, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', padding: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: '#D4D4D8', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>O&apos;zingizning rangingiz</div>
              <div style={{ fontSize: 12, color: '#52525B', fontFamily: 'JetBrains Mono, monospace' }}>{customHex.toUpperCase()}</div>
            </div>
            <button
              onClick={() => setAccent(customHex, customHex + 'CC')}
              style={{
                padding: '7px 14px', borderRadius: 8, border: 'none',
                background: customHex, color: '#fff', fontSize: 12.5,
                fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)',
              }}
            >
              Qo&apos;llash
            </button>
          </div>

          {/* Live preview swatch */}
          <div style={{ marginTop: 14, padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12.5, color: '#71717A', fontFamily: 'Inter, sans-serif' }}>Oldindan ko&apos;rish:</div>
            <button style={{ padding: '7px 16px', borderRadius: 8, border: 'none', background: `linear-gradient(135deg, ${prefs.accent}, ${prefs.accent2})`, color: '#0A0A0B', fontSize: 13, fontWeight: 600, cursor: 'default', fontFamily: 'Inter, sans-serif' }}>
              Tugma
            </button>
            <span style={{ fontSize: 13.5, color: prefs.accent, fontFamily: 'Inter, sans-serif', textDecoration: 'underline', cursor: 'default' }}>Havola</span>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: `linear-gradient(135deg, ${prefs.accent}, ${prefs.accent2})` }} />
          </div>
        </div>
      )}

      {/* ── THEME ── */}
      {section === 'theme' && (
        <div>
          <p style={{ fontSize: 12.5, color: '#52525B', fontFamily: 'Inter, sans-serif', marginBottom: 16, lineHeight: 1.6 }}>
            Fon va matn ranglarini o&apos;zgartiradi. Chat foni alohida sozlanadi.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {THEMES.map(t => <ThemeCard key={t.id} theme={t} />)}
          </div>
        </div>
      )}

      {/* ── FONT ── */}
      {section === 'font' && (
        <div>
          <p style={{ fontSize: 12.5, color: '#52525B', fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>
            Chat va interfeys shrifti.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
            {FONTS.map(f => (
              <button
                key={f.value}
                onClick={() => set('font', f.value)}
                style={{
                  padding: '12px 16px', borderRadius: 10, border: 'none', textAlign: 'left', cursor: 'pointer',
                  background: prefs.font === f.value ? `${prefs.accent}14` : 'rgba(255,255,255,0.04)',
                  outline: prefs.font === f.value ? `1px solid ${prefs.accent}60` : '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  transition: 'all 0.12s',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: f.value, color: prefs.font === f.value ? prefs.accent : '#D4D4D8' }}>{f.label}</div>
                  <div style={{ fontSize: 13, fontFamily: f.value, color: '#52525B', marginTop: 2 }}>Salom! Bu {f.label} shrifti.</div>
                </div>
                {prefs.font === f.value && <Check size={15} strokeWidth={2} style={{ color: prefs.accent, flexShrink: 0 }} />}
              </button>
            ))}
          </div>

          {/* Density */}
          <p style={{ fontSize: 12, color: '#52525B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, fontFamily: 'Inter, sans-serif' }}>
            Xabar zichligi
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['compact','normal','spacious'] as const).map(d => (
              <button key={d} onClick={() => set('density', d)} style={{
                flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: prefs.density === d ? `${prefs.accent}14` : 'rgba(255,255,255,0.04)',
                outline: prefs.density === d ? `1px solid ${prefs.accent}60` : '1px solid rgba(255,255,255,0.08)',
                color: prefs.density === d ? prefs.accent : '#71717A',
                fontSize: 12.5, fontWeight: 500, fontFamily: 'Inter, sans-serif', textTransform: 'capitalize',
              }}>
                {d === 'compact' ? 'Ixcham' : d === 'normal' ? 'Oddiy' : 'Keng'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MOTION ── */}
      {section === 'motion' && (
        <div>
          <p style={{ fontSize: 12.5, color: '#52525B', fontFamily: 'Inter, sans-serif', marginBottom: 16, lineHeight: 1.6 }}>
            Animatsiyalar va effektlarni boshqarish. Past qurilmalarda o&apos;chirish tavsiya etiladi.
          </p>
          {[
            { key: 'motion' as const, label: 'Animatsiyalar', desc: 'Sahifa va xabar animatsiyalari (Framer Motion)' },
          ].map(item => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontSize: 14, color: '#D4D4D8', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: 12.5, color: '#52525B', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{item.desc}</div>
              </div>
              <Toggle on={prefs[item.key] as boolean} onToggle={() => set(item.key, !(prefs[item.key] as boolean))} />
            </div>
          ))}

          <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: 12.5, color: '#52525B', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: '#A1A1AA' }}>Eslatma:</strong> Animatsiyalarni o&apos;chirish sahifani tezlashtiradi va pil quvvatini tejaydi. Framer Motion animatsiyalari CSS transition: 0ms ga o&apos;tkaziladi.
            </p>
          </div>
        </div>
      )}

      {/* Save bar */}
      <div style={{ display: 'flex', gap: 8, marginTop: 22, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={reset}
          style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717A', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          onMouseEnter={e => { (e.currentTarget.style.color = '#A1A1AA'); (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'); }}
          onMouseLeave={e => { (e.currentTarget.style.color = '#71717A'); (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'); }}
        >
          Standartga
        </button>
        <button
          onClick={apply}
          style={{
            flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: `linear-gradient(135deg, ${prefs.accent}, ${prefs.accent2})`,
            color: '#0A0A0B', fontSize: 13.5, fontWeight: 600, fontFamily: 'Inter, sans-serif',
            boxShadow: `0 2px 12px ${prefs.accent}40`,
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Saqlash
        </button>
      </div>
    </div>
  );
}
