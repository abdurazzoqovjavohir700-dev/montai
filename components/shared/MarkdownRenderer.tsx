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
