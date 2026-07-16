'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/chat/CodeBlock';
import type { Components } from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const components: Components = {
    code({ className: codeClass, children, ...props }) {
      const match = /language-(\w+)/.exec(codeClass ?? '');
      const isBlock = 'node' in props && props.node && (props.node as { type?: string }).type === 'code';
      const codeString = String(children).replace(/\n$/, '');

      if (isBlock || match) {
        return <CodeBlock code={codeString} language={match?.[1] ?? 'text'} />;
      }

      return (
        <code className={codeClass} {...props}>
          {children}
        </code>
      );
    },
    pre({ children }) {
      return <>{children}</>;
    },
    a({ href, children }) {
      const isYoutube = href?.includes('youtube.com') || href?.includes('youtu.be');
      if (isYoutube) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 8, marginTop: 4,
              background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.2)',
              color: '#FF4444', fontSize: 13, textDecoration: 'none', fontWeight: 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#FF4444">
              <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z"/>
            </svg>
            {children}
          </a>
        );
      }
      return (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
  };

  return (
    <div className={`markdown-content ${className ?? ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
