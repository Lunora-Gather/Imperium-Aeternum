import { launchCopy } from './launchCopy';
import { useSyncExternalStore } from 'react';
import { toGeneratedTraditional } from './generated/zh-TW';

export type Locale = 'zh-CN' | 'zh-TW' | 'en';

const STORAGE_KEY = 'ia-locale';
const SUPPORTED: readonly Locale[] = ['zh-CN', 'zh-TW', 'en'];

const en: Record<string, string> = {
  '云端存档已变化，请比较后重新确认': 'The cloud save changed. Compare the versions and confirm your choice.',
  '存档已变化，请比较后确认用云端覆盖本地': 'The save changed. Compare the versions before replacing the local save.',
  '本地存档已变化，请重新确认': 'The local save changed. Confirm your choice again.',
  '云存档持续更新，请稍后重试': 'The cloud save is still changing. Try again shortly.',
  '云存档文件不存在': 'The cloud save file is missing.',
  '云存档回执不匹配': 'The server returned a different account or slot.',
  '6 位邮箱验证码已发送，15 分钟内有效': 'Your six-digit email code is valid for 15 minutes.',
  '登录账号已更换，请重新同步': 'The signed-in account changed. Sync again.',
  '登录账号已更换，请重新确认': 'The signed-in account changed. Confirm your choice again.',
  '当前浏览器已登录其他账号，请先退出登录': 'Another account is signed in. Sign out to switch accounts.',
  '地中海黎明': 'Mediterranean Dawn', '经典小局，节奏快，适合熟悉系统。': 'A fast classic campaign designed for learning the systems.', '万邦纪元': 'Age of Nations', '完整世界剧本，适合长期经营。': 'A complete world campaign for long-term governance.', '东方破晓': 'Eastern Dawn', '秦、汉、匈奴、孔雀同台。': 'Qin, Han, Xiongnu, and Maurya share the stage.', '东亚风云': 'East Asian Struggle', '东亚、中亚、南亚三洲角逐。': 'A contest spanning East, Central, and South Asia.', '地中海争霸': 'Mediterranean Rivalry', '罗马、迦太基、波斯、努米底亚争霸。': 'Rome, Carthage, Persia, and Numidia compete for dominance.', '新大陆崛起': 'Rise of the Americas', '美洲文明独立发展线。': 'An independent development path for American civilizations.', '随机大陆': 'Random Continent', '随机抽取一洲开局，每次不同。': 'Begin on a randomly selected continent each time.', '欧洲封建': 'Feudal Europe', '欧洲多国封建争霸。': 'Feudal powers compete across Europe.', '印度洋贸易': 'Indian Ocean Trade', '南亚、北非、中东和大洋洲围绕海贸争霸。': 'South Asia, North Africa, the Middle East, and Oceania compete over maritime trade.', '帝国黄昏': 'Twilight of Empire', '资源匮乏、叛乱高发、外交孤立。': 'Scarce resources, frequent rebellion, and diplomatic isolation.',
  '选择存档': 'Choose a save', '本局已结束，请查看结局或读取存档。': 'This campaign has ended. Review the ending or load a save.', '此页面将在联网后打开。': 'This page will open when you reconnect.', '常规净收入': 'Operating balance', '平均常规净收入': 'Average operating balance', '国库实际变化': 'Treasury change', '其他结算差额': 'Other settlement adjustments', '差额包括战事、国策等其他结算，以及分项取整的影响。': 'The difference includes other settlements, such as wars and national policies, and rounding of individual entries.', '旧年报未记录国库实际变化。': 'This older report did not record the treasury change.',
  '无需前置经验。': 'No prior experience required.', '通常不是被打崩，而是忽略年报和财政趋势。': 'The usual danger is ignoring reports and fiscal trends, not military defeat.', '先看路线图和情境提示': 'Read the roadmap and guidance first', '第一年后读年报复盘': 'Review the annual report after year one',
  '推荐按挑战阶梯逐步解锁：先学财政和省份，再学战争外交，最后进入完整世界或硬核生存。': 'Advance through the ladder: learn finance and provinces, then war and diplomacy, and finally the full world or survival challenge.',
  '标准经营': 'Standard economy', '标准扩张': 'Standard expansion', '困难冲突': 'Hard conflict', '旗舰困难': 'Flagship hard', '硬核挑战': 'Hardcore challenge',
  '推荐继续：槽位 {{slot}} · {{nation}} · 第 {{year}} 年': 'Recommended: slot {{slot}} · {{nation}} · year {{year}}', '暂无可继续存档': 'No playable save found',
  '5 国': '5 nations', '206 国': '206 nations', '东亚': 'East Asia', '挑战': 'Challenge',
};
// Dynamic launch/gameplay copy lives with the pure domain helpers. Keep its UI
// translations here so changing locale never exposes a half-translated lobby.

const enLaunch: Record<string, string> = {
  '本年已结算，操作未提交。请核对新一年的版图后重试。': 'The year ended before your order was sent. Review the new year and try again.',
  '已准备，等待其他统治者': 'Ready. Waiting for the other rulers.',
  '暂无可继续存档': 'No playable save found',
  '推荐从“地中海黎明”开始，先建立一套稳定玩法循环。': 'Start with Mediterranean Dawn and build a stable play loop first.',
  '存档健康': 'Saves healthy', '可以直接继续最近进度。': 'Your latest progress is ready to continue.',
  '浏览器空间已满，无法存档。请释放空间后重试。': 'Browser storage is full. Free up space and try again.',
  '存档超过 5MB 安全上限，无法保存': 'This save exceeds the 5 MB limit.',
  '无法恢复': 'Unrecoverable', '确认覆盖': 'Confirm overwrite', '空槽位': 'Empty slot',
  '健康': 'Healthy', '可修复': 'Repairable', '有风险': 'At risk', '损坏': 'Damaged',
  '建议进入后覆盖损坏槽位，保留健康/可修复档。': 'Replace damaged slots after entering and preserve healthy or repairable saves.',
  '可以继续游戏；读取时会迁移、净化并写回。': 'You can continue; the save will be migrated, repaired, and written back when loaded.',
  '继续后先看总览行动中心和下一回合前检查。': 'After continuing, review the Overview Action Center and pre-turn check.',
  '可读 {{playable}}/{{total}}': 'Playable {{playable}}/{{total}}',
  '可修复 {{count}}': '{{count}} repairable',
  '损坏 {{count}}': '{{count}} damaged',
  '新手首选': 'Best for beginners', '旗舰长局': 'Epic campaign', '东方入门': 'Eastern introduction', '东方长线': 'Eastern long campaign',
  '战争贸易': 'War and trade', '文明成长': 'Civilization growth', '重开乐趣': 'Replay challenge', '外交战争': 'Diplomacy and war', '贸易推荐': 'Trade focus',
  '困难长线': 'Hard long campaign', '标准成长': 'Standard growth', '随机挑战': 'Random challenge', '困难外交': 'Hard diplomacy',
  '5 国 · 50 省': '5 nations · 50 provinces', '206 国 · 约 600 省': '206 nations · about 600 provinces', '东亚剧本': 'East Asia campaign',
  'W3 · 东亚 3 洲': 'W3 · 3 Asian regions', 'W5 · 地中海 4 洲': 'W5 · 4 Mediterranean regions', 'W6 · 美洲 1 洲': 'W6 · Americas',
  'W7 · 随机洲': 'W7 · Random region', 'W4 · 欧洲 4 洲': 'W4 · 4 European regions', 'W8 · 印度洋 4 洲': 'W8 · 4 Indian Ocean regions',
  '挑战 · 高压生存': 'Challenge · High-pressure survival', '~50 国': '~50 nations', '~70 国': '~70 nations', '~20 国': '~20 nations', '16–24 国': '16–24 nations', '~60 国': '~60 nations', '~55 国': '~55 nations',
  '完整世界沙盘，信息密度最高': 'The complete world sandbox with the highest information density',
  '建议先完成至少一局标准或困难区域剧本。': 'Complete at least one standard or hard regional campaign first.',
  '区域扩张和内政稳定并重': 'Balance regional expansion with domestic stability', '至少熟悉行动中心和省份页。': 'Learn the action center and provinces screen first.',
  '东方大区长期博弈': 'A long strategic contest across eastern regions', '熟悉路线图、作战会议、年报复盘。': 'Learn the roadmap, war council, and annual review.',
  '战争、贸易和外交都很密集': 'War, trade, and diplomacy are all intense', '至少能稳定处理战争、补给、外交情报。': 'Be able to manage war, supply, and diplomatic intelligence.',
  '较少外部干扰的文明成长线': 'Civilization growth with less outside interference', '适合第二局或喜欢独立发展线的玩家。': 'Ideal for a second campaign or independent growth.',
  '每局压力不同，考验适应能力': 'Every campaign differs and tests adaptability', '至少完成一局标准或困难剧本。': 'Complete at least one standard or hard campaign first.',
  '联盟、边境和多国关系压力高': 'High pressure from alliances, borders, and many relationships', '熟悉外交情报和作战会议。': 'Learn diplomatic intelligence and the war council.',
  '适合经营玩家的贸易成长线': 'A trade-led growth path for economic players', '完成一局地中海黎明，理解财政和省份。': 'Complete Mediterranean Dawn and understand finance and provinces.',
  '资源少、叛乱高、外交孤立': 'Scarce resources, frequent rebellion, and diplomatic isolation', '熟悉存档体检、作战会议、下一回合预演后再挑战。': 'Learn save checks, the war council, and turn forecasts before attempting this.',
  '确认清理本浏览器里的全部 Imperium Aeternum 存档？': 'Delete every Imperium Aeternum save in this browser?',
  '难度 {{level}}': 'Difficulty {{level}}', '低': 'Low', '中': 'Medium', '中高': 'Medium–high', '高': 'High', '极高': 'Extreme', '未知': 'Unknown',
  '第一次玩 / 快速理解系统': 'First campaign / learn quickly', '熟悉系统后的长期玩家': 'Long-term players familiar with the systems',
  '喜欢秦汉、草原和南亚互动': 'Players interested in Qin–Han, steppe, and South Asian interaction', '喜欢东方大区长期博弈': 'Players who enjoy long eastern campaigns',
  '喜欢罗马、迦太基、波斯冲突': 'Players who enjoy Roman, Carthaginian, and Persian conflict', '喜欢较少外交干扰的成长线': 'Players who prefer growth with less diplomatic pressure',
  '老手 / 每局想要不同开局': 'Veterans seeking a different opening each time', '喜欢联盟、边境和多国关系': 'Players who enjoy alliances, borders, and many-state relations',
  '喜欢贸易和港口路线': 'Players who enjoy trade and port networks', '硬核玩家 / 失败也能接受': 'Hardcore players comfortable with failure',
  '选择你的邦国': 'Choose your nation', '即将开始': 'Campaign ready', '你的邦国': 'Your nation', '← 返回': '← Back', '开启纪元 →': 'Begin era →',
  '读取自动存档': 'Load autosave', '刷新存档体检': 'Refresh save check', '清理本地存档': 'Delete local saves', '修复并继续': 'Repair and continue', '继续最佳存档': 'Continue best save',
  '{{label}} · 体检 {{score}}/100{{repairs}}': '{{label}} · Check {{score}}/100{{repairs}}', ' · 将自动：{{items}}': ' · Automatic: {{items}}', '、': ', ',
  '{{value}}/年': '{{value}}/year', '第 {{year}} 年 · 年度报告': 'Year {{year}} · Annual Report',
  '挑战': 'Challenge', '贸易': 'Trade',  '行政': 'Administration', '民生': 'Welfare', '强国': 'Great power', '稳健': 'Balanced',
  '波斯帝国': 'Persian Empire', '秦帝国': 'Qin Empire', '罗马': 'Rome', '迦太基': 'Carthage', '汉': 'Han', '孔雀帝国': 'Maurya Empire', '印加': 'Inca', '印加帝国': 'Inca Empire', '埃及': 'Egypt', '该邦国不在当前剧本中，请重新选择。': 'Choose a nation available in this campaign.', '法兰克': 'Franks',
  '匈奴汗国': 'Xiongnu Khanate', '努米底亚': 'Numidia', '阿兹特克': 'Aztec', '玛雅': 'Maya', '基辅罗斯': 'Kievan Rus’', '室利佛逝': 'Srivijaya', '埃及王国': 'Kingdom of Egypt',
  '查看结局 · 槽位 {{slot}}': 'Review ending · Slot {{slot}}', '战局结局：槽位 {{slot}} · {{nation}} · 第 {{year}} 年': 'Campaign ending: slot {{slot}} · {{nation}} · year {{year}}', '查看战局结局': 'Review campaign ending',
  '删除失败，请刷新存档体检。': 'Deletion failed. Refresh the save slots.', '部分存档未能删除，请查看剩余槽位。': 'Some saves could not be deleted. Check the remaining slots.',
  '无法读取本地存档。': 'Could not read local saves.', '槽位已变化，请在存档页核对或另存。': 'Slot changed. Review it in Saves or choose another slot.',
  '执政官布鲁图': 'Consul Brutus',
  '先读懂总览': 'Understand the overview first',
  '找到“行动中心”和“下一回合前检查”。先处理红色阻断，再考虑黄色建议。': 'Find the Action Center and Pre-turn Review. Resolve red blockers before considering yellow recommendations.',
  '总览是每一年的起点，能避免在十几个页面里盲目寻找按钮。': 'The overview is the starting point for every year and keeps you from searching blindly across many screens.',
  '带我去总览': 'Take me to the overview',
  '看懂行动中心后，点“我看懂了”。': 'Once you understand the Action Center, choose “Understood”.',
  '看懂钱粮来源': 'Understand income and supplies',
  '打开经济页，先看预计收入、支出和粮食变化。第一年不必追求最高税率。': 'Open Economy and review projected income, expenses, and food changes. Do not chase the highest tax rate in your first year.',
  '国库或粮食断裂会连锁伤害安定、军队和长期发展。': 'An empty treasury or food shortage will cascade into stability, military, and long-term development problems.',
  '打开经济页': 'Open Economy',
  '找到年度收支后，点“我看懂了”。': 'After finding the annual balance, choose “Understood”.',
  '认识省份建设': 'Learn province development',
  '打开省份页，比较人口、不满和建筑槽。首局优先建设核心省份，不要平均撒钱。': 'Open Provinces and compare population, unrest, and building slots. Develop core provinces first instead of spreading funds evenly.',
  '国家资源最终来自省份；先集中建设，比到处点按钮更容易形成正循环。': 'National resources ultimately come from provinces. Focused development creates a positive cycle more reliably than scattered actions.',
  '查看省份': 'View Provinces',
  '找到一个适合发展的核心省份后确认完成。': 'Confirm after finding a core province suited for development.',
  '留下第一个安全存档': 'Create your first safe save',
  '回到总览点“存档”，或在存档页保存槽位。系统检测到本地存档后会自动完成。': 'Choose Save from the overview or save a slot on the Saves screen. This step completes automatically when a local save is detected.',
  '改革、战争和重大事件可能改变路线，先存档才能放心试错。': 'Reforms, wars, and major events can change your path. Save first so experimentation remains reversible.',
  '去存档': 'Open Saves',
  '完成条件：任意本地存档可读取。': 'Completion: any readable local save.',
  '谨慎推进一年': 'Advance one year carefully',
  '回总览确认没有待决事件和红色阻断，再点“下一回合”。推进成功后自动完成。': 'Return to the overview, confirm there are no pending events or red blockers, then choose Next Year. This step completes automatically.',
  '游戏的核心循环是计划、行动、结算、复盘，不是连续跳过年份。': 'The core loop is plan, act, resolve, and review—not skipping through years.',
  '回总览推进': 'Return and advance',
  '完成条件：进入第 2 年。': 'Completion: reach year 2.',
  '读第一份年报': 'Read your first annual report',
  '查看财政、粮食、安定和世界事件的实际变化，再决定下一年要修正什么。': 'Review actual changes in finances, food, stability, and world events before deciding what to adjust next year.',
  '年报是结果，总览是下一轮计划；读懂两者就掌握了完整玩法循环。': 'The annual report shows results; the overview begins the next plan. Understanding both completes the core gameplay loop.',
  '打开年报': 'Open Annual Report',
  '完成条件：第 2 年后打开年报。': 'Completion: open the Annual Report after reaching year 2.',
};

Object.assign(en, {
  '新手帮助': 'New-player help',
  '第一次玩：六步上手': 'First campaign: six simple steps',
  '✦ 第一次玩 · 第 {{current}} / {{total}} 步': '✦ First campaign · Step {{current}} / {{total}}',
  '完成这一步': 'Complete this step',
  '① 先认 5 个关键数字': '① Learn the five key numbers',
  '顶部的国库、粮储、人口、安定和疆土，是国家最重要的状态。国库、粮储或安定变红时，先别急着推进年份。': 'Treasury, food, population, stability, and territory are your key indicators. If treasury, food, or stability turns red, do not advance yet.',
  '看看关键数字': 'Review the key numbers',
  '② 每年只定一个目标': '② Choose one goal each year',
  '先看总览里的“行动中心”。第一年只解决最重要的一件事：缺钱就理财，地方不稳就治理，有战事再整军。': 'Start with the Action Center. In year one, solve only the most important problem: finances, local stability, or the military if war demands it.',
  '查看行动中心': 'Open the Action Center',
  '③ 红色必须处理，黄色建议处理': '③ Resolve red items first',
  '“下一回合前检查”会直接告诉你风险。点提示就能去对应页面；红色代表继续推进可能出大问题。': 'The pre-turn check explains your risks and links to the right screen. Red means advancing could cause serious trouble.',
  '查看回合前检查': 'Open the pre-turn check',
  '④ 做一件有效的事': '④ Take one useful action',
  '不用把所有页面都点一遍。跟着行动中心进入经济、省份、政治、军事或外交页，完成一项能改善当前问题的行动。': 'You do not need to visit every screen. Follow the Action Center and take one action that improves the current problem.',
  '去看看省份': 'Open Provinces',
  '⑤ 第一次推进前先存档': '⑤ Save before advancing',
  '存档让你可以放心尝试。第一次结束年份前先保存；以后在开战、改革和重大选择前再保存一次。': 'A save lets you experiment safely. Save before ending your first year, and again before wars, reforms, or major choices.',
  '保存当前进度': 'Save current progress',
  '⑥ 推进一年，再读结果': '⑥ Advance one year and review',
  '没有待决事件和红色阻断后，点“下一回合”或按空格。结算后读年报：哪些变好、哪些变坏，就是下一年的计划。': 'When no events or red blockers remain, choose Next Year or press Space. The annual report shows what improved and what should become next year’s plan.',
  '看看年报怎么读': 'Learn to read the annual report',
  '找到今年该做的事': 'Find this year’s priority',
  '在总览找到“行动中心”，先读第一条建议；再看“下一回合前检查”有没有红色项目。': 'Find the Action Center and read its first recommendation, then check the pre-turn review for red items.',
  '这两个区域会把复杂信息变成明确动作，你不需要自己翻遍所有页面。': 'These areas turn complex information into clear actions, so you do not need to search every screen.',
  '找到行动中心和回合前检查后，完成这一步。': 'Complete this step after finding both areas.',
  '确认钱粮不会见底': 'Make sure money and food stay safe',
  '打开经济页，找到预计收入、支出和粮食变化。第一年先保持收支安全，不要急着把税率拉满。': 'Open Economy and find projected income, expenses, and food change. Keep the first year safe instead of maximizing taxes.',
  '确认年度收支和粮食变化后，完成这一步。': 'Complete this step after checking the annual balance and food change.',
  '挑一个核心省份': 'Choose one core province',
  '打开省份页，比较人口、不满和空建筑槽。第一局先集中建设一个人口多、局势稳的核心省份。': 'Open Provinces and compare population, unrest, and open building slots. Develop one populous, stable core province first.',
  '选好一个优先发展的省份后，完成这一步。': 'Complete this step after choosing a priority province.',
  '第一局只要记住三件事': 'Remember three things in your first campaign',
  '看总览、做一件有效行动、存档后推进。年报会告诉你下一年该改什么。': 'Read the overview, take one useful action, then save and advance. The annual report tells you what to change next year.',
  '新手推荐：地中海黎明': 'New-player pick: Mediterranean Dawn',
  '1 · 看总览': '1 · Read the overview',
  '先看行动中心；红色风险必须先处理。': 'Start with the Action Center and resolve red risks first.',
  '2 · 做一件事': '2 · Take one action',
  '只解决今年最重要的问题，不必点遍所有页面。': 'Solve this year’s most important problem; do not visit every screen.',
  '3 · 存档并推进': '3 · Save and advance',
  '保存后结束本年，再用年报决定下一步。': 'Save, end the year, then use the report to choose what comes next.',
  '展开完整玩法速查': 'Show the complete gameplay guide',
});

Object.assign(en, {
  '初来乍到的统治者': 'Newly arrived ruler',
  '这位统治者还没有写下自己的宣言。': 'This ruler has not written a public declaration yet.',
  '{{name}} 的玩家名片': '{{name}}’s player card',
  '关闭玩家名片': 'Close player card',
  '刚刚在线': 'Online recently',
  '{{count}} 分钟前在线': 'Online {{count}} minutes ago',
  '{{count}} 小时前在线': 'Online {{count}} hours ago',
  '{{count}} 天前在线': 'Online {{count}} days ago',
  '统治者档案': 'Ruler dossier',
  '统治宣言': 'Ruler declaration',
  '公开身份 · 不展示邮箱': 'Public identity · email stays private',
  '加入纪元': 'Joined',
  '这是你的公开名片': 'This is your public card',
  '加为好友': 'Add friend',
  '申请已发送': 'Request sent',
  '对方正在等待你的回应': 'This player is waiting for your response',
  '发送消息': 'Send message',
  '已经是好友': 'Already friends',
  '社交，有 {{count}} 条新动态': 'Social, {{count}} new updates',
  '打开消息中心，{{count}} 条未读': 'Open messages, {{count}} unread',
  '打开消息中心': 'Open messages',
  '{{name}} 发来新消息': 'New message from {{name}}',
  '有新的好友申请': 'New friend request',
  '消息': 'Messages',
  '帝国通讯录': 'Imperial contacts',
  '发现统治者、交换名片，并在治理途中随时收到消息。': 'Discover rulers, exchange player cards, and receive messages while you govern.',
  '登录后可以发现玩家、添加好友并发送私信。': 'Sign in to discover players, add friends, and send private messages.',
  '社交页面': 'Social pages',
  '发现玩家': 'Discover',
  '好友 {{count}}': 'Friends {{count}}',
  '我的名片': 'My card',
  '{{world}} · 同图统治者': '{{world}} · rulers on this world',
  '当前没有共享版图': 'No shared world selected',
  '这里只显示当前版图的成员；成为好友后可以一直聊天。': 'Only members of this world appear here. Friends can keep chatting afterward.',
  '进入共享版图后，可以发现同一版图的统治者。': 'Enter a shared world to discover its other rulers.',
  '刷新': 'Refresh',
  '先进入一张共享版图': 'Enter a shared world first',
  '发现列表不会展示全站玩家，避免人数增长后变得庞大混乱。已有好友仍可在“好友”页随时聊天。': 'Discover never lists the entire player base. Existing friends remain available for chat on the Friends page.',
  '发消息': 'Message',
  '等待你回应': 'Awaiting your response',
  '查看名片': 'View card',
  '正在读取同图玩家…': 'Loading players from this world…',
  '当前版图暂时没有其他玩家': 'No other players are in this world yet',
  '使用好友码添加': 'Add with a friend code',
  '发送申请': 'Send request',
  '等待你的回应': 'Waiting for your response',
  '{{count}} 条未读': '{{count}} unread',
  '点击查看名片': 'Select to view card',
  '查看消息': 'View messages',
  '还没有好友，可以去“发现玩家”直接添加。': 'No friends yet. Open Discover to add someone directly.',
  '好友码仍然可以复制分享。': 'You can still copy and share your friend code.',
  '编辑我的名片': 'Edit my card',
  '预览公开名片': 'Preview public card',
  '写一句你的统治宣言。': 'Write a short declaration.',
  '个人称号': 'Player title',
  '例如：海上贸易的守望者': 'For example: Guardian of Maritime Trade',
  '个人宣言': 'Public declaration',
  '介绍你的玩法、目标或想结识的伙伴': 'Describe your play style, goals, or the allies you seek',
  '头像主题': 'Avatar theme',
  '保存名片': 'Save card',
  '取消': 'Cancel',
  '查看 {{name}} 的名片': 'View {{name}}’s card',
  '返回上一个游戏页面': 'Return to the previous game screen',
  '当前已在导航起点': 'Already at the navigation starting point',
});

let currentLocale: Locale = detectLocale();
const listeners = new Set<() => void>();
const registeredEn: Record<string, string> = Object.create(null);
type EnglishReplacement = string | ((substring: string, ...args: string[]) => string);
const registeredEnPatterns: Array<{ pattern: RegExp; replacement: EnglishReplacement }> = [
  { pattern: /^已准备，等待其他统治者（(\d+)\/(\d+)）$/, replacement: 'Ready. Waiting for the other rulers ($1/$2).' },
  { pattern: /^统一结算完成，进入第 (\d+) 年$/, replacement: 'The world has advanced to year $1.' },
  { pattern: /^存档失败：(.*)$/, replacement: 'Save failed: $1' },
  { pattern: /^存档解析失败：(.*)$/, replacement: 'Could not read save: $1' },
  {
    pattern: /^新游戏开始：(.+) · 你执掌 (.+) · 第 (\d+) 年$/,
    replacement: (_all, scenario, nation, year) => `New campaign: ${englishCopy(scenario) ?? scenario} · You govern ${englishCopy(nation) ?? nation} · Year ${year}`,
  },
  {
    pattern: /^新游戏开始：(.+) · 第 (\d+) 年$/,
    replacement: (_all, scenario, year) => `New campaign: ${englishCopy(scenario) ?? scenario} · Year ${year}`,
  },
  {
    pattern: /^已选剧本：(.+)，请选择你的邦国$/,
    replacement: (_all, scenario) => `Campaign selected: ${englishCopy(scenario) ?? scenario}. Choose your nation.`,
  },
  { pattern: /^([+-]?\d+)\/年$/, replacement: '$1/year' },
  { pattern: /^(\d+) 个槽位损坏$/, replacement: (_all, count) => `${count} damaged ${count === '1' ? 'slot' : 'slots'}` },
  { pattern: /^(\d+) 个存档可自动修复$/, replacement: (_all, count) => `${count} ${count === '1' ? 'save can' : 'saves can'} be repaired automatically` },
  { pattern: /^(\d+) 个存档可读但有风险$/, replacement: (_all, count) => `${count} playable ${count === '1' ? 'save has' : 'saves have'} risks` },
];

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (SUPPORTED.includes(saved as Locale)) return saved as Locale;
  } catch { /* preference storage is optional */ }
  const language = typeof navigator === 'undefined' ? 'zh-CN' : navigator.language;
  if (/^zh-(TW|HK|MO)/i.test(language)) return 'zh-TW';
  if (!/^zh/i.test(language)) return 'en';
  return 'zh-CN';
}

function applyDocumentLocale(locale: Locale): void {
  if (typeof document !== 'undefined') document.documentElement.lang = locale;
}

applyDocumentLocale(currentLocale);

export function setLocale(locale: Locale): void {
  if (!SUPPORTED.includes(locale) || locale === currentLocale) return;
  currentLocale = locale;
  applyDocumentLocale(locale);
  try { localStorage.setItem(STORAGE_KEY, locale); } catch { /* preference storage is optional */ }
  listeners.forEach((listener) => listener());
}

export function getLocale(): Locale { return currentLocale; }

function catalogEntry<T>(catalog: Readonly<Record<string, T>>, key: string): T | undefined {
  return Object.prototype.hasOwnProperty.call(catalog, key) ? catalog[key] : undefined;
}

export function hasExplicitTranslation(source: string, locale: Exclude<Locale, 'zh-CN'>): boolean {
  if (locale === 'zh-TW') return catalogEntry(launchCopy, source) !== undefined;
  return (englishCopy(source) ?? registeredEn[source]) !== undefined;
}

/** Register copy owned by a lazy screen. Keeping these catalogs beside lazy
 * routes prevents the complete governance vocabulary inflating first load. */
export function registerEnglishTranslations(catalog: Readonly<Record<string, string>>): void {
  Object.assign(registeredEn, catalog);
}

export function registerEnglishPatterns(patterns: ReadonlyArray<{ pattern: RegExp; replacement: EnglishReplacement }>): void {
  registeredEnPatterns.push(...patterns);
}

function englishCopy(source: string): string | undefined {
  const launch = catalogEntry(launchCopy, source);
  return catalogEntry(en, source) ?? catalogEntry(enLaunch, source) ?? (typeof launch === 'string' ? launch : launch?.[1]);
}

export function translate(source: string, values: Record<string, string | number> = {}, locale = currentLocale): string {
  let template = source;
  if (locale === 'zh-TW') {
    const launch = catalogEntry(launchCopy, source);
    template = Array.isArray(launch) ? launch[0] : toGeneratedTraditional(source);
  } else if (locale === 'en') {
    template = englishCopy(source) ?? registeredEn[source] ?? source;
  }
  if (locale === 'en' && template === source) {
    const rule = registeredEnPatterns.find(({ pattern }) => { pattern.lastIndex = 0; return pattern.test(source); });
    if (rule) { rule.pattern.lastIndex = 0; template = source.replace(rule.pattern, rule.replacement as never); }
  }
  return interpolate(template, values);
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  if (!template.includes('{{')) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (token, key: string) => String(catalogEntry(values, key) ?? token));
}

export function useI18n() {
  const locale = useSyncExternalStore(
    (listener) => { listeners.add(listener); return () => listeners.delete(listener); },
    () => currentLocale,
    () => 'zh-CN' as Locale,
  );
  return { locale, setLocale, t: (source: string, values?: Record<string, string | number>) => translate(source, values, locale) };
}
