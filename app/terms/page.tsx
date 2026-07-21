import Link from 'next/link';
import MontaiLogo from '@/components/shared/MontaiLogo';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', color: '#FAFAFA' }}>

      {/* Header — identical to Privacy page */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 12,
        borderBottom: '1px solid #1A1A1E',
        background: 'rgba(10,10,11,0.9)', backdropFilter: 'blur(20px)',
      }}>
        <Link href="/" style={{
          padding: '8px', borderRadius: 8, color: '#71717A', display: 'flex',
          border: '1px solid transparent', textDecoration: 'none',
        }}>
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

        {/* Title */}
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
            Terms of Service
          </h1>
          <p style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 14, color: '#52525B' }}>
            Last updated: July 15, 2025
          </p>
        </div>

        {/* Summary card */}
        <div style={{
          padding: '20px 24px', borderRadius: 16, marginBottom: 48,
          background: 'rgba(96,165,250,0.05)',
          border: '1px solid rgba(96,165,250,0.2)',
        }}>
          <p style={{
            fontFamily: 'var(--font-inter), Inter, sans-serif',
            fontSize: 15, lineHeight: 1.75, color: '#A1A1AA',
          }}>
            <strong style={{ color: '#60A5FA' }}>Plain language. No tricks.</strong>{' '}
            By using Montai you agree to these terms. If you don&apos;t agree, please don&apos;t use the service.
            These terms exist to protect both you and us — we&apos;ve kept them as simple as possible.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

          <Section title="1. What Montai Is">
            <p>
              Montai is an AI-powered educational platform for learning video editing and montage techniques.
              The AI is powered by the Groq API (Llama models) and is designed to teach, advise, and answer
              questions about professional video production.
            </p>
            <p>
              Montai is a <strong style={{ color: '#FAFAFA' }}>learning tool</strong> — it does not edit your videos,
              access your files, or create content on your behalf.
            </p>
          </Section>

          <Section title="2. Acceptable Use">
            <p>You may use Montai to:</p>
            <ul>
              <li>Learn video editing, color grading, sound design, and storytelling techniques</li>
              <li>Get advice on editing software (Premiere Pro, DaVinci Resolve, Final Cut Pro, etc.)</li>
              <li>Share screenshots of your timeline or project for feedback</li>
              <li>Explore editing theory, techniques, and professional workflows</li>
              <li>Ask any general knowledge question — Montai answers broadly</li>
            </ul>
            <p style={{ marginTop: 4 }}>You may <strong style={{ color: '#EF4444' }}>NOT</strong> use Montai to:</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {[
                'Attempt to extract, expose, or circumvent the system prompt or AI instructions',
                'Automate conversations to bypass rate limits or abuse the system',
                'Generate content that violates copyright or intellectual property laws',
                'Use the service for any illegal purpose in any jurisdiction',
                'Attempt to reverse-engineer, scrape, or clone the service',
                'Harass, abuse, or attempt to manipulate the AI or other users',
                'Request pirated software, crack keys, or other illegal content',
              ].map(item => (
                <div key={item} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10, padding: '11px 15px',
                  borderRadius: 10, background: 'rgba(239,68,68,0.05)',
                  border: '1px solid rgba(239,68,68,0.14)',
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: '#EF4444', flexShrink: 0, marginTop: 2 }}><line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  <span style={{ fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 14, color: '#A1A1AA', lineHeight: 1.5 }}>
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="3. AI Content Disclaimer">
            <p>
              Montai provides educational information based on AI-generated responses. While we strive for
              accuracy, AI can and does make mistakes. Always verify important technical information
              independently — especially hardware specifications, software versions, and pricing.
            </p>
            <p>
              Montai is not responsible for decisions made based on AI responses, including editing choices,
              hardware purchases, software subscriptions, or professional career decisions.
            </p>
          </Section>

          <Section title="4. Intellectual Property">
            <p>
              You retain full ownership of any content you create. Your conversations with Montai are
              yours — you can export them at any time from Settings.
            </p>
            <p>
              Montai, its name, logo, design, and underlying code are the property of Montai&apos;s creators
              and are protected by intellectual property law. You may not copy, reproduce, or redistribute
              any part of Montai without explicit written permission.
            </p>
            <p>
              AI-generated responses are provided as educational content. You may use the information
              Montai provides in your own work without restriction.
            </p>
          </Section>

          <Section title="5. Account & Access">
            <p>You are responsible for:</p>
            <ul>
              <li>Maintaining the security of your account credentials</li>
              <li>All activity that occurs under your account</li>
              <li>Not sharing your login with others</li>
            </ul>
            <p>
              Montai is free to use with a rate limit of{' '}
              <strong style={{ color: '#FAFAFA' }}>30 messages per hour</strong>.
              We may introduce paid tiers in the future with higher limits and additional features.
            </p>
            <p>
              We reserve the right to suspend or permanently terminate accounts that violate these terms,
              without prior notice in cases of serious violations.
            </p>
          </Section>

          <Section title="6. Service Availability">
            <p>
              We aim for high uptime but cannot guarantee uninterrupted service. Montai may be temporarily
              unavailable due to:
            </p>
            <ul>
              <li>Planned maintenance (we&apos;ll try to announce in advance)</li>
              <li>Infrastructure issues at our hosting providers (Vercel)</li>
              <li>Third-party API outages (Groq, Supabase)</li>
              <li>Unexpected errors or security incidents</li>
            </ul>
            <p>We are not liable for damages caused by service interruptions.</p>
          </Section>

          <Section title="7. Limitation of Liability">
            <p>
              Montai is provided <strong style={{ color: '#FAFAFA' }}>&quot;as is&quot;</strong> without warranties of
              any kind, express or implied. To the maximum extent permitted by applicable law, Montai and
              its creators are not liable for any:
            </p>
            <ul>
              <li>Indirect, incidental, special, or consequential damages</li>
              <li>Loss of profits, data, or business opportunities</li>
              <li>Damages arising from AI inaccuracies or errors</li>
              <li>Damages from unauthorized access to your account</li>
            </ul>
          </Section>

          <Section title="8. User Content">
            <p>
              When you send messages or upload images to Montai, you grant us a limited license to process
              that content solely for the purpose of generating AI responses. We do not store your images
              on external servers — uploaded images are processed in-memory and stored only in your local
              chat history within our database.
            </p>
            <p>
              You represent that you have the right to share any content you submit, and that it does not
              violate any third-party rights or applicable laws.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              You can stop using Montai at any time. You can permanently delete your account and all
              associated data from <strong style={{ color: '#FAFAFA' }}>Settings → Delete Account</strong>.
            </p>
            <p>
              We may terminate or suspend your access immediately, without notice, if you violate these
              terms. Upon termination, your data will be handled as described in our{' '}
              <Link href="/privacy" style={{ color: '#60A5FA', textDecoration: 'none' }}>Privacy Policy</Link>.
            </p>
          </Section>

          <Section title="10. Changes to Terms">
            <p>
              We may update these terms from time to time as Montai evolves. We will notify users of
              significant changes by updating the date at the top of this page. For major changes,
              we may also show an in-app notification.
            </p>
            <p>
              Continued use of Montai after changes are posted constitutes acceptance of the updated terms.
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These terms are governed by and construed in accordance with applicable law. Any disputes
              arising from these terms or your use of Montai shall be resolved through good-faith
              negotiation before resorting to formal legal proceedings.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              Questions about these terms? Contact us at:{' '}
              <span style={{ color: '#60A5FA' }}>legal@montai.app</span>
            </p>
          </Section>

        </div>

        {/* Footer */}
        <div style={{
          marginTop: 60, paddingTop: 32,
          borderTop: '1px solid #1A1A1E',
          display: 'flex', gap: 24,
          fontFamily: 'var(--font-inter), Inter, sans-serif', fontSize: 14,
        }}>
          <Link href="/privacy" style={{ color: '#60A5FA', textDecoration: 'none' }}>Privacy Policy →</Link>
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
