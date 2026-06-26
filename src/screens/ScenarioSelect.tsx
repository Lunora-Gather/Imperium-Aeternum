// 剧本选择页 v34 — 开局大厅：难度挑战阶梯 + 存档健康继续 + 剧本推荐画像
import { useMemo, useState } from 'react';
import { useGameStore, SCENARIOS, type ScenarioId } from '../store/gameStore';
import { clearAllSaves, SAVE_VERSION } from '../store/persistence';
import { inspectAllSaveSlots, type SaveRecoveryPreview } from '../gameplay/saveRecovery';
import { getScenarioProfile, nationStyleTags, recommendedScenarioIds, summarizeSavePreviews, type LaunchTone } from '../gameplay/launchHub';
import { buildScenarioChallengeGuide, recommendedChallengePath, summarizeChallengePath, type ScenarioChallengeGuide } from '../gameplay/difficultyGuide';
import { BUILD_MARK } from '../buildInfo';
import { Btn, Tag } from '../components/ui';

const THEMES = [
  { id: 'night', label: '暗夜', icon: '☾' },
  { id: 'day', label: '羊皮', icon: '☀' },
  { id: 'bamboo', label: '竹简', icon: '筠' },
  { id: 'ink', label: '水墨', icon: '墨' },
] as const;

function toneVar(tone: LaunchTone): string { return tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : tone === 'gold' ? 'gold' : 'border'; }

export default function ScenarioSelect() {
  const { startScenario, startWithNation, loadFromSlot, hasSave, log } = useGameStore();
  const [selected, setSelected] = useState<ScenarioId | null>(null);
  const [pickedNation, setPickedNation] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(() => { try { return localStorage.getItem('ia-theme') || 'night'; } catch { return 'night'; } });
  const [previews, setPreviews] = useState<SaveRecoveryPreview[]>(() => inspectAllSaveSlots());
  const scenario = SCENARIOS.find((s) => s.id === selected);
  const saveExists = hasSave();
  const saveSummary = useMemo(() => summarizeSavePreviews(previews), [previews]);
  const recommended = useMemo(() => new Set(recommendedScenarioIds()), []);
  const challengePath = useMemo(() => summarizeChallengePath(), []);

  const applyTheme = (next: string) => { setTheme(next); document.documentElement.setAttribute('data-theme', next === 'night' ? '' : next); try { localStorage.setItem('ia-theme', next); } catch { /* ignore */ } };
  const refreshSaves = () => setPreviews(inspectAllSaveSlots());
  const clearLocal = () => { if (!window.confirm('确认清理本浏览器里的全部 Imperium Aeternum 存档？')) return; clearAllSaves(); refreshSaves(); };
  const continueBest = () => { if (saveSummary.best) loadFromSlot(saveSummary.best.slot); };

  if (scenario && scenario.needsNationPick && !pickedNation) {
    const hint = getScenarioProfile(scenario.id);
    const challenge = buildScenarioChallengeGuide(scenario.id);
    return <div className="ia-menu ia-menu--compact">
      <div className="ia-menu-toolbar"><button className="ia-btn ia-btn--ghost" onClick={() => { setSelected(null); setPickedNation(null); }}>← 剧本大厅</button><ThemeSwitch theme={theme} applyTheme={applyTheme} /></div>
      <header className="ia-menu-hero"><div className="ia-up ia-menu-kicker">Choose Nation</div><h1 className="ia-display">{scenario.name}</h1><p>{scenario.description}</p><div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}><Tag text={hint.marketTag} tone={hint.tone} /><Tag text={`难度 ${hint.difficulty}`} tone={hint.tone} /><Tag text={challenge.label} tone={challenge.tone} /><Tag text={hint.audience} tone="info" /></div></header>
      <ChallengePanel guide={challenge} />
      <div className="ia-card" style={{ maxWidth: 820, margin: '0 auto 14px', padding: 12, textAlign: 'center', color: 'var(--text-mute)', fontSize: 12, lineHeight: 1.6 }}>{hint.advice}</div>
      <div className="ia-menu-section-title ia-up">选择你的邦国</div>
      <div className="ia-nation-grid">{scenario.playableNations?.map((n) => <button key={n.id} className="ia-choice-card" onClick={() => setPickedNation(n.id)}><div className="ia-choice-head"><strong className="ia-display">{n.name}</strong><Tag text={n.tier} tone={n.tier === 'S' ? 'gold' : n.tier === 'A' ? 'info' : 'warn'} /></div><p>{n.desc}</p><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>{nationStyleTags(n.desc, n.tier).map((x) => <Tag key={x.text} text={x.text} tone={x.tone} />)}</div></button>)}</div>
    </div>;
  }

  if (scenario && pickedNation) {
    const nation = scenario.playableNations?.find((n) => n.id === pickedNation);
    const hint = getScenarioProfile(scenario.id);
    const challenge = buildScenarioChallengeGuide(scenario.id);
    return <div className="ia-menu ia-menu--confirm">
      <div className="ia-menu-toolbar"><button className="ia-btn ia-btn--ghost" onClick={() => setPickedNation(null)}>← 重选邦国</button><ThemeSwitch theme={theme} applyTheme={applyTheme} /></div>
      <div className="ia-confirm-card"><p className="ia-up">即将开始</p><h1 className="ia-display">{scenario.name}</h1><p className="mute">{scenario.description}</p><div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 10 }}><Tag text={hint.marketTag} tone={hint.tone} /><Tag text={`难度 ${hint.difficulty}`} tone={hint.tone} /><Tag text={`${challenge.label} · 压力 ${challenge.pressure}`} tone={challenge.tone} /></div><div className="ia-confirm-nation"><span className="ia-up">你的邦国</span><h2 className="ia-display">{nation?.name}</h2><p>{nation?.desc}</p>{nation && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>{nationStyleTags(nation.desc, nation.tier).map((x) => <Tag key={x.text} text={x.text} tone={x.tone} />)}</div>}</div><ChallengePanel guide={challenge} compact /><div className="ia-confirm-actions"><Btn label="← 返回" variant="ghost" onClick={() => setPickedNation(null)} /><Btn label="开启纪元 →" variant="primary" onClick={() => startWithNation(pickedNation)} /></div></div>
    </div>;
  }

  return <div className="ia-menu">
    <div className="ia-menu-toolbar"><div className="ia-menu-version"><Tag text={BUILD_MARK} tone="gold" /><Tag text={`存档 v${SAVE_VERSION}`} tone="info" /><Tag text={saveSummary.headline} tone={saveSummary.tone} /></div><ThemeSwitch theme={theme} applyTheme={applyTheme} /></div>
    <header className="ia-menu-hero"><div className="ia-up ia-menu-kicker">Grand Strategy Chronicle</div><h1 className="ia-display">Imperium Aeternum</h1><p className="ia-display ia-up">永恒帝国</p><div className="ia-menu-subtitle">治理一个国家数百年。扩张越快，崩溃越早。真正的胜利是建立一个能长期运转的国家机器。</div></header>
    <ContinuePanel summary={saveSummary} onContinue={continueBest} onRefresh={refreshSaves} />
    <DifficultyTrack path={challengePath.ids} headline={challengePath.headline} advice={challengePath.advice} onPick={(id) => { const s = SCENARIOS.find((x) => x.id === id); if (!s) return; if (s.needsNationPick) { setSelected(id); setPickedNation(null); } else startScenario(id); }} />
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, margin: '0 auto 18px', maxWidth: 980 }}><Guide title="第一次玩" body="选地中海黎明，最快理解财政、省份、战争和事件。" tone="good" /><Guide title="喜欢经营" body="选印度洋贸易，经济和海贸路线更清晰。" tone="info" /><Guide title="喜欢冲突" body="选地中海争霸，战争、贸易和外交都很密集。" tone="warn" /><Guide title="追求旗舰长局" body="选万邦纪元，但建议熟悉系统后再玩。" tone="danger" /></div>
    <div className="ia-menu-section-title ia-up">选择剧本</div>
    <div className="ia-scenario-grid">{SCENARIOS.map((s) => { const hint = getScenarioProfile(s.id); const challenge = buildScenarioChallengeGuide(s.id); const isRecommended = recommended.has(s.id); return <button key={s.id} className="ia-scenario-card" onClick={() => { startScenario(s.id); if (s.needsNationPick) { setSelected(s.id); setPickedNation(null); } }} style={{ borderColor: isRecommended ? `var(--${toneVar(hint.tone)})` : undefined }}><div className="ia-scenario-card__top"><h3 className="ia-display">{s.name}</h3><Tag text={s.nationCount} tone="gold" /></div><div className="ia-scenario-sub">{s.subtitle}</div><p>{s.description}</p><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}><Tag text={hint.marketTag} tone={hint.tone} /><Tag text={challenge.label} tone={challenge.tone} /><Tag text={`压力 ${challenge.pressure}`} tone={challenge.tone} />{isRecommended && <Tag text="推荐" tone="gold" />}</div><div style={{ marginTop: 8, color: 'var(--text-mute)', fontSize: 11, lineHeight: 1.45 }}>{challenge.headline} · {challenge.recommendedAfter}</div><div className="ia-scenario-foot">{s.needsNationPick ? '选择邦国后开始' : '点击立即开始'}</div></button>; })}</div>
    <div className="ia-menu-actions">{saveExists && <Btn label="读取自动存档" variant="ghost" onClick={() => loadFromSlot(0)} />}{saveSummary.best && <Btn label={`继续槽位 ${saveSummary.best.slot}`} variant="primary" onClick={continueBest} />}{previews.some((p) => p.status !== 'empty') && <Btn label="刷新存档体检" variant="ghost" onClick={refreshSaves} />}{previews.some((p) => p.status !== 'empty') && <Btn label="清理本地存档" warn onClick={clearLocal} />}</div>
    {log.length > 0 && <p className="dim ia-menu-log">{log[log.length - 1]}</p>}
  </div>;
}

function ChallengePanel({ guide, compact = false }: { guide: ScenarioChallengeGuide; compact?: boolean }) {
  return <div className="ia-card" style={{ maxWidth: 820, margin: compact ? '12px auto' : '0 auto 14px', padding: 12, textAlign: 'left', borderLeft: `4px solid var(--${toneVar(guide.tone)})` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}><div><Tag text={guide.label} tone={guide.tone} /><strong style={{ display: 'block', marginTop: 6, fontSize: 14 }}>{guide.headline}</strong></div><Tag text={`压力 ${guide.pressure}/100`} tone={guide.tone} /></div><div style={{ color: 'var(--text-mute)', fontSize: 12, lineHeight: 1.55 }}>{guide.why}</div>{!compact && <div style={{ color: 'var(--text-dim)', fontSize: 11, lineHeight: 1.5, marginTop: 6 }}>推荐前置：{guide.recommendedAfter} · 常见失败：{guide.likelyFailure}</div>}<div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>{guide.checklist.map((x) => <Tag key={x.id} text={x.text} tone={x.tone} />)}</div></div>;
}

function DifficultyTrack({ path, headline, advice, onPick }: { path: ScenarioId[]; headline: string; advice: string; onPick: (id: ScenarioId) => void }) {
  return <div className="ia-card" style={{ maxWidth: 980, margin: '0 auto 18px', padding: 12 }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 8 }}><div><Tag text="挑战阶梯" tone="gold" /><strong style={{ display: 'block', marginTop: 6, fontSize: 14 }}>{headline}</strong><div style={{ color: 'var(--text-mute)', fontSize: 11, lineHeight: 1.5, marginTop: 4 }}>{advice}</div></div></div><div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 6 }}>{path.map((id, index) => { const s = SCENARIOS.find((x) => x.id === id); const guide = buildScenarioChallengeGuide(id); return <button key={id} className="ia-btn ia-btn--ghost" onClick={() => onPick(id)} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3, padding: 8 }}><span style={{ fontSize: 11, color: 'var(--text-dim)' }}>第 {index + 1} 阶</span><strong>{s?.name ?? id}</strong><span style={{ fontSize: 11, color: `var(--${toneVar(guide.tone)})` }}>{guide.label} · {guide.pressure}</span></button>; })}</div></div>;
}

function ContinuePanel({ summary, onContinue, onRefresh }: { summary: ReturnType<typeof summarizeSavePreviews>; onContinue: () => void; onRefresh: () => void }) {
  const best = summary.best;
  return <div className="ia-card" style={{ maxWidth: 980, margin: '0 auto 18px', padding: 12, borderLeft: `4px solid var(--${toneVar(summary.tone)})` }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}><div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}><Tag text="继续游戏" tone={summary.tone} /><Tag text={`可读 ${summary.playable}/${summary.total}`} tone="info" />{summary.repairable > 0 && <Tag text={`可修复 ${summary.repairable}`} tone="warn" />}{summary.broken > 0 && <Tag text={`损坏 ${summary.broken}`} tone="danger" />}</div><strong style={{ fontSize: 14 }}>{best ? `推荐继续：槽位 ${best.slot} · ${best.nationName ?? '未知国家'} · 第 ${(best.turn ?? 0) + 1} 年` : summary.headline}</strong><div style={{ marginTop: 4, color: 'var(--text-mute)', fontSize: 12, lineHeight: 1.55 }}>{best ? `${best.label} · 体检 ${best.score ?? 0}/100${best.repairs.length ? ` · 将自动：${best.repairs.slice(0, 2).join('、')}` : ''}` : summary.advice}</div></div><div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{best && <Btn label={best.status === 'repairable' ? '修复并继续' : '继续最佳存档'} variant="primary" onClick={onContinue} />}<Btn label="刷新体检" variant="ghost" onClick={onRefresh} /></div></div></div>;
}

function Guide({ title, body, tone }: { title: string; body: string; tone: 'good' | 'warn' | 'danger' | 'info' }) {
  return <div className="ia-card" style={{ padding: 10, textAlign: 'left', borderLeft: `3px solid var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : 'border'})` }}><Tag text={title} tone={tone} /><div style={{ marginTop: 6, color: 'var(--text-mute)', fontSize: 11, lineHeight: 1.5 }}>{body}</div></div>;
}

function ThemeSwitch({ theme, applyTheme }: { theme: string; applyTheme: (theme: string) => void }) {
  return <div className="ia-theme-switch" aria-label="主题模式">{THEMES.map((t) => <button key={t.id} onClick={() => applyTheme(t.id)} className={theme === t.id || (theme === '' && t.id === 'night') ? 'is-active' : ''} title={`${t.label}主题`}><span>{t.icon}</span><em>{t.label}</em></button>)}</div>;
}
