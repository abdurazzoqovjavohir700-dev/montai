'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import MontaiLogo from './MontaiLogo';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  href?: string;
}

const sizes = {
  sm: { icon: 28, text: 'text-lg', tagline: 'text-xs' },
  md: { icon: 36, text: 'text-xl', tagline: 'text-xs' },
  lg: { icon: 48, text: 'text-3xl', tagline: 'text-sm' },
  xl: { icon: 72, text: 'text-5xl', tagline: 'text-base' },
};

export default function Logo({ size = 'md', showTagline = false, className, href = '/' }: LogoProps) {
  const { icon, text, tagline } = sizes[size];

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <MontaiLogo size={icon} />
      <div className="flex flex-col">
        <span
          className={cn('font-bold gradient-text leading-none', text)}
          style={{ fontFamily: 'var(--font-display, Manrope, sans-serif)' }}
        >
          Montai
        </span>
        {showTagline && (
          <span className={cn('text-[var(--text-tertiary)] leading-tight mt-0.5', tagline)}>
            Your AI Montage Mentor
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-primary)] rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}
