import { useEffect, useReducer, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDialogFocus } from './useDialogFocus';
import { useI18n } from '../i18n';
import { cacheSavePreview, cachedSavePreview, inspectSaveSlot, inspectStoredSlot, type SaveRecoveryPreview } from '../gameplay/saveRecovery';
import inspectorUrl from '../gameplay/saveInspector.worker.ts?worker&url';
import recoveryUrl from '../gameplay/saveRecovery.ts?url';
import { snapshotSaveList, SLOT_CHANGED, SLOT_COUNT, slotStorageValue, watchOtherTabSaves } from '../store/persistence';
import { clearCampaignSaves } from '../store/gameStore';

interface Deletion { message: string; remove: () => void }

function DeleteSaveDialog({ deletion, close }: { deletion: Deletion; close: () => void }) {
  const { t } = useI18n();
  const ref = useDialogFocus<HTMLDivElement>(close);
  return createPortal(<div className="ia-modal-backdrop" onClick={close}>
    <div ref={ref} className="ia-help-card" role="dialog" aria-modal="true" aria-labelledby="delete-save-title" onClick={event => event.stopPropagation()}>
      <h2 id="delete-save-title" className="ia-help-step-title">{deletion.message}</h2>
      <div className="ia-help-actions">
        <button type="button" className="ia-btn ia-btn--ghost" data-safe-action onClick={close}>{t('取消')}</button>
        <button type="button" className="ia-btn ia-btn--warn" onClick={() => { deletion.remove(); close(); }}>{t('确认删除')}</button>
      </div>
    </div>
  </div>, document.body);
}

export function useSavePreviews(logMsg: (message: string) => void) {
  const [checked, setChecked] = useState<{ revision: number; slots: SaveRecoveryPreview[]; versions: ReadonlyMap<number, string | null> } | null>(null);
  const [revision, rescan] = useReducer((n: number) => n + 1, 0);
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  useEffect(() => watchOtherTabSaves(rescan), [rescan]);
  useEffect(() => {
    let active = true;
    let worker: Worker | undefined;
    let timer: number | undefined;
    const pending: [number, string][] = [];
    const result: SaveRecoveryPreview[] = [];
    const versions = new Map<number, string | null>();
    for (let slot = 0; slot < SLOT_COUNT; slot++) {
      try {
        const stored = slotStorageValue(slot);
        versions.set(slot, stored);
        const cached = cachedSavePreview(slot, stored);
        if (cached) result[slot] = cached;
        else if (stored !== null) pending.push([slot, stored]);
      } catch { result[slot] = inspectSaveSlot(slot); }
    }
    function publish() {
      if (!active) return;
      // Includes initially empty slots and changes whose storage event has yet to arrive.
      for (const [slot, stored] of versions) {
        try {
          if (slotStorageValue(slot) !== stored) { rescan(); return; }
        } catch { result[slot] = inspectSaveSlot(slot); }
      }
      setChecked({ revision, slots: result, versions });
    }
    function accept(slot: number, stored: string, preview: SaveRecoveryPreview) {
      cacheSavePreview(slot, stored, preview);
      result[slot] = preview;
    }
    function fallback() {
      worker?.terminate();
      if (!active || timer !== undefined) return;
      // Let navigation and cancellation run between slots if workers are unavailable.
      let index = 0;
      function next() {
        if (!active) return;
        const [slot, stored] = pending[index++];
        accept(slot, stored, inspectStoredSlot(slot, stored));
        if (index === pending.length) publish();
        else timer = window.setTimeout(next);
      }
      timer = window.setTimeout(next);
    }
    if (!pending.length) publish();
    else if (!navigator.onLine) fallback();
    else {
      try {
        worker = new Worker(inspectorUrl, { type: 'module' });
        worker.onerror = (event) => {
          event.preventDefault();
          fallback();
        };
        worker.onmessageerror = fallback;
        worker.onmessage = ({ data }: MessageEvent<SaveRecoveryPreview[] | null>) => {
          if (!active) return;
          if (data === null) { fallback(); return; }
          worker?.terminate();
          pending.forEach(([slot, stored], index) => accept(slot, stored, data[index]));
          publish();
        };
        worker.postMessage({ moduleUrl: new URL(recoveryUrl, document.baseURI).href, slots: pending });
      } catch { fallback(); }
    }
    return () => { active = false; worker?.terminate(); window.clearTimeout(timer); };
  }, [revision]);
  const checking = checked?.revision !== revision;
  const versions = checking ? undefined : checked?.versions;
  function withReviewedSlot(slot: number, action: (stored: string | null) => void) {
    const stored = versions?.get(slot);
    let current: string | null;
    try {
      current = slotStorageValue(slot);
    } catch { logMsg('无法读取本地存档。'); rescan(); return; }
    if (stored === undefined || current !== stored) { logMsg(SLOT_CHANGED); rescan(); return; }
    action(stored);
  }
  function clearReviewed(message: string) {
    if (!versions) return;
    try {
      const snapshot = snapshotSaveList(versions);
      setDeletion({ message, remove: () => {
        if (!clearCampaignSaves(snapshot)) logMsg('部分存档未能删除，请查看剩余槽位。');
        rescan();
      } });
    } catch { logMsg('无法读取本地存档。'); rescan(); }
  }
  const deletionDialog = deletion && <DeleteSaveDialog deletion={deletion} close={() => setDeletion(null)} />;
  return { slots: checked?.slots ?? null, rescan, checking, versions, withReviewedSlot, clearReviewed, setDeletion, deletionDialog };
}
