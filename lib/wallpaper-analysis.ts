'use client';

/* ─────────────────────────────────────────────────────────────
   WALLPAPER ANALYSIS ENGINE
   Analyzes an image (data URL) and returns a WallpaperProfile
   used by the Adaptive Focus Mode to set CSS variables.
   ───────────────────────────────────────────────────────────── */

export type WallpaperCategory =
  | 'dark'       // Very dark bg — text is naturally readable
  | 'bright'     // Very bright — needs heavy overlay
  | 'minimal'    // Low complexity, moderate luminance — elegant glass
  | 'busy'       // High variance/complexity — needs strong overlay + blur
  | 'colorful'   // High saturation — needs slight desaturation
  | 'natural';   // Average balanced image

export interface WallpaperProfile {
  luminance:  number;  // 0–1 (dark → bright)
  complexity: number;  // 0–1 (simple → busy) — stddev of luminance
  saturation: number;  // 0–1 (gray → vivid)
  contrast:   number;  // 0–1 (flat → high)
  focusScore: number;  // 0–100 (90+ = no adaptation needed)
  category:   WallpaperCategory;

  // Recommended CSS values
  overlayOpacity: number;    // 0–0.75
  blurPx:         number;    // 0–28
  glassOpacity:   number;    // 0.7–0.95
  glassBorderAlpha: number;  // 0.05–0.15
  chatWidthBoost: number;    // extra px added to 780 base
  msgBubbleOpacity: number;  // extra opacity on bubbles
}

const SAMPLE_SIZE = 64; // px — good balance of speed vs accuracy

export async function analyzeWallpaper(dataUrl: string): Promise<WallpaperProfile> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const raw = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;

        const pixels = SAMPLE_SIZE * SAMPLE_SIZE;
        let sumLum = 0, sumSat = 0;
        const lumArr: number[] = [];

        for (let i = 0; i < raw.length; i += 4) {
          const r = raw[i] / 255;
          const g = raw[i + 1] / 255;
          const b = raw[i + 2] / 255;

          // Relative luminance (WCAG formula)
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          lumArr.push(lum);
          sumLum += lum;

          // HSL saturation approximation
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const l = (max + min) / 2;
          const sat = max === min ? 0 : (max - min) / (1 - Math.abs(2 * l - 1));
          sumSat += sat;
        }

        const luminance  = sumLum / pixels;
        const saturation = sumSat / pixels;

        // Variance of luminance = complexity indicator
        let variance = 0;
        for (const l of lumArr) {
          variance += (l - luminance) ** 2;
        }
        const stddev      = Math.sqrt(variance / pixels);
        const complexity  = Math.min(1, stddev * 4); // normalize: 0.25 stddev → 1.0
        const contrast    = Math.min(1, stddev * 6);

        // ─── Category classification ───────────────────────────
        let category: WallpaperCategory;
        if (luminance < 0.18)                   category = 'dark';
        else if (luminance > 0.70)              category = 'bright';
        else if (complexity > 0.52)             category = 'busy';
        else if (saturation > 0.55)             category = 'colorful';
        else if (complexity < 0.18)             category = 'minimal';
        else                                     category = 'natural';

        // ─── Focus Score (0–100) ─────────────────────────────
        // Perfect score = dark+low-complexity. Penalties for brightness and busyness.
        const brightPenalty    = Math.max(0, luminance - 0.25) * 55;
        const complexityPenalty = complexity * 40;
        const satPenalty       = Math.max(0, saturation - 0.5) * 15;
        const rawFocus = 100 - brightPenalty - complexityPenalty - satPenalty;
        const focusScore = Math.round(Math.max(0, Math.min(100, rawFocus)));

        // ─── Recommended CSS values ──────────────────────────
        let overlayOpacity: number;
        let blurPx: number;
        let glassOpacity: number;
        let glassBorderAlpha: number;
        let chatWidthBoost: number;
        let msgBubbleOpacity: number;

        switch (category) {
          case 'dark':
            overlayOpacity   = Math.min(0.12, luminance * 0.5);
            blurPx           = 0;
            glassOpacity     = 0.70;
            glassBorderAlpha = 0.06;
            chatWidthBoost   = 0;
            msgBubbleOpacity = 0.08;
            break;

          case 'bright':
            overlayOpacity   = 0.48 + luminance * 0.20;
            blurPx           = 20;
            glassOpacity     = 0.94;
            glassBorderAlpha = 0.10;
            chatWidthBoost   = 0;
            msgBubbleOpacity = 0.16;
            break;

          case 'busy':
            overlayOpacity   = 0.35 + complexity * 0.25;
            blurPx           = 18 + complexity * 10;
            glassOpacity     = 0.90;
            glassBorderAlpha = 0.12;
            chatWidthBoost   = 20; // slightly narrower container = more padding
            msgBubbleOpacity = 0.14;
            break;

          case 'colorful':
            overlayOpacity   = 0.28;
            blurPx           = 14;
            glassOpacity     = 0.86;
            glassBorderAlpha = 0.09;
            chatWidthBoost   = 0;
            msgBubbleOpacity = 0.12;
            break;

          case 'minimal':
            overlayOpacity   = 0.06;
            blurPx           = 8;
            glassOpacity     = 0.72;
            glassBorderAlpha = 0.06;
            chatWidthBoost   = -10; // allow slightly wider content
            msgBubbleOpacity = 0.08;
            break;

          case 'natural':
          default:
            overlayOpacity   = 0.22 + complexity * 0.15;
            blurPx           = 12 + complexity * 8;
            glassOpacity     = 0.82;
            glassBorderAlpha = 0.08;
            chatWidthBoost   = 0;
            msgBubbleOpacity = 0.10;
        }

        resolve({
          luminance, complexity, saturation, contrast, focusScore, category,
          overlayOpacity, blurPx, glassOpacity, glassBorderAlpha,
          chatWidthBoost, msgBubbleOpacity,
        });
      } catch {
        resolve(defaultProfile());
      }
    };
    img.onerror = () => resolve(defaultProfile());
    img.src = dataUrl;
  });
}

function defaultProfile(): WallpaperProfile {
  return {
    luminance: 0.2, complexity: 0.2, saturation: 0.2, contrast: 0.2,
    focusScore: 90, category: 'dark',
    overlayOpacity: 0.08, blurPx: 0, glassOpacity: 0.76,
    glassBorderAlpha: 0.06, chatWidthBoost: 0, msgBubbleOpacity: 0.09,
  };
}

/* Cache by data URL (first 100 chars as key to avoid huge map keys) */
const profileCache = new Map<string, WallpaperProfile>();

export async function analyzeWallpaperCached(dataUrl: string): Promise<WallpaperProfile> {
  const key = dataUrl.slice(0, 120);
  if (profileCache.has(key)) return profileCache.get(key)!;
  const profile = await analyzeWallpaper(dataUrl);
  profileCache.set(key, profile);
  return profile;
}

/* Apply profile to CSS custom properties on <html> */
export function applyFocusProfile(profile: WallpaperProfile, mode: string = 'auto') {
  const root = document.documentElement;

  if (mode !== 'auto') {
    // User overrode mode — apply presets
    if (mode === 'minimal') {
      root.style.setProperty('--focus-overlay', '0.06');
      root.style.setProperty('--focus-blur', '8px');
      root.style.setProperty('--focus-glass-opacity', '0.72');
      root.style.setProperty('--focus-glass-border-alpha', '0.06');
    } else if (mode === 'glass') {
      root.style.setProperty('--focus-overlay', '0.18');
      root.style.setProperty('--focus-blur', '20px');
      root.style.setProperty('--focus-glass-opacity', '0.85');
      root.style.setProperty('--focus-glass-border-alpha', '0.10');
    } else if (mode === 'focus') {
      root.style.setProperty('--focus-overlay', '0.40');
      root.style.setProperty('--focus-blur', '24px');
      root.style.setProperty('--focus-glass-opacity', '0.94');
      root.style.setProperty('--focus-glass-border-alpha', '0.14');
    }
    root.setAttribute('data-focus-mode', mode);
    root.setAttribute('data-bg-category', profile.category);
    root.style.setProperty('--focus-score', String(profile.focusScore));
    return;
  }

  // Auto mode — use computed profile values
  root.style.setProperty('--focus-overlay', String(profile.overlayOpacity));
  root.style.setProperty('--focus-blur', `${Math.round(profile.blurPx)}px`);
  root.style.setProperty('--focus-glass-opacity', String(profile.glassOpacity));
  root.style.setProperty('--focus-glass-border-alpha', String(profile.glassBorderAlpha));
  root.style.setProperty('--focus-msg-bubble-opacity', String(profile.msgBubbleOpacity));
  root.style.setProperty('--focus-chat-width', `${780 + profile.chatWidthBoost}px`);
  root.style.setProperty('--focus-score', String(profile.focusScore));
  root.setAttribute('data-focus-mode', 'auto');
  root.setAttribute('data-bg-category', profile.category);

  // Brightness luminance hint for CSS
  root.setAttribute('data-bg-lum', profile.luminance > 0.5 ? 'bright' : 'dark');
}

export function clearFocusProfile() {
  const root = document.documentElement;
  const vars = [
    '--focus-overlay', '--focus-blur', '--focus-glass-opacity',
    '--focus-glass-border-alpha', '--focus-msg-bubble-opacity',
    '--focus-chat-width', '--focus-score',
  ];
  vars.forEach(v => root.style.removeProperty(v));
  root.removeAttribute('data-focus-mode');
  root.removeAttribute('data-bg-category');
  root.removeAttribute('data-bg-lum');
}
