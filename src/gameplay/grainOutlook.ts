import { settleEconomyPure } from '../engine/economy';
import type { GameState, Nation, Province } from '../types/game';

export function grainOutlook(state: GameState, nation: Nation, provinces?: Province[]) {
  const { grain } = settleEconomyPure(nation, state, provinces);
  if (grain.shortageExpected) return { ...grain, tone: 'danger' as const, title: '预计口粮不足',
    detail: '按当前收支结算，余粮将低于人口所需，影响各阶层满意度。' };
  if (grain.net < 0) return { ...grain, tone: 'warn' as const, title: '本年需动用粮储',
    detail: '库存可承担本年口粮。可在省份开垦或建设农田，缩小年度缺口。' };
  return { ...grain, tone: 'good' as const, title: '常规口粮充足',
    detail: '本年常规粮食收入足以支付居民和军队口粮。' };
}
