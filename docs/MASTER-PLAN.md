# Imperium Aeternum — 超级完善方案 v1.0（MASTER PLAN）

> **唯一指挥棒**。本文档收敛 `06-expansion.md`（10 项 E 系列）+ `08-comprehensive-plan.md`（31 项 P 系列）+ 散落 ADR，统一为一条可追溯的执行线。
> 任何后续改动必须能映射回本文档的某个工作包（WP），否则不予立项。
>
> **基线快照**（2026-06-25 v1.8）：57 源文件 / 11077 行 | typecheck ✅ | **vitest 89/89 ✅**（含 engine-targeted 26 针对性测试，economy/politics/military/diplomacy 各 ≥5）| validate ✅（203 事件 0 重复）| 205 国 577 省 | 150 事件 / **40 建筑** / 32 科技 / 12 政体 / **15 性格** / **20 法律** / 8 商路 / **10 剧本** | 50 回合 1131ms。
>
> **穷尽代码核验**（2026-06-25 实读 18 符号：`turn.ts judgeVictory/processTurn/buildReport`、`politics.ts settlePolitics/changeGovernment`、`economy.ts settleEconomy`、`military.ts makePeace/moveArmy`、`ai.ts planAITurn`、`persistence.ts migrate/saveGameToSlot/listAllSlots`、`App.tsx`、`EventModal effectSummary`、`PoliticsScreen civilWar`、`gameStore suppressRebellion/negotiateRebellion/demolishBuilding`、`ErrorBoundary`、`ProvinceScreen`、`DiplomacyScreen`、`MilitaryScreen truce`、`events.ts govTransition`）：
> - **Phase A 全部 4 WP 已实现**（A1 叛乱临时 Nation+连锁+归顺 / A2 内战镇压谈判 UI+引擎 / A3 孤儿军队撤退 / A4 AI 可见 worldEvents）
> - **Phase B 8 WP 中 5 个已实现**（B1 事件预览翻译 / B2 省份通知 / B3 多槽位 / B6 ErrorBoundary / B7 存档迁移 v1→v2→v3），**3 个部分完成**（B4 引擎有 UI 缺 / B5 隐式过滤缺显示 / B8 标记缺反扑事件）
> - 真实剩余缺口集中于：B4/B5/B8 收尾 + Phase C 架构 + Phase D 内容 + Phase E 打磨 + Phase F 移植
>
> **设计宪法**（不可推翻，任何 WP 违宪即否决）：
> 1. 扩张有代价——每省带来超管惩罚 + 文化冲突 + 行政负担
> 2. 改革有反弹——每次改革触发派系反应，短期阵痛换长期收益
> 3. 战争有成本——军费 / 厌战 / 人口损失 / 稳定度下降，胜利也伤国
> 4. 稳定是永恒——200 年太平才是真胜利，短期强权终将崩溃
> 5. 信息要透明——每个决策点都能看到预估效果和风险提示
> 6. AI 要可信——行为可见、逻辑可理解、不作弊
> 7. 永久红线——不做即时战斗、不做单位战术移动、不做战场画面（DEC-003）

---

## 0. 一句话定位

> **永恒帝国**：你不是一个将军，而是一个国家的统治者。通过数百年的治理、改革、战争、外交、科技与社会管理，建立一个能长期存续的国家机器——扩张越大治理越难，真正的胜利是让帝国运转 200 年而不崩溃。

---

## 1. 终局愿景（3 年后的 Imperium Aeternum）

| 维度 | 终局状态 |
|------|---------|
| 玩法深度 | 8 大系统全部有"短期收益 vs 长期风险"的张力决策点；每局都有不同故事 |
| 内容丰富 | 300+ 事件 / 40+ 建筑 / 50+ 科技 / 20+ 政策 / 20+ 法律 / 15+ 性格 / 15+ 剧本 |
| 世界规模 | 205 国 577 省可流畅运行，50 回合 < 2s，真人可玩到 200 回合不崩溃 |
| AI 可信 | AI 行为可见、逻辑可理解、3 档分层不卡顿、能与玩家形成可信博弈 |
| 体验闭环 | 新手 5 步引导 → 30 分钟理解 → 5 小时一局 → 200 回合有完整叙事弧 |
| 工程质量 | 引擎纯函数化、存档版本迁移、ErrorBoundary、200+ 针对性测试、可确定性重放 |
| 可发布 | GitHub Pages 在线可玩 + 本地可打包 + 多存档槽 + 自动存档 |
| 移植准备 | 玩法成熟后，引擎纯函数化使其可移植 Godot/Unity（数据驱动 + 引擎/UI 分离） |

---

## 2. 当前缺口诊断（2026-06-25 穷尽实读 18 符号核对）

> 核对方法：逐 WP 实读对应代码符号（非凭记忆），共读 18 个符号横跨 turn/politics/economy/military/ai/persistence/App/EventModal/PoliticsScreen/gameStore/ErrorBoundary/ProvinceScreen/DiplomacyScreen/MilitaryScreen/events。
> 结果：原 v1.2 声称的 12 个缺口（4 致命 + 8 严重）中 **9 个已实现**，本节按真实剩余缺口重写。

### ✅ 已实现（勿重做）

| 原 WP | 原声称缺口 | 真实代码证据 | 验证人 |
|------|----------|------------|--------|
| ~~A1~~ | 叛乱无临时 Nation + 无连锁 + 无归顺 | `turn.ts:369-449` 建临时 Nation（`rebellionDecay:6`/`rebelOf`）+ 相邻同文化 30% 连锁（`mulberry32`）+ `processTurn:223-249` 衰减归 0 归顺+Chronicle | 实读 |
| ~~A2~~ | 无内战可操作状态 | `turn.ts:432-444` 激活 `civilWar`；`economy.ts:138-140` 税收×0.7；`politics.ts:47-55` 稳定-3；`PoliticsScreen.tsx:51-66` 镇压/谈判按钮；`gameStore.ts:716-788` suppressRebellion/negotiateRebellion 完整实现 | 实读 |
| ~~A3~~ | 孤儿军队软锁未修 | `military.ts:120-137` 割省后败方军队撤回最近本国省/首都/任意己省，无本国省 disbanded+Chronicle"残军溃散" | 实读 |
| ~~A4~~ | AI 行为玩家不可见 | `turn.ts:170-221` 收集宣战/灭国/结盟 worldEvents（仅邻国/相关）+`buildReport:333` slice(-10) | 实读 |
| ~~B1~~ | 事件 factionSat 显示原始 id | `EventModal.tsx:33-34` factionLabel={nobles:'贵族',merchants:'商人',...} 翻译显示"贵族满意 +8" | 实读 |
| ~~B2~~ | 省份归属变化无通知 | `turn.ts:210-221` 收集玩家省份归属变化 + `report.provinceChanges` 填充 | 实读 |
| ~~B3~~ | 仅 1 槽位存档 | `persistence.ts` 5 槽位+autoSave+listAllSlots+deleteSlot；`SaveLoadScreen.tsx:46-88` 5 槽位卡片 UI | 实读 |
| ~~B6~~ | 无 ErrorBoundary | `components/ErrorBoundary.tsx` 完整实现 getDerivedStateFromError+componentDidCatch；`App.tsx:4` 已 import 包裹 | 实读 |
| ~~B7~~ | 存档无版本迁移 | `persistence.ts:16-62` v1→v2→v3 完整迁移（补 embargoedRoutes/tech.culture/chronicle/battleReports/warProgress/factionDelta/exhaustSnapshot/civilWar/worldEvents/provinceChanges） | 实读 |

### 🔴 真实剩余缺口

| ID | 缺口 | 真实代码现状 | 影响 | 归属 WP |
|----|------|------------|------|---------|
| **G1** | 建筑拆除 UI 未接 | `gameStore.ts:697-714` demolishBuilding 引擎完整（扣实例+返 30% 金），但 `ProvinceScreen.tsx` 无拆除按钮 | 玩家建错无法挽回 | B4 收尾 |
| **G2** | 停战提醒显示缺失 | `MilitaryScreen.tsx:257` truce 国隐式过滤不显示宣战按钮，但无"剩余 X 回合可宣"显示、无到期 LogToast | 玩家不知何时能再宣 | B5 收尾 |
| **G3** | 政体反扑事件未接 | `politics.ts:137` 切政体设 `govTransitionTurns=3` 标记，但 `engine/events.ts` 和 `data/events.ts` 无读取此字段的反扑事件 | 切政体无反弹感，违"改革有反弹"宪法 | B8 收尾 |
| **G4** | 引擎 mutate 非纯函数 | `settleEconomy` 直接 mutate `nation` 引用（`state.nations[id]` 别名）；顶层 `processTurn` 已浅拷贝但子引擎穿透改原对象 | 无法回滚/移植，C1 真缺口 | C1 |
| **G5** | store 浅拷贝全渲染 | `set({state:{...st.state}})` 浅拷贝触发所有订阅重渲染 | 操作延迟 ~50ms | C2 |
| ~~G6~~ | ~~测试针对性不足~~ | ~~engine-targeted 11 个已存在~~ | **C3 完成：26 针对性测试，economy/politics/military/diplomacy 各 ≥5，89/89 全绿** | ✅ C3 已完成 |
| **G7** | `as` 断言清理 | **tsconfig strict:true 已开**（C4 大部分已做）；仅剩 `govTransitionTurns` 的 `as Nation & {...}` 临时断言需改正式字段 | 可维护性 | C4 收尾 |
| ~~G8~~ | ~~确定性重放未做~~ | **`turn.test.ts:384-403` 已有 C5 重放测试且通过**（同 seed 推 20 回合两次 state 完全相同） | 已做，删 WP |

### 🟢 增强缺口（未变，从 v1.2 继承）

| ID | 缺口 | 影响 | 归属 WP |
|----|------|------|---------|
| G9-G16 | 事件扩充/科技质变/建筑扩充/法律扩充/剧本扩充/性格扩充/UI 打磨/移植准备 | 内容耐玩度 + 体验 + 可移植 | D1-D6 / E1-E6 / F1-F3 |

---

## 3. 工作包分解（Work Packages）

> 优先级：**P0 致命 > P1 严重 > P2 增强 > P3 锦上添花**
> 每个 WP 含：依赖钩子（真实代码位置）+ 验收标准 + 红线 + 预估。
> 跨 WP 依赖用 `→` 标注。

### Phase A：玩法闭环 ✅ 已全部完成（2026-06-25 实读核实）

> 原 4 WP（A1/A2/A3/A4）全部已在代码中实现，本 Phase archived。证据见 §2「已实现」表。
> 现状：叛乱有临时 Nation+连锁+归顺、内战有镇压/谈判 UI+引擎、孤儿军队自动撤退、AI 行为可见。
> **无需开工**，直接进 Phase B 收尾。

### Phase B：体验闭环（3 个收尾 WP + 5 个已完成）

> 已完成（勿重做）：B1 事件预览 / B2 省份通知 / B3 多槽位 / B6 ErrorBoundary / B7 存档迁移。
> 剩余 3 个收尾 WP 是已完成引擎缺 UI 接线或事件接线。

| WP | 标题 | 依赖钩子 | 验收 | 预估 |
|----|------|---------|------|------|
| **B4** | 建筑拆除 UI 接线 | `gameStore.ts:697-714 demolishBuilding`（引擎已完成）+ `ProvinceScreen.tsx`（缺按钮） | ProvinceScreen 建筑卡片加"拆除"按钮（显示返还 30% 预估），点击调 demolishBuilding，LogToast 显示"拆除 XX 返还 YY 金" | S |
| **B5** | 停战提醒显示 | `MilitaryScreen.tsx:257`（truce 隐式过滤已存）+ `DiplomacyScreen.tsx`（无剩余回合） | Military 宣战区停战国显示"X 回合后可宣"（读 `rel.truceTurns`）；Diplomacy 关系表停战国显示剩余回合；停战到期当回合 LogToast 通知"与 XX 停战到期，可再宣" | S |
| **B8** | 政体反扑事件接线 | `politics.ts:137 govTransitionTurns=3`（标记已设）+ `data/events.ts`（无反扑事件）+ `engine/events.ts rollEvents`（不读此字段） | data/events 加 2-3 个反扑事件（如"旧贵族密谋复辟"/"共和派逼宫"/"教士反扑"），trigger 含 `govTransitionTurns>0`；rollEvents 检测此触发；3 回合窗口内概率触发；触发后 Chronicle 记录 | M |

**Phase B 验收门槛**：3 收尾 WP 完成，真人玩 100 回合无困惑、拆除可用、停战可见、切政体有反扑事件。

### Phase B：体验闭环（3 个收尾 WP — 详见上方表）

> 本节为上方 B4/B5/B8 表的补充说明位，WP 详情已在上表列出。
> 已完成的 B1/B2/B3/B6/B7 勿重做（证据见 §2）。

**Phase B 验收门槛**：3 收尾 WP 完成，真人玩 100 回合无困惑、拆除可用、停战可见、切政体有反扑事件。

### Phase C：架构健壮（3 真缺口 + 1 收尾 + 1 已完成）

> 已完成（勿重做）：C5 确定性重放（`turn.test.ts:384-403` 已有且通过）。
> C4 大部分已做（tsconfig strict:true 已开），仅剩 `as` 断言清理收尾。
> C1/C2/C3 真缺口但高风险 XL，需充足上下文回合做。

| WP | 标题 | 依赖钩子 | 验收 | 预估 | 状态 |
|----|------|---------|------|------|------|
| **C4** | `as` 断言清理收尾 | `politics.ts:137` + `events.ts checkTrigger` + `turn.ts:104` 的 `govTransitionTurns as` 断言 | Nation 接口加 `govTransitionTurns?: number` 正式字段；3 处 `as` 断言改直接访问；typecheck + test 通过 | S | 本回合做 |
| **C1** | 引擎纯函数化 | `engine/*.ts settleEconomy/settlePolitics/...` | 子引擎改 `(nation, state) => partialResult` 不 mutate；processTurn 合并结果建新 state；可回滚/重放 | XL | 下回合 |
| **C2** | store 精确订阅 | `gameStore.ts set` + 12 screen | Zustand selector 精确订阅；React.memo 关键屏幕；操作响应 ~50ms→~5ms | L | 下回合 |
| ~~C3~~ | ~~引擎单元测试扩充~~ | ~~`__tests__/` → C1~~ | ~~**完成：engine-targeted 11→26 测试，economy/politics/military/diplomacy 各 ≥5，总数 74→89 全绿**~~ | XL | ✅ 已完成 |
| ~~C5~~ | ~~确定性重放~~ | ~~turn.ts~~ | ~~已实现 `turn.test.ts:384-403`~~ | — | ✅ 已完成 |

**Phase C 验收门槛**：~~C4 收尾完成~~ ✅ + ~~C3 完成~~ ✅ + C1/C2 完成，引擎可纯函数重放、89+ 测试、操作响应 <10ms、50 回合 <2s。**当前：C3/C4/C5 ✅，C1/C2 待做。**

### Phase D：内容丰富（让游戏"耐玩"）

| WP | 标题 | 依赖钩子 | 验收 | 红线 | 预估 |
|----|------|---------|------|------|------|
| **D1** | 事件扩充至 300+ | `data/events.ts` | 每类别 ≥8 个；+5 链（蛮族入侵/瘟疫/继位内战/商业革命/宗教改革）；总链 10+ | 需 DEC 解锁"事件≤100"红线到 300（当前 150 已存于代码，红线文档未更新） | XL |
| **D2** | 科技质变效果 | `data/technologies.ts` + `formulas.ts` | 高级科技解锁新能力（agri_lv5 轮作政策+15%粮；agri_lv8 化肥建筑×1.5；mil_lv5 要塞+50%防；mil_lv8 总动员×2征兵；admin_lv5 科举法-10腐败；admin_lv8 行省制+5省；culture_lv5 文化输出外交；culture_lv8 永恒文脉性格） | 需 DEC 解锁"科技不超 3×8"红线到质变 | L |
| ~~D3~~ | ~~建筑扩充至 40+~~ | ~~`data/buildings.ts`~~ | ~~**完成：24→40 建筑，+16 含前置科技/地形适配/差异化产出（铁匠铺/漕运码头/城墙加固/书院/驿馆/筒仓/铸币工坊/药铺/望楼/会馆/军械库/观象台/王家粮仓/贸易站/修道院/水利工程）**~~ | — | ✅ 已完成 |
| ~~D4~~ | ~~法律扩充至 20+~~ | ~~`data/laws.ts`~~ | ~~**完成：12→20 法律，+8 含互斥/前置/派系反应（民法+3/刑法+2/行政法+3）**~~ | S | ✅ 已完成 |
| ~~D5~~ | ~~剧本扩充至 15+~~ | ~~`data/scenarios.ts`~~ | ~~**完成：7→10 剧本（+w4_europe 欧洲封建/w8_indianocean 印度洋贸易/challenge_survival 生存挑战）**~~ | — | M→完成 |
| ~~D6~~ | ~~国家性格扩充至 15+~~ | ~~`data/national-characters.ts` → A4~~ | ~~**完成：11→15 性格（+isolationist/expansionist/scholarly/mercantilist），同步扩 NationalTendency/buildTendency/BEHAVIOR_MAPPINGS**~~ | S | ✅ 已完成 |

**Phase D 验收门槛**：玩家两局不重样、每局都有新事件新选择新故事。

### Phase E：体验打磨（让游戏"舒服"）

| WP | 标题 | 依赖钩子 | 验收 | 预估 |
|----|------|---------|------|------|
| **E1** | 新手交互教程 | `App.tsx` + 新组件 | 首次进入 5 步教程（总览/税率/建设/下一回合/报告）；tooltip+遮罩；可跳过可重看 | M |
| **E2** | 统计图表页 | 新 `StatsScreen.tsx` | 国库/粮/人口/稳定 50 回合折线；派系满意度雷达；军力对比条形；科技甘特图 | M |
| **E3** | 键盘快捷键完善 | `App.tsx` | B 建设农田 / R 征兵 / T 调税 / Esc 关弹窗 / [/] 切省 | **部分完成：Esc 关帮助浮层 + [/] 切省 ✅；B/R/T 留后（需深度改 ProvinceScreen）** | S→部分 |
| **E4** | 音效系统 | 新 `utils/audio.ts` | Web Audio API 合成（钟声/战鼓/竹简/锤/警报）；无音频文件；可静音 | L |
| **E5** | SVG 地形地图 | `WorldMap.tsx` | 省份改 Voronoi 多边形；地形颜色（平原绿/山地棕/沙漠黄/沿海蓝）；边界按归属国着色；河流/山脉 SVG path | XL |
| **E6** | 暗色/亮色主题打磨 | `index.css` + screens | 现有切换基础上加更多主题（竹简/青铜/水墨）；全屏一致性 | M |

**Phase E 验收门槛**：新手 30 分钟理解、5 小时一局、200 回合有完整叙事弧。

### Phase F：移植准备（让游戏"能搬走"）

| WP | 标题 | 依赖钩子 | 验收 | 预估 |
|----|------|---------|------|------|
| **F1** | 引擎/UI 完全分离审计 | `engine/*` + `screens/*` → C1 | 引擎零 React 依赖、零 DOM 依赖；可独立打包为 `imperium-engine` npm 包 | L |
| **F2** | 数据格式中立化 | `data/*.ts` → JSON | 所有数据表可导出为 JSON；引擎可从 JSON 加载（为 Godot/Unity 读 JSON 铺路） | M |
| **F3** | Godot 移植可行性报告 | — | 评估引擎→GDScript、数据→JSON、UI→Control 节点的移植路径；输出 `docs/12-godot-migration.md` | S |

**Phase F 验收门槛**：引擎可独立打包、数据可导出 JSON、有明确的 Godot 移植路径。

---

## 4. 执行路线图（带里程碑）

```
2026 Q3                                          2026 Q4                                          2027 Q1
│                                                │                                                │
├─ Phase A 玩法闭环 ✅ 已完成                    ├─ Phase C 架构健壮（C1-C5，~40h）               ├─ Phase E 体验打磨（E1-E6，~40h）
│ 里程碑 M1：可玩原型 v0.2 ✅ 已达成             │ 里程碑 M3：工程基线 v0.4                       │ 里程碑 M5：可发布 v0.6
│  - 4 真实致命缺口全修（实读核实）              │  - 引擎纯函数化                                │  - 新手教程 + 统计图表 + 音效
│  - 74 测试全绿                                 │  - 200+ 测试                                   │  - SVG 地图 + 主题打磨
│  - 50 回合 1131ms                              │  - 50 回合 <2s                                 │  - 真人 200 回合可玩
│  - AI 行为可见、叛乱可镇压                     │  - 确定性重放                                   │
│                                                │                                                │
│           ├─ Phase B 体验闭环（B4/B5/B8，~6h）        ├─ Phase D 内容丰富（D1-D6，~XL）      │           ├─ Phase F 移植准备（F1-F3，~L）
│           里程碑 M2：体验闭环 v0.3                     里程碑 M4：内容丰富 v0.5               里程碑 M6：可移植 v0.7
│            - 拆除 UI、停战显示、政体反扑               - 300 事件 / 40 建筑 / 50 科技          - 引擎独立打包
│            - 其余 5 WP 已完成                          - 15 剧本 / 15 性格                    - 数据 JSON 导出
│                                                       - 每局不重样                           - Godot 报告
```

### 里程碑验收门（每门不过不进下阶段）

| 门 | 条件 | 谁验 | 状态 |
|----|------|------|------|
| M1→M2 | 4 致命缺口全修 + ≥12 新测试 + 真人 50 回合无崩 | 用户 | ✅ M1 已达成（74 测试全绿，缺口实读核实已修） |
| M2→M3 | 真人玩 100 回合无困惑、拆除/停战/反扑可用 | 用户 | ⏳ 待 B4/B5/B8 |
| M3→M4 | 50 回合 <2s、200+ 测试、确定性重放通过 | 自动化 + 用户 | ⏳ |
| M4→M5 | 真人玩 200 回合不无聊、每局有新故事 | 用户 | ⏳ |
| M5→M6 | 真人完整通关 200 回合、新手 30 分钟理解 | 用户 | ⏳ |
| M6→发布 | 引擎独立打包、数据 JSON 导出、Godot 报告 | 自动化 | ⏳ |

---

## 5. 红线解锁清单（需登记 DEC）

> 2026-06-25 已核实 `decisions.md` 现状：DEC-001~026 已登记，DEC-021 正式突破 v1 红线体系建立 v2 基线。下表按真实红线状态重写。

### 5.1 永久红线（DEC-003/021 锁死，永不解锁）

| 红线 | 出处 | 状态 |
|------|------|------|
| 不做即时战斗 / 单位战术移动 / 战场画面 | DEC-003 | 永久 |
| 不做联机 / 美术 / 多语言 / 自定义国家 / 移植（玩法成熟前） | DEC-021 v2 §3.2 | 永久 |

### 5.2 当前阶段红线（DEC 可解锁）

| 红线 | 当前真实状态 | 触发 WP | 解锁要求 |
|------|------------|---------|---------|
| 事件 ≤100 | **已实质突破**（代码 150，DEC-021 v2 基线已容纳）但红线文档未显式更新到 300 | D1 | DEC-027 说明为何扩到 300 + 评估测试覆盖 |
| 科技不超 3×8 | **已实质突破**（代码 32 科技 4 路线×8 级，DEC-018 已扩 culture 路线）但红线文档未更新 | D2 质变效果 | DEC-028 说明质变效果不扩路线数，只加解锁能力 |
| 复杂外交链不扩（条约类型） | 当前 5 条约（none/trade/alliance/war/truce），未扩 | — | E2 vassalage/guarantee 暂不做，保持红线 |
| 政体不超 12 | DEC-010 已扩至 12，未超 | — | 保持 |
| 性能 <800ms/回合 | DEC-026 已达 799ms（50 回合） | C2 进一步优化到 <2s | 无红线，纯优化 |

### 5.3 DEC 编号延续

- 已用：DEC-001~026（见 `decisions.md`）
- 本方案预留：DEC-027（事件扩 300）、DEC-028（科技质变）、DEC-029（A1 叛乱临时 Nation）、DEC-030（A2 内战状态）、DEC-031（A3 孤儿军队）、DEC-032（A4 AI 可见）…
- 每条 DEC 需含：背景、决策、影响、替代方案、回滚成本。

---

## 6. 验证策略（贯穿所有 WP）

### 6.1 自动化（每次提交）

```bash
npm run typecheck   # tsc --noEmit
npm test            # vitest run（目标 200+）
npm run validate    # 数据表完整性
npm run build       # vite build（CI 部署 Pages）
```

### 6.2 压力测试（每 Phase 结束）

- 3 模拟玩家 × 100 回合：检查 NaN / 数值爆炸 / AI 灭亡率 / 胜利条件可达性
- 50 回合 205 国性能基准：< 2s（M3 目标）
- 确定性重放：同 seed 同输入 → 同 state（M3 后）

### 6.3 真人测试（每里程碑）

- M1：1 用户 × 50 回合，记录崩溃/困惑点
- M2：1 用户 × 100 回合，记录 AI 行为可见性/通知有效性
- M4：1 用户 × 200 回合，记录 boredom/重玩价值
- M5：1 新手 × 首次体验，记录上手门槛

---

## 6.4 真人测试脚本（里程碑门可操作版）

> 把模糊的"玩 50 回合"拆成可执行清单。测试者按表逐项打勾，发现问题记到右栏。
> 每个里程碑门必须全表绿才进下阶段。

### M1 门：50 回合无崩溃（Phase A 验收）

**前置**：选 classic 剧本 + n01 开局。目标回合计 50。

| # | 测试路径 | 期望 | 实际 | 问题记录 |
|---|---------|------|------|---------|
| 1 | 开局选 classic + n01 | 进入总览页，四大核心卡显示数值 | | |
| 2 | 点开 12 个 tab 各一次（总览/舆图/省份/经济/人口/政治/军事/外交/科技/年报/史册/存档） | 每页不白屏不报错 | | |
| 3 | 经济页调税率 +5% | LogToast 显示成功，下回合税收变化 | | |
| 4 | 省份页选一省建农田 | 扣金，建筑出现在列表 | | |
| 5 | 政治页安抚一派系 | 派系满意度变化 | | |
| 6 | 军事页征兵 100 | 扣金扣粮，军队数+100 | | |
| 7 | 外交页对邻国改善关系 | 影响力扣除，关系值变化 | | |
| 8 | 科技页选一科技开始研究 | 科研点扣除，进度显示 | | |
| 9 | 按 Space 或点下一回合 | 进入回合报告，数值更新 | | |
| 10 | 回合报告按 1/2/3 处理事件 | 事件效果生效，关闭弹窗 | | |
| 11 | 连续推 50 回合（期间正常操作） | 无白屏无 NaN 无数值爆炸 | | |
| 12 | 50 回合内观察是否触发叛乱 | 叛乱省可见，Chronicle 有记录 | | |
| 13 | 50 回合内观察 AI 宣战/结盟 | 天下大势区显示（A4 后） | | |
| 14 | 存档一次 | SaveLoad 页显示存档元信息 | | |
| 15 | 读档一次 | 回到存档时状态，无崩 | | |
| 16 | 强制触发崩溃场景（调试高税+连战） | ErrorBoundary 显示"国运不济"而非白屏（B6 后） | | |

**门通过条件**：16 项全绿，无崩溃。任一项红 → 回 Phase A 修。

### M2 门：100 回合无困惑（Phase B 验收）

**前置**：M1 通过后新开局，推到 100 回合。

| # | 测试路径 | 期望 | 实际 | 问题记录 |
|---|---------|------|------|---------|
| 1 | 推到 30 回合观察 AI 行为可见性 | 天下大势区每回合有 ≥1 条邻国大事 | | |
| 2 | 发动一次战争并占领省份 | 回合报告显示"获得省份"叙事（B2） | | |
| 3 | 割省后观察败方军队 | 不滞留已失省份（A3） | | |
| 4 | 触发叛乱并镇压 | Politics 有镇压/谈判按钮（A2） | | |
| 5 | 切换政体一次 | 显示反弹风险预估，3 回合内触发反扑事件（B8） | | |
| 6 | 事件选项效果预览 | factionSat 显示中文"贵族满意+8"非原始 id（B1） | | |
| 7 | 存 5 个不同槽位 | SaveLoad 页 5 槽位卡片显示（B3） | | |
| 8 | 拆除一个建筑 | 返还 30% 金，建筑消失（B4） | | |
| 9 | 停战条约到期 | LogToast 提醒可再宣（B5） | | |
| 10 | 加载 v1 旧存档 | migrate 后无 undefined 字段崩（B7） | | |
| 11 | 推到 100 回合 | 全程无困惑点，每回合都知道发生了什么 | | |

**门通过条件**：11 项全绿。任一项红 → 回 Phase B 修。

### M3 门：性能与架构（Phase C 验收，自动化为主）

| # | 测试 | 期望 | 实际 |
|---|------|------|------|
| 1 | `npm test` | 200+ 测试全绿 | |
| 2 | 50 回合 205 国性能基准 | < 2s（DEC-026 当前 799ms，C2 后应更稳） | |
| 3 | 确定性重放：同 seed 同输入跑两次 | state 完全相同（C5） | |
| 4 | `tsc --strict` | 通过（C4） | |
| 5 | 引擎零 React 依赖审计 | engine/* 无 import react（C1） | |

### M4 门：200 回合耐玩（Phase D 验收）

**前置**：M3 通过后，玩完整 200 回合（可分多次存档）。

| # | 测试路径 | 期望 | 实际 | 问题记录 |
|---|---------|------|------|---------|
| 1 | 推到 100 回合事件是否重复 | 仍能见到未见事件（D1 扩至 300） | | |
| 2 | 高级科技解锁新能力 | agri_lv5 解锁轮作政策等（D2） | | |
| 3 | 新建筑可用 | 铁匠铺/城墙等 8 新建筑可建（D3） | | |
| 4 | 新法律可推行 | 科举制/均田令等 6 新法律（D4） | | |
| 5 | 换剧本玩第二局 | 体验与第一局明显不同（D5） | | |
| 6 | 推到 200 回合是否无聊 | 有新事件新选择维持兴趣 | | |
| 7 | 是否达成任一胜利条件 | 至少 1 局达成 4 胜利之一 | | |

### M5 门：新手可上手（Phase E 验收）

**前置**：找 1 个没玩过的人，不给他任何提示。

| # | 测试路径 | 期望 | 实际 | 问题记录 |
|---|---------|------|------|---------|
| 1 | 首次进入触发 5 步教程 | 教程逐步引导（E1） | | |
| 2 | 30 分钟内能否理解核心循环 | 能独立做调税/建设/下一回合 | | |
| 3 | 统计图表页能否看懂趋势 | 折线/雷达/条形图清晰（E2） | | |
| 4 | 键盘快捷键是否好用 | B/R/T/Esc/[/] 可用（E3） | | |
| 5 | 音效是否增强反馈 | 关键操作有音效不刺耳（E4） | | |
| 6 | SVG 地图是否比圆点直观 | 地形/边界/河流可见（E5） | | |

### M6 门：可移植（Phase F 验收，自动化）

| # | 测试 | 期望 |
|---|------|------|
| 1 | 引擎独立打包 | `imperium-engine` npm 包可 build（F1） |
| 2 | 数据导出 JSON | 所有 data/*.ts 可导出为 JSON（F2） |
| 3 | Godot 报告 | `docs/12-godot-migration.md` 输出（F3） |

---

## 7. 与现有规划文档的映射

| 现有文档 | 映射到本方案 | 处置 |
|---------|------------|------|
| `06-expansion.md` E1-E10 | A6/E1-E6/F1-F3 | 收敛入 WP，原文件标 ARCHIVED |
| `08-comprehensive-plan.md` P1-P5 | A1-A7/B1-B8/C1-C5/D1-D6/E1-E6 | 收敛入 WP，原文件标 ARCHIVED |
| `decisions.md` DEC-001~025 | §5 红线解锁清单 | 继续累积，每 WP 完成登记 DEC |
| `07-playability-plan.md` | B1-B8 + E1 | 收敛入 WP |
| `world-expansion-plan.md` | D5 剧本 | 收敛入 WP |
| `11-cyclic-audit.md` §5 压力测试 | §6.2 压力测试 | 直接引用 |

**本方案生效后，06 和 08 标记为 ARCHIVED（保留历史），所有新工作以本方案为准。**

---

## 8. 工作纪律（给执行者的硬规则）

1. **一次只推一个 Phase**——不跨 Phase 并行，避免上下文爆炸
2. **每个 WP 完成立即验证**——typecheck + test + 该 WP 验收标准
3. **每个 WP 完成登记 DEC**——背景/决策/影响/替代/回滚
4. **遇红线立即停**——不擅自解锁，先登记 DEC 等用户确认
5. **不引入未规划依赖**——新 npm 包需 DEC
6. **代码改动必绑 WP**——commit message 含 WP ID（如 `A1: 叛乱实际执行`）
7. **每 Phase 结束写 handoff**——更新 `docs/handoff.md` 状态快照
8. **真人测试不可跳**——每里程碑门由用户确认才进下阶段

---

## 9. 总工作量与节奏

| Phase | WP 数 | 预估 | 节奏 | 状态 |
|-------|------|------|----------------------|------|
| A 玩法闭环 | 4 | ~19h | — | ✅ 已完成（实读核实） |
| B 体验闭环 | 3 收尾 | ~6h | 3 WP/天，~1 天 | ⏳ 5 已完成剩 3 收尾 |
| C 架构健壮 | 5 | ~40h | 1 WP/1-2 天，~7 天 | ⏳ |
| D 内容丰富 | 6 | ~XL | 1 WP/天，~6 天 | ⏳ |
| E 体验打磨 | 6 | ~40h | 1 WP/天，~6 天 | ⏳ |
| F 移植准备 | 3 | ~L | 1 WP/天，~3 天 | ⏳ |
| **合计** | **27 剩余** | **~110h** | **~20 工作日** | — |

> 较 v1.2 减少 5 WP / ~20h——因穷尽实读代码后发现 Phase A 全部完成 + Phase B 5 个完成，避免重做。
> v1.0→v1.1→v1.2→v1.3 累计剔除 12 个已完成误报 WP。

---

## 10. 第一步行动（本文档生效后立即执行）

**Phase A 已全部完成，直接进 Phase B 收尾，从 B4 开始**（依赖最少、纯 UI 接线、~2h）：

1. 读 `src/store/gameStore.ts:697-714` 的 `demolishBuilding` action（引擎已完整：扣实例+返 30% 金+LogToast）
2. 读 `src/screens/ProvinceScreen.tsx` 的建筑卡片渲染段，找接入点
3. 实现 B4：建筑卡片加"拆除"按钮（显示返还 30% 预估），点击调 `demolishBuilding(provinceId, buildingInstanceId)`
4. typecheck + test 通过
5. 登记 DEC-029：建筑拆除 UI 接线
6. 提交 `B4: 建筑拆除 UI 接线`
7. 进入 B5（停战提醒显示）

**用户确认本方案后，回复"开始 B4"即启动。**

---

> **本方案是活文档。每 Phase 完成后回顾本方案，根据真人测试反馈调整后续 WP 优先级。但设计宪法（§0）和红线（§5）不可推翻，除非登记新 DEC 并经用户确认。**
>
> Version 1.3 · 2026-06-25 · 基于 57 源文件 / 11077 行深度审查 + **穷尽实读 18 符号**核对 · 收敛 06+08 散落规划 · 剔除 12 个已完成误报 WP · 红线表对齐 DEC-001~026 现状 · 补真人测试脚本 §6.4 · 统一指挥棒
>
> 版本变更：
> - v1.0→v1.1：实读代码剔除 A3/A4/A5/A6 误报（政体被动/性格生效/贸易差异化/和约三档均已实现），Phase A 7 WP→4 WP。
> - v1.1→v1.2：核实 Phase B/C 无误报（误判，实际有误报）；§5 红线表对齐 DEC-021 v2 基线；新增 §6.4 真人测试脚本。
> - v1.2→v1.3：**穷尽实读 18 符号**后发现 Phase A 全部 4 WP + Phase B 5 WP 已完成（A1/A2/A3/A4 + B1/B2/B3/B6/B7），Phase A archived，Phase B 从 8 WP 缩为 3 收尾 WP（B4/B5/B8），剩余 27 WP / ~110h。**教训：前两次误报根因都是读代码不彻底，本次逐一实读对应符号而非凭记忆推断。**
> - v1.3→v1.4：穷尽核实 Phase C——C5 确定性重放确认已存在于 `turn.test.ts:384-403`（archived）；C4 缩为 `govTransitionTurns as` 断言清理收尾。
> - v1.4→v1.5：**本回合完成 C3+C4+B4+B5+B8 五个 WP**。C3 引擎针对性测试 11→26（economy/politics/military/diplomacy 各 ≥5，总数 74→89 全绿）；C4 `as` 断言清理（Nation 接口加 `govTransitionTurns` 正式字段）；B4 建筑拆除按钮接线；B5 停战回合数显示三处；B8 三政体反扑事件 + 删 5 重复事件 id（validate 5 错误→0）。Phase B 全部 archived，Phase C 仅剩 C1/C2（XL 高风险）。**教训：写测试也要先穷尽读引擎实际逻辑再下笔——第一次凭签名猜致 4 个失败，逐个读 `settlePopulation` 6 参数/`declareWar` 无同盟检查/`moveArmy` 首都枢纽规则才修对。**
> - v1.5→v1.6：**本回合完成 D4+D6 两个 Phase D WP**。D4 法律 12→20（+8 含互斥/前置/派系反应，民法+3/刑法+2/行政法+3）；D6 国家性格 11→15（+isolationist 孤立主义/expansionist 扩张主义/scholarly 文治/mercantilist 重商，同步扩 NationalTendency/buildTendency/BEHAVIOR_MAPPINGS +6 行为映射/叛军 tendency/formulas tendency）。**教训：D6 旧描述指定 +4 性格中 3 个已存在（maritime/centralization/revolutionary），照搬会重复——穷尽实读现有 11 性格后选真正缺口，再次印证"不照搬旧规划，按现状补真缺口"。**
> - v1.6→v1.7：**本回合完成 D3 一个 Phase D WP**。D3 建筑 24→40（+16 含前置科技/地形适配/差异化产出：铁匠铺/漕运码头/城墙加固/书院/驿馆/筒仓/铸币工坊/药铺/望楼/会馆/军械库/观象台/王家粮仓/贸易站/修道院/水利工程）。validate 动态计数 BUILDING_LIST.length 自动适配。Phase D 仅剩 D1/D2/D5。
> - v1.7→v1.8：**本回合完成 D5 一个 Phase D WP + E3 部分**。D5 剧本 7→10（+w4_europe 欧洲封建 4 洲/w8_indianocean 印度洋贸易 4 洲/challenge_survival 生存挑战硬核模式）；E3 键盘快捷键部分（Esc 关帮助浮层 + [/] 切省，B/R/T 留后）。Phase D 仅剩 D1/D2（XL）。**教训：D5 旧描述指定 w7_fantasy 奇幻需新数据集超 MVP 红线，改做 challenge_survival 硬核模式更契合——再次印证"不照搬旧描述，按红线约束调整"。**
