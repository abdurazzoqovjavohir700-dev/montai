'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, X, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import Link from 'next/link';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
  </svg>
);

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null);

  const handleGoogleSignIn = async () => {
    setSocialLoading('google');
    try {
      await signIn('google', { callbackUrl: '/chat' });
    } catch {
      toast.error('Google sign-in failed. Please try again.');
      setSocialLoading(null);
    }
  };

  const handleGitHubSignIn = async () => {
    setSocialLoading('github');
    try {
      await signIn('github', { callbackUrl: '/chat' });
    } catch {
      toast.error('GitHub sign-in failed. Please try again.');
      setSocialLoading(null);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setEmailLoading(true);
    try {
      const result = await signIn('email', {
        email: email.trim(),
        redirect: false,
        callbackUrl: '/chat',
      });
      if (result?.error) {
        toast.error('Failed to send magic link. Please try again.');
      } else {
        setEmailSent(true);
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 mobile-overlay"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ duration: 0.25, type: 'spring', stiffness: 350, damping: 32 }}
            className="relative w-full max-w-sm rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(14,14,16,0.97)',
              border: '1px solid rgba(245,158,11,0.2)',
              boxShadow: '0 0 60px rgba(245,158,11,0.08), 0 25px 50px rgba(0,0,0,0.6)',
            }}
          >
            {/* Top orange line accent */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, #F59E0B, transparent)' }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors z-10"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="p-8">
              <AnimatePresence mode="wait">
                {emailSent ? (
                  <motion.div
                    key="sent"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="text-center py-6 space-y-4"
                  >
                    <div className="text-5xl">📧</div>
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif' }}>
                        Check your inbox!
                      </h2>
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                        Magic link sent to{' '}
                        <strong style={{ color: 'var(--accent-primary)' }}>{email}</strong>.
                        <br />It expires in 10 minutes.
                      </p>
                    </div>
                    <button
                      onClick={() => { setEmailSent(false); setEmail(''); }}
                      className="text-xs underline underline-offset-2 transition-colors"
                      style={{ color: 'var(--text-tertiary)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                    >
                      Try a different email
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-6"
                  >
                    {/* Header */}
                    <div className="text-center space-y-1 pb-2">
                      {/* Logo icon */}
                      <div className="flex justify-center mb-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{
                            background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                            boxShadow: '0 0 30px rgba(245,158,11,0.35)',
                          }}
                        >
                          <span className="text-xl font-bold text-black" style={{ fontFamily: 'Sora, sans-serif' }}>M</span>
                        </div>
                      </div>
                      <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif' }}>
                        Welcome to Montai
                      </h2>
                      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Sign in to start your AI editing journey
                      </p>
                    </div>

                    {/* OAuth buttons */}
                    <div className="space-y-3">
                      <OAuthButton
                        icon={<GoogleIcon />}
                        label="Continue with Google"
                        loading={socialLoading === 'google'}
                        disabled={socialLoading !== null}
                        onClick={handleGoogleSignIn}
                      />
                      <OAuthButton
                        icon={<GitHubIcon />}
                        label="Continue with GitHub"
                        loading={socialLoading === 'github'}
                        disabled={socialLoading !== null}
                        onClick={handleGitHubSignIn}
                        dark
                      />
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                      <span className="text-xs px-1" style={{ color: 'var(--text-tertiary)' }}>or continue with email</span>
                      <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                    </div>

                    {/* Email magic link */}
                    <form onSubmit={handleMagicLink} className="space-y-3">
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={<Mail size={16} />}
                        aria-label="Email address"
                        autoComplete="email"
                        required
                      />
                      <button
                        type="submit"
                        disabled={emailLoading || !email.trim()}
                        className="w-full py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'linear-gradient(135deg, #F59E0B, #F97316)',
                          color: '#0A0A0B',
                        }}
                        onMouseEnter={e => {
                          if (!emailLoading) {
                            (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(245,158,11,0.4)';
                            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                        }}
                      >
                        {emailLoading ? (
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                        ) : (
                          <>
                            Send Magic Link
                            <ArrowRight size={15} />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Legal */}
                    <p className="text-center text-[10px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                      By continuing, you agree to our{' '}
                      <Link href="/privacy" className="hover:underline" style={{ color: 'var(--accent-primary)' }} onClick={onClose}>
                        Privacy Policy
                      </Link>{' '}
                      and{' '}
                      <Link href="/terms" className="hover:underline" style={{ color: 'var(--accent-primary)' }} onClick={onClose}>
                        Terms of Service
                      </Link>
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface OAuthButtonProps {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  dark?: boolean;
}

function OAuthButton({ icon, label, loading, disabled, onClick, dark }: OAuthButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2.5 px-4 rounded-lg font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: dark ? '#161b22' : '#ffffff',
        color: dark ? '#ffffff' : '#1f1f1f',
        border: dark ? '1px solid #30363d' : '1px solid #e0e0e0',
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLButtonElement).style.opacity = '0.85';
          (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.opacity = '1';
        (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
      }}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        icon
      )}
      <span>{label}</span>
    </button>
  );
}
