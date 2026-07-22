import { describe, expect, it } from 'vitest';
import { buildCloudSaveRowId } from '../cloudSaveService';

describe('cloud save identity', () => {
  it('is stable per user and slot without exposing the full user id', () => {
    const userId = 'user.with+private@example.com';
    const first = buildCloudSaveRowId(userId, 3);

    expect(first).toBe(buildCloudSaveRowId(userId, 3));
    expect(first).not.toContain(userId);
    expect(first.endsWith('_3')).toBe(true);
    expect(first.length).toBeLessThanOrEqual(36);
  });

  it('separates users and slots deterministically', () => {
    expect(buildCloudSaveRowId('alpha', 1)).not.toBe(buildCloudSaveRowId('alpha', 2));
    expect(buildCloudSaveRowId('alpha', 1)).not.toBe(buildCloudSaveRowId('beta', 1));
  });
});
