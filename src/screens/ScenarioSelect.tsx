// 剧本选择页 — 开场选剧本 + 选国
import { useState } from 'react';
import { useGameStore, SCENARIOS, type ScenarioId } from '../store/gameStore';
import { clearAllSaves, SAVE_VERSION } from '../store/persistence';
import { Btn, Tag } from '../components/ui';

const BUILD_MARK = '优化版 v4 · hookfix-310';

export default function ScenarioSelect() {
  const { startScenario, startWithNation, load, hasSave, log } = useGameStore();
  const [selected, setSelected] = useState<ScenarioId | null>(null);
  const [pickedNation, setPickedNation] = useState<string | null>(null);
  const [, forceRefresh] = useState(0);

  const scenario = SCENARIOS.find((s) => s.id === selected);
  const saveExists = hasSave();

  const clearLocal = () => {
    if (!window.confirm('确认删除本浏览器里的全部 Imperium Aeternum 存档？')) return;
    clearAllSaves();
    forceRefresh((x) => x + 1);
  };

  // 选了剧本但需要选国：显示选国界面
  if (scenario && scenario.needsNationPick && !pickedNation) {
    return (
      <div style={{ maxWidth: 900, margin: '60px auto', padding: '0 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <h1 className="ia-display" style={{ fontSize: 36, margin: 0, letterSpacing: '0.1em' }}>{scenario.name}</h1>
          <p className="mute" style={{ marginTop: 'var(--space-3)', fontSize: 13 }}>{scenario.description}</p>
        </div>
        <div className="ia-display ia-up" style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 'var(--space-4)' }}>
          选择你的邦国
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 'var(--space-3)' }}>
          {scenario.playableNations?.map((n) => (
            <button key={n.id} className="ia-card" onClick={() => setPickedNation(n.id)}
              style={{ cursor: 'pointer', textAlign: 'left', padding: 'var(--space-4)', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-gold)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                <strong className="ia-display" style={{ fontSize: 16 }}>{n.name}</strong>
                <Tag text={n.tier} tone={n.tier === 'S' ? 'gold' : n.tier === 'A' ? 'info' : 'warn'} />
              </div>
              <p className="mute" style={{ fontSize: 12, margin: 0, lineHeight: 1.5 }}>{n.desc}</p>
            </button>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--space-5)' }}>
          <Btn label="← 返回剧本列表" variant="ghost" onClick={() => { setSelected(null); setPickedNation(null); }} />
        </div>
      </div>
    );
  }

  // 选了剧本且选了国：确认界面
  if (scenario && pickedNation) {
    const nation = scenario.playableNations?.find((n) => n.id === pickedNation);
    return (
      <div style={{ maxWidth: 560, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
        <p className="ia-up" style={{ fontSize: 10, color: 'var(--text-dim)' }}>即将开始</p>
        <h1 className="ia-display" style={{ fontSize: 32, margin: 'var(--space-2) 0' }}>{scenario.name}</h1>
        <p className="mute" style={{ fontSize: 13, marginBottom: 'var(--space-5)' }}>{scenario.description}</p>
        <div className="ia-card--raised" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)' }}>
          <p className="ia-up" style={{ fontSize: 10, color: 'var(--text-dim)' }}>你的邦国</p>
          <h2 className="ia-display" style={{ fontSize: 24, margin: 'var(--space-2) 0', color: 'var(--gold)' }}>{nation?.name}</h2>
          <p className="mute" style={{ fontSize: 12 }}>{nation?.desc}</p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'center' }}>
          <Btn label="← 重选" variant="ghost" onClick={() => setPickedNation(null)} />
          <Btn label="开启纪元 →" variant="primary" onClick={() => startWithNation(pickedNation)} />
        </div>
      </div>
    );
  }

  // 默认：剧本列表
  return (
    <div style={{ maxWidth: 920, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
        <h1 className="ia-display" style={{ fontSize: 42, margin: 0, letterSpacing: '0.12em', color: 'var(--gold)' }}>
          Imperium Aeternum
        </h1>
        <p className="ia-display ia-up" style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 'var(--space-2)', letterSpacing: '0.2em' }}>
          永恒帝国
        </p>
        <p className="mute" style={{ marginTop: 'var(--space-4)', fontSize: 13, maxWidth: 520, margin: 'var(--space-4) auto 0' }}>
          治理一个国家数百年。扩张越快，崩溃越早。真正的胜利是建立一个能长期运转的国家机器。
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
          <Tag text={BUILD_MARK} tone="gold" />
          <Tag text={`存档 v${SAVE_VERSION}`} tone="info" />
          <Tag text="旧档自动修复" tone="good" />
        </div>
      </div>

      <div className="ia-display ia-up" style={{ fontSize: 11, color: 'var(--text-dim)', textAlign: 'center', marginBottom: 'var(--space-4)' }}>
        选择剧本
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
        {SCENARIOS.map((s) => (
          <button key={s.id} className="ia-card" onClick={() => {
              startScenario(s.id);
              if (s.needsNationPick) { setSelected(s.id); setPickedNation(null); }
            }}
            style={{ cursor: 'pointer', textAlign: 'left', padding: 'var(--space-5)', transition: 'all 0.2s' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--space-3)' }}>
              <h3 className="ia-display" style={{ margin: 0, fontSize: 18, color: 'var(--text)' }}>{s.name}</h3>
              <Tag text={s.nationCount} tone="gold" />
            </div>
            <p className="mute" style={{ fontSize: 10, margin: '0 0 var(--space-3) 0', letterSpacing: '0.05em' }}>{s.subtitle}</p>
            <p className="mute" style={{ fontSize: 12, margin: 0, lineHeight: 1.6 }}>{s.description}</p>
          </button>
        ))}
      </div>

      <div style={{ textAlign: 'center', display: 'flex', gap: 'var(--space-3)', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        {saveExists && <Btn label="读取自动存档" variant="ghost" onClick={() => load()} />}
        {saveExists && <Btn label="清空本地存档" warn onClick={clearLocal} />}
        <button onClick={() => {
          const order = ['night', 'day', 'bamboo', 'ink'];
          let cur = 'night';
          try { cur = localStorage.getItem('ia-theme') || 'night'; } catch { /* ignore */ }
          const next = order[(order.indexOf(cur) + 1) % order.length];
          document.documentElement.setAttribute('data-theme', next === 'night' ? '' : next);
          try { localStorage.setItem('ia-theme', next); } catch { /* ignore */ }
          forceRefresh((x) => x + 1);
        }} title="切换主题（暗夜/象牙/竹简/水墨）" style={{
          width: 36, height: 36, borderRadius: '50%', cursor: 'pointer',
          background: 'radial-gradient(circle at 35% 35%, #3a3220, #14110d)',
          border: '1px solid var(--border-gold)', color: 'var(--gold)', fontSize: 16, padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}><span>☾</span></button>
      </div>

      {log.length > 0 && <p className="dim" style={{ textAlign: 'center', marginTop: 'var(--space-4)', fontSize: 11 }}>{log[log.length - 1]}</p>}
    </div>
  );
}
