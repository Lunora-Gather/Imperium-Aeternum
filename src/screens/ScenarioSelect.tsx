// 剧本选择页 — 四列剧本大厅 + 顶部主题控制
import { useState } from 'react';
import { useGameStore, SCENARIOS, type ScenarioId } from '../store/gameStore';
import { clearAllSaves, SAVE_VERSION } from '../store/persistence';
import { Btn, Tag } from '../components/ui';

const BUILD_MARK = '布局优化 v2';
const THEMES = [
  { id: 'night', label: '暗夜', icon: '☾' },
  { id: 'day', label: '羊皮', icon: '☀' },
  { id: 'bamboo', label: '竹简', icon: '筠' },
  { id: 'ink', label: '水墨', icon: '墨' },
] as const;

export default function ScenarioSelect() {
  const { startScenario, startWithNation, load, hasSave, log } = useGameStore();
  const [selected, setSelected] = useState<ScenarioId | null>(null);
  const [pickedNation, setPickedNation] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>(() => {
    try { return localStorage.getItem('ia-theme') || 'night'; } catch { return 'night'; }
  });

  const scenario = SCENARIOS.find((s) => s.id === selected);
  const saveExists = hasSave();

  const applyTheme = (next: string) => {
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next === 'night' ? '' : next);
    try { localStorage.setItem('ia-theme', next); } catch { /* ignore */ }
  };

  const clearLocal = () => {
    if (!window.confirm('确认删除本浏览器里的全部 Imperium Aeternum 存档？')) return;
    clearAllSaves();
    setTheme((x) => `${x}`);
  };

  // 选了剧本但需要选国：显示选国界面
  if (scenario && scenario.needsNationPick && !pickedNation) {
    return (
      <div className="ia-menu ia-menu--compact">
        <div className="ia-menu-toolbar">
          <button className="ia-btn ia-btn--ghost" onClick={() => { setSelected(null); setPickedNation(null); }}>← 剧本大厅</button>
          <ThemeSwitch theme={theme} applyTheme={applyTheme} />
        </div>
        <header className="ia-menu-hero">
          <div className="ia-up ia-menu-kicker">Choose Nation</div>
          <h1 className="ia-display">{scenario.name}</h1>
          <p>{scenario.description}</p>
        </header>
        <div className="ia-menu-section-title ia-up">选择你的邦国</div>
        <div className="ia-nation-grid">
          {scenario.playableNations?.map((n) => (
            <button key={n.id} className="ia-choice-card" onClick={() => setPickedNation(n.id)}>
              <div className="ia-choice-head">
                <strong className="ia-display">{n.name}</strong>
                <Tag text={n.tier} tone={n.tier === 'S' ? 'gold' : n.tier === 'A' ? 'info' : 'warn'} />
              </div>
              <p>{n.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // 选了剧本且选了国：确认界面
  if (scenario && pickedNation) {
    const nation = scenario.playableNations?.find((n) => n.id === pickedNation);
    return (
      <div className="ia-menu ia-menu--confirm">
        <div className="ia-menu-toolbar">
          <button className="ia-btn ia-btn--ghost" onClick={() => setPickedNation(null)}>← 重选邦国</button>
          <ThemeSwitch theme={theme} applyTheme={applyTheme} />
        </div>
        <div className="ia-confirm-card">
          <p className="ia-up">即将开始</p>
          <h1 className="ia-display">{scenario.name}</h1>
          <p className="mute">{scenario.description}</p>
          <div className="ia-confirm-nation">
            <span className="ia-up">你的邦国</span>
            <h2 className="ia-display">{nation?.name}</h2>
            <p>{nation?.desc}</p>
          </div>
          <div className="ia-confirm-actions">
            <Btn label="← 返回" variant="ghost" onClick={() => setPickedNation(null)} />
            <Btn label="开启纪元 →" variant="primary" onClick={() => startWithNation(pickedNation)} />
          </div>
        </div>
      </div>
    );
  }

  // 默认：剧本大厅
  return (
    <div className="ia-menu">
      <div className="ia-menu-toolbar">
        <div className="ia-menu-version">
          <Tag text={BUILD_MARK} tone="gold" />
          <Tag text={`存档 v${SAVE_VERSION}`} tone="info" />
        </div>
        <ThemeSwitch theme={theme} applyTheme={applyTheme} />
      </div>

      <header className="ia-menu-hero">
        <div className="ia-up ia-menu-kicker">Grand Strategy Chronicle</div>
        <h1 className="ia-display">Imperium Aeternum</h1>
        <p className="ia-display ia-up">永恒帝国</p>
        <div className="ia-menu-subtitle">治理一个国家数百年。扩张越快，崩溃越早。真正的胜利是建立一个能长期运转的国家机器。</div>
      </header>

      <div className="ia-menu-section-title ia-up">选择剧本</div>
      <div className="ia-scenario-grid">
        {SCENARIOS.map((s) => (
          <button key={s.id} className="ia-scenario-card" onClick={() => {
            startScenario(s.id);
            if (s.needsNationPick) { setSelected(s.id); setPickedNation(null); }
          }}>
            <div className="ia-scenario-card__top">
              <h3 className="ia-display">{s.name}</h3>
              <Tag text={s.nationCount} tone="gold" />
            </div>
            <div className="ia-scenario-sub">{s.subtitle}</div>
            <p>{s.description}</p>
            <div className="ia-scenario-foot">{s.needsNationPick ? '选择邦国后开始' : '点击立即开始'}</div>
          </button>
        ))}
      </div>

      <div className="ia-menu-actions">
        {saveExists && <Btn label="读取自动存档" variant="ghost" onClick={() => load()} />}
        {saveExists && <Btn label="清空本地存档" warn onClick={clearLocal} />}
      </div>

      {log.length > 0 && <p className="dim ia-menu-log">{log[log.length - 1]}</p>}
    </div>
  );
}

function ThemeSwitch({ theme, applyTheme }: { theme: string; applyTheme: (theme: string) => void }) {
  return (
    <div className="ia-theme-switch" aria-label="主题模式">
      {THEMES.map((t) => (
        <button key={t.id} onClick={() => applyTheme(t.id)} className={theme === t.id || (theme === '' && t.id === 'night') ? 'is-active' : ''} title={`${t.label}主题`}>
          <span>{t.icon}</span><em>{t.label}</em>
        </button>
      ))}
    </div>
  );
}
