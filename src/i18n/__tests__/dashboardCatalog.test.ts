import { beforeAll, describe, expect, it } from 'vitest';
import { dashboardCatalog } from '../catalogs/dashboard';
import { registerGovernanceTranslations } from '../catalogs/governance';
import { translateScoped } from '../scoped';

const en = (source: string) => translateScoped(source, dashboardCatalog, {}, 'en');

beforeAll(() => registerGovernanceTranslations());

describe('dashboard dynamic English copy', () => {
  it('keeps advisor metric help fully translated', () => {
    expect(en('年度净收入来自税收、贸易、建筑、军费和腐败估算。')).toBe(
      'Annual net income estimates taxes, trade, buildings, military spending, and corruption.',
    );
    expect(en('补给姿态会影响战争承受力和军队扩张节奏。')).toBe(
      'Supply posture affects wartime endurance and the pace of military expansion.',
    );
    expect(en('综合平均关系、信任、影响力、贸易、同盟、战争和威胁。')).toBe(
      'Combines average relations, trust, influence, trade, alliances, wars, and threats.',
    );
    expect(en('高威胁、高敌意或战争对象需要优先处理。')).toBe(
      'Prioritize high-threat, hostile, or wartime counterparts.',
    );
  });

  it('formats annual values and planning horizons naturally', () => {
    expect(en('+528/年')).toBe('+528/year');
    expect(en('-294/年')).toBe('-294/year');
    expect(en('3～5 回合推进')).toBe('Advance over 3–5 turns');
  });

  it('does not compose the strategic summary from ambiguous one-character fragments', () => {
    expect(en('当前最优先入口是“发展核心省份”。处理后再看建设项和推进项。')).toBe(
      'The highest-priority entry is “Develop core provinces”. After resolving it, review development and turn actions.',
    );
  });

  it('keeps shared-world council and advisor copy fully English', () => {
    expect(en('体检 82/100，常规年度结算。先处理阻断或红色事项，再结束本年。')).toBe(
      'Check 82/100. Standard annual settlement. Resolve blockers or red items before ending this year.',
    );
    expect(en('外部威胁：帕提亚：关系/威胁偏高。外交页确认是否贸易、结盟或备战。')).toBe(
      'External threat: Parthia — elevated relations risk or threat. Open Diplomacy to decide whether to trade, ally, or prepare for war.',
    );
    expect(en('战争机会：可攻 西顿')).toBe('War opportunity: attack Sidon');
    expect(en('第 1 年')).toBe('Year 1');
  });
});
