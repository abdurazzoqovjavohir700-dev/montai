import type { NextConfig } from "next";

const securityHeaders = [
  { key: 'X-Content-Type-Options',        value: 'nosniff' },
  { key: 'X-Frame-Options',               value: 'DENY' },
  { key: 'X-XSS-Protection',             value: '1; mode=block' },
  { key: 'Referrer-Policy',              value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',           value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security',    value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist'],
  experimental: {
    serverActions: {
      bodySizeLimit: '12mb',
    },
  },
  // Include pdfjs-dist worker files in Vercel serverless bundle
  outputFileTracingIncludes: {
    '/api/parse-pdf': ['./node_modules/pdfjs-dist/**/*'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
