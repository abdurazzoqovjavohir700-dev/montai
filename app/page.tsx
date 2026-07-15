'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogIn } from 'lucide-react';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Footer from '@/components/landing/Footer';
import AuthModal from '@/components/auth/AuthModal';
import Logo from '@/components/shared/Logo';
import { Button } from '@/components/ui/Button';

export default function LandingPage() {
  const router = useRouter();
  const [authOpen, setAuthOpen] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/user')
      .then((r) => {
        if (r.ok) router.replace('/chat');
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex gap-1.5">
          <div className="typing-dot" />
          <div className="typing-dot" />
          <div className="typing-dot" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)]">
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 z-30 px-6 py-4 flex items-center justify-between"
        style={{
          background: 'rgba(10,10,11,0.85)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(39,39,42,0.5)',
        }}
      >
        <Logo size="sm" />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAuthOpen(true)}
          icon={<LogIn size={15} />}
        >
          Sign In
        </Button>
      </motion.header>

      <main className="flex-1">
        <Hero onGetStarted={() => setAuthOpen(true)} />
        <Features />
      </main>

      <Footer />
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}
