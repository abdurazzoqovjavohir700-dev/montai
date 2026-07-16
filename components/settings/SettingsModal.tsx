'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { toast } from '@/components/ui/Toast';
import { Settings, User, Film, Palette, Shield, Download, LogOut, Trash2, Check, X } from 'lucide-react';
import { LANGUAGES, SOFTWARE_OPTIONS, FOCUS_AREAS, EXPERIENCE_LEVELS } from '@/lib/constants';
import type { User as UserType, Language } from '@/lib/types';

const AVATAR_OPTIONS = ['🎬', '✂️', '🎨', '🔊', '📹', '🎞️', '🎭', '🎪', '🎥', '🏆'];

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState('general');
  const [user, setUser] = useState<UserType | null>(null);
  const [form, setForm] = useState({
    nickname: '',
    avatar: '🎬',
    language: 'en' as Language,
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    primarySoftware: [] as string[],
    focusAreas: [] as string[],
    skillGoal: '',
    fontSize: 'md' as 'sm' | 'md' | 'lg',
  });
  const [saving, setSaving] = useState(false);
  const [autocorrectOn, setAutocorrectOn] = useState(() =>
    typeof localStorage !== 'undefined' ? localStorage.getItem('autocorrectEnabled') === 'true' : false
  );

  const toggleAutocorrect = () => {
    const next = !autocorrectOn;
    setAutocorrectOn(next);
    localStorage.setItem('autocorrectEnabled', String(next));
  };
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/user')
      .then(r => r.json() as Promise<UserType>)
      .then(data => {
        setUser(data);
        setForm({
          nickname: data.nickname,
          avatar: data.avatar,
          language: data.language as Language,
          experienceLevel: data.experienceLevel,
          primarySoftware: data.primarySoftware,
          focusAreas: data.focusAreas,
          skillGoal: data.skillGoal,
          fontSize: data.fontSize,
        });
      })
      .catch(() => {});
  }, [isOpen]);

  const toggleItem = (field: 'primarySoftware' | 'focusAreas', item: string) => {
    setForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleSave = async () => {
    if (!form.nickname.trim()) { toast.error('Nickname kerak'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success('Saqlandi!');
    } catch {
      toast.error('Saqlashda xatolik');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch('/api/user/export');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `montai-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export muvaffaqiyatsiz');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch('/api/user/delete', { method: 'DELETE' });
      await signOut({ redirect: false });
      window.location.href = '/';
    } catch {
      toast.error("O'chirishda xatolik");
      setDeleting(false);
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'Umumiy', icon: <Settings size={16} /> },
    { id: 'profile', label: 'Profil', icon: <User size={16} /> },
    { id: 'editing', label: 'Montaj', icon: <Film size={16} /> },
    { id: 'appearance', label: "Ko'rinish", icon: <Palette size={16} /> },
    { id: 'account', label: 'Akkaunt', icon: <Shield size={16} /> },
  ];

  const SaveBtn = () => (
    <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid #2D2D2D', marginTop: 8 }}>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: '9px 20px', background: '#F59E0B', color: '#0A0A0B',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
          cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {saving ? 'Saqlanmoqda...' : 'Saqlash'}
      </button>
    </div>
  );

  const SectionLabel = ({ children }: { children: string }) => (
    <label style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {children}
    </label>
  );

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1A1A1A', borderRadius: 16,
          width: '90%', maxWidth: 800,
          height: '80vh', maxHeight: 600,
          display: 'flex', overflow: 'hidden',
          border: '1px solid #2D2D2D',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Left sidebar */}
        <div style={{
          width: 220, borderRight: '1px solid #2D2D2D',
          padding: '16px 8px',
          display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '8px 12px 16px',
          }}>
            <span style={{ fontSize: 16, fontWeight: 600, color: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>Sozlamalar</span>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 4 }}
            >
              <X size={16} />
            </button>
          </div>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                background: activeTab === tab.id ? '#2F2F2F' : 'transparent',
                color: activeTab === tab.id ? '#FAFAFA' : '#A0A0A0',
                border: 'none', cursor: 'pointer',
                fontSize: 14, textAlign: 'left',
                transition: 'all 0.15s', width: '100%',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Right content */}
        <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>

          {activeTab === 'general' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#FAFAFA', marginBottom: 24, marginTop: 0, fontFamily: 'Inter, sans-serif' }}>Umumiy</h2>
              <div style={{ marginBottom: 24 }}>
                <SectionLabel>Til</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.value}
                      onClick={() => setForm(p => ({ ...p, language: lang.value }))}
                      style={{
                        padding: '8px 10px', borderRadius: 8,
                        background: form.language === lang.value ? 'rgba(245,158,11,0.1)' : '#0D0D0D',
                        border: `1px solid ${form.language === lang.value ? '#F59E0B' : '#2D2D2D'}`,
                        color: form.language === lang.value ? '#F59E0B' : '#A0A0A0',
                        fontSize: 12, cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>{lang.nativeLabel}</div>
                      <div style={{ fontSize: 11, opacity: 0.6 }}>{lang.label}</div>
                    </button>
                  ))}
                </div>
              </div>
              {/* Autocorrect toggle */}
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #2D2D2D' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, color: '#D4D4D8', fontFamily: 'Inter, sans-serif' }}>Avtomatik tuzatish</div>
                    <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Xato yozilgan so'zlarni avtomatik to'g'rilash</div>
                  </div>
                  <button
                    onClick={toggleAutocorrect}
                    style={{
                      width: 44, height: 24, borderRadius: 12, flexShrink: 0,
                      background: autocorrectOn ? '#F59E0B' : '#3F3F46',
                      border: 'none', cursor: 'pointer', position: 'relative',
                      transition: 'background 0.2s',
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', background: '#FAFAFA',
                      position: 'absolute', top: 2,
                      left: autocorrectOn ? 22 : 2,
                      transition: 'left 0.2s',
                    }} />
                  </button>
                </div>
              </div>

              <SaveBtn />
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#FAFAFA', marginBottom: 24, marginTop: 0, fontFamily: 'Inter, sans-serif' }}>Profil</h2>
              <div style={{ marginBottom: 20 }}>
                <SectionLabel>Nickname</SectionLabel>
                <input
                  value={form.nickname}
                  onChange={e => setForm(p => ({ ...p, nickname: e.target.value }))}
                  maxLength={30}
                  placeholder="Montai sizni nima deb chaqirsin?"
                  style={{
                    width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                    background: '#0D0D0D', border: '1px solid #2D2D2D',
                    borderRadius: 8, color: '#FAFAFA', fontSize: 14, outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <SectionLabel>Avatar</SectionLabel>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setForm(p => ({ ...p, avatar: emoji }))}
                      style={{
                        width: 44, height: 44, borderRadius: 10, fontSize: 22,
                        background: form.avatar === emoji ? 'rgba(245,158,11,0.1)' : '#0D0D0D',
                        border: `1px solid ${form.avatar === emoji ? '#F59E0B' : '#2D2D2D'}`,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}
                    >{emoji}</button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <SectionLabel>Tajriba darajasi</SectionLabel>
                <div style={{ display: 'flex', gap: 8 }}>
                  {EXPERIENCE_LEVELS.map(level => (
                    <button
                      key={level.value}
                      onClick={() => setForm(p => ({ ...p, experienceLevel: level.value as typeof form.experienceLevel }))}
                      style={{
                        flex: 1, padding: 10, borderRadius: 8,
                        background: form.experienceLevel === level.value ? 'rgba(245,158,11,0.1)' : '#0D0D0D',
                        border: `1px solid ${form.experienceLevel === level.value ? '#F59E0B' : '#2D2D2D'}`,
                        color: form.experienceLevel === level.value ? '#F59E0B' : '#A0A0A0',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}
                    >{level.label}</button>
                  ))}
                </div>
              </div>
              <SaveBtn />
            </div>
          )}

          {activeTab === 'editing' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#FAFAFA', marginBottom: 24, marginTop: 0, fontFamily: 'Inter, sans-serif' }}>Montaj sozlamalari</h2>
              <div style={{ marginBottom: 20 }}>
                <SectionLabel>Asosiy dastur</SectionLabel>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SOFTWARE_OPTIONS.map(sw => (
                    <button
                      key={sw}
                      onClick={() => toggleItem('primarySoftware', sw)}
                      style={{
                        padding: '7px 14px', borderRadius: 20, fontSize: 13,
                        background: form.primarySoftware.includes(sw) ? 'rgba(245,158,11,0.1)' : '#0D0D0D',
                        border: `1px solid ${form.primarySoftware.includes(sw) ? '#F59E0B' : '#2D2D2D'}`,
                        color: form.primarySoftware.includes(sw) ? '#F59E0B' : '#A0A0A0',
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {form.primarySoftware.includes(sw) && <Check size={10} />}
                      {sw}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <SectionLabel>Yo'nalishlar</SectionLabel>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {FOCUS_AREAS.map(area => (
                    <button
                      key={area}
                      onClick={() => toggleItem('focusAreas', area)}
                      style={{
                        padding: '7px 14px', borderRadius: 20, fontSize: 13,
                        background: form.focusAreas.includes(area) ? 'rgba(245,158,11,0.1)' : '#0D0D0D',
                        border: `1px solid ${form.focusAreas.includes(area) ? '#F59E0B' : '#2D2D2D'}`,
                        color: form.focusAreas.includes(area) ? '#F59E0B' : '#A0A0A0',
                        cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {form.focusAreas.includes(area) && <Check size={10} />}
                      {area}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <SectionLabel>Maqsad</SectionLabel>
                <textarea
                  value={form.skillGoal}
                  onChange={e => setForm(p => ({ ...p, skillGoal: e.target.value }))}
                  placeholder="Masalan: YouTube uchun cinematic montaj o'rganmoqchiman..."
                  maxLength={500}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                    background: '#0D0D0D', border: '1px solid #2D2D2D', borderRadius: 8,
                    color: '#FAFAFA', fontSize: 14, resize: 'none', outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                  }}
                />
              </div>
              <SaveBtn />
            </div>
          )}

          {activeTab === 'appearance' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#FAFAFA', marginBottom: 24, marginTop: 0, fontFamily: 'Inter, sans-serif' }}>Ko'rinish</h2>
              <div style={{ marginBottom: 24 }}>
                <SectionLabel>Shrift hajmi</SectionLabel>
                <div style={{ display: 'flex', gap: 8 }}>
                  {([
                    { value: 'sm', label: 'Kichik' },
                    { value: 'md', label: "O'rta" },
                    { value: 'lg', label: 'Katta' },
                  ] as const).map(size => (
                    <button
                      key={size.value}
                      onClick={() => {
                        setForm(p => ({ ...p, fontSize: size.value }));
                        const map = { sm: ['13px', '16px'], md: ['15px', '18px'], lg: ['17px', '20px'] } as const;
                        document.documentElement.style.setProperty('--font-size-body', map[size.value][0]);
                        document.documentElement.style.setProperty('--font-size-heading', map[size.value][1]);
                      }}
                      style={{
                        flex: 1, padding: 10, borderRadius: 8,
                        background: form.fontSize === size.value ? 'rgba(245,158,11,0.1)' : '#0D0D0D',
                        border: `1px solid ${form.fontSize === size.value ? '#F59E0B' : '#2D2D2D'}`,
                        color: form.fontSize === size.value ? '#F59E0B' : '#A0A0A0',
                        fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                      }}
                    >{size.label}</button>
                  ))}
                </div>
              </div>
              <div style={{
                padding: '14px 16px', background: '#0D0D0D', borderRadius: 8, border: '1px solid #2D2D2D',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <div style={{ fontSize: 14, color: '#D4D4D8', fontFamily: 'Inter, sans-serif' }}>Tema</div>
                  <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Qorong'u (standart)</div>
                </div>
                <span style={{ fontSize: 18 }}>🌙</span>
              </div>
              <SaveBtn />
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: '#FAFAFA', marginBottom: 24, marginTop: 0, fontFamily: 'Inter, sans-serif' }}>Akkaunt</h2>
              {user && (
                <div style={{
                  padding: 14, background: '#0D0D0D', borderRadius: 8,
                  border: '1px solid #2D2D2D', marginBottom: 20,
                }}>
                  <div style={{ fontSize: 14, color: '#FAFAFA', fontFamily: 'Inter, sans-serif' }}>{user.email}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', fontFamily: 'Inter, sans-serif' }}>Ulangan akkaunt</div>
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  style={{
                    padding: '10px 14px', background: 'transparent',
                    border: '1px solid #2D2D2D', borderRadius: 8,
                    color: '#D4D4D8', fontSize: 14, cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 8,
                    opacity: exporting ? 0.7 : 1,
                  }}
                >
                  <Download size={15} />
                  {exporting ? 'Eksport qilinmoqda...' : "Ma'lumotlarni eksport qilish"}
                </button>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  style={{
                    padding: '10px 14px', background: 'transparent',
                    border: '1px solid #2D2D2D', borderRadius: 8,
                    color: '#D4D4D8', fontSize: 14, cursor: 'pointer',
                    textAlign: 'left', fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <LogOut size={15} />
                  Chiqish
                </button>
                {!deleteConfirm ? (
                  <button
                    onClick={() => setDeleteConfirm(true)}
                    style={{
                      padding: '10px 14px', background: 'transparent',
                      border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                      color: '#EF4444', fontSize: 14, cursor: 'pointer',
                      textAlign: 'left', fontFamily: 'Inter, sans-serif',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}
                  >
                    <Trash2 size={15} />
                    Akkauntni o&apos;chirish
                  </button>
                ) : (
                  <div style={{ padding: 14, background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8 }}>
                    <p style={{ fontSize: 13, color: '#EF4444', fontWeight: 600, margin: '0 0 6px', fontFamily: 'Inter, sans-serif' }}>Akkauntni butunlay o&apos;chiramizmi?</p>
                    <p style={{ fontSize: 12, color: '#A0A0A0', margin: '0 0 12px', fontFamily: 'Inter, sans-serif' }}>Barcha chatlar va ma&apos;lumotlar o&apos;chiriladi. Bu amalni qaytarib bo&apos;lmaydi.</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{ padding: '8px 14px', background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                      >
                        {deleting ? "O'chirilmoqda..." : "Ha, o'chirish"}
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(false)}
                        style={{ padding: '8px 14px', background: 'transparent', color: '#A0A0A0', border: '1px solid #2D2D2D', borderRadius: 6, fontSize: 13, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
                      >
                        Bekor qilish
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
