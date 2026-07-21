import Link from 'next/link';
import MontaiLogo from '@/components/shared/MontaiLogo';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', color: '#FAFAFA' }}>
      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #1A1A1E',
        background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(20px)',
      }}>
        <Link href="/" style={{
          padding: '8px', borderRadius: 8, color: '#71717A', display: 'flex',
          border: '1px solid transparent', transition: 'all 0.2s ease', textDecoration: 'none',
        }}
          onMouseEnter={undefined}
        >
          <ArrowLeft size={18} />
        </Link>
        <MontaiLogo size={28} />
        <span style={{
          fontFamily: 'var(--font-outfit), Outfit, sans-serif',
          fontWeight: 700, fontSize: 16, color: '#FAFAFA', letterSpacing: '-0.5px',
        }}>
          Montai
        </span>
      </header>

      <main style={{ maxWidth: 768, margin: '0 auto', padding: '60px 32px 80px' }}>
        {/* Page title */}
        <div style={{ marginBottom: 48 }}>
          <span style={{
            fontFamily: 'var(--font-mono), JetBrains Mono, monospace',
            fontSize: 11, color: '#60A5FA',
            textTransform: 'uppercase', letterSpacing: '3px',
          }}>
            Legal
          </span>
          <h1 style={{
            fontFamily: 'var(--font-outfit), Outfit, sans-serif',
            fontWeight: 800, fontSize: 'clamp(32px, 5vw, 48px)',
            letterSpacing: '-2px', lineHeight: 1.1, marginTop: 10, marginBottom: 8,
          }}>
            Privacy Policy
          </h1>
          <p style={{
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontSize: 14, color: '#52525B',
          }}>
            Last updated: July 15, 2025
          </p>
        </div>

        {/* Promise card */}
        <div style={{
          padding: '20px 24px', borderRadius: 16, marginBottom: 48,
          background: 'rgba(96,165,250,0.05)',
          border: '1px solid rgba(96,165,250,0.2)',
        }}>
          <p style={{
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontSize: 15, lineHeight: 1.75, color: '#A1A1AA',
          }}>
            <strong style={{ color: '#60A5FA' }}>Montai is committed to your privacy.</strong>{' '}
            We built this app with a simple promise: we help you learn video editing, we don&apos;t spy on you,
            sell your data, or use your conversations to train AI models. This document explains exactly what
            we collect and why.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="1. What We Collect">
            <SubSection title="Account Information">
              <ul>
                <li>Email address (from OAuth provider or magic link)</li>
                <li>Nickname (you choose this)</li>
                <li>Profile avatar emoji</li>
              </ul>
            </SubSection>
            <SubSection title="Preferences">
              <ul>
                <li>Preferred language for responses</li>
                <li>Editing experience level (beginner/intermediate/advanced)</li>
                <li>Primary editing software selections</li>
                <li>Focus areas and skill goals</li>
              </ul>
            </SubSection>
            <SubSection title="Chat Data">
              <ul>
                <li>Your messages and questions to Montai</li>
                <li>AI responses to your questions</li>
                <li>Screenshot images you attach to messages</li>
                <li>Chat titles and timestamps</li>
              </ul>
            </SubSection>
            <SubSection title="Technical Data">
              <ul>
                <li>Session tokens (for keeping you logged in)</li>
                <li>Basic rate limit counters (to prevent abuse)</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="2. How We Use Your Data">
            <p>We use your data exclusively to operate and improve Montai:</p>
            <ul>
              <li><strong style={{ color: '#FAFAFA' }}>Personalization:</strong> Your nickname, language, and experience level help Montai teach at your level</li>
              <li><strong style={{ color: '#FAFAFA' }}>Chat History:</strong> Storing your conversations lets you continue learning across sessions</li>
              <li><strong style={{ color: '#FAFAFA' }}>AI Responses:</strong> Your messages are sent to Groq&apos;s API to generate responses — Groq&apos;s usage policy prohibits using API data for model training</li>
              <li><strong style={{ color: '#FAFAFA' }}>Security:</strong> Session tokens authenticate your requests; rate limits prevent abuse</li>
            </ul>
          </Section>

          <Section title="3. What We Do NOT Do">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                'We do NOT sell your personal data to any third party',
                'We do NOT use your conversations to train AI models',
                'We do NOT share your email or chat history with advertisers',
                'We do NOT track your activity outside of Montai',
                'We do NOT send marketing emails without your explicit consent',
                'We do NOT store your API keys or payment information',
              ].map((item) => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 16px',
                  borderRadius: 10, background: 'rgba(34,197,94,0.05)',
                  border: '1px solid rgba(34,197,94,0.15)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#22C55E', flexShrink: 0, marginTop: 2 }}><polyline points="2,7 6,11 12,3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span style={{
                    fontFamily: 'var(--font-inter), Inter, sans-serif',
                    fontSize: 14, color: '#A1A1AA', lineHeight: 1.5,
                  }}>{item}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="4. Data Storage & Security">
            <p>Your data is stored in <strong style={{ color: '#FAFAFA' }}>Supabase</strong> (PostgreSQL), a secure, SOC 2 compliant cloud database:</p>
            <ul>
              <li>All data is encrypted at rest using AES-256</li>
              <li>All data in transit is protected by TLS 1.3</li>
              <li>Row Level Security (RLS) ensures you can only access your own data</li>
              <li>Database access is server-side only — API keys never exposed to browsers</li>
              <li>Uploaded images are stored in private Supabase Storage buckets</li>
            </ul>
          </Section>

          <Section title="5. Your Rights">
            <p>You have full control over your data:</p>
            <ul>
              <li><strong style={{ color: '#FAFAFA' }}>Export:</strong> Download all your data as a JSON file from Settings</li>
              <li><strong style={{ color: '#FAFAFA' }}>Delete:</strong> Permanently delete your account and ALL associated data from Settings → Delete Account</li>
              <li><strong style={{ color: '#FAFAFA' }}>Correct:</strong> Update your profile information anytime in Settings</li>
              <li><strong style={{ color: '#FAFAFA' }}>Portability:</strong> Your exported data is in standard JSON format</li>
            </ul>
            <p>Account deletion is a hard delete — we do not retain backups of deleted user data after 30 days.</p>
          </Section>

          <Section title="6. Third-Party Services">
            <p>Montai uses these third-party services to operate:</p>
            <ul>
              <li><strong style={{ color: '#FAFAFA' }}>Groq API:</strong> Powers AI responses — governed by Groq&apos;s usage policy which prohibits using API data for training</li>
              <li><strong style={{ color: '#FAFAFA' }}>Supabase:</strong> Database and file storage (EU/US servers)</li>
              <li><strong style={{ color: '#FAFAFA' }}>Vercel:</strong> Web hosting and CDN</li>
              <li><strong style={{ color: '#FAFAFA' }}>Google OAuth / GitHub OAuth:</strong> Optional sign-in providers (only your email is transferred)</li>
            </ul>
          </Section>

          <Section title="7. Cookies">
            <p>We use only essential cookies:</p>
            <ul>
              <li><strong style={{ color: '#FAFAFA' }}>Session token:</strong> An HTTP-only, secure cookie that keeps you logged in (expires after 30 days of inactivity)</li>
              <li>No tracking cookies, analytics cookies, or advertising cookies</li>
            </ul>
          </Section>

          <Section title="8. Children&apos;s Privacy">
            <p>Montai is not intended for users under the age of 13. We do not knowingly collect personal information from children. If you are a parent and believe your child has created an account, please contact us to remove their data.</p>
          </Section>

          <Section title="9. GDPR & CCPA Compliance">
            <p>For users in the European Union (GDPR) and California (CCPA), you have additional rights:</p>
            <ul>
              <li>Right to know what data is collected about you</li>
              <li>Right to delete your data (available directly in Settings)</li>
              <li>Right to opt out of data selling (we never sell data)</li>
              <li>Right to data portability (export as JSON from Settings)</li>
              <li>Right to correct inaccurate data (edit in Settings)</li>
            </ul>
          </Section>

          <Section title="10. Contact">
            <p>
              For privacy questions or data requests, contact us at:{' '}
              <span style={{ color: '#60A5FA' }}>privacy@montai.app</span>
            </p>
          </Section>
        </div>

        {/* Footer links */}
        <div style={{
          marginTop: 60, paddingTop: 32,
          borderTop: '1px solid #1A1A1E',
          display: 'flex', gap: 24,
          fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 14,
        }}>
          <Link href="/terms" style={{ color: '#60A5FA', textDecoration: 'none' }}>Terms of Service →</Link>
          <Link href="/" style={{ color: '#52525B', textDecoration: 'none' }}>← Back to Home</Link>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 style={{
        fontFamily: 'var(--font-display, Manrope, sans-serif)',
        fontWeight: 700, fontSize: 20, color: '#FAFAFA',
        marginBottom: 16, letterSpacing: '-0.5px',
      }}>
        {title}
      </h2>
      <div style={{
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        fontSize: 14, color: '#71717A', lineHeight: 1.75,
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {children}
      </div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 style={{
        fontFamily: 'var(--font-display, Manrope, sans-serif)',
        fontWeight: 600, fontSize: 15, color: '#A1A1AA', marginBottom: 8,
      }}>
        {title}
      </h3>
      <div style={{
        fontFamily: 'var(--font-inter), Inter, sans-serif',
        fontSize: 14, color: '#71717A', lineHeight: 1.75,
      }}>
        {children}
      </div>
    </div>
  );
}
