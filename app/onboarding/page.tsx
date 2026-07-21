'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { toast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LANGUAGES, SOFTWARE_OPTIONS, EXPERIENCE_LEVELS } from '@/lib/constants';
import type { Language } from '@/lib/types';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    nickname: '',
    experienceLevel: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    primarySoftware: [] as string[],
    language: 'en' as Language,
  });

  useEffect(() => {
    fetch('/api/user')
      .then((r) => r.json() as Promise<{ onboardingCompleted?: boolean }>)
      .then((user) => {
        if (user?.onboardingCompleted) router.replace('/chat');
      })
      .catch(() => router.push('/'));
  }, [router]);

  const toggleSoftware = (sw: string) => {
    setData((prev) => ({
      ...prev,
      primarySoftware: prev.primarySoftware.includes(sw)
        ? prev.primarySoftware.filter((s) => s !== sw)
        : [...prev.primarySoftware, sw],
    }));
  };

  const handleSubmit = async () => {
    if (!data.nickname.trim()) {
      toast.error('Please enter a nickname');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: data.nickname.trim(),
          experienceLevel: data.experienceLevel,
          primarySoftware: data.primarySoftware,
          language: data.language,
          onboardingCompleted: true,
        }),
      });

      if (!res.ok) throw new Error('Failed to save');
      router.push('/chat');
    } catch {
      toast.error('Failed to save preferences. Please try again.');
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "What should we call you?",
      subtitle: "Your nickname for a personalized experience",
      content: (
        <div className="space-y-3">
          <Input
            placeholder="e.g. Alex, Editor, Filmmaker..."
            value={data.nickname}
            onChange={(e) => setData((p) => ({ ...p, nickname: e.target.value }))}
            autoFocus
            maxLength={30}
            onKeyDown={(e) => e.key === 'Enter' && data.nickname.trim() && setStep(1)}
          />
          <p className="text-xs text-[var(--text-tertiary)]">
            {data.nickname.length}/30
          </p>
        </div>
      ),
      canProceed: data.nickname.trim().length > 0,
    },
    {
      title: "Your editing experience?",
      subtitle: "Montai adapts its teaching to your skill level",
      content: (
        <div className="space-y-2.5">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setData((p) => ({ ...p, experienceLevel: level.value as typeof data.experienceLevel }))}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-150 ${
                data.experienceLevel === level.value
                  ? 'border-[var(--accent-primary)] bg-[rgba(96,165,250,0.06)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] hover:border-[rgba(96,165,250,0.3)]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  data.experienceLevel === level.value
                    ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]'
                    : 'border-[var(--border-subtle)]'
                }`}
              >
                {data.experienceLevel === level.value && <Check size={10} className="text-black" />}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{level.label}</p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{level.description}</p>
              </div>
            </button>
          ))}
        </div>
      ),
      canProceed: true,
    },
    {
      title: "Primary editing software?",
      subtitle: "Get software-specific shortcuts and tips",
      content: (
        <div className="grid grid-cols-2 gap-2">
          {SOFTWARE_OPTIONS.map((sw) => {
            const selected = data.primarySoftware.includes(sw);
            return (
              <button
                key={sw}
                onClick={() => toggleSoftware(sw)}
                className={`px-3 py-3 rounded-xl border text-sm font-medium text-left transition-all duration-150 ${
                  selected
                    ? 'border-[var(--accent-primary)] bg-[rgba(96,165,250,0.08)] text-[var(--accent-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[rgba(96,165,250,0.3)]'
                }`}
              >
                {selected && <Check size={12} className="inline mr-1.5 mb-0.5" />}
                {sw}
              </button>
            );
          })}
        </div>
      ),
      canProceed: true,
    },
    {
      title: "Preferred language?",
      subtitle: "Montai will teach you in your language",
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => {
            const selected = data.language === lang.value;
            return (
              <button
                key={lang.value}
                onClick={() => setData((p) => ({ ...p, language: lang.value }))}
                className={`px-3 py-3 rounded-xl border text-sm text-left transition-all duration-150 ${
                  selected
                    ? 'border-[var(--accent-primary)] bg-[rgba(96,165,250,0.08)] text-[var(--accent-primary)] font-semibold'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[rgba(96,165,250,0.3)]'
                }`}
              >
                <span className="block font-semibold">{lang.nativeLabel}</span>
                <span className="block text-[11px] opacity-60 mt-0.5">{lang.label}</span>
              </button>
            );
          })}
        </div>
      ),
      canProceed: true,
    },
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-primary)] px-4 py-12">
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-10 flex flex-col items-center gap-2"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-[#0A0A0B]"
          style={{
            background: 'linear-gradient(135deg, #60A5FA, #3B82F6)',
            boxShadow: '0 8px 24px rgba(96,165,250,0.2)',
            fontFamily: 'var(--font-display, Manrope, sans-serif)',
          }}
        >
          M
        </div>
        <span className="text-sm font-semibold text-[var(--text-tertiary)] tracking-wide">MONTAI</span>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full max-w-lg mb-6 px-2">
        <div className="flex gap-1.5">
          {steps.map((_, i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{
                background: i <= step ? 'var(--accent-primary)' : 'var(--border-subtle)',
              }}
            />
          ))}
        </div>
        <p className="text-xs text-[var(--text-tertiary)] mt-2">
          Step {step + 1} of {steps.length}
        </p>
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="w-full max-w-lg rounded-2xl p-7 sm:p-9 space-y-6"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mb-6">
              <h1
                className="text-xl font-bold text-[var(--text-primary)] mb-1.5"
                style={{ fontFamily: 'var(--font-display, Manrope, sans-serif)' }}
              >
                {currentStep.title}
              </h1>
              <p className="text-sm text-[var(--text-tertiary)]">{currentStep.subtitle}</p>
            </div>
            {currentStep.content}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-0 disabled:pointer-events-none transition-colors"
          >
            ← Back
          </button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!currentStep.canProceed}
              size="md"
              icon={<ArrowRight size={16} />}
              iconPosition="right"
            >
              Start Learning
            </Button>
          ) : (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!currentStep.canProceed}
              size="md"
              icon={<ArrowRight size={16} />}
              iconPosition="right"
            >
              Continue
            </Button>
          )}
        </div>
      </motion.div>

      <p className="mt-5 text-xs text-[var(--text-tertiary)] text-center">
        You can change these settings anytime in Settings
      </p>
    </div>
  );
}
