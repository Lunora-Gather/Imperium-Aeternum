// V35 开局速查手册：把核心游戏循环和关键系统整理成开局大厅可展示的产品化说明。
// 纯函数，不读写状态；ScenarioSelect 展示，测试复用。

import type { LaunchTone } from './launchHub';

export type HandbookSectionId = 'loop' | 'decision' | 'risk' | 'story';

export interface HandbookStep {
  id: string;
  label: string;
  body: string;
  tone: LaunchTone;
}

export interface HandbookSection {
  id: HandbookSectionId;
  title: string;
  kicker: string;
  summary: string;
  tone: LaunchTone;
  steps: HandbookStep[];
}

export interface LaunchHandbook {
  headline: string;
  subtitle: string;
  primaryAdvice: string;
  sections: HandbookSection[];
  quickStart: HandbookStep[];
}

export function buildLaunchHandbook(): LaunchHandbook {
  const sections: HandbookSection[] = [
    {
      id: 'loop',
      kicker: 'Core Loop',
      title: '一年怎么推进',
      tone: 'gold',
      summary: '不要直接连跳回合。先看路线，再看风险，最后用年报修正下一年计划。',
      steps: [
        { id: 'roadmap', label: '帝国路线图', body: '判断本局主线、国势评分和三步治理计划。', tone: 'gold' },
        { id: 'council', label: '作战会议', body: '告诉你本年能不能推进，是否该先处理红项。', tone: 'warn' },
        { id: 'preview', label: '下一回合预演', body: '提前看财政、粮食、安定、战争和存档风险。', tone: 'info' },
        { id: 'report', label: '年度复盘', body: '年报后确认改善/恶化项，再修正下一年方向。', tone: 'good' },
      ],
    },
    {
      id: 'decision',
      kicker: 'Decision',
      title: '不知道点哪里时',
      tone: 'good',
      summary: '总览页已经把分散系统聚合成可执行入口。优先听行动中心，其次看情境式提示。',
      steps: [
        { id: 'guidance', label: '情境提示', body: '第一次遇到财政、粮食、战争、外交压力时给出处理入口。', tone: 'good' },
        { id: 'command', label: '行动中心', body: '把体检、年报、参谋建议合并成优先行动。', tone: 'gold' },
        { id: 'advisor', label: '总参谋部', body: '给出今年、三年内、长期的战略判断。', tone: 'info' },
      ],
    },
    {
      id: 'risk',
      kicker: 'Risk',
      title: '什么时候该停手',
      tone: 'warn',
      summary: '红色项代表继续推进会扩大损失。战争、低稳定、财政赤字和待决事件都应该先处理。',
      steps: [
        { id: 'save', label: '先存档', body: '战争、胜利窗口、低稳定或重大选择前先保存。', tone: 'gold' },
        { id: 'red', label: '先修红项', body: '国库、粮食、安定、待决事件出现红色提示时不要连跳。', tone: 'danger' },
        { id: 'intel', label: '看外交情报', body: '敌国觊觎省份、宿敌记忆和威胁值比单纯关系更重要。', tone: 'warn' },
      ],
    },
    {
      id: 'story',
      kicker: 'Chronicle',
      title: '长期玩什么',
      tone: 'info',
      summary: '游戏不是只看眼前数值。国运目标、胜利路线和帝国史册会把长期主线串起来。',
      steps: [
        { id: 'victory', label: '四条胜利路线', body: '征服、富国、合纵、永恒会随着局势动态排序。', tone: 'gold' },
        { id: 'chronicle', label: '帝国史册', body: '记录开国、扩张、危机、继承和胜利，形成本局历史。', tone: 'info' },
        { id: 'difficulty', label: '挑战阶梯', body: '从地中海黎明到帝国黄昏，逐步学习系统压力。', tone: 'warn' },
      ],
    },
  ];
  return {
    headline: '先会治理，再谈征服',
    subtitle: 'Imperium Aeternum 的核心不是点完所有按钮，而是建立“计划 → 推进 → 复盘 → 修正计划”的长期治理循环。',
    primaryAdvice: '第一局建议选地中海黎明；每年先看总览页，再决定是否结束本年。',
    sections,
    quickStart: sections.flatMap((s) => s.steps).filter((x) => ['roadmap', 'guidance', 'council', 'preview', 'report', 'save'].includes(x.id)),
  };
}

export function findHandbookSection(id: HandbookSectionId): HandbookSection {
  return buildLaunchHandbook().sections.find((x) => x.id === id)!;
}

export function firstTimeChecklist(): string[] {
  return buildLaunchHandbook().quickStart.map((x) => x.label);
}
