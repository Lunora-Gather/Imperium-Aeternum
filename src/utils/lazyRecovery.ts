const RECOVERABLE_LAZY_IMPORT_ERRORS = [
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /loading chunk .+ failed/i,
  /chunkloaderror/i,
];

export const LAZY_RECOVERY_RETRY_WINDOW_MS = 60_000;

export function lazyImportErrorMessage(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error ?? '');
}

export function isRecoverableLazyImportError(error: unknown): boolean {
  const message = lazyImportErrorMessage(error);
  return RECOVERABLE_LAZY_IMPORT_ERRORS.some((pattern) => pattern.test(message));
}

export function canAttemptLazyRecovery(
  lastAttemptValue: string | null,
  now = Date.now(),
  retryWindowMs = LAZY_RECOVERY_RETRY_WINDOW_MS,
): boolean {
  if (!lastAttemptValue) return true;
  const lastAttempt = Number(lastAttemptValue);
  return !Number.isFinite(lastAttempt) || lastAttempt > now || now - lastAttempt >= retryWindowMs;
}
