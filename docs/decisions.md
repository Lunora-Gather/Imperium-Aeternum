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

