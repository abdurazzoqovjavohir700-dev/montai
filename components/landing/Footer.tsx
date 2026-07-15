import Link from 'next/link';
import Logo from '@/components/shared/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] py-8 px-4">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo size="sm" />
        <nav className="flex items-center gap-6 text-sm text-[var(--text-tertiary)]">
          <Link href="/privacy" className="hover:text-[var(--text-secondary)] transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-[var(--text-secondary)] transition-colors">
            Terms of Service
          </Link>
          <span>© 2025 Montai</span>
        </nav>
      </div>
    </footer>
  );
}
