// 玩家可见的系统运行体检：把版本与状态一致性汇总到总览。
// 纯函数，不改 GameState；既方便玩家反馈问题，也让正式版验收有真实界面入口。

import { BUILD_MARK } from '../buildInfo';
import type { ReadinessReport, ReadinessTone } from './readiness';

export interface ReleaseReadinessPlan {
  tone: ReadinessTone;
  buildMark: string;
  integrityCount: number;
}

export function buildReleaseReadinessPlan(readiness: ReadinessReport): ReleaseReadinessPlan {
  const integrityDanger = readiness.devChecks.some((item) => item.tone === 'danger');
  return {
    tone: integrityDanger ? 'danger' : readiness.devChecks.length > 0 ? 'warn' : 'good',
    buildMark: BUILD_MARK,
    integrityCount: readiness.devChecks.length,
  };
}
