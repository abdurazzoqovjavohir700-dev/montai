'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check, Download, WrapText, ChevronDown, ChevronUp } from 'lucide-react';

/* ─── Language metadata ───────────────────────────────────── */
const LANG_META: Record<string, { color: string; ext: string; label: string }> = {
  javascript: { color: '#F7DF1E', ext: 'js',    label: 'JavaScript' },
  js:         { color: '#F7DF1E', ext: 'js',    label: 'JavaScript' },
  typescript: { color: '#3B82F6', ext: 'ts',    label: 'TypeScript' },
  ts:         { color: '#3B82F6', ext: 'ts',    label: 'TypeScript' },
  tsx:        { color: '#3B82F6', ext: 'tsx',   label: 'TSX' },
  jsx:        { color: '#61DAFB', ext: 'jsx',   label: 'JSX' },
  python:     { color: '#3B82F6', ext: 'py',    label: 'Python' },
  py:         { color: '#3B82F6', ext: 'py',    label: 'Python' },
  bash:       { color: '#10B981', ext: 'sh',    label: 'Bash' },
  sh:         { color: '#10B981', ext: 'sh',    label: 'Shell' },
  shell:      { color: '#10B981', ext: 'sh',    label: 'Shell' },
  css:        { color: '#60A5FA', ext: 'css',   label: 'CSS' },
  scss:       { color: '#EC4899', ext: 'scss',  label: 'SCSS' },
  html:       { color: '#E8572A', ext: 'html',  label: 'HTML' },
  json:       { color: '#94A3B8', ext: 'json',  label: 'JSON' },
  rust:       { color: '#E8572A', ext: 'rs',    label: 'Rust' },
  go:         { color: '#00ADD8', ext: 'go',    label: 'Go' },
  java:       { color: '#60A5FA', ext: 'java',  label: 'Java' },
  sql:        { color: '#60A5FA', ext: 'sql',   label: 'SQL' },
  yaml:       { color: '#94A3B8', ext: 'yml',   label: 'YAML' },
  yml:        { color: '#94A3B8', ext: 'yml',   label: 'YAML' },
  xml:        { color: '#E8572A', ext: 'xml',   label: 'XML' },
  cpp:        { color: '#60A5FA', ext: 'cpp',   label: 'C++' },
  c:          { color: '#94A3B8', ext: 'c',     label: 'C' },
  ruby:       { color: '#EF4444', ext: 'rb',    label: 'Ruby' },
  php:        { color: '#A78BFA', ext: 'php',   label: 'PHP' },
  swift:      { color: '#E8572A', ext: 'swift', label: 'Swift' },
  kotlin:     { color: '#A78BFA', ext: 'kt',    label: 'Kotlin' },
  dart:       { color: '#60A5FA', ext: 'dart',  label: 'Dart' },
  markdown:   { color: '#94A3B8', ext: 'md',    label: 'Markdown' },
  md:         { color: '#94A3B8', ext: 'md',    label: 'Markdown' },
  text:       { color: '#5A6272', ext: 'txt',   label: 'Text' },
};

const MAX_COLLAPSED_LINES = 20;

/* ─── Icon button ─────────────────────────────────────────── */
function Btn({
  onClick, title, active, children,
}: {
  onClick: () => void;
  title?: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [hov, setHov] = useState(false);
  return (
    <motion.button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      whileTap={{ scale: 0.9 }}
      style={{
        width: 28,
        height: 28,
        borderRadius: 7,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: active
          ? 'rgba(96,165,250,0.12)'
          : hov ? 'rgba(255,255,255,0.07)' : 'transparent',
        border: active ? '1px solid rgba(96,165,250,0.2)' : '1px solid transparent',
        color: active ? '#60A5FA' : hov ? '#EEEEF0' : '#5A6272',
        cursor: 'pointer',
        flexShrink: 0,
        transition: 'all 0.12s ease',
      }}
    >
      {children}
    </motion.button>
  );
}

/* ════════════════════════════════════════════════════════════
   CODE BLOCK
════════════════════════════════════════════════════════════ */
export default function CodeBlock({ code, language = 'text' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const [wrapped, setWrapped] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const lang = language.toLowerCase().trim();
  const meta = LANG_META[lang] ?? { color: '#5A6272', ext: 'txt', label: lang || 'text' };
  const lines = code.split('\n');
  const isLong = lines.length > MAX_COLLAPSED_LINES;
  const displayCode = isLong && !expanded ? lines.slice(0, MAX_COLLAPSED_LINES).join('\n') : code;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${meta.ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      borderRadius: 14,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      background: '#0A0B0E',
      margin: '12px 0',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.4)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 12px 9px 14px',
        background: 'rgba(255,255,255,0.02)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        {/* Left: traffic lights + lang */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#FF5F57', '#FEBC2E', '#28C840'].map((color, i) => (
              <div key={i} style={{
                width: 9, height: 9, borderRadius: '50%',
                background: color, opacity: 0.75,
              }} />
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 6, height: 6, borderRadius: 2,
              background: meta.color, flexShrink: 0,
            }} />
            <span style={{
              fontSize: 11.5,
              fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
              color: '#8B93A4',
              letterSpacing: '0.04em',
            }}>
              {meta.label}
            </span>
            <span style={{
              fontSize: 10.5,
              color: '#363C4D',
              fontFamily: 'var(--font-mono, monospace)',
            }}>
              {lines.length} {lines.length === 1 ? 'line' : 'lines'}
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Btn onClick={() => setWrapped(v => !v)} title="Toggle wrap" active={wrapped}>
            <WrapText size={11} strokeWidth={1.6} />
          </Btn>
          <Btn onClick={handleDownload} title="Download">
            <Download size={11} strokeWidth={1.6} />
          </Btn>
          <Btn onClick={handleCopy} title={copied ? 'Copied!' : 'Copy'} active={copied}>
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="check"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.14 }}
                >
                  <Check size={11} strokeWidth={2.2} />
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ duration: 0.14 }}
                >
                  <Copy size={11} strokeWidth={1.6} />
                </motion.span>
              )}
            </AnimatePresence>
          </Btn>
        </div>
      </div>

      {/* Code area */}
      <div style={{ position: 'relative' }}>
        <SyntaxHighlighter
          language={lang}
          style={vscDarkPlus}
          showLineNumbers
          lineNumberStyle={{
            color: '#363C4D',
            fontSize: '11px',
            paddingRight: '14px',
            minWidth: '2.6em',
            userSelect: 'none',
            fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
          }}
          customStyle={{
            margin: 0,
            padding: '14px 16px',
            background: 'transparent',
            fontSize: '12.5px',
            lineHeight: '1.7',
            fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
            overflowX: wrapped ? 'hidden' : 'auto',
          }}
          wrapLongLines={wrapped}
          wrapLines
        >
          {displayCode}
        </SyntaxHighlighter>

        {/* Collapse fade */}
        {isLong && !expanded && (
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 64,
            background: 'linear-gradient(to bottom, transparent, #0A0B0E)',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Expand/collapse */}
      {isLong && (
        <div style={{
          borderTop: expanded ? '1px solid rgba(255,255,255,0.05)' : 'none',
          padding: '8px 16px',
          display: 'flex',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.01)',
        }}>
          <motion.button
            onClick={() => setExpanded(v => !v)}
            whileHover={{ color: '#EEEEF0', borderColor: 'rgba(255,255,255,0.12)' }}
            whileTap={{ scale: 0.96 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 14px',
              borderRadius: 20,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.07)',
              color: '#5A6272',
              fontSize: 11.5,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              letterSpacing: '-0.01em',
              transition: 'all 0.15s ease',
            }}
          >
            {expanded ? <ChevronUp size={11} strokeWidth={1.8} /> : <ChevronDown size={11} strokeWidth={1.8} />}
            {expanded ? 'Collapse' : `Show ${lines.length - MAX_COLLAPSED_LINES} more lines`}
          </motion.button>
        </div>
      )}
    </div>
  );
}
