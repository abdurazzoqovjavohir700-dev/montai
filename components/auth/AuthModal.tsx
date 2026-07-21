'use client';

import { useState, useEffect, useRef } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/Toast';
import Link from 'next/link';
import MontaiLogo from '@/components/shared/MontaiLogo';
import { isCapacitor } from '@/lib/native-bridge';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);
  const router = useRouter();
  const stateListenerRef = useRef<{ remove: () => Promise<void> } | null>(null);

  // Clean up app state listener when modal closes
  useEffect(() => {
    if (!isOpen && stateListenerRef.current) {
      stateListenerRef.current.remove();
      stateListenerRef.current = null;
    }
  }, [isOpen]);

  const handleSignIn = async (provider: 'google' | 'github') => {
    setLoading(provider);
    try {
      if (isCapacitor()) {
        // Google/GitHub block OAuth inside Android WebViews since 2021.
        // Use Chrome Custom Tab via @capacitor/browser instead.
        const { Browser } = await import('@capacitor/browser');
        const { App } = await import('@capacitor/app');

        const signinUrl = `https://montai-plum.vercel.app/api/auth/signin/${provider}?callbackUrl=${encodeURIComponent('https://montai-plum.vercel.app/chat')}`;
        await Browser.open({ url: signinUrl, presentationStyle: 'popover' });

        // When user returns to the app after OAuth, check if session was created
        stateListenerRef.current = await App.addListener('appStateChange', async ({ isActive }) => {
          if (isActive) {
            stateListenerRef.current?.remove();
            stateListenerRef.current = null;
            const session = await getSession();
            if (session) {
              router.push('/chat');
              onClose();
            } else {
              toast.error(`${provider === 'google' ? 'Google' : 'GitHub'} sign-in failed.`);
              setLoading(null);
            }
          }
        });
      } else {
        await signIn(provider, { callbackUrl: '/chat' });
      }
    } catch {
      toast.error(`${provider === 'google' ? 'Google' : 'GitHub'} sign-in failed.`);
      setLoading(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.72)',
            backdropFilter: 'blur(20px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(20px) saturate(1.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', stiffness: 360, damping: 30 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: 'rgba(8,9,14,0.90)',
              backdropFilter: 'blur(48px) saturate(1.6)',
              WebkitBackdropFilter: 'blur(48px) saturate(1.6)',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: '24px',
              padding: '44px 36px 40px',
              width: '100%',
              maxWidth: '420px',
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 32px 96px rgba(0,0,0,0.75), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)',
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'none', border: 'none',
                color: '#52525B', fontSize: '18px', cursor: 'pointer',
                width: 32, height: 32, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                borderRadius: 8, transition: 'color 0.15s, background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = '#A1A1AA';
                (e.currentTarget as HTMLElement).style.background = '#1F1F1F';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = '#52525B';
                (e.currentTarget as HTMLElement).style.background = 'none';
              }}
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
            </button>

            {/* Logo */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <MontaiLogo size={56} />
            </div>

            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontWeight: 700,
              fontSize: '26px', color: '#FAFAFA',
              marginBottom: '8px', letterSpacing: '-0.5px',
            }}>
              Welcome to Montai
            </h2>

            <p style={{
              fontSize: '14px', color: '#52525B',
              marginBottom: '32px', lineHeight: 1.5,
              fontFamily: 'Inter, sans-serif',
            }}>
              Sign in to start your AI editing journey
            </p>

            {/* Google */}
            <SocialButton
              provider="google"
              label="Continue with Google"
              loading={loading === 'google'}
              disabled={loading !== null}
              onClick={() => handleSignIn('google')}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              }
            />

            {/* GitHub */}
            <SocialButton
              provider="github"
              label="Continue with GitHub"
              loading={loading === 'github'}
              disabled={loading !== null}
              onClick={() => handleSignIn('github')}
              style={{ marginBottom: '24px' }}
              icon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#D4D4D8">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              }
            />

            {/* Legal */}
            <p style={{
              fontSize: '12px', color: '#3F3F46',
              lineHeight: 1.6, fontFamily: 'Inter, sans-serif',
            }}>
              By continuing, you agree to our{' '}
              <Link href="/privacy" onClick={onClose} style={{ color: '#60A5FA', textDecoration: 'none' }}>
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link href="/terms" onClick={onClose} style={{ color: '#60A5FA', textDecoration: 'none' }}>
                Terms of Service
              </Link>
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SocialButton({
  icon, label, loading, disabled, onClick, style,
}: {
  icon: React.ReactNode;
  label: string;
  loading: boolean;
  disabled: boolean;
  onClick: () => void;
  provider: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={!disabled ? { scale: 1.015, y: -1 } : {}}
      whileTap={!disabled ? { scale: 0.975, transition: { type: 'spring', stiffness: 600, damping: 30 } } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{
        width: '100%', padding: '13px',
        background: 'rgba(255,255,255,0.055)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '14px',
        color: '#D4D4D8',
        fontSize: '14.5px', fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px',
        marginBottom: '10px',
        fontFamily: 'var(--font-body)',
        opacity: disabled && !loading ? 0.45 : 1,
        boxShadow: '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.09)',
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.085)';
          (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.15)';
          (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.055)';
        (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.10)';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.09)';
      }}
    >
      {loading ? (
        <svg style={{ animation: 'spin 0.7s linear infinite' }} width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5"/>
          <path fill="#D4D4D8" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : icon}
      <span>{label}</span>
    </motion.button>
  );
}
