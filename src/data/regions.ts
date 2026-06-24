// Imperium Aeternum — 12 大洲区域模板（W2）
// DEC-011: 192 国 / 600 省 / 12 洲世界级扩展

import type { CultureId, ReligionId, Terrain, Climate } from './provinces';
import type { NationTier } from './nations';

export type ContinentId =
  | 'europe_w' | 'europe_e' | 'europe_n' | 'mediterranean'
  | 'middle_east' | 'africa_n' | 'africa_s'
  | 'asia_central' | 'asia_east' | 'asia_south'
  | 'americas' | 'oceania';

export interface RegionTemplate {
  continent: ContinentId;
  name: string;
  nameCn: string;
  culture: CultureId;
  religion: ReligionId;
  terrainBias: Terrain[];
  climate: Climate;
  // 国家数量（按 tier）
  nationCount: Record<NationTier, number>;
  // 命名池（国名/省名/人名各 10+）
  nationNamePool: string[];
  provinceNamePool: string[];
  rulerNamePool: string[];
  // 区域特色修正
  goldMod: number;    // 乘法修正 1.0 = 标准
  foodMod: number;
  militaryMod: number;
  // 地图坐标范围（x/y 用于 SVG 渲染）
  xRange: [number, number];
  yRange: [number, number];
}

export const REGIONS: RegionTemplate[] = [
  {
    continent: 'mediterranean', name: 'Mediterranean', nameCn: '地中海',
    culture: 'latin', religion: 'polytheism',
    terrainBias: ['coast', 'plain', 'hill', 'island'],
    climate: 'mediterranean',
    nationCount: { S: 1, A: 2, B: 4, C: 7, D: 6 },
    nationNamePool: ['罗马', '迦太基', '叙拉古', '马西利亚', '塔兰托', '斯巴达', '雅典', '科林斯', '昔兰尼', '阿奎莱亚', '诺拉', '卡普亚'],
    provinceNamePool: ['拉丁姆', '坎帕尼亚', '西西里', '阿普利亚', '伊特鲁里亚', '萨谟奈', '卢卡尼亚', '布鲁提乌姆', '卡拉布里亚', '翁布里亚'],
    rulerNamePool: ['布鲁图', '西庇阿', '凯撒', '庞培', '安东尼', '奥古斯都', '尼禄', '图拉真', '哈德良', '马可'],
    goldMod: 1.1, foodMod: 1.0, militaryMod: 1.1,
    xRange: [300, 500], yRange: [250, 400],
  },
  {
    continent: 'europe_w', name: 'Western Europe', nameCn: '西欧',
    culture: 'germanic', religion: 'monotheism_a',
    terrainBias: ['plain', 'forest', 'coast', 'hill'],
    climate: 'temperate',
    nationCount: { S: 0, A: 1, B: 3, C: 7, D: 7 },
    nationNamePool: ['法兰克', '勃艮第', '阿基坦', '诺曼底', '布列塔尼', '佛兰德斯', '洛林', '萨伏依', '普罗旺斯', '加斯科涅'],
    provinceNamePool: ['巴黎', '里昂', '图卢兹', '波尔多', '鲁昂', '兰斯', '南特', '马赛', '里尔', '斯特拉斯堡'],
    rulerNamePool: ['查理', '路易', '腓力', '亨利', '罗贝尔', '威廉', '理查', '弗朗索瓦', '腓特烈', '奥托'],
    goldMod: 1.0, foodMod: 1.1, militaryMod: 0.9,
    xRange: [100, 300], yRange: [100, 250],
  },
  {
    continent: 'europe_e', name: 'Eastern Europe', nameCn: '东欧',
    culture: 'slavic', religion: 'monotheism_a',
    terrainBias: ['plain', 'forest', 'hill'],
    climate: 'temperate',
    nationCount: { S: 0, A: 1, B: 3, C: 6, D: 8 },
    nationNamePool: ['基辅', '莫斯科', '诺夫哥罗德', '波兰', '波希米亚', '匈牙利', '瓦拉几亚', '摩尔达维亚', '立陶宛', '克罗地亚'],
    provinceNamePool: ['基辅', '莫斯科', '华沙', '布拉格', '布达佩斯', '布加勒斯特', '明斯克', '利沃夫', '萨格勒布', '索菲亚'],
    rulerNamePool: ['弗拉基米尔', '伊万', '瓦西里', '德米特里', '鲍里斯', '亚历山大', '米哈伊尔', '尼古拉', '彼得', '安德烈'],
    goldMod: 0.8, foodMod: 1.0, militaryMod: 1.1,
    xRange: [400, 600], yRange: [50, 200],
  },
  {
    continent: 'europe_n', name: 'Northern Europe', nameCn: '北欧',
    culture: 'nordic', religion: 'animism',
    terrainBias: ['tundra', 'forest', 'coast'],
    climate: 'cold',
    nationCount: { S: 0, A: 0, B: 1, C: 5, D: 7 },
    nationNamePool: ['丹麦', '瑞典', '挪威', '芬兰', '冰岛', '哥特兰', '萨米', '波美拉尼亚', '梅克伦堡', '荷尔斯坦'],
    provinceNamePool: ['哥本哈根', '斯德哥尔摩', '奥斯陆', '赫尔辛基', '卑尔根', '乌普萨拉', '隆德', '图尔库', '特隆赫姆', '雷克雅未克'],
    rulerNamePool: ['奥拉夫', '哈拉尔', '埃里克', '马格努斯', '古斯塔夫', '比约恩', '拉格纳', '西格德', '克努特', '斯韦恩'],
    goldMod: 0.7, foodMod: 0.6, militaryMod: 1.2,
    xRange: [200, 450], yRange: [0, 100],
  },
  {
    continent: 'middle_east', name: 'Middle East', nameCn: '中东',
    culture: 'arab', religion: 'monotheism_b',
    terrainBias: ['desert', 'mountain', 'coast'],
    climate: 'arid',
    nationCount: { S: 0, A: 1, B: 3, C: 6, D: 6 },
    nationNamePool: ['波斯', '巴比伦', '亚述', '腓尼基', '帕提亚', '塞琉古', '犹地亚', '纳巴泰', '米底', '埃兰'],
    provinceNamePool: ['巴格达', '大马士革', '耶路撒冷', '安条克', '泰尔', '西顿', '佩特拉', '苏萨', '埃克巴坦那', '尼尼微'],
    rulerNamePool: ['居鲁士', '大流士', '薛西斯', '阿塔薛西斯', '米特里达特', '安条克', '希律', '萨拉丁', '哈伦', '马穆德'],
    goldMod: 1.2, foodMod: 0.7, militaryMod: 1.0,
    xRange: [500, 700], yRange: [200, 350],
  },
  {
    continent: 'africa_n', name: 'North Africa', nameCn: '北非',
    culture: 'african', religion: 'monotheism_b',
    terrainBias: ['desert', 'coast', 'plain'],
    climate: 'arid',
    nationCount: { S: 0, A: 0, B: 2, C: 5, D: 7 },
    nationNamePool: ['埃及', '努比亚', '昔兰尼加', '突尼斯', '阿尔及尔', '摩洛哥', '毛里塔尼亚', '阿非利加', '的黎波里', '费赞'],
    provinceNamePool: ['开罗', '亚历山大', '迦太基', '利比亚', '突尼斯', '阿尔及尔', '非斯', '马拉喀什', '阿斯旺', '麦罗埃'],
    rulerNamePool: ['托勒密', '克莱奥帕特拉', '哈夫萨', '曼萨', '苏莱曼', '伊德里斯', '阿卜杜拉', '穆罕默德', '优素福', '阿马尔'],
    goldMod: 0.9, foodMod: 0.6, militaryMod: 0.9,
    xRange: [250, 500], yRange: [350, 480],
  },
  {
    continent: 'africa_s', name: 'Sub-Saharan Africa', nameCn: '南非',
    culture: 'african', religion: 'animism',
    terrainBias: ['jungle', 'plain', 'forest'],
    climate: 'tropical',
    nationCount: { S: 0, A: 0, B: 2, C: 6, D: 9 },
    nationNamePool: ['阿克苏姆', '马里', '桑海', '加纳', '贝宁', '库巴', '大津巴布韦', '刚果', '卢旺达', '布隆迪', '索马里', '莫西'],
    provinceNamePool: ['阿克苏姆', '廷巴克图', '加奥', '库马西', '贝宁城', '大津巴布韦', '金沙萨', '基加利', '摩加迪沙', '蒙巴萨'],
    rulerNamePool: ['曼萨', '桑尼', '阿斯基亚', '奥塞', '埃津纳', '姆瓦塔', '卡塞', '卢加德', '阿里', '易卜拉欣'],
    goldMod: 0.7, foodMod: 0.8, militaryMod: 0.8,
    xRange: [350, 550], yRange: [480, 650],
  },
  {
    continent: 'asia_central', name: 'Central Asia', nameCn: '中亚',
    culture: 'turkic', religion: 'monotheism_b',
    terrainBias: ['desert', 'plain', 'mountain'],
    climate: 'arid',
    nationCount: { S: 0, A: 0, B: 2, C: 5, D: 8 },
    nationNamePool: ['大夏', '粟特', '花剌子模', '嚈哒', '突厥', '回鹘', '契丹', '党项', '吐蕃', '于阗', '龟兹', '高昌'],
    provinceNamePool: ['撒马尔罕', '布哈拉', '塔什干', '梅尔夫', '喀什', '敦煌', '楼兰', '龟兹', '哈密', '吐鲁番'],
    rulerNamePool: ['帖木儿', '成吉思', '忽必烈', '术赤', '察合台', '窝阔台', '拖雷', '拔都', '旭烈兀', '阿里不哥'],
    goldMod: 0.8, foodMod: 0.6, militaryMod: 1.3,
    xRange: [600, 800], yRange: [100, 250],
  },
  {
    continent: 'asia_east', name: 'East Asia', nameCn: '东亚',
    culture: 'sinic', religion: 'sinic_religion',
    terrainBias: ['plain', 'coast', 'forest', 'mountain'],
    climate: 'temperate',
    nationCount: { S: 1, A: 1, B: 3, C: 6, D: 7 },
    nationNamePool: ['秦', '汉', '魏', '蜀', '吴', '晋', '隋', '唐', '宋', '明', '高句丽', '百济'],
    provinceNamePool: ['长安', '洛阳', '开封', '南京', '北京', '成都', '广州', '杭州', '荆州', '幽州', '平壤', '汉城'],
    rulerNamePool: ['秦始皇', '汉武帝', '唐太宗', '宋太祖', '明太祖', '曹操', '刘备', '孙权', '司马懿', '诸葛亮'],
    goldMod: 1.2, foodMod: 1.2, militaryMod: 1.1,
    xRange: [750, 950], yRange: [150, 350],
  },
  {
    continent: 'asia_south', name: 'South Asia', nameCn: '南亚',
    culture: 'indian', religion: 'indian_religion',
    terrainBias: ['jungle', 'plain', 'mountain'],
    climate: 'tropical',
    nationCount: { S: 0, A: 1, B: 2, C: 5, D: 6 },
    nationNamePool: ['孔雀', '笈多', '莫卧儿', '戒日', '朱罗', '帕拉瓦', '毗奢耶那伽', '波罗', '锡兰', '尼泊尔', '孟加拉', '旁遮普'],
    provinceNamePool: ['华氏城', '曲女城', '摩揭陀', '羯陵伽', '德干', '迈索尔', '旁遮普', '孟加拉', '古吉拉特', '拉贾斯坦'],
    rulerNamePool: ['阿育王', '旃陀罗笈多', '戒日王', '迦腻色迦', '毗奢耶那伽', '波罗', '朱罗', '帕拉瓦', '普拉塔普', '希瓦吉'],
    goldMod: 1.0, foodMod: 1.2, militaryMod: 0.9,
    xRange: [650, 800], yRange: [300, 450],
  },
  {
    continent: 'americas', name: 'Americas', nameCn: '美洲',
    culture: 'indigenous_americas', religion: 'sun_worship',
    terrainBias: ['plain', 'mountain', 'forest', 'jungle', 'coast'],
    climate: 'temperate',
    nationCount: { S: 0, A: 1, B: 3, C: 8, D: 12 },
    nationNamePool: ['阿兹特克', '印加', '玛雅', '易洛魁', '切罗基', '苏族', '纳瓦霍', '阿劳坎', '图皮', '加勒比', '奇布查', '托尔特克'],
    provinceNamePool: ['特诺奇蒂特兰', '库斯科', '蒂卡尔', '帕伦克', '奇琴伊察', '马丘比丘', '特奥蒂瓦坎', '昌昌', '波哥大', '基多'],
    rulerNamePool: ['蒙特祖马', '帕查库特克', '卡米纳', '伊兹科阿特尔', '阿维图', '塞奎亚', '瓜特莫克', '曼科', '阿塔瓦尔帕', '瓦伊纳'],
    goldMod: 0.9, foodMod: 1.0, militaryMod: 0.8,
    xRange: [50, 200], yRange: [250, 600],
  },
  {
    continent: 'oceania', name: 'Oceania', nameCn: '大洋洲',
    culture: 'polynesian', religion: 'animism',
    terrainBias: ['island', 'ocean', 'coast'],
    climate: 'tropical',
    nationCount: { S: 0, A: 0, B: 2, C: 5, D: 12 },
    nationNamePool: ['夏威夷', '塔希提', '汤加', '斐济', '萨摩亚', '毛利', '巴布亚', '爪哇', '苏门答腊', '婆罗洲', '苏拉威西', '马来'],
    provinceNamePool: ['火奴鲁鲁', '帕皮提', '努库阿洛法', '苏瓦', '阿皮亚', '奥克兰', '莫尔兹比港', '雅加达', '巨港', '古晋'],
    rulerNamePool: ['卡美哈美哈', '波马雷', '图普', '塞鲁', '马利托', '霍内', '奥赫', '海达亚', '拉卡', '塔鲁'],
    goldMod: 0.6, foodMod: 0.8, militaryMod: 0.6,
    xRange: [800, 1000], yRange: [400, 600],
  },
];

export const REGION_BY_ID: Record<string, RegionTemplate> = Object.fromEntries(
  REGIONS.map((r) => [r.continent, r]),
);
