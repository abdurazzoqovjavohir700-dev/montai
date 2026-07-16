'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import {
  ArrowLeft, Download, Trash2, LogOut, Save, Check,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Logo from '@/components/shared/Logo';
import { LANGUAGES, SOFTWARE_OPTIONS, FOCUS_AREAS, EXPERIENCE_LEVELS } from '@/lib/constants';
import type { User, Language } from '@/lib/types';

const AVATAR_OPTIONS = ['🎬', '✂️', '🎨', '🔊', '📹', '🎞️', '🎭', '🎪', '🎥', '🏆'];

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
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
  const fontSizeMap = {
    sm: { body: '13px', heading: '16px' },
    md: { body: '15px', heading: '18px' },
    lg: { body: '17px', heading: '20px' },
  };

  const applyFontSize = (size: 'sm' | 'md' | 'lg') => {
    document.documentElement.style.setProperty('--font-size-body', fontSizeMap[size].body);
    document.documentElement.style.setProperty('--font-size-heading', fontSizeMap[size].heading);
  };

  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then((r) => {
        if (r.status === 401) { router.push('/'); return null; }
        return r.json() as Promise<User>;
      })
      .then((data) => {
        if (!data) return;
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
        applyFontSize(data.fontSize as 'sm' | 'md' | 'lg');
      })
      .catch(() => router.push('/'));
  }, [router]);

  const toggleItem = (field: 'primarySoftware' | 'focusAreas', item: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter((i) => i !== item)
        : [...prev[field], item],
    }));
  };

  const handleSave = async () => {
    if (!form.nickname.trim()) { toast.error('Nickname is required'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Save failed');
      toast.success('Settings saved!');
    } catch {
      toast.error('Failed to save settings');
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
      toast.success('Data exported!');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetch('/api/user/delete', { method: 'DELETE' });
      await signOut({ redirect: false });
      router.push('/');
      toast.success('Account deleted');
    } catch {
      toast.error('Delete failed');
      setDeleting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="flex gap-1.5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    );
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6 space-y-5">{children}</div>
    </div>
  );

  const ChipButton = ({
    label, selected, onClick,
  }: { label: string; selected: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
        selected
          ? 'border-[var(--accent-primary)] bg-[rgba(245,158,11,0.1)] text-[var(--accent-primary)]'
          : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
      }`}
    >
      {selected && <Check size={10} className="inline mr-1" />}
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-6 py-4 flex items-center justify-between border-b border-[var(--border-subtle)]"
        style={{ background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center gap-3">
          <Link href="/chat" className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <Logo size="sm" />
        </div>
        <Button size="sm" onClick={handleSave} loading={saving} icon={<Save size={14} />}>
          Save Changes
        </Button>
      </header>

      {/* Content */}
      <main className="w-full max-w-3xl mx-auto px-4 py-8 space-y-5" style={{ marginLeft: 'auto', marginRight: 'auto' }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Profile Section */}
          <Section title="Profile">
            {/* Avatar */}
            <div>
              <label className="block text-sm text-[var(--text-secondary)] mb-2">Avatar</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setForm((p) => ({ ...p, avatar: emoji }))}
                    className={`w-10 h-10 text-xl rounded-lg border transition-all ${
                      form.avatar === emoji
                        ? 'border-[var(--accent-primary)] bg-[rgba(245,158,11,0.1)] scale-110'
                        : 'border-[var(--border-subtle)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <Input
              label="Nickname"
              value={form.nickname}
              onChange={(e) => setForm((p) => ({ ...p, nickname: e.target.value }))}
              maxLength={30}
              placeholder="How should Montai call you?"
            />

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Language</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => setForm((p) => ({ ...p, language: lang.value }))}
                    className={`px-3 py-2 rounded-lg border text-sm text-left transition-all ${
                      form.language === lang.value
                        ? 'border-[var(--accent-primary)] bg-[rgba(245,158,11,0.08)] text-[var(--accent-primary)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    <span className="block font-medium text-xs">{lang.nativeLabel}</span>
                    <span className="block text-[10px] opacity-60">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Experience Level</label>
              <div className="flex gap-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => setForm((p) => ({ ...p, experienceLevel: level.value as typeof form.experienceLevel }))}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      form.experienceLevel === level.value
                        ? 'border-[var(--accent-primary)] bg-[rgba(245,158,11,0.08)] text-[var(--accent-primary)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Editing Preferences */}
          <Section title="Editing Preferences">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Primary Software</label>
              <div className="flex flex-wrap gap-2">
                {SOFTWARE_OPTIONS.map((sw) => (
                  <ChipButton
                    key={sw}
                    label={sw}
                    selected={form.primarySoftware.includes(sw)}
                    onClick={() => toggleItem('primarySoftware', sw)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Focus Areas</label>
              <div className="flex flex-wrap gap-2">
                {FOCUS_AREAS.map((area) => (
                  <ChipButton
                    key={area}
                    label={area}
                    selected={form.focusAreas.includes(area)}
                    onClick={() => toggleItem('focusAreas', area)}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Skill Goal</label>
              <textarea
                value={form.skillGoal}
                onChange={(e) => setForm((p) => ({ ...p, skillGoal: e.target.value }))}
                placeholder="e.g. I want to master color grading for cinematic YouTube videos..."
                maxLength={500}
                rows={3}
                className="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] px-3.5 py-2.5 text-sm resize-none input-focus-glow"
              />
            </div>
          </Section>

          {/* Appearance */}
          <Section title="Appearance">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Font Size</label>
              <div className="flex gap-2">
                {(['sm', 'md', 'lg'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => { setForm((p) => ({ ...p, fontSize: size })); applyFontSize(size); }}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-all ${
                      form.fontSize === size
                        ? 'border-[var(--accent-primary)] bg-[rgba(245,158,11,0.08)] text-[var(--accent-primary)]'
                        : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                    }`}
                  >
                    {size === 'sm' ? 'Small' : size === 'md' ? 'Medium' : 'Large'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
              <span className="text-sm text-[var(--text-secondary)]">Theme</span>
              <span className="text-xs text-[var(--text-tertiary)] flex items-center gap-1.5">
                🌙 Dark (Brand Default)
              </span>
            </div>
          </Section>

          {/* Account */}
          <Section title="Account">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{user.email}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">Connected account</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={handleExport}
                loading={exporting}
                icon={<Download size={14} />}
                className="justify-start"
              >
                Export My Data (JSON)
              </Button>

              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => signOut({ callbackUrl: '/' })}
                icon={<LogOut size={14} />}
                className="justify-start"
              >
                Sign Out
              </Button>

              {!deleteConfirm ? (
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={() => setDeleteConfirm(true)}
                  icon={<Trash2 size={14} />}
                  className="justify-start"
                >
                  Delete Account
                </Button>
              ) : (
                <div className="p-4 rounded-xl border border-[var(--error)] bg-[rgba(239,68,68,0.05)] space-y-3">
                  <p className="text-sm text-[var(--error)] font-medium">⚠️ Delete account permanently?</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    This will permanently delete your account, all chats, and all data. This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deleting}
                      onClick={handleDelete}
                    >
                      Yes, Delete Everything
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Section>
        </motion.div>
      </main>
    </div>
  );
}
