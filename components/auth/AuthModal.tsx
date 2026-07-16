'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import MontaiLogo from '@/components/shared/MontaiLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState<'google' | 'github' | null>(null);

  const handleSignIn = async (provider: 'google' | 'github') => {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl: '/chat' });
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
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.22, type: 'spring', stiffness: 380, damping: 34 }}
            onClick={e => e.stopPropagation()}
            style={{
              background: '#141416',
              border: '1px solid #27272A',
              borderRadius: '20px',
              padding: '48px 40px',
              width: '100%',
              maxWidth: '420px',
              textAlign: 'center',
              position: 'relative',
              boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
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
              ✕
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
              <Link href="/privacy" onClick={onClose} style={{ color: '#F59E0B', textDecoration: 'none' }}>
                Privacy Policy
              </Link>
              {' '}and{' '}
              <Link href="/terms" onClick={onClose} style={{ color: '#F59E0B', textDecoration: 'none' }}>
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
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '14px',
        background: '#1A1A1A',
        border: '1px solid #27272A',
        borderRadius: '12px',
        color: '#D4D4D8',
        fontSize: '15px', fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: '10px',
        marginBottom: '10px',
        transition: 'all 0.2s',
        fontFamily: 'Inter, sans-serif',
        opacity: disabled && !loading ? 0.5 : 1,
        ...style,
      }}
      onMouseEnter={e => {
        if (!disabled) {
          (e.currentTarget as HTMLElement).style.background = '#222';
          (e.currentTarget as HTMLElement).style.borderColor = '#3F3F46';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.background = '#1A1A1A';
        (e.currentTarget as HTMLElement).style.borderColor = '#27272A';
      }}
    >
      {loading ? (
        <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="#3F3F46" strokeWidth="3"/>
          <path fill="#D4D4D8" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : icon}
      <span>{label}</span>
    </button>
  );
}
