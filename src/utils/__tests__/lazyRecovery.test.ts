import { describe, expect, it } from 'vitest';
import {
  LAZY_RECOVERY_RETRY_WINDOW_MS,
  canAttemptLazyRecovery,
  isRecoverableLazyImportError,
  lazyImportErrorMessage,
} from '../lazyRecovery';

describe('lazy chunk recovery', () => {
  it('recognizes browser and bundler chunk failures', () => {
    expect(isRecoverableLazyImportError(new TypeError('Failed to fetch dynamically imported module: /assets/Screen-old.js'))).toBe(true);
    expect(isRecoverableLazyImportError(new Error('Loading chunk 14 failed'))).toBe(true);
    expect(isRecoverableLazyImportError(new Error('ChunkLoadError'))).toBe(true);
    expect(isRecoverableLazyImportError(new Error('ordinary render failure'))).toBe(false);
  });

  it('allows one recovery attempt per retry window', () => {
    const now = 100_000;
    expect(canAttemptLazyRecovery(null, now)).toBe(true);
    expect(canAttemptLazyRecovery(String(now - 5_000), now)).toBe(false);
    expect(canAttemptLazyRecovery(String(now - LAZY_RECOVERY_RETRY_WINDOW_MS), now)).toBe(true);
    expect(canAttemptLazyRecovery('invalid', now)).toBe(true);
  });

  it('normalizes unknown failures for diagnostics', () => {
    expect(lazyImportErrorMessage('network import failed')).toBe('network import failed');
    expect(lazyImportErrorMessage(null)).toBe('');
  });
});
