import { lazy, type ComponentType } from 'react';
import { checkpointBeforeUnload } from '../store/gameStore';
import { canAttemptLazyRecovery, isRecoverableLazyImportError } from '../utils/lazyRecovery';
import { useI18n } from '../i18n';

type LazyModule<T extends ComponentType<any>> = { default: T };

const LAZY_RECOVERY_ATTEMPT_KEY = 'ia-lazy-recovery-attempt-v1';
function attemptLazyImportRecovery(): boolean {
  if (typeof window === 'undefined' || !window.navigator.onLine) return false;
  const now = Date.now();
  try {
    if (!canAttemptLazyRecovery(sessionStorage.getItem(LAZY_RECOVERY_ATTEMPT_KEY), now)) return false;
    if (!checkpointBeforeUnload()) return false;
    sessionStorage.setItem(LAZY_RECOVERY_ATTEMPT_KEY, String(now));
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function lazyScreen<T extends ComponentType<any>>(
  loader: () => Promise<LazyModule<T>>,
) {
  return lazy<T>(async () => {
    try {
      return await loader();
    } catch (error) {
      if (typeof window !== 'undefined' && window.navigator.onLine === false && isRecoverableLazyImportError(error)) {
        await new Promise<void>((resolve) => window.addEventListener('online', () => resolve(), { once: true }));
        try {
          return await loader();
        } catch (retryError) {
          error = retryError;
        }
      }
      if (isRecoverableLazyImportError(error) && attemptLazyImportRecovery()) {
        return await new Promise<LazyModule<T>>(() => undefined);
      }
      throw error;
    }
  });
}

export function ScreenFallback() {
  const { t } = useI18n();
  return <div className="ia-display" style={{ minHeight: 180, display: 'grid', placeItems: 'center', color: 'var(--text-dim)' }}>{t(typeof navigator !== 'undefined' && navigator.onLine === false ? '此页面将在联网后打开。' : '正在展开卷宗…')}</div>;
}
