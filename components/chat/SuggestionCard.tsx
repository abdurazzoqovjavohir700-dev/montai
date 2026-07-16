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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.06 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(card.prompt)}
      className="text-left p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] w-full transition-colors duration-150 hover:border-[rgba(245,158,11,0.35)] hover:bg-[rgba(245,158,11,0.03)]"
    >
      <div className="flex items-start gap-3">
        <span className="text-xl leading-none mt-0.5 flex-shrink-0">{card.icon}</span>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{card.title}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-snug">{card.description}</p>
        </div>
      </div>
    </motion.button>
  );
}
