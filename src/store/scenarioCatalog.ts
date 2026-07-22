export type ScenarioId =
  | 'classic'
  | 'world'
  | 'eastasia'
  | 'w3_eastasia'
  | 'w5_mediterranean'
  | 'w6_americas'
  | 'w7_random'
  | 'w4_europe'
  | 'w8_indianocean'
  | 'challenge_survival';

export interface ScenarioDef {
  id: ScenarioId;
  name: string;
  subtitle: string;
  description: string;
  nationCount: string;
  needsNationPick: boolean;
  playableNations?: { id: string; name: string; tier: string; desc: string }[];
  regionFilter?: string[];
}

const WORLD_PLAYABLE = [
  { id: 'n_me_persia', name: '波斯帝国', tier: 'S', desc: '东方霸主，高压帝国，军力最强' },
  { id: 'n_ea_qin', name: '秦帝国', tier: 'S', desc: '中央集权，行政高效，扩张强劲' },
  { id: 'n_med_rome', name: '罗马', tier: 'A', desc: '平衡之国，政体稳定，潜力巨大' },
  { id: 'n_med_carthage', name: '迦太基', tier: 'A', desc: '商业共和，富甲一方，海军称雄' },
  { id: 'n_ea_han', name: '汉', tier: 'A', desc: '东方大国，人口众多，治术成熟' },
  { id: 'n_sa_maurya', name: '孔雀帝国', tier: 'A', desc: '南亚霸主，福利倾向，民心稳固' },
  { id: 'n_am_inca', name: '印加', tier: 'A', desc: '安第斯帝国，集权统治，地理险要' },
  { id: 'n_we_frank', name: '法兰克', tier: 'A', desc: '欧洲新贵，封建骑士，军事传统' },
];
export const SCENARIOS: ScenarioDef[] = [
  { id: 'classic', name: '地中海黎明', subtitle: '5 国 · 50 省', description: '经典小局，节奏快，适合熟悉系统。', nationCount: '5 国', needsNationPick: false },
  { id: 'world', name: '万邦纪元', subtitle: '205 国 · 577 省', description: '完整世界剧本，适合长期经营。', nationCount: '205 国', needsNationPick: true, playableNations: WORLD_PLAYABLE },
  { id: 'eastasia', name: '东方破晓', subtitle: '东亚剧本', description: '秦、汉、匈奴、孔雀同台。', nationCount: '东亚', needsNationPick: true, playableNations: WORLD_PLAYABLE.filter((nation) => ['n_ea_qin', 'n_ea_han', 'n_sa_maurya'].includes(nation.id)).concat({ id: 'n_ca_xiongnu', name: '匈奴汗国', tier: 'B', desc: '游牧军事，机动劫掠' }), regionFilter: ['asia_east', 'asia_central', 'asia_south'] },
  { id: 'w3_eastasia', name: '东亚风云', subtitle: 'W3 · 东亚 3 洲', description: '东亚、中亚、南亚三洲角逐。', nationCount: '~50 国', needsNationPick: true, playableNations: WORLD_PLAYABLE.filter((nation) => ['n_ea_qin', 'n_ea_han', 'n_sa_maurya'].includes(nation.id)).concat({ id: 'n_ca_xiongnu', name: '匈奴汗国', tier: 'B', desc: '游牧军事，机动劫掠' }), regionFilter: ['asia_east', 'asia_central', 'asia_south'] },
  { id: 'w5_mediterranean', name: '地中海争霸', subtitle: 'W5 · 地中海 4 洲', description: '罗马、迦太基、波斯、努米底亚争霸。', nationCount: '~70 国', needsNationPick: true, playableNations: [{ id: 'n_med_rome', name: '罗马', tier: 'A', desc: '平衡之国，政体稳定' }, { id: 'n_med_carthage', name: '迦太基', tier: 'A', desc: '商业共和，海贸强国' }, { id: 'n_me_persia', name: '波斯帝国', tier: 'S', desc: '东方霸主，军力强盛' }, { id: 'n_na_carthage', name: '努米底亚', tier: 'B', desc: '北非骑兵，机动灵活' }], regionFilter: ['mediterranean', 'europe_w', 'middle_east', 'africa_n'] },
  { id: 'w6_americas', name: '新大陆崛起', subtitle: 'W6 · 美洲 1 洲', description: '美洲文明独立发展线。', nationCount: '~20 国', needsNationPick: true, playableNations: [{ id: 'n_am_inca', name: '印加', tier: 'A', desc: '安第斯帝国，集权统治' }, { id: 'n_am_aztec', name: '阿兹特克', tier: 'A', desc: '中美霸主，军事传统' }, { id: 'n_am_maya', name: '玛雅', tier: 'B', desc: '城邦联盟，天文发达' }], regionFilter: ['americas'] },
  { id: 'w7_random', name: '随机大陆', subtitle: 'W7 · 随机洲', description: '随机抽取一洲开局，每次不同。', nationCount: '~20-40 国', needsNationPick: false },
  { id: 'w4_europe', name: '欧洲封建', subtitle: 'W4 · 欧洲 4 洲', description: '欧洲多国封建争霸。', nationCount: '~60 国', needsNationPick: true, playableNations: [{ id: 'n_we_frank', name: '法兰克', tier: 'A', desc: '封建骑士，军事传统' }, { id: 'n_med_rome', name: '罗马', tier: 'A', desc: '古典遗绪，潜力巨大' }, { id: 'n_ee_kievan', name: '基辅罗斯', tier: 'B', desc: '东欧新星，商业兴起' }, { id: 'n_med_carthage', name: '迦太基', tier: 'A', desc: '商业共和，富甲一方' }], regionFilter: ['europe_w', 'europe_e', 'europe_n', 'mediterranean'] },
  { id: 'w8_indianocean', name: '印度洋贸易', subtitle: 'W8 · 印度洋 3 洲', description: '南亚、东非、中东围绕海贸争霸。', nationCount: '~55 国', needsNationPick: true, playableNations: [{ id: 'n_sa_maurya', name: '孔雀帝国', tier: 'A', desc: '南亚霸主，民心稳固' }, { id: 'n_sea_srivijaya', name: '室利佛逝', tier: 'B', desc: '海贸城邦，商业灵活' }, { id: 'n_na_egypt', name: '埃及王国', tier: 'A', desc: '尼罗河粮仓，古老王权' }], regionFilter: ['asia_south', 'africa_e', 'middle_east'] },
  { id: 'challenge_survival', name: '帝国黄昏', subtitle: '挑战 · 高压生存', description: '资源匮乏、叛乱高发、外交孤立。', nationCount: '挑战', needsNationPick: false },
];

export const RANDOM_SCENARIO_REGIONS = [
  ['asia_east'],
  ['mediterranean'],
  ['americas'],
  ['europe_w'],
  ['middle_east'],
] as const;

export function findScenario(id: ScenarioId): ScenarioDef {
  const scenario = SCENARIOS.find((entry) => entry.id === id);
  if (!scenario) throw new Error(`Unknown scenario: ${id}`);
  return scenario;
}
