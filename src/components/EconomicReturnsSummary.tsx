import type { GameState, TurnReport } from '../types/game';
import { tradeRouteById } from '../engine/tradeNetwork';
import { useI18n } from '../i18n';

export function EconomicReturnsSummary({ state, report, recentOnly = false }: { state: GameState; report?: TurnReport | null; recentOnly?: boolean }) {
  const { t } = useI18n();
  const returns = report?.economicReturns;
  if (!returns) return null;
  const routes = returns.routes.filter(row => !recentOnly || row.opened);
  const contract = returns.contract;
  if (!routes.length && !returns.harvests.length && !contract) return null;
  return <section className="ia-card" style={{ padding: 12, marginBlock: 8 }} aria-label={t('本年经营回报')}>
    <strong>{t('本年经营回报')}</strong>
    {contract && <div>{t('向{{partner}}交付 {{food}} 粮，收 {{gold}} 金，余 {{years}} 年', {
      partner: t(state.nations[contract.partnerId]?.name ?? contract.partnerId), food: -contract.food, gold: contract.gold, years: contract.yearsLeft,
    })}</div>}
    {returns.harvests.map(row => <div key={row.provinceId}>{t('{{province}}开垦增产 {{food}} 粮', {
      province: t(state.provinces[row.provinceId]?.name ?? row.provinceId), food: Math.round(row.food),
    })}</div>)}
    {routes.map(row => {
      const route = tradeRouteById(row.routeId);
      if (!route) return null;
      return <div key={row.routeId}>{t(route.name)} · {route.endpoints.map(id => t(state.provinces[id]?.name ?? id)).join(' → ')}
        {' · '}{t('实收 {{gold}} 金 · {{food}} 粮 · {{influence}} 影响力', { gold: Math.round(row.gold), food: row.food, influence: row.influence })}</div>;
    })}
    <small>{t('本年常规粮储净变动 {{amount}}', { amount: Math.round(returns.grainBalance) })}</small>
  </section>;
}
