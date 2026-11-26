// A static import can fail before the worker has an error handler. Load the
// shared inspector inside the request so the page can finish offline.
self.onmessage = async ({ data }: MessageEvent<{ moduleUrl: string; slots: [number, string][] }>) => {
  try {
    const { inspectStoredSlot }: typeof import('./saveRecovery') = await import(/* @vite-ignore */ data.moduleUrl);
    self.postMessage(data.slots.map(([slot, stored]) => inspectStoredSlot(slot, stored)));
  } catch {
    self.postMessage(null);
  }
};
