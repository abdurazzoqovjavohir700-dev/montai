import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono, Manrope } from 'next/font/google';
import ThemeInit from '@/components/settings/ThemeInit';
import PlatformProvider from '@/components/ui/PlatformProvider';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Montai — Your AI Montage Mentor',
  description:
    'Master the art of video montage and editing with Montai — your AI-powered mentor for professional video editing, color grading, sound design, and storytelling.',
  keywords: [
    'video editing', 'montage', 'AI', 'color grading', 'premiere pro',
    'davinci resolve', 'final cut pro', 'video tutorial', 'editing mentor',
  ],
  authors: [{ name: 'Montai' }],
  creator: 'Montai',
  publisher: 'Montai',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://montai.vercel.app',
    siteName: 'Montai',
    title: 'Montai — Your AI Montage Mentor',
    description: 'Master the art of video montage with AI-powered mentorship.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Montai — Your AI Montage Mentor',
    description: 'Master the art of video montage with AI-powered mentorship.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#08090D',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen antialiased">
        <ThemeInit />
        <PlatformProvider />
        {children}
      </body>
    </html>
  );
}
