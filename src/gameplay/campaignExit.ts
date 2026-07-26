export interface CampaignExitPolicy {
  showDiscardAction: boolean;
  saveBeforePrimary: boolean;
  statusTone: 'good' | 'warn';
  statusLabel: string;
  primaryLabel: string;
}

export function buildCampaignExitPolicy(shared: boolean): CampaignExitPolicy {
  return shared
    ? {
        showDiscardAction: false,
        saveBeforePrimary: false,
        statusTone: 'good',
        statusLabel: '服务器已保存共享进度',
        primaryLabel: '退出并返回大厅',
      }
    : {
        showDiscardAction: true,
        saveBeforePrimary: true,
        statusTone: 'warn',
        statusLabel: '未保存的行动将丢失',
        primaryLabel: '保存并返回大厅',
      };
}
