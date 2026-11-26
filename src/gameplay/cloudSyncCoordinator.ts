// Capture the owning account at the time the local slot is written.
type LocalWrite = { raw: string; stored: string };
type SaveListener = (slot: number, write?: LocalWrite) => void;
let saved: SaveListener | undefined;
export function onLocalSlotSaved(listener: SaveListener) { saved = listener; }
export function queueCloudSaveUpload(slot: number, write?: LocalWrite) { saved?.(slot, write); }
