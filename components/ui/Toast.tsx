'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle, RefreshCw } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────── */
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
  description?: string;
  duration?: number;
  onRetry?: () => void;
}

interface ToastItem extends ToastOptions {
  id: string;
  type: ToastType;
  message: string;
}

/* ─── Module-level state (callable outside React) ────────── */
type Setter = React.Dispatch<React.SetStateAction<ToastItem[]>>;
let _set: Setter | null = null;
const _timers = new Map<string, ReturnType<typeof setTimeout>>();

function _dismiss(id: string) {
  clearTimeout(_timers.get(id));
  _timers.delete(id);
  _set?.(prev => prev.filter(t => t.id !== id));
}

function _add(type: ToastType, message: string, opts?: ToastOptions) {
  if (!_set) return;
  const id = crypto.randomUUID();
  const duration = opts?.duration ?? (type === 'error' ? 6000 : type === 'success' ? 3000 : 4500);
  _set(prev => [...prev.slice(-4), { id, type, message, ...opts }]);
  _timers.set(id, setTimeout(() => _dismiss(id), duration));
}

/* ─── Public API ─────────────────────────────────────────── */
export const toast = {
  success: (msg: string, opts?: ToastOptions) => _add('success', msg, opts),
  error:   (msg: string, opts?: ToastOptions) => _add('error',   msg, opts),
  info:    (msg: string, opts?: ToastOptions) => _add('info',    msg, opts),
  warning: (msg: string, opts?: ToastOptions) => _add('warning', msg, opts),
  dismiss: _dismiss,
};

/* ─── Constants ──────────────────────────────────────────── */
const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={15} strokeWidth={1.5} />,
  error:   <AlertCircle  size={15} strokeWidth={1.5} />,
  info:    <Info         size={15} strokeWidth={1.5} />,
  warning: <AlertTriangle size={15} strokeWidth={1.5} />,
};

const PALETTE: Record<ToastType, { icon: string; border: string; bg: string }> = {
  success: { icon: '#22C55E', border: 'rgba(34,197,94,0.22)',   bg: 'rgba(34,197,94,0.07)'   },
  error:   { icon: '#EF4444', border: 'rgba(239,68,68,0.22)',   bg: 'rgba(239,68,68,0.07)'   },
  info:    { icon: '#60A5FA', border: 'rgba(96,165,250,0.22)',  bg: 'rgba(96,165,250,0.07)'  },
  warning: { icon: '#F59E0B', border: 'rgba(245,158,11,0.22)',  bg: 'rgba(245,158,11,0.07)'  },
};

/* ─── Single toast card ──────────────────────────────────── */
function ToastCard({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const pal = PALETTE[item.type];
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 10, scale: 0.96  }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 11,
        padding: '12px 14px',
        background: '#131313',
        border: `1px solid ${pal.border}`,
        borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04)',
        minWidth: 260, maxWidth: 360,
        width: 'max-content',
      }}
    >
      {/* Icon */}
      <div style={{ color: pal.icon, marginTop: 1, flexShrink: 0 }}>{ICONS[item.type]}</div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 13.5, fontWeight: 500,
          color: '#F4F4F5', fontFamily: 'Inter, sans-serif', lineHeight: 1.45,
        }}>
          {item.message}
        </p>

        {item.description && (
          <p style={{
            margin: '4px 0 0', fontSize: 12.5, lineHeight: 1.45,
            color: '#71717A', fontFamily: 'Inter, sans-serif',
          }}>
            {item.description}
          </p>
        )}

        {item.onRetry && (
          <button
            onClick={() => { item.onRetry?.(); onDismiss(item.id); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              marginTop: 10, padding: '4px 10px', borderRadius: 6,
              border: `1px solid ${pal.border}`,
              background: pal.bg, color: pal.icon,
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <RefreshCw size={11} strokeWidth={2} />
            Qayta urinish
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(item.id)}
        style={{
          flexShrink: 0, padding: 3, borderRadius: 5,
          border: 'none', background: 'transparent',
          color: '#52525B', cursor: 'pointer', lineHeight: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#A1A1AA')}
        onMouseLeave={e => (e.currentTarget.style.color = '#52525B')}
      >
        <X size={13} strokeWidth={1.5} />
      </button>
    </motion.div>
  );
}

/* ─── Container — place once in the app ─────────────────── */
export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    _set = setToasts;
    return () => { _set = null; };
  }, []);

  const onDismiss = useCallback((id: string) => _dismiss(id), []);

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 20, zIndex: 99998,
      display: 'flex', flexDirection: 'column-reverse', gap: 8,
      alignItems: 'flex-end', pointerEvents: 'none',
    }}>
      <AnimatePresence mode="popLayout">
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'auto' }}>
            <ToastCard item={t} onDismiss={onDismiss} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
