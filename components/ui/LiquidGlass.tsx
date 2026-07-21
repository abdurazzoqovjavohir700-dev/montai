'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/* ─── GPU capability detection ─────────────────────────────── */
function detectGPUTier(): 'high' | 'medium' | 'low' {
  if (typeof window === 'undefined') return 'medium';
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
  if (!gl) return 'low';
  const ext = gl.getExtension('WEBGL_debug_renderer_info');
  if (!ext) return 'medium';
  const renderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string;
  const isHighEnd = /rtx|rx 6|rx 7|m1|m2|m3|apple|radeon pro|gtx 1[6-9]|gtx [2-9]/i.test(renderer);
  const isMidEnd = /gtx|intel iris|amd|geforce|radeon/i.test(renderer);
  return isHighEnd ? 'high' : isMidEnd ? 'medium' : 'low';
}

let cachedGPU: 'high' | 'medium' | 'low' | null = null;
function getGPUTier() {
  if (!cachedGPU) cachedGPU = detectGPUTier();
  return cachedGPU;
}

/* ─── Noise texture (SVG-based, no external asset) ─────────── */
const NOISE_FILTER = `
  <filter id="noise" x="0%" y="0%" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noiseOut"/>
    <feColorMatrix type="saturate" values="0" in="noiseOut" result="grayNoise"/>
    <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended"/>
    <feComposite in="blended" in2="SourceGraphic" operator="in"/>
  </filter>
`;

/* ─── Props ─────────────────────────────────────────────────── */
export interface LiquidGlassProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  blurStrength?: number;        // 20–60, default 32
  glassOpacity?: number;        // 0.04–0.16, default 0.08
  borderOpacity?: number;       // 0.05–0.25, default 0.1
  glowColor?: string;           // CSS color, default 'rgba(96,165,250,0.12)'
  glowOnHover?: boolean;
  magneticStrength?: number;    // 0–1, default 0 (disabled)
  rippleOnClick?: boolean;
  borderRadius?: number;        // default 20
  elevated?: boolean;           // more shadow, higher z-feel
  variant?: 'dark' | 'medium' | 'light';
  interactive?: boolean;        // enables mouse tracking
  noNoise?: boolean;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

/* ─── Ripple ────────────────────────────────────────────────── */
interface Ripple { id: number; x: number; y: number }

/* ════════════════════════════════════════════════════════════
   LIQUID GLASS COMPONENT
════════════════════════════════════════════════════════════ */
export function LiquidGlass({
  children, className, style,
  blurStrength = 32,
  glassOpacity = 0.08,
  borderOpacity = 0.10,
  glowColor = 'rgba(96,165,250,0.12)',
  glowOnHover = true,
  magneticStrength = 0,
  rippleOnClick = false,
  borderRadius = 20,
  elevated = false,
  variant = 'dark',
  interactive = false,
  noNoise = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: LiquidGlassProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const gpuTier = getGPUTier();

  // Adaptive blur based on GPU
  const effectiveBlur = gpuTier === 'low' ? Math.min(blurStrength, 16) : blurStrength;

  // Mouse position for reflection/tilt
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const springX = useSpring(mouseX, { stiffness: 120, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 22 });

  // Tilt
  const rotateX = useTransform(springY, [0, 1], [interactive ? 4 : 0, interactive ? -4 : 0]);
  const rotateY = useTransform(springX, [0, 1], [interactive ? -4 : 0, interactive ? 4 : 0]);

  // Magnetic drift
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 200, damping: 24 });
  const smy = useSpring(my, { stiffness: 200, damping: 24 });

  // Reflection gradient position
  const reflX = useTransform(springX, [0, 1], [0, 100]);
  const reflY = useTransform(springY, [0, 1], [0, 100]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    mouseX.set(nx);
    mouseY.set(ny);

    if (magneticStrength > 0) {
      mx.set((nx - 0.5) * rect.width * magneticStrength);
      my.set((ny - 0.5) * rect.height * magneticStrength);
    }
  }, [mouseX, mouseY, mx, my, magneticStrength]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0.5);
    mouseY.set(0.5);
    mx.set(0);
    my.set(0);
    setHovered(false);
    onMouseLeave?.();
  }, [mouseX, mouseY, mx, my, onMouseLeave]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (rippleOnClick && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const id = Date.now();
      setRipples(prev => [...prev, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }]);
      setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 700);
    }
    onClick?.();
  }, [rippleOnClick, onClick]);

  // Variant colors
  const varBg = {
    dark:   `rgba(10,11,16,${glassOpacity})`,
    medium: `rgba(20,22,30,${glassOpacity})`,
    light:  `rgba(255,255,255,${glassOpacity * 0.6})`,
  }[variant];

  const varBorder = `rgba(255,255,255,${borderOpacity})`;
  const varInnerGlow = {
    dark:   `rgba(255,255,255,${borderOpacity * 0.5})`,
    medium: `rgba(255,255,255,${borderOpacity * 0.7})`,
    light:  `rgba(255,255,255,${borderOpacity * 1.2})`,
  }[variant];

  const shadow = elevated
    ? `0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 ${varInnerGlow}`
    : `0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 ${varInnerGlow}`;

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { setHovered(true); onMouseEnter?.(); }}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        position: 'relative',
        borderRadius,
        background: varBg,
        backdropFilter: `blur(${effectiveBlur}px) saturate(1.4)`,
        WebkitBackdropFilter: `blur(${effectiveBlur}px) saturate(1.4)`,
        border: `1px solid ${varBorder}`,
        boxShadow: hovered && glowOnHover
          ? `${shadow}, 0 0 40px ${glowColor}`
          : shadow,
        overflow: 'hidden',
        ...(interactive && gpuTier !== 'low' ? {
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          perspective: 1000,
        } : {}),
        ...(magneticStrength > 0 ? { x: smx, y: smy } : {}),
        transition: 'box-shadow 0.25s ease',
        willChange: 'transform, box-shadow',
        ...style,
      }}
      animate={gpuTier !== 'low' ? { scale: hovered && glowOnHover ? 1.005 : 1 } : {}}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
    >
      {/* Noise texture overlay */}
      {!noNoise && gpuTier !== 'low' && (
        <div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, borderRadius, pointerEvents: 'none', zIndex: 0,
            opacity: 0.025,
            backgroundImage: `url("data:image/svg+xml,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='1'/></svg>")`,
            backgroundSize: '128px 128px',
            mixBlendMode: 'overlay',
          }}
        />
      )}

      {/* Dynamic reflection gradient */}
      {gpuTier !== 'low' && (
        <motion.div
          aria-hidden
          style={{
            position: 'absolute', inset: 0, borderRadius, pointerEvents: 'none', zIndex: 0,
            background: useTransform(
              [reflX, reflY],
              ([rx, ry]) => `radial-gradient(ellipse 70% 50% at ${rx}% ${ry}%, rgba(255,255,255,0.06) 0%, transparent 65%)`
            ),
            opacity: hovered ? 1 : 0.5,
            transition: 'opacity 0.3s ease',
          }}
        />
      )}

      {/* Inner highlight (top edge) */}
      <div
        aria-hidden
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent 0%, ${varInnerGlow} 30%, rgba(255,255,255,${borderOpacity * 0.8}) 50%, ${varInnerGlow} 70%, transparent 100%)`,
          borderRadius: `${borderRadius}px ${borderRadius}px 0 0`,
          pointerEvents: 'none', zIndex: 1,
        }}
      />

      {/* Specular highlight (left edge) */}
      <div
        aria-hidden
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 1,
          background: `linear-gradient(180deg, transparent 0%, ${varInnerGlow} 25%, rgba(255,255,255,${borderOpacity * 0.5}) 50%, transparent 100%)`,
          borderRadius: `${borderRadius}px 0 0 ${borderRadius}px`,
          pointerEvents: 'none', zIndex: 1,
        }}
      />

      {/* Click ripples */}
      {ripples.map(r => (
        <motion.div
          key={r.id}
          style={{
            position: 'absolute',
            left: r.x, top: r.y,
            width: 4, height: 4,
            marginLeft: -2, marginTop: -2,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            pointerEvents: 'none', zIndex: 2,
          }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 40, opacity: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        />
      ))}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </motion.div>
  );
}

/* ─── Glass Button ──────────────────────────────────────────── */
export function GlassButton({
  children, onClick, disabled, primary, danger, small, className, style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
  small?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const gpuTier = getGPUTier();
  const [pressed, setPressed] = useState(false);
  const [hov, setHov] = useState(false);

  const bg = primary
    ? 'rgba(255,255,255,0.95)'
    : danger
    ? 'rgba(239,68,68,0.1)'
    : 'rgba(255,255,255,0.06)';

  const border = primary
    ? 'rgba(255,255,255,0.2)'
    : danger
    ? 'rgba(239,68,68,0.25)'
    : 'rgba(255,255,255,0.1)';

  const color = primary ? '#08090D' : danger ? '#F87171' : '#EEEEF0';

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      animate={{
        scale: pressed ? 0.95 : hov ? 1.03 : 1,
        y: pressed ? 1 : hov ? -1 : 0,
      }}
      transition={{ type: 'spring', stiffness: 480, damping: 24 }}
      style={{
        background: hov && !primary ? `rgba(255,255,255,0.1)` : bg,
        backdropFilter: gpuTier !== 'low' ? `blur(${pressed ? 8 : 20}px)` : 'none',
        WebkitBackdropFilter: gpuTier !== 'low' ? `blur(${pressed ? 8 : 20}px)` : 'none',
        border: `1px solid ${border}`,
        borderRadius: small ? 10 : 14,
        color,
        padding: small ? '6px 14px' : '12px 24px',
        fontSize: small ? 12.5 : 14,
        fontWeight: 600,
        fontFamily: 'Inter, sans-serif',
        letterSpacing: '-0.01em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        boxShadow: hov && !pressed
          ? `0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,${primary ? 0.3 : 0.1})`
          : pressed
          ? `0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)`
          : `0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,${primary ? 0.2 : 0.07})`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        position: 'relative', overflow: 'hidden',
        transition: 'background 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease',
        willChange: 'transform',
        ...style,
      }}
    >
      {/* Button inner highlight */}
      {!primary && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)',
          pointerEvents: 'none',
        }}/>
      )}
      {children}
    </motion.button>
  );
}

/* ─── Glass Icon Button ─────────────────────────────────────── */
export function GlassIconBtn({
  children, onClick, active, title, danger, size = 30,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
  title?: string;
  danger?: boolean;
  size?: number;
}) {
  const [hov, setHov] = useState(false);
  const [pressed, setPressed] = useState(false);

  return (
    <motion.button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => { setHov(false); setPressed(false); }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      animate={{ scale: pressed ? 0.88 : hov ? 1.08 : 1, y: hov && !pressed ? -1 : 0 }}
      transition={{ type: 'spring', stiffness: 520, damping: 26 }}
      style={{
        width: size, height: size,
        borderRadius: Math.round(size * 0.3),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: active
          ? 'rgba(96,165,250,0.15)'
          : hov
          ? danger ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.08)'
          : 'transparent',
        backdropFilter: (hov || active) ? 'blur(8px)' : 'none',
        border: active
          ? '1px solid rgba(96,165,250,0.3)'
          : hov
          ? `1px solid ${danger ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.12)'}`
          : '1px solid transparent',
        color: active ? '#60A5FA' : hov ? (danger ? '#F87171' : '#EEEEF0') : '#52525B',
        cursor: 'pointer', flexShrink: 0,
        boxShadow: active ? '0 0 12px rgba(96,165,250,0.2)' : hov ? '0 4px 12px rgba(0,0,0,0.25)' : 'none',
        transition: 'background 0.12s, border-color 0.12s, color 0.12s, box-shadow 0.12s',
        willChange: 'transform',
      }}
    >
      {children}
    </motion.button>
  );
}
