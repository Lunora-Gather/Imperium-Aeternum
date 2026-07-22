// V24 开局大厅智能层：剧本推荐、存档健康摘要、最佳继续档选择。
// 纯函数优先，供标题页和测试复用；不直接读写 localStorage。

import type { ScenarioId } from '../store/scenarioCatalog';
import type { SaveRecoveryPreview, SaveRecoveryStatus } from './saveRecovery';

export type LaunchTone = 'good' | 'warn' | 'danger' | 'info' | 'gold';

export interface ScenarioProfile {
  style: string;
  difficulty: string;
  tone: LaunchTone;
  audience: string;
  advice: string;
  marketTag: string;
}

export interface NationStyleTag {
  text: string;
  tone: LaunchTone;
}

export interface SaveLaunchSummary {
  total: number;
  playable: number;
  healthy: number;
  repairable: number;
  risky: number;
  broken: number;
  empty: number;
  best?: SaveRecoveryPreview;
  headline: string;
  advice: string;
  tone: LaunchTone;
}

export const SCENARIO_PROFILES: Record<ScenarioId, ScenarioProfile> = {
  classic: {
    style: '入门王道', difficulty: '低', tone: 'good', audience: '第一次玩 / 快速理解系统', marketTag: '新手首选',
    advice: '国家少、节奏快、风险可控，最适合建立第一套财政—省份—战争理解。',
  },
  world: {
    style: '完整世界', difficulty: '高', tone: 'danger', audience: '熟悉系统后的长期玩家', marketTag: '旗舰长局',
    advice: '国家最多、信息密度最高，适合追求完整大战略沙盘体验。建议先掌握总览行动中心和存档体检。',
  },
  eastasia: {
    style: '区域经营', difficulty: '中', tone: 'info', audience: '喜欢秦汉、草原和南亚互动', marketTag: '东方入门',
    advice: '区域内政和战争压力适中，适合体验东方势力的扩张与稳定平衡。',
  },
  w3_eastasia: {
    style: '东方争霸', difficulty: '中', tone: 'info', audience: '喜欢东方大区长期博弈', marketTag: '东方长线',
    advice: '东亚、中亚、南亚三洲互相牵制，适合扩张与内政并重的路线。',
  },
  w5_mediterranean: {
    style: '战争贸易', difficulty: '中高', tone: 'warn', audience: '喜欢罗马、迦太基、波斯冲突', marketTag: '战争贸易',
    advice: '冲突密度高，海贸和补给都重要。推荐给喜欢战争但不想直接进完整世界的玩家。',
  },
  w6_americas: {
    style: '独立发展', difficulty: '中', tone: 'info', audience: '喜欢较少外交干扰的成长线', marketTag: '文明成长',
    advice: '国家较少，适合专注美洲文明内部发展、扩张节奏和长线科技。',
  },
  w7_random: {
    style: '随机挑战', difficulty: '未知', tone: 'warn', audience: '老手 / 每局想要不同开局', marketTag: '重开乐趣',
    advice: '随机洲开局，适合测试适应能力。开局后先看行动中心，不要直接空格连跳。',
  },
  w4_europe: {
    style: '封建混战', difficulty: '中高', tone: 'warn', audience: '喜欢联盟、边境和多国关系', marketTag: '外交战争',
    advice: '多国接壤、外交复杂，适合喜欢联盟、停战、背刺和边境经营的玩家。',
  },
  w8_indianocean: {
    style: '海贸经营', difficulty: '中', tone: 'good', audience: '喜欢贸易和港口路线', marketTag: '贸易推荐',
    advice: '南亚、东非、中东围绕海贸互动，经济路线清晰，适合偏经营玩家。',
  },
  challenge_survival: {
    style: '高压生存', difficulty: '极高', tone: 'danger', audience: '硬核玩家 / 失败也能接受', marketTag: '硬核挑战',
    advice: '资源少、叛乱高、外交差。建议熟悉存档体检、行动中心和回合前检查后再挑战。',
  },
};

const STATUS_RANK: Record<SaveRecoveryStatus, number> = {
  healthy: 5,
  repairable: 4,
  risky: 2,
  broken: 0,
  empty: -1,
};

export function getScenarioProfile(id: ScenarioId): ScenarioProfile {
  return SCENARIO_PROFILES[id];
}

export function nationStyleTags(desc: string, tier: string): NationStyleTag[] {
  const out: NationStyleTag[] = [];
  if (tier === 'S') out.push({ text: '强国', tone: 'gold' });
  else if (tier === 'A') out.push({ text: '稳健', tone: 'info' });
  else out.push({ text: '挑战', tone: 'warn' });
  if (/商业|海贸|贸易|商/.test(desc)) out.push({ text: '贸易', tone: 'good' });
  if (/军|骑兵|游牧|扩张|霸主/.test(desc)) out.push({ text: '军事', tone: 'danger' });
  if (/中央|行政|集权|治术/.test(desc)) out.push({ text: '行政', tone: 'info' });
  if (/民心|福利|人口/.test(desc)) out.push({ text: '民生', tone: 'good' });
  return out.slice(0, 4);
}

export function pickBestContinueSave(previews: SaveRecoveryPreview[]): SaveRecoveryPreview | undefined {
  return previews
    .filter((p) => STATUS_RANK[p.status] > 0)
    .sort((a, b) => {
      const rank = STATUS_RANK[b.status] - STATUS_RANK[a.status];
      if (rank !== 0) return rank;
      const turn = (b.turn ?? -1) - (a.turn ?? -1);
      if (turn !== 0) return turn;
      // 同等条件下偏向手动档，自动档 slot 0 排后。
      if (a.slot === 0 && b.slot !== 0) return 1;
      if (b.slot === 0 && a.slot !== 0) return -1;
      return a.slot - b.slot;
    })[0];
}

export function summarizeSavePreviews(previews: SaveRecoveryPreview[]): SaveLaunchSummary {
  const total = previews.length;
  const healthy = previews.filter((p) => p.status === 'healthy').length;
  const repairable = previews.filter((p) => p.status === 'repairable').length;
  const risky = previews.filter((p) => p.status === 'risky').length;
  const broken = previews.filter((p) => p.status === 'broken').length;
  const empty = previews.filter((p) => p.status === 'empty').length;
  const playable = healthy + repairable + risky;
  const best = pickBestContinueSave(previews);

  if (broken > 0) {
    return { total, playable, healthy, repairable, risky, broken, empty, best, tone: 'danger', headline: `${broken} 个槽位损坏`, advice: '建议进入后覆盖损坏槽位，保留健康/可修复档。' };
  }
  if (best && repairable > 0) {
    return { total, playable, healthy, repairable, risky, broken, empty, best, tone: 'warn', headline: `${repairable} 个存档可自动修复`, advice: '可以继续游戏；读取时会迁移、净化并写回。' };
  }
  if (best && risky > 0) {
    return { total, playable, healthy, repairable, risky, broken, empty, best, tone: 'warn', headline: `${risky} 个存档可读但有风险`, advice: '继续后先看总览行动中心和下一回合前检查。' };
  }
  if (best) {
    return { total, playable, healthy, repairable, risky, broken, empty, best, tone: 'good', headline: '存档健康', advice: '可以直接继续最近进度。' };
  }
  return { total, playable, healthy, repairable, risky, broken, empty, best, tone: 'info', headline: '暂无可继续存档', advice: '推荐从“地中海黎明”开始，先建立一套稳定玩法循环。' };
}

export function recommendedScenarioIds(): ScenarioId[] {
  return ['classic', 'w8_indianocean', 'w5_mediterranean', 'world', 'challenge_survival'];
}
