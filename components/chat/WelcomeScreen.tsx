'use client';

import { motion } from 'framer-motion';
import SuggestionCard from './SuggestionCard';
import { WELCOME_MESSAGES, SUGGESTION_CARDS } from '@/lib/constants';
import type { Language } from '@/lib/types';
import Logo from '@/components/shared/Logo';

interface WelcomeScreenProps {
  nickname: string;
  language: Language;
  onSelectSuggestion: (prompt: string) => void;
}

export default function WelcomeScreen({ nickname, language, onSelectSuggestion }: WelcomeScreenProps) {
  const getMessage = WELCOME_MESSAGES[language] ?? WELCOME_MESSAGES.en;
  const welcomeText = getMessage(nickname || 'Editor');

  return (
    <div className="flex flex-col items-center justify-center flex-1 px-4 py-8 gap-8">
      {/* Logo + Welcome */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <div className="animate-float">
          <Logo size="lg" href={undefined} />
        </div>
        <p className="text-lg text-[var(--text-primary)] font-medium max-w-md leading-relaxed">
          {welcomeText}
        </p>
        <p className="text-sm text-[var(--text-tertiary)]">
          Choose a topic below or ask me anything about video editing
        </p>
      </motion.div>

      {/* Suggestion Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl"
      >
        {SUGGESTION_CARDS.map((card, index) => (
          <SuggestionCard
            key={card.title}
            card={card}
            index={index}
            onSelect={onSelectSuggestion}
          />
        ))}
      </motion.div>

      {/* Film strip decoration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 opacity-20"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div className="w-1.5 h-1.5 rounded-sm bg-[var(--accent-primary)]" />
            <div className="w-6 h-4 border border-[var(--border-subtle)] rounded-sm" />
            <div className="w-1.5 h-1.5 rounded-sm bg-[var(--accent-primary)]" />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
