import { gzipSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { decodeGatewayState } from '../sharedWorldService';
import type { GameState } from '../../../types/game';

describe('shared-world snapshot transport', () => {
  it('decodes a compressed gateway snapshot', async () => {
    const state = { turn: 7, playerNationId: 'rome' } as GameState;
    const statePayload = gzipSync(JSON.stringify(state)).toString('base64');

    await expect(decodeGatewayState({
      stateEncoding: 'gzip-base64',
      statePayload,
    })).resolves.toEqual(state);
  });

  it('keeps backward compatibility with an uncompressed state', async () => {
    const state = { turn: 8, playerNationId: 'rome' } as GameState;
    await expect(decodeGatewayState({ state })).resolves.toBe(state);
  });
});
