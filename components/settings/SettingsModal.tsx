'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { toast } from '@/components/ui/Toast';
import {
  Settings, User, Film, Palette, Shield, Download, LogOut, Trash2, Check, X,
  Bell, BarChart2, Keyboard, Info, ChevronRight, Zap, Globe, ImageIcon,
  Search, Upload, Undo2, RotateCcw, Eye, Moon, Wifi, ChevronLeft,
} from 'lucide-react';
import ChatBgPicker from './ChatBgPicker';
import ThemeSystem from './ThemeSystem';
import { LANGUAGES, SOFTWARE_OPTIONS, FOCUS_AREAS, EXPERIENCE_LEVELS } from '@/lib/constants';
import type { User as UserType, Language } from '@/lib/types';

const AVATAR_OPTIONS = ['M', 'V', 'E', 'A', 'C', 'D', 'P', 'R', 'J', 'K', 'S', 'T'];

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  group: string;
  keywords: string[];
}

const CATEGORIES: Category[] = [
  // Asosiy
  { id: 'general',    label: 'Umumiy',          icon: <Settings  size={15} strokeWidth={1.5} />, group: 'Asosiy',     desc: 'Streaming, autocorrect, formatlar', keywords: ['umumiy','general','stream','autocorrect','format','markdown'] },
  { id: 'profile',    label: 'Profil',           icon: <User      size={15} strokeWidth={1.5} />, group: 'Asosiy',     desc: 'Nickname, avatar, tajriba', keywords: ['profil','profile','nickname','avatar','ism','tajriba'] },
  { id: 'language',   label: 'Til',              icon: <Globe     size={15} strokeWidth={1.5} />, group: 'Asosiy',     desc: 'Interfeys va AI tili', keywords: ['til','language','uzbek','russian','english','tarjima'] },
  // Ko'rinish
  { id: 'themes',     label: "Ko'rinish",        icon: <Palette   size={15} strokeWidth={1.5} />, group: "Ko'rinish",  desc: 'Mavzu, rang, shrift', keywords: ["ko'rinish",'mavzu','theme','rang','dark','light','shrift','font'] },
  { id: 'chatbg',     label: 'Chat foni',        icon: <ImageIcon size={15} strokeWidth={1.5} />, group: "Ko'rinish",  desc: 'Rasm, gradient, naqsh fon', keywords: ['fon','wallpaper','rasm','gradient','background','cover'] },
  { id: 'accessibility', label: 'Accessibility', icon: <Eye       size={15} strokeWidth={1.5} />, group: "Ko'rinish",  desc: 'Shrift kattaligi, kontrast', keywords: ['accessibility','shrift','font size','kontrast','accessibility'] },
  // AI
  { id: 'editing',    label: 'AI & Montaj',      icon: <Film      size={15} strokeWidth={1.5} />, group: 'AI',         desc: 'AI sozlamalari, dasturlar, maqsad', keywords: ['ai','montaj','editing','model','software','davinci','premiere'] },
  { id: 'memory',     label: "AI xotira",        icon: <Zap       size={15} strokeWidth={1.5} />, group: 'AI',         desc: 'Kontekst, chat tarixi', keywords: ['memory','xotira','context','tarix','history'] },
  // Tizim
  { id: 'notifs',     label: 'Bildirishnomalar', icon: <Bell      size={15} strokeWidth={1.5} />, group: 'Tizim',      desc: 'Push, email bildirishnomalar', keywords: ['notif','bildirishnoma','push','email','alert'] },
  { id: 'privacy',    label: 'Maxfiylik',        icon: <Shield    size={15} strokeWidth={1.5} />, group: 'Tizim',      desc: 'Data siyosati, cookie', keywords: ['maxfiylik','privacy','data','cookie','gdpr'] },
  { id: 'shortcuts',  label: 'Klaviatura',       icon: <Keyboard  size={15} strokeWidth={1.5} />, group: 'Tizim',      desc: 'Barcha keyboard shortcutlar', keywords: ['klaviatura','shortcut','keyboard','hotkey','ctrl','cmd'] },
  // Akkaunt
  { id: 'usage',      label: 'Statistika',       icon: <BarChart2 size={15} strokeWidth={1.5} />, group: 'Akkaunt',    desc: 'Chat soni, API foydalanish', keywords: ['stat','statistika','usage','chat','limit','tarif'] },
  { id: 'account',    label: 'Akkaunt',          icon: <Shield    size={15} strokeWidth={1.5} />, group: 'Akkaunt',    desc: 'Export, o\'chirish, chiqish', keywords: ['akkaunt','account','delete','export','signout','chiqish','xavfsizlik'] },
  { id: 'about',      label: 'Haqida',           icon: <Info      size={15} strokeWidth={1.5} />, group: 'Akkaunt',    desc: 'Versiya, yaratuvchi, litsenziya', keywords: ['haqida','about','version','creator','jvh','montai'] },
];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // Persist last active tab across modal opens
  const [tab, setTabState] = useState(() => {
    if (typeof localStorage !== 'undefined') return localStorage.getItem('settings_last_tab') ?? 'general';
    return 'general';
  });
  const setTab = useCallback((id: string) => {
    setTabState(id);
    localStorage.setItem('settings_last_tab', id);
  }, []);

  const [searchQ, setSearchQ] = useState('');
  const [user, setUser]       = useState<UserType | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // mobile: true = pill nav visible, false = content visible
  const [showSidebar, setShowSidebar] = useState(true);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const mobile = w < 768;
      setIsMobile(mobile);
      if (!mobile) setShowSidebar(true); // desktop always shows sidebar
      // on mobile, showSidebar starts true (pill nav) — user controls it
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const [form, setForm] = useState({
    nickname: '', avatar: 'M', language: 'en' as Language,
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    primarySoftware: [] as string[], focusAreas: [] as string[],
    skillGoal: '', fontSize: 'md' as 'sm' | 'md' | 'lg',
  });
  const [savedForm, setSavedForm] = useState(form);
  const [saving,        setSaving]        = useState(false);
  const [exporting,     setExporting]     = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [chatCount,     setChatCount]     = useState<number | null>(null);
  const [notifPerm,     setNotifPerm]     = useState<NotificationPermission>('default');
  const [autocorrect,   setAutocorrect]   = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('autocorrectEnabled') === 'true' : false
  );

  const hasUnsaved = useMemo(() => JSON.stringify(form) !== JSON.stringify(savedForm), [form, savedForm]);

  useEffect(() => {
    if (!isOpen) return;
    setSearchQ('');
    // Reset to pill nav on mobile every time settings opens
    if (isMobile) setShowSidebar(true);
    fetch('/api/user').then(r => r.json() as Promise<UserType>).then(d => {
      setUser(d);
      const f = {
        nickname: d.nickname, avatar: d.avatar, language: d.language as Language,
        experienceLevel: d.experienceLevel, primarySoftware: d.primarySoftware,
        focusAreas: d.focusAreas, skillGoal: d.skillGoal, fontSize: d.fontSize,
      };
      setForm(f);
      setSavedForm(f);
    }).catch(() => {});
    fetch('/api/chat/history').then(r => r.json() as Promise<{ chats: { id: string }[] }>).then(d => {
      setChatCount(d.chats?.length ?? 0);
    }).catch(() => {});
    if (typeof window !== 'undefined' && 'Notification' in window) setNotifPerm(Notification.permission);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); searchRef.current?.focus(); }
    };
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
      setSavedForm(form);
      setSavedAt(Date.now());
      toast.success("Sozlamalar saqlandi");
    } catch { toast.error('Saqlashda xatolik'); }
    finally { setSaving(false); }
  };

  const undoChanges = () => {
    setForm(savedForm);
    toast.info("O'zgarishlar bekor qilindi");
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

  const importSettings = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.nickname) setForm(prev => ({ ...prev, nickname: data.nickname ?? prev.nickname, avatar: data.avatar ?? prev.avatar, language: data.language ?? prev.language, experienceLevel: data.experienceLevel ?? prev.experienceLevel, primarySoftware: data.primarySoftware ?? prev.primarySoftware, focusAreas: data.focusAreas ?? prev.focusAreas, skillGoal: data.skillGoal ?? prev.skillGoal }));
        toast.success("Sozlamalar import qilindi — Saqla tugmasini bosing");
      } catch { toast.error("Fayl o'qishda xatolik"); }
    };
    reader.readAsText(file);
    e.target.value = '';
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
    else toast.error("Brauzer bildirishnomalarni rad etdi");
  };

  // Search filtering
  const filteredCats = useMemo(() => {
    const q = searchQ.toLowerCase().trim();
    if (!q) return CATEGORIES;
    return CATEGORIES.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.desc.toLowerCase().includes(q) ||
      c.keywords.some(k => k.includes(q))
    );
  }, [searchQ]);

  const groupedFiltered = useMemo(() => {
    const groups: Record<string, Category[]> = {};
    filteredCats.forEach(c => { (groups[c.group] = groups[c.group] ?? []).push(c); });
    return groups;
  }, [filteredCats]);

  if (!isOpen) return null;

  /* ── Shared UI ─────────────────────────────────── */
  const Label = ({ children }: { children: string }) => (
    <label style={{ fontSize: 11, color: '#52525B', marginBottom: 10, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'Inter, sans-serif' }}>
      {children}
    </label>
  );

  const Row = ({ label, desc, right }: { label: string; desc?: string; right: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '13px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        <div style={{ fontSize: 13.5, color: '#D4D4D8', fontFamily: 'Inter, sans-serif', fontWeight: 500 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{desc}</div>}
      </div>
      {right}
    </div>
  );

  const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
    <button onClick={onToggle} style={{ width: 40, height: 22, borderRadius: 11, flexShrink: 0, background: on ? 'rgba(96,165,250,0.85)' : 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', position: 'relative', boxShadow: on ? '0 0 12px rgba(96,165,250,0.3)' : 'none', transition: 'background 0.2s, box-shadow 0.2s', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: 17, height: 17, borderRadius: '50%', background: '#FFFFFF', position: 'absolute', top: 2.5, left: on ? 20.5 : 2.5, transition: 'left 0.18s cubic-bezier(0.16,1,0.3,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.4)' }} />
    </button>
  );

  const Chip = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ padding: '5px 11px', borderRadius: 20, fontSize: 12, fontWeight: selected ? 600 : 400, background: selected ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selected ? '#60A5FA' : 'rgba(255,255,255,0.08)'}`, color: selected ? '#60A5FA' : '#A1A1AA', cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
      {selected && <Check size={9} strokeWidth={2.5} />}{label}
    </button>
  );

  const SaveBar = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {hasUnsaved && (
          <button onClick={undoChanges} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#71717A', fontSize: 12.5, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
            <Undo2 size={12} strokeWidth={1.5} /> Bekor
          </button>
        )}
        {savedAt && !hasUnsaved && (
          <span style={{ fontSize: 12, color: '#22C55E', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Check size={11} strokeWidth={2} /> Saqlandi
          </span>
        )}
      </div>
      <button onClick={save} disabled={saving || !hasUnsaved} style={{
        padding: '8px 20px',
        background: hasUnsaved ? '#FFFFFF' : 'rgba(255,255,255,0.05)',
        color: hasUnsaved ? '#0A0A0B' : '#3F3F46',
        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
        cursor: hasUnsaved ? 'pointer' : 'not-allowed',
        fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
        boxShadow: hasUnsaved ? '0 2px 10px rgba(96,165,250,0.2)' : 'none',
      }}>
        {saving ? 'Saqlanmoqda…' : 'Saqlash'}
      </button>
    </div>
  );

  /* ── Tab Contents ──────────────────────────────── */
  const contents: Record<string, React.ReactNode> = {

    general: (
      <div>
        <SectionTitle title="Umumiy sozlamalar" desc="Streaming, autocorrect va format sozlamalari" />
        <Row label="Avtomatik tuzatish" desc="Xato yozilgan so'zlarni avtomatik to'g'rilash"
          right={<Toggle on={autocorrect} onToggle={() => { const n = !autocorrect; setAutocorrect(n); localStorage.setItem('autocorrectEnabled', String(n)); }} />}
        />
        <Row label="Streaming javob" desc="AI javobini yozilganda real-time ko'rsatish"
          right={<Badge text="Har doim yoqiq" color="#60A5FA" />}
        />
        <Row label="Markdown ko'rsatish" desc="Bold, code, list, headers formatlar"
          right={<Badge text="Har doim yoqiq" color="#60A5FA" />}
        />
        <Row label="Chat tarixi" desc="Barcha suhbatlar serverda saqlanadi"
          right={<Badge text="Yoqiq" color="#22C55E" />}
        />
        <SaveBar />
      </div>
    ),

    profile: (
      <div>
        <SectionTitle title="Profil" desc="Shaxsiy ma'lumotlar, avatar va tajriba darajasi" />
        <div style={{ marginBottom: 18 }}>
          <Label>Nickname</Label>
          <input value={form.nickname} onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))} maxLength={30}
            placeholder="Montai sizni nima deb chaqirsin?" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <Label>Avatar</Label>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {AVATAR_OPTIONS.map(e => (
              <button key={e} onClick={() => setForm(p => ({ ...p, avatar: e }))} style={{ width: 42, height: 42, borderRadius: 9, fontSize: 20, border: 'none', background: form.avatar === e ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.04)', outline: form.avatar === e ? '2px solid #60A5FA' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.15s' }}>{e}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <Label>Tajriba darajasi</Label>
          <div style={{ display: 'flex', gap: 7 }}>
            {EXPERIENCE_LEVELS.map(l => (
              <button key={l.value} onClick={() => setForm(p => ({ ...p, experienceLevel: l.value as typeof form.experienceLevel }))} style={{ flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', background: form.experienceLevel === l.value ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.04)', outline: form.experienceLevel === l.value ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)', color: form.experienceLevel === l.value ? '#60A5FA' : '#A1A1AA', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
        {user && (
          <div style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: 9, border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 }}>
            <div style={{ fontSize: 11.5, color: '#52525B', fontFamily: 'Inter, sans-serif', marginBottom: 3 }}>Ulangan email</div>
            <div style={{ fontSize: 13.5, color: '#A1A1AA', fontFamily: 'Inter, sans-serif' }}>{user.email}</div>
          </div>
        )}
        <SaveBar />
      </div>
    ),

    language: (
      <div>
        <SectionTitle title="Til sozlamalari" desc="AI qaysi tilda javob bersin?" />
        <p style={{ fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif', marginBottom: 18, lineHeight: 1.6 }}>
          Tanlagan tilda AI javob beradi. Har qanday tilda yozsa bo&apos;ladi.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 7 }}>
          {LANGUAGES.map(lang => (
            <button key={lang.value} onClick={() => setForm(p => ({ ...p, language: lang.value }))} style={{ padding: '11px 13px', borderRadius: 9, border: 'none', textAlign: 'left', background: form.language === lang.value ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.04)', outline: form.language === lang.value ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.15s' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: form.language === lang.value ? '#60A5FA' : '#D4D4D8', fontFamily: 'Inter, sans-serif' }}>{lang.nativeLabel}</div>
                <div style={{ fontSize: 11, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>{lang.label}</div>
              </div>
              {form.language === lang.value && <Check size={13} strokeWidth={2} style={{ color: '#60A5FA', flexShrink: 0 }} />}
            </button>
          ))}
        </div>
        <SaveBar />
      </div>
    ),

    themes: (
      <div>
        <SectionTitle title="Ko'rinish va mavzu" desc="Rang sxemasi, shrift, interfeys" />
        <ThemeSystem />
      </div>
    ),

    chatbg: (
      <div>
        <SectionTitle title="Chat foni" desc="Wallpaper, gradient yoki rang fon" />
        <p style={{ fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif', marginBottom: 18, lineHeight: 1.6 }}>
          Faqat sizning brauzeringizda saqlanadi — serverga yuklanmaydi.
        </p>
        <ChatBgPicker onClose={onClose} />
      </div>
    ),

    accessibility: (
      <div>
        <SectionTitle title="Accessibility" desc="Shrift kattaligi va ko'rinish sozlamalari" />
        <div style={{ marginBottom: 18 }}>
          <Label>Shrift kattaligi</Label>
          <div style={{ display: 'flex', gap: 7 }}>
            {(['sm','md','lg'] as const).map(s => (
              <button key={s} onClick={() => setForm(p => ({ ...p, fontSize: s }))} style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: form.fontSize === s ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.04)', outline: form.fontSize === s ? '1px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)', color: form.fontSize === s ? '#60A5FA' : '#A1A1AA', fontSize: s === 'sm' ? 11 : s === 'md' ? 13 : 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                {s === 'sm' ? 'Kichik' : s === 'md' ? "O'rta" : 'Katta'}
              </button>
            ))}
          </div>
        </div>
        <SaveBar />
      </div>
    ),

    editing: (
      <div>
        <SectionTitle title="AI & Montaj sozlamalari" desc="Asosiy dastur, yo'nalish va maqsad" />
        <div style={{ marginBottom: 22 }}>
          <Label>Asosiy dastur</Label>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {SOFTWARE_OPTIONS.map(sw => <Chip key={sw} label={sw} selected={form.primarySoftware.includes(sw)} onClick={() => toggle('primarySoftware', sw)} />)}
          </div>
        </div>
        <div style={{ marginBottom: 22 }}>
          <Label>Yo&apos;nalishlar</Label>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {FOCUS_AREAS.map(a => <Chip key={a} label={a} selected={form.focusAreas.includes(a)} onClick={() => toggle('focusAreas', a)} />)}
          </div>
        </div>
        <div style={{ marginBottom: 18 }}>
          <Label>Shaxsiy maqsad</Label>
          <textarea value={form.skillGoal} onChange={e => setForm(p => ({ ...p, skillGoal: e.target.value }))} placeholder="Masalan: YouTube uchun cinematic montaj o'rganmoqchiman…" maxLength={500} rows={3} style={{ ...inputStyle, resize: 'none' as const }} />
        </div>
        <div style={{ padding: '12px 14px', background: 'rgba(96,165,250,0.05)', borderRadius: 9, border: '1px solid rgba(96,165,250,0.12)', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <Zap size={13} strokeWidth={1.5} style={{ color: '#60A5FA' }} />
            <span style={{ fontSize: 12.5, fontWeight: 600, color: '#60A5FA', fontFamily: 'Inter, sans-serif' }}>Faol AI modeli</span>
          </div>
          <p style={{ fontSize: 12, color: '#71717A', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.5 }}>
            Matn: <strong style={{ color: '#A1A1AA' }}>Llama 3.3 70B</strong> · Rasm: <strong style={{ color: '#A1A1AA' }}>Llama 4 Scout 17B</strong> · Zaxira: <strong style={{ color: '#A1A1AA' }}>Gemma 2 9B</strong>
          </p>
        </div>
        <SaveBar />
      </div>
    ),

    memory: (
      <div>
        <SectionTitle title="AI xotira" desc="Kontekst va chat tarixi sozlamalari" />
        <Row label="Chat tarixi" desc="Barcha suhbatlar saqlanadi va davom ettiriladi" right={<Badge text="Yoqiq" color="#22C55E" />} />
        <Row label="Conversation kontekst" desc="AI oldingi xabarlarni hisobga oladi" right={<Badge text="Har doim" color="#60A5FA" />} />
      </div>
    ),

    notifs: (
      <div>
        <SectionTitle title="Bildirishnomalar" desc="Push va email xabarnomalar" />
        <Row label="AI javob bildiroshna" desc="AI javob berganda (boshqa tabda bo'lsangiz)"
          right={
            notifPerm === 'granted'
              ? <span style={{ fontSize: 12, color: '#22C55E', fontFamily: 'Inter, sans-serif' }}>Yoqiq</span>
              : notifPerm === 'denied'
              ? <span style={{ fontSize: 12, color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>Bloklangan</span>
              : <button onClick={requestNotif} style={{ padding: '5px 12px', borderRadius: 7, border: '1px solid #60A5FA', background: 'rgba(96,165,250,0.1)', color: '#60A5FA', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Yoqish</button>
          }
        />
        {notifPerm === 'denied' && (
          <div style={{ padding: '11px 13px', background: 'rgba(239,68,68,0.07)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', marginTop: 10, marginBottom: 8 }}>
            <p style={{ fontSize: 12.5, color: '#EF4444', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.5 }}>
              Brauzering bildirishnomalarni bloklagan. Brauzer sozlamalarida montai-plum.vercel.app uchun ruxsat bering.
            </p>
          </div>
        )}
      </div>
    ),

    privacy: (
      <div>
        <SectionTitle title="Maxfiylik" desc="Ma'lumot siyosati va cookie sozlamalari" />
        <Row label="Foydalanish tahlili" desc="Anonim statistika (ilovani yaxshilash uchun)" right={<Badge text="O'chirilgan" color="#52525B" />} />
        <Row label="Chat loglar" desc="Suhbatlar xavfsiz serverda shifrlangan holda saqlanadi" right={<Badge text="Shifrlangan" color="#22C55E" />} />
        <Row label="Rasm saqlash" desc="Yuklangan rasmlar xavfsiz serverda saqlanadi" right={<Badge text="Xavfsiz" color="#22C55E" />} />
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <a href="/privacy" style={{ flex: 1, padding: '9px 0', textAlign: 'center', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', color: '#A1A1AA', textDecoration: 'none', fontSize: 13, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            Maxfiylik siyosati <ChevronRight size={11} />
          </a>
          <a href="/terms" style={{ flex: 1, padding: '9px 0', textAlign: 'center', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', color: '#A1A1AA', textDecoration: 'none', fontSize: 13, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            Foydalanish shartlari <ChevronRight size={11} />
          </a>
        </div>
      </div>
    ),

    shortcuts: (
      <div>
        <SectionTitle title="Klaviatura yorliqlari" desc="Barcha keyboard shortcuts" />
        {[
          ['Enter',                   'Xabar yuborish'],
          ['Shift + Enter',           'Yangi qator'],
          ['Escape',                  'Modal yopish'],
          ['Ctrl / Cmd + K',          'Sozlamalar qidiruv'],
          ['Ctrl / Cmd + V',          "Rasmni joylash"],
          ['Click on message',        "Xabarni nusxalash"],
          ['Double-click image',      'Lightbox zoom toggle'],
          ['Scroll on lightbox',      'Zoom in/out'],
        ].map(([key, action]) => (
          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif' }}>{action}</span>
            <code style={{ fontSize: 11, color: '#60A5FA', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.15)', borderRadius: 5, padding: '3px 7px', fontFamily: 'JetBrains Mono, monospace' }}>{key}</code>
          </div>
        ))}
      </div>
    ),

    usage: (
      <div>
        <SectionTitle title="Statistika" desc="Foydalanish ma'lumotlari" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
          {[
            { label: 'Jami chatlar', value: chatCount !== null ? String(chatCount) : '…', color: '#60A5FA' },
            { label: 'Soatlik limit', value: '30',        color: '#60A5FA' },
            { label: 'AI modeli',     value: 'Llama 3.3', color: '#22C55E' },
            { label: 'Tarif',         value: 'Bepul',     color: '#A78BFA' },
          ].map(s => (
            <div key={s.label} style={{ padding: '16px 18px', background: 'rgba(255,255,255,0.04)', borderRadius: 11, border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--font-display, Manrope, sans-serif)', letterSpacing: '-0.5px', marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>{s.label}</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '14px 16px', background: 'rgba(96,165,250,0.05)', borderRadius: 10, border: '1px solid rgba(96,165,250,0.12)' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#60A5FA', fontFamily: 'Inter, sans-serif', marginBottom: 5 }}>Bepul tarif imkoniyatlari</div>
          <p style={{ fontSize: 12.5, color: '#71717A', fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.6 }}>
            Soatiga 30 ta xabar · Rasm yuklash va tahlil · Barcha AI imkoniyatlar · Chat tarixi · 13 ta til
          </p>
        </div>
      </div>
    ),

    account: (
      <div>
        <SectionTitle title="Akkaunt va xavfsizlik" desc="Ma'lumotlar, chiqish va o'chirish" />
        {user && (
          <div style={{ padding: '13px 15px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.07)', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#0A0A0B', flexShrink: 0 }}>
                {user.nickname.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>{user.nickname}</div>
                <div style={{ fontSize: 11.5, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>{user.email}</div>
              </div>
              <div style={{ marginLeft: 'auto', padding: '2px 9px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', fontSize: 11, color: '#22C55E', fontFamily: 'Inter, sans-serif' }}>Faol</div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 22 }}>
          <button onClick={exportData} disabled={exporting} style={actionBtnStyle}>
            <Download size={13} strokeWidth={1.5} />
            {exporting ? 'Eksport qilinmoqda…' : "Ma'lumotlarni eksport qilish (JSON)"}
          </button>
          <label style={{ ...actionBtnStyle, cursor: 'pointer' }}>
            <Upload size={13} strokeWidth={1.5} />
            Sozlamalarni import qilish (JSON)
            <input type="file" accept=".json" onChange={importSettings} style={{ display: 'none' }} />
          </label>
          <button onClick={() => signOut({ callbackUrl: '/' })} style={actionBtnStyle}>
            <LogOut size={13} strokeWidth={1.5} />
            Chiqish
          </button>
        </div>
        <div style={{ borderTop: '1px solid rgba(239,68,68,0.15)', paddingTop: 18 }}>
          <p style={{ fontSize: 12, color: '#71717A', fontFamily: 'Inter, sans-serif', marginBottom: 10, lineHeight: 1.5 }}>
            Xavfli zona. Akkauntni o&apos;chirish barcha chatlar va ma&apos;lumotlarni butunlay yo&apos;q qiladi.
          </p>
          {!deleteConfirm ? (
            <button onClick={() => setDeleteConfirm(true)} style={{ ...actionBtnStyle, borderColor: 'rgba(239,68,68,0.25)', color: '#EF4444' }}>
              <Trash2 size={13} strokeWidth={1.5} />
              Akkauntni o&apos;chirish
            </button>
          ) : (
            <div style={{ padding: '14px', background: 'rgba(239,68,68,0.06)', borderRadius: 9, border: '1px solid rgba(239,68,68,0.22)' }}>
              <p style={{ fontSize: 13.5, color: '#EF4444', fontWeight: 600, margin: '0 0 5px', fontFamily: 'Inter, sans-serif' }}>Rostdan ham o&apos;chirasizmi?</p>
              <p style={{ fontSize: 12, color: '#A0A0A0', margin: '0 0 12px', fontFamily: 'Inter, sans-serif' }}>Bu amalni qaytarib bo&apos;lmaydi.</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={deleteAccount} disabled={deleting} style={{ padding: '7px 14px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                  {deleting ? "O'chirilmoqda…" : "Ha, o'chirish"}
                </button>
                <button onClick={() => setDeleteConfirm(false)} style={{ padding: '7px 12px', background: 'transparent', color: '#A0A0A0', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 7, fontSize: 12.5, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Bekor</button>
              </div>
            </div>
          )}
        </div>
      </div>
    ),

    about: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* App identity */}
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '20px 20px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            marginBottom: 4,
          }}
        >
          <div style={{
            width: 46, height: 46, borderRadius: 13, flexShrink: 0,
            background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#FFFFFF',
            fontFamily: 'var(--font-display, Manrope, sans-serif)',
            boxShadow: '0 4px 16px rgba(96,165,250,0.2)',
          }}>M</div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#FAFAFA', fontFamily: 'var(--font-display, Manrope, sans-serif)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>Montai AI</div>
            <div style={{ fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>v1.0.0</div>
          </div>
        </motion.div>

        {/* Info rows */}
        {[
          { label: 'Yaratuvchi',       value: 'jvh'                         },
          { label: 'Missiya',          value: 'Professional video editing, color grading va ijodiy workflow\'larni AI orqali o\'rgatish' },
          { label: 'Platformalar',     value: 'Web · Android · Windows'     },
          { label: 'Tillar',           value: '13 ta til qo\'llab-quvvatlanadi'  },
          { label: 'Versiya',          value: 'v1.0.0'                      },
        ].map(({ label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.22 }}
            style={{
              display: 'flex', gap: 16, padding: '12px 20px',
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif', minWidth: 100, flexShrink: 0, lineHeight: 1.55, paddingTop: 1 }}>{label}</span>
            <span style={{ fontSize: 13, color: '#A1A1AA', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>{value}</span>
          </motion.div>
        ))}

        {/* Privacy section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.28 }}
          style={{
            margin: '14px 20px 0',
            padding: '14px 16px',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 11,
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, color: '#52525B', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>Maxfiylik</div>
          {[
            'Suhbatlaringiz shaxsiy va xavfsiz.',
            'Fayllar faqat siz so\'ragan xususiyatlar uchun qayta ishlanadi.',
            'Montai suhbatlaringizni ommaga oshkor etmaydi.',
          ].map((text, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: i < 2 ? 6 : 0 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3F3F46', marginTop: 6, flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#71717A', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>{text}</span>
            </div>
          ))}
        </motion.div>

        {/* Updates note */}
        <div style={{ padding: '12px 20px 4px', fontSize: 11.5, color: '#3F3F46', fontFamily: 'Inter, sans-serif', lineHeight: 1.55 }}>
          Ilova yangi AI imkoniyatlari, editing vositalari va ishlash yaxshilanishlari bilan doimiy takomillashtirilmoqda.
        </div>

        {/* Legal links */}
        <div style={{ display: 'flex', gap: 8, margin: '10px 20px 4px' }}>
          <a href="/privacy" style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', color: '#71717A', textDecoration: 'none', fontSize: 12, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            Maxfiylik <ChevronRight size={10} />
          </a>
          <a href="/terms" style={{ flex: 1, padding: '8px 0', textAlign: 'center', borderRadius: 8, border: '1px solid rgba(255,255,255,0.07)', color: '#71717A', textDecoration: 'none', fontSize: 12, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            Shartlar <ChevronRight size={10} />
          </a>
        </div>
      </div>
    ),
  };

  const activeCat = CATEGORIES.find(c => c.id === tab);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.72)',
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        padding: isMobile ? '0' : '20px',
        // iOS safe area: modal stays above home indicator
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom, 0px)' : '20px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#111113',
          borderRadius: isMobile ? '20px 20px 0 0' : 16,
          width: '100%',
          maxWidth: isMobile ? '100%' : 840,
          // Use dvh when available (excludes browser chrome on iOS), fall back to vh
          height: isMobile ? 'min(92dvh, 92vh)' : 'min(82dvh, 82vh)',
          maxHeight: isMobile ? 'min(92dvh, 92vh)' : 640,
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
          marginTop: isMobile ? 'auto' : undefined,
        }}
      >
        {/* ── LEFT SIDEBAR ── */}
        {(!isMobile || showSidebar) && (
          <div style={{ width: isMobile ? '100%' : 220, borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.06)', borderBottom: isMobile ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '16px 16px 12px' : '14px 14px 10px', flexShrink: 0 }}>
              <span style={{ fontSize: isMobile ? 17 : 15, fontWeight: 700, color: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>Sozlamalar</span>
              <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#71717A', cursor: 'pointer', padding: isMobile ? 8 : 6, borderRadius: 7, lineHeight: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#A1A1AA')} onMouseLeave={e => (e.currentTarget.style.color = '#71717A')}>
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            {/* Search */}
            <div style={{ padding: '0 10px 10px', flexShrink: 0 }}>
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52525B', pointerEvents: 'none' }} strokeWidth={1.5} />
                <input
                  ref={searchRef}
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Qidirish… (Ctrl+K)"
                  style={{ width: '100%', padding: '7px 10px 7px 30px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#D4D4D8', fontSize: 12.5, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Navigation */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
              {isMobile ? (
                /* Mobile: vertical list (easier to tap on phone) */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {Object.entries(groupedFiltered).map(([group, cats]) => (
                    <div key={group} style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 10, color: '#3F3F46', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 4px', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>{group}</p>
                      {cats.map(cat => (
                        <button key={cat.id} onClick={() => { setTab(cat.id); setShowSidebar(false); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '11px 12px', borderRadius: 10, border: 'none', background: tab === cat.id ? 'rgba(96,165,250,0.1)' : 'rgba(255,255,255,0.03)', color: tab === cat.id ? '#60A5FA' : '#D4D4D8', fontSize: 14, fontWeight: tab === cat.id ? 600 : 400, cursor: 'pointer', fontFamily: 'Inter, sans-serif', textAlign: 'left', marginBottom: 2 }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ opacity: tab === cat.id ? 1 : 0.6 }}>{cat.icon}</span>
                            {cat.label}
                          </span>
                          <ChevronRight size={14} strokeWidth={1.5} style={{ color: tab === cat.id ? '#60A5FA' : '#52525B', flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                /* Desktop: grouped list */
                Object.entries(groupedFiltered).map(([group, cats]) => (
                  <div key={group} style={{ marginBottom: 14 }}>
                    <p style={{ fontSize: 10, color: '#3F3F46', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 8px', marginBottom: 3, fontFamily: 'Inter, sans-serif' }}>
                      {group}
                    </p>
                    {cats.map(cat => (
                      <button key={cat.id} onClick={() => setTab(cat.id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 8, width: '100%', border: 'none', background: tab === cat.id ? 'rgba(96,165,250,0.1)' : 'transparent', color: tab === cat.id ? '#60A5FA' : '#71717A', fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: tab === cat.id ? 500 : 400, textAlign: 'left', transition: 'all 0.1s' }}
                        onMouseEnter={e => { if (tab !== cat.id) { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLButtonElement).style.color = '#A1A1AA'; } }}
                        onMouseLeave={e => { if (tab !== cat.id) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#71717A'; } }}
                      >
                        <span style={{ opacity: tab === cat.id ? 1 : 0.7, flexShrink: 0 }}>{cat.icon}</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.label}</span>
                        {tab === cat.id && <div style={{ width: 3, height: 14, borderRadius: 2, background: '#60A5FA', flexShrink: 0 }} />}
                      </button>
                    ))}
                  </div>
                ))
              )}
              {filteredCats.length === 0 && (
                <p style={{ fontSize: 12.5, color: '#3F3F46', textAlign: 'center', padding: '20px 0', fontFamily: 'Inter, sans-serif' }}>Hech narsa topilmadi</p>
              )}
            </div>
          </div>
        )}

        {/* ── RIGHT CONTENT PANEL ── */}
        {(!isMobile || !showSidebar) && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Content header (breadcrumb + back on mobile) */}
            {isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
                <button onClick={() => setShowSidebar(true)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#A1A1AA', cursor: 'pointer', padding: 6, borderRadius: 7, lineHeight: 0 }}>
                  <ChevronLeft size={15} strokeWidth={1.5} />
                </button>
                <span style={{ fontSize: 13.5, fontWeight: 600, color: '#D4D4D8', fontFamily: 'Inter, sans-serif' }}>{activeCat?.label ?? ''}</span>
              </div>
            )}

            {/* Scrollable content */}
            <div style={{ flex: 1, padding: isMobile ? '20px 16px' : '26px 30px', overflowY: 'auto' }}>
              {contents[tab]}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Small helper components ───────────────────── */
function SectionTitle({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#FAFAFA', margin: '0 0 4px', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.3px' }}>{title}</h2>
      <p style={{ fontSize: 12.5, color: '#52525B', margin: 0, fontFamily: 'Inter, sans-serif' }}>{desc}</p>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span style={{ fontSize: 11.5, color, fontFamily: 'Inter, sans-serif', padding: '2px 8px', borderRadius: 12, background: `${color}18`, border: `1px solid ${color}30` }}>{text}</span>;
}

/* ── Shared styles ─────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 8, color: '#FAFAFA', fontSize: 13.5, outline: 'none',
  fontFamily: 'Inter, sans-serif', transition: 'border-color 0.15s',
};

const actionBtnStyle: React.CSSProperties = {
  padding: '9px 13px', background: 'transparent',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
  color: '#A1A1AA', fontSize: 13, cursor: 'pointer',
  textAlign: 'left', fontFamily: 'Inter, sans-serif',
  display: 'flex', alignItems: 'center', gap: 9,
  width: '100%', transition: 'background 0.15s',
};
