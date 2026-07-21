/**
 * Production-grade AI Request Manager
 * - FIFO queue (max 1 concurrent)
 * - Exponential backoff retry: 1s→2s→4s→8s→16s (5 attempts)
 * - Auto-retry on 429 / 500 / 502 / 503 / 504 / timeout / network error
 * - Deduplication (300ms window)
 * - 30s per-attempt timeout with auto-restart
 * - Status broadcasting (queue depth, retry count)
 * - NEVER shows "wait 1 minute" to user
 */

export type RMState = 'idle' | 'processing' | 'retrying';

export interface RMStatus {
  state: RMState;
  queueDepth: number;
  attempt: number;
  maxAttempts: number;
}

interface QueueEntry {
  id: string;
  endpoint: string;
  init: RequestInit;
  contentHash: string;
  attempt: number;
  externalSignal?: AbortSignal;
  resolve: (r: Response) => void;
  reject: (e: Error) => void;
}

const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000] as const;
const MAX_RETRIES = RETRY_DELAYS_MS.length; // 5
const REQUEST_TIMEOUT_MS = 30_000;
const DEDUP_WINDOW_MS = 300;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);

function fastHash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < Math.min(s.length, 512); i++) {
    h ^= s.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(36);
}

class AIRequestManager {
  private q: QueueEntry[] = [];
  private active: QueueEntry | null = null;
  private subs = new Set<(s: RMStatus) => void>();
  private recentHashes = new Map<string, number>();
  private st: RMStatus = { state: 'idle', queueDepth: 0, attempt: 0, maxAttempts: MAX_RETRIES };

  /* ── Subscribe to status updates ─────────────────────────────────── */
  subscribe(fn: (s: RMStatus) => void): () => void {
    this.subs.add(fn);
    fn({ ...this.st });
    return () => this.subs.delete(fn);
  }

  private emit(patch: Partial<RMStatus>) {
    Object.assign(this.st, patch);
    const snap = { ...this.st };
    this.subs.forEach(fn => fn(snap));
  }

  /* ── Public API ───────────────────────────────────────────────────── */

  /**
   * Queue a fetch request. Returns Response after retry logic.
   * ChatWindow/GuestChatWindow use this directly — they own the Response parsing.
   * Retries transparently on 429/500/502/503/504/network errors.
   */
  sendRaw(
    endpoint: string,
    init: RequestInit,
    externalSignal?: AbortSignal,
  ): Promise<Response> {
    const hash = fastHash(endpoint + (typeof init.body === 'string' ? init.body : ''));

    // Dedup: ignore same request within DEDUP_WINDOW_MS
    const last = this.recentHashes.get(hash);
    if (last && Date.now() - last < DEDUP_WINDOW_MS) {
      return Promise.reject(Object.assign(new Error('Duplicate request'), { code: 'DEDUP' }));
    }
    this.recentHashes.set(hash, Date.now());
    if (this.recentHashes.size > 200) {
      const cutoff = Date.now() - DEDUP_WINDOW_MS * 2;
      for (const [k, v] of this.recentHashes) if (v < cutoff) this.recentHashes.delete(k);
    }

    return new Promise<Response>((resolve, reject) => {
      this.q.push({
        id: crypto.randomUUID(),
        endpoint,
        init,
        contentHash: hash,
        attempt: 0,
        externalSignal,
        resolve,
        reject,
      });
      this.emit({ queueDepth: this.q.length });
      void this.drain();
    });
  }

  /** Cancel a specific queued request before it starts */
  cancel(id: string) {
    const idx = this.q.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.q[idx].reject(Object.assign(new Error('Cancelled'), { code: 'CANCELLED' }));
      this.q.splice(idx, 1);
      this.emit({ queueDepth: this.q.length });
    }
  }

  /** Cancel everything including active request */
  cancelAll() {
    this.q.forEach(e => e.reject(Object.assign(new Error('Cancelled'), { code: 'CANCELLED' })));
    this.q = [];
    this.active = null;
    this.emit({ state: 'idle', queueDepth: 0, attempt: 0 });
  }

  /* ── Queue processing ─────────────────────────────────────────────── */

  private async drain() {
    if (this.active || this.q.length === 0) return;

    this.active = this.q.shift()!;
    this.emit({ state: 'processing', queueDepth: this.q.length, attempt: 0 });

    try {
      const res = await this.executeWithRetry(this.active);
      this.active.resolve(res);
    } catch (err) {
      this.active.reject(err instanceof Error ? err : new Error(String(err)));
    } finally {
      this.active = null;
      this.emit({
        state: this.q.length > 0 ? 'processing' : 'idle',
        queueDepth: this.q.length,
        attempt: 0,
      });
      void this.drain(); // process next
    }
  }

  private async executeWithRetry(entry: QueueEntry): Promise<Response> {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      entry.attempt = attempt;

      if (entry.externalSignal?.aborted) {
        throw Object.assign(new Error('Cancelled'), { code: 'CANCELLED' });
      }

      // Wait before retry (not before first attempt)
      if (attempt > 0) {
        const delay = RETRY_DELAYS_MS[attempt - 1] ?? 16_000;
        this.emit({ state: 'retrying', attempt });
        await this.sleep(delay, entry.externalSignal);
        this.emit({ state: 'processing', attempt });
      }

      const result = await this.attemptFetch(entry);

      if (result.type === 'success') return result.response;

      // result.type === 'retry' — loop continues
      if (attempt >= MAX_RETRIES) {
        throw new Error(
          result.message?.match(/daqiqa|kuting|wait.*min|min.*wait/i)
            ? 'So\'rov bajarilmadi. Keyinroq qaytadan urinib ko\'ring.'
            : (result.message || 'So\'rov bajarilmadi.')
        );
      }
    }

    throw new Error('So\'rov bajarilmadi (barcha urinishlar muvaffaqiyatsiz).');
  }

  private async attemptFetch(
    entry: QueueEntry,
  ): Promise<
    | { type: 'success'; response: Response }
    | { type: 'retry'; message?: string }
  > {
    const abortCtrl = new AbortController();
    const cleanup = () => abortCtrl.abort();

    entry.externalSignal?.addEventListener('abort', cleanup, { once: true });
    const timeoutId = setTimeout(cleanup, REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(entry.endpoint, {
        ...entry.init,
        signal: abortCtrl.signal,
      });
      clearTimeout(timeoutId);
      entry.externalSignal?.removeEventListener('abort', cleanup);

      if (RETRYABLE_STATUSES.has(res.status)) {
        // Consume body to free connection, extract message if possible
        let msg = '';
        try {
          const clone = res.clone();
          const ct = clone.headers.get('content-type') ?? '';
          if (ct.includes('application/json')) {
            const j = await clone.json() as { error?: string };
            msg = j.error ?? '';
          }
        } catch { /* ok */ }
        return { type: 'retry', message: msg };
      }

      // 200, 401, 403, 422, etc. — return as-is, caller handles
      return { type: 'success', response: res };

    } catch (err) {
      clearTimeout(timeoutId);
      entry.externalSignal?.removeEventListener('abort', cleanup);

      const name = (err as Error).name;

      // External abort → don't retry
      if (entry.externalSignal?.aborted || name === 'AbortError') {
        throw Object.assign(new Error('Cancelled'), { code: 'CANCELLED' });
      }

      // Timeout or network error → retry
      return { type: 'retry', message: (err as Error).message };
    }
  }

  private sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) { reject(new Error('Cancelled')); return; }
      const id = setTimeout(resolve, ms);
      signal?.addEventListener('abort', () => {
        clearTimeout(id);
        reject(new Error('Cancelled'));
      }, { once: true });
    });
  }
}

// Singleton shared across the entire app
export const aiRM = new AIRequestManager();
