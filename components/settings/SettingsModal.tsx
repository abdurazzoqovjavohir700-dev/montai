'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from '@/components/ui/Toast';
import {
  Settings, User, Film, Palette, Shield, Download, LogOut, Trash2, Check, X,
  Bell, BarChart2, Keyboard, Info, ChevronRight, Zap, Globe, Moon, ImageIcon,
} from 'lucide-react';
import ChatBgPicker from './ChatBgPicker';
import { LANGUAGES, SOFTWARE_OPTIONS, FOCUS_AREAS, EXPERIENCE_LEVELS } from '@/lib/constants';
import type { User as UserType, Language } from '@/lib/types';

const AVATAR_OPTIONS = ['🎬', '✂️', '🎨', '🔊', '📹', '🎞️', '🎭', '🎪', '🎥', '🏆', '🎯', '⚡'];

const TABS = [
  { group: 'Asosiy',  items: [
    { id: 'general',    label: 'Umumiy',       icon: <Settings  size={15} strokeWidth={1.5} /> },
    { id: 'profile',    label: 'Profil',        icon: <User      size={15} strokeWidth={1.5} /> },
    { id: 'appearance', label: "Ko'rinish",     icon: <Palette   size={15} strokeWidth={1.5} /> },
    { id: 'language',   label: 'Til',           icon: <Globe     size={15} strokeWidth={1.5} /> },
  ]},
  { group: 'AI',      items: [
    { id: 'editing',   label: 'Montaj & AI',    icon: <Film      size={15} strokeWidth={1.5} /> },
    { id: 'chatbg',    label: 'Chat foni',      icon: <ImageIcon size={15} strokeWidth={1.5} /> },
    { id: 'notifs',   label: 'Bildirishnomalar',icon: <Bell      size={15} strokeWidth={1.5} /> },
  ]},
  { group: "Ma'lumot",items: [
    { id: 'usage',     label: 'Statistika',     icon: <BarChart2 size={15} strokeWidth={1.5} /> },
    { id: 'shortcuts', label: 'Klaviatura',     icon: <Keyboard  size={15} strokeWidth={1.5} /> },
    { id: 'about',     label: 'Haqida',         icon: <Info      size={15} strokeWidth={1.5} /> },
  ]},
  { group: 'Xavfsizlik', items: [
    { id: 'account',   label: 'Akkaunt',        icon: <Shield    size={15} strokeWidth={1.5} /> },
  ]},
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [tab, setTab]     = useState('general');
  const [user, setUser]   = useState<UserType | null>(null);
  const [form, setForm]   = useState({
    nickname: '', avatar: '🎬', language: 'en' as Language,
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    primarySoftware: [] as string[], focusAreas: [] as string[],
    skillGoal: '', fontSize: 'md' as 'sm' | 'md' | 'lg',
  });
  const [saving,        setSaving]        = useState(false);
  const [exporting,     setExporting]     = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [chatCount,     setChatCount]     = useState<number | null>(null);
  const [notifPerm,     setNotifPerm]     = useState<NotificationPermission>('default');
  const [autocorrect,   setAutocorrect]   = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('autocorrectEnabled') === 'true' : false
  );

  /* Load user + stats on open */
  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/user').then(r => r.json() as Promise<UserType>).then(d => {
      setUser(d);
      setForm({
        nickname: d.nickname, avatar: d.avatar, language: d.language as Language,
        experienceLevel: d.experienceLevel, primarySoftware: d.primarySoftware,
        focusAreas: d.focusAreas, skillGoal: d.skillGoal, fontSize: d.fontSize,
      });
    }).catch(() => {});
    fetch('/api/chat/history').then(r => r.json() as Promise<{ chats: { id: string }[] }>).then(d => {
      setChatCount(d.chats?.length ?? 0);
    }).catch(() => {});
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotifPerm(Notification.permission);
    }
  }, [isOpen]);

  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  const toggle = (field: 'primarySoftware' | 'focusAreas', item: string) =>
    setForm(p => ({
      ...p, [field]: p[field].includes(item)
        ? p[field].filter(i => i !== item)
        : [...p[field], item],
    }));

  const save = async () => {
    if (!form.nickname.trim()) { toast.error('Nickname kerak'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("Sozlamalar saqlandi");
    } catch { toast.error('Saqlashda xatolik'); }
    finally { setSaving(false); }
  };

  const exportData = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/user/export');
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `montai-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
    } catch { toast.error('Eksport muvaffaqiyatsiz'); }
    finally { setExporting(false); }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      await fetch('/api/user/delete', { method: 'DELETE' });
      await signOut({ redirect: false });
      window.location.href = '/';
    } catch { toast.error("O'chirishda xatolik"); setDeleting(false); }
  };

  const requestNotif = async () => {
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPerm(perm);
    if (perm === 'granted') toast.success("Bildirishnomalar yoqildi");
    else toast.error("Brauzer bildirishnomalarini rad etdi");
  };

  const SaveBtn = useCallback(() => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 8 }}>
      <button onClick={save} disabled={saving} style={{
        padding: '9px 22px', background: saving ? '#3F3F46' : 'linear-gradient(135deg, #F59E0B, #F97316)',
        color: saving ? '#71717A' : '#0A0A0B', border: 'none', borderRadius: 9,
        fontSize: 13.5, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer',
        fontFamily: 'Inter, sans-serif', transition: 'opacity 0.15s',
        boxShadow: saving ? 'none' : '0 2px 12px rgba(245,158,11,0.3)',
      }}>
        {saving ? 'Saqlanmoqda…' : 'Saqlash'}
      </button>
    </div>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ), [saving, form]);

  if (!isOpen) return null;

  /* ── Shared UI pieces ───────────────────────────────────── */
  const Label = ({ children }: { children: string }) => (
    <label style={{ fontSize: 11, color: '#52525B', marginBottom: 10, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif' }}>
      {children}
    </label>
  );

  const Row = ({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <div style={{ fontSize: 14, color: '#D4D4D8', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 12.5, color: '#52525B', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{desc}</div>}
      </div>
      {right}
    </div>
  );

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} style={{
      width: 42, height: 23, borderRadius: 12, flexShrink: 0,
      background: on ? 'linear-gradient(135deg, #F59E0B, #F97316)' : '#3F3F46',
      border: 'none', cursor: 'pointer', position: 'relative', boxShadow: on ? '0 0 10px rgba(245,158,11,0.25)' : 'none',
      transition: 'background 0.2s, box-shadow 0.2s',
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#FAFAFA',
        position: 'absolute', top: 2.5, left: on ? 21.5 : 2.5, transition: 'left 0.18s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );

  const Chip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: selected ? 600 : 400,
      background: selected ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${selected ? '#F59E0B' : 'rgba(255,255,255,0.08)'}`,
      color: selected ? '#F59E0B' : '#A1A1AA',
      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
      display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s',
    }}>
      {selected && <Check size={10} strokeWidth={2} />}{label}
    </button>
  );

  /* ── Tabs content ───────────────────────────────────────── */
  const content: Record<string, React.ReactNode> = {

    general: (
      <div>
        <h2 style={titleStyle}>Umumiy</h2>
        <Row
          label="Avtomatik tuzatish"
          desc="Xato yozilgan so'zlarni avtomatik to'g'rilash"
          right={<Toggle on={autocorrect} onToggle={() => {
            const next = !autocorrect;
            setAutocorrect(next);
            localStorage.setItem('autocorrectEnabled', String(next));
          }} />}
        />
        <Row
          label="Streaming"
          desc="AI javobini yozilganda ko'rsatish"
          right={<span style={{ fontSize: 12, color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>Har doim yoqiq</span>}
        />
        <Row
          label="Markdown formatting"
          desc="AI javoblarida bold, code, list ko'rsatish"
          right={<span style={{ fontSize: 12, color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>Har doim yoqiq</span>}
        />
        <SaveBtn />
      </div>
    ),

    profile: (
      <div>
        <h2 style={titleStyle}>Profil</h2>
        <div style={{ marginBottom: 20 }}>
          <Label>Nickname</Label>
          <input
            value={form.nickname}
            onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
            maxLength={30}
            placeholder="Montai sizni nima deb chaqirsin?"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 20 }}>
          <Label>Avatar</Label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {AVATAR_OPTIONS.map(e => (
              <button key={e} onClick={() => setForm(p => ({ ...p, avatar: e }))} style={{
                width: 44, height: 44, borderRadius: 10, fontSize: 22, border: 'none',
                background: form.avatar === e ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                outline: form.avatar === e ? '2px solid #F59E0B' : '2px solid transparent',
                cursor: 'pointer', transition: 'all 0.15s',
              }}>{e}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <Label>Tajriba darajasi</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            {EXPERIENCE_LEVELS.map(l => (
              <button key={l.value} onClick={() => setForm(p => ({ ...p, experienceLevel: l.value as typeof form.experienceLevel }))} style={{
                flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                background: form.experienceLevel === l.value ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                outline: form.experienceLevel === l.value ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                color: form.experienceLevel === l.value ? '#F59E0B' : '#A1A1AA',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>{l.label}</button>
            ))}
          </div>
        </div>
        {user && (
          <div style={{ padding: '13px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 20 }}>
            <div style={{ fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>Ulangan email</div>
            <div style={{ fontSize: 14, color: '#A1A1AA', fontFamily: 'Inter, sans-serif' }}>{user.email}</div>
          </div>
        )}
        <SaveBtn />
      </div>
    ),

    appearance: (
      <div>
        <h2 style={titleStyle}>Ko&apos;rinish</h2>
        <div style={{ marginBottom: 24 }}>
          <Label>Shrift hajmi</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            {([{ v: 'sm', l: 'Kichik', px: ['13px','16px'] }, { v: 'md', l: "O'rta", px: ['15px','18px'] }, { v: 'lg', l: 'Katta', px: ['17px','20px'] }] as const).map(s => (
              <button key={s.v} onClick={() => {
                setForm(p => ({ ...p, fontSize: s.v }));
                document.documentElement.style.setProperty('--font-size-body', s.px[0]);
                document.documentElement.style.setProperty('--font-size-heading', s.px[1]);
              }} style={{
                flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                background: form.fontSize === s.v ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                outline: form.fontSize === s.v ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
                color: form.fontSize === s.v ? '#F59E0B' : '#A1A1AA',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>{s.l}</button>
            ))}
          </div>
        </div>
        <Row
          label="Tema"
          desc="Montai faqat qorong'u temada ishlaydi"
          right={<div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Moon size={14} strokeWidth={1.5} style={{ color: '#F59E0B' }} /><span style={{ fontSize: 13, color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>Dark</span></div>}
        />
        <Row
          label="Animatsiyalar"
          desc="Framer Motion animatsiyalari"
          right={<span style={{ fontSize: 12, color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>Yoqiq</span>}
        />
        <Row
          label="Anti-aliasing"
          desc="Silliq shrift ko'rinishi"
          right={<span style={{ fontSize: 12, color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>Yoqiq</span>}
        />
        <SaveBtn />
      </div>
    ),

    language: (
      <div>
        <h2 style={titleStyle}>Til sozlamalari</h2>
        <p style={{ fontSize: 13.5, color: '#71717A', fontFamily: 'Inter, sans-serif', marginBottom: 20, lineHeight: 1.6 }}>
          Tanlagan tilingizda AI javob beradi. Har qanday tilda yozsa bo&apos;ladi, AI o&apos;sha tilda javob qaytaradi.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {LANGUAGES.map(lang => (
            <button key={lang.value} onClick={() => setForm(p => ({ ...p, language: lang.value }))} style={{
              padding: '12px 14px', borderRadius: 10, border: 'none', textAlign: 'left',
              background: form.language === lang.value ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
              outline: form.language === lang.value ? '1px solid #F59E0B' : '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              transition: 'all 0.15s',
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: form.language === lang.value ? '#F59E0B' : '#D4D4D8', fontFamily: 'Inter, sans-serif' }}>{lang.nativeLabel}</div>
                <div style={{ fontSize: 11.5, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>{lang.label}</div>
              </div>
              {form.language === lang.value && <Check size={14} strokeWidth={2} style={{ color: '#F59E0B', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
        <SaveBtn />
      </div>
    ),

    editing: (
      <div>
        <h2 style={titleStyle}>Montaj & AI sozlamalari</h2>
        <div style={{ marginBottom: 24 }}>
          <Label>Asosiy dastur</Label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SOFTWARE_OPTIONS.map(sw => <Chip key={sw} label={sw} selected={form.primarySoftware.includes(sw)} onClick={() => toggle('primarySoftware', sw)} />)}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <Label>Yo&apos;nalishlar</Label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {FOCUS_AREAS.map(a => <Chip key={a} label={a} selected={form.focusAreas.includes(a)} onClick={() => toggle('focusAreas', a)} />)}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <Label>Shaxsiy maqsad</Label>
          <textarea
            value={form.skillGoal}
            onChange={e => setForm(p => ({ ...p, skillGoal: e.target.value }))}
            placeholder="Masalan: YouTube uchun cinematic montaj o'rganmoqchiman…"
            maxLength={500}
            rows={3}
            style={{ ...inputStyle, resize: 'none' as const }}
          />
        </div>
        <div style={{ padding: '13px 16px', background: 'rgba(245,158,11,0.05)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.15)', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Zap size={13} strokeWidth={1.5} style={{ color: '#F59E0B' }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#F59E0B', fontFamily: 'Inter, sans-serif' }}>AI modeli</span>
          </div>
          <p style={{ fontSize: 12.5, color: '#71717A', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.5 }}>
            Matn: <strong style={{ color: '#A1A1AA' }}>Llama 3.3 70B Versatile</strong> · Rasm: <strong style={{ color: '#A1A1AA' }}>Llama 3.2 90B Vision</strong>
          </p>
        </div>
        <SaveBtn />
      </div>
    ),

    chatbg: (
      <div>
        <h2 style={titleStyle}>Chat foni</h2>
        <p style={{ fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif', marginBottom: 20, lineHeight: 1.6 }}>
          Chat sahifasining fonini o&apos;zgartiring. O&apos;zgarishlar darhol ko&apos;rinadi. Faqat sizning brauzeringizda saqlanadi.
        </p>
        <ChatBgPicker onClose={onClose} />
      </div>
    ),

    notifs: (
      <div>
        <h2 style={titleStyle}>Bildirishnomalar</h2>
        <Row
          label="AI bildiroshna"
          desc="AI javob berganda (boshqa tabda bo'lsangiz)"
          right={
            notifPerm === 'granted'
              ? <span style={{ fontSize: 12, color: '#22C55E', fontFamily: 'Inter, sans-serif' }}>Yoqiq ✓</span>
              : notifPerm === 'denied'
              ? <span style={{ fontSize: 12, color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>Bloklangan</span>
              : <button onClick={requestNotif} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #F59E0B', background: 'rgba(245,158,11,0.1)', color: '#F59E0B', fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Yoqish</button>
          }
        />
        {notifPerm === 'denied' && (
          <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.07)', borderRadius: 9, border: '1px solid rgba(239,68,68,0.2)', marginTop: 12 }}>
            <p style={{ fontSize: 13, color: '#EF4444', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.5 }}>
              Brauzer bildirishnomalari bloklangan. Brauzering sozlamalarida montai.vercel.app uchun ruxsat bering.
            </p>
          </div>
        )}
        <Row label="Email bildiroshna" desc="Yangiliklar va xavfsizlik xabarlari" right={<span style={{ fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>Tez kunda</span>} />
        <Row label="Mahsulot yangiliklari" desc="Yangi funksiyalar haqida xabar olish" right={<span style={{ fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>Tez kunda</span>} />
      </div>
    ),

    usage: (
      <div>
        <h2 style={titleStyle}>Statistika</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Jami chatlar', value: chatCount !== null ? String(chatCount) : '…', color: '#F59E0B' },
            { label: 'Soatlik limit', value: '30', color: '#60A5FA' },
            { label: 'AI modeli',  value: 'Llama 3.3', color: '#22C55E' },
            { label: 'Tarif',      value: 'Bepul', color: '#A78BFA' },
          ].map(s => (
            <div key={s.label} style={{ padding: '18px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: s.color, fontFamily: 'Sora, sans-serif', letterSpacing: '-1px', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '16px 18px', background: 'rgba(245,158,11,0.05)', borderRadius: 12, border: '1px solid rgba(245,158,11,0.15)' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#F59E0B', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>Bepul tarif</div>
          <p style={{ fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.6 }}>
            Soatiga 30 ta xabar · Rasm yuklash · Barcha AI imkoniyatlar · Chat tarixi saqlanadi
          </p>
        </div>
      </div>
    ),

    shortcuts: (
      <div>
        <h2 style={titleStyle}>Klaviatura yorliqlari</h2>
        {[
          ['Enter', 'Xabar yuborish'],
          ['Shift + Enter', 'Yangi qator'],
          ['Escape', 'Sozlamalarni yopish'],
          ['Ctrl/⌘ + V', "Rasmni joylash (paste)"],
          ['Ctrl/⌘ + C', 'Nusxalash'],
          ['Click on message', 'Xabarni tahrirlash'],
          ['Double-click image', 'Lightbox zoom toggle'],
          ['Scroll on lightbox', 'Zoom'],
        ].map(([key, action]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif' }}>{action}</span>
            <code style={{ fontSize: 11.5, color: '#F59E0B', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 5, padding: '3px 8px', fontFamily: 'JetBrains Mono, monospace' }}>{key}</code>
          </div>
        ))}
      </div>
    ),

    about: (
      <div>
        <h2 style={titleStyle}>Haqida</h2>
        <div style={{ padding: '20px 22px', background: 'rgba(245,158,11,0.05)', borderRadius: 14, border: '1px solid rgba(245,158,11,0.15)', marginBottom: 24, textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎬</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#FAFAFA', fontFamily: 'Sora, sans-serif', letterSpacing: '-0.5px', marginBottom: 4 }}>Montai</div>
          <div style={{ fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>AI Video Editing Mentor · v1.0</div>
        </div>
        {[
          { label: 'AI Engine', value: 'Groq · Llama 3.3 70B' },
          { label: 'Framework', value: 'Next.js 15 · TypeScript' },
          { label: 'Database', value: 'Supabase · PostgreSQL' },
          { label: 'Hosting', value: 'Vercel Edge Network' },
          { label: 'Auth', value: 'NextAuth.js' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif' }}>{label}</span>
            <span style={{ fontSize: 13, color: '#A1A1AA', fontFamily: 'JetBrains Mono, monospace' }}>{value}</span>
          </div>
        ))}
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <a href="/privacy" style={{ flex: 1, padding: '9px 0', textAlign: 'center', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', color: '#A1A1AA', textDecoration: 'none', fontSize: 13, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            Privacy <ChevronRight size={12} />
          </a>
          <a href="/terms" style={{ flex: 1, padding: '9px 0', textAlign: 'center', borderRadius: 9, border: '1px solid rgba(255,255,255,0.08)', color: '#A1A1AA', textDecoration: 'none', fontSize: 13, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            Terms <ChevronRight size={12} />
          </a>
        </div>
      </div>
    ),

    account: (
      <div>
        <h2 style={titleStyle}>Akkaunt va xavfsizlik</h2>
        {user && (
          <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 11, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #F97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: '#0A0A0B', flexShrink: 0 }}>
                {user.nickname.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>{user.nickname}</div>
                <div style={{ fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>{user.email}</div>
              </div>
              <div style={{ marginLeft: 'auto', padding: '3px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 11.5, color: '#22C55E', fontFamily: 'Inter, sans-serif' }}>
                Faol
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
          <button onClick={exportData} disabled={exporting} style={actionBtnStyle}>
            <Download size={14} strokeWidth={1.5} />
            {exporting ? 'Eksport qilinmoqda…' : "Ma'lumotlarni eksport qilish (JSON)"}
          </button>
          <button onClick={() => signOut({ callbackUrl: '/' })} style={actionBtnStyle}>
            <LogOut size={14} strokeWidth={1.5} />
            Chiqish
          </button>
        </div>
        <div style={{ borderTop: '1px solid rgba(239,68,68,0.15)', paddingTop: 20 }}>
          <p style={{ fontSize: 12.5, color: '#71717A', fontFamily: 'Inter, sans-serif', marginBottom: 12, lineHeight: 1.5 }}>
            Xavfli zona. Akkauntni o&apos;chirish barcha chatlar, xabarlar va ma&apos;lumotlarni butunlay yo&apos;q qiladi.
          </p>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} style={{ ...actionBtnStyle, borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}>
              <Trash2 size={14} strokeWidth={1.5} />
              Akkauntni o&apos;chirish
            </button>
          ) : (
            <div style={{ padding: '16px', background: 'rgba(239,68,68,0.06)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.25)' }}>
              <p style={{ fontSize: 14, color: '#EF4444', fontWeight: 600, margin: '0 0 6px', fontFamily: 'Inter, sans-serif' }}>Rostdan ham o&apos;chirasizmi?</p>
              <p style={{ fontSize: 12.5, color: '#A0A0A0', margin: '0 0 14px', fontFamily: 'Inter, sans-serif' }}>Bu amalni qaytarib bo&apos;lmaydi.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={deleteAccount} disabled={deleting} style={{ padding: '8px 16px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {deleting ? "O'chirilmoqda…" : "Ha, o'chirish"}
                </button>
                <button onClick={() => setDeleteConfirm(false)} style={{ padding: '8px 14px', background: 'transparent', color: '#A0A0A0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  Bekor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    ),
  };

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(6px)', padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#111113', borderRadius: 16, width: '100%', maxWidth: 820, height: '80vh', maxHeight: 620, display: 'flex', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 24px 80px rgba(0,0,0,0.65)' }}
      >
        {/* Sidebar */}
        <div style={{ width: 210, borderRight: '1px solid rgba(255,255,255,0.06)', padding: '12px 8px', display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px 14px' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>Sozlamalar</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 5, lineHeight: 0 }}
              onMouseEnter={e => (e.currentTarget.style.color = '#A1A1AA')} onMouseLeave={e => (e.currentTarget.style.color = '#52525B')}>
              <X size={15} strokeWidth={1.5} />
            </button>
          </div>
          {TABS.map(group => (
            <div key={group.group} style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 10.5, color: '#3F3F46', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '0 10px', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
                {group.group}
              </p>
              {group.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '8px 10px', borderRadius: 8, width: '100%', border: 'none',
                    background: tab === item.id ? 'rgba(245,158,11,0.1)' : 'transparent',
                    color: tab === item.id ? '#F59E0B' : '#71717A',
                    fontSize: 13.5, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    fontWeight: tab === item.id ? 500 : 400, textAlign: 'left',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { if (tab !== item.id) { (e.currentTarget.style.background = 'rgba(255,255,255,0.04)'); (e.currentTarget.style.color = '#A1A1AA'); } }}
                  onMouseLeave={e => { if (tab !== item.id) { (e.currentTarget.style.background = 'transparent'); (e.currentTarget.style.color = '#71717A'); } }}
                >
                  {item.icon} {item.label}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          {content[tab] ?? null}
        </div>
      </div>
    </div>
  );
}

/* ── Shared styles ─────────────────────────────────────────── */
const titleStyle: React.CSSProperties = {
  fontSize: 17, fontWeight: 600, color: '#FAFAFA', margin: '0 0 22px',
  fontFamily: 'Inter, sans-serif', letterSpacing: '-0.3px',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 9, color: '#FAFAFA', fontSize: 14, outline: 'none',
  fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s',
};

const actionBtnStyle: React.CSSProperties = {
  padding: '10px 14px', background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9,
  color: '#A1A1AA', fontSize: 13.5, cursor: 'pointer',
  textAlign: 'left', fontFamily: 'Inter, sans-serif',
  display: 'flex', alignItems: 'center', gap: 10,
  width: '100%', transition: 'background 0.15s, border-color 0.15s',
};
