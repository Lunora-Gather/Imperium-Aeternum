import { useI18n } from '../i18n';
import { useGameStore } from '../store/gameStore';
import { availableTradeRoutes, routeYieldEstimate } from '../engine/economy';
import { foreignTradePartner, routeAccessBlocker, tradeRouteById } from '../engine/tradeNetwork';
import { tradeTreatyBlocker } from '../gameplay/actions/diplomacyActions';
import { Btn, Tag } from './ui';

export default function TradeRoutesPanel() {
  const { state, formTrade, embargoTradeRoute, establishTradeRoute } = useGameStore();
  const nation = state.nations[state.playerNationId];
  const { t } = useI18n();
  const offers = availableTradeRoutes(nation, state);
  const active = nation.activeTradeRoutes.flatMap(({ routeId }) => {
    const def = tradeRouteById(routeId);
    return def ? [{ def, active: true, blocker: routeAccessBlocker(def, state, nation) }] : [];
  });
  const rows = [...active, ...offers.filter(row => !nation.activeTradeRoutes.some(r => r.routeId === row.def.id))
    .map(row => ({ ...row, active: false }))];
  return <div className="ia-trade-routes">{rows.map(row => {
    const { def, blocker } = row;
    const partner = foreignTradePartner(def, state, nation);
    const sign = partner && blocker === '需与对方签订贸易协定';
    const signBlocker = sign ? tradeTreatyBlocker(state, partner.id) : null;
    const embargo = nation.embargoedRoutes.includes(def.id);
    const yields = routeYieldEstimate(def.id, nation);
    return <article key={def.id} className="ia-card" data-route-id={def.id}>
      <strong>{t(def.name)}</strong>
      <div>{def.endpoints.map(id => t(state.provinces[id]?.name ?? id)).join(' → ')}</div>
      {partner && <span>{t(partner.name)}</span>}
      <small>{t('每年 {{gold}} 金 · {{food}} 粮 · {{influence}} 影响力', yields)}</small>
      {def.yield.food && def.yield.food < 0 ? <small>{t('优先保留口粮，货款按实际交付结算。')}</small> : null}
      {row.active ? <>
        <Tag text={embargo ? '禁运' : blocker ?? '运营中'} tone={embargo || blocker ? 'warn' : 'good'} />
        <Btn label={embargo ? '解除' : '禁运'} disabled={nation.resources.adminPt < 1} onClick={() => embargoTradeRoute(def.id)} />
      </> : <>
        <small>{t('开通需 {{gold}} 金和 1 行动点', { gold: def.costGold })}</small>
        {blocker && <span>{t(blocker)}</span>}
        <Btn label="建立" disabled={!!blocker} onClick={() => establishTradeRoute(def.id)} />
      </>}
      {sign && <><Btn label="签订贸易协定（30影响力 · 1行动点）" disabled={!!signBlocker}
        onClick={() => formTrade(partner.id)} />{signBlocker && <small>{t(signBlocker)}</small>}</>}
    </article>;
  })}{!rows.length && <p>{t('当前没有可连接的贸易据点。')}</p>}</div>;
}
