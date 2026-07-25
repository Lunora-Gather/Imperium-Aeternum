import { registerEnglishPatterns, registerEnglishTranslations } from '..';

const en: Record<string, string> = {
  '国家使命': 'National Mission', '使命路线': 'Mission path', '使命完成': 'Mission complete', '完成奖励：': 'Reward: ',
  '国家处于常态治理': 'The realm is under normal governance',
  '危机会在财政、法统、地方或厌战持续越过危险线时出现，并提前给出化解办法。': 'A crisis appears when finance, legitimacy, unrest, or war exhaustion remains beyond the danger line. The game will show a remedy in advance.',
  '治世长策': 'Enduring Statecraft', '先立制度，再成万世之业。': 'Build institutions first, then a legacy that can endure.',
  '四海通商': 'Trade Across the Seas', '让财富、粮食与商路成为帝国血脉。': 'Make wealth, food, and trade routes the lifeblood of the empire.',
  '开疆定鼎': 'Conquest and Order', '以军威开拓疆界，以秩序守住所得。': 'Expand through strength and secure every gain through order.',
  '文明灯塔': 'Beacon of Civilization', '让知识、治能与文化塑造新时代。': 'Let knowledge, administration, and culture shape a new age.',
  '万邦协和': 'Concord of Nations', '用信用与盟约建立不战而胜的秩序。': 'Build an order of trust and treaties that wins without war.',
  '第一章 · 稳住朝局': 'Chapter I · Secure the Court', '稳住朝局': 'Secure the Court', '治理至少两年，并维持安定 40、法统 35。': 'Govern for at least two years while maintaining 40 stability and 35 legitimacy.',
  '第二章 · 治世长策': 'Chapter II · Enduring Statecraft', '第二章 · 四海通商': 'Chapter II · Trade Across the Seas',
  '第二章 · 开疆定鼎': 'Chapter II · Conquest and Order', '第二章 · 文明灯塔': 'Chapter II · Beacon of Civilization',
  '第二章 · 万邦协和': 'Chapter II · Concord of Nations', '终章 · 留下国祚': 'Final Chapter · Secure the Legacy', '留下国祚': 'Secure the Legacy',
  '行政点 +2 · 影响力 +10': 'Administration +2 · Influence +10', '国库 +250 · 科研 +20': 'Treasury +250 · Research +20',
  '安定 +5 · 法统 +5 · 影响力 +30': 'Stability +5 · Legitimacy +5 · Influence +30',
  '扩张 2 省，并建立足以守边的常备军。': 'Gain 2 provinces and build a standing army capable of securing the frontier.',
  '扩张至少 4 省，并将安定维持在 45 以上。': 'Gain at least 4 provinces while maintaining 45 stability.',
  '比开局多积累 300 金，并建立第一条对外贸易关系。': 'Accumulate 300 more gold than at the start and establish your first foreign trade relationship.',
  '比开局多积累 1200 金，并维持至少 2 个贸易伙伴。': 'Accumulate 1,200 more gold than at the start and maintain at least 2 trade partners.',
  '累计提升 2 级科技，并储备 30 科研点。': 'Gain 2 total technology levels and hold 30 research points.',
  '累计提升 5 级科技，并把治能提高到 55。': 'Gain 5 total technology levels and raise administrative capacity to 55.',
  '获得 2 个可信友邦，并积累 80 影响力。': 'Secure 2 trusted partners and accumulate 80 influence.',
  '建立 3 个盟约或贸易伙伴，并积累 140 影响力。': 'Establish 3 alliance or trade partners and accumulate 140 influence.',
  '将安定提高到 60、治能提高到 55。': 'Raise stability to 60 and administrative capacity to 55.',
  '将安定提高到 70、法统提高到 65，并把腐败压到 35 以下。': 'Raise stability to 70 and legitimacy to 65 while reducing corruption below 35.',
  '财政断流': 'Fiscal Breakdown', '国库或粮储已经无法支撑正常治理。': 'The treasury or food reserve can no longer support normal governance.',
  '提高净收入并让国库、粮储恢复到安全线。': 'Restore positive income and bring the treasury and food reserve back above the safety line.',
  '统治正当性危机': 'Crisis of Legitimacy', '安定与法统正在动摇政权根基。': 'Falling stability and legitimacy are undermining the regime.',
  '采用安民国策，改善派系满意度并恢复法统。': 'Adopt a stability focus, improve faction satisfaction, and restore legitimacy.',
  '地方离心危机': 'Provincial Secession Crisis', '多个省份正在向叛乱临界点靠近。': 'Multiple provinces are approaching the threshold of rebellion.',
  '前往省份页降低不满、叛乱风险并部署守备。': 'Reduce unrest and rebellion risk on the Provinces screen and deploy garrisons.',
  '长期战争危机': 'Prolonged War Crisis', '厌战与补给压力开始侵蚀国内秩序。': 'War exhaustion and supply pressure are eroding domestic order.',
  '尽快取得决定性进展或议和，让厌战降至安全线。': 'Win a decisive result or make peace, then reduce war exhaustion below the safety line.',
  '化解办法': 'Remedy', '当前后果': 'Current consequence', '当前仅预警；若持续恶化，将开始产生额外损失。': 'Warning only for now. Additional losses begin if conditions continue to worsen.',
  '每年治能 -1。': 'Administrative capacity −1 each year.', '每年治能 -2、安定 -1。': 'Administrative capacity −2 and stability −1 each year.',
  '每年影响力 -3。': 'Influence −3 each year.', '每年影响力 -5、行政点 -1。': 'Influence −5 and administration −1 each year.',
  '每年追加地方维稳支出。': 'Additional provincial security spending each year.', '维稳支出增加，安定每年 -2。': 'Higher security spending and stability −2 each year.',
  '每年补给 -5。': 'Supply −5 each year.', '每年补给 -10、安定 -1。': 'Supply −10 and stability −1 each year.',
  '国运进展': 'National Progress',
};

let registered = false;
export function registerNationalPurposeTranslations(): void {
  if (registered) return;
  registerEnglishTranslations(en);
  registerEnglishPatterns([
    { pattern: /^(.+) (\d+)%$/, replacement: '$1 $2%' },
    { pattern: /^危机 (\d+) 阶$/, replacement: 'Crisis · Stage $1' },
    { pattern: /^(.+) · (\d+)阶$/, replacement: '$1 · Stage $2' },
    { pattern: /^国家危机 · 第 (\d+) 阶段$/, replacement: 'National Crisis · Stage $1' },
    { pattern: /^(\d+)\/3 章$/, replacement: '$1/3 chapters' },
    { pattern: /^第 (\d+) 年 (.+)$/, replacement: 'Year $1 · $2' },
  ]);
  registered = true;
}
