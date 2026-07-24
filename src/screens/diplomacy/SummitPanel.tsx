import { useEffect, useMemo, useState } from 'react';
import { Btn, Tag } from '../../components/ui';
import { useI18n } from '../../i18n';
import { requestSummitAIBrief, type SummitAIBriefResult } from '../../services/appwrite/aiDiplomacyService';
import { useAccountStore } from '../../store/accountStore';
import {
  SUMMIT_AGENDAS,
  SUMMIT_STANCES,
  getActiveAccord,
  previewDiplomaticSummit,
} from '../../engine/summits';
import type { GameState, Nation, SummitAgenda, SummitStance } from '../../types/game';

const AGENDAS = Object.keys(SUMMIT_AGENDAS) as SummitAgenda[];
const STANCES = Object.keys(SUMMIT_STANCES) as SummitStance[];
const LIKELIHOOD = {
  very_low: { label: '成功机会很低', tone: 'danger' as const },
  uncertain: { label: '结果高度不确定', tone: 'warn' as const },
  plausible: { label: '存在可行空间', tone: 'info' as const },
  likely: { label: '达成协议希望较高', tone: 'good' as const },
};
const OUTCOME = {
  rejected: '拒绝接触',
  breakdown: '会谈破裂',
  stalemate: '未有成果',
  agreement: '达成协议',
  breakthrough: '取得突破',
};

interface Props {
  state: GameState;
  target: Nation;
  onClose: () => void;
  onConvene: (targetId: string, agenda: SummitAgenda, stance: SummitStance) => boolean;
}

export function SummitPanel({ state, target, onClose, onConvene }: Props) {
  const { locale, t } = useI18n();
  const authenticated = useAccountStore((account) => account.status === 'authenticated' && !!account.user);
  const [agenda, setAgenda] = useState<SummitAgenda>('normalization');
  const [stance, setStance] = useState<SummitStance>('pragmatic');
  const [aiBrief, setAiBrief] = useState<SummitAIBriefResult | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const player = state.nations[state.playerNationId];
  const preview = useMemo(
    () => previewDiplomaticSummit(state, state.playerNationId, target.id, agenda, stance),
    [state, target.id, agenda, stance],
  );
  const active = getActiveAccord(state, state.playerNationId, target.id);
  const latest = [...state.diplomaticSummits]
    .reverse()
    .find((entry) => (entry.initiatorId === state.playerNationId && entry.targetId === target.id)
      || (entry.targetId === state.playerNationId && entry.initiatorId === target.id));
  const likelihood = LIKELIHOOD[preview.likelihood];
  const positive = preview.factors.filter((entry) => entry.value > 0).sort((a, b) => b.value - a.value).slice(0, 4);
  const negative = preview.factors.filter((entry) => entry.value < 0).sort((a, b) => a.value - b.value).slice(0, 4);

  useEffect(() => { setAiBrief(null); }, [agenda, stance, target.id]);

  const generateAIBrief = async () => {
    if (!authenticated || aiBusy) return;
    setAiBusy(true);
    try { setAiBrief(await requestSummitAIBrief(state, target, agenda, stance, preview, locale)); }
    finally { setAiBusy(false); }
  };

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  return <div className="ia-modal-backdrop" onClick={onClose}>
    <section className="ia-help-card ia-fade-in" role="dialog" aria-modal="true" aria-labelledby="ia-summit-title" onClick={(event) => event.stopPropagation()} style={{ width: 'min(860px, calc(100vw - 24px))', maxHeight: 'min(820px, calc(100vh - 24px))', overflowY: 'auto' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
      <div>
        <div style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700 }}>元首会谈筹备</div>
        <strong id="ia-summit-title">{player.ruler.name} 与 {target.ruler.name}</strong>
        <div className="dim" style={{ fontSize: 11, marginTop: 2 }}>第 {state.turn + 1} 年 · 结果由关系、信任、国力、对方取向和有限不确定性共同决定</div>
      </div>
      <Btn label="关闭" variant="ghost" onClick={onClose} />
    </div>

    {active && <div style={{ padding: 8, marginBottom: 10, border: '1px solid var(--good)', borderRadius: 6 }}>
      <Tag text="生效中" tone="good" /> <strong style={{ fontSize: 12 }}>{SUMMIT_AGENDAS[active.agenda].agreementName}</strong>
      <span className="dim" style={{ fontSize: 11 }}> · 至第 {active.expiresTurn + 1} 年 · {active.strength === 2 ? '强化协议' : '基础协议'}</span>
    </div>}

    <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 5 }}>商谈议题</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 6, marginBottom: 10 }}>
      {AGENDAS.map((id) => <button key={id} className={`ia-btn ${agenda === id ? 'ia-btn--primary' : 'ia-btn--ghost'}`} onClick={() => setAgenda(id)} style={{ display: 'block', textAlign: 'left', minHeight: 64 }}>
        <strong style={{ display: 'block', fontSize: 12 }}>{SUMMIT_AGENDAS[id].label}</strong>
        <span style={{ display: 'block', fontSize: 10, lineHeight: 1.4, opacity: 0.78, marginTop: 3 }}>{SUMMIT_AGENDAS[id].description}</span>
      </button>)}
    </div>

    <div style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 5 }}>交涉姿态</div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 6, marginBottom: 10 }}>
      {STANCES.map((id) => <button key={id} className={`ia-btn ${stance === id ? 'ia-btn--primary' : 'ia-btn--ghost'}`} onClick={() => setStance(id)} style={{ display: 'block', textAlign: 'left' }}>
        <strong style={{ fontSize: 11 }}>{SUMMIT_STANCES[id].label}</strong>
        <span style={{ display: 'block', fontSize: 10, opacity: 0.75, marginTop: 2 }}>{SUMMIT_STANCES[id].description}</span>
      </button>)}
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 8, marginBottom: 10 }}>
      <div className="ia-card" style={{ padding: 9 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
          <Tag text={likelihood.label} tone={preview.eligible ? likelihood.tone : 'danger'} />
          <strong style={{ color: 'var(--gold)' }}>{preview.willingness}/100</strong>
        </div>
        <div className="dim" style={{ fontSize: 10, lineHeight: 1.5, marginTop: 6 }}>这是对方会谈意愿，不是保证结果。正式会谈仍有有限波动，但同一局势下可复现。</div>
        <div style={{ fontSize: 11, marginTop: 7 }}>成本：{preview.costs.adminPt} 行政 · {preview.costs.influence} 影响 · {preview.costs.gold} 金</div>
      </div>
      <div className="ia-card" style={{ padding: 9 }}>
        {preview.reasons.length > 0
          ? <><strong style={{ color: 'var(--war)', fontSize: 11 }}>当前不能召开</strong>{preview.reasons.map((reason) => <div key={reason} style={{ color: 'var(--text-dim)', fontSize: 10, lineHeight: 1.5 }}>• {reason}</div>)}</>
          : <><strong style={{ color: 'var(--good)', fontSize: 11 }}>先决条件已满足</strong><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 5 }}><div>{positive.map((entry) => <div key={entry.label} title={entry.detail} style={{ color: 'var(--good)', fontSize: 10 }}>+{entry.value} {entry.label}</div>)}</div><div>{negative.map((entry) => <div key={entry.label} title={entry.detail} style={{ color: 'var(--warn)', fontSize: 10 }}>{entry.value} {entry.label}</div>)}</div></div></>}
      </div>
    </div>

    <div className="ia-card" style={{ padding: 10, marginBottom: 10, borderColor: aiBrief?.source === 'huggingface' ? 'var(--gold)' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <div><Tag text={t('AI 书记官')} tone="gold" /> <strong style={{ fontSize: 11 }}>{t('会谈研判与措辞辅助')}</strong></div>
        <Btn label={t(aiBusy ? '研判中…' : authenticated ? '生成 AI 会谈简报' : '登录后启用 AI 书记官')} variant="ghost" disabled={!authenticated || aiBusy} onClick={generateAIBrief} />
      </div>
      <div className="dim" style={{ fontSize: 10, lineHeight: 1.5, marginTop: 6 }}>{t('Hugging Face 只解释规则已经计算出的外交事实，不改变成功率、协议、资源或实际会谈结果。')}</div>
      {aiBrief && <div className="ia-fade-in" style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}><Tag text={t(aiBrief.source === 'huggingface' ? 'Hugging Face 推理' : '规则降级')} tone={aiBrief.source === 'huggingface' ? 'good' : 'warn'} /><strong style={{ fontSize: 12 }}>{aiBrief.brief.headline}</strong></div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8, marginTop: 7 }}>
          <div><div className="dim" style={{ fontSize: 10 }}>{t('对方立场')}</div><div style={{ fontSize: 11, lineHeight: 1.55 }}>{aiBrief.brief.counterpartyPosition}</div></div>
          <div><div className="dim" style={{ fontSize: 10 }}>{t('建议开场')}</div><div style={{ fontSize: 11, lineHeight: 1.55 }}>{aiBrief.brief.recommendedOpening}</div></div>
        </div>
        <div style={{ marginTop: 7 }}>{aiBrief.brief.risks.map((risk) => <div key={risk} style={{ fontSize: 10, lineHeight: 1.5, color: 'var(--warn)' }}>• {risk}</div>)}</div>
        <div className="dim" style={{ fontSize: 10, lineHeight: 1.5, marginTop: 5 }}>{t('依据：')}{aiBrief.brief.basis}</div>
        {aiBrief.message && <div style={{ fontSize: 10, lineHeight: 1.5, color: 'var(--warn)', marginTop: 4 }}>{t('AI 服务未响应，已自动使用规则简报：')}{aiBrief.message}</div>}
      </div>}
    </div>

    {latest && <div style={{ marginBottom: 10, padding: 8, borderLeft: '3px solid var(--border-hi)', background: 'var(--bg-card)' }}>
      <div style={{ fontSize: 10, color: 'var(--text-mute)' }}>最近接触 · 第 {latest.turn + 1} 年 · {OUTCOME[latest.outcome]}</div>
      <div style={{ fontSize: 11, lineHeight: 1.5 }}>{latest.summary}</div>
      {latest.commitments.length > 0 && <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>{latest.commitments.map((item) => <Tag key={item} text={item} tone="good" />)}</div>}
    </div>}

    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <Btn label={preview.eligible ? `召开：${SUMMIT_AGENDAS[agenda].label}` : '条件尚未满足'} variant="primary" disabled={!preview.eligible} onClick={() => onConvene(target.id, agenda, stance)} />
    </div>
    </section>
  </div>;
}
