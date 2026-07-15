'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Logo from '@/components/shared/Logo';
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
      subtitle: "Your nickname for personalized greetings",
      content: (
        <div className="space-y-4">
          <Input
            placeholder="e.g. Alex, Editor, Filmmaker..."
            value={data.nickname}
            onChange={(e) => setData((p) => ({ ...p, nickname: e.target.value }))}
            autoFocus
            maxLength={30}
            onKeyDown={(e) => e.key === 'Enter' && data.nickname.trim() && setStep(1)}
          />
          <p className="text-xs text-[var(--text-tertiary)]">
            {data.nickname.length}/30 characters
          </p>
        </div>
      ),
      canProceed: data.nickname.trim().length > 0,
    },
    {
      title: "Your editing experience?",
      subtitle: "Montai will adapt its teaching to your level",
      content: (
        <div className="space-y-3">
          {EXPERIENCE_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setData((p) => ({ ...p, experienceLevel: level.value as typeof data.experienceLevel }))}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                data.experienceLevel === level.value
                  ? 'border-[var(--accent-primary)] bg-[rgba(245,158,11,0.08)]'
                  : 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] hover:border-[var(--border-subtle)] hover:bg-[var(--bg-secondary)]'
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
                <p className="text-sm font-medium text-[var(--text-primary)]">{level.label}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{level.description}</p>
              </div>
            </button>
          ))}
        </div>
      ),
      canProceed: true,
    },
    {
      title: "Primary editing software?",
      subtitle: "Montai will provide software-specific shortcuts and tips",
      content: (
        <div className="grid grid-cols-2 gap-2.5">
          {SOFTWARE_OPTIONS.map((sw) => {
            const selected = data.primarySoftware.includes(sw);
            return (
              <button
                key={sw}
                onClick={() => toggleSoftware(sw)}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium text-left transition-all duration-200 ${
                  selected
                    ? 'border-[var(--accent-primary)] bg-[rgba(245,158,11,0.1)] text-[var(--accent-primary)]'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                }`}
              >
                {selected && <Check size={12} className="inline mr-1.5" />}
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
      subtitle: "Montai will greet and teach you in this language",
      content: (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => {
            const selected = data.language === lang.value;
            return (
              <button
                key={lang.value}
                onClick={() => setData((p) => ({ ...p, language: lang.value }))}
                className={`px-3 py-2.5 rounded-lg border text-sm text-left transition-all duration-200 ${
                  selected
                    ? 'border-[var(--accent-primary)] bg-[rgba(245,158,11,0.1)] text-[var(--accent-primary)] font-medium'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                }`}
              >
                <span className="block font-medium">{lang.nativeLabel}</span>
                <span className="block text-xs opacity-60">{lang.label}</span>
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
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10"
      >
        <Logo size="md" showTagline href={undefined} />
      </motion.div>

      {/* Progress bar */}
      <div className="w-full max-w-md mb-6">
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
      <div
        className="w-full max-w-md rounded-2xl p-6 sm:p-8 space-y-6 orange-border-glow"
        style={{ background: 'var(--bg-secondary)' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="mb-5">
              <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-1">
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
            className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
      </div>

      <p className="mt-6 text-xs text-[var(--text-tertiary)] text-center">
        You can change these settings anytime in Settings
      </p>
    </div>
  );
}
