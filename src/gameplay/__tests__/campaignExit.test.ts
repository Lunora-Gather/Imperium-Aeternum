import { describe, expect, it } from 'vitest';
import { buildCampaignExitPolicy } from '../campaignExit';

describe('campaign exit policy', () => {
  it('protects a local campaign with save-first primary and explicit discard', () => {
    expect(buildCampaignExitPolicy(false)).toMatchObject({
      showDiscardAction: true,
      saveBeforePrimary: true,
      statusTone: 'warn',
      primaryLabel: '保存并返回大厅',
    });
  });

  it('does not offer misleading local-save actions for a server-saved shared world', () => {
    expect(buildCampaignExitPolicy(true)).toMatchObject({
      showDiscardAction: false,
      saveBeforePrimary: false,
      statusTone: 'good',
      primaryLabel: '退出并返回大厅',
    });
  });
});
