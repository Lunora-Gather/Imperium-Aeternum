import { useAccountStore } from '../store/accountStore';

/** Application-level bridge: local saves never depend directly on Appwrite. */
export async function queueCloudSaveUpload(slot: number): Promise<void> {
  const account = useAccountStore.getState();
  if (!account.user || account.busySlot !== null) return;
  await account.uploadSlot(slot);
}
