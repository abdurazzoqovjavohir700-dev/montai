'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface Props {
  src: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightbox({ src, isOpen, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan]   = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState(false);
  const [mounted, setMounted] = useState(false);
  const startRef = useRef<{ sx: number; sy: number; ox: number; oy: number } | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) { setZoom(1); setPan({ x: 0, y: 0 }); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  /* Prevent body scroll while open */
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else        document.body.style.overflow = '';
    return ()  => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation();
    const factor = e.deltaY > 0 ? 0.88 : 1.12;
    setZoom(z => Math.max(0.4, Math.min(5, z * factor)));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setDrag(true);
    startRef.current = { sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
  }, [zoom, pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag || !startRef.current) return;
    setPan({
      x: startRef.current.ox + e.clientX - startRef.current.sx,
      y: startRef.current.oy + e.clientY - startRef.current.sy,
    });
  }, [drag]);

  const onMouseUp = useCallback(() => {
    setDrag(false);
    startRef.current = null;
  }, []);

  const reset = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }); }, []);

  const onDoubleClick = useCallback(() => {
    if (zoom !== 1) reset();
    else setZoom(2.5);
  }, [zoom, reset]);

  const download = useCallback(() => {
    const a = document.createElement('a');
    a.href = src;
    a.download = 'montai-image.jpg';
    a.click();
  }, [src]);

  if (!mounted) return null;

  const controls = [
    { icon: <ZoomIn size={15} strokeWidth={1.5} />,     fn: () => setZoom(z => Math.min(5, z * 1.35)), title: 'Kattalashtirish' },
    { icon: <ZoomOut size={15} strokeWidth={1.5} />,    fn: () => setZoom(z => Math.max(0.4, z / 1.35)), title: 'Kichiklashtirish' },
    { icon: <RotateCcw size={15} strokeWidth={1.5} />,  fn: reset,    title: "Qayta o'rnatish" },
    { icon: <Download size={15} strokeWidth={1.5} />,   fn: download, title: 'Yuklab olish' },
    { icon: <X size={15} strokeWidth={1.5} />,          fn: onClose,  title: 'Yopish' },
  ];

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 100000,
            background: 'rgba(0,0,0,0.93)',
            backdropFilter: 'blur(18px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Control bar */}
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'fixed', top: 16, right: 16,
              display: 'flex', gap: 6, zIndex: 100001,
            }}
          >
            {controls.map((c, i) => (
              <button
                key={i}
                onClick={c.fn}
                title={c.title}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,255,255,0.09)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#D4D4D8', cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.16)');
                  (e.currentTarget.style.color = '#fff');
                }}
                onMouseLeave={e => {
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.09)');
                  (e.currentTarget.style.color = '#D4D4D8');
                }}
              >
                {c.icon}
              </button>
            ))}
          </div>

          {/* Zoom % badge */}
          {zoom !== 1 && (
            <div style={{
              position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20,
              padding: '4px 14px', color: '#A1A1AA', fontSize: 12,
              fontFamily: 'Inter, sans-serif', pointerEvents: 'none', zIndex: 100001,
            }}>
              {Math.round(zoom * 100)}%
            </div>
          )}

          {/* Hint */}
          <div style={{
            position: 'fixed', bottom: 20, left: 20,
            color: '#3F3F46', fontSize: 11, fontFamily: 'Inter, sans-serif',
            pointerEvents: 'none', zIndex: 100001,
          }}>
            Double-click to toggle zoom · Scroll to zoom · Drag to pan
          </div>

          {/* Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.84 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.84 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onClick={e => e.stopPropagation()}
            onWheel={onWheel}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onDoubleClick={onDoubleClick}
            style={{
              cursor: zoom > 1 ? (drag ? 'grabbing' : 'grab') : 'zoom-in',
              userSelect: 'none', touchAction: 'none',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Preview"
              draggable={false}
              style={{
                maxWidth: '88vw', maxHeight: '88vh',
                objectFit: 'contain',
                borderRadius: 10,
                boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transition: drag ? 'none' : 'transform 0.18s ease',
                display: 'block',
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
