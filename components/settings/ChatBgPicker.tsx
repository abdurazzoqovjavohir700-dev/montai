'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, X, RotateCcw, Check } from 'lucide-react';
import { toast } from '@/components/ui/Toast';

/* ─── Types ──────────────────────────────────────────────── */
export type BgMode = 'default' | 'solid' | 'gradient' | 'pattern' | 'image';

export interface ChatBg {
  mode: BgMode;
  value?: string;      // hex / gradient string / data URL / pattern id
  blur?: number;       // 0–20
  brightness?: number; // 0.4–1.6
  overlay?: number;    // 0–0.8 (dark overlay opacity)
}

const DEFAULT_BG: ChatBg = { mode: 'default', blur: 0, brightness: 1, overlay: 0 };

/* ─── Presets ────────────────────────────────────────────── */
const SOLID_COLORS = [
  '#0D0D0D', '#111113', '#18181B', '#1C1917', '#0C0A09',
  '#14141F', '#0F172A', '#042F2E', '#0A160C', '#1A0A14',
];

const GRADIENTS = [
  'linear-gradient(135deg,#0D0D0D 0%,#1A1A2E 100%)',
  'linear-gradient(135deg,#0D0D0D 0%,#1A0A00 100%)',
  'linear-gradient(135deg,#050505 0%,#0A1628 100%)',
  'linear-gradient(160deg,#0D0D0D 0%,#12002A 100%)',
  'linear-gradient(135deg,#0A0A0A 0%,#001A14 100%)',
  'linear-gradient(135deg,#111 0%,#1A1500 100%)',
  'linear-gradient(135deg,#0D0D0D 50%,#0F0A1E 100%)',
  'linear-gradient(to bottom,#0A0A0B,#0D1117)',
];

const PATTERNS: { id: string; label: string; css: string }[] = [
  {
    id: 'dots',
    label: 'Nuqtalar',
    css: `radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)`,
  },
  {
    id: 'grid',
    label: 'Panjara',
    css: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
  },
  {
    id: 'diagonal',
    label: 'Diagonal',
    css: `repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 20px)`,
  },
  {
    id: 'cross',
    label: 'Xoch',
    css: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)`,
  },
];

const PATTERN_SIZES: Record<string, string> = {
  dots: '24px 24px', grid: '32px 32px', diagonal: '20px 20px', cross: '20px 20px',
};

/* ─── Storage ────────────────────────────────────────────── */
const KEY = 'montai_chat_bg';

export function loadChatBg(): ChatBg {
  if (typeof window === 'undefined') return DEFAULT_BG;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BG;
    return JSON.parse(raw) as ChatBg;
  } catch { return DEFAULT_BG; }
}

function saveChatBg(bg: ChatBg) {
  localStorage.setItem(KEY, JSON.stringify(bg));
}

/* ─── Apply to DOM ───────────────────────────────────────── */
export function applyChatBg(bg: ChatBg) {
  const root = document.documentElement;
  const blur    = bg.blur    ?? 0;
  const bright  = bg.brightness ?? 1;
  const overlay = bg.overlay ?? 0;

  if (bg.mode === 'default') {
    root.style.removeProperty('--chat-bg-image');
    root.style.removeProperty('--chat-bg-color');
    root.style.removeProperty('--chat-bg-size');
    root.style.removeProperty('--chat-bg-filter');
    root.style.removeProperty('--chat-overlay');
    return;
  }

  const filter = `blur(${blur}px) brightness(${bright})`;
  root.style.setProperty('--chat-bg-filter', filter);
  root.style.setProperty('--chat-overlay', String(overlay));

  if (bg.mode === 'solid') {
    root.style.setProperty('--chat-bg-color', bg.value ?? '#111113');
    root.style.removeProperty('--chat-bg-image');
    root.style.removeProperty('--chat-bg-size');
  } else if (bg.mode === 'gradient') {
    root.style.setProperty('--chat-bg-image', bg.value ?? '');
    root.style.removeProperty('--chat-bg-color');
    root.style.removeProperty('--chat-bg-size');
  } else if (bg.mode === 'pattern') {
    const pat = PATTERNS.find(p => p.id === bg.value);
    if (pat) {
      root.style.setProperty('--chat-bg-image', pat.css);
      root.style.setProperty('--chat-bg-color', '#0D0D0D');
      root.style.setProperty('--chat-bg-size', PATTERN_SIZES[bg.value!] ?? '24px 24px');
    }
  } else if (bg.mode === 'image') {
    root.style.setProperty('--chat-bg-image', `url("${bg.value}")`);
    root.style.removeProperty('--chat-bg-color');
    root.style.setProperty('--chat-bg-size', 'cover');
  }
}

/* ─── Component ──────────────────────────────────────────── */
interface Props {
  onClose?: () => void;
}

export default function ChatBgPicker({ onClose }: Props) {
  const [bg, setBg]       = useState<ChatBg>(() => loadChatBg());
  const [reading, setReading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  /* Live preview on any change */
  useEffect(() => { applyChatBg(bg); }, [bg]);

  const set = useCallback(<K extends keyof ChatBg>(key: K, val: ChatBg[K]) => {
    setBg(prev => ({ ...prev, [key]: val }));
  }, []);

  const setMode = useCallback((mode: BgMode, value?: string) => {
    setBg(prev => ({ ...prev, mode, value }));
  }, []);

  const handleApply = () => {
    saveChatBg(bg);
    toast.success("Fon saqlandi");
    onClose?.();
  };

  const handleReset = () => {
    setBg(DEFAULT_BG);
    saveChatBg(DEFAULT_BG);
    applyChatBg(DEFAULT_BG);
    toast.info("Fon asliga qaytarildi");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/png','image/jpeg','image/jpg','image/webp'].includes(file.type)) {
      toast.error('Faqat PNG, JPG, WEBP qabul qilinadi'); return;
    }
    if (file.size > 5 * 1024 * 1024) { toast.error('Rasm 5MB dan kichik bo\'lishi kerak'); return; }
    setReading(true);
    const reader = new FileReader();
    reader.onload = ev => {
      setMode('image', ev.target?.result as string);
      setReading(false);
    };
    reader.onerror = () => { toast.error('Rasmni o\'qishda xatolik'); setReading(false); };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  /* ── Slider ──── */
  const Slider = ({ label, value, min, max, step, onChange }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 12.5, color: '#71717A', fontFamily: 'Inter, sans-serif' }}>{label}</span>
        <span style={{ fontSize: 12, color: '#A1A1AA', fontFamily: 'JetBrains Mono, monospace' }}>{value.toFixed(2)}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#F59E0B', cursor: 'pointer', height: 4 }}
      />
    </div>
  );

  /* ── Mini preview ── */
  const MiniPreview = ({ mode, value, selected, onClick }: {
    mode: BgMode; value?: string; selected: boolean; onClick: () => void; children?: React.ReactNode;
  }) => (
    <button
      onClick={onClick}
      style={{
        width: '100%', aspectRatio: '16/9', borderRadius: 8, border: 'none', cursor: 'pointer', overflow: 'hidden', position: 'relative',
        outline: selected ? '2px solid #F59E0B' : '2px solid transparent', transition: 'outline 0.15s',
        background:
          mode === 'solid'    ? (value ?? '#111113') :
          mode === 'gradient' ? 'transparent' :
          mode === 'default'  ? '#0D0D0D' : '#0D0D0D',
      }}
    >
      {mode === 'gradient' && <div style={{ position: 'absolute', inset: 0, backgroundImage: value, backgroundSize: 'cover' }} />}
      {mode === 'pattern' && (() => {
        const pat = PATTERNS.find(p => p.id === value);
        return pat ? <div style={{ position: 'absolute', inset: 0, background: '#0D0D0D' }}><div style={{ position: 'absolute', inset: 0, backgroundImage: pat.css, backgroundSize: PATTERN_SIZES[value!] }} /></div> : null;
      })()}
      {mode === 'image' && value && <img src={value} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}
      {mode === 'default' && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 18 }}>🎬</span></div>}
      {selected && (
        <div style={{ position: 'absolute', top: 4, right: 4, width: 18, height: 18, borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Check size={10} strokeWidth={2.5} style={{ color: '#0A0A0B' }} />
        </div>
      )}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        {(['default','solid','gradient','pattern','image'] as BgMode[]).map(m => (
          <button
            key={m}
            onClick={() => setBg(prev => ({ ...prev, mode: m, value: m === 'default' ? undefined : prev.value }))}
            style={{
              padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 500, border: 'none',
              background: bg.mode === m ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)',
              outline: bg.mode === m ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
              color: bg.mode === m ? '#F59E0B' : '#71717A', cursor: 'pointer',
              fontFamily: 'Inter, sans-serif', transition: 'all 0.12s', textTransform: 'capitalize',
            }}
          >
            {m === 'default' ? 'Standart' : m === 'solid' ? 'Rang' : m === 'gradient' ? 'Gradient' : m === 'pattern' ? 'Naqsh' : 'Rasm'}
          </button>
        ))}
      </div>

      {/* Mode content */}
      {bg.mode === 'default' && (
        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center', marginBottom: 16 }}>
          <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>🎬</span>
          <p style={{ fontSize: 13, color: '#52525B', fontFamily: 'Inter, sans-serif', margin: 0 }}>
            Standart qorong'u fon. Chat toza va professional ko'rinadi.
          </p>
        </div>
      )}

      {bg.mode === 'solid' && (
        <div style={{ marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#52525B', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>Rang tanlang</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {SOLID_COLORS.map(c => (
              <button
                key={c}
                onClick={() => set('value', c)}
                style={{
                  width: 36, height: 36, borderRadius: 8, background: c, border: 'none', cursor: 'pointer',
                  outline: bg.value === c ? '2px solid #F59E0B' : '2px solid transparent', transition: 'outline 0.12s',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontSize: 12.5, color: '#71717A', fontFamily: 'Inter, sans-serif', flexShrink: 0 }}>Boshqa rang:</label>
            <input
              type="color"
              value={bg.value ?? '#111113'}
              onChange={e => set('value', e.target.value)}
              style={{ width: 36, height: 32, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: 'transparent' }}
            />
          </div>
        </div>
      )}

      {bg.mode === 'gradient' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 16 }}>
          {GRADIENTS.map((g, i) => (
            <MiniPreview key={i} mode="gradient" value={g} selected={bg.value === g} onClick={() => set('value', g)} />
          ))}
        </div>
      )}

      {bg.mode === 'pattern' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
          {PATTERNS.map(p => (
            <div key={p.id}>
              <MiniPreview mode="pattern" value={p.id} selected={bg.value === p.id} onClick={() => set('value', p.id)} />
              <p style={{ fontSize: 11, color: '#52525B', textAlign: 'center', marginTop: 4, fontFamily: 'Inter, sans-serif' }}>{p.label}</p>
            </div>
          ))}
        </div>
      )}

      {bg.mode === 'image' && (
        <div style={{ marginBottom: 16 }}>
          {bg.value ? (
            <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={bg.value} alt="Background" style={{ width: '100%', height: 120, objectFit: 'cover', display: 'block' }} />
              <button
                onClick={() => set('value', undefined)}
                style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={reading}
              style={{
                width: '100%', padding: '20px 0', borderRadius: 10, border: '1px dashed rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.03)', color: '#71717A', cursor: reading ? 'default' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                fontFamily: 'Inter, sans-serif', fontSize: 13, marginBottom: 10,
              }}
            >
              <Upload size={20} strokeWidth={1.5} style={{ color: '#52525B' }} />
              {reading ? 'O\'qilmoqda…' : 'Rasm yuklash (PNG, JPG, WEBP · max 5MB)'}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleImageUpload} className="hidden" />
          {!bg.value && <p style={{ fontSize: 11.5, color: '#3F3F46', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>Rasmingiz faqat brauzeringizda saqlanadi — serverga yuklanmaydi</p>}
        </div>
      )}

      {/* Adjustments (only when mode !== default) */}
      {bg.mode !== 'default' && (
        <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: '#52525B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 14, fontFamily: 'Inter, sans-serif' }}>Sozlash</p>
          <Slider label="Xiralash (blur)" value={bg.blur ?? 0} min={0} max={20} step={0.5} onChange={v => set('blur', v)} />
          <Slider label="Yorqinlik" value={bg.brightness ?? 1} min={0.4} max={1.6} step={0.05} onChange={v => set('brightness', v)} />
          <Slider label="Qorayish (overlay)" value={bg.overlay ?? 0} min={0} max={0.8} step={0.02} onChange={v => set('overlay', v)} />
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={handleReset}
          style={{ padding: '9px 16px', borderRadius: 9, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#71717A', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => { (e.currentTarget.style.color = '#A1A1AA'); (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'); }}
          onMouseLeave={e => { (e.currentTarget.style.color = '#71717A'); (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'); }}
        >
          <RotateCcw size={13} strokeWidth={1.5} /> Aslga qaytarish
        </button>
        <button
          onClick={handleApply}
          style={{ flex: 1, padding: '9px 0', borderRadius: 9, border: 'none', background: 'linear-gradient(135deg, #F59E0B, #F97316)', color: '#0A0A0B', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif', boxShadow: '0 2px 12px rgba(245,158,11,0.3)' }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          Saqlash va qo&apos;llash
        </button>
      </div>
    </div>
  );
}
