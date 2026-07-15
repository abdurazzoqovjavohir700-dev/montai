import Link from 'next/link';
import Logo from '@/components/shared/Logo';
import { ArrowLeft } from 'lucide-react';

export default function TermsPage() {
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
            Terms of Service
          </h1>
          <p className="text-sm text-[var(--text-tertiary)]">Last updated: July 15, 2025</p>
        </div>

        <div className="space-y-8" style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '14px' }}>

          <section className="p-6 rounded-2xl border border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.04)]">
            <p className="text-sm">
              By using Montai, you agree to these terms. Please read them. They&apos;re written in plain language —
              no legal tricks. If you don&apos;t agree, please don&apos;t use the service.
            </p>
          </section>

          {[
            {
              title: '1. What Montai Is',
              content: (
                <p>Montai is an AI-powered educational tool for learning video editing and montage techniques. The AI is powered by Anthropic Claude and is designed to teach, advise, and answer questions about professional video production. Montai is a learning tool — it does not edit videos, access your files, or create content on your behalf.</p>
              ),
            },
            {
              title: '2. Acceptable Use',
              content: (
                <div className="space-y-3">
                  <p>You may use Montai to:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Learn video editing, color grading, sound design, and storytelling techniques</li>
                    <li>Get advice on editing software and workflows</li>
                    <li>Share screenshots of your timeline for feedback</li>
                    <li>Explore editing theory and professional practices</li>
                  </ul>
                  <p>You may NOT use Montai to:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Attempt to extract, expose, or circumvent the system prompt or AI instructions</li>
                    <li>Automate conversations to circumvent rate limits</li>
                    <li>Generate content that violates copyright or intellectual property laws</li>
                    <li>Use the service for any illegal purpose</li>
                    <li>Attempt to reverse engineer or scrape the service</li>
                    <li>Harass, abuse, or attempt to manipulate the AI</li>
                    <li>Request pirated software, crack keys, or illegal content</li>
                  </ul>
                </div>
              ),
            },
            {
              title: '3. AI Content Disclaimer',
              content: (
                <p>Montai provides educational information based on AI-generated responses. While we strive for accuracy, AI can make mistakes. Always verify important technical information independently. Montai is not responsible for decisions made based on AI responses, including editing choices, hardware purchases, or professional decisions.</p>
              ),
            },
            {
              title: '4. Intellectual Property',
              content: (
                <div className="space-y-2">
                  <p>You retain ownership of any content you create. The conversations you have with Montai are yours — you can export them at any time.</p>
                  <p>Montai, its name, logo, design, and underlying code are owned by Montai and protected by intellectual property law. You may not copy, reproduce, or redistribute any part of Montai without permission.</p>
                </div>
              ),
            },
            {
              title: '5. Account & Access',
              content: (
                <div className="space-y-2">
                  <p>You are responsible for maintaining the security of your account. Do not share your login credentials. We reserve the right to suspend or terminate accounts that violate these terms.</p>
                  <p>Montai is free to use with a limit of 30 messages per hour. We may introduce paid tiers in the future with higher limits.</p>
                </div>
              ),
            },
            {
              title: '6. Service Availability',
              content: (
                <p>We aim for 99% uptime but cannot guarantee uninterrupted service. Montai may be temporarily unavailable due to maintenance, infrastructure issues, or third-party API outages (Anthropic, Supabase, Vercel). We are not liable for damages caused by service interruptions.</p>
              ),
            },
            {
              title: '7. Limitation of Liability',
              content: (
                <p>Montai is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, Montai and its creators are not liable for any indirect, incidental, special, or consequential damages arising from your use of the service, including lost profits, lost data, or business interruption.</p>
              ),
            },
            {
              title: '8. Termination',
              content: (
                <div className="space-y-2">
                  <p>You can stop using Montai at any time and delete your account from Settings. We may terminate or suspend your access if you violate these terms.</p>
                  <p>Upon termination, your data will be deleted as described in our Privacy Policy.</p>
                </div>
              ),
            },
            {
              title: '9. Changes to Terms',
              content: (
                <p>We may update these terms from time to time. We&apos;ll notify users of significant changes by updating the date at the top of this page. Continued use of Montai after changes constitutes acceptance of the new terms.</p>
              ),
            },
            {
              title: '10. Contact',
              content: (
                <p>For questions about these terms, contact us at: <span style={{ color: 'var(--accent-primary)' }}>legal@montai.app</span></p>
              ),
            },
          ].map(({ title, content }) => (
            <section key={title}>
              <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--text-primary)', fontFamily: 'Sora, sans-serif' }}>
                {title}
              </h2>
              <div className="text-sm leading-relaxed">{content}</div>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-[var(--border-subtle)] flex gap-4 text-sm">
          <Link href="/privacy" className="text-[var(--accent-primary)] hover:underline">Privacy Policy</Link>
          <Link href="/" className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">← Back to Home</Link>
        </div>
      </main>
    </div>
  );
}
