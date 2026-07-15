'use client';

import { motion } from 'framer-motion';
import type { SuggestionCard as SuggestionCardType } from '@/lib/types';

interface SuggestionCardProps {
  card: SuggestionCardType;
  index: number;
  onSelect: (prompt: string) => void;
}

export default function SuggestionCard({ card, index, onSelect }: SuggestionCardProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      onClick={() => onSelect(card.prompt)}
      className="suggestion-card text-left p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] w-full"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none mt-0.5">{card.icon}</span>
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{card.title}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-snug">{card.description}</p>
        </div>
      </div>
    </motion.button>
  );
}
