import type {
  GameState,
  NationalCrisisKind,
  NationalCrisisState,
  NationalMissionId,
  NationalMissionMeta,
  Nation,
} from '../types/game';
import { cloneGameState } from '../engine/stateClone';
import { addChronicle } from '../engine/chronicle';

export type PurposeTone = 'good' | 'warn' | 'danger' | 'info' | 'gold';

export interface MissionStageView {
  id: string;
  title: string;
  body: string;
  reward: string;
  progress: number;
  done: boolean;
}

export interface NationalMissionView {
  id: NationalMissionId;
  title: string;
  motto: string;
  completed: number;
  stages: MissionStageView[];
  current: MissionStageView;
}

export interface NationalCrisisView {
  kind: NationalCrisisKind;
  title: string;
  stage: 1 | 2 | 3;
  pressure: number;
  tone: PurposeTone;
  summary: string;
  remedy: string;
  consequence: string;
}

const MISSION_COPY: Record<NationalMissionId, { title: string; motto: string }> = {
  statecraft: { title: '治世长策', motto: '先立制度，再成万世之业。' },
  prosperity: { title: '四海通商', motto: '让财富、粮食与商路成为帝国血脉。' },
  imperial: { title: '开疆定鼎', motto: '以军威开拓疆界，以秩序守住所得。' },
  enlightenment: { title: '文明灯塔', motto: '让知识、治能与文化塑造新时代。' },
  concord: { title: '万邦协和', motto: '用信用与盟约建立不战而胜的秩序。' },
};

const CRISIS_COPY: Record<NationalCrisisKind, { title: string; summary: string; remedy: string }> = {
  fiscal: { title: '财政断流', summary: '国库或粮储已经无法支撑正常治理。', remedy: '提高净收入并让国库、粮储恢复到安全线。' },
  legitimacy: { title: '统治正当性危机', summary: '安定与法统正在动摇政权根基。', remedy: '采用安民国策，改善派系满意度并恢复法统。' },
  unrest: { title: '地方离心危机', summary: '多个省份正在向叛乱临界点靠近。', remedy: '前往省份页降低不满、叛乱风险并部署守备。' },
  war: { title: '长期战争危机', summary: '厌战与补给压力开始侵蚀国内秩序。', remedy: '尽快取得决定性进展或议和，让厌战降至安全线。' },
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

function player(state: GameState): Nation | undefined {
  return state.nations[state.playerNationId];
}

function provinceCount(state: GameState): number {
  return Object.values(state.provinces).filter((province) => province.ownerId === state.playerNationId).length;
}

function techTotal(nation: Nation): number {
  return nation.tech.agri + nation.tech.admin + nation.tech.mil + nation.tech.culture;
}

function armyTotal(nation: Nation): number {
  return nation.army.reduce((sum, army) => sum + army.size, 0);
}

function chooseMission(nation: Nation): NationalMissionId {
  const tendency = nation.tendency;
  if (nation.character === 'militarism' || nation.character === 'expansionist' || tendency.expansionist >= 65 || tendency.militarism >= 70) return 'imperial';
  if (nation.character === 'commerce' || nation.character === 'maritime' || tendency.mercantilist >= 60 || tendency.commerce >= 65) return 'prosperity';
  if (nation.character === 'scholarly' || nation.character === 'technocracy' || tendency.scholarly >= 60 || tendency.technocracy >= 60) return 'enlightenment';
  if (tendency.isolationist < 35 && (tendency.welfare >= 55 || nation.resources.influence >= 60)) return 'concord';
  return 'statecraft';
}

function makeMissionMeta(state: GameState): NationalMissionMeta {
  const nation = player(state);
  return {
    id: nation ? chooseMission(nation) : 'statecraft',
    startedTurn: state.turn,
    startProvinces: Math.max(1, provinceCount(state)),
    startGold: Math.round(nation?.resources.gold ?? 0),
    startTech: nation ? techTotal(nation) : 0,
    startArmy: nation ? armyTotal(nation) : 0,
    completedStages: [],
    lastEvaluatedTurn: state.turn,
  };
}

export function initializeNationalPurpose(state: GameState): GameState {
  if (state.nationalMission) return state;
  return { ...state, nationalMission: makeMissionMeta(state) };
}

function pct(value: number, target: number): number {
  return clamp(Math.round((value / Math.max(1, target)) * 100));
}

function routeMetrics(state: GameState, meta: NationalMissionMeta) {
  const nation = player(state);
  if (!nation) return { middle: 0, legacy: 0 };
  const growth = provinceCount(state) - meta.startProvinces;
  const techGrowth = techTotal(nation) - meta.startTech;
  const tradeCount = state.relations.filter((relation) => relation.from === nation.id && (relation.treaty === 'trade' || relation.treaty === 'alliance')).length;
  const goodRelations = state.relations.filter((relation) => relation.from === nation.id && relation.relation >= 60 && relation.trust >= 50 && relation.treaty !== 'war').length;
  if (meta.id === 'imperial') return {
    middle: Math.min(pct(growth, 2), pct(armyTotal(nation), Math.max(200, meta.startArmy * 1.15))),
    legacy: Math.min(pct(growth, 4), pct(nation.government.stability, 45)),
  };
  if (meta.id === 'prosperity') return {
    middle: Math.min(pct(nation.resources.gold - meta.startGold, 300), pct(tradeCount, 1)),
    legacy: Math.min(pct(nation.resources.gold - meta.startGold, 1200), pct(tradeCount, 2)),
  };
  if (meta.id === 'enlightenment') return {
    middle: Math.min(pct(techGrowth, 2), pct(nation.resources.sciPt, 30)),
    legacy: Math.min(pct(techGrowth, 5), pct(nation.government.efficiency, 55)),
  };
  if (meta.id === 'concord') return {
    middle: Math.min(pct(goodRelations, 2), pct(nation.resources.influence, 80)),
    legacy: Math.min(pct(tradeCount, 3), pct(nation.resources.influence, 140)),
  };
  return {
    middle: Math.min(pct(nation.government.stability, 60), pct(nation.government.efficiency, 55)),
    legacy: Math.min(pct(nation.government.stability, 70), pct(100 - nation.government.corruption, 65), pct(nation.government.legitimacy, 65)),
  };
}

export function getNationalMissionView(state: GameState): NationalMissionView {
  const meta = state.nationalMission ?? makeMissionMeta(state);
  const nation = player(state);
  const copy = MISSION_COPY[meta.id];
  const elapsed = state.turn - meta.startedTurn;
  const foundation = nation
    ? Math.min(pct(elapsed, 2), pct(nation.government.stability, 40), pct(nation.government.legitimacy, 35))
    : 0;
  const route = routeMetrics(state, meta);
  const completed = new Set(meta.completedStages);
  const stages: MissionStageView[] = [
    { id: 'foundation', title: '第一章 · 稳住朝局', body: '治理至少两年，并维持安定 40、法统 35。', reward: '行政点 +2 · 影响力 +10', progress: foundation, done: completed.has('foundation') },
    { id: 'route', title: `第二章 · ${copy.title}`, body: routeBody(meta.id, false), reward: '国库 +250 · 科研 +20', progress: route.middle, done: completed.has('route') },
    { id: 'legacy', title: '终章 · 留下国祚', body: routeBody(meta.id, true), reward: '安定 +5 · 法统 +5 · 影响力 +30', progress: route.legacy, done: completed.has('legacy') },
  ].map((stage) => ({ ...stage, progress: stage.done ? 100 : stage.progress }));
  return {
    id: meta.id,
    title: copy.title,
    motto: copy.motto,
    completed: stages.filter((stage) => stage.done).length,
    stages,
    current: stages.find((stage) => !stage.done) ?? stages[stages.length - 1],
  };
}

function routeBody(id: NationalMissionId, legacy: boolean): string {
  if (id === 'imperial') return legacy ? '扩张至少 4 省，并将安定维持在 45 以上。' : '扩张 2 省，并建立足以守边的常备军。';
  if (id === 'prosperity') return legacy ? '比开局多积累 1200 金，并维持至少 2 个贸易伙伴。' : '比开局多积累 300 金，并建立第一条对外贸易关系。';
  if (id === 'enlightenment') return legacy ? '累计提升 5 级科技，并把治能提高到 55。' : '累计提升 2 级科技，并储备 30 科研点。';
  if (id === 'concord') return legacy ? '建立 3 个盟约或贸易伙伴，并积累 140 影响力。' : '获得 2 个可信友邦，并积累 80 影响力。';
  return legacy ? '将安定提高到 70、法统提高到 65，并把腐败压到 35 以下。' : '将安定提高到 60、治能提高到 55。';
}

function grantMissionReward(state: GameState, stageId: string): void {
  const nation = player(state);
  if (!nation) return;
  if (stageId === 'foundation') {
    nation.resources.adminPt += 2;
    nation.resources.influence += 10;
  } else if (stageId === 'route') {
    nation.resources.gold += 250;
    nation.resources.sciPt += 20;
  } else {
    nation.government.stability = clamp(nation.government.stability + 5);
    nation.government.legitimacy = clamp(nation.government.legitimacy + 5);
    nation.resources.influence += 30;
  }
}

function crisisCandidates(state: GameState): { kind: NationalCrisisKind; pressure: number }[] {
  const nation = player(state);
  if (!nation) return [];
  const provinces = Object.values(state.provinces).filter((province) => province.ownerId === nation.id);
  const severeUnrest = provinces.filter((province) => province.unrest >= 55 || province.rebellionRisk >= 65).length;
  const fiscal = Math.max(
    nation.resources.gold < 0 ? 70 + Math.min(25, Math.abs(nation.resources.gold) / 20) : 0,
    nation.resources.food < 0 ? 70 + Math.min(25, Math.abs(nation.resources.food) / 30) : 0,
  );
  const legitimacy = Math.max(
    nation.government.stability < 30 ? 60 + (30 - nation.government.stability) * 2 : 0,
    nation.government.legitimacy < 35 ? 55 + (35 - nation.government.legitimacy) * 1.6 : 0,
  );
  const unrest = severeUnrest ? 50 + Math.min(45, severeUnrest * 12) : 0;
  const war = nation.warExhaustion >= 55 ? 45 + (nation.warExhaustion - 55) * 1.2 : 0;
  const candidates: { kind: NationalCrisisKind; pressure: number }[] = [
    { kind: 'fiscal', pressure: clamp(fiscal) },
    { kind: 'legitimacy', pressure: clamp(legitimacy) },
    { kind: 'unrest', pressure: clamp(unrest) },
    { kind: 'war', pressure: clamp(war) },
  ];
  return candidates.sort((a, b) => b.pressure - a.pressure);
}

function crisisConsequence(kind: NationalCrisisKind, stage: number): string {
  if (stage === 1) return '当前仅预警；若持续恶化，将开始产生额外损失。';
  if (kind === 'fiscal') return stage === 2 ? '每年治能 -1。' : '每年治能 -2、安定 -1。';
  if (kind === 'legitimacy') return stage === 2 ? '每年影响力 -3。' : '每年影响力 -5、行政点 -1。';
  if (kind === 'unrest') return stage === 2 ? '每年追加地方维稳支出。' : '维稳支出增加，安定每年 -2。';
  return stage === 2 ? '每年补给 -5。' : '每年补给 -10、安定 -1。';
}

export function getNationalCrisisView(state: GameState): NationalCrisisView | null {
  const crisis = state.nationalCrisis;
  if (!crisis) return null;
  const copy = CRISIS_COPY[crisis.kind];
  return {
    kind: crisis.kind,
    title: copy.title,
    stage: crisis.stage,
    pressure: crisis.pressure,
    tone: crisis.stage >= 3 ? 'danger' : 'warn',
    summary: copy.summary,
    remedy: copy.remedy,
    consequence: crisisConsequence(crisis.kind, crisis.stage),
  };
}

function applyCrisisPenalty(state: GameState, crisis: NationalCrisisState): void {
  if (crisis.stage < 2) return;
  const nation = player(state);
  if (!nation) return;
  if (crisis.kind === 'fiscal') {
    nation.government.efficiency = clamp(nation.government.efficiency - (crisis.stage === 3 ? 2 : 1));
    if (crisis.stage === 3) nation.government.stability = clamp(nation.government.stability - 1);
  } else if (crisis.kind === 'legitimacy') {
    nation.resources.influence = Math.max(0, nation.resources.influence - (crisis.stage === 3 ? 5 : 3));
    if (crisis.stage === 3) nation.resources.adminPt = Math.max(0, nation.resources.adminPt - 1);
  } else if (crisis.kind === 'unrest') {
    const scale = Math.max(8, Math.min(40, provinceCount(state) * 3));
    nation.resources.gold -= crisis.stage === 3 ? scale * 2 : scale;
    if (crisis.stage === 3) nation.government.stability = clamp(nation.government.stability - 2);
  } else {
    nation.resources.supply = Math.max(0, nation.resources.supply - (crisis.stage === 3 ? 10 : 5));
    if (crisis.stage === 3) nation.government.stability = clamp(nation.government.stability - 1);
  }
}

function pushStrategicNote(state: GameState, note: string): void {
  if (!state.lastReport) return;
  state.lastReport.strategicNotes = [...(state.lastReport.strategicNotes ?? []), note].slice(-8);
  const historyReport = state.history.find((report) => report.turn === state.lastReport?.turn);
  if (historyReport) historyReport.strategicNotes = [...state.lastReport.strategicNotes];
}

export function applyNationalPurposeAfterTurn(state: GameState): { state: GameState; notes: string[] } {
  const next = cloneGameState(initializeNationalPurpose(state));
  const notes: string[] = [];
  const meta = next.nationalMission as NationalMissionMeta;
  const mission = getNationalMissionView(next);

  if (meta.lastEvaluatedTurn !== next.turn) {
    const completed = mission.stages.find((stage) => !stage.done && stage.progress >= 100);
    if (completed) {
      meta.completedStages.push(completed.id);
      grantMissionReward(next, completed.id);
      const note = `国家使命完成：${completed.title}；奖励已发放（${completed.reward}）。`;
      notes.push(note);
      pushStrategicNote(next, note);
      addChronicle(next, {
        id: `mission_${meta.id}_${completed.id}`,
        turn: next.turn,
        kind: completed.id === 'legacy' ? 'victory' : 'reform',
        title: completed.title,
        desc: `${mission.title}取得阶段成果。${completed.reward}。`,
        actorId: next.playerNationId,
      });
    }
    meta.lastEvaluatedTurn = next.turn;
  }

  const highest = crisisCandidates(next)[0];
  const active = next.nationalCrisis;
  if (!active && highest && highest.pressure >= 60) {
    next.nationalCrisis = {
      kind: highest.kind,
      pressure: highest.pressure,
      stage: 1,
      startedTurn: next.turn,
      lastUpdatedTurn: next.turn,
      recoveryTurns: 0,
      resolvedCount: 0,
    };
    const title = CRISIS_COPY[highest.kind].title;
    const note = `国家危机出现：${title}。${CRISIS_COPY[highest.kind].remedy}`;
    notes.push(note);
    pushStrategicNote(next, note);
    addChronicle(next, { id: `crisis_${highest.kind}_${next.turn}`, turn: next.turn, kind: 'crisis', title, desc: CRISIS_COPY[highest.kind].summary, actorId: next.playerNationId });
  } else if (active && active.lastUpdatedTurn !== next.turn) {
    const currentPressure = crisisCandidates(next).find((candidate) => candidate.kind === active.kind)?.pressure ?? 0;
    active.pressure = currentPressure;
    active.lastUpdatedTurn = next.turn;
    active.recoveryTurns = currentPressure <= 35 ? active.recoveryTurns + 1 : 0;
    if (active.recoveryTurns >= 2) {
      const title = CRISIS_COPY[active.kind].title;
      const note = `国家危机化解：${title}。连续两年回到安全线，安定与法统各 +2。`;
      const nation = player(next);
      if (nation) {
        nation.government.stability = clamp(nation.government.stability + 2);
        nation.government.legitimacy = clamp(nation.government.legitimacy + 2);
      }
      notes.push(note);
      pushStrategicNote(next, note);
      addChronicle(next, { id: `crisis_resolved_${active.kind}_${next.turn}`, turn: next.turn, kind: 'reform', title: `${title}化解`, desc: '国家连续两年回到安全线，危机结束。', actorId: next.playerNationId });
      next.nationalCrisis = undefined;
    } else {
      const elapsed = next.turn - active.startedTurn;
      const nextStage = (currentPressure >= 85 || elapsed >= 5 ? 3 : currentPressure >= 72 || elapsed >= 3 ? 2 : 1) as 1 | 2 | 3;
      if (nextStage > active.stage) {
        active.stage = nextStage;
        const note = `国家危机升级：${CRISIS_COPY[active.kind].title}进入第 ${nextStage} 阶段。${crisisConsequence(active.kind, nextStage)}`;
        notes.push(note);
        pushStrategicNote(next, note);
      }
      applyCrisisPenalty(next, active);
      if (next.lastReport) {
        next.lastReport.warnings = [...next.lastReport.warnings, `国家危机：${CRISIS_COPY[active.kind].title} · 第 ${active.stage} 阶段`];
        const historyReport = next.history.find((report) => report.turn === next.lastReport?.turn);
        if (historyReport) historyReport.warnings = [...next.lastReport.warnings];
      }
    }
  }

  return { state: next, notes };
}
