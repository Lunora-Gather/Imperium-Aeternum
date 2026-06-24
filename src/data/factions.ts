// Imperium Aeternum — 派系表
// 数据源：docs/02-system-rules.md §8.3
// FROZEN v1（阶段 3b）

export type FactionId = 'nobles' | 'merchants' | 'military' | 'commoners' | 'clergy';

export interface FactionDef {
  id: FactionId;
  name: string;
  description: string;
  // 起始影响力（0-100）
  initPower: number;
  // 起始满意度（0-100）
  initSatisfaction: number;
  // 该派系偏好的政策类型（用于改革/政策满意度反应）
  policyBias: string[];
  // 满意度过低时触发的逼宫事件 id（见 events.ts）
  coupEventId: string;
}

export const FACTIONS: Record<FactionId, FactionDef> = {
  nobles: {
    id: 'nobles', name: '贵族', description: '世袭土地阶层，重视特权与王权。',
    initPower: 25, initSatisfaction: 55,
    policyBias: ['land_privilege', 'centralization', 'state_religion'],
    coupEventId: 'evt_noble_coup',
  },
  merchants: {
    id: 'merchants', name: '商人', description: '贸易阶层，重视市场与税收自由。',
    initPower: 20, initSatisfaction: 50,
    policyBias: ['free_trade', 'welfare'],
    coupEventId: 'evt_merchant_strike',
  },
  military: {
    id: 'military', name: '军方', description: '军队势力，重视军费与战争胜利。',
    initPower: 20, initSatisfaction: 50,
    policyBias: ['conscription', 'martial_law', 'holy_war'],
    coupEventId: 'evt_military_unrest',
  },
  commoners: {
    id: 'commoners', name: '民众', description: '农民与工人，重视税收与粮食。',
    initPower: 25, initSatisfaction: 50,
    policyBias: ['welfare', 'civic_reform', 'anti_corruption'],
    coupEventId: 'evt_peasant_uprising',
  },
  clergy: {
    id: 'clergy', name: '神职', description: '宗教势力，重视国教与文化政策。',
    initPower: 10, initSatisfaction: 50,
    policyBias: ['state_religion', 'holy_war'],
    coupEventId: 'evt_clergy_interference',
  },
};

export const FACTION_LIST: FactionDef[] = Object.values(FACTIONS);
