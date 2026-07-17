'use client';

/* ─────────────────────────────────────────────────────────────
   ADAPTIVE WALLPAPER ENGINE
   Handles focal point detection, fit modes, orientation,
   HiDPI, and device-specific positioning.
   ───────────────────────────────────────────────────────────── */

export type WallpaperFit =
  | 'smart-cover'    // cover + smart focal point positioning (DEFAULT)
  | 'cover'          // standard cover — always center
  | 'contain'        // show whole image (may have bars)
  | 'fill-width'     // fill horizontally, may leave vertical gaps
  | 'fill-height'    // fill vertically, may leave horizontal gaps
  | 'original'       // natural image size, no scaling
  | 'adaptive-crop'; // cover + extreme edge focal points are clamped

export type WallpaperPosition =
  | 'auto'           // derive from focal point analysis
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right';

export interface FocalPoint {
  x: number; // 0–1 left→right
  y: number; // 0–1 top→bottom
}

export interface WallpaperLayout {
  cssSize: string;
  cssPosition: string;
  focalPoint: FocalPoint;
  device: 'phone' | 'tablet' | 'desktop' | 'ultrawide';
}

// ─── Focal point detection (saliency-weighted centroid) ──────

const SAMPLE = 32;

export async function detectFocalPoint(dataUrl: string): Promise<FocalPoint> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE;
        canvas.height = SAMPLE;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { resolve({ x: 0.5, y: 0.5 }); return; }
        ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        const raw = ctx.getImageData(0, 0, SAMPLE, SAMPLE).data;

        let wX = 0, wY = 0, total = 0;

        for (let py = 0; py < SAMPLE; py++) {
          for (let px = 0; px < SAMPLE; px++) {
            const i = (py * SAMPLE + px) * 4;
            const r = raw[i]   / 255;
            const g = raw[i+1] / 255;
            const b = raw[i+2] / 255;

            // WCAG relative luminance
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;

            // HSL saturation approximation
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const lhsl = (max + min) / 2;
            const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * lhsl - 1));

            // Saliency: high saturation + mid-range luminance = visually interesting
            // Pixels near pure black/white are weighted less
            const saliency = sat * 0.65 + (1 - Math.abs(lum * 2 - 1)) * 0.35;

            wX += px * saliency;
            wY += py * saliency;
            total += saliency;
          }
        }

        if (total === 0) { resolve({ x: 0.5, y: 0.5 }); return; }

        resolve({
          x: Math.max(0, Math.min(1, wX / total / (SAMPLE - 1))),
          y: Math.max(0, Math.min(1, wY / total / (SAMPLE - 1))),
        });
      } catch {
        resolve({ x: 0.5, y: 0.5 });
      }
    };
    img.onerror = () => resolve({ x: 0.5, y: 0.5 });
    img.src = dataUrl;
  });
}

// ─── Cache focal points by image key ─────────────────────────
const focalCache = new Map<string, FocalPoint>();

export async function detectFocalPointCached(dataUrl: string): Promise<FocalPoint> {
  const key = dataUrl.slice(0, 120);
  if (focalCache.has(key)) return focalCache.get(key)!;
  const fp = await detectFocalPoint(dataUrl);
  focalCache.set(key, fp);
  return fp;
}

// ─── Device category ─────────────────────────────────────────
export function getDeviceCategory(): WallpaperLayout['device'] {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 640)  return 'phone';
  if (w < 1024) return 'tablet';
  if (w > 2400) return 'ultrawide';
  return 'desktop';
}

// ─── Focal point → CSS background-position ───────────────────
export function focalToPosition(
  focal: FocalPoint,
  override: WallpaperPosition,
  fit: WallpaperFit,
): string {
  // Hard overrides
  if (override === 'center') return 'center center';
  if (override === 'top')    return 'center top';
  if (override === 'bottom') return 'center bottom';
  if (override === 'left')   return 'left center';
  if (override === 'right')  return 'right center';

  // Non-cover modes: center works best
  if (fit === 'contain' || fit === 'original') return 'center center';

  // Auto: use focal point percentage positioning
  const { x, y } = focal;

  // adaptive-crop: clamp edge focal points to avoid cropping important content
  if (fit === 'adaptive-crop') {
    const cx = Math.max(0.25, Math.min(0.75, x));
    const cy = Math.max(0.20, Math.min(0.80, y));
    return `${Math.round(cx * 100)}% ${Math.round(cy * 100)}%`;
  }

  // smart-cover and cover with auto position
  return `${Math.round(x * 100)}% ${Math.round(y * 100)}%`;
}

// ─── Fit mode → CSS background-size ──────────────────────────
export function fitToSize(fit: WallpaperFit): string {
  switch (fit) {
    case 'cover':
    case 'smart-cover':
    case 'adaptive-crop': return 'cover';
    case 'contain':       return 'contain';
    case 'fill-width':    return '100% auto';
    case 'fill-height':   return 'auto 100%';
    case 'original':      return 'auto';
    default:              return 'cover';
  }
}

// ─── Compute full layout ──────────────────────────────────────
export function computeLayout(
  focal: FocalPoint,
  fit: WallpaperFit,
  position: WallpaperPosition,
): WallpaperLayout {
  const device = getDeviceCategory();
  return {
    cssSize: fitToSize(fit),
    cssPosition: focalToPosition(focal, position, fit),
    focalPoint: focal,
    device,
  };
}

// ─── Apply layout to CSS variables ───────────────────────────
export function applyWallpaperLayout(layout: WallpaperLayout) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.setProperty('--wp-size', layout.cssSize);
  root.style.setProperty('--wp-position', layout.cssPosition);
  root.setAttribute('data-wp-device', layout.device);
}

// ─── Orientation change listener ─────────────────────────────
let _orientationHandler: (() => void) | null = null;
let _mediaQuery: MediaQueryList | null = null;

export function setupOrientationWatcher(
  focal: FocalPoint,
  fit: WallpaperFit,
  position: WallpaperPosition,
) {
  cleanupOrientationWatcher();

  const update = () => {
    const layout = computeLayout(focal, fit, position);
    applyWallpaperLayout(layout);
  };

  // Use orientationchange + resize for maximum device compatibility
  _orientationHandler = update;
  window.addEventListener('orientationchange', update);
  window.addEventListener('resize', update);

  // Also watch via matchMedia for foldables
  _mediaQuery = window.matchMedia('(orientation: portrait)');
  _mediaQuery.addEventListener('change', update);
}

export function cleanupOrientationWatcher() {
  if (_orientationHandler) {
    window.removeEventListener('orientationchange', _orientationHandler);
    window.removeEventListener('resize', _orientationHandler);
    _orientationHandler = null;
  }
  if (_mediaQuery) {
    _mediaQuery.removeEventListener('change', _orientationHandler!);
    _mediaQuery = null;
  }
}

// ─── Remove wallpaper layout CSS vars ────────────────────────
export function clearWallpaperLayout() {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.style.removeProperty('--wp-size');
  root.style.removeProperty('--wp-position');
  root.removeAttribute('data-wp-device');
  cleanupOrientationWatcher();
}
