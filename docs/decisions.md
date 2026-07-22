# Imperium Aeternum — 关键决策记录（ADR）

> 本文件记录所有推翻冻结基线的决策。每条 ADR 含：背景、决策、影响、替代方案。

格式：`DEC-NNN：标题`

---

## DEC-001：MVP 锁定 10 省份、5 国（含玩家）

- **阶段**：1（设计圣经）
- **背景**：原需求说 8-12 省份、3 个 AI。需定死以便后续数据/UI 不漂移。
- **决策**：固定 10 省份、5 国（玩家 1 + AI 4）。AI 数从 3 提到 4，让外交更立体。
- **影响**：`provinces.ts` 10 条；`nations.ts` 5 条；UI 地图 10 格。
- **替代**：12 省份 4 国（否决：UI 过密）；8 省份 3 国（否决：外交太单薄）。

## DEC-002：固定 1 回合 = 1 年，不做回合长度切换

- **阶段**：1
- **背景**：原需求提到早期 1 年/后期 1 季度。MVP 不做。
- **决策**：全程 1 回合 = 1 年。永恒帝国胜利 = 200 回合。
- **影响**：`turn.ts` 无长度切换逻辑；UI 无切换按钮。
- **替代**：分阶段切换（否决：增加复杂度，MVP 红线 §11）。

## DEC-003：战争只做战略层结算，无即时战斗

- **阶段**：1
- **背景**：原需求明确 MVP 不做即时战斗。
- **决策**：宣战 → 每回合自动结算战况 → 达成停战/吞并。无单位移动、无战术指令。
- **影响**：`military.ts` 仅含 `resolveBattle`；UI 无战场画面。
- **替代**：简易回合战术（否决：超 MVP 红线）。

## DEC-004：所有公式集中到 `src/engine/formulas.ts`

- **阶段**：0（规划）
- **背景**：原需求让公式散落各 engine 文件，调试难。
- **决策**：所有数值公式集中为纯函数，配 Vitest 单测手算对照。
- **影响**：`engine/*.ts` 只调用 formulas；调参一处生效。
- **替代**：散落（否决：调试困难）。

## DEC-005：存档 schema 含 version 字段 + migration

- **阶段**：0
- **背景**：长项目迭代 GameState 会变，旧档易废。
- **决策**：`SaveGame { version, createdAt, gameState }`，`migration.ts` 按版本顺序迁移。当前 version=1。
- **影响**：`persistence.ts` 读写前必经 migrate。
- **替代**：无版本（否决：后期返工）。

## DEC-006：使用 seeded RNG（mulberry32）

- **阶段**：0
- **背景**：玩家读档后推同一回合，结果必须一致，否则 bug 无法复现。
- **决策**：`utils/random.ts` 实现 mulberry32，seed 存入 GameState，每回合推进更新。
- **影响**：所有事件触发、AI 决策、战斗结算走 seeded RNG。
- **替代**：Math.random（否决：不可复现）。

## DEC-007：MVP 固定中文 UI，文案集中便于后扩多语言

- **阶段**：1
- **背景**：原需求红线禁止多语言。
- **决策**：全中文 UI，文案集中在数据文件与组件常量，不引入 i18n 框架。
- **影响**：后续加多语言需抽文案层，记为阶段 6 扩展项。
- **替代**：直接 i18n（否决：超 MVP）。

## DEC-008：胜利/失败条件数值锁定

- **阶段**：1
- **背景**：设计圣经需定死胜负阈值，避免阶段 2/3 反复改。
- **决策**：见 `01-design-bible.md` §自检 补：4 胜利 + 6 失败的具体阈值。
- **影响**：`turn.ts` 末尾胜负判定按此；`engine/victory.ts`（阶段 5b 新增）实现。
- **替代**：留到阶段 2 定（否决：圣经不完整）。

---

（后续阶段新增 DEC-009…）

---

## DEC-009：省份从 10 扩至 50（含海洋/贸易节点/要塞）

- **阶段**：超庞大扩展 A
- **背景**：用户要求"超庞大完整国家体系"，10 省过小。
- **决策**：扩至 50 省，新增 6 海洋、5 贸易节点、3 要塞；引入海拔/气候/河流/坐标字段。
- **影响**：`provinces.ts` 重写；`formulas.ts` 地形修正补全 11 种；`validate` 适配；`init.ts`/`economy.ts`/`military.ts` 引擎适配**待下一会话**。
- **替代**：30 省（否决：仍不够庞大）。

## DEC-010：政体从 5 扩至 12

- **阶段**：超庞大扩展 I
- **背景**：5 政体不足以表达多样国家形态。
- **决策**：新增部落/联邦/僭主/君主立宪/商业共和国/祭司王/游牧汗国 7 政体，各有派系反应与解锁政策。
- **影响**：`governments.ts` 扩；`politics.ts` 政体切换支持**待下一会话**。
- **替代**：8 政体（否决：少游牧/祭司王，缺特色）。

---

## DEC-011：世界级扩展规模冻结（192 国 / 600 省 / 12 洲）

- **阶段**：世界级扩展 W0（规划冻结）
- **背景**：用户要求"和当今世界类似的大有小、多元并存"，现有 5 国 50 省远不够。
- **决策**：扩至 192 国（类比 UN 成员国）、600 省（均 3 省/国，大国 30-50 省）、12 大洲。体量分 5 级（S/A/B/C/D = 4/12/30/60/86 国）。
- **影响**：见 `docs/world-expansion-plan.md`；6 阶段（W1-W6）递进；性能目标 <800ms/回合。
- **替代**：100 国（否决：不够"当今世界"感）；300 国（否决：AI 与 UI 扛不住）。

## DEC-012：`NationId` 从 union literal 改为 branded string

- **阶段**：世界级扩展 W1（架构重构）
- **背景**：现有 `NationId = 'n01'|...|'n05'` 无法表达 192 国，TypeScript union 会爆。
- **决策**：`NationId = string & { __brand: 'NationId' }`，运行时校验 + 编译期区分。所有 `as NationId` 转型点重审。
- **影响**：`nations.ts` 重写为数据驱动；`Record<NationId, Nation>` → `Record<string, Nation>` + 校验。
- **替代**：保持 union 用代码生成（否决：编译慢、IDE 体验差）。

## DEC-013：外交关系稀疏化 + 默认关系即时计算

- **阶段**：世界级扩展 W1
- **背景**：全连接 192×191/2 = 18336 条内存爆。
- **决策**：只存「有非默认关系」对子（邻国/同盟/战争/贸易/敌对）；默认关系由 `getDefaultRelation(from, to, state)` 按区域模板+文化宗教差异即时算。
- **影响**：`diplomacy.ts` 重写；`init.ts` 的 `buildRelations` 改稀疏；AI「找邻国」改查省份相邻。
- **替代**：全连接压缩存储（否决：AI 查询慢）。

## DEC-014：AI 分层结算（full / lite / static）

- **阶段**：世界级扩展 W1
- **背景**：192 国完整 AI 决策每回合会卡死。
- **决策**：三档——`processAITurnFull`（玩家+S+A+玩家邻国 ~20 国）、`processAITurnLite`（B+C ~90 国只跑经济人口）、`processAITurnStatic`（D ~86 国每 5 回合刷人口）。
- **影响**：`ai.ts` 拆三函数；`turn.ts` 按 `nation.tier` 分派；`Nation` 加 `tier` 字段。预估每回合 ~55ms。
- **替代**：所有 AI 完整结算（否决：超 800ms 预算）。

## DEC-015：性能预算与监控（<800ms/回合）

- **阶段**：世界级扩展 W1
- **背景**：192 国规模下需硬性能门槛防回归。
- **决策**：新建 `utils/perf.ts` 计时每个 engine 阶段，输出到 `GameState.lastReport`；`turn.test.ts` 加「50 回合耗时 <40s」断言。
- **影响**：测试加性能门槛；AI 用对象池避免 GC。
- **替代**：不加门槛（否决：后期性能悄返工）。

## DEC-016：内存预算与存档限制

- **阶段**：世界级扩展 W1
- **背景**：192 国 GameState 约 1.3MB，localStorage 5MB 够但需防膨胀。
- **决策**：`triggeredEvents` 上限 1000（满丢最旧）；`wars` 结束即移除不留历史；派系变化只存关键事件。
- **影响**：`persistence.ts` 加截断逻辑；`turn.ts` 清理已结束战争。
- **替代**：换 IndexedDB（否决：MVP 复杂度红线）。

## DEC-017：W1 架构重构完成（NationId branded / 外交稀疏 / AI 分层 / perf / 内存预算）

- **阶段**：世界级扩展 W1
- **背景**：5 国 union NationId 无法扩至 192 国，全连接外交 18336 条内存爆，192 国 AI 完整结算卡死。
- **决策**：6 项子决策全部落地——DEC-012 NationId→string、DEC-013 外交稀疏+getDefaultRelation、DEC-014 AI 三档结算、DEC-015 perf.ts 性能断言、DEC-016 内存预算。
- **影响**：typecheck + 33 测试全绿（含新增性能断言），架构可扛 192 国。
- **替代**：无（全部按规划执行）。

## DEC-018：W2 世界生成器完成（12 洲 / 192 国 / 600 省 / 24 文化 / 14 宗教）

- **阶段**：世界级扩展 W2
- **背景**：需要数据驱动的世界生成，手写 192 国不现实。
- **决策**：12 区域模板 `regions.ts` + 5 级国家模板 + `worldgen.ts` seeded 生成器 + 16 关键国手写覆盖。CultureId 扩至 24、ReligionId 扩至 14。
- **影响**：`generateWorld(seed)` 可产出 192 国 / 600 省 / 稀疏外交；7 个 worldgen 测试全绿；40 测试总计全绿。
- **替代**：手写 192 国（否决：不可维护）。

## DEC-019：大国经济/稳定度死亡螺旋修复

- **阶段**：W4 深度完善
- **背景**：S 级大国 50 回合后稳定度=0、粮食=-39434，游戏不可玩。
- **决策**：4 项修复——(1)粮食消耗率从 pop×0.5 降到 ×0.1；(2)超管惩罚限幅每回合最多-5稳定；(3)稳定度<30时+5/回合回归力；(4)`maxProvinces` 按 tier 给基础容量(S:50/A:25/B:12/C:6/D:3)。
- **影响**：205 国 50 回合后零问题国、零零稳定度国、所有 tier 平均稳定度>60。

## DEC-020：AI B/C 级轻量决策激活

- **阶段**：W4 深度完善
- **背景**：B/C 级 101 国完全被动，世界太静态（0 战争、0 贸易）。
- **决策**：`processAITurnLite` 加入简化决策——每5回合建农田/市场、每10回合建贸易条约。
- **影响**：B/C 级国家开始建设和贸易，世界更动态。

---

## DEC-021：v1 规划红线正式突破，v2 规划基线取代

- **阶段**：v2 规划（2026-06-24）
- **背景**：v1 `docs/00-project-plan.md` §11 红线写死"AI≤4 国 / 省份≤12 / 固定 10 省 / 不做随机地图"，但项目已实际扩到 205 国 / 597 省 / 12 洲 / seeded 随机世界（DEC-011/018）。v1 与现实严重脱节，硬保留会矛盾。
- **决策**：新建 `docs/00-project-plan-v2.md`（FROZEN v2）取代 v1 的"后续阶段指导"作用。v1 保留为历史决策记录不删。v2 §3 重立红线：永久 6 条（即时战斗/联机/美术/多语言/自定义国家/移植）+ 当前阶段 8 条（可 DEC 解锁）。
- **影响**：后续会话引用 v2 而非 v1；v1 §11 红线被 v2 §3.2 取代。v2 把剩余工作拆成三轨：A 修复 / B 文档闭环 / C 内容扩展。
- **替代**：强行回退到 5 国 10 省（否决：废弃大量已验证代码）；保留 v1 红线装作没突破（否决：文档撒谎）。

## DEC-022：PLAYER_ID 硬编码全量替换为 state.playerNationId（A1）

- **阶段**：v2 轨道 A1（2026-06-24）
- **背景**：P0 阻塞——`PLAYER_ID='n01'` 硬编码散布在 store + 13 个 screen + ai/init/turn 共 ~40 处，选非 n01 剧本即崩。`GameState.playerNationId` 字段已加但 UI 未接。
- **决策**：(1)13 个 screen 全部改 `state.nations[state.playerNationId]`，删 `import { PLAYER_ID }`；(2)store 的 ownership/army/relation 4 处改 `pid(s)`（helper 已存）；(3)`init.ts` 的 `buildProvinces` 改为接 `playerId: string` 参数，`createInitialState` 传 `PLAYER_ID`、`createWorldState` 传生成的 id；(4)ai.ts 的 `isPlayerNeighbor` 改 `state.playerNationId`；(5)**保留** `data/nations.ts` 的 `PLAYER_ID` 常量（5 国默认 + store fallback）、`init.ts` 默认值、`turn.ts` 的 `findPlayerId` fallback、`__validate__.ts`、`turn.test.ts`（测 5 国默认剧本）。
- **影响**：typecheck ✅ + 46/46 测试 ✅（含新增 A2 非 n01 剧本烟雾测试）。多剧本选国解锁。
- **替代**：全删 PLAYER_ID 常量（否决：破坏 5 国默认剧本与测试）；只改 UI 不改 init（否决：assimilation/loyalty 仍按 n01 算）。

## DEC-023：A 级稳定度分段回归力调参（A3）

- **阶段**：v2 轨道 A3（2026-06-24）
- **背景**：A 级大国稳定度长期 ~46，低于"可治理"阈值 50。根因：`politics.ts` v2 分段回归在 stab<55 时 +2.5、55-70 时只 +1，导致 A 级卡在 55 平衡点爬不上去。
- **决策**：v3 调参——stab<40 时 +5（v2 是 4）、<60 时 +3（v2 是 2.5，阈值 55→60）、<75 时 +1.5（v2 是 1，阈值 70→75）、≥75 时 -2 不变。
- **影响**：`scripts/world-audit.ts` 实测 20 回合后 A 级均稳定从 ~46 跃升到 **74.3**（目标 ≥50，远超）；S 级 86.7、B/C/D 均 ≥90；问题国 0。
- **替代**：只调 stab<55 的 +2.5→+3（否决：不够，55-70 段仍卡）；调公式本体 dStab（否决：影响所有 tier，难控）。

## DEC-024：AI 缺粮建农场提前触发 + D 级 Static 档食物兜底（A4/A5）

- **阶段**：v2 轨道 A4/A5（2026-06-24）
- **背景**：9 国负粮。A4：`planAITurn` 原只在 `food<0` 时强制建农场，太晚。A5：D 级 95 国走 `processAITurnStatic`，该函数原本只调稳定度，从不建农场，D 级极穷国永远负粮无法翻身。
- **决策**：A4——触发门槛从 `food<0` 提前到 `food < foodConsume*2`（2 年消耗即触发，与 economy.ts 消耗率 pop×0.1 一致）。A5——`processAITurnStatic` 加被动建农场：粮储低于 2 年消耗时，找最少农场的省份加一个农场（免金，模拟 D 级自给），上限 3 个/省。
- **影响**：`world-audit.ts` 实测负粮国从 9 降到 **1**；A5 加了专门测试（D 级压粮后 3 回合内建农场）通过。
- **替代**：给 D 级发基础收入补贴（否决：扭曲经济模型）；让 D 级也走 planAITurn（否决：性能爆，DEC-014 已定 D 档 Static）。

## DEC-025：v2 规划文档 + 轨道 A 全部完成

- **阶段**：v2 轨道 A 收尾（2026-06-24）
- **背景**：v2 §4 轨道 A（正确性修复）含 A1~A5 五步，目标是"选任意剧本任意国都能稳定跑 100 回合不崩"。
- **决策**：5 步全部完成——A1 PLAYER_ID 替换、A2 非 n01 烟雾测试、A3 稳定度调参、A4 AI 缺粮建农场、A5 D 级食物兜底。
- **影响**：typecheck ✅ + 46/46 测试 ✅ + world-audit 0 问题国 + A 级均稳定 74.3 + 负粮国 1。多剧本选国解锁，C4（更多剧本）的前提已满足。
- **替代**：无（全部按 v2 §4 执行）。

## DEC-026：E9 性能优化——关系索引 + 玩家邻国预算 + 局部省份索引 + 遍历合并

- **阶段**：v2 轨道 E9（2026-06-24）
- **背景**：192 国世界 50 回合性能基线 ~2245ms，热点集中在：①`state.relations.find` 15+ 处 O(n) 查找（1717 条关系）；②`processAITurn` 内 `isPlayerNeighbor` 对 191 国重复扫玩家省份；③`settleDiplomacy` 对每条 relation 扫 wars 两次 + 调 `provincesOf` 两次；④`turn.ts` AI 结算循环 192 国 × `provincesOf` 全省扫描 + 三次 `Object.values(nations)` 遍历；⑤`military.makePeace` 结算 atWar O(nations×wars)。
- **决策**：6 项优化——(1) `GameState._relMap: Map<from|to, DiplomaticRelation>` transient 索引（不序列化），`getRelationObj()` 替代全部 15 处 `.find`，init 时 `buildRelationMap()` 预建，存档加载懒重建；(2) `processAITurn` 预算 `playerNeighbors: Set<string>` 一次，`isPlayerNeighbor` O(1) 查询；(3) `settleDiplomacy` 预算局部 `provsByOwner` Map + `warOpponents` Set，消除内层扫描；(4) `turn.ts` AI 结算循环建局部 `provincesByOwner` Map + 合并三次 nations 遍历为一次（漂移+激活并入）；(5) `military.makePeace` 预算 `atWarNations` Set，O(1) 查询；(6) D 级 Static 档频率 5→10 回合（DEC-014 延续，95 国负载减半）。
- **教训**：`provincesOf` 全局 WeakMap 缓存方案被回滚——回合内军事占领改 `p.ownerId` 但 `provinces` 对象引用不变，缓存无法失效致 NaN。改用局部 transient 索引（函数内建、用完即弃）才安全。关系索引 `_relMap` 安全是因为运行时只 mutate 字段（treaty/relation/trust），不新增条目，Map 存对象引用不受字段 mutate 影响。
- **影响**：typecheck ✅ + 48/48 测试 ✅ + validate ✅（103 事件 0 错误）。50 回合性能从 **2245ms → 799ms（64% 提速）**，A2 测试 1985ms → 787ms（60%）。无回归、无数值变化。
- **替代**：provincesOf 全局缓存（否决：脏数据致 NaN，已回滚）；relations Array→Map 持久化（否决：破坏存档 schema，transient 已够）；不优化等 Godot 移植（否决：192 国世界当前就要跑顺）。

## DEC-027：B4 建筑拆除按钮接线（Phase B 收尾）

- **阶段**：v2 Phase B4（2026-06-25）
- **背景**：`gameStore.demolishBuilding` 引擎已实现，但 `ProvinceScreen` 无拆除按钮，玩家无法拆除多余建筑。
- **决策**：`ProvinceScreen.tsx` 解构 `demolishBuilding` + 每建筑行加拆除按钮调用 `demolishBuilding(provinceId, buildingId)`。
- **影响**：玩家可拆除建筑回收部分成本，违"改革可逆"宪法补强。
- **替代**：建筑不可拆（否决：玩家无纠错手段）。

## DEC-028：B5 停战提醒显示（Phase B 收尾）

- **阶段**：v2 Phase B5（2026-06-25）
- **背景**：停战期国家 UI 无剩余回合显示，玩家不知道何时可再宣战。
- **决策**：三处显示——`MilitaryScreen` 停战国不再过滤显示并标"X 回合后可宣"；`DiplomacyScreen` 关系 Tag 加剩余回合；`turn.ts` worldEvents 加停战到期通知（L209-221 检测 `truceTurns` 递减到 0 时推送）。
- **影响**：外交信息透明度提升，违"信息透明"宪法补强。
- **替代**：仅文字提示无回合数（否决：玩家需心算）。

## DEC-029：B8 政体反扑事件（Phase B 收尾）

- **阶段**：v2 Phase B8（2026-06-25）
- **背景**：`politics.ts:137` 切政体设 `govTransitionTurns=3` 标记，但无事件读取此字段，切政体无反弹感，违"改革有反弹"宪法。
- **决策**：`data/events.ts` 加 3 个反扑事件（`nobles_plot` 贵族逼宫 / `republican_push` 共和派推动 / `clergy_backlash` 神职反弹）；`EventTrigger` 加 `govTransitionActive?: boolean` 字段；`engine/events.ts checkTrigger` 检测该字段；`turn.ts` 每回合递减 `govTransitionTurns`。删 5 个预存重复事件 id（`evt_pop_migration`×2/`evt_opp_talent`/`evt_culture_patron`/`evt_culture_renaissance`），validate 从 5 错误→0。
- **影响**：切政体后 3 回合内可能触发反扑事件，改革有真实反弹。validate ✅ 203 事件 0 重复。
- **替代**：政体切换无惩罚（否决：违宪法第 2 原则"改革有反弹"）。

## DEC-030：C4 `as` 断言清理收尾（Phase C）

- **阶段**：v2 Phase C4（2026-06-25）
- **背景**：`govTransitionTurns` 用 `as Nation & {...}` 临时断言（3 处：`politics.ts`/`events.ts`/`turn.ts`），tsconfig strict:true 下可维护性差。
- **决策**：`Nation` 接口加正式字段 `govTransitionTurns?: number`；3 处 `as` 断言改直接访问。
- **影响**：typecheck ✅ + 89/89 测试 ✅。`as` 断言清理完成，C4 关闭。
- **替代**：保留 `as`（否决：strict 模式下应消除）。

## DEC-031：C3 引擎针对性测试扩充（Phase C）

- **阶段**：v2 Phase C3（2026-06-25）
- **背景**：engine-targeted 仅 11 个测试，economy/military/diplomacy 各引擎未达 ≥5 针对性，引擎回归无保障。
- **决策**：扩充 15 个针对性测试——diplomacy 3（间谍成功率/结盟门槛/影响力不足）、economy 2（禁运路线/科技税收）、politics 2（政策金不足/政体合法性不足）、military 2（调动相邻扣金/停战期宣战失败）、population 3（征兵抽阶层/征兵降满意度/settlePopulation 不抛异常）、events 3（minTurn/maxStability 门槛/rollEvents 上限）。过程中纠正 4 个测试代码错误：(1) enactPolicy 选无前置政策 `land_privilege`；(2) moveArmy 地图小所有己省相邻首都枢纽，改测正向相邻调动；(3) declareWar 引擎无同盟检查，改测停战期（引擎真有此检查）；(4) settlePopulation 签名 6 参数无 state。
- **影响**：测试 74→**89 个全绿**（typecheck ✅ + 5 文件 89 测试 13.5s）。economy 5 / politics 5 / military 5 / diplomacy 5 / population 3 / events 3，引擎回归有保障。C3 关闭。
- **替代**：仅加数量不针对边界（否决：G6 明确要 ≥5 针对性）。
- **教训**：第一次写测试时凭签名猜测，4 个失败。逐个读引擎实际逻辑（`settlePopulation` 6 参数、`declareWar` 无同盟检查、`moveArmy` 首都枢纽规则）才修对——印证 MASTER-PLAN "穷尽实读"教训，写测试也要先穷尽读引擎再下笔。

## DEC-032：D4 法律扩充至 20（Phase D）

- **阶段**：v2 Phase D4（2026-06-25）
- **背景**：`laws.ts` 仅 12 条法律（3 类各 4），法律选择太少，违"每局有新选择"目标。
- **决策**：+8 法律到 20——民法 +3（婚姻改革/契约执行/征收法，含与贵族特权互斥）、刑法 +2（狱政改革/边防管制，含与严刑峻法互斥）、行政法 +3（编户齐民/商团特许/宗教宽容，含与均税法/严刑峻法互斥）。每条含政体限制、前置科技、互斥、派系反应。
- **影响**：法律 12→20，玩家法律选择翻倍，互斥关系增加决策深度。typecheck ✅ + 89/89 测试 ✅ + validate ✅。
- **替代**：仅加数量不加互斥（否决：选择无深度）；加新法律类别（否决：3 类已覆盖民法/刑法/行政，无需扩）。

## DEC-033：D6 国家性格扩充至 15（Phase D）

- **阶段**：v2 Phase D6（2026-06-25）
- **背景**：`national-characters.ts` 仅 11 性格（含 balanced），D6 旧描述指定 +4（永恒文脉/海洋贸易国/中央集权帝国/革命共和国）但穷尽实读发现 maritime/centralization/revolutionary 已存在，旧描述与现状不符。
- **决策**：补 4 个**真正新**的性格而非照搬旧描述——`isolationist` 孤立主义（海禁锁国，稳定+12 但贸易-30%/科研-15%/外交-10）、`expansionist` 扩张主义（征兵+15%/动员+15% 但叛乱+25%/厌战+20%/行政-8）、`scholarly` 文治国家（科研+30%/同化+5/合法+3 但战力-15%/士气-10%/军方不满-10）、`mercantilist` 重商主义（囤金+20/贸易+15 但民生-15/人口-5%/稳定-5）。同步扩 `NationalCharacterId` type、`NationalTendency` interface、`buildTendency()`、`BEHAVIOR_MAPPINGS`（+6 行为映射：close_borders/annex_province/found_academy/hoard_gold/build_granary/censor_scholars）、叛军 tendency 字面量、formulas.test tendency 字面量。
- **影响**：性格 11→15，倾向维度 10→14，玩家长期行为可塑造更多国家形态。typecheck ✅ + 89/89 测试 ✅ + validate ✅。
- **教训**：D6 旧描述指定 +4 性格中 3 个已存在，照搬会重复。穷尽实读 `national-characters.ts` 现有 11 性格后选真正缺口——再次印证"不照搬旧规划，按现状补真缺口"。
- **替代**：照搬 D6 旧描述（否决：3 个已存在致重复）；加更多性格（否决：15 已足够丰富，过多难平衡）。

## DEC-034：D3 建筑扩充至 40（Phase D）

- **阶段**：v2 Phase D3（2026-06-25）
- **背景**：`buildings.ts` 仅 24 建筑（9 基础 + 11 B 扩展 + 4 P3 质变），玩家建设选择不足，违"每局有新选择"目标。
- **决策**：+16 建筑到 40——铁匠铺（产铁+装备）/漕运码头（平原贸易）/城墙加固（高级防御）/书院（科研+同化）/驿馆（行政+同化）/筒仓（粮储）/铸币工坊（金币）/药铺（防疫）/望楼（叛乱预警）/会馆（商人满意度）/军械库（装备）/观象台（科研+合法）/王家粮仓（高级储粮）/贸易站（边疆贸易）/修道院（神职+稳定）/水利工程（平原粮产翻倍，需农业 Lv3）。每建筑含前置科技（可选）、地形适配、上限、差异化产出。
- **影响**：建筑 24→40，玩家建设选择 +67%，地形适配增加策略深度。typecheck ✅ + 89/89 测试 ✅ + validate ✅（40 建筑 0 重复）。
- **替代**：仅加数量不加前置（否决：无科技门槛破坏科技树价值）；加新建筑类别（否决：现有 yield 字段已覆盖金/粮/木/铁/科研/行政/影响/补给，无需扩）。

## DEC-035：E3 键盘快捷键部分（Esc 关帮助 + [/] 切省）

- **阶段**：v2 Phase E3（2026-06-25）
- **背景**：现有快捷键仅 Space 推回合 + 1-9/0/m/c 切页 + EventModal 1/2/3 选选项。E3 验收要求 B 建设农田 / R 征兵 / T 调税 / Esc 关弹窗 / [/] 切省。
- **决策**：本回合做零风险的 Esc + [/] 两项——Esc 关帮助浮层（App.tsx onKey 加 Escape 分支，showHelp 为 true 时关闭）；[/] 切省（ProvinceScreen 加 useEffect 监听，[ 上一个 ] 下一个，循环切换）。B/R/T 因需 ProvinceScreen 深度改动 + 与现有点击操作联动留后。
- **影响**：帮助浮层可 Esc 关闭（原本仅点遮罩），省份页可快捷切省。typecheck ✅ + 89/89 测试 ✅。
- **替代**：全做 B/R/T（否决：需深度改 ProvinceScreen 与 build/recruit/tax 操作联动，风险高，留后）；不做 Esc（否决：帮助浮层仅能点遮罩关，键盘用户不便）。
- **教训**：E3 不是全做或全不做，按风险分层——零风险的先做，需深度改 UI 的留后。

## DEC-036：D5 剧本扩充至 10（Phase D）

- **阶段**：v2 Phase D5（2026-06-25）
- **背景**：`gameStore.ts` 仅 7 剧本（classic/world/eastasia/w3_eastasia/w5_mediterranean/w6_americas/w7_random），剧本选择不足，违"每局有新故事"目标。
- **决策**：+3 剧本到 10——`w4_europe` 欧洲封建（西欧/东欧/北欧/地中海 4 洲，法兰克/罗马/基辅罗斯/迦太基可选）、`w8_indianocean` 印度洋贸易（南亚/东非/中东/大洋洲 4 洲，孔雀/室利佛逝/埃及/波斯可选，海洋贸易国主题）、`challenge_survival` 生存挑战（全世界 205 国，玩家选 B 级边缘国对抗 S/A 霸主，硬核模式）。同步扩 ScenarioId type。
- **影响**：剧本 7→10，玩家可选场景 +43%，涵盖欧洲封建/印度洋贸易/硬核生存三种新体验。typecheck ✅ + 89/89 测试 ✅。
- **替代**：照搬 D5 旧描述的 w7_fantasy 奇幻（否决：需新数据集 supporting magic/fantasy，超 MVP 红线）；加更多区域剧本（否决：10 已足够，过多分散）。

## DEC-037：E6 主题扩充至 4 套（暗夜/象牙/竹简/水墨）

- **阶段**：v2 Phase E6（2026-06-25）
- **背景**：现有仅 night/day 两套主题（青铜铭文/象牙羊皮），E6 验收要求加竹简/青铜/水墨更多主题，全屏一致性。
- **决策**：主题 2→4——保留 night 暗夜烛火 + day 象牙羊皮，新增 bamboo 竹简青简（深竹青底 #1a2412 + 竹简米字 #e8e0c8 + 竹青金边 #a8b870）+ ink 水墨丹青（宣纸灰底 #e8e0d8 + 浓墨字 #2a241e + 浓墨边 #4a3a2a）。`toggleTheme` 改循环 4 主题（night→day→bamboo→ink）；index.css 加 2 套完整 CSS 变量含 bg/border/text/语义色/按钮渐变/shadow；App.tsx 按钮图标/title 适配（☾/☀/筠/墨）；ScenarioSelect 开场页主题切换同步循环 4 主题。
- **影响**：主题 2→4，玩家可选氛围 +100%，4 套主题全屏一致（CSS 变量驱动，所有组件自动适配）。typecheck ✅ + 89/89 测试 ✅。
- **替代**：仅加 1 套（否决：E6 明确要多主题）；加更多主题如青铜/朱砂（否决：4 套已足够覆盖暗/亮/竹/墨四种基调，过多难维护）。
- **教训**：主题用 CSS 变量驱动是关键——加新主题只需扩 `:root[data-theme]` 块，所有组件零改动自动适配，验证了早期 CSS 变量架构的正确性。

## DEC-038：E4 音效系统（Web Audio API 合成）

- **阶段**：v2 Phase E4（2026-06-25）
- **背景**：游戏无音效反馈，玩家操作缺感知，违"让游戏舒服"目标。E4 验收要求 Web Audio API 合成（钟声/战鼓/竹简/锤/警报）；无音频文件；可静音。
- **决策**：新建 `utils/audio.ts`——7 音效 SfxId（bell 钟声/scroll 竹简/drum 战鼓/hammer 锤/alarm 警报/victory 胜利/defeat 失败），用 OscillatorNode + GainNode envelope 合成（tone(freq,start,dur,type,gainPeak) 单音函数，各音效组合多音）。`playSfx(id)` 触发，`setMuted/isMuted` 控制，`useSfxMute()` React hook 给静音按钮。App.tsx 接入 3 useEffect：justProcessedTurn→bell、pendingEvents 新增→scroll、victory 变化→victory/defeat；header 加静音按钮（🔊/🔇）。
- **影响**：音效 0→7，玩家操作有听觉反馈，可静音。typecheck ✅ + 89/89 测试 ✅。无音频文件，零网络请求，零依赖。
- **替代**：用音频文件（否决：增包体积 + 网络请求）；接入更多触发点如建设/宣战（否决：需深度改各 Screen，留后）；用第三方音效库（否决：超 MVP 红线零依赖）。
- **教训**：Web Audio API 合成是零依赖音效的最佳方案——oscillator + gain envelope 即可合成钟/鼓/警报，无需音频文件。AudioContext 需用户交互后 resume（浏览器自动 suspend），getCtx() 处理了 suspended 状态。

## DEC-039：E2 统计图表页（纯 SVG 折线/雷达/条形）

- **阶段**：v2 Phase E2（2026-06-25）
- **背景**：玩家无直观趋势可视化，国库/粮/人口/稳定变化仅靠年报数字，违"让游戏舒服"目标。E2 验收要求国库/粮/人口/稳定 50 回合折线；派系满意度雷达；军力对比条形；科技甘特图。
- **决策**：新建 `StatsScreen.tsx`——纯 SVG 零依赖。LineChart 组件（W480×H140，零线+折线+数据点+轴标签）渲染 6 折线：国库净收入/粮食变化/人口变化/稳定度变化/不满度变化/厌战值，从 `state.history`（最近 10 回合 TurnReport）取数。派系满意度雷达（同心圆 20/40/60/80/100 + 多边形 + 顶点标签，从 `player.factions` 取数用 `FACTIONS[f.id].name` 转 label）。军力对比条形（玩家 vs 最强 3 AI，从 `nation.army.reduce` 取数）。科技进度甘特（4 分支 Lv 0-8 进度条）。App.tsx 加 'stats' Tab + 's' 快捷键 + 治理组渲染。
- **影响**：统计页 0→1，玩家可见 6 指标趋势 + 派系雷达 + 军力对比 + 科技进度，零依赖纯 SVG。typecheck ✅ + 89/89 测试 ✅。
- **教训**：Faction interface 无 name 字段只有 id，需通过 `FACTIONS[f.id].name` 转人类可读 label——印证"先穷尽读类型再写代码"，避免凭印象用 `.name`。
- **替代**：用图表库如 recharts（否决：超 MVP 红线零依赖）；仅折线无雷达/条形/甘特（否决：E2 验收明确要 4 种图表）；从 history 之外取数（否决：history 已是最近 10 回合快照，足够画趋势）。

## DEC-040：E1 新手教程（5 步分步 + 首次自动 + 可跳过可重看）

- **阶段**：v2 Phase E1（2026-06-25）
- **背景**：现有"治国引导卡"是单页 6 要点静态展示，新手无分步引导，违"新手 30 分钟理解"目标。E1 验收要求首次进入 5 步教程（总览/税率/建设/下一回合/报告）；tooltip+遮罩；可跳过可重看。
- **决策**：改造 App.tsx 现有 showHelp 引导卡为 5 步分步教程——`tutorialStep` state（0-4 五步，-1 已关闭）；首次进入 useEffect 检测 `localStorage.ia-tutorial-done` 未设则自动弹出；5 步内容：①总览警报 ②调税率 ③建设省份 ④派系与科技 ⑤推回合；进度点指示器；跳过/上一步/下一步/开始治国按钮；完成或跳过写 localStorage 标记；点「？」重看从头开始（setTutorialStep(0)）。
- **影响**：新手教程 0→5 步分步，首次自动弹出，可跳过可重看。typecheck ✅ + 89/89 测试 ✅。
- **替代**：新建独立 Tutorial 组件（否决：改造现有引导卡更简洁，避免新文件）；加 tooltip 遮罩高亮特定 UI 元素（否决：需复杂 DOM 定位，MVP 级分步文字足够）；更多步骤（否决：5 步已覆盖核心循环，过多新手疲劳）。
- **教训**：改造现有组件优于新建——showHelp 引导卡已有遮罩+弹窗结构，只需加 step state 即可变分步教程，零新文件。

## DEC-041：F3 Godot 移植可行性报告

- **阶段**：v2 Phase F3（2026-06-25）
- **背景**：玩法成熟后需 Godot 移植做 2D 美术/动画/复杂 UI，F3 验收要求评估移植路径输出 `docs/12-godot-migration.md`。
- **决策**：输出 F3 报告基于 v2.2 架构实读评估——引擎层 6700 行（engine+data+types+utils）移植友好纯函数可转 GDScript，UI 层 3300 行需重写。4 阶段路径：A 数据中立化 8h → B 引擎转 GDScript 24h → C UI 重写 40h → D 增强导出 16h，总 ~88h。移植硬依赖 F2+C1，建议 2026 Q4 Phase D/E 完成后启动。
- **影响**：移植路径明确，避免盲目启动。移植门槛 5 项仅 1 项满足（M1 门已过），需 F2/C1/M4 门 + 本报告评审。
- **替代**：继续 React 加 PixiJS（否决：上限显现）；Unity 移植（否决：2D 不如 Godot 轻量 + 授权成本）；Web Godot（否决：已是 Web 无优势）。
- **教训**：移植报告基于实读架构比例（58% 引擎友好 / 29% UI 重写）而非空泛推测，引擎层友好度是核心依据。

## DEC-042：F1 引擎/UI 完全分离审计

- **阶段**：v2 Phase F1（2026-06-25）
- **背景**：F1 验收要求引擎零 React 依赖、零 DOM 依赖、可独立打包为 `imperium-engine` npm 包。需穷尽实读确认。
- **决策**：输出 `docs/13-engine-ui-separation-audit.md`——穷尽实读 15 引擎文件 + 13 数据文件搜索 `react`/`react-dom`/`document`/`window`/`localStorage`/`store`/`components`/`screens`/`App`/`console` 依赖标志。结果：引擎层 3578 行零 React/DOM/UI 反向依赖，导出完整（processTurn/settleEconomy 等 25+ 核心函数全 export），可独立打包。数据/类型/工具层同样独立（utils/audio.ts 用 React hook 但非 engine 不影响）。
- **影响**：F1 验收通过，引擎可独立打包为 npm 包。唯一非 F1 范畴缺口是 C1 mutate 模式（引擎 mutate 入参 nation 引用），不影响独立打包，是 C1 独立优化目标。
- **教训**：穷尽实读搜索依赖标志而非凭印象——15 文件逐一 grep 确认零反向依赖，比抽样可靠。
- **替代**：仅抽样几文件（否决：穷尽实读才可靠）；改 mutate 模式为纯函数（否决：那是 C1 范畴非 F1）。

## DEC-043：D2 科技质变效果（4 政策 + 2 建筑绑定 Lv5/Lv8 解锁）

- **阶段**：v2 Phase D2（2026-06-25）
- **背景**：科技 Lv1-8 仅线性 effects（agriYieldMod/combatMod 等），无"质变节点"让高级科技解锁新能力，违"科技树有质变"目标。穷尽实读发现 Policy/Building 已有 prereqTech 字段且 enactPolicy/build 检测前置科技——D2 真缺口是加绑定 Lv5/Lv8 的新政策/建筑作为质变节点。
- **决策**：+4 质变政策绑定 Lv5 科技——crop_rotation 轮作（agri_lv5，粮产+15%）/total_mobilization 总动员（mil_lv5，征兵×2）/civil_service_reform 科举改革（admin_lv5，腐败-10）/cultural_export 文化输出（culture_lv5，影响力+25%）；+2 质变建筑绑定 Lv8 科技——fertilizer_plant 化肥厂（agri_lv8，粮产×1.5）/mobilization_camp 总动员营（mil_lv8，征兵×2）。同步扩 PolicyId type + BuildingId type。
- **影响**：政策 25→29，建筑 40→42，高级科技有质变解锁。typecheck ✅ + 89/89 测试 ✅ + validate ✅（42 建筑 29 政策 0 重复）。
- **教训**：穷尽实读发现 prereqTech 机制已存在——D2 不是加 unlock 引擎改动，而是加数据利用现有机制，避免过度工程。
- **替代**：加 unlock 引擎新机制（否决：prereqTech 已存在，过度工程）；加更多质变（否决：6 个已覆盖 4 分支 Lv5/Lv8，足够）。

## DEC-044：F2 数据格式中立化（12 数据表导出 JSON）

- **阶段**：v2 Phase F2（2026-06-25）
- **背景**：F2 验收要求所有数据表可导出为 JSON，为 Godot/Unity 读 JSON 铺路。引擎深度依赖 data/*.ts 静态 import，真改运行时加载是 XL 改动。
- **决策**：新建 `scripts/export-data.ts` 导出 12 数据表（nations/provinces/buildings/events/technologies/policies/laws/governments/national-characters/factions/trade-routes/regions）为 JSON 到 `dist/data/`。加 `npm run export-data`。运行验证：12 JSON 生成（events 157KB 最大），可被 Godot/Unity 直接读取。不改引擎 import（移植时再改运行时加载）。
- **影响**：数据格式中立化 ✅，12 JSON 可被任意语言读取，为移植铺路。typecheck ✅ + 89/89 测试 ✅（纯新增脚本零回归）。
- **替代**：改引擎运行时 JSON 加载（否决：XL 改动破坏现有测试）；仅导出部分表（否决：F2 验收要所有数据表）。

## DEC-045：首局实战引导（行动任务 + 自动里程碑）

- **阶段**：新手体验完善（2026-07-22）
- **背景**：原有分步弹窗能解释概念，但关闭后不再陪伴玩家，玩家仍不知道第一局应该实际点击什么，也无法确认自己是否完成了核心循环。
- **决策**：保留概念说明作为可重看的入口，新增独立的 `noviceJourney` 纯状态机和常驻教练面板。6 个任务依次覆盖总览、经济、省份、存档、推进与年报；页面理解由玩家确认，存档、回合与年报由游戏状态自动校验。进度使用独立版本化本地键持久化，旧教程完成标记只用于避免打扰既有玩家。
- **影响**：新玩家获得“做什么、为什么、完成条件”三层信息；引导可收起、结束、重开，并在桌面与移动端保持可用。逻辑与 React 组件分离，可单测且便于以后扩展成情境任务。
- **替代**：只扩写静态教程（否决：仍缺实际操作反馈）；强制遮罩逐控件点击（否决：容易阻塞正常玩法且对响应式布局脆弱）；把状态塞进 `App.tsx`（否决：难测试、难演进）。

