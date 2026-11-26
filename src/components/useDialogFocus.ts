import { useLayoutEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = [
  'button:not([disabled])',
  'a[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function useDialogFocus<T extends HTMLElement>(onClose: () => void, open = true): RefObject<T> {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useLayoutEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
      .filter((element) => element.getClientRects().length > 0);
    if (!dialog?.contains(document.activeElement)) (dialog?.querySelector<HTMLElement>('[data-safe-action]') ?? focusable()[0] ?? dialog)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' && event.key !== 'Tab') return;
      const activeDialog = document.activeElement?.closest('[role="dialog"]')
        ?? Array.from(document.querySelectorAll('[role="dialog"][aria-modal="true"]')).pop();
      if (!dialog || activeDialog !== dialog) return;
      if (event.key === 'Escape') {
        event.stopImmediatePropagation();
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      const items = focusable();
      if (items.length === 0) {
        event.preventDefault();
        dialog?.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (!dialog.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      if (opener instanceof HTMLElement && opener.isConnected
        && (dialog?.contains(document.activeElement) || document.activeElement === document.body)) opener.focus();
    };
  }, [open]);

  return dialogRef;
}
