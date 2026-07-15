import Link from 'next/link';
import Logo from '@/components/shared/Logo';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <header
        className="sticky top-0 z-10 px-6 py-4 flex items-center gap-4 border-b border-[var(--border-subtle)]"
        style={{ background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(20px)' }}
      >
        <Link href="/" className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <Logo size="sm" />
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="space-y-2 mb-10">
          <h1 className="text-3xl font-bold text-[var(--text-primary)]" style={{ fontFamily: 'Sora, sans-serif' }}>
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--text-tertiary)]">Last updated: July 15, 2025</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8" style={{ color: 'var(--text-secondary)', lineHeight: '1.8' }}>

          <section className="p-6 rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.04)]">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--accent-primary)' }}>Montai is committed to your privacy.</strong>{' '}
              We built this app with a simple promise: we help you learn video editing, we don&apos;t spy on you,
              sell your data, or use your conversations to train AI models. This document explains exactly what
              we collect and why.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>1. What We Collect</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Account Information</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Email address (from OAuth provider or magic link)</li>
                  <li>Nickname (you choose this)</li>
                  <li>Profile avatar emoji</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Preferences</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Preferred language for responses</li>
                  <li>Editing experience level (beginner/intermediate/advanced)</li>
                  <li>Primary editing software selections</li>
                  <li>Focus areas and skill goals</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Chat Data</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Your messages and questions to Montai</li>
                  <li>AI responses to your questions</li>
                  <li>Screenshot images you attach to messages</li>
                  <li>Chat titles and timestamps</li>
                </ul>
              </div>
              <div>
                <h3 className="text-base font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Technical Data</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Session tokens (for keeping you logged in)</li>
                  <li>Basic rate limit counters (to prevent abuse)</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>2. How We Use Your Data</h2>
            <div className="space-y-3 text-sm">
              <p>We use your data exclusively to operate and improve Montai:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong style={{ color: 'var(--text-primary)' }}>Personalization:</strong> Your nickname, language, and experience level help Montai greet you correctly and teach at your level</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Chat History:</strong> Storing your conversations lets you continue learning across sessions</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>AI Responses:</strong> Your messages are sent to Anthropic&apos;s API to generate responses. Anthropic processes these under their own privacy policy and does not use API data for model training</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Security:</strong> Session tokens authenticate your requests; rate limits prevent abuse</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>3. What We Do NOT Do</h2>
            <div className="space-y-2 text-sm">
              {[
                'We do NOT sell your personal data to any third party',
                'We do NOT use your conversations to train AI models',
                'We do NOT share your email or chat history with advertisers',
                'We do NOT track your activity outside of Montai',
                'We do NOT send marketing emails without your explicit consent',
                'We do NOT store your API keys or payment information',
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5 p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <span style={{ color: 'var(--success)' }}>✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>4. Data Storage & Security</h2>
            <div className="text-sm space-y-3">
              <p>Your data is stored in <strong style={{ color: 'var(--text-primary)' }}>Supabase</strong> (PostgreSQL), a secure, SOC 2 compliant cloud database provider:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>All data is encrypted at rest using AES-256</li>
                <li>All data in transit is protected by TLS 1.3</li>
                <li>Row Level Security (RLS) ensures you can only access your own data — not other users&apos; data</li>
                <li>Database access is restricted to server-side only; your API keys and service keys are never exposed to browsers</li>
                <li>Uploaded images are stored in private Supabase Storage buckets</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>5. Your Rights</h2>
            <div className="text-sm space-y-3">
              <p>You have full control over your data:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong style={{ color: 'var(--text-primary)' }}>Export:</strong> Download all your data (profile, chats, messages) as a JSON file from Settings</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Delete:</strong> Permanently delete your account and ALL associated data from Settings → Delete Account</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Correct:</strong> Update your profile information anytime in Settings</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Portability:</strong> Your exported data is in standard JSON format, readable by any application</li>
              </ul>
              <p>Account deletion is a hard delete — we do not retain backups of deleted user data after 30 days.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>6. Third-Party Services</h2>
            <div className="text-sm space-y-3">
              <p>Montai uses these third-party services to operate:</p>
              <ul className="list-disc list-inside space-y-2">
                <li><strong style={{ color: 'var(--text-primary)' }}>Anthropic Claude API:</strong> Powers AI responses. Messages sent to Claude are governed by Anthropic&apos;s API usage policy, which prohibits using API data for training</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Supabase:</strong> Database and file storage (EU/US servers)</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Vercel:</strong> Web hosting and CDN</li>
                <li><strong style={{ color: 'var(--text-primary)' }}>Google OAuth / GitHub OAuth:</strong> Optional sign-in providers (only your email is transferred to us)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>7. Cookies</h2>
            <div className="text-sm space-y-2">
              <p>We use only essential cookies:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong style={{ color: 'var(--text-primary)' }}>Session token:</strong> An HTTP-only, secure cookie that keeps you logged in (expires after 30 days of inactivity)</li>
                <li>No tracking cookies, analytics cookies, or advertising cookies</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>8. Children&apos;s Privacy</h2>
            <p className="text-sm">Montai is not intended for users under the age of 13. We do not knowingly collect personal information from children. If you are a parent and believe your child has created an account, please contact us to remove their data.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>9. GDPR & CCPA Compliance</h2>
            <div className="text-sm space-y-2">
              <p>For users in the European Union (GDPR) and California (CCPA), you have additional rights:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Right to know what data is collected about you</li>
                <li>Right to delete your data (available directly in Settings)</li>
                <li>Right to opt out of data selling (we never sell data)</li>
                <li>Right to data portability (export as JSON from Settings)</li>
                <li>Right to correct inaccurate data (edit in Settings)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>10. Contact</h2>
            <p className="text-sm">For privacy questions or data requests, contact us at: <span style={{ color: 'var(--accent-primary)' }}>privacy@montai.app</span></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] flex gap-4 text-sm">
          <Link href="/terms" className="text-[var(--accent-primary)] hover:underline">Terms of Service</Link>
          <Link href="/" className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">← Back to Home</Link>
        </div>
      </main>
    </div>
  );
}
