'use client';

// Detects whether we're running inside a Capacitor native shell (Android/iOS)
// or inside Tauri (Windows/macOS/Linux desktop). Falls back gracefully on web.

let _isCapacitor: boolean | null = null;
let _isTauri: boolean | null = null;

export function isCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  if (_isCapacitor !== null) return _isCapacitor;
  _isCapacitor = !!(window as unknown as Record<string, unknown>)['Capacitor'];
  return _isCapacitor;
}

export function isTauri(): boolean {
  if (typeof window === 'undefined') return false;
  if (_isTauri !== null) return _isTauri;
  _isTauri = '__TAURI__' in window;
  return _isTauri;
}

export function isNative(): boolean {
  return isCapacitor() || isTauri();
}

export function getPlatform(): 'web' | 'android' | 'windows' | 'unknown' {
  if (isTauri()) return 'windows';
  if (isCapacitor()) {
    try {
      const cap = (window as unknown as Record<string, { getPlatform?: () => string }>)['Capacitor'];
      const plat = typeof cap?.getPlatform === 'function' ? cap.getPlatform() : undefined;
      if (plat === 'android') return 'android';
    } catch { /* ignore */ }
    return 'unknown';
  }
  return 'web';
}

/* ─── Clipboard ─────────────────────────────────────────────── */
export async function writeClipboard(text: string): Promise<void> {
  if (isCapacitor()) {
    const { Clipboard } = await import('@capacitor/clipboard');
    await Clipboard.write({ string: text });
    return;
  }
  if (isTauri()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await import('@tauri-apps/plugin-clipboard-manager' as any).catch(() => null);
      if (mod?.writeText) { await mod.writeText(text); return; }
    } catch { /* fall through */ }
  }
  await navigator.clipboard.writeText(text);
}

/* ─── Haptics ───────────────────────────────────────────────── */
export async function hapticLight(): Promise<void> {
  if (!isCapacitor()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* not critical */ }
}

export async function hapticMedium(): Promise<void> {
  if (!isCapacitor()) return;
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch { /* not critical */ }
}

/* ─── Share ─────────────────────────────────────────────────── */
export async function shareContent(title: string, text: string, url?: string): Promise<void> {
  if (isCapacitor()) {
    const { Share } = await import('@capacitor/share');
    const canShare = await Share.canShare();
    if (canShare.value) {
      await Share.share({ title, text, url, dialogTitle: title });
      return;
    }
  }
  if (navigator.share) {
    await navigator.share({ title, text, url });
    return;
  }
  await writeClipboard(text);
}

/* ─── File Download ─────────────────────────────────────────── */
export async function downloadFile(filename: string, content: string, mimeType = 'text/plain'): Promise<void> {
  if (isCapacitor()) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const isBase64 = mimeType.includes('pdf') || mimeType.includes('octet');
    await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Documents,
      encoding: isBase64 ? undefined : Encoding.UTF8,
      recursive: true,
    });
    return;
  }
  if (isTauri()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tauriFs = await import('@tauri-apps/plugin-fs' as any).catch(() => null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tauriDialog = await import('@tauri-apps/plugin-dialog' as any).catch(() => null);
      if (tauriFs && tauriDialog) {
        const savePath = await tauriDialog.save({ defaultPath: filename, filters: [{ name: 'All Files', extensions: ['*'] }] });
        if (savePath) {
          const enc = new TextEncoder();
          await tauriFs.writeFile(savePath, enc.encode(content));
          return;
        }
      }
    } catch { /* fall through */ }
  }
  // Web fallback
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Camera / Image Picker ─────────────────────────────────── */
export async function pickImageFromCamera(): Promise<{ base64: string; mimeType: string } | null> {
  if (isCapacitor()) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera,
      });
      return photo.base64String
        ? { base64: photo.base64String, mimeType: `image/${photo.format}` }
        : null;
    } catch { return null; }
  }
  return null;
}

export async function pickImageFromGallery(): Promise<{ base64: string; mimeType: string } | null> {
  if (isCapacitor()) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    try {
      const photo = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos,
      });
      return photo.base64String
        ? { base64: photo.base64String, mimeType: `image/${photo.format}` }
        : null;
    } catch { return null; }
  }
  return null;
}

/* ─── Local Notifications ───────────────────────────────────── */
export async function scheduleNotification(title: string, body: string, id = Date.now()): Promise<void> {
  if (!isCapacitor()) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const perm = await LocalNotifications.requestPermissions();
    if (perm.display === 'granted') {
      await LocalNotifications.schedule({
        notifications: [{ title, body, id, schedule: { at: new Date(Date.now() + 100) } }],
      });
    }
  } catch { /* not critical */ }
}
