import type { TurnReport } from '../types/game';

export type CampaignHealthTone = 'good' | 'info' | 'warn' | 'danger';

export interface CampaignHealthFinding {
  id: string;
  title: string;
  detail: string;
  tone: CampaignHealthTone;
}

export interface CampaignHealth {
  horizon: number;
  score: number;
  tone: CampaignHealthTone;
  averageNetIncome: number;
  negativeIncomeTurns: number;
  foodDeficitTurns: number;
  pressuredTurns: number;
  quietTurns: number;
  maxWarExhaustion: number;
  findings: CampaignHealthFinding[];
}

function ratio(count: number, total: number): number {
  return total > 0 ? count / total : 0;
}

function rounded(value: number): number {
  return Math.round(value * 10) / 10;
}

export function analyzeCampaignReports(reports: readonly TurnReport[]): CampaignHealth {
  const horizon = reports.length;
  if (horizon === 0) {
    return {
      horizon: 0,
      score: 0,
      tone: 'info',
      averageNetIncome: 0,
      negativeIncomeTurns: 0,
      foodDeficitTurns: 0,
      pressuredTurns: 0,
      quietTurns: 0,
      maxWarExhaustion: 0,
      findings: [{ id: 'no-history', title: '等待长期数据', detail: '推进至少两个回合后再判断财政、压力和节奏。', tone: 'info' }],
    };
  }

  const net = reports.map((report) => report.income.tax + report.income.trade + report.income.building - report.expense.military - report.expense.corruption);
  const negativeIncomeTurns = net.filter((value) => value < 0).length;
  const foodDeficitTurns = reports.filter((report) => report.foodDelta < 0).length;
  // Two routine event draws are the normal annual cadence, not pressure by themselves.
  // Treat only an event spike or a concrete warning/conflict/state change as a pressured turn.
  const pressuredTurns = reports.filter((report) => report.warnings.length > 0 || report.events.length > 2 || report.warProgress.length > 0 || report.provinceChanges.length > 0 || report.exhaustSnapshot >= 55).length;
  const quietTurns = reports.filter((report) => report.warnings.length === 0 && report.events.length <= 1 && report.warProgress.length === 0 && report.provinceChanges.length === 0 && (report.strategicNotes?.length ?? 0) === 0).length;
  const maxWarExhaustion = Math.max(0, ...reports.map((report) => report.exhaustSnapshot));
  const averageNetIncome = net.reduce((sum, value) => sum + value, 0) / horizon;
  const negativeRatio = ratio(negativeIncomeTurns, horizon);
  const foodRatio = ratio(foodDeficitTurns, horizon);
  const pressureRatio = ratio(pressuredTurns, horizon);
  const quietRatio = ratio(quietTurns, horizon);
  const score = Math.max(0, Math.min(100, Math.round(
    100
      - negativeRatio * 32
      - foodRatio * 26
      - Math.max(0, pressureRatio - 0.75) * 24
      - Math.max(0, quietRatio - 0.35) * 28
      - Math.max(0, maxWarExhaustion - 55) * 0.45,
  )));
  const findings: CampaignHealthFinding[] = [];

  if (negativeRatio >= 0.6) findings.push({ id: 'fiscal-spiral', title: '财政连续失血', detail: `${negativeIncomeTurns}/${horizon} 回合净收入为负，需要压军费、腐败或调整税基。`, tone: 'danger' });
  else if (negativeRatio >= 0.3) findings.push({ id: 'fiscal-pressure', title: '财政承压', detail: `${negativeIncomeTurns}/${horizon} 回合出现赤字，扩张前应保留缓冲。`, tone: 'warn' });
  else findings.push({ id: 'fiscal-stable', title: '财政有韧性', detail: `近 ${horizon} 回合平均净收入 ${rounded(averageNetIncome)}。`, tone: 'good' });

  if (foodRatio >= 0.6) findings.push({ id: 'food-spiral', title: '粮食趋势危险', detail: `${foodDeficitTurns}/${horizon} 回合粮食减少，长期人口与稳定会承压。`, tone: 'danger' });
  else if (foodRatio >= 0.3) findings.push({ id: 'food-pressure', title: '粮食余量不稳', detail: `${foodDeficitTurns}/${horizon} 回合粮食下降，优先检查农业和人口增长。`, tone: 'warn' });

  if (maxWarExhaustion >= 75) findings.push({ id: 'war-fatigue', title: '长期战争过载', detail: `厌战峰值达到 ${Math.round(maxWarExhaustion)}，应准备议和或休整。`, tone: 'danger' });
  else if (maxWarExhaustion >= 55) findings.push({ id: 'war-pressure', title: '厌战正在累积', detail: `厌战峰值 ${Math.round(maxWarExhaustion)}，避免继续增加战线。`, tone: 'warn' });

  if (quietRatio >= 0.5 && horizon >= 4) findings.push({ id: 'low-density', title: '决策反馈偏稀', detail: `${quietTurns}/${horizon} 回合没有显著风险、事件、战争或战略变化。`, tone: 'warn' });
  else if (pressureRatio >= 0.85 && horizon >= 4) findings.push({ id: 'high-density', title: '压力持续偏高', detail: `${pressuredTurns}/${horizon} 回合存在显著压力，注意是否缺少恢复窗口。`, tone: 'warn' });
  else if (pressuredTurns === 0 && quietTurns === 0) findings.push({ id: 'routine-cadence', title: '常规节奏稳定', detail: `${horizon} 回合均保持常规事件节奏，未出现额外压力峰值。`, tone: 'info' });
  else findings.push({ id: 'pace-balanced', title: '近期节奏适中', detail: `${pressuredTurns}/${horizon} 回合有显著变化，仍保留调整空间。`, tone: 'info' });

  const tone: CampaignHealthTone = score < 45 ? 'danger' : score < 68 ? 'warn' : score < 84 ? 'info' : 'good';
  return { horizon, score, tone, averageNetIncome: rounded(averageNetIncome), negativeIncomeTurns, foodDeficitTurns, pressuredTurns, quietTurns, maxWarExhaustion: rounded(maxWarExhaustion), findings };
}
