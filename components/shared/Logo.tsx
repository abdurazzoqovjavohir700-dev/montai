'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  href?: string;
}

const sizes = {
  sm: { icon: 24, text: 'text-lg', tagline: 'text-xs' },
  md: { icon: 32, text: 'text-xl', tagline: 'text-xs' },
  lg: { icon: 44, text: 'text-3xl', tagline: 'text-sm' },
  xl: { icon: 64, text: 'text-5xl', tagline: 'text-base' },
};

export default function Logo({ size = 'md', showTagline = false, className, href = '/' }: LogoProps) {
  const { icon, text, tagline } = sizes[size];

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      {/* Film strip M icon */}
      <div
        className="relative flex-shrink-0 flex items-center justify-center rounded-lg overflow-hidden"
        style={{
          width: icon,
          height: icon,
          background: 'linear-gradient(135deg, #F59E0B, #F97316)',
          boxShadow: '0 0 20px rgba(245,158,11,0.4)',
        }}
      >
        {/* Film holes */}
        <div className="absolute left-0.5 top-0 bottom-0 flex flex-col justify-evenly">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-sm bg-black/30"
              style={{ width: icon * 0.08, height: icon * 0.12 }}
            />
          ))}
        </div>
        <div className="absolute right-0.5 top-0 bottom-0 flex flex-col justify-evenly">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-sm bg-black/30"
              style={{ width: icon * 0.08, height: icon * 0.12 }}
            />
          ))}
        </div>
        {/* M letter */}
        <span
          className="font-bold text-black relative z-10"
          style={{
            fontFamily: 'Sora, sans-serif',
            fontSize: icon * 0.5,
            lineHeight: 1,
          }}
        >
          M
        </span>
      </div>

      {/* Text */}
      <div className="flex flex-col">
        <span
          className={cn('font-bold gradient-text leading-none', text)}
          style={{ fontFamily: 'Sora, sans-serif' }}
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
