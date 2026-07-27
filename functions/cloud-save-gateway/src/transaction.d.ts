export function commitUploadedSave(
  db: unknown,
  storage: unknown,
  userId: string,
  slot: number,
  uploaded: { $id: string },
  metadata: Record<string, unknown>,
  body: { force?: boolean },
  access: string[],
): Promise<unknown>;
