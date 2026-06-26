// 剧本选择页 v3 — 剧本推荐 + 国家风格标签 + 顶部主题控制
import { useState } from 'react';
import { useGameStore, SCENARIOS, type ScenarioId } from '../store/gameStore';
import { clearAllSaves, SAVE_VERSION } from '../store/persistence';
import { Btn, Tag } from '../components/ui';

const BUILD_MARK = '开局引导 v3';
const THEMES = [
  { id: 'night', label: '暗夜', icon: '☾' },
  { id: 'day', label: '羊皮', icon: '☀' },
  { id: 'bamboo', label: '竹简', icon: '筠' },
  { id: 'ink', label: '水墨', icon: '墨' },
] as const;

const SCENARIO_HINT: Record<string, { style: string; difficulty: string; tone: 'good' | 'warn' | 'danger' | 'info'; advice: string }> = {
  classic: { style: '入门', difficulty: '低', tone: 'good', advice: '最适合第一次玩，国家少、回合快、风险可控。' },
  world: { style: '完整世界', difficulty: '高', tone: 'danger', advice: '国家最多，信息量最大，适合熟悉系统后长期游玩。' },
  eastasia: { style: '区域经营', difficulty: '中', tone: 'info', advice: '适合体验秦汉、匈奴和南亚势力的区域博弈。' },
  w3_eastasia: { style: '东方争霸', difficulty: '中', tone: 'info', advice: '扩张与内政并重，推荐喜欢东方剧本的玩家。' },
  w5_mediterranean: { style: '战争贸易', difficulty: '中高', tone: 'warn', advice: '罗马、迦太基、波斯同台，冲突和海贸都很重要。' },
  w6_americas: { style: '独立发展', difficulty: '中', tone: 'info', advice: '国家较少，适合专注美洲文明发展线。' },
  w7_random: { style: '随机挑战', difficulty: '未知', tone: 'warn', advice: '随机洲开局，适合老手测试适应能力。' },
  w4_europe: { style: '封建混战', difficulty: '中高', tone: 'warn', advice: '多国接壤、外交复杂，适合喜欢联盟与战争的玩家。' },
  w8_indianocean: { style: '海贸经营', difficulty: '中', tone: 'good', advice: '适合偏贸易、港口和印度洋路线的玩法。' },
  challenge_survival: { style: '高压生存', difficulty: '极高', tone: 'danger', advice: '资源少、叛乱高、外交差，不建议新手直接玩。' },
};

function nationStyle(desc: string, tier: string): { text: string; tone: 'good' | 'warn' | 'danger' | 'info' | 'gold' }[] {
  const out: { text: string; tone: 'good' | 'warn' | 'danger' | 'info' | 'gold' }[] = [];
  if (tier === 'S') out.push({ text: '强国', tone: 'gold' });
  else if (tier === 'A') out.push({ text: '稳健', tone: 'info' });
  else out.push({ text: '挑战', tone: 'warn' });
  if (/商业|海贸|贸易|商/.test(desc)) out.push({ text: '贸易', tone: 'good' });
  if (/军|骑兵|游牧|扩张|霸主/.test(desc)) out.push({ text: '军事', tone: 'danger' });
  if (/中央|行政|集权|治术/.test(desc)) out.push({ text: '行政', tone: 'info' });
  if (/民心|福利|人口/.test(desc)) out.push({ text: '民生', tone: 'good' });
  return out.slice(0, 4);
}

export default function ScenarioSelect() {
  const { startScenario, startWithNation, load, hasSave, log } = useGameStore();
  const [selected, setSelected] = useState<ScenarioId | null>(null);
  const [pickedNation, setPickedNation] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(() => { try { return localStorage.getItem('ia-theme') || 'night'; } catch { return 'night'; } });
  const scenario = SCENARIOS.find((s) => s.id === selected);
  const saveExists = hasSave();

  const applyTheme = (next: string) => { setTheme(next); document.documentElement.setAttribute('data-theme', next === 'night' ? '' : next); try { localStorage.setItem('ia-theme', next); } catch { /* ignore */ } };
  const clearLocal = () => { if (!window.confirm('确认删除本浏览器里的全部 Imperium Aeternum 存档？')) return; clearAllSaves(); setTheme((x) => `${x}`); };

  if (scenario && scenario.needsNationPick && !pickedNation) {
    const hint = SCENARIO_HINT[scenario.id] ?? { style: '剧本', difficulty: '中', tone: 'info' as const, advice: scenario.description };
    return (
      <div className="ia-menu ia-menu--compact">
        <div className="ia-menu-toolbar"><button className="ia-btn ia-btn--ghost" onClick={() => { setSelected(null); setPickedNation(null); }}>← 剧本大厅</button><ThemeSwitch theme={theme} applyTheme={applyTheme} /></div>
        <header className="ia-menu-hero"><div className="ia-up ia-menu-kicker">Choose Nation</div><h1 className="ia-display">{scenario.name}</h1><p>{scenario.description}</p><div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8 }}><Tag text={hint.style} tone={hint.tone} /><Tag text={`难度 ${hint.difficulty}`} tone={hint.tone} /></div></header>
        <div className="ia-card" style={{ maxWidth: 760, margin: '0 auto 14px', padding: 10, textAlign: 'center', color: 'var(--text-mute)', fontSize: 12 }}>{hint.advice}</div>
        <div className="ia-menu-section-title ia-up">选择你的邦国</div>
        <div className="ia-nation-grid">
          {scenario.playableNations?.map((n) => <button key={n.id} className="ia-choice-card" onClick={() => setPickedNation(n.id)}><div className="ia-choice-head"><strong className="ia-display">{n.name}</strong><Tag text={n.tier} tone={n.tier === 'S' ? 'gold' : n.tier === 'A' ? 'info' : 'warn'} /></div><p>{n.desc}</p><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>{nationStyle(n.desc, n.tier).map((x) => <Tag key={x.text} text={x.text} tone={x.tone} />)}</div></button>)}
        </div>
      </div>
    );
  }

  if (scenario && pickedNation) {
    const nation = scenario.playableNations?.find((n) => n.id === pickedNation);
    return (
      <div className="ia-menu ia-menu--confirm">
        <div className="ia-menu-toolbar"><button className="ia-btn ia-btn--ghost" onClick={() => setPickedNation(null)}>← 重选邦国</button><ThemeSwitch theme={theme} applyTheme={applyTheme} /></div>
        <div className="ia-confirm-card"><p className="ia-up">即将开始</p><h1 className="ia-display">{scenario.name}</h1><p className="mute">{scenario.description}</p><div className="ia-confirm-nation"><span className="ia-up">你的邦国</span><h2 className="ia-display">{nation?.name}</h2><p>{nation?.desc}</p>{nation && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>{nationStyle(nation.desc, nation.tier).map((x) => <Tag key={x.text} text={x.text} tone={x.tone} />)}</div>}</div><div className="ia-confirm-actions"><Btn label="← 返回" variant="ghost" onClick={() => setPickedNation(null)} /><Btn label="开启纪元 →" variant="primary" onClick={() => startWithNation(pickedNation)} /></div></div>
      </div>
    );
  }

  return (
    <div className="ia-menu">
      <div className="ia-menu-toolbar"><div className="ia-menu-version"><Tag text={BUILD_MARK} tone="gold" /><Tag text={`存档 v${SAVE_VERSION}`} tone="info" /></div><ThemeSwitch theme={theme} applyTheme={applyTheme} /></div>
      <header className="ia-menu-hero"><div className="ia-up ia-menu-kicker">Grand Strategy Chronicle</div><h1 className="ia-display">Imperium Aeternum</h1><p className="ia-display ia-up">永恒帝国</p><div className="ia-menu-subtitle">治理一个国家数百年。扩张越快，崩溃越早。真正的胜利是建立一个能长期运转的国家机器。</div></header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8, margin: '0 auto 18px', maxWidth: 980 }}><Guide title="第一次玩" body="选地中海黎明，最快理解财政、省份、战争和事件。" tone="good" /><Guide title="喜欢大地图" body="选万邦纪元，但信息量很大，建议熟悉后再玩。" tone="danger" /><Guide title="喜欢贸易" body="选印度洋贸易或地中海争霸，经济路线更明显。" tone="info" /><Guide title="想受苦" body="选帝国黄昏，高压生存，不建议无存档硬冲。" tone="warn" /></div>
      <div className="ia-menu-section-title ia-up">选择剧本</div>
      <div className="ia-scenario-grid">
        {SCENARIOS.map((s) => { const hint = SCENARIO_HINT[s.id] ?? { style: '剧本', difficulty: '中', tone: 'info' as const, advice: s.description }; return <button key={s.id} className="ia-scenario-card" onClick={() => { startScenario(s.id); if (s.needsNationPick) { setSelected(s.id); setPickedNation(null); } }}><div className="ia-scenario-card__top"><h3 className="ia-display">{s.name}</h3><Tag text={s.nationCount} tone="gold" /></div><div className="ia-scenario-sub">{s.subtitle}</div><p>{s.description}</p><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}><Tag text={hint.style} tone={hint.tone} /><Tag text={`难度 ${hint.difficulty}`} tone={hint.tone} /></div><div className="ia-scenario-foot">{s.needsNationPick ? '选择邦国后开始' : '点击立即开始'}</div></button>; })}
      </div>
      <div className="ia-menu-actions">{saveExists && <Btn label="读取自动存档" variant="ghost" onClick={() => load()} />}{saveExists && <Btn label="清空本地存档" warn onClick={clearLocal} />}</div>
      {log.length > 0 && <p className="dim ia-menu-log">{log[log.length - 1]}</p>}
    </div>
  );
}

function Guide({ title, body, tone }: { title: string; body: string; tone: 'good' | 'warn' | 'danger' | 'info' }) {
  return <div className="ia-card" style={{ padding: 10, textAlign: 'left', borderLeft: `3px solid var(--${tone === 'danger' ? 'war' : tone === 'warn' ? 'warn' : tone === 'good' ? 'good' : 'border'})` }}><Tag text={title} tone={tone} /><div style={{ marginTop: 6, color: 'var(--text-mute)', fontSize: 11, lineHeight: 1.5 }}>{body}</div></div>;
}

function ThemeSwitch({ theme, applyTheme }: { theme: string; applyTheme: (theme: string) => void }) {
  return <div className="ia-theme-switch" aria-label="主题模式">{THEMES.map((t) => <button key={t.id} onClick={() => applyTheme(t.id)} className={theme === t.id || (theme === '' && t.id === 'night') ? 'is-active' : ''} title={`${t.label}主题`}><span>{t.icon}</span><em>{t.label}</em></button>)}</div>;
}
